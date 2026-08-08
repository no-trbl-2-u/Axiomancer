import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Image } from 'expo-image';
import { makeStyles, usePalette } from '@/theme/runtime';
import { Splatter } from '@/components/Splatter';
import type { ExplorationNode, ExplorationEdge } from '@/state/presenters/exploration.engine';

interface MapCanvasProps {
    nodes: readonly ExplorationNode[];
    edges: readonly ExplorationEdge[];
    /** Engraving plate rendered dimmed under the chart (see assets/images/maps). */
    backdrop?: number | null;
    children: React.ReactNode;
}

// The engine packs node coordinates into a 360×400 space; rendered 1:1
// the nodes overlap and labels collide. We spread them across a larger
// pannable canvas (SPREAD×) so each node has breathing room — the window
// clips to a viewport the user pans/zooms around. (Visual-audit 2026-06.)
const SPREAD = 2.6;
const CANVAS_W = 360 * SPREAD;
const CANVAS_H = 400 * SPREAD;

// Phase V1/V2 (the Woodcut Codex) — the map reads as a chart, not a
// void: a faint diagonal hatch over the whole sheet (the handoff's
// `.axm-hatch` texture, redrawn as strokes so no Pattern support is
// needed), cartographic contour "hills" in the dead zones, a
// viewport-fixed compass rose, and an edge vignette. All tokenized;
// swapped for real backdrop art at Phase V5 (procedural stays as the
// fallback).
const HATCH_STEP = 18;
const HATCH_LINES: readonly string[] = (() => {
    const lines: string[] = [];
    // 45° lines across the 360×400 sheet: sweep the x-intercept from
    // -400 (line entering from the left edge) to 360.
    for (let x0 = -400; x0 <= 360; x0 += HATCH_STEP) {
        lines.push(`M ${x0} 0 L ${x0 + 400} 400`);
    }
    return lines;
})();

/** Nested contour rings — hand-authored cartographic hills. */
const CONTOUR_GROUPS: readonly string[][] = [
    [
        'M40 250 q 20 -22 44 -10 q 12 14 -10 20 q -26 4 -34 -10 z',
        'M50 252 q 14 -14 28 -6 q 8 9 -7 13 q -16 3 -21 -7 z',
    ],
    [
        'M250 280 q 30 -22 62 -6 q 10 20 -20 24 q -40 -2 -42 -18 z',
        'M262 282 q 20 -13 40 -4 q 6 12 -13 15 q -25 -1 -27 -11 z',
    ],
    [
        'M282 74 q 18 -16 38 -6 q 8 12 -12 16 q -22 2 -26 -10 z',
    ],
];

export function MapCanvas({ nodes, edges, backdrop, children }: MapCanvasProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const nodeById = React.useMemo(() => {
        const m = new Map<string, ExplorationNode>();
        for (const n of nodes) m.set(n.id, n);
        return m;
    }, [nodes]);

    // Pinch + pan over the map view (Q2=B). Reanimated shared values
    // drive a single transform; gestures compose simultaneously so the
    // user can zoom and drag at once.
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const savedTx = useSharedValue(0);
    const savedTy = useSharedValue(0);

    // Open the map framed on the nodes the player can actually act on
    // right now — the current position plus its available next steps —
    // rather than the geometric middle of the (much larger) spread
    // canvas. We measure the viewport on layout, then centre once both
    // the viewport and the node set are available.
    const initialized = React.useRef(false);
    const [viewport, setViewport] = React.useState<{ w: number; h: number } | null>(null);
    const onWrapLayout = React.useCallback(
        (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
            const { width, height } = e.nativeEvent.layout;
            if (width === 0) return;
            setViewport((prev) => prev ?? { w: width, h: height });
        },
        [],
    );

    React.useEffect(() => {
        if (initialized.current || !viewport || nodes.length === 0) return;
        // The choosable nodes: where the player stands + the steps they
        // can take from here. Fall back to the canvas centre if (somehow)
        // none are flagged.
        const focus = nodes.filter((n) => n.kind === 'available' || n.kind === 'current');
        let cx: number;
        let cy: number;
        if (focus.length > 0) {
            const ax = focus.reduce((s, n) => s + n.x, 0) / focus.length;
            const ay = focus.reduce((s, n) => s + n.y, 0) / focus.length;
            // Node canvas coords = engine coords × SPREAD; initial scale
            // is 1, so placing the centroid at the viewport centre is a
            // straight translate.
            cx = viewport.w / 2 - ax * SPREAD;
            cy = viewport.h / 2 - ay * SPREAD;
        } else {
            cx = (viewport.w - CANVAS_W) / 2;
            cy = (viewport.h - CANVAS_H) / 2;
        }
        tx.value = cx;
        ty.value = cy;
        savedTx.value = cx;
        savedTy.value = cy;
        initialized.current = true;
    }, [viewport, nodes, tx, ty, savedTx, savedTy]);

    const pinch = Gesture.Pinch()
        .onUpdate((e) => {
            const next = savedScale.value * e.scale;
            scale.value = Math.min(3, Math.max(0.6, next));
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    const pan = Gesture.Pan()
        .onUpdate((e) => {
            tx.value = savedTx.value + e.translationX;
            ty.value = savedTy.value + e.translationY;
        })
        .onEnd(() => {
            savedTx.value = tx.value;
            savedTy.value = ty.value;
        });

    const composed = Gesture.Simultaneous(pinch, pan);

    const mapTransform = useAnimatedStyle(() => ({
        transform: [
            { translateX: tx.value },
            { translateY: ty.value },
            { scale: scale.value },
        ],
    }));

    return (
        <View style={styles.graphWrap} onLayout={onWrapLayout} testID="map-canvas-wrapper">
            <View style={[StyleSheet.absoluteFillObject, styles.graphBackground]} />
            <Splatter color={AXM.blood} size={170} seed={3} style={styles.bloodSplatter} />
            <Splatter color={AXM.sulfur} size={130} seed={9} style={styles.sulfurSplatter} />

            <GestureDetector gesture={composed}>
                <Animated.View style={[styles.canvas, mapTransform]}>
                    {/* The engraving plate — pans and zooms with the chart so the
                        wood feels painted onto the page, dimmed so roads and
                        nodes keep contrast (dim, never blur). */}
                    {backdrop != null && (
                        <Image
                            source={backdrop}
                            style={styles.backdropPlate}
                            contentFit="cover"
                            testID="map-backdrop"
                        />
                    )}
                    {/* SVG edges — drawn across the spread canvas */}
                    <Svg viewBox="0 0 360 400" width={CANVAS_W} height={CANVAS_H} style={StyleSheet.absoluteFillObject}>
                        {/* The chart sheet: diagonal hatch + contour hills under the roads */}
                        <G stroke={AXM.parchment} strokeWidth={0.4} opacity={0.05}>
                            {HATCH_LINES.map((d) => (
                                <Path key={d} d={d} fill="none" />
                            ))}
                        </G>
                        {CONTOUR_GROUPS.map((group, gi) => (
                            <G key={gi} opacity={0.45} stroke={AXM.ash} strokeWidth={1} fill="none">
                                {group.map((d) => (
                                    <Path key={d} d={d} />
                                ))}
                            </G>
                        ))}
                        {edges.map((e) => {
                            const A = nodeById.get(e.fromId);
                            const B = nodeById.get(e.toId);
                            if (!A || !B) return null;
                            // Straight node-to-node paths so the graph reads as
                            // a connected route. A dark casing under the stroke
                            // gives each path a defined "road" edge.
                            const d = `M ${A.x} ${A.y} L ${B.x} ${B.y}`;
                            const color = e.traveled ? AXM.parchment : (e.locked ? AXM.ash : AXM.bone);
                            const w = e.traveled ? 3.5 : (e.locked ? 2 : 2.5);
                            const mx = (A.x + B.x) / 2;
                            const my = (A.y + B.y) / 2;
                            return (
                                <G key={`${e.fromId}|${e.toId}`}>
                                    <Path d={d} stroke={AXM.deepBg} strokeWidth={w + 3} fill="none" opacity={0.95} strokeLinecap="round" />
                                    <Path
                                        d={d}
                                        stroke={color}
                                        strokeWidth={w}
                                        strokeDasharray={e.locked ? '5 5' : undefined}
                                        fill="none"
                                        opacity={e.traveled ? 0.95 : 0.7}
                                        strokeLinecap="round"
                                    />
                                    {e.traveled && <Circle cx={mx} cy={my} r={2.5} fill={AXM.sulfur} />}
                                </G>
                            );
                        })}
                    </Svg>

                    {children}
                </Animated.View>
            </GestureDetector>

            {/* Viewport-fixed chart furniture — never pans with the map */}
            <Svg
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
                testID="map-vignette"
            >
                <Defs>
                    <RadialGradient id="axmMapVignette" cx="50%" cy="50%" rx="72%" ry="66%">
                        <Stop offset="55%" stopColor={AXM.deepBg} stopOpacity={0} />
                        <Stop offset="100%" stopColor={AXM.deepBg} stopOpacity={0.6} />
                    </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#axmMapVignette)" />
            </Svg>
            <Svg
                width={52}
                height={52}
                viewBox="0 0 52 52"
                style={styles.compassRose}
                pointerEvents="none"
                accessibilityRole="image"
                accessibilityLabel="Compass rose"
                testID="map-compass"
            >
                <Circle cx={26} cy={26} r={21} stroke={AXM.bone} strokeWidth={1} fill="none" opacity={0.45} />
                <Circle cx={26} cy={26} r={16} stroke={AXM.bone} strokeWidth={0.6} fill="none" opacity={0.3} strokeDasharray="2 4" />
                <Path d="M6 26 H16 M36 26 H46 M26 36 V46" stroke={AXM.bone} strokeWidth={1} opacity={0.4} />
                <Path d="M26 6 L29 26 L26 32 L23 26 Z" fill={AXM.blood} opacity={0.75} />
                <Path d="M26 46 L29 26 L23 26 Z" fill={AXM.bone} opacity={0.5} />
                <Circle cx={26} cy={26} r={2} fill={AXM.parchment} opacity={0.7} />
            </Svg>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    graphWrap: {
        marginHorizontal: 10,
        marginVertical: 6,
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    canvas: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: CANVAS_W,
        height: CANVAS_H,
    },
    graphBackground: {
        backgroundColor: AXM.deepBg,
    },
    bloodSplatter: {
        position: 'absolute',
        top: -10,
        right: -10,
        opacity: 0.35,
    },
    sulfurSplatter: {
        position: 'absolute',
        bottom: 30,
        left: -20,
        opacity: 0.18,
    },
    compassRose: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        opacity: 0.85,
    },
    backdropPlate: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.2,
    },
}));