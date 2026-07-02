/**
 * Dev-only "populate registry items" button.
 *
 * Press to fire `actions.populateAllItems()` — walks the engine's
 * three central item registries (`equipmentTemplates`,
 * `uniqueTemplates`, `consumableLibrary`) and pushes one of each
 * to the player's inventory. Useful for surface-testing inventory
 * rendering, equip dock peer ordering, and per-rarity / per-slot
 * chrome under a maximal load.
 *
 * Rarity truth (Phase 136): POPULATE provides only the items that
 * actually exist as static registry rows — common / base equipment,
 * unique relics, and consumables. Uncommon and rare equipment are
 * NOT registry rows; the engine rolls them at drop time. Use the
 * LOOT UNCOMMON / LOOT RARE buttons (DebugLootRarityButtons) to add
 * those real generated drops.
 *
 * User-direct request 2026-05-22 (mid-`/march` interjection): "let's
 * add a button that 'populates' items and gives the player every
 * item in the game". Sibling to `DebugSeedButton` (which seeds a
 * representative sample — head/body/weapon + one potion + a few
 * skills + map reset); this one is the full registry dump for
 * targeted UI testing.
 *
 * Renders null in production builds (`__DEV__` is false). Mount
 * inside `<DevMenu>` on the SELF tab.
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
        const { equipment, unique, consumable } = result.breakdown;
        setLastResult(
            `populated · ${result.itemsAdded} total · ${equipment} eq / ${unique} uniq / ${consumable} cons`,
        );
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · POPULATE</Text>
                <Text style={styles.sub} testID="debug-populate-sub">
                    {lastResult ??
                        'common/base + unique registry gear + consumables · uncommon/rare via LOOT buttons'}
                </Text>
            </View>
            <Pressable
                style={styles.button}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Populate inventory with registry gear: common/base equipment, unique relics, and consumables"
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
