/**
 * Hermetic E2E — plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-08-win-path-scaling.md item 1: alt-win
 * paths scale with the stage curve instead of the flat pre-fix checks that
 * let Oratory/Standstill sit at 100% win rate on EVERY stage while Grace's
 * RELENT was unreachable late (Battle Lab round 2).
 *
 *   (A) CONDEMN — deleted in the card purge (P1, 2026-09-27): its only
 *       carriers (The Black Cap / petty-indictment) were purged.
 *   (B) RELENT — deleted in the card purge: PLEA lost every carrier.
 *   (C) Boss/unique rung REGROWTH — an anti-permalock: a boss/unique whose
 *       telegraph loses rungs regrows resilience for future phases, capped
 *       at doubling its natural rung count. Normal/elite enemies unaffected.
 *
 * Seeded / stubbed RNG only (src/test-utils/rng.ts); no disk / network / TTY.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy, EnemyDifficulty } from '../../Enemy/types';
import { FloatEye } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import {
    initializeCombatEncounter, rollEncounterDice, resolveThreatPhase,
} from '../combat.engine';
import {
    THREAT_RUNGS, THREAT_RUNGS_BOSS, BOSS_RUNG_REGROWTH, bossRungGrowthCap,
} from '../effects';
import type { CombatEncounterState, CombatThreatPhase } from '../combat.encounter.types';

afterEach(() => { vi.restoreAllMocks(); });

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    return p;
}

function makeEnemy(
    hp: number,
    stance: 'heart' | 'body' | 'mind' = 'mind',
    difficulty?: EnemyDifficulty,
    currentHp?: number,
): Enemy {
    const e = deepClone(FloatEye);
    e.id = 'enemy-wps-dummy';
    e.maxHealth = hp;
    e.health = currentHp ?? hp;
    e.effects = [];
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    if (difficulty) e.difficulty = difficulty;
    return e;
}

function customPhases(stances: ('heart' | 'body' | 'mind')[], damage = 6): CombatThreatPhase[] {
    return stances.map((s, i) => ({
        index: i + 1, enemyStance: s, isFinalPhase: i === stances.length - 1,
        threatAction: { description: 'wps probe', effects: [{ damage }] },
    }));
}

// ── (C) Boss/unique rung REGROWTH (anti-permalock) ───────────────────────────

describe('boss/unique rung REGROWTH (item 1c, anti-permalock)', () => {
    function baseState(enemy: Enemy, phases: CombatThreatPhase[]): CombatEncounterState {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([]), enemy, undefined, 7);
        state = rollEncounterDice(state).state;
        return { ...state, threatPhases: phases, threatMarks: phases.map(() => 'pending' as const), currentPhaseIndex: 0 };
    }

    it('a boss regrows a rung of resilience after a phase where rungs were removed', () => {
        expect(BOSS_RUNG_REGROWTH).toBe(1);
        const boss = makeEnemy(500, 'mind', 'boss');
        const phases = customPhases(['mind', 'mind', 'mind', 'mind']);
        const state = baseState(boss, phases);

        // Round 1: staggerRungs === THREAT_RUNGS_BOSS (3) fully denies the
        // telegraph — the pre-fix flat behavior.
        const r1 = resolveThreatPhase({ ...state, staggerRungs: THREAT_RUNGS_BOSS });
        expect(r1.events.some(e => e.kind === 'threat-fired')).toBe(false); // denied
        expect(r1.events.some(e => e.kind === 'rung-regrown')).toBe(true);
        expect(r1.state.bossRungGrowth).toBe(1);

        // Round 2: the SAME staggerRungs output no longer fully denies —
        // the boss's effective rung total grew to 4.
        const r2 = resolveThreatPhase({ ...r1.state, staggerRungs: THREAT_RUNGS_BOSS });
        expect(r2.events.some(e => e.kind === 'threat-fired')).toBe(true); // acted (weakened)
        expect(r2.state.bossRungGrowth).toBe(2); // still grew (rungs were still removed)
    });

    it('regrowth caps at doubling the boss natural rung count', () => {
        expect(bossRungGrowthCap(THREAT_RUNGS_BOSS)).toBe(THREAT_RUNGS_BOSS);
        const boss = makeEnemy(500, 'mind', 'boss');
        const phases = customPhases(['mind', 'mind', 'mind', 'mind', 'mind']);
        let state = baseState(boss, phases);
        // Grind 6 rounds of partial rung loss (staggerRungs=1 every round,
        // always > 0, so growth keeps trying to climb) — it must never
        // exceed THREAT_RUNGS_BOSS (a doubled total of 6).
        for (let i = 0; i < 6; i++) {
            const r = resolveThreatPhase({ ...state, staggerRungs: 1 });
            state = r.state;
            expect(state.bossRungGrowth ?? 0).toBeLessThanOrEqual(THREAT_RUNGS_BOSS);
        }
        expect(state.bossRungGrowth).toBe(THREAT_RUNGS_BOSS); // saturated at the cap
    });

    it('a normal (non-boss/unique) enemy never accrues rung growth', () => {
        const normal = makeEnemy(500, 'mind'); // FloatEye difficulty: 'simple'
        const phases = customPhases(['mind', 'mind', 'mind']);
        let state = baseState(normal, phases);
        for (let i = 0; i < 3; i++) {
            const r = resolveThreatPhase({ ...state, staggerRungs: THREAT_RUNGS });
            state = r.state;
            expect(r.events.some(e => e.kind === 'threat-fired')).toBe(false); // still fully denied every round
            expect(state.bossRungGrowth ?? 0).toBe(0);
            expect(r.events.some(e => e.kind === 'rung-regrown')).toBe(false);
        }
    });

    it('an elite enemy (non-boss/unique) also never accrues rung growth', () => {
        const elite = makeEnemy(500, 'mind', 'elite');
        const phases = customPhases(['mind', 'mind']);
        const state = baseState(elite, phases);
        const r = resolveThreatPhase({ ...state, staggerRungs: THREAT_RUNGS });
        expect(r.events.some(e => e.kind === 'threat-fired')).toBe(false);
        expect(r.state.bossRungGrowth ?? 0).toBe(0);
    });
});
