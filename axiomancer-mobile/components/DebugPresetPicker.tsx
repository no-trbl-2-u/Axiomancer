/**
 * Dev-only character preset picker (Phase 59).
 *
 * Three buttons — one per engine `characterPresets` row
 * (apprentice / wanderer / sage). Press swaps the player slice
 * with `buildCharacterFromPreset(preset)` so the rest of the
 * surface (SELF tab, inventory dock, combat skills, alignment
 * cube) re-renders against a freshly-built archetype.
 *
 * Fourth manual-testing knob alongside `DebugSeedButton`,
 * `DebugCombatButton`, `DebugMapResetButton`, `DebugChaosToggle`.
 * Renders null in production builds (`__DEV__` false).
 *
 * Promoted via `/oversight` 2026-05-20 (14th call) from
 * PHASE_CANDIDATES pass 5 [score 4.5].
 */

import { characterPresets } from 'axiomancer-mechanics';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugPresetPicker() {
    const styles = useStyles();
    const actions = useGameActions();
    const [active, setActive] = useState<string | null>(null);

    if (!isDevToolsEnabled()) return null;

    const onPick = (presetId: string) => () => {
        const result = actions.applyCharacterPreset(presetId);
        if (result.applied) {
            setActive(result.presetId);
        }
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · PRESET</Text>
                <Text style={styles.sub}>
                    {active ? `applied · ${active}` : 'roster: apprentice / wanderer / sage'}
                </Text>
            </View>
            <View style={styles.buttonCol}>
                {characterPresets.map((preset) => {
                    const isActive = active === preset.id;
                    return (
                        <Pressable
                            key={preset.id}
                            style={[styles.button, isActive && styles.buttonActive]}
                            onPress={onPick(preset.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Apply ${preset.name} preset to the player`}
                            testID={`debug-preset-${preset.id}`}
                        >
                            <Text style={[styles.buttonLabel, isActive && styles.buttonLabelActive]}>
                                {preset.name.toUpperCase()}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    row: {
        marginTop: 8,
        marginHorizontal: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    labelCol: { flexDirection: 'column', flex: 1, paddingRight: 8 },
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
        marginTop: 2,
    },
    buttonCol: { flexDirection: 'column', gap: 4 },
    button: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.bg,
    },
    buttonActive: {
        borderColor: AXM.sulfur,
        backgroundColor: AXM.selectFill,
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 11,
        color: AXM.bone,
        letterSpacing: 1.5,
        textAlign: 'right',
    },
    buttonLabelActive: {
        color: AXM.sulfur,
    },
}));
