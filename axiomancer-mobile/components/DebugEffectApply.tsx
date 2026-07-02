/**
 * Dev-only active-effect apply affordance (Phase 61e).
 *
 *   - `BUFF · ME` applies `buff_body_defense_up` to `player.effects`
 *     via the engine's `applyEffect` helper. Visible on the SELF tab's
 *     effects section.
 *
 * The former `BLEED · FOE` button targeted the legacy turn-based
 * `state.combat.enemy`, which was removed from the engine in mechanics
 * 0.37.0 (live hazard combat owns its enemy in the panel's local
 * state, unreachable from the store), so it was dropped.
 *
 * Renders null in production.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { applyEffect, effectsLibrary } from 'axiomancer-mechanics';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

const PLAYER_BUFF_ID = 'buff_body_defense_up';

export function DebugEffectApply() {
    const styles = useStyles();
    const store = useGameStore();

    if (!isDevToolsEnabled()) return null;

    const onBuffPlayer = () => {
        const effect = effectsLibrary.registry.get(PLAYER_BUFF_ID);
        if (!effect) return;
        const player = store.getState().player;
        const { activeEffects } = applyEffect(
            [...(player.effects ?? [])],
            effect,
            0,
        );

        store.setState({
            player: { ...player, effects: activeEffects },
        });
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · EFFECTS</Text>
                <Text style={styles.sub}>apply a buff</Text>
            </View>
            <View style={styles.buttonGroup}>
                <Pressable
                    style={styles.button}
                    onPress={onBuffPlayer}
                    accessibilityRole="button"
                    accessibilityLabel="Apply a defense buff to the player"
                    testID="debug-effect-buff-player"
                >
                    <Text style={styles.buttonLabel}>BUFF · ME</Text>
                </Pressable>
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
    buttonGroup: { flexDirection: 'row', gap: 6 },
    button: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.bg,
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 11,
        color: AXM.sulfur,
        letterSpacing: 1,
    },
}));
