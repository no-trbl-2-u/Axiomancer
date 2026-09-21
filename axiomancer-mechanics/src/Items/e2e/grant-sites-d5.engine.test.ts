/**
 * D5 routing at the engine grant sites — hermetic E2E.
 *
 * The brief asks that `rollCacheReward` be VERIFIED rather than assumed to be
 * consumables-only, and that the reward-screen predicate be checked against
 * what each engine grant site can actually produce. These tests pin that: they
 * fail the day a loot surface starts minting signet relics, which is exactly
 * when the routing decision would need revisiting.
 */

import { describe, it, expect } from 'vitest';

import { rollCacheReward } from '../cache-reward';
import { consumableLibrary } from '../consumable.library';
import { relicLibrary } from '../relic.library';
import { buyItem } from '../shop.reducer';
import { qualifiesForItemRewardScreen } from '../item-grant';
import { createCharacter } from '../../Character/index';
import type { CacheLootTier } from '../cache-reward';
import type { Character } from '../../Character/types';
import type { Consumable } from '../types';

const player = (currency = 100): Character =>
    createCharacter({
        name: 'Buyer',
        level: 1,
        baseStats: { body: 1, mind: 1, heart: 1 },
        currency,
    });

describe('rollCacheReward — consumables only, so The Reliquary rarely earns the reward screen', () => {
    it('never yields equipment across a wide seed sweep', () => {
        const tiers: CacheLootTier[] = ['modest', 'rich'];
        let rolled = 0;
        for (const tier of tiers) {
            for (let seed = 1; seed <= 200; seed++) {
                for (const item of rollCacheReward({ playerLevel: 3, seed, tier })) {
                    rolled++;
                    expect(item.category).toBe('consumable');
                    expect(qualifiesForItemRewardScreen(item)).toBe(false);
                }
            }
        }
        expect(rolled).toBeGreaterThan(0);
    });
});

describe('the consumable library carries nothing the reward screen should claim', () => {
    it('no consumable qualifies under D5', () => {
        expect(consumableLibrary.length).toBeGreaterThan(0);
        for (const c of consumableLibrary) {
            expect(qualifiesForItemRewardScreen(c)).toBe(false);
        }
    });
});

describe('the relic library is exactly the set D5 routes to the screen', () => {
    it('every signet relic qualifies', () => {
        expect(relicLibrary.length).toBeGreaterThan(0);
        for (const r of relicLibrary) {
            expect(qualifiesForItemRewardScreen(r)).toBe(true);
        }
    });
});

describe('buyItem — routed through the shared grant path without changing shop semantics', () => {
    const potion = (id = 'shop-draught'): Consumable => ({
        id,
        name: 'Draught',
        description: 'A test draught.',
        category: 'consumable',
        quantity: 1,
        healAmount: 10,
    });

    it('charges the price and clones the ware', () => {
        const source = potion();
        const after = buyItem(player(100), source, 30);
        expect(after.currency).toBe(70);
        expect(after.inventory).toHaveLength(1);
        expect(after.inventory[0]).not.toBe(source);
        expect(after.inventory[0]!.id).toBe('shop-draught');
    });

    it('still adds a SECOND row for a repeat purchase (no stacking) — semantics unchanged', () => {
        let c = buyItem(player(100), potion(), 10);
        c = buyItem(c, potion(), 10);
        expect(c.inventory.filter(i => i.id === 'shop-draught')).toHaveLength(2);
        expect(c.currency).toBe(80);
    });

    it('refuses a negative price and an unaffordable ware, unchanged', () => {
        const p = player(5);
        expect(buyItem(p, potion(), -1)).toBe(p);
        expect(buyItem(p, potion(), 50)).toBe(p);
    });
});
