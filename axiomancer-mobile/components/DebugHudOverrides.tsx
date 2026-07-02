/**
 * Dev-only HUD visibility override toggles (Phase 87).
 *
 * Four buttons in a 2x2 grid inside the DevMenu:
 *
 *   - `HIDE MANA` forces `combatMana: null` on HUD presenter reads.
 *   - `HIDE EFFECTS` forces `effects: []` on HUD presenter reads.
 *   - `HIDE STANCE` forces `stance: 'none'` on HUD presenter reads.
 *   - `RESET ALL` clears all active overrides.
 *
 * Toggles stored in `state.devOverrides.hud` and applied in
 * `selectCombatHudViewModel`. Enables testing empty-state branches
 * (mana-less combat, effect-free display, stance-neutral HUD) without
 * requiring specific game state setup.
 *
 * Active overrides show visual feedback (sulfur background tint).
 * Renders null in production.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugHudOverrides() {
    const styles = useStyles();
    const store = useGameStore();

    if (!isDevToolsEnabled()) return null;

    const overrides = store.getState().devOverrides.hud;

    const toggleOverride = (key: 'hideMana' | 'hideEffects' | 'hideStance') => {
        const current = store.getState().devOverrides.hud;
        store.setState({
            devOverrides: {
                ...store.getState().devOverrides,
                hud: {
                    ...current,
                    [key]: !current[key],
                },
            },
        });
    };

    const resetAllOverrides = () => {
        store.setState({
            devOverrides: {
                ...store.getState().devOverrides,
                hud: {
                    hideMana: false,
                    hideEffects: false,
                    hideStance: false,
                },
            },
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · HUD OVERRIDES</Text>
                <Text style={styles.sub}>force empty states for testing</Text>
            </View>
            <View style={styles.buttonGrid}>
                <View style={styles.buttonRow}>
                    <Pressable
                        style={[
                            styles.button,
                            overrides.hideMana && styles.buttonActive,
                        ]}
                        onPress={() => toggleOverride('hideMana')}
                        accessibilityRole="button"
                        accessibilityLabel={`${overrides.hideMana ? 'Show' : 'Hide'} mana bar in HUD`}
                        testID="debug-hud-hide-mana"
                    >
                        <Text style={[
                            styles.buttonLabel,
                            overrides.hideMana && styles.buttonLabelActive,
                        ]}>
                            {overrides.hideMana ? '✓ MANA' : 'HIDE MANA'}
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[
                            styles.button,
                            overrides.hideEffects && styles.buttonActive,
                        ]}
                        onPress={() => toggleOverride('hideEffects')}
                        accessibilityRole="button"
                        accessibilityLabel={`${overrides.hideEffects ? 'Show' : 'Hide'} effects in HUD`}
                        testID="debug-hud-hide-effects"
                    >
                        <Text style={[
                            styles.buttonLabel,
                            overrides.hideEffects && styles.buttonLabelActive,
                        ]}>
                            {overrides.hideEffects ? '✓ EFFECTS' : 'HIDE EFFECTS'}
                        </Text>
                    </Pressable>
                </View>
                <View style={styles.buttonRow}>
                    <Pressable
                        style={[
                            styles.button,
                            overrides.hideStance && styles.buttonActive,
                        ]}
                        onPress={() => toggleOverride('hideStance')}
                        accessibilityRole="button"
                        accessibilityLabel={`${overrides.hideStance ? 'Show' : 'Hide'} stance in HUD`}
                        testID="debug-hud-hide-stance"
                    >
                        <Text style={[
                            styles.buttonLabel,
                            overrides.hideStance && styles.buttonLabelActive,
                        ]}>
                            {overrides.hideStance ? '✓ STANCE' : 'HIDE STANCE'}
                        </Text>
                    </Pressable>
                    <Pressable
                        style={styles.resetButton}
                        onPress={resetAllOverrides}
                        accessibilityRole="button"
                        accessibilityLabel="Reset all HUD overrides"
                        testID="debug-hud-reset-all"
                    >
                        <Text style={styles.resetButtonLabel}>RESET ALL</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    container: {
        marginTop: 8,
        marginHorizontal: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    labelCol: { marginBottom: 8 },
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
    buttonGrid: {
        gap: 6,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 6,
    },
    button: {
        flex: 1,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.bg,
        alignItems: 'center',
    },
    buttonActive: {
        backgroundColor: AXM.sulfur,
        borderColor: AXM.sulfur,
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 10,
        color: AXM.sulfur,
        letterSpacing: 1,
        textAlign: 'center',
    },
    buttonLabelActive: {
        color: AXM.bg,
    },
    resetButton: {
        flex: 1,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AXM.bone,
        backgroundColor: AXM.bg,
        alignItems: 'center',
    },
    resetButtonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 10,
        color: AXM.bone,
        letterSpacing: 1,
        textAlign: 'center',
    },
}));