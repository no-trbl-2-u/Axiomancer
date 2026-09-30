/**
 * Hermetic E2E — phase 28 (Show the Engine legibility sweep). Covers the
 * mechanics-side additions: the shared rung-denial fix
 * (getDisruptMeter.willDeny) and the wall-math projection. Seeded RNG only;
 * no disk / network / TTY.
 *
 * The RUPTURE projection and Overtake gate cases went with RUPTURE itself
 * (R7a, D50).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { FloatEye } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, projectIncomingThreat, getDisruptMeter,
} from '../combat.engine';

afterEach(() => { vi.restoreAllMocks(); });

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind' = 'mind', effects: ActiveEffect[] = []): Enemy {
    const e = deepClone(FloatEye);
    e.id = 'enemy-test-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = effects;
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

describe('getDisruptMeter.willDeny — STAGGER-rung denial (phase 28 fix)', () => {
    it('reports willDeny=true when accumulated STAGGER alone denies the turn (previously false)', () => {
        // FloatEye is 'simple' difficulty -> THREAT_RUNGS (2), no boss growth.
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const state = { ...base, staggerRungs: 2 }; // rungsLost (2) >= rungsTotal (2)
        const meter = getDisruptMeter(state);
        expect(meter.pips).toBeLessThan(meter.threshold);   // no distinct-control deny
        expect(meter.rollPenalty).toBe(0);                  // no roll-penalty deny
        expect(meter.willDeny).toBe(true);
    });

    it('reports willDeny=false with no denial path active', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const meter = getDisruptMeter(base);
        expect(meter.willDeny).toBe(false);
    });
});

describe('projectIncomingThreat — wall-math readout (phase 28)', () => {
    it('nets the projected hit against current guard/barrier', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const rawOnly = projectIncomingThreat(base);
        expect(rawOnly.willDeny).toBe(false);
        expect(rawOnly.netDamage).toBeLessThanOrEqual(rawOnly.projectedDamage);

        const guarded = { ...base, guard: 9999 };
        const withGuard = projectIncomingThreat(guarded);
        expect(withGuard.netDamage).toBe(0);
    });

    it('projects 0 net damage when the turn will be denied', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const denied = { ...base, staggerRungs: 2 }; // rung-denied (THREAT_RUNGS = 2)
        const projection = projectIncomingThreat(denied);
        expect(projection.willDeny).toBe(true);
        expect(projection.projectedDamage).toBe(0);
        expect(projection.netDamage).toBe(0);
    });

    it('projected damage drops once a live modifier (partial rung loss) is in play', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const baseline = projectIncomingThreat(base);
        const partiallyStaggered = { ...base, staggerRungs: 1 }; // 1 of 2 rungs lost, not denied
        const projection = projectIncomingThreat(partiallyStaggered);
        expect(projection.willDeny).toBe(false);
        expect(projection.rawDamage).toBe(baseline.rawDamage); // the raw face value is unmodified…
        expect(projection.projectedDamage).toBeLessThan(baseline.projectedDamage); // …but the live projection isn't
    });
});
