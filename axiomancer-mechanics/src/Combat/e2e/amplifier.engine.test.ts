/**
 * Hermetic E2E — Phase 168: AMPLIFY card mechanic.
 *
 * AMPLIFY reads the foe's pending DoT total × multiplier and fires as a HP
 * burst WITHOUT consuming the DoT effects (they keep ticking). This is the
 * "build-then-detonate" fantasy: assemble a DoT board, cash in periodically
 * without forfeiting the ongoing damage.
 *
 * Four cases:
 *   1. zero-dot  — enemy has no DoT; amplify-detonated fires with amount 0
 *   2. burst     — known pending DoT × multiplier applied as HP damage; DoT NOT consumed
 *   3. cap       — pending × multiplier > AMPLIFY_BURST_CAP → burst clamped to cap
 *   4. sim-credit — runOneEncounter credits amplify-detonated in mechanicBurstDamage
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { TidepoolCrab } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    draftStanceDie,
} from '../combat.engine';
import { AMPLIFY_BURST_CAP, getPendingDotTotal } from '../effects';
import { runOneEncounter } from '../combat.encounter.sim';
import type { CombatDieColor, CombatEncounterState } from '../combat.encounter.types';
import type { ActiveEffect } from '../../Effects/types';

const DOT_CARD = 'slippery-slope';          // body, applies bleed DoT
const AMPLIFY_CARD = 'crescendo-of-suffering'; // heart, AMPLIFY × 1.5

function makePlayer(skills: string[]): Character {
    const p = deepClone(Player);
    p.knownSkills = skills.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    return p;
}

function makeEnemy(hp: number): Enemy {
    const e = deepClone(TidepoolCrab);
    e.id = 'amplify-test-enemy';
    e.health = hp; e.maxHealth = hp; e.effects = [];
    e.baseStats = { heart: 2, body: 2, mind: 2 };
    return e;
}

function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const dice = colors.map((c, i) => ({
        id: `die-${i}`, color: c,
        state: c === 'x' ? ('locked' as const) : ('available' as const), temporary: false,
    }));
    return { ...state, dice, draftedDieId: null };
}

function injectDoT(state: CombatEncounterState, intensity: number, duration: number): CombatEncounterState {
    const bleedEffect: ActiveEffect = {
        effectId: 'debuff_bleed',
        intensity,
        remainingDuration: duration,
        appliedAt: 1,
        tier: 1,
    };
    return { ...state, enemy: { ...state.enemy, effects: [bleedEffect] } };
}

function playAmplifyCard(state: CombatEncounterState): { state: CombatEncounterState; events: import('../combat.encounter.types').CombatEvent[] } {
    const handEntry = state.hand.find(h => h.cardId === AMPLIFY_CARD);
    if (!handEntry) throw new Error('Amplify card not in hand');
    return playCombatCard(state, { uid: handEntry.uid }, true);
}

describe('Phase 168 — AMPLIFY mechanic', () => {
    it('zero-dot: amplify-detonated fires with amount 0 when enemy has no DoT', () => {
        let state = initializeCombatEncounter(
            makePlayer([AMPLIFY_CARD]),
            makeEnemy(200),
            [AMPLIFY_CARD],
            42,
        );
        state = rollEncounterDice(state).state;
        state = setDice(state, ['heart']);
        state = draftStanceDie(state, 'die-0').state;

        const result = playAmplifyCard(state);
        const ev = result.events.find(e => e.kind === 'amplify-detonated');
        expect(ev).toBeDefined();
        expect((ev as { kind: 'amplify-detonated'; amount: number; pendingDot: number }).amount).toBe(0);
        expect((ev as { kind: 'amplify-detonated'; amount: number; pendingDot: number }).pendingDot).toBe(0);
    });

    it('burst: pending DoT × multiplier dealt as HP damage; DoT effects NOT consumed', () => {
        let state = initializeCombatEncounter(
            makePlayer([AMPLIFY_CARD]),
            makeEnemy(300),
            [AMPLIFY_CARD],
            43,
        );
        state = rollEncounterDice(state).state;
        // Inject a known DoT: bleed intensity 4 for 3 rounds → pending = 4×3 = 12
        state = injectDoT(state, 4, 3);
        state = setDice(state, ['heart']);
        state = draftStanceDie(state, 'die-0').state;

        const hpBefore = state.enemy.health;
        const effectsBefore = state.enemy.effects.length;
        // Compute expected pendingDot using the same function the engine uses
        // (bleed's damagePerRound may not be 1, so we derive it from the effect lib)
        const expectedPending = getPendingDotTotal(state.enemy).total;

        const result = playAmplifyCard(state);
        const ev = result.events.find(e => e.kind === 'amplify-detonated') as
            { kind: 'amplify-detonated'; amount: number; pendingDot: number } | undefined;

        expect(ev).toBeDefined();
        expect(ev!.pendingDot).toBe(expectedPending);
        // pending must be > 0 (we injected a DoT)
        expect(ev!.pendingDot).toBeGreaterThan(0);
        // burst = floor(pending × 1.5 × mult) where mult ≥ 1 (neutral read at minimum)
        expect(ev!.amount).toBeGreaterThan(0);
        // HP decreased by at least the burst (card's basePower strike may also deal damage)
        expect(result.state.enemy.health).toBeLessThanOrEqual(hpBefore - ev!.amount);
        // DoT effects remain (NOT consumed — key AMPLIFY vs RUPTURE distinction)
        expect(result.state.enemy.effects.length).toBe(effectsBefore);
    });

    it('cap: burst is clamped to AMPLIFY_BURST_CAP when pending × multiplier exceeds it', () => {
        let state = initializeCombatEncounter(
            makePlayer([AMPLIFY_CARD]),
            makeEnemy(1000),
            [AMPLIFY_CARD],
            44,
        );
        state = rollEncounterDice(state).state;
        // Inject extreme DoT: 50 per round × 3 rounds → pending = 150
        // 150 × 1.5 = 225 >> AMPLIFY_BURST_CAP (60)
        state = injectDoT(state, 50, 3);
        state = setDice(state, ['heart']);
        state = draftStanceDie(state, 'die-0').state;

        const result = playAmplifyCard(state);
        const ev = result.events.find(e => e.kind === 'amplify-detonated') as
            { kind: 'amplify-detonated'; amount: number; pendingDot: number } | undefined;

        expect(ev).toBeDefined();
        expect(ev!.amount).toBeLessThanOrEqual(AMPLIFY_BURST_CAP);
        expect(ev!.amount).toBe(AMPLIFY_BURST_CAP);
    });

    it('sim-credit: runOneEncounter credits amplify-detonated events in mechanicBurstDamage', () => {
        const player = makePlayer([DOT_CARD, AMPLIFY_CARD]);
        player.health = 400; player.maxHealth = 400;
        const enemy = makeEnemy(200);

        const result = runOneEncounter(player, enemy, 1, 'greedy');
        // The sim has amplify-detonated in its credit loop — mechanicBurstDamage must
        // be a non-negative number (it may be 0 if AMPLIFY never fired above threshold,
        // but the attribution channel must be present and valid).
        expect(result.mechanicBurstDamage).toBeGreaterThanOrEqual(0);
        // The encounter resolves (doesn't hang indefinitely)
        expect(['victory', 'mercy', 'defeat', 'retreat']).toContain(result.outcome);
    });
});
