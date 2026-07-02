/**
 * Balance-sim witness — 0.34.0 status-depth epic.
 *
 * The new levers (VULNERABLE × RUPTURE × COMPOUND burst, and the DISRUPT deny
 * path) can shift win-rates, so this guard asserts:
 *   1. The EXISTING DoT baseline is UNCHANGED by the new content (regression
 *      guard): a DoT loadout still wins the large majority AND status engagement
 *      stays high (the CLAUDE.md doctrine witness — status play must not drop).
 *   2. Loadouts that BUILD AROUND the new cards (DoT+Rupture, DoT+Breach, the
 *      full payoff kit) are winnable and still land status (status stays central;
 *      the payoff cards cash in a status board, they do not replace it).
 *
 * Exact rates may drift; the INVARIANTS are not. Tuned via `/combat-tuning`.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { MournfulGull } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { simulateHazardPatternCombat } from '../combat.encounter.sim';

const RUNS = 120;
const SEED = 1;

function loadout(skills: string[]): Character {
    const p = deepClone(Player);
    p.knownSkills = skills.slice();
    p.baseStats = { heart: 10, body: 10, mind: 10 };
    p.health = 150; p.maxHealth = 150;
    return p;
}

const DOT = ['slippery-slope'];
const DOT_RUPTURE = ['slippery-slope', 'resonance-rupture'];
const DOT_VULNERABLE = ['slippery-slope', 'breach'];
const FULL_KIT = ['slippery-slope', 'breach', 'resonance-rupture', 'mounting-contradictions'];

describe('0.34.0 — the new content does not regress the DoT baseline', () => {
    it('the pure DoT loadout still wins the large majority WITH high status engagement', () => {
        const s = simulateHazardPatternCombat(loadout(DOT), MournfulGull, RUNS, SEED);
        expect(s.winRate).toBeGreaterThanOrEqual(0.8);
        // Doctrine witness: status play stays central (must NOT drop).
        expect(s.statusEngagement).toBeGreaterThan(0.3);
    });
});

describe('0.34.0 — building around the new payoff cards is winnable + status-central', () => {
    it('DoT + RUPTURE wins and still lands status', () => {
        const s = simulateHazardPatternCombat(loadout(DOT_RUPTURE), MournfulGull, RUNS, SEED);
        expect(s.winRate).toBeGreaterThanOrEqual(0.75);
        expect(s.statusEngagement).toBeGreaterThan(0.2);
    });

    it('DoT + VULNERABLE (Breach) wins and still lands status', () => {
        const s = simulateHazardPatternCombat(loadout(DOT_VULNERABLE), MournfulGull, RUNS, SEED);
        expect(s.winRate).toBeGreaterThanOrEqual(0.75);
        expect(s.statusEngagement).toBeGreaterThan(0.2);
    });

    it('the full payoff kit wins and keeps status central (DoT feeds the payoffs)', () => {
        const s = simulateHazardPatternCombat(loadout(FULL_KIT), MournfulGull, RUNS, SEED);
        expect(s.winRate).toBeGreaterThanOrEqual(0.75);
        expect(s.statusEngagement).toBeGreaterThan(0.2);
    });
});
