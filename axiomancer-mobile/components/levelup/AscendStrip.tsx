/**
 * AscendStrip — the inline "LEVEL UP" affordance rendered between
 * the level box and the XP chain on the SELF tab when the player
 * has unspent stat-allocation points.
 *
 * Phase 73 Tick A port of the handoff bundle's
 * `SelfTabHeaderWithLevelUp` design
 * (`design/handoff-2026-05-23/project/screens/levelup.jsx` + chat5
 * brief lines 109-167). The strip is the LOUDEST single element on
 * the SELF tab when armed — full-width, ~64px tall, sulfur-banded.
 * The carve-out is deliberate per the brief: the seal sits on the
 * page like a wax-sealed proclamation, not a CTA shouting from a
 * settings app.
 *
 * Mounts only when `pendingPoints > 0`. The caller (SELF screen)
 * gates on `vm.pendingPoints` from the character presenter and
 * skips mounting when zero — the SELF header then renders
 * byte-identical to pre-Phase-73.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path as SvgPath } from 'react-native-svg';

import { Splatter } from '@/components/Splatter';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { toRomanLower } from '@/state/presenters/roman';

export interface AscendStripProps {
    /** Unspent allocation points. Must be > 0; caller gates. */
    pendingPoints: number;
    /** Current level (the strip renders "step into level <N+1>"). */
    level: number;
    /** Tap handler — opens the LevelUpModal. */
    onOpen: () => void;
}

export function AscendStrip({ pendingPoints, level, onOpen }: AscendStripProps) {
    const styles = useStyles();
    const AXM = usePalette();
    // Lowercase roman for the target level only, per the bundle's
    // numeral rule. Points count stays in arabic (stat-deltas).
    const targetLevel = toRomanLower(level + 1);
    const pointsWord = pendingPoints === 1 ? 'point' : 'points';
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ascend — ${pendingPoints} ${pointsWord} unspent, step into level ${level + 1}`}
            testID="ascend-strip"
            onPress={onOpen}
            style={({ pressed }) => [styles.strip, pressed && styles.stripPressed]}
        >
            <View style={styles.stripContent}>
                <View style={styles.sealWrap}>
                    {/* Sulfur "pulse" ring — concentric inner ring at 50%
                       opacity to imply the slow-breathing animation the
                       brief calls for. react-native-reanimated could
                       drive a real loop later; the static ring carries
                       the visual contract for now. */}
                    <View style={styles.sealPulse} />
                    <LockSealGlyph />
                </View>
                <View style={styles.centerCol}>
                    <Text style={styles.ascendTitle}>✠ ASCEND</Text>
                    <Text style={styles.ascendSubline} numberOfLines={1}>
                        {pendingPoints} {pointsWord} unspent · step into level {targetLevel}
                    </Text>
                    {pendingPoints >= 2 && (
                        <Text style={styles.ignoredPings}>
                            {renderChevrons(pendingPoints)}
                        </Text>
                    )}
                </View>
                <View style={styles.chevronRing}>
                    <Text style={styles.chevron}>›</Text>
                </View>
            </View>
            <Splatter
                color={AXM.blood}
                size={48}
                seed={42}
                style={{ position: 'absolute', bottom: -10, left: -10, opacity: 0.55 }}
            />
        </Pressable>
    );
}

/**
 * Per the brief: `↑×N` form once pendingPoints > 5 to avoid the
 * row becoming an arrow soup. ≤5 renders one arrow per point.
 */
function renderChevrons(n: number): string {
    if (n > 5) return `↑×${n}`;
    return Array.from({ length: n }, () => '↑').join(' ');
}

/**
 * LockSeal glyph — wax-seal motif with an inset lock. Mirrors the
 * `<LockSeal>` primitive the design's encounter-modal.jsx ships
 * (`design/handoff-2026-05-23/project/screens/encounter-modal.jsx:18-34`).
 * Rendered in sulfur here per the ASCEND brand color.
 */
function LockSealGlyph() {
    const AXM = usePalette();
    return (
        <Svg viewBox="0 0 22 22" width={22} height={22}>
            <Circle cx={11} cy={11} r={10} fill={AXM.sulfur} stroke={AXM.bg} strokeWidth={0.6} />
            <Circle
                cx={11}
                cy={11}
                r={10}
                fill="none"
                stroke={AXM.bg}
                strokeWidth={0.4}
                strokeDasharray="1 1.5"
                opacity={0.6}
            />
            {/* impressed lock — shackle + body */}
            <SvgPath d="M7.5 11 h7 v5 h-7 z" fill="none" stroke={AXM.bg} strokeWidth={1.2} />
            <SvgPath
                d="M8.5 11 v-2 a2.5 2.5 0 0 1 5 0 v2"
                fill="none"
                stroke={AXM.bg}
                strokeWidth={1.2}
            />
        </Svg>
    );
}

const useStyles = makeStyles((AXM) => ({
    strip: {
        marginVertical: 6,
        backgroundColor: AXM.panelBg,
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderTopColor: AXM.sulfur,
        borderBottomColor: AXM.sulfur,
        borderLeftColor: AXM.parchment,
        borderRightColor: AXM.parchment,
        position: 'relative',
        overflow: 'hidden',
    },
    stripPressed: { transform: [{ translateY: 1 }], opacity: 0.88 },
    stripContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        minHeight: 60,
    },
    sealWrap: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sealPulse: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        opacity: 0.5,
    },
    centerCol: { flex: 1, justifyContent: 'center' },
    ascendTitle: {
        fontFamily: FONTS.gothic,
        fontSize: 18,
        color: AXM.sulfur,
        letterSpacing: 1,
    },
    ascendSubline: {
        fontFamily: FONTS.sans,
        fontSize: 9.5,
        letterSpacing: 1.6,
        color: AXM.sulfur,
        opacity: 0.6,
        marginTop: 2,
    },
    ignoredPings: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: AXM.sulfur,
        opacity: 0.6,
        marginTop: 2,
        letterSpacing: 1.4,
    },
    chevronRing: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: AXM.parchment,
        opacity: 0.85,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevron: {
        fontFamily: FONTS.gothic,
        fontSize: 22,
        color: AXM.sulfur,
        lineHeight: 22,
    },
}));
