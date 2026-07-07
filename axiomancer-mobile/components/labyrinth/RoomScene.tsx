/**
 * The Aporia — room scene (W-01 UI spec, DESIGN.md section 7).
 *
 * One authored scene per room in the 1985 MAZE book's spirit:
 * black-ink-on-parchment, 2-5 door POIs wearing the DESTINATION's
 * display number on plaques, 2-6 object POIs standing in the room.
 * Procedural SVG placeholder art per the existing placeholder system
 * (SVG_ASSET_SPEC.md); a hand-drawn scene can replace the backdrop
 * per-room via `assets/images/labyrinth` without touching the POI
 * layer.
 *
 * Door visibility is engine truth (`visibleDoors` upstream) — the
 * scene renders exactly the doors it is given; unrevealed secret
 * doors are simply absent. Uninspected object POIs pulsate gently so
 * the walker knows the room can be questioned.
 */

import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Image } from 'expo-image';

import { LABYRINTH_SCENE_BACKDROPS } from '@/assets/images/labyrinth';
import type { LabyrinthDoorVM, LabyrinthPoiVM } from '@/state/presenters/labyrinth.engine';
import { FONTS, rnd } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

interface RoomSceneProps {
    nodeId: string;
    display: string;
    doors: readonly LabyrinthDoorVM[];
    pois: readonly LabyrinthPoiVM[];
    sealedLabel: string;
    onDoorPress: (to: string) => void;
    onPoiPress: (poiId: string) => void;
}

/** Deterministic per-room seed so a scene never rearranges itself. */
function sceneSeed(nodeId: string): number {
    let h = 0;
    for (let i = 0; i < nodeId.length; i += 1) h = (h * 31 + nodeId.charCodeAt(i)) % 9973;
    return h + 1;
}

/** A pulsating (until inspected) object POI — the clickable clue node. */
function PoiNode({
    poi,
    left,
    top,
    onPress,
}: {
    poi: LabyrinthPoiVM;
    left: number;
    top: number;
    onPress: () => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const pulse = useSharedValue(1);

    useEffect(() => {
        if (!poi.inspected) {
            pulse.value = withRepeat(
                withSequence(
                    withTiming(1.12, { duration: 950 }),
                    withTiming(0.94, { duration: 950 }),
                ),
                -1,
            );
        } else {
            pulse.value = withTiming(1, { duration: 200 });
        }
    }, [poi.inspected, pulse]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: poi.inspected ? 0.55 : 0.75 + (pulse.value - 0.94) * 1.2,
    }));

    return (
        <Pressable
            onPress={onPress}
            style={[styles.poiWrap, { left: `${left}%`, top: `${top}%` }]}
            testID={`labyrinth-poi-${poi.id}`}
            accessibilityLabel={poi.label}
        >
            <Animated.View style={[styles.poiDot, pulseStyle, poi.inspected && { borderColor: AXM.ash }]}>
                <View style={[styles.poiCore, poi.inspected && { backgroundColor: AXM.ash }]} />
            </Animated.View>
            <Text style={[styles.poiLabel, poi.inspected && { color: AXM.ash }]} numberOfLines={2}>
                {poi.label}
            </Text>
        </Pressable>
    );
}

export function RoomScene({
    nodeId,
    display,
    doors,
    pois,
    sealedLabel,
    onDoorPress,
    onPoiPress,
}: RoomSceneProps) {
    const AXM = usePalette();
    const styles = useStyles();
    const seed = sceneSeed(nodeId);
    const backdrop = LABYRINTH_SCENE_BACKDROPS[nodeId] ?? null;

    // Doors spread along the back wall; positions in scene percent.
    const doorSlots = doors.map((door, i) => ({
        door,
        left: doors.length === 1 ? 50 : 14 + (i * 72) / (doors.length - 1),
    }));

    // Object POIs stand in the floor band: evenly spread with alternating
    // rows and a little deterministic jitter, so labels never pile up.
    const poiSlots = pois.map((poi, i) => ({
        poi,
        left: pois.length === 1 ? 50 : 12 + (i * 76) / (pois.length - 1),
        top: 58 + (i % 2) * 17 + Math.floor(rnd(i + 11, seed) * 7),
    }));

    return (
        <View style={styles.canvas} testID="labyrinth-room-scene">
            {/* ── Backdrop: authored art when present, procedural ink otherwise ── */}
            {backdrop ? (
                <Image source={backdrop} style={styles.backdrop} contentFit="cover" />
            ) : (
                <Svg
                    viewBox="0 0 360 240"
                    style={styles.backdrop}
                    preserveAspectRatio="xMidYMid slice"
                    pointerEvents="none"
                >
                    {/* Parchment field */}
                    <Rect x={0} y={0} width={360} height={240} fill={AXM.parchment} />
                    {/* Ink vignette frame */}
                    <Rect x={4} y={4} width={352} height={232} fill="none" stroke={AXM.bg} strokeWidth={3} />
                    {/* Back wall + floor line */}
                    <Line x1={0} y1={132} x2={360} y2={132} stroke={AXM.bg} strokeWidth={1.5} />
                    <Path d="M0 240 L48 132 M360 240 L312 132" stroke={AXM.bg} strokeWidth={1} opacity={0.6} />
                    {/* Cross-hatch ceiling shade */}
                    {Array.from({ length: 14 }, (_, i) => (
                        <Line
                            key={`h${i}`}
                            x1={i * 28 - 20}
                            y1={0}
                            x2={i * 28 + 20}
                            y2={30 + rnd(i, seed) * 14}
                            stroke={AXM.bg}
                            strokeWidth={0.7}
                            opacity={0.35}
                        />
                    ))}
                    {/* Floorboard strokes */}
                    {Array.from({ length: 6 }, (_, i) => (
                        <Line
                            key={`f${i}`}
                            x1={20 + rnd(i + 40, seed) * 40}
                            y1={150 + i * 15}
                            x2={340 - rnd(i + 50, seed) * 40}
                            y2={150 + i * 15}
                            stroke={AXM.bg}
                            strokeWidth={0.6}
                            opacity={0.3}
                        />
                    ))}
                    {/* A little deterministic room dressing */}
                    <Circle
                        cx={40 + rnd(7, seed) * 280}
                        cy={200 + rnd(8, seed) * 24}
                        r={3 + rnd(9, seed) * 5}
                        fill="none"
                        stroke={AXM.bg}
                        strokeWidth={1}
                        opacity={0.5}
                    />
                </Svg>
            )}

            {/* ── Room display number (the book's corner numeral) ── */}
            <View style={styles.displayBadge} pointerEvents="none">
                <Text style={styles.displayText}>{display}</Text>
            </View>

            {/* ── Door POIs on the back wall ── */}
            {doorSlots.map(({ door, left }) => (
                <Pressable
                    key={door.to}
                    onPress={() => onDoorPress(door.to)}
                    style={[styles.doorWrap, { left: `${left}%` }]}
                    testID={`labyrinth-door-${door.to}`}
                    accessibilityLabel={`Door ${door.display}${door.gated ? `, ${sealedLabel}` : ''}`}
                >
                    <View style={styles.plaque}>
                        <Text style={styles.plaqueText}>{door.display}</Text>
                    </View>
                    <View style={[styles.doorArch, door.gated && styles.doorArchGated]}>
                        <View style={styles.doorPanel} />
                        {door.gated && <Text style={styles.sealedText}>{sealedLabel}</Text>}
                    </View>
                </Pressable>
            ))}

            {/* ── Object POIs (the clue nodes) ── */}
            {poiSlots.map(({ poi, left, top }) => (
                <PoiNode
                    key={poi.id}
                    poi={poi}
                    left={left}
                    top={top}
                    onPress={() => onPoiPress(poi.id)}
                />
            ))}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    canvas: {
        width: '100%',
        aspectRatio: 3 / 2,
        backgroundColor: AXM.parchment,
        borderWidth: 2,
        borderColor: AXM.ash,
        overflow: 'hidden',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    displayBadge: {
        position: 'absolute',
        right: 8,
        bottom: 8,
        borderWidth: 1.5,
        borderColor: AXM.bg,
        backgroundColor: AXM.parchment,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    displayText: {
        fontFamily: FONTS.gothic,
        fontSize: 18,
        color: AXM.bg,
    },
    doorWrap: {
        position: 'absolute',
        top: '12%',
        width: 52,
        marginLeft: -26,
        alignItems: 'center',
    },
    plaque: {
        backgroundColor: AXM.bg,
        paddingHorizontal: 6,
        paddingVertical: 1,
        marginBottom: 3,
    },
    plaqueText: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 1,
        color: AXM.parchment,
    },
    doorArch: {
        width: 44,
        height: 62,
        borderWidth: 2,
        borderColor: AXM.bg,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        alignItems: 'center',
        justifyContent: 'flex-end',
        backgroundColor: AXM.parchment,
    },
    doorArchGated: {
        opacity: 0.75,
    },
    doorPanel: {
        width: 30,
        height: 46,
        borderWidth: 1,
        borderColor: AXM.bg,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        backgroundColor: AXM.shadow,
        opacity: 0.85,
    },
    sealedText: {
        position: 'absolute',
        bottom: 20,
        fontFamily: FONTS.sans,
        fontSize: 8,
        letterSpacing: 1,
        color: AXM.blood,
        backgroundColor: AXM.parchment,
        paddingHorizontal: 2,
    },
    poiWrap: {
        position: 'absolute',
        width: 64,
        marginLeft: -32,
        alignItems: 'center',
    },
    poiDot: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: AXM.rust,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AXM.parchment,
    },
    poiCore: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: AXM.rust,
    },
    poiLabel: {
        marginTop: 2,
        fontFamily: FONTS.serif,
        fontSize: 9,
        lineHeight: 11,
        textAlign: 'center',
        color: AXM.bg,
        backgroundColor: AXM.parchment,
        paddingHorizontal: 2,
    },
}));
