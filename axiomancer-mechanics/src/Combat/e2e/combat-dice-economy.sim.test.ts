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
 * D7 flips the dice-math bands to hard ratified assertions.
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
