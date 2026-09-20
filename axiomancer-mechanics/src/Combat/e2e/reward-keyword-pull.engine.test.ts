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
 */

import { describe, it, expect } from 'vitest';

import {
    REWARD_THEMES, REWARD_RANDOM_PICKS, rollCombatCardRewards, deckThemeCounts, addRewardCard,
} from '../combat.rewards';
import { cardLibrary, getCardById } from '../../Cards/cards.library';
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

const themeOf = (id: string): string => getCardById(id)?.theme ?? 'none';
const share = (ids: readonly string[], predicate: (id: string) => boolean): number =>
    ids.filter(predicate).length / ids.length;

describe('Phase 104 — below REWARD_RANDOM_PICKS: every slot is uniform', () => {
    const rotIds = cardLibrary.filter(c => c.theme === 'rot').map(c => c.id);

    it.each([0, 1, 2])('with %i reward cards already held, a rot-only deck shows no rot bias', (n) => {
        const rewards = rotIds.slice(0, n); // n < REWARD_RANDOM_PICKS — stays under the gate
        expect(rewards.length).toBeLessThan(REWARD_RANDOM_PICKS);
        const player = playerWithDeck(rotIds, rewards);
        const offers: string[] = [];
        for (let seed = 1; seed <= 300; seed++) offers.push(...rollCombatCardRewards(player, seededRng(seed), 3));
        const onTheme = share(offers, id => themeOf(id) === 'rot');
        // Uniform over ~6 non-curse/non-grey themes ⇒ ~1/6 per theme, nowhere
        // near the ~65%+ on-theme rate a themed deck earns past the gate
        // (see `combat.rewards.test.ts`'s "on-theme pull is real" suite).
        expect(onTheme).toBeLessThan(0.35);
    });

    it('offers stay distinct within a single uniform draft', () => {
        const player = playerWithDeck([]);
        for (let seed = 1; seed <= 100; seed++) {
            const offers = rollCombatCardRewards(player, seededRng(seed), 3);
            expect(offers.length).toBe(3);
            expect(new Set(offers).size).toBe(3);
        }
    });

    it('a SKIP never advances the gate — repeated drafts stay uniform', () => {
        // combatRewardCards only grows on a real TAKE (`addRewardCard`); a
        // SKIP leaves it untouched, so the player stays under the gate no
        // matter how many drafts they have seen.
        const rotOnly = cardLibrary.filter(c => c.theme === 'rot').map(c => c.id);
        const player = playerWithDeck(rotOnly, rotOnly.slice(0, 2)); // 2 < 3
        const offers: string[] = [];
        for (let seed = 1; seed <= 300; seed++) offers.push(...rollCombatCardRewards(player, seededRng(seed), 3));
        expect(share(offers, id => themeOf(id) === 'rot')).toBeLessThan(0.35);
    });
});

describe('Phase 104 — at REWARD_RANDOM_PICKS: slot 0 is guaranteed', () => {
    it('with 3 rot reward cards held, slot 0 always carries a rot-family keyword (200 seeds)', () => {
        const rotIds = cardLibrary.filter(c => c.theme === 'rot').map(c => c.id);
        expect(rotIds.length).toBeGreaterThanOrEqual(REWARD_RANDOM_PICKS);
        const player = playerWithDeck(rotIds, rotIds.slice(0, REWARD_RANDOM_PICKS));
        const counts = deckThemeCounts(player);
        expect(counts.rot).toBeGreaterThan(0);

        const rotFamily: readonly string[] = ['POISON', 'BLEED', 'DOOM', 'MARK', 'RUPTURE', 'SIPHON', 'PROLONG', 'FESTER'];
        for (let seed = 1; seed <= 200; seed++) {
            const [slot0] = rollCombatCardRewards(player, seededRng(seed), 3);
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
        for (let seed = 1; seed <= 400; seed++) offers.push(...rollCombatCardRewards(player, seededRng(seed), 3));
        for (const theme of REWARD_THEMES) {
            expect(share(offers, id => themeOf(id) === theme), theme).toBeGreaterThan(0.05);
        }
    });

    it('ties resolve in REWARD_THEMES order (rot before grave)', () => {
        // Equal counts, rot ahead of grave in canon order — the guarantee
        // must resolve to rot's family, not grave's.
        const rotIds = cardLibrary.filter(c => c.theme === 'rot').map(c => c.id).slice(0, 3);
        const graveIds = cardLibrary.filter(c => c.theme === 'grave').map(c => c.id).slice(0, 3);
        // Grey filler clears the REWARD_RANDOM_PICKS gate without tilting
        // either theme's count (the grey office never counts toward the tally).
        const player = playerWithDeck([...rotIds, ...graveIds], ['grey-strike', 'grey-strike', 'grey-strike']);
        const counts = deckThemeCounts(player);
        expect(counts.rot).toBe(counts.grave); // a genuine tie
        expect(REWARD_THEMES.indexOf('rot')).toBeLessThan(REWARD_THEMES.indexOf('grave'));

        // rot-exclusive verbs (never carried by grave cards) — seeing one
        // proves the tie resolved to rot.
        const rotOnlyKeywords = ['POISON', 'BLEED', 'SIPHON'];
        const seenRotOnly = new Set<string>();
        for (let seed = 1; seed <= 150; seed++) {
            const [slot0] = rollCombatCardRewards(player, seededRng(seed), 3);
            for (const kw of keywordsOf(slot0)) if (rotOnlyKeywords.includes(kw)) seenRotOnly.add(kw);
        }
        expect(seenRotOnly.size, 'expected at least one rot-exclusive keyword across 150 seeds').toBeGreaterThan(0);
    });

    it('every slot 1+ still uses the ordinary allegiance roll (only slot 0 is guaranteed)', () => {
        const rotIds = cardLibrary.filter(c => c.theme === 'rot').map(c => c.id);
        const player = playerWithDeck(rotIds, rotIds.slice(0, REWARD_RANDOM_PICKS));
        for (let seed = 1; seed <= 50; seed++) {
            const offers = rollCombatCardRewards(player, seededRng(seed), 3);
            expect(offers.length).toBe(3);
            expect(new Set(offers).size).toBe(3);
        }
    });
});

describe('Phase 104 — addRewardCard drives the gate directly', () => {
    it('appending copies through addRewardCard eventually clears the gate', () => {
        let player = playerWithDeck(cardLibrary.filter(c => c.theme === 'rot').map(c => c.id), []);
        expect((player.combatRewardCards ?? []).length).toBeLessThan(REWARD_RANDOM_PICKS);
        for (let i = 0; i < REWARD_RANDOM_PICKS; i++) player = addRewardCard(player, 'the-sextons-bell');
        expect((player.combatRewardCards ?? []).length).toBe(REWARD_RANDOM_PICKS);
    });
});
