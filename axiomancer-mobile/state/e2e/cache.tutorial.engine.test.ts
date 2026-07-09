/**
 * Hermetic E2E Tests — the guided first delve (tutorial).
 *
 * Drives the tutorial through the store action layer and the step
 * script: the pinned session must resolve to the documented seed/tier/
 * currency, the step predicates must advance in order under real engine
 * transitions, and the persistent flag must gate the map trigger.
 * Seeded; no timers, no network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState, LootCacheSession } from '@mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import {
    CACHE_TUTORIAL_CURRENCY,
    CACHE_TUTORIAL_FLAG,
    CACHE_TUTORIAL_SEED,
} from '@/state/cache/store-actions';
import {
    CACHE_TUTORIAL_STEPS,
    currentTutorialStep,
} from '@/components/cache/tutorial-steps';
import { selectCacheVM } from '@/state/presenters/cache.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStoreAndActions(): { store: AppStore; actions: AppActions } {
    const store = createAppStore();
    return { store, actions: createAppActions(store) };
}

function session(store: AppStore): LootCacheSession {
    const s = store.getState().cache.session;
    if (!s) throw new Error('expected an active cache session');
    return s;
}

function stepIndex(store: AppStore): number {
    const state = store.getState();
    return currentTutorialStep(session(store), selectCacheVM({ cache: state.cache }));
}

describe('the pinned tutorial session', () => {
    it('resolves the documented seed, tier, and currency', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginLootCache({ tutorial: true });
        const s = session(store);
        expect(s.seed).toBe(CACHE_TUTORIAL_SEED);
        expect(store.getState().cache.tutorial).toBe(true);

        // THE LID (layer 0) carries the pinned currency; the false-bottom
        // and keeper's-tithe layers scale off it (see LOOT_CACHE_TUNING).
        expect(s.layers[0].loot.currency).toBe(CACHE_TUTORIAL_CURRENCY);
        expect(s.layers).toHaveLength(3);
    });

    it('cracks THE LID clean on the very first push (seed 1: [6, 1, 2], no jam)', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginLootCache({ tutorial: true });
        actions.startLootCacheDelving();
        actions.delveLootCache();
        actions.pushLootCachePick();
        const s = session(store);
        expect(s.phase).toBe('card');
        expect(s.card?.slammed).toBe(false);
        expect(s.layers[0].opened).toBe(true);
        expect(s.layers[0].spoiled).toBe(false);
    });
});

describe('the step script', () => {
    it('advances in order under real engine transitions', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginLootCache({ tutorial: true });

        // 0: begin
        expect(CACHE_TUTORIAL_STEPS[stepIndex(store)].id).toBe('begin');
        actions.startLootCacheDelving();

        // 1: delve
        expect(CACHE_TUTORIAL_STEPS[stepIndex(store)].id).toBe('delve');
        actions.delveLootCache();

        // 2: push
        expect(CACHE_TUTORIAL_STEPS[stepIndex(store)].id).toBe('push');
        actions.pushLootCachePick();

        // 3: card (THE LID cracked clean on the first push — seed 1).
        expect(CACHE_TUTORIAL_STEPS[stepIndex(store)].id).toBe('card');
        actions.continueLootCacheCard();

        // 4: outcome — seal now rather than delving further.
        expect(CACHE_TUTORIAL_STEPS[stepIndex(store)].id).toBe('outcome');
        actions.sealLootCache();

        // Script complete.
        expect(stepIndex(store)).toBe(-1);
    });

    it('is stateless: a player who keeps delving past the recommended seal still completes the script', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginLootCache({ tutorial: true });
        actions.startLootCacheDelving();
        actions.delveLootCache();
        actions.pushLootCachePick();
        actions.continueLootCacheCard();
        // Ignore the 'outcome' step's seal recommendation — delve again.
        expect(CACHE_TUTORIAL_STEPS[stepIndex(store)].id).toBe('outcome');
        actions.delveLootCache();
        actions.pushLootCachePick();
        if (session(store).phase === 'card') actions.continueLootCacheCard();
        // Eventually sealing (or exhausting all layers) still reaches outcome.
        actions.sealLootCache();
        expect(stepIndex(store)).toBe(-1);
    });
});

describe('the persistent flag', () => {
    it('completeLootCacheTutorial sets the flag once and persists', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginLootCache({ tutorial: true });
        actions.completeLootCacheTutorial(false);
        const flags = (store.getState() as unknown as GameState).flags;
        expect(flags.filter((f) => f === CACHE_TUTORIAL_FLAG)).toHaveLength(1);
        // Idempotent.
        actions.completeLootCacheTutorial(true);
        const again = (store.getState() as unknown as GameState).flags;
        expect(again.filter((f) => f === CACHE_TUTORIAL_FLAG)).toHaveLength(1);
    });

    it('a normal begin is NOT a tutorial; the pinned begin is', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginLootCache({ seed: 7, currency: 10 });
        expect(store.getState().cache.tutorial).toBe(false);
        actions.abandonLootCache();
        actions.beginLootCache({ tutorial: true });
        expect(store.getState().cache.tutorial).toBe(true);
        expect(session(store).seed).toBe(CACHE_TUTORIAL_SEED);
    });
});
