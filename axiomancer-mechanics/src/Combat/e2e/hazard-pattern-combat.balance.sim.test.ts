/**
 * Balance-sim witness — Hazard-Pattern Combat (HP model), Profane Canon era.
 *
 * PROFANE-CANON SUSPENSION (2026-08-08): balance bands deliberately suspended
 * for the rework — "no need to worry about balance yet" (owner). The sims KEEP
 * RUNNING (crash/termination/accounting are structural law), but every assert
 * that reads a tuning outcome (win rates, mercy rates, engagement floors,
 * loadout comparisons) is parked in `describe.skip` blocks below until
 * /deck-tuning re-baselines and re-arms them against the new canon.
 *
 * Structural invariants that STAY ARMED:
 *   1. Combats TERMINATE (V+M+D+R === runs; no hangs, no crashes) for DoT,
 *      control, charm, and turtle loadouts, including the boss fight.
 *   2. The HP-source fractions stay coherent (0..1, sum ≤ 1).
 *   3. No degenerate stalemates: a wall-heavy loadout ends within the round cap.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { LittleBelle, WaterHolger, KingOfRevenge } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { simulateHazardPatternCombat, runOneEncounter } from '../combat.encounter.sim';

const RUNS = 80;
const SEED = 1;

function loadout(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 10, body: 10, mind: 10 };
    p.health = 150;
    p.maxHealth = 150;
    return p;
}

// Profane Canon loadouts (2026-08-08 rework, old ids retired):
const DOT = ['spoiled-poultice', 'the-long-lent', 'unction-of-boils']; // rot seed + PROLONG + tier-2 poison
const CONTROL = ['scolds-bridle', 'petty-indictment'];                 // STAGGER + BACKFIRE, CHARGE chip
const CHARM = ['thin-hymn', 'alms-of-breath', 'the-offertory-plate'];  // PLEA toward capitulation
const TURTLE = ['chilblain-watch', 'hoarfrost-teeth', 'spoiled-poultice']; // wall + thorns + DoT

describe('HP combat — combats terminate for every loadout family (structural, armed)', () => {
    for (const [name, enemy] of [['LittleBelle', LittleBelle], ['WaterHolger', WaterHolger]] as const) {
        it(`${name}: a DoT loadout terminates every run with exact outcome accounting`, () => {
            const s = simulateHazardPatternCombat(loadout(DOT), enemy, RUNS, SEED);
            expect(s.runs).toBe(RUNS);
            expect(s.victories + s.mercies + s.defeats + s.retreats).toBe(RUNS);
            expect(s.avgRounds).toBeGreaterThan(0);
        });
    }

    it('the boss fight terminates without crashing (win ratio NOT a constraint)', () => {
        const s = simulateHazardPatternCombat(loadout(DOT), KingOfRevenge, RUNS, SEED);
        expect(s.victories + s.mercies + s.defeats + s.retreats).toBe(RUNS);
        expect(s.avgRounds).toBeGreaterThan(0);
    });

    it('a CONTROL loadout terminates every run', () => {
        const s = simulateHazardPatternCombat(loadout(CONTROL), LittleBelle, RUNS, SEED);
        expect(s.victories + s.mercies + s.defeats + s.retreats).toBe(RUNS);
    });

    it('a CHARM loadout terminates every run', () => {
        const s = simulateHazardPatternCombat(loadout(CHARM), LittleBelle, RUNS, SEED);
        expect(s.victories + s.mercies + s.defeats + s.retreats).toBe(RUNS);
    });
});

describe('HP combat — engagement metrics stay coherent (structural, armed)', () => {
    it('every HP-source fraction is a valid ratio and the sources sum to ≤ 1', () => {
        const s = simulateHazardPatternCombat(loadout(DOT), LittleBelle, RUNS, SEED);
        for (const key of ['dotHpFraction', 'strikeFraction', 'mechanicBurstFraction', 'guardMitigatedFraction'] as const) {
            expect(s[key]).toBeGreaterThanOrEqual(0);
            expect(s[key]).toBeLessThanOrEqual(1);
        }
        expect(s.dotHpFraction + s.strikeFraction + s.mechanicBurstFraction).toBeLessThanOrEqual(1.01);
    });
});

describe('HP combat — no degenerate stalemates (the safety cap never binds in practice)', () => {
    it('a wall-heavy TURTLE loadout still terminates every seeded boss run within the round cap', () => {
        for (let i = 0; i < 25; i++) {
            const r = runOneEncounter(loadout(TURTLE), KingOfRevenge, SEED + i, 'turtle');
            expect(['victory', 'mercy', 'capitulate', 'concede', 'defeat', 'retreat']).toContain(r.outcome);
            expect(r.rounds).toBeLessThanOrEqual(61);
        }
    });
});

// PROFANE-CANON SUSPENSION (2026-08-08): balance bands deliberately
// suspended for the rework — "no need to worry about balance yet" (owner).
// /deck-tuning re-baselines and re-arms these against the new canon.
// SKIP-ISSUE: #183
describe.skip('HP combat — SUSPENDED balance bands (status play wins, alt-wins fire)', () => {
    it('a DoT loadout wins at least sometimes and lands status on easy foes', () => {
        for (const enemy of [LittleBelle, WaterHolger]) {
            const s = simulateHazardPatternCombat(loadout(DOT), enemy, RUNS, SEED);
            expect(s.winRate).toBeGreaterThan(0);
            expect(s.statusEngagement).toBeGreaterThan(0);
        }
    });

    it('the boss fight still shows status engagement', () => {
        const s = simulateHazardPatternCombat(loadout(DOT), KingOfRevenge, RUNS, SEED);
        expect(s.statusEngagement).toBeGreaterThan(0);
    });

    it('a CONTROL loadout lands status and wins at least sometimes on an easy foe', () => {
        const s = simulateHazardPatternCombat(loadout(CONTROL), LittleBelle, RUNS, SEED);
        expect(s.statusEngagement).toBeGreaterThan(0);
        expect(s.winRate).toBeGreaterThan(0);
    });

    it('a CHARM (PLEA) loadout produces merciful resolutions on an easy foe', () => {
        // RELENT counts into `mercies` (a merciful resolution) — Charm's
        // identity: it can win without ever touching HP.
        const m = simulateHazardPatternCombat(loadout(CHARM), LittleBelle, RUNS, SEED);
        expect(m.winRate).toBeGreaterThan(0);
        expect(m.mercies).toBeGreaterThan(0);
    });

    it('a DoT loadout kills (victory) more than the charm loadout does', () => {
        const dot = simulateHazardPatternCombat(loadout(DOT), LittleBelle, RUNS, SEED);
        const charm = simulateHazardPatternCombat(loadout(CHARM), LittleBelle, RUNS, SEED);
        expect(dot.victories).toBeGreaterThan(charm.victories);
    });

    it('dotHpFraction > 0 and the board is loaded with status (DoT loadout)', () => {
        const s = simulateHazardPatternCombat(loadout(DOT), LittleBelle, RUNS, SEED);
        expect(s.dotHpFraction).toBeGreaterThan(0);
        expect(s.avgActiveEffectsPerPhase).toBeGreaterThan(0);
    });
});
