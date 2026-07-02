/**
 * Hermetic E2E Tests — Engine events presenter (Phase 25 Tick A).
 *
 * Pins the emitter wiring + ring-buffer behaviour. Drives the engine
 * via `createAppStore` + the action layer; no direct emitter pokes.
 */

import { describe, it, expect } from '@jest/globals';
import {
    createEnemy,
    isCombatStartedEvent,
    isCombatEndedEvent,
    type TypedGameEvent,
} from 'axiomancer-mechanics';

import { createAppActions } from '@/state/actions';
import { createAppStore, RECENT_EVENTS_CAPACITY, getEmitterForStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { selectRecentEngineEvents } from '@/state/presenters/engine-events.engine';

function makeEnemy() {
    return createEnemy({
        id: 'test-enemy',
        name: 'Test Foe',
        description: 'A foe for engine-event tests.',
        level: 1,
        baseStats: { heart: 5, body: 5, mind: 5 },
        mapName: 'fishing-village' as never,
        logic: 'random' as never,
    });
}

describe('engine-events: emitter wiring', () => {
    it('createAppStore initializes _recentEvents to an empty array', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        expect(store.getState()._recentEvents).toEqual([]);
    });

    it('exposes a GameEventEmitter via getEmitterForStore', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const emitter = getEmitterForStore(store);
        expect(emitter).not.toBeNull();
        expect(typeof emitter?.on).toBe('function');
        expect(typeof emitter?.onAny).toBe('function');
        expect(typeof emitter?.emit).toBe('function');
    });

    it('returns null from getEmitterForStore for an un-wired store', () => {
        // Sanity: the registry is per-store, so an unrelated object
        // returns null.
        const fakeStore = {} as never;
        expect(getEmitterForStore(fakeStore)).toBeNull();
    });
});

describe('engine-events: ring buffer feeds on engine dispatch', () => {
    it('populates a combat:started event when startCombat dispatches', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());

        const events = selectRecentEngineEvents(store.getState());
        expect(events.length).toBeGreaterThan(0);
        const started = events.find(isCombatStartedEvent);
        expect(started).toBeTruthy();
    });

    it('populates a combat:ended event when endCombat dispatches', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());
        actions.endCombat();

        const events = selectRecentEngineEvents(store.getState());
        const ended = events.find(isCombatEndedEvent);
        expect(ended).toBeTruthy();
    });

    it('orders events newest-first', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());
        actions.endCombat();

        const events = selectRecentEngineEvents(store.getState());
        // The most-recent event is `combat:ended`; the earlier one
        // is `combat:started`. Newest-first means index 0 is the
        // most recent.
        expect(events[0]?.type).toBe('combat:ended');
        const endedIdx = events.findIndex(isCombatEndedEvent);
        const startedIdx = events.findIndex(isCombatStartedEvent);
        expect(endedIdx).toBeLessThan(startedIdx);
    });

    it('trims the buffer to RECENT_EVENTS_CAPACITY', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const emitter = getEmitterForStore(store);
        expect(emitter).not.toBeNull();

        // Emit more events than capacity allows. Use the emitter
        // directly so the test doesn't depend on engine action
        // semantics — the ring-buffer trimming contract is the
        // unit under test.
        for (let i = 0; i < RECENT_EVENTS_CAPACITY + 5; i++) {
            emitter!.emit({
                type: 'combat:started',
                payload: { state: store.getState() } as never,
            });
        }

        const events = selectRecentEngineEvents(store.getState(), 100);
        expect(events.length).toBe(RECENT_EVENTS_CAPACITY);
    });

    it('respects the caller-supplied capacity cap (lower than buffer size)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const emitter = getEmitterForStore(store);

        for (let i = 0; i < 10; i++) {
            emitter!.emit({
                type: 'combat:started',
                payload: { state: store.getState() } as never,
            });
        }

        expect(selectRecentEngineEvents(store.getState(), 3).length).toBe(3);
        expect(selectRecentEngineEvents(store.getState(), 100).length).toBe(10);
    });
});

describe('engine-events: is*Event guards narrow correctly', () => {
    it('isCombatStartedEvent narrows the type to TypedCombatStartedEvent', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());

        const events = selectRecentEngineEvents(store.getState());
        const started = events.find(isCombatStartedEvent);
        if (started) {
            // Inside this branch TypeScript narrows to
            // TypedCombatStartedEvent; the `type` literal is fixed.
            expect(started.type).toBe('combat:started');
            expect(typeof started.payload).toBe('object');
        } else {
            throw new Error('expected at least one combat:started event');
        }
    });

    // The former `isCombatRoundEvent` guard + `combat:round` event were
    // removed with legacy turn-based combat in mechanics 0.37.0. The
    // corresponding narrowing test was retired.
});

describe('engine-events: presenter invariants', () => {
    it('returns a frozen array slice', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());

        const events = selectRecentEngineEvents(store.getState());
        expect(Object.isFrozen(events)).toBe(true);
    });

    it('the slice does not mutate the underlying buffer', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());

        const events = selectRecentEngineEvents(store.getState());
        const original = events.length;
        // Attempting to mutate a frozen array silently fails in
        // non-strict mode and throws in strict mode; the assertion
        // here is just that the buffer length is unaffected.
        try {
            (events as TypedGameEvent[]).push(events[0]!);
        } catch {
            // Frozen array — push throws. That's fine; the next
            // assertion catches the no-mutate guarantee.
        }
        const after = selectRecentEngineEvents(store.getState());
        expect(after.length).toBe(original);
    });
});
