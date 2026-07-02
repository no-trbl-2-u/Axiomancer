/**
 * Spec 07 — Loot table tests.
 *
 * `rollLoot` uses pluggable RNG so the table → outcome mapping can be
 * checked exactly with scripted values.
 */

import { describe, it, expect } from 'vitest';
import { rollLoot, rollLootMany } from './loot';
import { LootTableEntry } from './types';
import { Item } from '../Items/types';

const potion: Item = {
    id: 'p', name: 'Potion', description: '...', category: 'consumable',
    quantity: 1, healAmount: 5,
};
const elixir: Item = {
    id: 'e', name: 'Elixir', description: '...', category: 'consumable',
    quantity: 1, healAmount: 20,
};

describe('rollLoot', () => {
    it('returns null for an empty / undefined table', () => {
        expect(rollLoot(undefined)).toBeNull();
        expect(rollLoot([])).toBeNull();
    });

    it('returns null buckets when the dice land on no-drop slots', () => {
        const table: LootTableEntry[] = [
            { item: null,   weight: 80 },
            { item: potion, weight: 20 },
        ];
        // Roll lands at weight 40 → first bucket (null).
        expect(rollLoot(table, () => 0.4)).toBeNull();
    });

    it('returns the matched item bucket', () => {
        const table: LootTableEntry[] = [
            { item: null,   weight: 80 },
            { item: potion, weight: 20 },
        ];
        // Roll lands at weight 90 → second bucket (potion).
        expect(rollLoot(table, () => 0.9)).toBe(potion);
    });

    it('ignores zero / negative weight entries', () => {
        const table: LootTableEntry[] = [
            { item: potion, weight: 0 },
            { item: elixir, weight: 1 },
        ];
        expect(rollLoot(table, () => 0.5)).toBe(elixir);
    });

    it('rollLootMany returns only non-null drops', () => {
        const table: LootTableEntry[] = [
            { item: null,   weight: 50 },
            { item: potion, weight: 50 },
        ];
        // Alternating rolls: null, potion, null, potion ...
        let i = 0;
        const rng = () => (i++ % 2 === 0 ? 0.2 : 0.8);
        const out = rollLootMany(table, 4, rng);
        expect(out).toEqual([potion, potion]);
    });
});
