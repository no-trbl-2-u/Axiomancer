/**
 * Hermetic E2E — Phase 104: the reward-draft keyword pull.
 *
 * `rollCombatCardRewards` (see `combat.rewards.ts`) has two regimes gated on
 * `combatRewardCards.length`:
 *
 *   - Fewer than `REWARD_RANDOM_PICKS` (3) reward cards TAKEN: every slot is
 *     a flat uniform draw — no theme lean, no rarity lean, regardless of
 *     `knownCards`.
 *   - `REWARD_RANDOM_PICKS` or more: slot 0 is GUARANTEED a card whose
 *     `keywordsOf` overlaps the deck's dominant theme's family (ties in
 *     `REWARD_THEMES` canon order; an all-zero tally earns no guarantee —
 *     every slot falls back to the ordinary theme-aware roll).
 *
 * Pins:
 *   - uniform below the gate, even for a heavily single-themed `knownCards`;
 *   - distinct offers per draft under BOTH regimes;
 *   - the guaranteed slot fires reliably once the gate is cleared;
 *   - ties resolve in `REWARD_THEMES` order;
 *   - an all-zero tally never guarantees (offers spread across themes, same
 *     as the uncommitted-deck case `combat.rewards.test.ts` already pins);
 *   - the grey office never counts toward the tally.
 *
 * Card purge (P1, 2026-09-27): the pinned pool is the grey office, which
 * carries no reward theme, so the themed candidates are SANDBOX fixtures fed
 * through the roll's own `extraPool` hook (WS6.2): three ROT cards landing
 * BLEED and three VIGIL cards printing GUARD (BLEED since R5 swept MARK from
 * the rot family, D45). The roll under test is
 * unchanged; only its candidates are synthetic.
 */

import { describe, it, expect } from 'vitest';

import {
    REWARD_THEMES, REWARD_RANDOM_PICKS, rollCombatCardRewards, deckThemeCounts, addRewardCard,
} from '../combat.rewards';
import { getCardById } from '../../Cards/cards.library';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import type { Card } from '../../Cards/types';
import type { CardTheme } from '../../Cards/card-themes';
import { keywordsOf } from '../../Cards';
import { Player } from '../../Character/characters.mock';
import { deepClone } from '../../Utils';
import type { Character } from '../../Character/types';

/** Local Park-Miller LCG, burned in 8 draws — same convention as
 *  `combat.rewards.test.ts` (a bare seed sweep near-monotonically favours
 *  the first branch for the first few small seeds). */
function seededRng(seed: number): () => number {
    let state = Math.abs(seed % 2147483647) || 1;
    const next = (): number => {
        state = (state * 48271) % 2147483647;
        return state / 2147483647;
    };
    for (let i = 0; i < 8; i++) next();
    return next;
}

function playerWithDeck(cardIds: readonly string[], rewardIds: readonly string[] = []): Character {
    const player = deepClone(Player);
    player.knownCards = [...cardIds];
    player.combatRewardCards = [...rewardIds];
    return player;
}

function fixture(id: string, theme: CardTheme): Card {
    const base = {
        id, theme, name: id, description: 'reward keyword-pull fixture',
        tier: 1 as const, rank: 1 as const, cardType: 'spell' as const,
    };
    return theme === 'rot'
        ? {
            ...base, color: 'body', targetType: 'enemy', free: { damage: 1 },
            combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 3 }],
        }
        : {
            ...base, color: 'heart', targetType: 'self', free: { guard: 1 },
            specialMechanics: [{ kind: 'guard', amount: 4 }],
        };
}

const rotIds = ['qa-pull-rot-a', 'qa-pull-rot-b', 'qa-pull-rot-c'];
const vigilIds = ['qa-pull-vigil-a', 'qa-pull-vigil-b', 'qa-pull-vigil-c'];
registerSandboxCards([
    ...rotIds.map(id => fixture(id, 'rot')),
    ...vigilIds.map(id => fixture(id, 'vigil')),
]);
/** The themed candidates, injected beside the pinned (grey) pool. */
const EXTRA: readonly string[] = [...rotIds, ...vigilIds];
const roll = (player: Character, seed: number): string[] =>
    rollCombatCardRewards(player, seededRng(seed), 3, EXTRA);

const themeOf = (id: string): string => getCardById(id)?.theme ?? 'none';
const share = (ids: readonly string[], predicate: (id: string) => boolean): number =>
    ids.filter(predicate).length / ids.length;

describe('Phase 104 — below REWARD_RANDOM_PICKS: every slot is uniform', () => {
    it('the fixtures join the grey pool and carry the families under test', () => {
        const player = playerWithDeck([]);
        const seen = new Set<string>();
        for (let seed = 1; seed <= 200; seed++) for (const id of roll(player, seed)) seen.add(id);
        for (const id of EXTRA) expect(seen.has(id), id).toBe(true);
        expect(seen.has('grey-strike')).toBe(true);
        for (const id of rotIds) expect(keywordsOf(id)).toContain('BLEED');
        for (const id of vigilIds) expect(keywordsOf(id)).toContain('GUARD');
    });

    it.each([0, 1, 2])('with %i reward cards already held, a rot-only deck shows no rot bias', (n) => {
        const rewards = rotIds.slice(0, n); // n < REWARD_RANDOM_PICKS — stays under the gate
        expect(rewards.length).toBeLessThan(REWARD_RANDOM_PICKS);
        const player = playerWithDeck(rotIds, rewards);
        const offers: string[] = [];
        for (let seed = 1; seed <= 300; seed++) offers.push(...roll(player, seed));
        const onTheme = share(offers, id => themeOf(id) === 'rot');
        // Uniform over the 9-card pool (3 grey + 3 rot + 3 vigil) ⇒ rot sits
        // near its 1/3 pool share, nowhere near the slot-0 guarantee a
        // themed deck earns past the gate (see the next suite).
        expect(Math.abs(onTheme - 1 / 3)).toBeLessThan(0.08);
    });

    it('offers stay distinct within a single uniform draft', () => {
        const player = playerWithDeck([]);
        for (let seed = 1; seed <= 100; seed++) {
            const offers = roll(player, seed);
            expect(offers.length).toBe(3);
            expect(new Set(offers).size).toBe(3);
        }
    });

    it('a SKIP never advances the gate — repeated drafts stay uniform', () => {
        // combatRewardCards only grows on a real TAKE (`addRewardCard`); a
        // SKIP leaves it untouched, so the player stays under the gate no
        // matter how many drafts they have seen.
        const player = playerWithDeck(rotIds, rotIds.slice(0, 2)); // 2 < 3
        const offers: string[] = [];
        for (let seed = 1; seed <= 300; seed++) offers.push(...roll(player, seed));
        expect(Math.abs(share(offers, id => themeOf(id) === 'rot') - 1 / 3)).toBeLessThan(0.08);
        // … and slot 0 is NOT pinned to rot below the gate.
        const slot0s = Array.from({ length: 300 }, (_, i) => roll(player, i + 1)[0]);
        expect(slot0s.some(id => themeOf(id) !== 'rot')).toBe(true);
    });
});

describe('Phase 104 — at REWARD_RANDOM_PICKS: slot 0 is guaranteed', () => {
    it('with 3 rot reward cards held, slot 0 always carries a rot-family keyword (200 seeds)', () => {
        expect(rotIds.length).toBeGreaterThanOrEqual(REWARD_RANDOM_PICKS);
        const player = playerWithDeck(rotIds, rotIds.slice(0, REWARD_RANDOM_PICKS));
        const counts = deckThemeCounts(player);
        expect(counts.rot).toBeGreaterThan(0);

        const rotFamily: readonly string[] = ['BLEED'];
        for (let seed = 1; seed <= 200; seed++) {
            const [slot0] = roll(player, seed);
            const kws = keywordsOf(slot0);
            const overlaps = kws.some(kw => rotFamily.includes(kw));
            expect(overlaps, `seed ${seed}: ${slot0} (${kws.join(',')})`).toBe(true);
        }
    });

    it('an all-zero tally earns no guarantee — offers spread across themes, not one', () => {
        // Grey cards never tilt the count: fill the reward-card floor with
        // them so the gate is cleared but every REWARD_THEMES count stays 0.
        const player = playerWithDeck([], ['grey-strike', 'grey-strike', 'grey-strike']);
        expect(deckThemeCounts(player)).toEqual(Object.fromEntries(REWARD_THEMES.map(t => [t, 0])));
        const offers: string[] = [];
        for (let seed = 1; seed <= 400; seed++) offers.push(...roll(player, seed));
        // Every theme the pool actually stocks (rot, vigil, and the themeless
        // grey office) is offered — no single family captures the screen.
        for (const theme of ['rot', 'vigil', 'grey']) {
            expect(share(offers, id => themeOf(id) === theme), theme).toBeGreaterThan(0.05);
        }
    });

    it('ties resolve in REWARD_THEMES order (rot before vigil)', () => {
        // Equal counts, rot ahead of vigil in canon order — the guarantee
        // must resolve to rot's family, not vigil's.
        // Grey filler clears the REWARD_RANDOM_PICKS gate without tilting
        // either theme's count (the grey office never counts toward the tally).
        const player = playerWithDeck([...rotIds, ...vigilIds], ['grey-strike', 'grey-strike', 'grey-strike']);
        const counts = deckThemeCounts(player);
        expect(counts.rot).toBe(counts.vigil); // a genuine tie
        expect(REWARD_THEMES.indexOf('rot')).toBeLessThan(REWARD_THEMES.indexOf('vigil'));

        // BLEED is rot's whole family and the vigil fixtures never print it;
        // a vigil resolution would also admit their GUARD cards — so every
        // slot 0 carrying BLEED proves the tie resolved to rot.
        for (let seed = 1; seed <= 150; seed++) {
            const [slot0] = roll(player, seed);
            expect(keywordsOf(slot0), `seed ${seed}: ${slot0}`).toContain('BLEED');
        }
    });

    it('every slot 1+ still uses the ordinary allegiance roll (only slot 0 is guaranteed)', () => {
        const player = playerWithDeck(rotIds, rotIds.slice(0, REWARD_RANDOM_PICKS));
        let offThemeLater = 0;
        for (let seed = 1; seed <= 50; seed++) {
            const offers = roll(player, seed);
            expect(offers.length).toBe(3);
            expect(new Set(offers).size).toBe(3);
            offThemeLater += offers.slice(1).filter(id => themeOf(id) !== 'rot').length;
        }
        expect(offThemeLater).toBeGreaterThan(0);
    });
});

describe('Phase 104 — addRewardCard drives the gate directly', () => {
    it('appending copies through addRewardCard eventually clears the gate', () => {
        let player = playerWithDeck(rotIds, []);
        expect((player.combatRewardCards ?? []).length).toBeLessThan(REWARD_RANDOM_PICKS);
        for (let i = 0; i < REWARD_RANDOM_PICKS; i++) player = addRewardCard(player, 'grey-strike');
        expect((player.combatRewardCards ?? []).length).toBe(REWARD_RANDOM_PICKS);
    });
});
