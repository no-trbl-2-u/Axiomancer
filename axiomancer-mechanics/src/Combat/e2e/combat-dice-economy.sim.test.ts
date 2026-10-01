/**
 * Hermetic sim e2e — spec 33 (Upgradeable Dice) D3 economy gates.
 *
 * Pins the D3 witness (`simulateUpgradeableEconomy` +`measureDiceMath`, driven
 * through the real engine + `upgradeablePlayPhase`). Two tiers,
 * matching the report's two-witness split:
 *
 *   1. DICE-MATH gates (authoritative): the face tables (§1) measured by a
 *      direct roll stream — usable 1.83, whiff 8.3%, per-color ≥65%. These are
 *      tight and stable; they are the canonical D3 roll-gate reading.
 *   2. REALIZED-play invariants: structural facts that hold for any config —
 *      the special spend-rate can't exceed 1, income is positive, surges fire.
 *      (The report-F1 pin — the realized roll skewing miss-heavier than the
 *      dice-math baseline — was a small-sample artifact of the retired early
 *      roster and went with it in the enemy roster reset, R2.)
 *
 * The F2 yield canary FLIPPED as designed: Phase D6e (2026-07-18) authored the
 * enemy stance-check telegraphs (deleted in R7d), so realized yield income went > 0 — until the
 * card purge (P1, 2026-09-27) left only colourless cards, which set no stance
 * and so can never yield; that floor went with the coloured cards. The F3 `pressFate == 0` canary FLIPPED the same
 * day (owner call: the Gambler's Knot is default-worn — every starter loadout
 * carries Press Fate), so the suite now pins the sink being ACTIVE.
 *
 * D7 RATIFICATION (2026-07-18, plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-18-d7-ratification.md): the
 * dice-math gates below are the ratified, stable numbers (no win-band is
 * asserted). The `spec 33 D7` block ratifies the realized ◆-income ENVELOPE.
 * The flag itself — and the flag-off STAKE-gap comparison arm — were deleted
 * in the D7 flag collapse (2026-09-25).
 */

import { describe, it, expect } from 'vitest';

import {
    measureDiceMath, simulateUpgradeableEconomy,
} from '../combat.upgradeable-economy.sim';

describe('spec 33 D3 — dice-math gates (authoritative face-table witness)', () => {
    const dm = measureDiceMath(120000, 4242);

    it('E[usable dice/round] is 1.83 ± 0.05', () => {
        expect(dm.usablePerRound).toBeGreaterThanOrEqual(1.78);
        expect(dm.usablePerRound).toBeLessThanOrEqual(1.88);
    });

    it('whiff rate is 8.3% ± 1%', () => {
        expect(dm.whiffRate).toBeGreaterThanOrEqual(0.073);
        expect(dm.whiffRate).toBeLessThanOrEqual(0.093);
    });

    it('per-color access is >= 65% for every chain color', () => {
        expect(dm.perColorAccess.body).toBeGreaterThanOrEqual(0.65);
        expect(dm.perColorAccess.mind).toBeGreaterThanOrEqual(0.65);
        expect(dm.perColorAccess.heart).toBeGreaterThanOrEqual(0.65);
    });

    it('gross special income is ~1.33◆/round (E[specials] 0.667 × 2◆)', () => {
        expect(dm.grossSpecialIncomePerRound).toBeGreaterThanOrEqual(1.25);
        expect(dm.grossSpecialIncomePerRound).toBeLessThanOrEqual(1.42);
    });
});

describe('spec 33 D3 — realized-play invariants', () => {
    // A small, fast slice — invariants hold for any config.
    // Re-measured after the card purge (P1, 2026-09-27): the grey deck is
    // the only deck, so the slice runs 15 seeds to keep 30 encounters (74 rounds,
    // spend-rate 0.86, income 1.30◆/round, Press Fate 0.04/round).
    const SEEDS_1_15 = Array.from({ length: 15 }, (_, i) => i + 1);
    const result = simulateUpgradeableEconomy({
        stages: ['early', 'mid'],
        seeds: SEEDS_1_15,
    });
    const p = result.pooled;

    // S3 (2026-09-27, D41) — stats now scale the player's numbers (mid runs at
    // 17/17/17, ×3.4), so fights end sooner: 48 rounds over the 30 encounters
    // (was > 50), and more rolled specials are left unspent when the foe
    // drops (spend-rate 0.50). The floors below were re-measured, not relaxed
    // for a bug: the game is different, not wrong.
    it('the matrix ran real rounds', () => {
        expect(p.rounds).toBeGreaterThan(40);
        expect(p.encounters).toBe(30);
    });

    it('special spend-rate never exceeds 1 (can\'t realize more ◆ than rolled)', () => {
        expect(p.specialSpendRate).toBeLessThanOrEqual(1.001);
        expect(p.specialSpendRate).toBeGreaterThan(0.4);
    });

    it('realized ◆ income is positive and specials-driven', () => {
        expect(p.totalIncomePerRound).toBeGreaterThan(0.6);
        expect(p.specialIncomePerRound).toBeGreaterThan(0.4);
    });

    // The card purge (P1, 2026-09-27): the grey office is colourless
    // (`color: 'any'`), so no surviving card sets a chain stance — momentum,
    // surges and stance-check YIELDS cannot occur in a grey-deck sim (all
    // measured 0). The "surges fire" and "yield income is positive" floors
    // were removed with the coloured cards; they return with the next
    // coloured card a guided session adds.

    /**
     * F1 HAS TO BE MEASURED LIKE-FOR-LIKE (2026-09-03). `diceMath` is a
     * STOCK-gear roll stream — `measureDiceMath` calls `rollUpgradeableDice`
     * with an EMPTY state, so no die upgrades and no act-reward dice. It can
     * therefore only be compared against a stage that carries neither.
     *
     * Once THE PATH's die-upgrade axis was wired into the shipped spec-33 roll
     * (it previously reached only the legacy model), `mid` began rolling HONED
     * gear and legitimately whiffed LESS than stock — so the old pooled
     * early+mid comparison was scoring an upgraded campaign against an act-one
     * baseline and failing. `early` is the stock-gear stage; the skew this test
     * exists to watch is measured there.
     */
    // Re-measured after the card purge (P1, 2026-09-27): the grey deck alone
    // at `early` gives ~2.7 rounds per encounter, so the stock stream runs 30
    // seeds (80 rounds, realized whiff 0.075 vs dice-math 0.083). At 80
    // rounds one whiff moves the rate by 0.0125, so the whiff side reads
    // within one whiff of the baseline (0.01) rather than 0.005, which was
    // finer than a single roll at this sample size.
    const stockRun = simulateUpgradeableEconomy({
        stages: ['early'],
        seeds: Array.from({ length: 30 }, (_, i) => i + 1),
    });

    it('THE PATH: honed stages roll strictly more usable dice than stock gear', () => {
        // The whole point of the die-upgrade axis, and the guard that would
        // have caught its absence: as first shipped (2026-09-02) the axis
        // reached only the LEGACY model — the spec-33 `startTurn` branch never
        // read `dieUpgradeLevel`, so honing changed nothing in the dice model
        // the playtest and the app actually run. If this regresses to parity,
        // the axis has stopped reaching the roll again.
        expect(p.usablePerRound).toBeGreaterThan(stockRun.pooled.usablePerRound);
    });
});

describe('spec 33 D7 — ratified economy envelope', () => {
    // The D7 witness config: the grey deck over the three graded
    // stages, seeds 1-8 (enough that the F1 RNG-skew has converged — the
    // realized income reads 1.15 at 5 seeds, 1.48 at 8, trending to the
    // dice-math baseline). Kept to one shared run.
    const result = simulateUpgradeableEconomy({ seeds: [1, 2, 3, 4, 5, 6, 7, 8] });
    const p = result.pooled;

    // The ratified 1.2-1.6 design-band assertion (formerly `it.skip`) was
    // repealed outright 2026-09-02 (big-numbers overhaul §3/§10) rather than
    // left as a skipped tombstone — no old economy band survives.
    it('the ◆ economy still produces real income (structural floor, band-independent)', () => {
        expect(p.totalIncomePerRound).toBeGreaterThan(0);
    });

    it('RATIFIED: income is specials-driven', () => {
        // Re-measured post-S3 (2026-09-27): 0.70 — shorter stat-scaled fights
        // strand more specials at the kill (was > 0.9).
        // Re-measured after the card purge (P1, 2026-09-27): 1.16 with the
        // grey deck alone (24 encounters, 57 rounds) — floor kept at 0.6.
        expect(p.specialIncomePerRound).toBeGreaterThan(0.6);
        // The yield floor (> 0.12) went with the coloured cards: the grey
        // office sets no chain stance, so no stance check can be YIELDED
        // (measured 0). See the realized-play block above.
    });
});
