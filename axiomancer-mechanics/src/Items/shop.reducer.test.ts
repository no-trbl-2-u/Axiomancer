/**
 * Unit tests — shop reducers (Phase 37).
 *
 * The hermetic e2e at `src/Items/e2e/shop.engine.test.ts` drives the
 * reducers through the `village` MapEvent surface; these tests pin the
 * reducer behaviour in isolation.
 */

import { describe, it, expect } from 'vitest';
import { buyItem, sellItem, defaultSellPrice } from './shop.reducer';
import type { Character } from '../Character/types';
import type { Consumable } from './types';
import type { ShopWare } from './shop.types';

function freshCharacter(overrides: Partial<Character> = {}): Character {
    return {
        id: 'char-test',
        name: 'Buyer',
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        health: 10,
        maxHealth: 10,
        baseStats: { heart: 1, body: 1, mind: 1 },
        derivedStats: {
            physicalAttack: 1, physicalSkill: 1, physicalDefense: 1,
            mentalAttack: 1, mentalSkill: 1, mentalDefense: 1,
            emotionalAttack: 1, emotionalSkill: 1, emotionalDefense: 1,
            luck: 1,
        },
        nonCombatStats: {
            physicalSave: 1, physicalTest: 1,
            mentalSave: 1, mentalTest: 1,
            emotionalSave: 1, emotionalTest: 1,
        },
        inventory: [],
        currency: 0,
        equipment: {},
        effects: [],
        knownSkills: [],
        availableStatPoints: 0,
        ...overrides,
    };
}

function potion(id = 'healing-potion'): Consumable {
    return {
        id,
        name: 'Healing Potion',
        description: 'Test',
        category: 'consumable',
        healAmount: 20,
        quantity: 1,
    };
}

describe('buyItem', () => {
    it('decrements currency and appends a cloned item when affordable', () => {
        const player = freshCharacter({ currency: 50 });
        const ware = potion();
        const next = buyItem(player, ware, 20);

        expect(next.currency).toBe(30);
        expect(next.inventory).toHaveLength(1);
        expect(next.inventory[0].id).toBe('healing-potion');
        // deepClone — mutating the inventory entry doesn't bleed back into the ware.
        (next.inventory[0] as Consumable).quantity = 99;
        expect((ware as Consumable).quantity).toBe(1);
        // Input character unchanged.
        expect(player.currency).toBe(50);
        expect(player.inventory).toHaveLength(0);
    });

    it('returns the character unchanged when funds are insufficient', () => {
        const player = freshCharacter({ currency: 10 });
        const next = buyItem(player, potion(), 20);
        expect(next).toBe(player);
    });

    it('returns the character unchanged on a negative price', () => {
        const player = freshCharacter({ currency: 50 });
        const next = buyItem(player, potion(), -5);
        expect(next).toBe(player);
    });
});

describe('sellItem', () => {
    it('increments currency and removes the matching inventory entry', () => {
        const player = freshCharacter({ currency: 5, inventory: [potion()] });
        const next = sellItem(player, 'healing-potion', 10);
        expect(next.currency).toBe(15);
        expect(next.inventory).toHaveLength(0);
        // Input unchanged.
        expect(player.currency).toBe(5);
        expect(player.inventory).toHaveLength(1);
    });

    it('returns the character unchanged when the item is not in inventory', () => {
        const player = freshCharacter({ currency: 5, inventory: [potion()] });
        const next = sellItem(player, 'nonexistent', 10);
        expect(next).toBe(player);
    });

    it('returns the character unchanged on a negative price', () => {
        const player = freshCharacter({ currency: 5, inventory: [potion()] });
        const next = sellItem(player, 'healing-potion', -5);
        expect(next).toBe(player);
    });

    it('only removes one stack entry when duplicates are present', () => {
        const player = freshCharacter({
            currency: 0,
            inventory: [potion(), potion()],
        });
        const next = sellItem(player, 'healing-potion', 7);
        expect(next.inventory).toHaveLength(1);
        expect(next.currency).toBe(7);
    });
});

describe('defaultSellPrice (Phase 37 exploit-fix)', () => {
    // The CLI shopLoop used to call `Math.max(1, Math.floor(price/2))` for
    // displayed sell prices. That formula yielded sellPrice >= buyPrice
    // for any ware with price <= 2 (price 1 → sell 1, price 2 → sell 1),
    // enabling a small infinite-money loop on any future ware that
    // happened to land at the low end. The engine-tier defaultSellPrice
    // helper drops the `Math.max(1, ...)` floor.

    const ware = (price: number): ShopWare => ({ itemId: 'x', price });

    it('halves and floors the ware price', () => {
        expect(defaultSellPrice(ware(12))).toBe(6);
        expect(defaultSellPrice(ware(7))).toBe(3);
        expect(defaultSellPrice(ware(2))).toBe(1);
        expect(defaultSellPrice(ware(1))).toBe(0);
        expect(defaultSellPrice(ware(0))).toBe(0);
    });

    it('always produces a sell price strictly less than the buy price for any positive integer', () => {
        // Forecloses the infinite-money exploit: every buy → sell round-trip
        // must be net-negative for the player.
        for (let price = 1; price <= 100; price += 1) {
            const sellPrice = defaultSellPrice(ware(price));
            expect(sellPrice).toBeLessThan(price);
        }
    });
});
