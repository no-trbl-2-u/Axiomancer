/**
 * Consumable Library — the healing potions.
 *
 * Three potions: minor, normal and greater. Each heals a flat amount of
 * VITAE, half again when the drinker is under half VITAE (the
 * desperation band: a flat heal is worth the same at full health as at
 * death's door, so without it the dominant play is to hoard the flask). Prior
 * art for baking the conditional into the item is Dawncaster's Healing Potion
 * — "Gain 10 HEALTH. If you are below 50% health, gain 15 HEALTH instead"
 * (`kb:dawncaster/0796-healing-potion`, the same 1.5x).
 *
 * Consumables are drunk from the inventory tab, never in combat.
 */

import { Consumable } from './types';

/**
 * The full consumable library. Quantities default to 1 — callers (shops,
 * loot tables, debug helpers) stack as needed via `stackItem`.
 */
export const consumableLibrary: Consumable[] = [
    {
        id: 'healing-potion',
        name: 'Healing Potion',
        description: 'A clean clay flask of red liquid. Restores moderate VITAE — more when drunk on the edge of death.',
        category: 'consumable',
        healAmount: 20,
        healAmountBelowHalf: 30,
        quantity: 1,
    },
    {
        id: 'minor-healing-potion',
        name: 'Minor Healing Potion',
        description: 'A small flask, half the strength of a true healing draught. Restores a little VITAE, more to those who need it most.',
        category: 'consumable',
        healAmount: 10,
        healAmountBelowHalf: 15,
        quantity: 1,
    },
    {
        id: 'greater-healing-potion',
        name: 'Greater Healing Potion',
        description: 'A deep crimson draught in cut crystal. Restores a great deal of VITAE, and a great deal more to the badly wounded.',
        category: 'consumable',
        healAmount: 50,
        healAmountBelowHalf: 75,
        quantity: 1,
        addedIn: '2026-06-07',
        tags: ['consumable', 'healing', 'mid-game'],
    },
];

const consumableRegistry = new Map<string, Consumable>(
    consumableLibrary.map(item => [item.id, item]),
);

/** O(1) consumable lookup by ID. Returns `undefined` for unknown IDs. */
export function getConsumableById(id: string): Consumable | undefined {
    return consumableRegistry.get(id);
}
