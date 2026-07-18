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
 * The `pressFate == 0` CANARY still pins report F3 (starter loadouts don't
 * equip the reroll signature — flips loudly when the affordance lands). The F2
 * yield canary FLIPPED as designed: Phase D6e (2026-07-18) authored the enemy
 * stanceCheck telegraphs, so realized yield income is now > 0 and this suite
 * asserts that instead.
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
        presets: ['oratory', 'standstill', 'erosion'],
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

    // ── CANARY (report F3) — flips when a starter loadout equips the reroll. ──
    it('CANARY F3: Press Fate is never cast until a starter loadout equips the reroll signature', () => {
        expect(p.pressFatePerRound).toBe(0);
    });
});

describe('spec 33 D7 — ratified economy envelope + flag-not-ready canaries', () => {
    // The D7 witness config: the full preset roster over the three graded
    // stages, seeds 1-8 (enough that the F1 RNG-skew has converged — the
    // realized income reads 1.15 at 5 seeds, 1.48 at 8, trending to the
    // dice-math baseline). Kept to one shared run.
    const result = simulateUpgradeableEconomy({ seeds: [1, 2, 3, 4, 5, 6, 7, 8] });
    const p = result.pooled;

    it('RATIFIED: realized ◆ income sits in the design band 1.2-1.6 at converged seeds', () => {
        // D3/D7 income band. The lower edge is F1-sensitive (miss-heavy at small
        // seed sets); at seeds 1-8 it reads ~1.48, comfortably in band.
        expect(p.totalIncomePerRound).toBeGreaterThanOrEqual(1.2);
        expect(p.totalIncomePerRound).toBeLessThanOrEqual(1.6);
    });

    it('RATIFIED: income is specials-driven with a yield contribution (D6e telegraphs)', () => {
        expect(p.specialIncomePerRound).toBeGreaterThan(0.9);
        expect(p.yieldIncomePerRound).toBeGreaterThan(0.15);
    });

    // ── FLAG-NOT-READY canaries (D7). These pin the reasons the flag stays OFF;
    //    each flips loudly the moment the blocker is fixed, forcing a D7 re-run. ─
    it('CANARY F3: the only ◆ sink (Press Fate) is inactive — nothing to spend on', () => {
        expect(p.pressFatePerRound).toBe(0);
    });

    it('CANARY STAKE-gap: flag-on fights run LONGER than flag-off (no active sink)', () => {
        // STAKE retired its sink + clock; Press Fate (F3) never replaces them, so
        // flag-on fights lengthen. Measured +13.6% (5.48 vs 4.83). Flips when a
        // real sink lands and the gap closes.
        expect(result.stakeGap.flagOnAvgRounds).toBeGreaterThan(result.stakeGap.flagOffAvgRounds);
    });

    it('leaves the flag OFF (no leak; the flag is not flipped by D7)', () => {
        expect(isUpgradeableDiceEnabled()).toBe(false);
    });
});
