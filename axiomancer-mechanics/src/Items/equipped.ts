/**
 * Worn-state convention over an inventory list (Phase 154 — absorbed from the
 * mobile app's `state/selectors/equipment.ts`).
 *
 * The engine ships no `equipped` flag on `Equipment`. Inventory-driven clients
 * encode "worn" via ordering: the FIRST equipment item per slot is treated as
 * worn (a reorder that moves a target item to the front of its slot equips it).
 * Every consumer that surfaces worn-state must agree on this convention for the
 * picture to stay coherent, so it lives here as the single source of truth
 * rather than re-implemented per call site.
 */

import { isEquipment } from './types';
import type { Equipment, Item } from './types';

/**
 * Walk the inventory in order; for each slot, capture the FIRST equipment item
 * seen in that slot. Returns a Map keyed by engine slot key; empty slots are
 * absent.
 *
 * Stable under permutation of non-equipment items between equipment items (only
 * equipment-slot order matters) and under stack-quantity changes (does not read
 * `.quantity`).
 */
export function firstEquippedPerSlot(
    inventory: readonly Item[],
): Map<Equipment['slot'], Equipment> {
    const out = new Map<Equipment['slot'], Equipment>();
    for (const item of inventory) {
        if (!isEquipment(item)) continue;
        if (out.has(item.slot)) continue;
        out.set(item.slot, item);
    }
    return out;
}

/**
 * True iff `target` is the worn item in its slot per the first-per-slot
 * convention. Returns `false` for equipment whose slot has a different
 * first-equipment entry.
 */
export function isEquippedFirstOfSlot(
    inventory: readonly Item[],
    target: Equipment,
): boolean {
    const worn = firstEquippedPerSlot(inventory).get(target.slot);
    return worn !== undefined && worn.id === target.id;
}

/**
 * Find the currently-worn equipment item in the same slot as `target`, or
 * `null` when the slot is empty / `target` is itself the worn one. Useful for
 * replace-preview UIs that need the equipment-to-be-replaced.
 */
export function findEquippedInSlot(
    inventory: readonly Item[],
    target: Equipment,
): Equipment | null {
    const worn = firstEquippedPerSlot(inventory).get(target.slot);
    if (worn === undefined) return null;
    if (worn.id === target.id) return null;
    return worn;
}
