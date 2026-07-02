/**
 * Dev-only XP grant + force-level-up affordance (Phase 61b).
 *
 * Two buttons on one row:
 *
 *   - `+100 XP` adds 100 to `player.experience` via store.setState.
 *     Tests the experience progress bar / level threshold gauge.
 *   - `FORCE LEVELUP` calls the engine's `levelUp()` action, which
 *     dispatches `LEVEL_UP` and emits a `character:levelup` event.
 *     The store subscriber flips `notifications.levelUpAcknowledged`
 *     false; the character-tab level-up badge re-arms.
 *
 * Mounts inside the `<DevMenu>` on the SELF tab (Phase 61a). Renders
 * null in production. Sister affordances (61c–61f) follow this same
 * shape.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

const XP_GRANT_AMOUNT = 100;

export function DebugXpGrant() {
    const styles = useStyles();
    const store = useGameStore();

    if (!isDevToolsEnabled()) return null;

    const onGrantXp = () => {
        const player = store.getState().player;
        store.setState({
            player: {
                ...player,
                experience: (player.experience ?? 0) + XP_GRANT_AMOUNT,
            },
        });
    };

    const onForceLevelUp = () => {
        // The engine's LEVEL_UP reducer is gated on
        // `experience >= experienceToNextLevel`. Seed enough XP to
        // cross the threshold, then dispatch — the reducer loops
        // through stacked level-ups in one pass and emits the
        // `character:levelup` event.
        const player = store.getState().player;
        store.setState({
            player: {
                ...player,
                experience: player.experienceToNextLevel ?? 100,
            },
        });
        store.getState().levelUp();
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · XP</Text>
                <Text style={styles.sub}>grant or force-level</Text>
            </View>
            <View style={styles.buttonGroup}>
                <Pressable
                    style={styles.button}
                    onPress={onGrantXp}
                    accessibilityRole="button"
                    accessibilityLabel={`Grant ${XP_GRANT_AMOUNT} experience points to the player`}
                    testID="debug-xp-grant-button"
                >
                    <Text style={styles.buttonLabel}>+{XP_GRANT_AMOUNT} XP</Text>
                </Pressable>
                <Pressable
                    style={styles.button}
                    onPress={onForceLevelUp}
                    accessibilityRole="button"
                    accessibilityLabel="Force the player to level up"
                    testID="debug-xp-levelup-button"
                >
                    <Text style={styles.buttonLabel}>LEVELUP</Text>
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
