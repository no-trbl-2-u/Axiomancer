/**
 * Hermetic E2E Tests — Flee action behavior (Phase 92)
 *
 * Tests the flee action narrative feedback and morale system integration.
 * Covers the F03 regression (flee gives visible feedback) and verifies
 * the narrative toast is displayed after successful flee.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import type { ResolveMapEventResult } from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createAppActions } from '@/state/actions';
import { createAppStore, type AppStore, EMPTY_EVENT_SLICE } from '@/state/store';

afterEach(() => {
    jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function makeEncounterResult(opts: { isBoss?: boolean } = {}): ResolveMapEventResult {
    const enemy = {
        id: 'test-enemy',
        name: 'Test Enemy',
        level: 1,
        health: 10,
    } as never;
    
    return {
        state: undefined as never,
        event: {
            kind: 'encounter',
            encounter: { enemies: [enemy], origin: 'test:node-1' } as never,
            isBoss: opts.isBoss ?? false,
        },
    };
}

function setPending(store: AppStore, result: ResolveMapEventResult) {
    store.setState({
        event: {
            ...EMPTY_EVENT_SLICE,
            pending: result,
        },
    });
}

// ---------------------------------------------------------------------------
// Flee narrative feedback (Phase 92)
// ---------------------------------------------------------------------------

describe('flee action: narrative feedback', () => {
    it('displays narrative toast after successful flee from non-boss encounter', () => {
        const store = makeStore();
        const actions = createAppActions(store);
        
        // Set up a non-boss encounter event
        setPending(store, makeEncounterResult({ isBoss: false }));

        // Clear any existing toast
        store.setState({
            notifications: {
                levelUpAcknowledged: true,
                toast: { text: null, id: 0 },
            },
        });

        const initialMorale = store.getState().moralMeter;

        // Execute flee action
        actions.pickEventChoice('flee');

        const state = store.getState();
        
        // Verify narrative toast was set
        expect(state.notifications?.toast?.text).toBe(
            'you fled the encounter. the path bends away.\n\nmorale -2'
        );
        expect(state.notifications?.toast?.id).toBe(1);
        
        // Verify morale was decreased
        expect(state.moralMeter).toBe(initialMorale - 2);
        
        // Verify event was cleared
        expect(state.event?.pending).toBeNull();
    });

    it('does not display toast for boss encounters (flee disabled)', () => {
        const store = makeStore();
        const actions = createAppActions(store);
        
        // Set up a boss encounter event
        setPending(store, makeEncounterResult({ isBoss: true }));

        // Clear any existing toast
        store.setState({
            notifications: {
                levelUpAcknowledged: true,
                toast: { text: null, id: 0 },
            },
        });

        const initialMorale = store.getState().moralMeter;

        // Execute flee action (should be no-op for boss)
        actions.pickEventChoice('flee');

        const state = store.getState();
        
        // Verify no toast was set (bosses don't allow flee)
        expect(state.notifications?.toast?.text).toBeNull();
        expect(state.notifications?.toast?.id).toBe(0);
        
        // Verify morale was unchanged
        expect(state.moralMeter).toBe(initialMorale);
        
        // Verify event was cleared
        expect(state.event?.pending).toBeNull();
    });

    it('regression test for F03: flee action provides visible feedback', () => {
        // This test ensures that the deep-playtest F03 finding
        // "FLEE gives no visible feedback or morale indication"
        // is addressed. Previously, flee would clear the event
        // silently without any player feedback.
        
        const store = makeStore();
        const actions = createAppActions(store);
        
        setPending(store, makeEncounterResult({ isBoss: false }));

        // Execute flee
        actions.pickEventChoice('flee');

        const state = store.getState();
        
        // F03 fix: flee now provides visible feedback via toast
        expect(state.notifications?.toast?.text).toContain('you fled the encounter');
        expect(state.notifications?.toast?.text).toContain('morale -2');
        
        // F03 fix: morale cost is now visible and applied
        expect(typeof state.moralMeter).toBe('number');
    });
});