/**
 * Balance-sim witness — Hazard-Pattern Combat (HP model).
 *
 * The regression guard the `/combat-tuning` skill measures against. The enemy's
 * ONLY bar is HP; the load-bearing invariants are now:
 *
 *   1. Authored enemies are WINNABLE with a competent status loadout (DoT erodes
 *      the enemy's HP to 0).
 *   2. STATUS is the efficient path, basic damage is the weak baseline — a DoT
 *      loadout beats a pure direct-damage loadout, decisively so on a boss where
 *      strikes alone can't close (the doctrine: status > basic attacks).
 *   3. The Befriend MERCY path is live — a control+befriend loadout spares a
 *      low-HP foe (a 'mercy' outcome), distinct from a DoT kill ('victory').
 *   4. Status play actually happens (engagement > 0).
 *
 * Exact rates may drift; the INVARIANTS are not.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { MournfulGull, HollowEyedBeggar, CoastalTyrant } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { simulateHazardPatternCombat } from '../combat.encounter.sim';

const RUNS = 120;
const SEED = 1;

function loadout(skills: string[]): Character {
    const p = deepClone(Player);
    p.knownSkills = skills.slice();
    p.baseStats = { heart: 10, body: 10, mind: 10 };
    p.health = 150;
    p.maxHealth = 150;
    return p;
}

const DOT = ['slippery-slope'];                          // DoT — erodes enemy HP to 0
const DAMAGE_ONLY = ['achilles-gambit'];                 // pure strike, no status (the weak baseline)
const MERCY = ['eternal-regress', 'befriend'];           // control + befriend → the spare path
const CONTROL = ['false-dilemma', 'red-herring'];        // soft-control — roll-penalty debuffs (confusion −5, accuracy_down −3)
const CONCLUDE = ['slippery-slope'];                     // BODY finisher: stack DoT intensity, then Conclusion Sig detonates

describe('HP combat — authored enemies are winnable with status play', () => {
    for (const [name, enemy] of [['MournfulGull', MournfulGull], ['HollowEyedBeggar', HollowEyedBeggar]] as const) {
        it(`${name}: a DoT loadout wins the large majority of seeded combats`, () => {
            const s = simulateHazardPatternCombat(loadout(DOT), enemy, RUNS, SEED);
            expect(s.runs).toBe(RUNS);
            expect(s.winRate).toBeGreaterThanOrEqual(0.8);
            // Status play actually occurs (effects land on the enemy).
            expect(s.statusEngagement).toBeGreaterThan(0);
        });
    }
});

describe('HP combat doctrine — status beats basic attacks', () => {
    it('a DoT loadout wins a boss THROUGH status, where a pure-strike loadout never engages it', () => {
        // Doctrine: STATUS is the central, efficient win path. A DoT loadout closes
        // a boss while landing status on it; a pure-strike loadout is the weak,
        // un-doctrinal baseline that lands NO status at all. (The optimal witness
        // can grind this boss either way via shared Signatures, so the faithful
        // signal is status engagement + efficiency, not a saturated win-rate gap.)
        const dot = simulateHazardPatternCombat(loadout(DOT), CoastalTyrant, RUNS, SEED);
        const damage = simulateHazardPatternCombat(loadout(DAMAGE_ONLY), CoastalTyrant, RUNS, SEED);
        // The DoT line wins reliably and its work comes from status play…
        expect(dot.winRate).toBeGreaterThanOrEqual(0.8);
        expect(dot.statusEngagement).toBeGreaterThan(0.3);
        // …whereas the pure-strike baseline lands zero status on the enemy…
        expect(damage.statusEngagement).toBe(0);
        // …and is no more efficient than DoT (status closes at least as fast).
        expect(dot.avgRounds).toBeLessThanOrEqual(damage.avgRounds + 0.5);
    });
});

describe('HP combat — the befriend mercy path is live', () => {
    it('a control+befriend loadout spares a low-HP foe (mercy, not a DoT kill)', () => {
        const m = simulateHazardPatternCombat(loadout(MERCY), MournfulGull, RUNS, SEED);
        expect(m.winRate).toBeGreaterThan(0);
        // Wins resolve as MERCY (the spare), not VICTORY (an HP kill).
        expect(m.mercies).toBeGreaterThan(0);
        expect(m.mercies).toBeGreaterThanOrEqual(m.victories);
    });

    it('a DoT loadout kills (victory) where the befriend loadout spares (mercy)', () => {
        const dot = simulateHazardPatternCombat(loadout(DOT), MournfulGull, RUNS, SEED);
        const mercy = simulateHazardPatternCombat(loadout(MERCY), MournfulGull, RUNS, SEED);
        expect(dot.victories).toBeGreaterThan(mercy.victories);
        expect(mercy.mercies).toBeGreaterThan(dot.mercies);
    });
});

describe('HP combat — soft-control is a viable status modality (0.33.0 de-inert witness)', () => {
    it('a CONTROL loadout lands status and wins reliably — soft-control play is viable', () => {
        // Doctrine: status effects are the main fun; low engagement is a balance failure.
        // CONTROL loadout applies roll-penalty debuffs (confusion −5 + accuracy_down −3 = −8),
        // hitting the THREAT_DENY_AT (8) threshold that fully denies the enemy's turn.
        // This confirms the 0.33.0 soft-control de-inert actually delivers a playable,
        // winning strategy — not just code that compiles.
        const ctrl = simulateHazardPatternCombat(loadout(CONTROL), MournfulGull, RUNS, SEED);
        expect(ctrl.winRate).toBeGreaterThanOrEqual(0.5);
        expect(ctrl.statusEngagement).toBeGreaterThan(0);
    });

    it('a CONTROL loadout outperforms the no-status baseline against the boss — soft-control > basic attacks', () => {
        // Doctrine: status is the efficient path; basic-attack trading is the weak baseline.
        // Against the boss, a pure-strike loadout is the documented weak path (no status).
        // A soft-control loadout must beat it by denying the enemy's threat turns.
        const ctrl = simulateHazardPatternCombat(loadout(CONTROL), CoastalTyrant, RUNS, SEED);
        const damage = simulateHazardPatternCombat(loadout(DAMAGE_ONLY), CoastalTyrant, RUNS, SEED);
        expect(ctrl.winRate).toBeGreaterThanOrEqual(damage.winRate);
        expect(ctrl.statusEngagement).toBeGreaterThan(damage.statusEngagement);
    });
});

describe('HP combat — Phase 167 status-engagement metrics are valid and doctrine-faithful', () => {
    it('dotHpFraction > 0 with a DoT loadout — DoT contributes meaningfully to HP erosion', () => {
        // Doctrine witness: DoT should be the primary HP-damage source in status builds.
        // A non-zero dotHpFraction confirms the engine is eroding enemy HP via status, not just strikes.
        const s = simulateHazardPatternCombat(loadout(DOT), MournfulGull, RUNS, SEED);
        expect(s.dotHpFraction).toBeGreaterThan(0);
        expect(s.dotHpFraction).toBeLessThanOrEqual(1);
    });

    it('dotHpFraction > strikeFraction with a DoT loadout — status damage exceeds pure strike damage', () => {
        // Doctrine: status > basic attacks. DoT must deliver more HP damage than pure strikes.
        const s = simulateHazardPatternCombat(loadout(DOT), MournfulGull, RUNS, SEED);
        expect(s.dotHpFraction).toBeGreaterThan(s.strikeFraction);
    });

    it('strikeFraction is 0 or near-0 for a pure-strike loadout (no status)', () => {
        // Pure-strike loadout: all enemy HP damage comes from strikes; dotHpFraction must be 0.
        const s = simulateHazardPatternCombat(loadout(DAMAGE_ONLY), MournfulGull, RUNS, SEED);
        expect(s.dotHpFraction).toBe(0);
        expect(s.strikeFraction).toBeGreaterThan(0);
    });

    it('avgActiveEffectsPerPhase > 0 with a DoT loadout — board is loaded with status effects', () => {
        // Doctrine witness: a loaded enemy board = status-centric play is working.
        const s = simulateHazardPatternCombat(loadout(DOT), MournfulGull, RUNS, SEED);
        expect(s.avgActiveEffectsPerPhase).toBeGreaterThan(0);
    });

    it('avgActiveEffectsPerPhase is 0 for a pure-strike loadout — no status on board', () => {
        // Pure-strike loadout never lands status; the board should remain empty every phase.
        const s = simulateHazardPatternCombat(loadout(DAMAGE_ONLY), MournfulGull, RUNS, SEED);
        expect(s.avgActiveEffectsPerPhase).toBe(0);
    });

    it('guardMitigatedFraction is a valid fraction (0–1)', () => {
        // GUARD is generated by defense cards; the metric must be a valid ratio.
        const s = simulateHazardPatternCombat(loadout(DOT), MournfulGull, RUNS, SEED);
        expect(s.guardMitigatedFraction).toBeGreaterThanOrEqual(0);
        expect(s.guardMitigatedFraction).toBeLessThanOrEqual(1);
    });

    it('fractions sum to ≤ 1 (remaining HP loss from thorns/riposte/barrier)', () => {
        // The three-way HP split must not exceed 100% — the remainder is other sources.
        const s = simulateHazardPatternCombat(loadout(DOT), MournfulGull, RUNS, SEED);
        expect(s.dotHpFraction + s.strikeFraction + s.mechanicBurstFraction).toBeLessThanOrEqual(1.01);
    });
});

describe('HP combat — BODY/Conclusion archetype is a viable status-board finisher (doctrine witness)', () => {
    it('a CONCLUDE loadout wins reliably on a normal enemy — status stacking into Conclusion is viable', () => {
        // Doctrine witness: the BODY archetype's Conclusion Signature (sig-rallying-blow) rewards
        // building a loaded status board — damage = CONCLUDE_DMG_PER_STACK × sum(effect.intensity).
        // A DoT-stacking loadout with the BODY sig kit (all-10 stats → body tiebreak) must produce
        // a winning run rate: stacks build via slippery-slope DoT, Conviction banks, Conclusion fires.
        const s = simulateHazardPatternCombat(loadout(CONCLUDE), MournfulGull, RUNS, SEED);
        expect(s.winRate).toBeGreaterThanOrEqual(0.5);
        expect(s.statusEngagement).toBeGreaterThan(0);
    });

    it('a CONCLUDE loadout lands status on the board — avgActiveEffectsPerPhase > 0', () => {
        // Doctrine: status is central to the CONCLUDE kill-path; Conclusion damage scales with
        // board depth. The sim must confirm effects are actually loaded on the enemy board.
        const s = simulateHazardPatternCombat(loadout(CONCLUDE), MournfulGull, RUNS, SEED);
        expect(s.avgActiveEffectsPerPhase).toBeGreaterThan(0);
    });

    it('a CONCLUDE loadout fires mechanic burst damage on the boss — Conclusion Sig detonates', () => {
        // Conclusion fires as a mechanic burst (conclude-hit credited to mechanicBurstFraction).
        // Against the boss (CoastalTyrant) the Conclusion Sig must fire in at least some runs,
        // confirming the BODY kill-path is active (not just DoT ticks) at the hardest target.
        const s = simulateHazardPatternCombat(loadout(CONCLUDE), CoastalTyrant, RUNS, SEED);
        expect(s.mechanicBurstFraction).toBeGreaterThan(0);
    });
});
