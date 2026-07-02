/**
 * Victory-grant helpers shared by `gameReducer` and `createGameStore`.
 *
 * The store rolls loot and tallies XP before dispatching `END_COMBAT` so that
 * `endCombat()` can return a populated `CombatEndReport` referring to the
 * exact same drops the reducer then applies. The reducer falls back to these
 * helpers when no pre-rolled grants are supplied (callers that dispatch
 * `END_COMBAT` directly without going through the store).
 */

import { Item, isConsumable, isMaterial } from '../Items/types';
import { Encounter } from '../World/types';
import { LootTableEntry } from '../Enemy/types';
import { rollLoot } from '../Enemy/loot';
import {
    addItem as addItemReducer,
    stackItem as stackInventoryItem,
} from '../Items/item.reducer';

/**
 * Stack-aware inventory append. Stackable kinds (consumables / materials)
 * with a matching `id` already in inventory bump the quantity; everything
 * else is appended.
 */
export function addItemStacking(inventory: Item[], item: Item): Item[] {
    if (isConsumable(item) || isMaterial(item)) {
        const existing = inventory.find(i => i.id === item.id);
        if (existing && (isConsumable(existing) || isMaterial(existing))) {
            return stackInventoryItem(inventory, item.id, item.quantity);
        }
    }
    return addItemReducer(inventory, item);
}

/** Roll one drop per enemy in the encounter. */
export function rollEncounterLoot(
    encounter: Encounter,
    rng: () => number = Math.random,
): Item[] {
    const drops: Item[] = [];
    for (const enemy of encounter.enemies) {
        const drop = rollLoot(enemy.loot as LootTableEntry[] | undefined, rng);
        if (drop) drops.push(drop);
    }
    return drops;
}

/** Total XP across every enemy in the encounter (missing values = 0). */
export function totalEncounterXp(encounter: Encounter): number {
    return encounter.enemies.reduce((sum, e) => sum + (e.xpReward ?? 0), 0);
}
