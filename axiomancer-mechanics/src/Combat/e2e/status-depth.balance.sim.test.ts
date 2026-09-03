/**
 * Balance-sim witness — status-payoff loadouts.
 *
 * The sim MACHINERY stays armed: payoff-built loadouts of the library must
 * terminate and account for every run (no crashes, no hangs). The BAND
 * assertions (win rate > 0, engagement > 0, DoT fraction > 0), formerly
 * parked in a `describe.skip` block, were repealed outright 2026-09-02
 * (big-numbers overhaul §3/§10) rather than left as a skipped tombstone.
 *
 * Loadout lineage (old → new fixture map):
 *   slippery-slope        → unction-of-boils (tier-2 poison common)
 *   festering-argument    → the-long-lent (PROLONG / extend_dots)
 *   opening-statement     → reading-of-the-charges (MARK exposure)
 *   resonance-detonation  → communion-of-the-worm (RUPTURE ALL + SIPHON 50%)
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { LittleBelle } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { simulateHazardPatternCombat } from '../combat.encounter.sim';

const RUNS = 80;
const SEED = 1;

function loadout(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 10, body: 10, mind: 10 };
    p.health = 150; p.maxHealth = 150;
    return p;
}

const DOT = ['unction-of-boils', 'the-long-lent'];
const DOT_RUPTURE = ['unction-of-boils', 'the-long-lent', 'communion-of-the-worm'];
const DOT_MARK = ['unction-of-boils', 'reading-of-the-charges'];          // DoT + MARK exposure
const FULL_KIT = ['unction-of-boils', 'the-long-lent', 'reading-of-the-charges', 'communion-of-the-worm'];

const LOADOUTS: ReadonlyArray<[string, string[]]> = [
    ['pure DoT', DOT],
    ['DoT + RUPTURE', DOT_RUPTURE],
    ['DoT + MARK', DOT_MARK],
    ['full payoff kit', FULL_KIT],
];

describe('profane canon — the payoff-loadout sim machinery survives the rework (armed)', () => {
    for (const [name, cards] of LOADOUTS) {
        it(`the ${name} loadout terminates and accounts for every run`, () => {
            const s = simulateHazardPatternCombat(loadout(cards), LittleBelle, RUNS, SEED);
            expect(s.runs).toBe(RUNS);
            expect(s.victories + s.mercies + s.defeats + s.retreats).toBe(RUNS);
        });
    }
});
