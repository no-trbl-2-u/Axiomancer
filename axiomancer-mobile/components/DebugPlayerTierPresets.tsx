/**
 * Dev-only player-tier preset picker (Phase 131).
 *
 * Four buttons — `L1` / `L15` / `L30` / `L50` — one per
 * `PLAYER_TIER_PRESETS` row. Press rebuilds the player at that level
 * with level-relevant skills and equipment via the engine's
 * `buildCharacterFromPreset` (through `actions.applyPlayerTierPreset`).
 *
 * This is the finer ladder T asked for the Kid's mobile evidence
 * runs, alongside the coarser FRESH START / ENDGAME presets
 * (`DebugPlaythroughPresets`, Phase 100) and the archetype roster
 * (`DebugPresetPicker`, Phase 59). Renders null outside dev builds.
 */

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';
import { PLAYER_TIER_PRESETS } from '@/state/dev/player-presets';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugPlayerTierPresets() {
    const styles = useStyles();
    const actions = useGameActions();
    const [active, setActive] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);

    if (!isDevToolsEnabled()) return null;

    const onPick = (presetId: string) => () => {
        const result = actions.applyPlayerTierPreset(presetId);
        if (result.applied) {
            setActive(result.presetId);
            setSummary(`applied · ${result.label} (lvl ${result.level})`);
        }
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · PLAYER TIER</Text>
                <Text style={styles.sub}>
                    {summary ?? 'evidence ladder: L1 / L15 / L30 / L50'}
                </Text>
            </View>
            <View style={styles.buttonGroup}>
                {PLAYER_TIER_PRESETS.map((tier) => {
                    const isActive = active === tier.id;
                    return (
                        <Pressable
                            key={tier.id}
                            style={[styles.button, isActive && styles.buttonActive]}
                            onPress={onPick(tier.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Apply ${tier.label} player preset — ${tier.summary}`}
                            testID={`debug-player-tier-${tier.id}`}
                        >
                            <Text style={[styles.buttonLabel, isActive && styles.buttonLabelActive]}>
                                {tier.label}
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
    buttonGroup: { flexDirection: 'row', gap: 4 },
    button: {
        paddingHorizontal: 8,
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
        fontSize: 12,
        color: AXM.bone,
        letterSpacing: 1,
    },
    buttonLabelActive: {
        color: AXM.sulfur,
    },
}));
