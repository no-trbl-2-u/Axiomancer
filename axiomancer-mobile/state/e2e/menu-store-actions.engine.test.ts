/**
 * Hermetic E2E — the main-menu store actions (`state/menu/store-actions.ts`)
 * over the in-memory slot store: NEW GAME, LOAD GAME, CONTINUE and the
 * store hydration they share.
 */

import { describe, expect, it } from '@jest/globals';
import { createNewGameState, getRng, type GameState } from '@mechanics';

import {
    continueGameAction,
    hydrateStoreWithGameState,
    loadGameAction,
    returnToTitleAction,
    startNewGameAction,
} from '@/state/menu/store-actions';
import { createMemorySlotStore } from '@/state/persistence/memorySlotStore';
import { EMPTY_HAZARD_SLICE, createAppStore, type AppStore } from '@/state/store';

function savedState(name: string, level = 1, rngState = 7): GameState {
    const s = createNewGameState();
    return { ...s, rngState, player: { ...s.player, name, level } };
}

function makeStore(adapter = createMemorySlotStore()): AppStore {
    return createAppStore({ adapter });
}

describe('hydrateStoreWithGameState', () => {
    it('swaps the engine state in and resets every mobile slice', () => {
        const store = makeStore();
        // Dirty a mobile slice and an optional engine field first.
        store.setState({
            hazard: { session: { fake: true } as never, tutorial: true },
            currentEncounter: { enemies: [] } as never,
            _recentEvents: [{ type: 'x' } as never],
        });

        const next = savedState('Loaded', 4);
        hydrateStoreWithGameState(store, next);

        const state = store.getState();
        expect(state.player.name).toBe('Loaded');
        expect(state.player.level).toBe(4);
        expect(state.runId).toBe(next.runId);
        expect(state.hazard).toBe(EMPTY_HAZARD_SLICE);
        expect(state.currentEncounter).toBeUndefined();
        expect(state._recentEvents).toEqual([]);
        // The store's own verbs survive the swap.
        expect(typeof state.save).toBe('function');
    });

    it('restores the engine RNG from the loaded state', () => {
        const store = makeStore();
        hydrateStoreWithGameState(store, savedState('Seeded', 1, 123456));
        expect(getRng().getState()).toBe(123456);
    });
});

describe('startNewGameAction — NEW GAME', () => {
    it('selects the slot, seeds THE VERY START, and saves at once', () => {
        const slots = createMemorySlotStore();
        const store = makeStore(slots);
        store.setState({ player: { ...store.getState().player, name: 'Stale', level: 9 } });

        const fresh = startNewGameAction(store, slots, 2);

        expect(slots.getActiveSlot()).toBe(2);
        expect(slots.saveCount).toBe(1);
        expect(slots.readSlot(2)?.runId).toBe(fresh.runId);
        const player = store.getState().player;
        expect(player.level).toBe(1);
        expect(player.inventory).toEqual([]);
        expect(player.currency).toBe(0);
        expect(player.experience).toBe(0);
        expect(slots.listSlots()[1]?.status).toBe('saved');
    });

    it('two new games get distinct runs', () => {
        const slots = createMemorySlotStore();
        const store = makeStore(slots);
        const a = startNewGameAction(store, slots, 1);
        const b = startNewGameAction(store, slots, 3);
        expect(a.runId).not.toBe(b.runId);
        expect(slots.readSlot(1)?.runId).toBe(a.runId);
        expect(slots.readSlot(3)?.runId).toBe(b.runId);
    });
});

describe('loadGameAction — LOAD GAME', () => {
    it('loads a saved slot into the store and makes it active', () => {
        const slots = createMemorySlotStore({
            initial: { 3: { state: savedState('Third', 5), savedAt: 10 } },
        });
        const store = makeStore(slots);

        expect(loadGameAction(store, slots, 3)).toBe(true);
        expect(slots.getActiveSlot()).toBe(3);
        expect(store.getState().player.name).toBe('Third');
        expect(store.getState().player.level).toBe(5);
    });

    it('refuses an empty slot and changes nothing', () => {
        const slots = createMemorySlotStore({ activeSlot: 1 });
        const store = makeStore(slots);
        const before = store.getState().player;

        expect(loadGameAction(store, slots, 2)).toBe(false);
        expect(slots.getActiveSlot()).toBe(1);
        expect(store.getState().player).toBe(before);
    });
});

describe('continueGameAction — CONTINUE', () => {
    it('resumes the most recently written slot', () => {
        const slots = createMemorySlotStore({
            initial: {
                1: { state: savedState('Old', 2), savedAt: 100 },
                2: { state: savedState('Newest', 3), savedAt: 300 },
                3: { state: savedState('Middle', 4), savedAt: 200 },
            },
        });
        const store = makeStore(slots);

        expect(continueGameAction(store, slots)).toBe(true);
        expect(slots.getActiveSlot()).toBe(2);
        expect(store.getState().player.name).toBe('Newest');
    });

    it('is false with nothing saved', () => {
        const slots = createMemorySlotStore();
        const store = makeStore(slots);
        expect(continueGameAction(store, slots)).toBe(false);
        expect(slots.getActiveSlot()).toBeNull();
    });
});

describe('returnToTitleAction', () => {
    it('saves into the active slot and flushes', async () => {
        const slots = createMemorySlotStore({ activeSlot: 1 });
        let flushed = 0;
        const withFlush = { ...slots, flush: async () => { flushed += 1; } };
        const store = makeStore(slots);
        store.setState({ player: { ...store.getState().player, name: 'Leaving' } });

        await returnToTitleAction(store, withFlush);

        expect(slots.readSlot(1)?.player.name).toBe('Leaving');
        expect(flushed).toBe(1);
    });
});
