/**
 * Quest board track — the loop of spaces drawn as a ring around the
 * board's center well. Pure presentation: renders `QuestSpaceVM[]`
 * and the piece marker; the center well is a slot for the roll
 * control and parts ledger.
 *
 * Geometry: spaces walk the perimeter of a near-square grid clockwise
 * from the top-left (index 0 = the slipway). 16 spaces → a 5×5 ring.
 *
 * The track also renders two bits of landing choreography fed by
 * `useQuestLanding`: the destination/route preview while the piece
 * walks (U1), and a kind-coloured flash on the cell it lands on (U2).
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import type { QuestSpaceVM } from '@/state/presenters/quest.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

/** Grid cells (col,row) walking the w×h perimeter clockwise from (0,0). */
export function perimeterCells(w: number, h: number): { col: number; row: number }[] {
    const cells: { col: number; row: number }[] = [];
    for (let col = 0; col < w; col++) cells.push({ col, row: 0 });
    for (let row = 1; row < h - 1; row++) cells.push({ col: w - 1, row });
    for (let col = w - 1; col >= 0; col--) cells.push({ col, row: h - 1 });
    for (let row = h - 2; row >= 1; row--) cells.push({ col: 0, row });
    return cells;
}

/** Smallest near-square ring that seats `count` spaces. */
export function ringDimensions(count: number): { w: number; h: number } {
    let w = Math.max(3, Math.ceil((count + 4) / 4));
    let h = w;
    while (2 * (w + h) - 4 < count) w += 1;
    return { w, h };
}

export function questKindAccents(AXM: ReturnType<typeof usePalette>): Record<string, string> {
    return {
        slipway: AXM.sulfur,
        gather: AXM.bone,
        duel: AXM.blood,
        snag: AXM.rust,
        hearth: AXM.heal,
        market: AXM.parchment,
        parley: AXM.parchment,
        cache: AXM.sulfur,
        omen: AXM.sulfur,
    };
}

interface QuestSpaceCellProps {
    space: QuestSpaceVM;
    left: number;
    top: number;
    size: number;
    accent: string;
    hasPiece: boolean;
    isTarget: boolean;
    isPath: boolean;
    /** Bumps when a piece lands; triggers the flourish if this is the cell. */
    arrivalKey: number;
}

function QuestSpaceCell({
    space, left, top, size, accent, hasPiece, isTarget, isPath, arrivalKey,
}: QuestSpaceCellProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const glow = useSharedValue(0);
    const pop = useSharedValue(1);

    // Flash + pop when the piece lands on this cell (U2). Skips key 0 so
    // the board doesn't flash on first mount.
    useEffect(() => {
        if (!hasPiece || arrivalKey === 0) return;
        glow.value = withSequence(withTiming(1, { duration: 110 }), withTiming(0, { duration: 440 }));
        pop.value = withSequence(withTiming(1.35, { duration: 110 }), withTiming(1, { duration: 320 }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [arrivalKey]);

    const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
    const glyphStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

    const borderColor = hasPiece
        ? AXM.sulfur
        : isTarget
          ? AXM.sulfur
          : isPath
            ? AXM.bone
            : AXM.ash;
    const backgroundColor = hasPiece ? AXM.selectFill : AXM.panelBg;

    return (
        <View
            accessibilityLabel={`${space.name}${hasPiece ? ', the piece stands here' : isTarget ? ', the piece is bound here' : ''}`}
            style={[
                styles.space,
                {
                    left,
                    top,
                    width: size,
                    height: size,
                    borderColor,
                    borderWidth: isTarget && !hasPiece ? 2 : 1,
                    backgroundColor,
                },
            ]}
            testID={`quest-space-${space.index}`}
        >
            {/* Kind-coloured arrival flash overlay (U2). */}
            <Animated.View
                pointerEvents="none"
                style={[styles.glow, { backgroundColor: accent }, glowStyle]}
                testID={`quest-space-glow-${space.index}`}
            />
            <Animated.Text style={[styles.glyph, { color: accent }, glyphStyle]}>
                {space.glyph}
            </Animated.Text>
            {hasPiece && (
                <Text style={styles.piece} testID="quest-piece">
                    ◆
                </Text>
            )}
            {isTarget && !hasPiece && (
                <Text style={styles.flag} testID={`quest-target-${space.index}`}>
                    ⚑
                </Text>
            )}
        </View>
    );
}

export interface QuestBoardTrackProps {
    spaces: readonly QuestSpaceVM[];
    /** Width available; the track renders a square of this size. */
    size: number;
    /**
     * Index the piece is *shown* at. Overrides each space's baked
     * `isPiece` so the landing choreography can walk the piece a space
     * at a time. Falls back to the VM's own marker when omitted.
     */
    pieceIndex?: number;
    /** Destination the piece is bound for this cast — drawn with a flag (U1). */
    targetIndex?: number | null;
    /** Route spaces to the destination — drawn with a brighter border (U1). */
    pathIndices?: readonly number[];
    /** Bumps each landing; the destination cell flashes its kind colour (U2). */
    arrivalKey?: number;
    /** Rendered inside the center well. */
    children?: React.ReactNode;
}

export function QuestBoardTrack({
    spaces, size, pieceIndex, targetIndex, pathIndices, arrivalKey = 0, children,
}: QuestBoardTrackProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const QUEST_KIND_ACCENTS = questKindAccents(AXM);
    const { w, h } = ringDimensions(spaces.length);
    const cells = perimeterCells(w, h).slice(0, spaces.length);
    const cell = Math.floor(size / Math.max(w, h));
    const pad = 2;
    const pathSet = React.useMemo(() => new Set(pathIndices ?? []), [pathIndices]);

    return (
        <View style={{ width: cell * w, height: cell * h, alignSelf: 'center' }} testID="quest-board-track">
            {/* Center well */}
            <View
                style={[
                    styles.well,
                    {
                        left: cell + pad,
                        top: cell + pad,
                        width: cell * (w - 2) - pad * 2,
                        height: cell * (h - 2) - pad * 2,
                    },
                ]}
            >
                {children}
            </View>
            {spaces.map((space, i) => {
                const at = cells[i];
                const hasPiece = pieceIndex === undefined ? space.isPiece : pieceIndex === space.index;
                return (
                    <QuestSpaceCell
                        key={space.id}
                        space={space}
                        left={at.col * cell + pad}
                        top={at.row * cell + pad}
                        size={cell - pad * 2}
                        accent={QUEST_KIND_ACCENTS[space.kind] ?? AXM.bone}
                        hasPiece={hasPiece}
                        isTarget={targetIndex === space.index}
                        isPath={pathSet.has(space.index)}
                        arrivalKey={arrivalKey}
                    />
                );
            })}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    space: {
        position: 'absolute',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    glow: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0,
    },
    glyph: {
        fontSize: 16,
        lineHeight: 20,
    },
    piece: {
        position: 'absolute',
        bottom: 1,
        right: 3,
        fontFamily: FONTS.gothic,
        fontSize: 14,
        color: AXM.sulfur,
    },
    flag: {
        position: 'absolute',
        top: 0,
        right: 2,
        fontSize: 11,
        color: AXM.sulfur,
    },
    well: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.deepBg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
    },
}));
