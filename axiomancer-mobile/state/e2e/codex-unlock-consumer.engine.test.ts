/**
 * Phase 78 — codex / journal-entry consumer pins.
 *
 * Asserts:
 * - `actions.endCombat(outcome)` returns the engine `CombatEndReport`.
 * - The report's `friendshipReward.codexEntryUnlocked` field populates on
 *   first friendship with an enemy that has `journalEntry`; absent on repeat
 *   friendships and on non-friendship outcomes.
 *
 * Legacy turn-based combat (the `state.combat` slice, its friendship
 * counter) was removed from the engine in mechanics 0.37.0. The engine's
 * `endCombat` now takes an explicit outcome and reads the recorded
 * `currentEncounter` (set by `startCombat`) — so these pins drive the
 * outcome directly rather than manipulating a combat slice.
 */

import { describe, expect, it } from '@jest/globals';
import { applyEffect, effectsLibrary, type Enemy } from 'axiomancer-mechanics';

import { createAppActions } from '@/state/actions';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

function makeFriendlyEnemy(journalEntryBody?: string) {
    return {
        id: 'test-foe',
        name: 'Test Foe',
        description: 'a figure of test.',
        level: 3,
        health: 10,
        maxHealth: 10,
        baseStats: { heart: 5, body: 5, mind: 5 },
        derivedStats: {
            heart: 5, body: 5, mind: 5,
            physicalAttack: 5, physicalSkill: 5, physicalDefense: 5,
            physicalSave: 5, physicalTest: 0, mentalAttack: 5,
            mentalSkill: 5, mentalDefense: 5, mentalSave: 5,
            mentalTest: 0, emotionalAttack: 5, emotionalSkill: 5,
            emotionalDefense: 5, emotionalSave: 5, emotionalTest: 0,
            luck: 0,
            // Type assertion for test mock data - partial Enemy derivedStats
        } as unknown as Enemy['derivedStats'],
        mapName: 'home-bay',
        logic: 'aggressive' as const,
        effects: [],
        friendshipReward: { narrative: 'a thing happened.' },
        journalEntry: journalEntryBody !== undefined
            ? {
                id: 'codex-test-foe',
                title: 'Of the Test Foe',
                body: journalEntryBody,
            }
            : undefined,
        // Type assertion for test mock data - partial Enemy properties
    } as unknown as Enemy;
}

describe('actions.endCombat: returns engine CombatEndReport (Phase 78)', () => {
    it('returns a friendship report that unlocks the foe codex entry on first friendship', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        actions.startCombat(makeFriendlyEnemy('a long body about the test foe.'));
        const report = actions.endCombat('friendship');

        expect(report).not.toBeNull();
        expect(report?.outcome).toBe('friendship');
        expect(report?.friendshipReward?.codexEntryUnlocked?.id).toBe('codex-test-foe');
        expect(store.getState().codex.unlockedEntries).toContain('codex-test-foe');
    });

    it('no codexEntryUnlocked on a repeat friendship (already unlocked)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        // First friendship unlocks the entry.
        actions.startCombat(makeFriendlyEnemy('first body.'));
        actions.endCombat('friendship');
        expect(store.getState().codex.unlockedEntries).toContain('codex-test-foe');

        // Second friendship with the same journal entry — no fresh unlock.
        actions.startCombat(makeFriendlyEnemy('second body.'));
        const report = actions.endCombat('friendship');
        expect(report?.friendshipReward?.codexEntryUnlocked).toBeUndefined();
    });

    it('foe with no journalEntry never gets codexEntryUnlocked', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        actions.startCombat(makeFriendlyEnemy(undefined));
        const report = actions.endCombat('friendship');
        expect(report?.friendshipReward?.codexEntryUnlocked).toBeUndefined();
    });

    it('a victory outcome returns a report and does not unlock the codex', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        actions.startCombat(makeFriendlyEnemy('body.'));
        const report = actions.endCombat('victory');
        expect(report?.outcome).toBe('victory');
        expect(store.getState().codex.unlockedEntries).not.toContain('codex-test-foe');
    });

    it('endCombat outside an encounter reports a flee and grants nothing', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        const report = actions.endCombat('friendship');
        expect(report?.outcome).toBe('flee');
        expect(report?.friendshipReward?.codexEntryUnlocked).toBeUndefined();
    });

    // Smoke pin — `applyEffect` import keeps the engine-effect surface
    // exercised so a regression in the effects library shape surfaces
    // here, not at runtime. Phase 78 doesn't change that surface.
    it('engine effects library is non-empty (smoke pin)', () => {
        expect(effectsLibrary.buffs.length).toBeGreaterThan(0);
        const { activeEffects } = applyEffect([], effectsLibrary.buffs[0], 1);
        expect(activeEffects).toHaveLength(1);
    });
});
