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
 *      the special spend-rate can't exceed 1, income is positive, surges fire,
 *      and the realized roll skews miss-heavier than the dice-math baseline
 *      (the small-sample RNG-correlation of the Park-Miller LCG, report F1).
 *
 * The F2 yield canary FLIPPED as designed: Phase D6e (2026-07-18) authored the
 * enemy stanceCheck telegraphs, so realized yield income is now > 0 and this
 * suite asserts that instead. The F3 `pressFate == 0` canary FLIPPED the same
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
    const result = simulateUpgradeableEconomy({
        presets: ['threadbare', 'pilgrim', 'apostate'],
        stages: ['early', 'mid'],
        seeds: [1, 2, 3, 4, 5],
    });
    const p = result.pooled;

    it('the matrix ran real rounds', () => {
        expect(p.rounds).toBeGreaterThan(50);
        expect(p.encounters).toBe(30);
    });

    it('special spend-rate never exceeds 1 (can\'t realize more ◆ than rolled)', () => {
        expect(p.specialSpendRate).toBeLessThanOrEqual(1.001);
        expect(p.specialSpendRate).toBeGreaterThan(0.5);
    });

    it('realized ◆ income is positive and specials-driven', () => {
        expect(p.totalIncomePerRound).toBeGreaterThan(0.6);
        expect(p.specialIncomePerRound).toBeGreaterThan(0.5);
    });

    it('surges fire and momentum breaks occur', () => {
        expect(p.surgePerRound).toBeGreaterThan(0);
        expect(p.momentumBreakPerRound).toBeGreaterThan(0);
    });

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
    const stockRun = simulateUpgradeableEconomy({
        presets: ['threadbare', 'pilgrim', 'apostate'],
        stages: ['early'],
        seeds: [1, 2, 3, 4, 5],
    });

    it('realized roll skews miss-heavier than the dice-math baseline (report F1)', () => {
        expect(stockRun.pooled.whiffRate)
            .toBeGreaterThanOrEqual(stockRun.diceMath.whiffRate - 0.005);
        expect(stockRun.pooled.usablePerRound)
            .toBeLessThanOrEqual(stockRun.diceMath.usablePerRound + 0.01);
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

    // Phase D6e drained F2: enemy threat phases now carry open stance-check
    // telegraphs, so ending a phase in the `yields` stance pays +1◆ and the
    // realized yield income is positive (was pinned 0 as the F2 canary).
    it('D6e: yield income is positive (enemy stanceCheck telegraphs authored)', () => {
        expect(p.yieldIncomePerRound).toBeGreaterThan(0);
    });

    // F3 DRAINED (owner call 2026-07-18): the Gambler's Knot is default-worn,
    // so every starter loadout carries the reroll signature and the greedy
    // policy actually casts it on whiff-heavy rounds. The old `=== 0` canary
    // flipped exactly as designed; this now pins the sink STAYING live.
    it('F3 drained: Press Fate is castable from the starter loadout (sink live)', () => {
        expect(p.pressFatePerRound).toBeGreaterThan(0);
    });
});

describe('spec 33 D7 — ratified economy envelope', () => {
    // The D7 witness config: the full preset roster over the three graded
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

    it('RATIFIED: income is specials-driven with a yield contribution (D6e telegraphs)', () => {
        expect(p.specialIncomePerRound).toBeGreaterThan(0.9);
        // Floor re-measured post-D9 (2026-07-19): D9 replaced 14 enemies' uniform
        // two-sided default checks with hand-authored, often single-sided ones
        // (a phase may name only a `punishes` or only a `yields`, per spec 33 §2's
        // per-boss thematic variety) — fewer phases carry a yield side, so realized
        // yield income drops from the pre-D9 measurement (~0.327) to ~0.141 at this
        // seed set. Still solidly positive and specials-driven; floor lowered with
        // margin rather than raised back by re-authoring content toward density.
        expect(p.yieldIncomePerRound).toBeGreaterThan(0.12);
    });

    // ── D7 canaries, post-flip status (2026-07-18, owner call): ──────────────
    //    F3 flipped as designed — the Gambler's Knot is now default-worn, so the
    //    Press Fate sink is LIVE (re-measured 0.060 casts/round at seeds 1-8;
    //    realized income 1.533◆ stays in band). The re-run below ratifies the
    //    sink's activity instead of its absence.
    it('F3 drained: the ◆ sink (Press Fate) is ACTIVE from the starter loadout', () => {
        expect(p.pressFatePerRound).toBeGreaterThan(0);
    });
});
