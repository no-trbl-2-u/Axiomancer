/**
 * Hermetic E2E tests — Character preset adoption (Phase 59).
 *
 * Drives `actions.applyCharacterPreset(presetId)` end-to-end
 * through the engine store and asserts on the resulting
 * `player` slice: name / level / baseStats / knownSkills /
 * inventory match the engine preset; subsequent applies
 * cleanly replace prior preset state.
 *
 * Hermetic = self-contained + deterministic + isolated.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { characterPresets } from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createAppActions } from '@/state/actions';
import { createAppStore } from '@/state/store';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStore() {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    const actions = createAppActions(store);
    return { store, actions };
}

describe('applyCharacterPreset: replaces player with engine preset', () => {
    it.each(characterPresets.map((p) => [p.id, p.name, p.level]))(
        'apply preset "%s" → player.name === "%s" at level %i',
        (presetId, presetName, presetLevel) => {
            const { store, actions } = makeStore();

            const result = actions.applyCharacterPreset(presetId as string);

            expect(result.applied).toBe(true);
            expect(result.presetId).toBe(presetId);
            expect(result.presetName).toBe(presetName);

            const player = store.getState().player;
            expect(player.name).toBe(presetName);
            expect(player.level).toBe(presetLevel);
            expect(player.baseStats).toBeDefined();
            expect(player.baseStats.heart).toBeGreaterThan(0);
        },
    );

    it('builds a complete Character — derived stats, max health, equipped skills all populated', () => {
        const { store, actions } = makeStore();
        actions.applyCharacterPreset('apprentice');

        const player = store.getState().player;
        expect(player.maxHealth).toBeGreaterThan(0);
        expect(player.health).toBe(player.maxHealth);
        expect(player.derivedStats).toBeDefined();
        expect(player.derivedStats.physicalDefense).toBeGreaterThan(0);
        expect(player.knownSkills?.length ?? 0).toBeGreaterThan(0);
        expect(player.inventory?.length ?? 0).toBeGreaterThan(0);
    });

    it('subsequent apply replaces — wanderer state does not leak into sage', () => {
        const { store, actions } = makeStore();

        actions.applyCharacterPreset('wanderer');
        const wandererName = store.getState().player.name;
        const wandererSkills = store.getState().player.knownSkills ?? [];

        actions.applyCharacterPreset('sage');
        const sageName = store.getState().player.name;
        const sageSkills = store.getState().player.knownSkills ?? [];

        expect(sageName).toBe('Sage');
        expect(sageName).not.toBe(wandererName);
        // Skill set is rebuilt from the new preset, not appended.
        expect(sageSkills).not.toEqual(wandererSkills);
    });
});

describe('applyCharacterPreset: unknown id', () => {
    it('returns applied=false without mutating the player slice', () => {
        const { store, actions } = makeStore();
        const before = store.getState().player;

        const result = actions.applyCharacterPreset('not-a-real-preset-id');

        expect(result.applied).toBe(false);
        expect(result.presetId).toBeNull();
        expect(result.presetName).toBeNull();
        expect(store.getState().player).toBe(before);
    });
});
