/**
 * Balance-sim witness — status-payoff loadouts (spec 32 v3 re-pin).
 *
 * spec 32 v3: bands re-pinned loose; /deck-tuning + /combat-playtest
 * recalibrate. Win ratio is explicitly NOT a constraint (spec §8) — the loose
 * invariants here are: combats terminate, no crashes, status play happens,
 * and payoff-built loadouts can win at least sometimes on an easy profile.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { LittleBelle } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { simulateHazardPatternCombat } from '../combat.encounter.sim';

const RUNS = 80;
const SEED = 1;

function loadout(skills: string[]): Character {
    const p = deepClone(Player);
    p.knownSkills = skills.slice();
    p.baseStats = { heart: 10, body: 10, mind: 10 };
    p.health = 150; p.maxHealth = 150;
    return p;
}

const DOT = ['slippery-slope', 'straw-mans-jab'];
const DOT_RUPTURE = ['slippery-slope', 'straw-mans-jab', 'resonance-detonation'];
const DOT_MARK = ['slippery-slope', 'opening-statement'];          // DoT + MARK exposure
const FULL_KIT = ['slippery-slope', 'straw-mans-jab', 'opening-statement', 'resonance-detonation'];

describe('spec 32 v3 — the DoT baseline is alive (loose bands)', () => {
    it('the pure DoT loadout wins at least sometimes WITH real status engagement', () => {
        const s = simulateHazardPatternCombat(loadout(DOT), LittleBelle, RUNS, SEED);
        expect(s.runs).toBe(RUNS);
        expect(s.victories + s.mercies + s.defeats + s.retreats).toBe(RUNS);
        expect(s.winRate).toBeGreaterThan(0);
        expect(s.statusEngagement).toBeGreaterThan(0);
    });
});

describe('spec 32 v3 — building around the payoff cards is playable + status-central (loose)', () => {
    it('DoT + RUPTURE terminates, wins sometimes, and still lands status', () => {
        const s = simulateHazardPatternCombat(loadout(DOT_RUPTURE), LittleBelle, RUNS, SEED);
        expect(s.winRate).toBeGreaterThan(0);
        expect(s.statusEngagement).toBeGreaterThan(0);
    });

    it('DoT + MARK exposure terminates, wins sometimes, and still lands status', () => {
        const s = simulateHazardPatternCombat(loadout(DOT_MARK), LittleBelle, RUNS, SEED);
        expect(s.winRate).toBeGreaterThan(0);
        expect(s.statusEngagement).toBeGreaterThan(0);
    });

    it('the full payoff kit terminates and keeps status central (DoT feeds the payoffs)', () => {
        const s = simulateHazardPatternCombat(loadout(FULL_KIT), LittleBelle, RUNS, SEED);
        expect(s.winRate).toBeGreaterThan(0);
        expect(s.statusEngagement).toBeGreaterThan(0);
        expect(s.dotHpFraction).toBeGreaterThan(0);
    });
});
