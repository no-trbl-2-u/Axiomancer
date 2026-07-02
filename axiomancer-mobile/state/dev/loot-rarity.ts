/**
 * Dev-only "loot a real rarity drop" injection (Phase 136; Phase 154 — logic
 * moved to the engine).
 *
 * Four buttons roll genuine drops at a requested rarity and push them to the
 * player's inventory. All generation logic — eligible-template selection, the
 * affix roll, and the realised-count verification — lives in the engine
 * (`generateRarityDrop` from `axiomancer-mechanics`). This module is now pure
 * mobile glue: it forwards the player's level to the engine, assigns a fresh
 * inventory-instance id, dispatches `addItem`, and shapes the button feedback.
 *
 * Affix counts follow the engine's design contract:
 *   - common   → 0 named affixes → "Iron Blade"
 *   - uncommon → 1 named affix   → "Keen Iron Blade" / "Iron Blade of Clarity"
 *   - rare     → 2 named affixes → "Keen Iron Blade of Clarity"
 *   - unique   → 3 fixed modifiers + fixed name (no prefix/suffix)
 *
 * Component mount is `isDevToolsEnabled()`-guarded; production never reaches
 * this.
 */

import { generateRarityDrop, type Equipment, type ItemRarity } from 'axiomancer-mechanics';

import type { AppStore } from '@/state/store';

/** Procedural drop rarities this dev tool can request. */
export type LootRarity = ItemRarity;

export interface LootRarityResult {
    /** True when a real drop was generated and pushed to inventory. */
    added: boolean;
    /** The requested rarity. */
    rarity: LootRarity;
    /** Generated item display name, or null on failure. */
    name: string | null;
    /**
     * Realised affix / modifier count for the drop — named affixes for
     * common/uncommon/rare, fixed-modifier count for unique. Null on failure.
     */
    affixCount: number | null;
    /** Human-readable reason when `added` is false. */
    reason: string | null;
}

/** A fresh inventory-unique instance id so repeated dev drops of the same base
 * template never collapse into a single stacked row. */
function instanceId(item: Equipment, store: AppStore, rarity: LootRarity): string {
    const len = store.getState().player.inventory.length;
    return `${item.id}__devloot_${rarity}_${len}`;
}

/**
 * Generate one real drop at the requested rarity (via the engine) and push it
 * into the player's inventory. Reports the generated item's name + affix count,
 * or a graceful `added: false` with a visible reason on failure. Never throws.
 */
export function lootRarityItem(store: AppStore, rarity: LootRarity): LootRarityResult {
    try {
        const state = store.getState();
        const addItem = state.addItem;
        const playerLevel = state.player?.level ?? 1;

        const drop = generateRarityDrop(rarity, { playerLevel });
        if (drop.item === null) {
            return { added: false, rarity, name: null, affixCount: null, reason: drop.reason };
        }

        const instancedItem: Equipment = {
            ...drop.item,
            id: instanceId(drop.item, store, rarity),
        };
        addItem(instancedItem);
        return {
            added: true,
            rarity,
            name: instancedItem.name,
            affixCount: drop.affixCount,
            reason: null,
        };
    } catch (error) {
        console.error(`Failed to loot ${rarity} item:`, error);
        return { added: false, rarity, name: null, affixCount: null, reason: 'loot failed — see console' };
    }
}

/** Convenience wrapper — loot one real common drop (0 affixes). */
export function lootCommonItemAction(store: AppStore): LootRarityResult {
    return lootRarityItem(store, 'common');
}

/** Convenience wrapper — loot one real uncommon drop (1 affix). */
export function lootUncommonItemAction(store: AppStore): LootRarityResult {
    return lootRarityItem(store, 'uncommon');
}

/** Convenience wrapper — loot one real rare drop (2 affixes). */
export function lootRareItemAction(store: AppStore): LootRarityResult {
    return lootRarityItem(store, 'rare');
}

/** Convenience wrapper — loot one unique relic (3 fixed modifiers). */
export function lootUniqueItemAction(store: AppStore): LootRarityResult {
    return lootRarityItem(store, 'unique');
}
