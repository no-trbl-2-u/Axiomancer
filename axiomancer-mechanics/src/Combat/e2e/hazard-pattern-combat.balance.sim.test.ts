/**
 * Balance-sim witness — Hazard-Pattern Combat (HP model), spec 32 v3 re-pin.
 *
 * spec 32 v3: bands re-pinned loose; /deck-tuning + /combat-playtest
 * recalibrate. Win ratio is explicitly NOT a constraint (spec §8). The loose
 * invariants kept here:
 *
 *   1. Combats TERMINATE (V+M+D+R === runs; no hangs, no crashes).
 *   2. Status play actually happens (engagement > 0) and DoT erodes real HP.
 *   3. A DoT loadout can win at least sometimes on easy profiles.
 *   4. The merciful alt-wins are live: a SWAY (Charm) loadout produces
 *      capitulate/mercy resolutions.
 *   5. The HP-source fractions stay coherent (0..1, sum ≤ 1).
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { LittleBelle, WaterHolger, KingOfRevenge } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { simulateHazardPatternCombat, runOneEncounter } from '../combat.encounter.sim';

const RUNS = 80;
const SEED = 1;

function loadout(skills: string[]): Character {
    const p = deepClone(Player);
    p.knownSkills = skills.slice();
    p.baseStats = { heart: 10, body: 10, mind: 10 };
    p.health = 150;
    p.maxHealth = 150;
    return p;
}

const DOT = ['slippery-slope', 'straw-mans-jab'];             // ramp poison + decaying bleed
const CONTROL = ['red-herring', 'zenos-half-step'];           // BACKFIRE + STAGGER
const CHARM = ['soft-word', 'disarming-smile', 'common-ground']; // SWAY toward capitulation
const TURTLE = ['brace-for-impact', 'nettle-cloak', 'slippery-slope']; // wall + thorns + DoT

describe('HP combat — combats terminate and status play is live (loose bands)', () => {
    for (const [name, enemy] of [['LittleBelle', LittleBelle], ['WaterHolger', WaterHolger]] as const) {
        it(`${name}: a DoT loadout terminates every run and wins at least sometimes`, () => {
            const s = simulateHazardPatternCombat(loadout(DOT), enemy, RUNS, SEED);
            expect(s.runs).toBe(RUNS);
            expect(s.victories + s.mercies + s.defeats + s.retreats).toBe(RUNS);
            expect(s.winRate).toBeGreaterThan(0);
            expect(s.statusEngagement).toBeGreaterThan(0);
        });
    }

    it('the boss fight terminates without crashing (win ratio NOT a constraint)', () => {
        const s = simulateHazardPatternCombat(loadout(DOT), KingOfRevenge, RUNS, SEED);
        expect(s.victories + s.mercies + s.defeats + s.retreats).toBe(RUNS);
        expect(s.statusEngagement).toBeGreaterThan(0);
        expect(s.avgRounds).toBeGreaterThan(0);
    });
});

describe('HP combat — control play is live (STAGGER + BACKFIRE vocabulary)', () => {
    it('a CONTROL loadout terminates, lands status, and wins at least sometimes on an easy foe', () => {
        const s = simulateHazardPatternCombat(loadout(CONTROL), LittleBelle, RUNS, SEED);
        expect(s.victories + s.mercies + s.defeats + s.retreats).toBe(RUNS);
        expect(s.statusEngagement).toBeGreaterThan(0);
        expect(s.winRate).toBeGreaterThan(0);
    });
});

describe('HP combat — the merciful alt-wins are live (spec 32 v3 §9)', () => {
    it('a CHARM (SWAY) loadout produces merciful resolutions on an easy foe', () => {
        // CAPITULATE counts into `mercies` (a merciful resolution) — Charm's
        // identity: it can win without ever touching HP.
        const m = simulateHazardPatternCombat(loadout(CHARM), LittleBelle, RUNS, SEED);
        expect(m.victories + m.mercies + m.defeats + m.retreats).toBe(RUNS);
        expect(m.winRate).toBeGreaterThan(0);
        expect(m.mercies).toBeGreaterThan(0);
    });

    it('a DoT loadout kills (victory) more than the charm loadout does', () => {
        const dot = simulateHazardPatternCombat(loadout(DOT), LittleBelle, RUNS, SEED);
        const charm = simulateHazardPatternCombat(loadout(CHARM), LittleBelle, RUNS, SEED);
        expect(dot.victories).toBeGreaterThan(charm.victories);
    });
});

describe('HP combat — engagement metrics stay coherent', () => {
    it('dotHpFraction > 0 with a DoT loadout and every fraction is a valid ratio', () => {
        const s = simulateHazardPatternCombat(loadout(DOT), LittleBelle, RUNS, SEED);
        expect(s.dotHpFraction).toBeGreaterThan(0);
        for (const key of ['dotHpFraction', 'strikeFraction', 'mechanicBurstFraction', 'guardMitigatedFraction'] as const) {
            expect(s[key]).toBeGreaterThanOrEqual(0);
            expect(s[key]).toBeLessThanOrEqual(1);
        }
        expect(s.dotHpFraction + s.strikeFraction + s.mechanicBurstFraction).toBeLessThanOrEqual(1.01);
    });

    it('avgActiveEffectsPerPhase > 0 with a DoT loadout — the board is loaded with status', () => {
        const s = simulateHazardPatternCombat(loadout(DOT), LittleBelle, RUNS, SEED);
        expect(s.avgActiveEffectsPerPhase).toBeGreaterThan(0);
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

// spec 32 v3: bands re-pinned loose; /deck-tuning + /combat-playtest recalibrate.
