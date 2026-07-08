/**
 * Hermetic E2E — the spec 32 v3 pricing LINT (§4, ledger #1-2).
 *
 * Every SPELL's `scoreCard` total must land inside a tolerant band for its
 * printed rank. The bands are deliberately loose — `/deck-tuning` is the
 * empirical court — but tight enough to catch rank dishonesty in either
 * direction (a rank-5 card scoring 2, a Doxa scoring 14).
 *
 * Enchantments and disenchants are engine text (persistent rule rewrites,
 * priced by hand under the min-4-triggers law) — they are skipped here but
 * pinned structurally by curated-library.engine.test.ts.
 */

import { describe, it, expect } from 'vitest';

import { cardLibrary } from '../cards.library';
import { rankToRarity } from '../types';
import {
    scoreCard, statusPoints, dotLifetimeHp,
    VERB_POINTS, CONDITION_DISCOUNTS,
} from '../cards.pricing';

/**
 * Point bands per rank pair (spec §4, widened where the shipped library
 * demanded it):
 *   - Doxa/Lemma (1-2):    1.5 – 7.5
 *   - Thesis/Theorem (3-4): 4.5 – 13
 *   - Axiom (5):            7 – 19. Spec's sketch said 8, but shipped rank-5
 *     spells price honestly outside it under the table: at the FLOOR,
 *     `pact-of-akrasia` (7.25: the forge is cheap BECAUSE the blood credits
 *     bite) and `heart-of-the-matter` (7.33: SWAY at 0.8/stack undervalues
 *     CAPITULATE proximity); at the CEILING, two DELIBERATE big finishers —
 *     `resonance-detonation` (18.13) and `the-overtake` (18.35) — are authored
 *     over the sketch on purpose (owner directive: a payoff worth cashing your
 *     own board for). Band adjusted, not the cards (task rule); a rank-5
 *     scoring 2 still fails loudly.
 * Rank 6 (Aporia) never appears: every Aporia card is a disenchant.
 */
const RANK_BANDS: Record<'common' | 'uncommon' | 'rare', [number, number]> = {
    common: [1.5, 7.5],
    uncommon: [4.5, 13],
    rare: [7, 19],
};

const spells = cardLibrary.filter(c => c.cardType === 'spell');

describe('pricing lint — every spell lands in its rank band', () => {
    it('covers all 50 spells (the enchant/disenchant 20 are engine text)', () => {
        expect(spells.length).toBe(50);
    });

    it.each(spells.map(s => [s.id, s] as const))('%s scores within its band', (_id, card) => {
        const [lo, hi] = RANK_BANDS[rankToRarity(card.rank)];
        const pts = scoreCard(card);
        expect(pts, `${card.id} (rank ${card.rank}) scored ${pts.toFixed(2)} — below ${lo}`)
            .toBeGreaterThanOrEqual(lo);
        expect(pts, `${card.id} (rank ${card.rank}) scored ${pts.toFixed(2)} — above ${hi}`)
            .toBeLessThanOrEqual(hi);
    });

    it('scoring is monotone with rank on average (rank honesty, coarse)', () => {
        const avg = (rank1: number, rank2: number) => {
            const pool = spells.filter(s => s.rank === rank1 || s.rank === rank2);
            return pool.reduce((n, s) => n + scoreCard(s), 0) / pool.length;
        };
        const common = avg(1, 2);
        const uncommon = avg(3, 4);
        const rare = avg(5, 6);
        expect(uncommon).toBeGreaterThan(common);
        expect(rare).toBeGreaterThan(uncommon);
    });

    it('enchantments and disenchants score 0 (engine text, not point-priced)', () => {
        for (const card of cardLibrary.filter(c => c.cardType !== 'spell')) {
            expect(scoreCard(card)).toBe(0);
        }
    });
});

describe('pricing table — pinned anchors from the spec §4 arithmetic', () => {
    it('poison i1 d4 prints the honest ramp curve "2,2,3,3 = 10"', () => {
        expect(dotLifetimeHp('debuff_poison', 1, 4)).toBe(10);
    });

    it('bleed decays 1 intensity per tick (i2 d2 = 6 + 3 = 9)', () => {
        expect(dotLifetimeHp('debuff_bleed', 2, 2)).toBe(9);
    });

    it('non-DoT statuses price at 0.75 per intensity-turn', () => {
        expect(statusPoints('debuff_mark', 1, 2)).toBeCloseTo(1.5);      // MARK d2
        expect(statusPoints('debuff_backfire', 1, 2)).toBeCloseTo(1.5);  // BACKFIRE i1 d2
        expect(statusPoints('debuff_rapport', 1, 2)).toBeCloseTo(1.5);   // RAPPORT i1 d2
        expect(statusPoints('buff_thorns', 3, 2)).toBeCloseTo(4.5);      // THORNS i3 d2
    });

    it('the spec point table constants are pinned', () => {
        expect(VERB_POINTS.draw).toBe(2);
        expect(VERB_POINTS.guardPerHp).toBeCloseTo(1 / 4);
        expect(VERB_POINTS.barrierPerHp).toBeCloseTo(1 / 3);
        expect(VERB_POINTS.healPerHp).toBeCloseTo(1 / 3);
        expect(VERB_POINTS.cleanse).toBe(1.5);
        expect(VERB_POINTS.swayPerStack).toBe(0.8);
        expect(VERB_POINTS.staggerPerRung).toBe(2); // full 2-rung deny = 4
        expect(VERB_POINTS.foretellPerCard).toBe(1);
        expect(VERB_POINTS.premise).toBe(0.8);
        expect(VERB_POINTS.soul).toBe(0.75);
        expect(VERB_POINTS.kindle).toBe(2.5);
        expect(VERB_POINTS.pip).toBe(1.5);
        expect(VERB_POINTS.forgeFloating).toBe(5);
        expect(VERB_POINTS.rupture).toBe(4);
        expect(VERB_POINTS.reapAll).toBe(5);
        expect(VERB_POINTS.conviction).toBe(1);
        expect(VERB_POINTS.tickOne).toBe(0.6);
        expect(CONDITION_DISCOUNTS.threshold).toBe(0.5);
        expect(CONDITION_DISCOUNTS.dieBonus).toBe(0.6);
        expect(CONDITION_DISCOUNTS.fate).toBe(0.7);
        expect(CONDITION_DISCOUNTS.fallen).toBe(0.5);
    });

    it('the starter pair prices at its authored comments (regression anchors)', () => {
        const slipperySlope = spells.find(s => s.id === 'slippery-slope')!;
        // poison lifetime 10/3 + FREE tick 0.6 = 3.93
        expect(scoreCard(slipperySlope)).toBeCloseTo(10 / 3 + 0.6, 2);
        const brace = spells.find(s => s.id === 'brace-for-impact')!;
        // Guard 8/4 + FREE guard 2/4 = 2.5
        expect(scoreCard(brace)).toBeCloseTo(2.5, 2);
    });
});
