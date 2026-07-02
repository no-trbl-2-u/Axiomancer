/**
 * Dev-only currency manipulation affordance (Phase 87).
 *
 * Three buttons on one row inside the DevMenu:
 *
 *   - `+50 SHILLING` adds 50 to `player.currency`. Tests small purchases
 *     and inventory display updates.
 *   - `+500 SHILLING` adds 500 to `player.currency`. Tests expensive gear
 *     purchases and larger transaction flows.
 *   - `BROKE` sets `player.currency` to 0. Tests poverty states and
 *     insufficient-funds branches.
 *
 * Amounts (50, 500) chosen based on inventory price ranges: smallest
 * purchasable items ~25s, expensive gear ~400s. Covers the testing
 * spectrum for purchase flows.
 *
 * Renders null in production. Part of the DEV-mode coverage expansion
 * to ensure every ported mechanic has debug affordance.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

const SMALL_GRANT_AMOUNT = 50;
const LARGE_GRANT_AMOUNT = 500;

export function DebugCurrencyControl() {
    const styles = useStyles();
    const store = useGameStore();

    if (!isDevToolsEnabled()) return null;

    const grantCurrency = (amount: number) => {
        const player = store.getState().player;
        const current = Number(player.currency ?? 0);
        const newAmount = Math.max(0, current + amount);
        
        store.setState({
            player: {
                ...player,
                currency: newAmount,
            },
        });
    };

    const setBroke = () => {
        const player = store.getState().player;
        store.setState({
            player: {
                ...player,
                currency: 0,
            },
        });
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · CURRENCY</Text>
                <Text style={styles.sub}>grant shilling or test poverty</Text>
            </View>
            <View style={styles.buttonGroup}>
                <Pressable
                    style={styles.button}
                    onPress={() => grantCurrency(SMALL_GRANT_AMOUNT)}
                    accessibilityRole="button"
                    accessibilityLabel={`Grant ${SMALL_GRANT_AMOUNT} shilling to the player`}
                    testID="debug-currency-small-grant"
                >
                    <Text style={styles.buttonLabel}>+{SMALL_GRANT_AMOUNT}S</Text>
                </Pressable>
                <Pressable
                    style={styles.button}
                    onPress={() => grantCurrency(LARGE_GRANT_AMOUNT)}
                    accessibilityRole="button"
                    accessibilityLabel={`Grant ${LARGE_GRANT_AMOUNT} shilling to the player`}
                    testID="debug-currency-large-grant"
                >
                    <Text style={styles.buttonLabel}>+{LARGE_GRANT_AMOUNT}S</Text>
                </Pressable>
                <Pressable
                    style={styles.button}
                    onPress={setBroke}
                    accessibilityRole="button"
                    accessibilityLabel="Set player currency to zero"
                    testID="debug-currency-broke"
                >
                    <Text style={styles.buttonLabel}>BROKE</Text>
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