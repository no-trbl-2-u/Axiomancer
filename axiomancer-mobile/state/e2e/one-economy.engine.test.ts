/**
 * Hermetic E2E Tests — engine-owned spoils + skill learning.
 *
 * Drives `createAppStore` + the typed action layer end-to-end:
 *
 *  - victory spoils are engine-owned: `endCombat('victory')`'s report
 *    carries the rolled loot + granted XP, already applied to the player;
 *  - starter skills seed an empty `knownSkills` before combat starts;
 *  - level-up learn offers come alignment-gated from the engine and
 *    `learnSkill` grows `knownSkills`.
 *
 * Legacy turn-based combat (the `state.combat` slice, its per-round
 * bridges + cross-combat resource carry) was removed from the engine in
 * mechanics 0.37.0. Those describe blocks — hazard-omen bridges into the
 * combat slice and combat-resource carry — were retired with the slice.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { createEnemy } from 'axiomancer-mechanics';

import { createAppStore } from '../store';
import { createAppActions, type AppActions } from '../actions';
import type { AppStore } from '../store';
import { createMemoryAdapter, type MemoryAdapter } from '@/test-utils/memoryAdapter';

function makeEnemy(level = 1) {
    return createEnemy({
        id: 'test-enemy',
        name: 'Test Lich',
        description: 'Stub for tests.',
        level,
        baseStats: { heart: 1, body: 1, mind: 1 },
        mapName: 'fishing-village' as never,
        logic: 'random' as never,
    });
}

let adapter: MemoryAdapter;
let store: AppStore;
let actions: AppActions;

beforeEach(() => {
    adapter = createMemoryAdapter();
    store = createAppStore({ adapter });
    actions = createAppActions(store);
});

afterEach(() => {
    jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Victory spoils — engine-owned (CombatEndReport)
// ---------------------------------------------------------------------------

describe('victory spoils come from the engine endCombat report', () => {
    it('endCombat(victory) surfaces xpGained + loot and applies them to the player', () => {
        actions.startCombat(makeEnemy(2));
        const xpBefore = store.getState().player.experience;
        const invBefore = store.getState().player.inventory.length;

        // The engine reads the recorded `currentEncounter`, rolls loot + XP
        // and applies them in END_COMBAT for a victory outcome.
        const report = actions.endCombat('victory');
        expect(report).not.toBeNull();
        expect(report!.outcome).toBe('victory');
        expect(report!.xpGained).toBeGreaterThan(0);

        const after = store.getState().player;
        // XP from the report is the XP applied to the player — mobile
        // adds nothing of its own.
        expect(after.experience).toBe(xpBefore + report!.xpGained);
        // Rolled loot lands in the inventory (length never shrinks;
        // stacking may fold a drop into an existing stack).
        expect(after.inventory.length).toBeGreaterThanOrEqual(invBefore);
    });

    it('endCombat outside an encounter reports a flee and grants nothing', () => {
        const xpBefore = store.getState().player.experience;
        const report = actions.endCombat();
        expect(report?.outcome).toBe('flee');
        expect(report?.xpGained).toBe(0);
        expect(store.getState().player.experience).toBe(xpBefore);
    });
});

// ---------------------------------------------------------------------------
// Skill learning
// ---------------------------------------------------------------------------

describe('starter skills + learn-skill flow', () => {
    it('startCombat seeds the tier-1 starter set into an empty knownSkills', () => {
        expect(store.getState().player.knownSkills ?? []).toHaveLength(0);
        actions.startCombat(makeEnemy());
        const known = store.getState().player.knownSkills ?? [];
        expect(known.length).toBeGreaterThan(0);
        expect(known).toContain('brace-for-impact');
    });

    it('getLearnableSkillOffers returns ≤3 unknown, requirement-met offers with effect lines', () => {
        const offers = actions.getLearnableSkillOffers();
        expect(offers.length).toBeGreaterThan(0);
        expect(offers.length).toBeLessThanOrEqual(3);
        const known = store.getState().player.knownSkills ?? [];
        for (const offer of offers) {
            expect(known).not.toContain(offer.id);
            expect(offer.effectText.length).toBeGreaterThan(0);
            expect(['body', 'mind', 'heart']).toContain(offer.stance);
        }
    });

    it('learnSkill grows knownSkills through the engine and is idempotent', () => {
        const offers = actions.getLearnableSkillOffers();
        const pick = offers[0];
        expect(actions.learnSkill(pick.id)).toBe(true);
        expect(store.getState().player.knownSkills).toContain(pick.id);
        // already known → engine returns the same character → false
        expect(actions.learnSkill(pick.id)).toBe(false);
    });
});
