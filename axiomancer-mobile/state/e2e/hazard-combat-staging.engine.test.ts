/**
 * Phase 54 — `beginHazardEncounter` stages `state.currentEncounter` via
 * `startCombat` before handing the enemy to the panel, so the exit-time
 * `endCombat` call has a real encounter to resolve rewards against instead
 * of silently no-op'ing (`plan/AUDIT.md`'s resolved endCombat row, first-map
 * audit 2026-08-08 finding F3).
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { ResolveMapEventResult } from '@mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createAppActions } from '@/state/actions';
import { createAppStore, EMPTY_EVENT_SLICE, type AppStore } from '@/state/store';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';

afterEach(() => {
    jest.restoreAllMocks();
});

function seedActiveEvent(store: AppStore, result: ResolveMapEventResult): void {
    store.setState({ event: { ...EMPTY_EVENT_SLICE, pending: result } });
}

function encounterEvent(): ResolveMapEventResult {
    return {
        state: undefined as never,
        event: {
            kind: 'encounter',
            encounter: { enemies: [createMockEncounterEnemy()], origin: 'fishing-village:fv-3' },
            isBoss: false,
        } as never,
    };
}

describe('beginHazardEncounter: stages currentEncounter (phase 54)', () => {
    it('calls startCombat so state.currentEncounter is populated before the fight starts', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        seedActiveEvent(store, encounterEvent());

        expect(store.getState().currentEncounter).toBeUndefined();

        const returnedEnemy = actions.beginHazardEncounter();

        expect(returnedEnemy).not.toBeNull();
        const staged = store.getState().currentEncounter;
        expect(staged).not.toBeUndefined();
        expect(staged?.enemies[0]?.id).toBe(returnedEnemy?.id);
    });

    it('still clears the pending event slice (unchanged behavior)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        seedActiveEvent(store, encounterEvent());

        actions.beginHazardEncounter();

        expect(store.getState().event?.pending).toBeNull();
    });

    it('returns null and stages nothing when there is no pending encounter event', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        const result = actions.beginHazardEncounter();

        expect(result).toBeNull();
        expect(store.getState().currentEncounter).toBeUndefined();
    });
});
