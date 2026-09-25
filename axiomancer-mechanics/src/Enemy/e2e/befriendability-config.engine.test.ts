/**
 * Phase 68 — `BefriendabilityConfig` predicate hermetic coverage.
 *
 * Drives `isBefriendAttemptEligible` (in `src/Combat/index.ts`) through
 * synthetic CombatState fixtures so each surviving config axis (hpGate,
 * roundsThreshold fallback) is pinned in isolation, then in AND-composition.
 *
 * The legacy combat-end predicates (`isFriendshipEligible`,
 * `determineCombatEnd`, `isCombatOngoing`) and the passive both-defend counter
 * threshold were removed with the legacy turn-based combat driver. The
 * per-round history predicates (`requiredStances` / `requiredCardUse`) were
 * removed with `CombatState.log` — the Hazard-Pattern engine never populated
 * that log, so they were inert. The surviving surface is the explicit
 * Befriend-attempt eligibility check, which the shared card engine consults
 * via `executeCard`.
 *
 * Cases mirror the brief at `plan/phases/phase_68_befriendability_config.md`
 * D2 (semantics) + Unit 1's case list.
 */

import { describe, it, expect } from 'vitest';
import { isBefriendAttemptEligible } from '../../Combat';
import { CombatState } from '../../Combat/types';
import { Enemy, BefriendabilityConfig } from '../types';
import { createEnemy } from '../index';
import { emptyLoadout } from '../../Character/types';
import { FRIENDSHIP_COUNTER_MAX } from '../../Game/game-mechanics.constants';

function makeEnemy(config?: BefriendabilityConfig, overrides: Partial<Enemy> = {}): Enemy {
    return {
        ...createEnemy({
            id: 'test-enemy',
            name: 'Test',
            description: 'test',
            level: 5,
            baseStats: { body: 3, mind: 3, heart: 3 },
            mapName: 'northern-forest',
            logic: 'aggressive',
            befriendabilityConfig: config,
        }),
        ...overrides,
    };
}

function makeState(enemy: Enemy, overrides: Partial<CombatState> = {}): CombatState {
    return {
        active: true,
        phase: 'choosing_stance',
        round: 1,
        friendshipCounter: 0,
        playerChoice: {},
        enemyChoice: {},
        player: {
            id: 'test-player',
            name: 'Player',
            level: 5,
            experience: 0,
            experienceToNextLevel: 5000,
            health: 50,
            maxHealth: 50,
            baseStats: { heart: 3, body: 5, mind: 2 },
            inventory: [], currency: 0, equipment: emptyLoadout(), effects: [],
            knownCards: [],
            availableStatPoints: 0,
        },
        enemy,
        ...overrides,
    };
}

describe('Phase 68 — BefriendabilityConfig predicate (isBefriendAttemptEligible)', () => {
    describe('Case 1 — field absent', () => {
        it('is always attempt-eligible regardless of the passive counter', () => {
            const enemy = makeEnemy(undefined);
            const stateAtCap = makeState(enemy, { friendshipCounter: FRIENDSHIP_COUNTER_MAX });
            const stateBelow = makeState(enemy, { friendshipCounter: FRIENDSHIP_COUNTER_MAX - 1 });

            expect(isBefriendAttemptEligible(stateAtCap)).toBe(true);
            expect(isBefriendAttemptEligible(stateBelow)).toBe(true);
        });
    });

    describe('Case 2 — defaultFallback escape hatch', () => {
        it('treats other fields as no-ops', () => {
            const enemy = makeEnemy({
                defaultFallback: 'both-defend-cap',
                hpGate: { belowPct: 0.1 },
            });
            const state = makeState(enemy, {
                friendshipCounter: FRIENDSHIP_COUNTER_MAX,
            });
            expect(state.enemy.health).toBeGreaterThan(state.enemy.maxHealth * 0.1);
            expect(isBefriendAttemptEligible(state)).toBe(true);
        });
    });

    describe('Case 3 — hpGate', () => {
        it('blocks eligibility when enemy HP is above the threshold', () => {
            const enemy = makeEnemy({ hpGate: { belowPct: 0.4 } });
            const state = makeState(enemy);
            const maxHp = state.enemy.maxHealth;
            state.enemy.health = Math.floor(maxHp * 0.5);
            expect(isBefriendAttemptEligible(state)).toBe(false);
        });

        it('allows eligibility when enemy HP is at or below the threshold', () => {
            const enemy = makeEnemy({ hpGate: { belowPct: 0.4 } });
            const state = makeState(enemy);
            const maxHp = state.enemy.maxHealth;
            state.enemy.health = Math.floor(maxHp * 0.3);
            expect(isBefriendAttemptEligible(state)).toBe(true);
        });
    });

    describe('Case 4 — AND-composition', () => {
        const fullConfig: BefriendabilityConfig = {
            hpGate: { belowPct: 0.4 },
            roundsThreshold: 5,
        };

        function passingState(): CombatState {
            const enemy = makeEnemy(fullConfig);
            const state = makeState(enemy);
            state.enemy.health = Math.floor(state.enemy.maxHealth * 0.3);
            return state;
        }

        it('eligibility passes when all attempt predicates pass', () => {
            expect(isBefriendAttemptEligible(passingState())).toBe(true);
        });

        it('fails when hpGate not reached', () => {
            const state = passingState();
            state.enemy.health = state.enemy.maxHealth;
            expect(isBefriendAttemptEligible(state)).toBe(false);
        });
    });
});
