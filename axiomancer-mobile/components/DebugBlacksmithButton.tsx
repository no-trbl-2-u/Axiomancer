/**
 * Dev-only manual blacksmith trigger. Blacksmith map events fire "The
 * Anvil" organically (one authored fishing-village node), but tuning and
 * visual work need an immediate entry: tap → `actions.beginBlacksmith()`
 * → `<BlacksmithGate>` routes to `/blacksmith`. GO offers the witness
 * swap variant so the swap path is reachable from the dev menu. Renders
 * null outside dev builds.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { HEART_RICH_PAYLOAD_VARIANT } from '@mechanics';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugBlacksmithButton() {
    const styles = useStyles();
    const actions = useGameActions();

    if (!isDevToolsEnabled()) return null;

    const onPress = () => {
        // The witness swap variant is offered so the gear-swap path is
        // exercisable; budget defaults to the player's wallet.
        actions.beginBlacksmith({ variants: [HEART_RICH_PAYLOAD_VARIANT] });
        // <BlacksmithGate> observes the slice and pushes /blacksmith.
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · BLACKSMITH</Text>
                <Text style={styles.sub}>open the anvil (die-gear upgrades)</Text>
            </View>
            <Pressable
                style={styles.button}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Open a debug blacksmith visit"
                testID="debug-blacksmith-button"
            >
                <Text style={styles.buttonLabel}>GO FORGE</Text>
            </Pressable>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: AXM.ash,
    },
    labelCol: { flex: 1 },
    label: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: AXM.bone },
    sub: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.ash, marginTop: 2 },
    button: {
        borderWidth: 1,
        borderColor: AXM.sulfur,
        paddingVertical: 6,
        paddingHorizontal: 14,
        backgroundColor: AXM.sulfurSubtle,
    },
    buttonLabel: { fontFamily: FONTS.gothic, fontSize: 14, letterSpacing: 2, color: AXM.sulfur },
}));
