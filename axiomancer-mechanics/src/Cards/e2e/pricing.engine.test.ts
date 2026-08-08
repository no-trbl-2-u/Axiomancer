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
    scoreCard, statusPoints, dotLifetimeHp, dotTempoWeightedHp,
    VERB_POINTS, CONDITION_DISCOUNTS, DOT_TEMPO_SURVIVAL,
} from '../cards.pricing';

/**
 * Point bands per rank pair (spec §4, widened where the shipped library
 * demanded it):
 *   - Doxa/Lemma (1-2):    1.5 – 7.5
 *   - Thesis/Theorem (3-4): 4.5 – 13
 *   - Axiom (5):            7 – 19. Spec's sketch said 8, but shipped rank-5
 *     spells price honestly outside it under the table: at the FLOOR,
 *     `pact-of-akrasia` (7.25: the forge is cheap BECAUSE the blood credits
 *     bite) and `the-closing-word` (pre-36a 8.80: the CONCEDE alt-win priced
 *     at 0 — 36a's +3 concede capstone lifts it to 11.80, more rank-honest for
 *     a card that literally wins the game); at the CEILING, two DELIBERATE
 *     big finishers —
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
    it('covers all 65 spells (the enchant/disenchant 21 are engine text; 50→55 via the D8 valve ledger, 55→64 via the 2026-07-19 promotions, 64→65 via phase 39)', () => {
        // Phase D8 ten-in/ten-out: 9 valve spells + 1 valve enchantment in,
        // 4 spells + 2 enchantments + 4 disenchants out (the reward-only ten).
        // 2026-07-19: nine promoted swap-pool spells in (no passives).
        // Phase 39 (2026-08-08): seven theme-symmetry restorations in — six
        // enchant/disenchant + one spell (heart-of-the-matter).
        expect(spells.length).toBe(65);
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

describe('pricing table — pinned anchors from the spec §4 arithmetic (WS3.5 clock pricing)', () => {
    it('poison i1 d4 prices its card-played clock at the D3 realized 1.83 cadence (spec 33 D4)', () => {
        // D4 (spec 33 §7 D4 note): the card-played clock is re-derived from the
        // WS3.3 ~2-plays estimate to D3's measured 1.83 PAID plays/round. Ramp
        // per round 2,2,3,3 × 1.83 ticks = 18.3 (was 20). Pricing-local: the
        // engine's own forecast (EXPECTED_TRIGGERS_PER_ROUND) still reads 2.
        expect(dotLifetimeHp('debuff_poison', 1, 4)).toBeCloseTo((2 + 2 + 3 + 3) * 1.83, 4);
    });

    it('bleed decays 1 intensity per tick and washes out (i2 d2 = 6 + 3 = 9 on ANY clock)', () => {
        // BLEED is decay-limited: the damage-instance clock changes WHEN the
        // 9 HP lands (faster), not HOW MUCH — the lifetime anchor holds.
        expect(dotLifetimeHp('debuff_bleed', 2, 2)).toBe(9);
        expect(dotLifetimeHp('debuff_bleed', 3, 2)).toBe(18); // i3: 9+6+3
    });

    it('creeping doom (WS3.4) prices growth over the no-calendar horizon (i2 → 2+3+4+5 = 14)', () => {
        expect(dotLifetimeHp('debuff_creeping_doom', 2, 3)).toBe(14);
    });

    // ── Phase 36b — the tempo horizon (dotTempoWeightedHp) ────────────────────
    it('phase 36b — DOT_TEMPO_SURVIVAL is the ~4-round global death-clock horizon', () => {
        expect(DOT_TEMPO_SURVIVAL).toBe(0.75);
        // mean fight length 1/(1-p) = 4.0 ≈ measured avgRoundsAll ≈ 4.06.
        expect(1 / (1 - DOT_TEMPO_SURVIVAL)).toBeCloseTo(4, 2);
    });

    it('phase 36b — a RAMP (poison i1 d4) is discounted: printed 18.3 → weighted 11.81 (spec 33 D4)', () => {
        // D4: per-round base 2,2,3,3 × the 1.83 card-played cadence, each round
        // discounted by the geometric tempo weight 1, 0.75, 0.5625, 0.421875:
        // 1.83 × (2 + 1.5 + 1.6875 + 1.265625) = 11.81.
        const p = DOT_TEMPO_SURVIVAL;
        const expected = 1.83 * (2 * 1 + 2 * p + 3 * p ** 2 + 3 * p ** 3);
        expect(dotTempoWeightedHp('debuff_poison', 1, 4)).toBeCloseTo(expected, 4);
        expect(dotTempoWeightedHp('debuff_poison', 1, 4)).toBeCloseTo(11.81, 2);
        // strictly below the printed lifetime — the reprice is a pure discount.
        expect(dotTempoWeightedHp('debuff_poison', 1, 4))
            .toBeLessThan(dotLifetimeHp('debuff_poison', 1, 4));
    });

    it('phase 36b — a FRONT-LOADED DoT (bleed) is tempo-immune (washes out in-horizon)', () => {
        // BLEED decays per tick and washes out inside rounds 1-2, so every tick
        // lands at weight ~1 — printed lifetime == tempo-weighted lifetime.
        expect(dotTempoWeightedHp('debuff_bleed', 2, 2)).toBe(dotLifetimeHp('debuff_bleed', 2, 2)); // 9
        // i3 spills ONE tick (3 HP) into round 2 → a 4% haircut, no more.
        expect(dotTempoWeightedHp('debuff_bleed', 3, 2)).toBeCloseTo(15 + 3 * DOT_TEMPO_SURVIVAL, 2); // 17.25
    });

    it('phase 36b — growth+no-calendar doom is discounted HARDEST (biggest ticks latest)', () => {
        // i2 grows 2,3,4,5 over the 4-round no-calendar horizon; the geometric
        // weight bites the late big ticks: 2 + 2.25 + 2.25 + 2.109 = 8.61 (−38%).
        const p = DOT_TEMPO_SURVIVAL;
        expect(dotTempoWeightedHp('debuff_creeping_doom', 2, 3))
            .toBeCloseTo(2 + 3 * p + 4 * p ** 2 + 5 * p ** 3, 4);
        expect(dotTempoWeightedHp('debuff_creeping_doom', 2, 3)).toBeLessThan(14 * 0.7);
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
        expect(VERB_POINTS.swayPerStack).toBe(0.9); // phase 36a: 0.8 → 0.9 (CAPITULATE parity)
        expect(VERB_POINTS.staggerPerRung).toBe(2); // full 2-rung deny = 4
        expect(VERB_POINTS.foretellPerCard).toBe(1);
        expect(VERB_POINTS.premise).toBe(0.8); // phase 36a: build currency, deliberately NOT repriced
        expect(VERB_POINTS.concedeCapstone).toBe(3); // phase 36a: the CONCEDE alt-win lump
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
        // phase 36b + spec 33 D4: poison i1 d4 is a RAMP (big ticks at rounds
        // 3-4) so the tempo horizon discounts it hard, and D4 re-derives the
        // card-played cadence to 1.83 — printed lifetime 18.3 → tempo-weighted
        // 11.81, ÷3 = 3.94 + FREE MARK seed i1 d1 (0.75) = 4.69 (was 5.05 at the
        // 2-play cadence). Still comfortably mid-band; the assertion tracks the
        // live function, so this stays true through the re-derivation.
        expect(scoreCard(slipperySlope))
            .toBeCloseTo(dotTempoWeightedHp('debuff_poison', 1, 4) / 3 + 0.75, 2);
        const brace = spells.find(s => s.id === 'brace-for-impact')!;
        // Guard 8/4 + FREE persistent GUARD 2/3 = 2.67 (phase 30: BARRIER
        // merged into GUARD — bulwark's FREE line lays a brick, not a chip)
        expect(scoreCard(brace)).toBeCloseTo(2 + 2 / 3, 2);
    });

    it('phase 36a — SWAY reprices at 0.9/stack (soft-word regression anchor)', () => {
        // soft-word: SWAY 3 (3×0.9) + FREE RAPPORT i1 d2 seed (0.75×1×2). The
        // SWAY currency carries the CAPITULATE-parity reprice; every other term
        // is unchanged. (The color-match dieBonus rider was removed — a matching
        // die is now the only way to pay, so the rider was never conditional.)
        const softWord = spells.find(s => s.id === 'soft-word')!;
        const expected =
            3 * VERB_POINTS.swayPerStack
            + statusPoints('debuff_rapport', 1, 2);
        expect(scoreCard(softWord)).toBeCloseTo(expected, 2); // 4.20
    });

    it('phase 36a — CONCEDE alt-win prices its +3 capstone (the-closing-word anchor)', () => {
        // PERORATION at 6 rider (ruptureMarks 3 · draw 2 · +2 Conviction = 8)
        // + the flat concede capstone (concedeAt set) + FREE 1 Premise. Before
        // 36a the concedeAt win priced at 0, floating the card near the Axiom
        // floor while it literally ends the game.
        const closingWord = spells.find(s => s.id === 'the-closing-word')!;
        const perorationRider =
            3 * VERB_POINTS.ruptureMarksPerHp
            + 2 * VERB_POINTS.draw
            + 2 * VERB_POINTS.conviction;
        const expected =
            perorationRider + VERB_POINTS.concedeCapstone
            + 1 * VERB_POINTS.premise;
        expect(scoreCard(closingWord)).toBeCloseTo(expected, 2); // 11.80
    });
});
