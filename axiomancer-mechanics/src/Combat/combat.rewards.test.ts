/**
 * The reward draft — the post-combat 1-of-3 (D44).
 *
 * The contract this file pins:
 *   · determinism — same player + same seeded rng ⇒ same offers, always;
 *   · offers are always distinct and always resolvable;
 *   · every pool card is reachable (a uniform draw, no steering);
 *   · a request larger than the pool returns the whole pool, never a repeat.
 *
 * The theme pull, the keyword guarantee and the rarity weights were cut in
 * R7b (D50); their suites went with them.
 */

import { describe, it, expect } from 'vitest';

import {
    COMBAT_REWARD_POOL, STARTING_CARD_IDS, addRewardCard, rollCombatCardRewards,
} from './combat.rewards';
import { cardLibrary, getCardById } from '../Cards/cards.library';
import { Player } from '../Character/characters.mock';
import { deepClone } from '../Utils';
import type { Character } from '../Character/types';

function seededRng(seed: number): () => number {
    let state = seed % 2147483647 || 1;
    return () => {
        state = (state * 48271) % 2147483647;
        return state / 2147483647;
    };
}

function greyPlayer(): Character {
    return { ...deepClone(Player), knownCards: [...STARTING_CARD_IDS], combatRewardCards: [] };
}

describe('the reward pool', () => {
    it('is the whole library, every id resolving', () => {
        expect([...COMBAT_REWARD_POOL].sort()).toEqual(cardLibrary.map(c => c.id).sort());
        for (const id of COMBAT_REWARD_POOL) expect(getCardById(id), id).toBeDefined();
    });
});

describe('rollCombatCardRewards', () => {
    it('is deterministic for a seed', () => {
        const a = rollCombatCardRewards(greyPlayer(), seededRng(4242), 3);
        const b = rollCombatCardRewards(greyPlayer(), seededRng(4242), 3);
        expect(a).toEqual(b);
    });

    it('offers distinct, resolvable pool cards', () => {
        for (let seed = 1; seed <= 50; seed++) {
            const offers = rollCombatCardRewards(greyPlayer(), seededRng(seed), 2);
            expect(new Set(offers).size).toBe(offers.length);
            for (const id of offers) expect(COMBAT_REWARD_POOL).toContain(id);
        }
    });

    it('reaches every pool card as a single offer', () => {
        const seen = new Set<string>();
        for (let i = 0; i < 20; i++) {
            seen.add(rollCombatCardRewards(greyPlayer(), () => i / 20, 1)[0]);
        }
        expect([...seen].sort()).toEqual([...COMBAT_REWARD_POOL].sort());
    });

    it('caps at the pool size, never repeating a card', () => {
        const offers = rollCombatCardRewards(greyPlayer(), seededRng(9), COMBAT_REWARD_POOL.length + 25);
        expect(offers.length).toBe(COMBAT_REWARD_POOL.length);
        expect(new Set(offers).size).toBe(offers.length);
    });
});

describe('addRewardCard', () => {
    it('appends the pick to the persistent reward collection', () => {
        const rewarded = addRewardCard(greyPlayer(), COMBAT_REWARD_POOL[0]);
        expect(rewarded.combatRewardCards).toEqual([COMBAT_REWARD_POOL[0]]);
    });
});
