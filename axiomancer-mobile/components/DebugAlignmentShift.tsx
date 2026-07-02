/**
 * Dev-only philosophical alignment shift affordance (Phase 61d).
 *
 * Three axis rows (epistemology / outlook / scope) inside the
 * DevMenu. Each row has ± buttons that shift the corresponding
 * axis by ±10 via the engine's `shiftPhilosophicalAlignment`
 * action, which dispatches SHIFT_PHILOSOPHICAL_ALIGNMENT and
 * applies the engine's bounded delta logic (axis values clamp
 * to the engine's expected range automatically).
 *
 * The engine names the axes `epistemology`, `outlook`, `scope`
 * (per `PhilosophicalAlignment` in axiomancer-mechanics).
 * The Phase 61d brief used the alternate names "epistemic /
 * ethical / metaphysical" — engine names win for the canonical
 * surface; the brief's labels were aspirational. See commit body
 * for the call.
 *
 * Mounts inside the DevMenu (Phase 61a). Renders null outside
 * `__DEV__`. The character-tab alignment row (Phase 52) reflects
 * the shifted state on next render.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

const SHIFT_STEP = 10;

type AxisKey = 'epistemology' | 'outlook' | 'scope';

const AXES: readonly { key: AxisKey; label: string }[] = [
    { key: 'epistemology', label: 'EPIST' },
    { key: 'outlook', label: 'OUTLOOK' },
    { key: 'scope', label: 'SCOPE' },
];

export function DebugAlignmentShift() {
    const styles = useStyles();
    const store = useGameStore();

    if (!isDevToolsEnabled()) return null;

    const onShift = (axis: AxisKey, sign: 1 | -1) => {
        const delta = { [axis]: sign * SHIFT_STEP };
        store.getState().shiftPhilosophicalAlignment(delta);
    };

    return (
        <View style={styles.root}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>DEBUG · ALIGN</Text>
                <Text style={styles.sub}>shift axes by ±{SHIFT_STEP}</Text>
            </View>
            {AXES.map((axis) => (
                <View key={axis.key} style={styles.axisRow}>
                    <Text style={styles.axisLabel}>{axis.label}</Text>
                    <View style={styles.buttonGroup}>
                        <Pressable
                            style={styles.button}
                            onPress={() => onShift(axis.key, -1)}
                            accessibilityRole="button"
                            accessibilityLabel={`Shift ${axis.key} alignment down by ${SHIFT_STEP}`}
                            testID={`debug-align-${axis.key}-minus`}
                        >
                            <Text style={styles.buttonLabel}>−{SHIFT_STEP}</Text>
                        </Pressable>
                        <Pressable
                            style={styles.button}
                            onPress={() => onShift(axis.key, 1)}
                            accessibilityRole="button"
                            accessibilityLabel={`Shift ${axis.key} alignment up by ${SHIFT_STEP}`}
                            testID={`debug-align-${axis.key}-plus`}
                        >
                            <Text style={styles.buttonLabel}>+{SHIFT_STEP}</Text>
                        </Pressable>
                    </View>
                </View>
            ))}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: {
        marginTop: 8,
        marginHorizontal: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
    label: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 1.5,
        color: AXM.bone,
    },
    sub: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: AXM.parchment,
    },
    axisRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    axisLabel: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        letterSpacing: 1.5,
        color: AXM.parchment,
        flex: 1,
    },
    buttonGroup: { flexDirection: 'row', gap: 6 },
    button: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.bg,
        minWidth: 42,
        alignItems: 'center',
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 11,
        color: AXM.sulfur,
        letterSpacing: 1,
    },
}));
