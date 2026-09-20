/**
 * Hermetic engine test — Phase 104: THE KEYWORD PULL on the reward draft.
 *
 * Three regimes by reward cards TAKEN (`combatRewardCards.length`):
 *   1. fewer than `REWARD_RANDOM_PICKS` (3) — every slot UNIFORM over the pool
 *      (no theme share, no rarity weight, no guarantee); a SKIP advances nothing;
 *   2. three or more with every theme count 0 — the theme-aware roll, which an
 *      all-zero deck already reads as uniform-by-theme;
 *   3. three or more with a leader — slot 0 GUARANTEED from the dominant
 *      theme's keyword family (`THEME_KEYWORDS`), rarity-weighted; the
 *      remaining slots keep the theme-aware roll.
 */

import { describe, it, expect } from 'vitest';
import {
    COMBAT_REWARD_POOL, REWARD_RANDOM_PICKS, REWARD_THEMES, STARTING_CARD_IDS,
    cardKeywords, dominantTheme, rollCombatCardRewards,
} from '../combat.rewards';
import { THEME_KEYWORDS } from '../../Cards/card-themes';
import { cardLibrary, getCardById } from '../../Cards/cards.library';
import { rankToRarity } from '../../Cards/types';
import { Player } from '../../Character/characters.mock';
import { deepClone } from '../../Utils';
import type { Character } from '../../Character/types';

function seededRng(seed: number): () => number {
    let state = Math.abs(seed % 2147483647) || 1;
    const next = (): number => {
        state = (state * 48271) % 2147483647;
        return state / 2147483647;
    };
    for (let i = 0; i < 8; i++) next();
    return next;
}

/** A fresh grey-office player holding `taken` reward cards. */
function novice(taken: readonly string[]): Character {
    const p = deepClone(Player);
    p.knownCards = [...STARTING_CARD_IDS];
    p.combatRewardCards = [...taken];
    return p;
}

const byTheme = (theme: string): string[] => cardLibrary.filter(c => c.theme === theme).map(c => c.id);
const ROT = byTheme('rot');
const rarity = (id: string): string => rankToRarity(getCardById(id)?.rank ?? 1);

function sweep(player: Character, screens: number): string[][] {
    const out: string[][] = [];
    for (let seed = 1; seed <= screens; seed++) out.push(rollCombatCardRewards(player, seededRng(seed), 3));
    return out;
}

describe('Phase 104 — regime 1: the first three rewards taken are uniform', () => {
    it.each([0, 1, 2])('with %i reward cards held, every slot is uniform over the pool', (held) => {
        const player = novice(ROT.slice(0, held));
        const offers = sweep(player, 2000).flat();
        // Uniform ⇒ each pool card's share sits near 1/N. A chi-square over the
        // pool against the uniform expectation stays inside a generous envelope
        // (the seeded sweep is fixed, so this is exact, not flaky).
        const n = COMBAT_REWARD_POOL.length;
        const expected = offers.length / n;
        const counts = new Map<string, number>();
        for (const id of offers) counts.set(id, (counts.get(id) ?? 0) + 1);
        let chi = 0;
        for (const id of COMBAT_REWARD_POOL) chi += ((counts.get(id) ?? 0) - expected) ** 2 / expected;
        // df = n − 1 (~130); a 3σ envelope is df + 3·sqrt(2·df).
        expect(chi).toBeLessThan((n - 1) + 3 * Math.sqrt(2 * (n - 1)));
    });

    it('rares are NOT under-drawn while uniform (no rarity weight applies)', () => {
        const offers = sweep(novice([]), 1000).flat();
        const rareShareInPool = COMBAT_REWARD_POOL.filter(id => rarity(id) === 'rare').length / COMBAT_REWARD_POOL.length;
        const rareShareOffered = offers.filter(id => rarity(id) === 'rare').length / offers.length;
        expect(Math.abs(rareShareOffered - rareShareInPool)).toBeLessThan(0.05);
    });

    it('a rot-only reward history of two cards still pulls nothing (taken, not drafts, counts)', () => {
        const offers = sweep(novice(ROT.slice(0, REWARD_RANDOM_PICKS - 1)), 400).flat();
        const rotShare = offers.filter(id => getCardById(id)?.theme === 'rot').length / offers.length;
        expect(rotShare).toBeLessThan(ROT.length / COMBAT_REWARD_POOL.length + 0.05);
    });

    it('the grey office contributes nothing to the count or the tally', () => {
        expect(dominantTheme(novice([]))).toBeNull();
        expect(dominantTheme(novice(ROT.slice(0, 3)))).toBe('rot');
    });
});

describe('Phase 104 — regime 3: the dominant family is guaranteed a seat', () => {
    const rotPlayer = novice(ROT.slice(0, 3));

    it('with three rot cards held, slot 0 always carries a rot-family keyword', () => {
        const family = THEME_KEYWORDS.rot;
        for (const offers of sweep(rotPlayer, 200)) {
            expect(offers).toHaveLength(3);
            const kws = cardKeywords(offers[0]);
            expect(kws.some(k => family.includes(k)), `${offers[0]} carries [${kws.join(', ')}]`).toBe(true);
        }
    });

    it('the guaranteed slot is rarity-weighted like the rest of the draft', () => {
        const firsts = sweep(rotPlayer, 600).map(o => o[0]);
        const common = firsts.filter(id => rarity(id) === 'common').length / firsts.length;
        const rare = firsts.filter(id => rarity(id) === 'rare').length / firsts.length;
        expect(common).toBeGreaterThan(rare);
    });

    it('offers stay distinct and resolvable', () => {
        for (const offers of sweep(rotPlayer, 200)) {
            expect(new Set(offers).size).toBe(offers.length);
            for (const id of offers) expect(getCardById(id), id).toBeDefined();
        }
    });

    it('ties resolve in REWARD_THEMES (canon) order', () => {
        const debt = byTheme('debt');
        const vigil = byTheme('vigil');
        // 2 vigil + 2 debt — a tie; debt precedes vigil in canon order.
        const tied = novice([vigil[0], vigil[1], debt[0], debt[1]]);
        expect(REWARD_THEMES.indexOf('debt')).toBeLessThan(REWARD_THEMES.indexOf('vigil'));
        expect(dominantTheme(tied)).toBe('debt');
    });

    it('with three themeless (sandbox-shaped) rewards the roll is the plain theme-aware roll', () => {
        // Unknown ids tally nowhere: no dominant theme, no guarantee.
        const nobody = novice(['not-a-card-1', 'not-a-card-2', 'not-a-card-3']);
        expect(dominantTheme(nobody)).toBeNull();
        const offers = sweep(nobody, 300).flat();
        for (const t of REWARD_THEMES) {
            expect(offers.filter(id => getCardById(id)?.theme === t).length / offers.length).toBeGreaterThan(0.05);
        }
    });

    it('falls through to the plain roll when no remaining card carries the family (never empty, never throws)', () => {
        // Ask for more offers than the pool holds: once the family is
        // exhausted the later slots still fill from what remains.
        const offers = rollCombatCardRewards(rotPlayer, seededRng(9), COMBAT_REWARD_POOL.length + 5);
        expect(offers).toHaveLength(COMBAT_REWARD_POOL.length);
        expect(new Set(offers).size).toBe(offers.length);
    });
});
