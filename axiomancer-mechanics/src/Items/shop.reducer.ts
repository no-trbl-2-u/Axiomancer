/**
 * Shop reducers — Phase 37.
 *
 * Pure `Character → Character` operations. No GameState coupling, no
 * exceptions: invalid input (negative price, insufficient funds,
 * missing item) returns the input character unchanged so UI layers can
 * pre-check and the engine never has to throw across the consumer
 * boundary. Mirrors the shape of `allocateStatPoint` (Phase 29).
 *
 * `buyItem` deep-clones the purchased item — two consumers who each
 * buy the same ware should not share an item identity in their
 * inventories (a stack increment in one would otherwise alias the
 * other). Matches `resolveGathering` / `resolveLootCache` in
 * `World/MapEvents/handlers.ts`.
 */

import type { Character } from '../Character/types';
import type { Item } from './types';
import type { ShopWare } from './shop.types';
import { deepClone } from '../Utils';

/**
 * Default sell price for a shop ware (Phase 37, exploit-fix iterate).
 *
 * Halves the buy price and floors — so a ware with price 1 sells for 0,
 * price 2 sells for 1, price 12 sells for 6. The result is always
 * strictly less than the buy price for any positive integer price,
 * which forces every buy → sell round-trip to be net-negative for the
 * player and forecloses the small infinite-money loop the prior
 * `Math.max(1, Math.floor(price / 2))` floor allowed at price ≤ 2.
 *
 * UIs should call this helper rather than re-implementing the
 * heuristic; the policy lives on the engine side so future content
 * pricing stays consistent across CLI, RN, and any other consumer.
 */
export function defaultSellPrice(ware: ShopWare): number {
    return Math.floor(ware.price / 2);
}

export function buyItem(
    character: Character,
    item: Item,
    price: number,
): Character {
    if (price < 0) return character;
    if (character.currency < price) return character;
    return {
        ...character,
        currency: character.currency - price,
        inventory: [...character.inventory, deepClone(item)],
    };
}

export function sellItem(
    character: Character,
    itemId: string,
    price: number,
): Character {
    if (price < 0) return character;
    const idx = character.inventory.findIndex(i => i.id === itemId);
    if (idx === -1) return character;
    const nextInventory = character.inventory.slice();
    nextInventory.splice(idx, 1);
    return {
        ...character,
        currency: character.currency + price,
        inventory: nextInventory,
    };
}
