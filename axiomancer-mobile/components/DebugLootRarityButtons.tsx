/**
 * Dev-only "loot a real rarity drop" controls (Phase 136).
 *
 * Four buttons — LOOT COMMON, LOOT UNCOMMON, LOOT RARE, LOOT UNIQUE —
 * that generate genuine equipment drops through the engine's drop-time
 * roll (`actions.lootCommonItem` / `lootUncommonItem` / `lootRareItem`
 * / `lootUniqueItem`) and push them to the player's inventory. Common
 * carries no modifiers, uncommon one, rare two; unique drops a relic
 * with its three fixed modifiers rolled for the player's level.
 *
 * Why this exists: POPULATE and ADD ITEM BY ID can only hand out
 * static registry rows. Uncommon and rare equipment are not registry
 * rows — the engine rolls them at drop time — so the Kid and the visual
 * smoke path had no honest way to inspect the Phase 135 rarity chrome.
 * These buttons close that gap with real generated drops at every
 * rarity, not hand-faked rarity.
 *
 * Sister to `DebugPopulateAllItems` / `DebugAddItemById`; mounts under
 * `/dev` → INVENTORY & ITEM TOOLS. Renders null outside dev builds.
 */

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import type { LootRarityResult } from '@/state/dev/loot-rarity';

function describeResult(result: LootRarityResult): { ok: boolean; text: string } {
    if (result.added) {
        const mods = result.affixCount ?? 0;
        const modLabel = mods === 1 ? '1 mod' : `${mods} mods`;
        return {
            ok: true,
            text: `looted ${result.rarity} · ${result.name} · ${modLabel}`,
        };
    }
    return {
        ok: false,
        text: result.reason ?? `could not loot ${result.rarity}`,
    };
}

export function DebugLootRarityButtons() {
    const styles = useStyles();
    const actions = useGameActions();
    const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

    if (!isDevToolsEnabled()) return null;

    const onLootCommon = () => setFeedback(describeResult(actions.lootCommonItem()));
    const onLootUncommon = () => setFeedback(describeResult(actions.lootUncommonItem()));
    const onLootRare = () => setFeedback(describeResult(actions.lootRareItem()));
    const onLootUnique = () => setFeedback(describeResult(actions.lootUniqueItem()));

    return (
        <View style={styles.panel}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · LOOT RARITY</Text>
                <Text
                    style={[
                        styles.sub,
                        feedback ? (feedback.ok ? styles.subOk : styles.subErr) : null,
                    ]}
                    numberOfLines={2}
                    testID="debug-loot-rarity-feedback"
                >
                    {feedback?.text
                        ?? 'generate real common (0) / uncommon (1) / rare (2) / unique (3 fixed) drops'}
                </Text>
            </View>
            <View style={styles.buttonRow}>
                <Pressable
                    style={styles.button}
                    onPress={onLootCommon}
                    accessibilityRole="button"
                    accessibilityLabel="Generate a real common equipment drop"
                    testID="debug-loot-common-button"
                >
                    <Text style={styles.buttonLabel}>LOOT COMMON</Text>
                </Pressable>
                <Pressable
                    style={styles.button}
                    onPress={onLootUncommon}
                    accessibilityRole="button"
                    accessibilityLabel="Generate a real uncommon equipment drop"
                    testID="debug-loot-uncommon-button"
                >
                    <Text style={styles.buttonLabel}>LOOT UNCOMMON</Text>
                </Pressable>
            </View>
            <View style={styles.buttonRow}>
                <Pressable
                    style={styles.button}
                    onPress={onLootRare}
                    accessibilityRole="button"
                    accessibilityLabel="Generate a real rare equipment drop"
                    testID="debug-loot-rare-button"
                >
                    <Text style={styles.buttonLabel}>LOOT RARE</Text>
                </Pressable>
                <Pressable
                    style={styles.button}
                    onPress={onLootUnique}
                    accessibilityRole="button"
                    accessibilityLabel="Generate a real unique relic drop"
                    testID="debug-loot-unique-button"
                >
                    <Text style={styles.buttonLabel}>LOOT UNIQUE</Text>
                </Pressable>
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    panel: {
        marginTop: 8,
        marginHorizontal: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    labelCol: { flexDirection: 'column', paddingRight: 8 },
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
    subOk: { color: AXM.sulfur },
    subErr: { color: AXM.blood },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
    button: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.selectFill,
        alignItems: 'center',
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 12,
        color: AXM.sulfur,
        letterSpacing: 1.5,
    },
}));
