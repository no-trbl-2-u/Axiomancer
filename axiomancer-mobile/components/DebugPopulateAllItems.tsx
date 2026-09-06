/**
 * Dev-only "populate registry items" button.
 *
 * Press to fire `actions.populateAllItems()` — walks the engine's two
 * item registries (`relicLibrary`: the 8 signet relics, the only
 * equipment in the game; `consumableLibrary`) and pushes one of each to
 * the player's inventory. Useful for surface-testing inventory
 * rendering, the equip dock, and per-slot chrome under a maximal load.
 * For a single item use `DebugItemPicker`.
 *
 * Renders null outside dev builds.
 */

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugPopulateAllItems() {
    const styles = useStyles();
    const actions = useGameActions();
    const [lastResult, setLastResult] = useState<string | null>(null);

    if (!isDevToolsEnabled()) return null;

    const onPress = () => {
        const result = actions.populateAllItems();
        const { equipment, consumable } = result.breakdown;
        setLastResult(
            `populated · ${result.itemsAdded} total · ${equipment} relics / ${consumable} cons`,
        );
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · POPULATE</Text>
                <Text style={styles.sub} testID="debug-populate-sub">
                    {lastResult ??
                        'the 8 signet relics + every consumable · relics are the only equipment now'}
                </Text>
            </View>
            <Pressable
                style={styles.button}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Populate inventory with the 8 signet relics and every consumable"
                testID="debug-populate-all-items"
            >
                <Text style={styles.buttonLabel}>POPULATE</Text>
            </Pressable>
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
    button: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.selectFill,
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 12,
        color: AXM.sulfur,
        letterSpacing: 1.5,
    },
}));
