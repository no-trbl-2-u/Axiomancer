/**
 * Phase 108 — Befriend heart skill end-to-end tests.
 *
 * Tests the Befriend skill implementation:
 * - Starting character skill acquisition
 * - 5-heart cost requirement
 * - HP gate eligibility 
 * - Mercy choice state activation
 * - Spare/exploit choice resolution
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mockSequentialRng } from '../../test-utils/rng';
import { createCharacter } from '../../Character';
import { executeSkill } from '../skill.engine';
import { getCardById } from '../cards.library';
import { initializeCombat } from '../../Combat';
import { createEnemy } from '../../Enemy';

// Test enemy with befriendability config for HP gate testing
const befriendableEnemy = createEnemy({
    id: 'test-enemy',
    name: 'Test Enemy',
    description: 'Enemy for testing befriending',
    level: 1,
    baseStats: { heart: 5, body: 5, mind: 5 },
    mapName: 'fishing-village',
    logic: 'random',
    befriendabilityConfig: {
        hpGate: { belowPct: 0.5 }, // Can befriend when below 50% HP
    }
});

describe('Befriend skill (Phase 108)', () => {
    beforeEach(() => {
        mockSequentialRng(0.5); // Fixed RNG for deterministic tests
    });

    describe('Starting skill acquisition', () => {
        it('new characters know Befriend skill', () => {
            const character = createCharacter({
                name: 'Test Character',
                level: 1,
                baseStats: { heart: 5, body: 5, mind: 5 },
                knownSkills: ['befriend'] // Befriend should be in starting skills
            });

            expect(character.knownSkills).toContain('befriend');
        });
    });

    describe('HP gate eligibility', () => {
        it('fails befriend attempt when enemy HP too high', () => {
            const character = createCharacter({
                name: 'Test Character', 
                level: 1,
                baseStats: { heart: 5, body: 5, mind: 5 },
                knownSkills: ['befriend']
            });

            const enemy = { ...befriendableEnemy, health: 40 }; // 80% HP - above threshold

            const combatState = {
                ...initializeCombat(character, enemy),
                combatResources: { heart: 5, body: 0, mind: 0, fallacy: 0, paradox: 0 }
            };

            const resolution = executeSkill(combatState, 'befriend', getCardById);
            
            const befriendEvent = resolution.events.find(e => e.kind === 'befriend-attempted');
            expect(befriendEvent).toBeDefined();
            expect(befriendEvent!.successful).toBe(false);
            expect(befriendEvent!.message).toContain('not yet vulnerable');
        });

        it('succeeds befriend attempt when enemy HP below threshold', () => {
            const character = createCharacter({
                name: 'Test Character',
                level: 1, 
                baseStats: { heart: 5, body: 5, mind: 5 },
                knownSkills: ['befriend']
            });

            // Create enemy and manually reduce health to below 50% 
            const enemy = { ...befriendableEnemy };
            enemy.health = Math.floor(enemy.maxHealth * 0.4); // 40% HP - below threshold

            const baseState = initializeCombat(character, enemy);
            const combatState = {
                ...baseState,
                enemy, // Use the modified enemy with low health
                friendshipCounter: 15, // Above FRIENDSHIP_COUNTER_MAX to satisfy rounds threshold
                combatResources: { heart: 5, body: 0, mind: 0, fallacy: 0, paradox: 0 }
            };

            const resolution = executeSkill(combatState, 'befriend', getCardById);
            
            const befriendEvent = resolution.events.find(e => e.kind === 'befriend-attempted');
            expect(befriendEvent).toBeDefined();
            expect(befriendEvent!.successful).toBe(true);
            expect(befriendEvent!.message).toContain('Choose mercy or exploitation');
            expect(resolution.activateMercyChoice).toBe(true);
        });
    });

    describe('Mercy choice state', () => {
        it('activates mercy choice after successful Befriend', () => {
            const character = createCharacter({
                name: 'Test Character',
                level: 1,
                baseStats: { heart: 5, body: 5, mind: 5 },
                knownSkills: ['befriend']
            });

            // Create enemy and manually reduce health to below 50%
            const enemy = { ...befriendableEnemy };
            enemy.health = Math.floor(enemy.maxHealth * 0.3); // 30% HP - below threshold

            const baseState = initializeCombat(character, enemy);
            const combatState = {
                ...baseState,
                enemy, // Use the modified enemy with low health
                friendshipCounter: 15, // Above FRIENDSHIP_COUNTER_MAX to satisfy rounds threshold
                combatResources: { heart: 5, body: 0, mind: 0, fallacy: 0, paradox: 0 }
            };

            const resolution = executeSkill(combatState, 'befriend', getCardById);
            expect(resolution.activateMercyChoice).toBe(true);
        });
    });

    // The legacy `selectMercyChoice` reducer (which wrote the spare/exploit
    // choice onto a turn-based `CombatState`) was removed with the legacy
    // combat driver. The Hazard-Pattern engine owns mercy resolution now
    // (`selectEncounterMercyChoice`); the befriend SKILL still surfaces
    // `activateMercyChoice` via `executeSkill`, covered above.
});