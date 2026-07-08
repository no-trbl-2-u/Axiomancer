/**
 * Phase 108 — Befriend skill-mechanic end-to-end tests.
 *
 * The pre-v3 `befriend` LIBRARY CARD retired with the spec 32 v3 overhaul
 * (Befriend lives in enemy-signature / mercy flows now — ADR-0007 keeps the
 * path alive, and the Charm theme accelerates it). The `befriend_attempt`
 * MECHANIC is kept engine machinery, so this suite drives it through a
 * fixture card + a local lookup:
 * - HP gate eligibility (fails above the gate, succeeds below)
 * - Mercy choice state activation via `activateMercyChoice`
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockSequentialRng, restoreOriginalRng } from '../../test-utils/rng';
import { createCharacter } from '../../Character';
import { executeSkill } from '../skill.engine';
import type { Card } from '../types';
import { initializeCombat } from '../../Combat';
import { createEnemy } from '../../Enemy';

/** Fixture card carrying the kept `befriend_attempt` mechanic. */
const befriendCard: Card = {
    id: 'fix-befriend',
    name: 'Fixture Befriend',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description: 'An open hand (fixture).',
    tier: 1,
    rank: 1,
    cardType: 'spell',
    targetType: 'enemy',
    specialMechanics: [{ kind: 'befriend_attempt' }],
};

const lookup = (id: string): Card | undefined =>
    id === befriendCard.id ? befriendCard : undefined;

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
    },
});

function fixtureCharacter() {
    return createCharacter({
        name: 'Test Character',
        level: 1,
        baseStats: { heart: 5, body: 5, mind: 5 },
        knownSkills: [befriendCard.id],
    });
}

describe('Befriend mechanic (Phase 108, re-pinned for spec 32 v3)', () => {
    beforeEach(() => {
        mockSequentialRng(0.5); // Fixed RNG for deterministic tests
    });

    afterEach(() => {
        // Hermeticity: drop the Math.random spy and reinstate the production
        // RNG singleton so no mocked state leaks past this suite.
        vi.restoreAllMocks();
        restoreOriginalRng();
    });

    describe('HP gate eligibility', () => {
        it('fails befriend attempt when enemy HP too high', () => {
            const enemy = { ...befriendableEnemy, health: 40 }; // 80% HP - above threshold

            const combatState = {
                ...initializeCombat(fixtureCharacter(), enemy),
                combatResources: { heart: 5, body: 0, mind: 0, fallacy: 0, paradox: 0 },
            };

            const resolution = executeSkill(combatState, befriendCard.id, lookup);

            const befriendEvent = resolution.events.find(e => e.kind === 'befriend-attempted');
            expect(befriendEvent).toBeDefined();
            expect(befriendEvent!.successful).toBe(false);
            expect(befriendEvent!.message).toContain('not yet vulnerable');
            expect(resolution.activateMercyChoice).toBe(false);
        });

        it('succeeds befriend attempt when enemy HP below threshold', () => {
            const enemy = { ...befriendableEnemy };
            enemy.health = Math.floor(enemy.maxHealth * 0.4); // 40% HP - below threshold

            const baseState = initializeCombat(fixtureCharacter(), enemy);
            const combatState = {
                ...baseState,
                enemy, // Use the modified enemy with low health
                friendshipCounter: 15, // Above FRIENDSHIP_COUNTER_MAX to satisfy rounds threshold
                combatResources: { heart: 5, body: 0, mind: 0, fallacy: 0, paradox: 0 },
            };

            const resolution = executeSkill(combatState, befriendCard.id, lookup);

            const befriendEvent = resolution.events.find(e => e.kind === 'befriend-attempted');
            expect(befriendEvent).toBeDefined();
            expect(befriendEvent!.successful).toBe(true);
            expect(befriendEvent!.message).toContain('Choose mercy or exploitation');
            expect(resolution.activateMercyChoice).toBe(true);
        });
    });

    describe('Mercy choice state', () => {
        it('activates mercy choice after a successful befriend attempt', () => {
            const enemy = { ...befriendableEnemy };
            enemy.health = Math.floor(enemy.maxHealth * 0.3); // 30% HP - below threshold

            const baseState = initializeCombat(fixtureCharacter(), enemy);
            const combatState = {
                ...baseState,
                enemy,
                friendshipCounter: 15,
                combatResources: { heart: 5, body: 0, mind: 0, fallacy: 0, paradox: 0 },
            };

            const resolution = executeSkill(combatState, befriendCard.id, lookup);
            expect(resolution.activateMercyChoice).toBe(true);
        });
    });

    // The legacy `selectMercyChoice` reducer (which wrote the spare/exploit
    // choice onto a turn-based `CombatState`) was removed with the legacy
    // combat driver. The Hazard-Pattern engine owns mercy resolution now
    // (`selectEncounterMercyChoice`); the befriend MECHANIC still surfaces
    // `activateMercyChoice` via `executeSkill`, covered above.
});
