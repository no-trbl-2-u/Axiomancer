/**
 * Hermetic E2E Tests — engine events ring buffer (Phase 25 Tick A).
 *
 * Pins the emitter wiring + the `_recentEvents` ring-buffer behaviour
 * that the memoir chronicle and the error screen read. Drives the
 * engine via `createAppStore` + the action layer. (The
 * `selectRecentEngineEvents` presenter this file used to read through
 * had no screen consumer and was removed — TRIM THE FAT T3. The
 * `isCombat*Event` type guards are pinned engine-side in
 * `axiomancer-mechanics/src/Game/e2e/events.engine.test.ts`.)
 */

import { describe, it, expect } from '@jest/globals';
import { createEnemy, type TypedGameEvent } from '@mechanics';

import { createAppActions } from '@/state/actions';
import { createAppStore, RECENT_EVENTS_CAPACITY, getEmitterForStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const isStarted = (e: TypedGameEvent) => e.type === 'combat:started';
const isEnded = (e: TypedGameEvent) => e.type === 'combat:ended';

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

        const events = store.getState()._recentEvents;
        expect(events.length).toBeGreaterThan(0);
        const started = events.find(isStarted);
        expect(started).toBeTruthy();
    });

    it('populates a combat:ended event when endCombat dispatches', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());
        actions.endCombat();

        const events = store.getState()._recentEvents;
        const ended = events.find(isEnded);
        expect(ended).toBeTruthy();
    });

    it('orders events newest-first', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());
        actions.endCombat();

        const events = store.getState()._recentEvents;
        // The most-recent event is `combat:ended`; the earlier one
        // is `combat:started`. Newest-first means index 0 is the
        // most recent.
        expect(events[0]?.type).toBe('combat:ended');
        const endedIdx = events.findIndex(isEnded);
        const startedIdx = events.findIndex(isStarted);
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

        const events = store.getState()._recentEvents;
        expect(events.length).toBe(RECENT_EVENTS_CAPACITY);
    });
});
