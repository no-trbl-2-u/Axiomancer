/**
 * Hermetic sim e2e — spec 33 (Upgradeable Dice) D3 economy gates, FLAG-ON.
 *
 * Pins the D3 witness (`simulateUpgradeableEconomy` +`measureDiceMath`, driven
 * through the real engine + `policyPlayPhase`'s spec-33 branch). Two tiers,
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
 * D7 RATIFICATION (2026-07-18, plan/tuning/2026-07-18-d7-ratification.md): the
 * dice-math gates below are the ratified, stable numbers (the win-curve bands
 * are NOT ratified — flag-on misses early ~80 by −15 and depresses
 * statusEngagement ~9pts, so the flag stays OFF and no win-band is asserted).
 * The `spec 33 D7` block ratifies the realized ◆-income ENVELOPE and pins the
 * two flag-not-ready canaries — the inactive sink (F3) and the widened STAKE
 * gap — so the suite goes red the moment the flag becomes flippable and D7 must
 * be re-run.
 */

import { describe, it, expect, afterEach } from 'vitest';

import {
    measureDiceMath, simulateUpgradeableEconomy,
} from '../combat.upgradeable-economy.sim';
import { isUpgradeableDiceEnabled, setUpgradeableDice } from '../combat.upgradeable-dice';

// The witness toggles the flag internally and restores it; belt-and-suspenders.
afterEach(() => setUpgradeableDice(false));

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

    it('leaves the flag OFF (no leak into the flag-off suite)', () => {
        expect(isUpgradeableDiceEnabled()).toBe(false);
    });
});

describe('spec 33 D3 — realized-play invariants (flag-on matrix)', () => {
    // A small, fast slice — invariants hold for any config.
    const result = simulateUpgradeableEconomy({
        presets: ['threadbare', 'pilgrim', 'apostate'],
        stages: ['early', 'mid'],
        seeds: [1, 2, 3, 4, 5],
    });
    const p = result.pooled;

    it('the matrix ran real rounds and left the flag off', () => {
        expect(p.rounds).toBeGreaterThan(50);
        expect(p.encounters).toBe(30);
        expect(isUpgradeableDiceEnabled()).toBe(false);
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

    it('realized roll skews miss-heavier than the dice-math baseline (report F1)', () => {
        expect(p.whiffRate).toBeGreaterThanOrEqual(result.diceMath.whiffRate - 0.005);
        expect(p.usablePerRound).toBeLessThanOrEqual(result.diceMath.usablePerRound + 0.01);
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

describe('spec 33 D7 — ratified economy envelope + flag-not-ready canaries', () => {
    // The D7 witness config: the full preset roster over the three graded
    // stages, seeds 1-8 (enough that the F1 RNG-skew has converged — the
    // realized income reads 1.15 at 5 seeds, 1.48 at 8, trending to the
    // dice-math baseline). Kept to one shared run.
    const result = simulateUpgradeableEconomy({ seeds: [1, 2, 3, 4, 5, 6, 7, 8] });
    const p = result.pooled;

    // PROFANE-CANON SUSPENSION (2026-08-08): balance bands deliberately
    // suspended for the rework — "no need to worry about balance yet" (owner).
    // /deck-tuning re-baselines and re-arms these against the new canon.
    // (The canon's decks read 1.18◆ against a 1.2 floor authored for the
    // retired ten-preset library; the sim itself still runs, and the
    // structural assertions below stay ARMED.)
    // SKIP-ISSUE: #183
    it.skip('RATIFIED: realized ◆ income sits in the design band 1.2-1.6 at converged seeds', () => {
        expect(p.totalIncomePerRound).toBeGreaterThanOrEqual(1.2);
        expect(p.totalIncomePerRound).toBeLessThanOrEqual(1.6);
    });

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

    it('STAKE-gap: flag-on fights still run longer than flag-off (sink active but small)', () => {
        // STAKE retired its sink + clock. Press Fate now spends (F3 drained) but
        // at 0.060 casts/round it does not yet close the clock gap — re-measured
        // 5.38 vs 4.83 (+11.5%, was +13.6% with the sink inactive). Flips when a
        // real escalation-pressure replacement lands.
        expect(result.stakeGap.flagOnAvgRounds).toBeGreaterThan(result.stakeGap.flagOffAvgRounds);
    });

    it('leaves the flag OFF (no leak; the flag is not flipped by D7)', () => {
        expect(isUpgradeableDiceEnabled()).toBe(false);
    });
});
