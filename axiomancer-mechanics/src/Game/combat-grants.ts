/**
 * Victory-grant helpers shared by `gameReducer` and `createGameStore`.
 *
 * The store rolls loot and tallies XP before dispatching `END_COMBAT` so that
 * `endCombat()` can return a populated `CombatEndReport` referring to the
 * exact same drops the reducer then applies. The reducer falls back to these
 * helpers when no pre-rolled grants are supplied (callers that dispatch
 * `END_COMBAT` directly without going through the store).
 */

import { Item } from '../Items/types';
import { Encounter } from '../World/types';
import { LootTableEntry } from '../Enemy/types';
import { rollLoot } from '../Enemy/loot';

/**
 * Stack-aware inventory append.
 *
 * The rule moved down to the Items layer (`Items/item.reducer.ts`) so the
 * shared grant path (`Items/item-grant.ts`) and this victory-loot fold ask the
 * same function what "stacks" means. Re-exported here unchanged — signature and
 * behaviour are identical, and `game.reducer.ts` keeps importing it from this
 * module.
 */
export { addItemStacking } from '../Items/item.reducer';

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
