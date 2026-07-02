/**
 * Phase 68 — `BefriendabilityConfig` predicate hermetic coverage.
 *
 * Drives `isBefriendAttemptEligible` (in `src/Combat/index.ts`) through
 * synthetic CombatState fixtures so each config axis (hpGate, requiredStances,
 * requiredSkillUse) is pinned in isolation, then in AND-composition.
 *
 * The legacy combat-end predicates (`isFriendshipEligible`,
 * `determineCombatEnd`, `isCombatOngoing`) and the passive both-defend counter
 * threshold were removed with the legacy turn-based combat driver. The
 * surviving surface is the explicit Befriend-attempt eligibility check, which
 * the shared skill engine still consults via `executeSkill`.
 *
 * Cases mirror the brief at `plan/phases/phase_68_befriendability_config.md`
 * D2 (semantics) + Unit 1's case list.
 */

import { describe, it, expect } from 'vitest';
import { isBefriendAttemptEligible } from '../../Combat';
import { CombatState, BattleLogEntry, Stance } from '../../Combat/types';
import { Enemy, BefriendabilityConfig } from '../types';
import { createEnemy } from '../index';
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

function logEntry(round: number, stance: Stance, skillId?: string): BattleLogEntry {
    return {
        round,
        playerAction: {
            stance,
            action: skillId ? 'skill' : 'attack',
            ...(skillId ? { skillId } : {}),
        },
        enemyAction: { stance: 'body', action: 'defend' },
        advantage: 'neutral',
        playerRoll: 10,
        playerRollDetails: '',
        enemyRoll: 10,
        enemyRollDetails: '',
        damageToPlayer: 0,
        damageToEnemy: 0,
        playerHPAfter: 50,
        enemyHPAfter: 50,
        result: '',
    };
}

function makeState(enemy: Enemy, overrides: Partial<CombatState> = {}): CombatState {
    return {
        active: true,
        phase: 'choosing_stance',
        round: 1,
        friendshipCounter: 0,
        log: [],
        playerChoice: {},
        enemyChoice: {},
        combatResources: { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 },
        player: {
            id: 'test-player',
            name: 'Player',
            level: 5,
            experience: 0,
            experienceToNextLevel: 5000,
            health: 50,
            maxHealth: 50,
            baseStats: { heart: 3, body: 5, mind: 2 },
            derivedStats: {
                physicalAttack: 0, physicalSkill: 0, physicalDefense: 0,
                mentalAttack: 0, mentalSkill: 0, mentalDefense: 0,
                emotionalAttack: 0, emotionalSkill: 0, emotionalDefense: 0,
                luck: 0,
            },
            nonCombatStats: {
                physicalSave: 0, physicalTest: 0,
                mentalSave: 0, mentalTest: 0,
                emotionalSave: 0, emotionalTest: 0,
            },
            inventory: [], currency: 0, equipment: {}, effects: [],
            knownSkills: [],
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

    describe('Case 4 — requiredStances (existential)', () => {
        it('blocks eligibility when none of the named stances appear in the log', () => {
            const enemy = makeEnemy({ requiredStances: ['heart'] });
            const state = makeState(enemy, {
                log: [logEntry(1, 'body'), logEntry(2, 'mind')],
            });
            expect(isBefriendAttemptEligible(state)).toBe(false);
        });

        it('allows eligibility when at least one named stance appears in the log', () => {
            const enemy = makeEnemy({ requiredStances: ['heart'] });
            const state = makeState(enemy, {
                log: [logEntry(1, 'body'), logEntry(2, 'heart')],
            });
            expect(isBefriendAttemptEligible(state)).toBe(true);
        });

        it('treats an empty list as no requirement', () => {
            const enemy = makeEnemy({ requiredStances: [] });
            const state = makeState(enemy, { log: [] });
            expect(isBefriendAttemptEligible(state)).toBe(true);
        });
    });

    describe('Case 5 — requiredSkillUse (existential)', () => {
        it('blocks eligibility when no listed skill ID was cast', () => {
            const enemy = makeEnemy({ requiredSkillUse: ['palm-strike'] });
            const state = makeState(enemy, {
                log: [logEntry(1, 'body', 'jab')],
            });
            expect(isBefriendAttemptEligible(state)).toBe(false);
        });

        it('allows eligibility when at least one listed skill ID was cast', () => {
            const enemy = makeEnemy({ requiredSkillUse: ['palm-strike'] });
            const state = makeState(enemy, {
                log: [logEntry(1, 'body'), logEntry(2, 'heart', 'palm-strike')],
            });
            expect(isBefriendAttemptEligible(state)).toBe(true);
        });

        it('ignores log entries whose action is not "skill"', () => {
            const enemy = makeEnemy({ requiredSkillUse: ['palm-strike'] });
            const state = makeState(enemy, {
                log: [{
                    ...logEntry(1, 'heart'),
                    playerAction: { stance: 'heart', action: 'attack', skillId: 'palm-strike' },
                }],
            });
            expect(isBefriendAttemptEligible(state)).toBe(false);
        });
    });

    describe('Case 6 — AND-composition', () => {
        const fullConfig: BefriendabilityConfig = {
            hpGate: { belowPct: 0.4 },
            requiredStances: ['heart'],
            requiredSkillUse: ['palm-strike'],
            roundsThreshold: 5,
        };

        function passingState(): CombatState {
            const enemy = makeEnemy(fullConfig);
            const state = makeState(enemy, {
                log: [logEntry(1, 'heart', 'palm-strike')],
            });
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

        it('fails when requiredStances not satisfied', () => {
            const state = passingState();
            state.log = [logEntry(1, 'body', 'palm-strike')];
            expect(isBefriendAttemptEligible(state)).toBe(false);
        });

        it('fails when requiredSkillUse not satisfied', () => {
            const state = passingState();
            state.log = [logEntry(1, 'heart')];
            expect(isBefriendAttemptEligible(state)).toBe(false);
        });
    });
});
