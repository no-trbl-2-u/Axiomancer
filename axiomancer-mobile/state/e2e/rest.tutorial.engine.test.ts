/**
 * Hermetic E2E Tests — the guided first night (tutorial).
 *
 * Drives the tutorial through the store action layer and the step
 * script: the pinned session must deal the watch order the coach
 * teaches against (embers, dream, stir), the step predicates must
 * advance in order under real engine transitions regardless of which
 * posture the player picks, and the persistent flag must gate the map
 * trigger. Seeded; no timers, no network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState, RestSession } from '@mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import {
    REST_TUTORIAL_FLAG,
    REST_TUTORIAL_SEED,
} from '@/state/rest/store-actions';
import {
    REST_TUTORIAL_STEPS,
    currentTutorialStep,
} from '@/components/rest/tutorial-steps';
import { selectRestVM } from '@/state/presenters/rest.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStoreAndActions(): { store: AppStore; actions: AppActions } {
    const store = createAppStore();
    return { store, actions: createAppActions(store) };
}

function session(store: AppStore): RestSession {
    const s = store.getState().rest.session;
    if (!s) throw new Error('expected an active rest session');
    return s;
}

function stepIndex(store: AppStore): number {
    const state = store.getState();
    return currentTutorialStep(session(store), selectRestVM({ rest: state.rest }));
}

describe('the pinned tutorial session', () => {
    it('deals the watch order the coach script teaches against', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginRest({ tutorial: true });
        const s = session(store);
        expect(s.seed).toBe(REST_TUTORIAL_SEED);
        expect(s.watchPlan).toEqual(['embers', 'dream', 'stir']);
        expect(store.getState().rest.tutorial).toBe(true);
    });
});

describe('the step script', () => {
    it('advances in order under real engine transitions (recommended posture)', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginRest({ tutorial: true });

        // 0: posture.
        expect(REST_TUTORIAL_STEPS[stepIndex(store)].id).toBe('posture');
        actions.chooseRestPosture('watch');

        // 1: embers (watch 1).
        expect(REST_TUTORIAL_STEPS[stepIndex(store)].id).toBe('embers');
        actions.chooseRestOption('feed');
        actions.continueRestWatch();

        // 2: dream (watch 2).
        expect(REST_TUTORIAL_STEPS[stepIndex(store)].id).toBe('dream');
        actions.chooseRestOption('hold');
        actions.continueRestWatch();

        // 3: stir (watch 3) — posture 'watch' auto-resolves it; no
        // option to choose, just acknowledge.
        expect(REST_TUTORIAL_STEPS[stepIndex(store)].id).toBe('stir');
        actions.continueRestWatch();

        // 4: dawn — the last step. `claimRestOutcome` both satisfies its
        // predicate (`phase === 'done'`) and clears the session in the
        // same call, so there is no window to re-check `currentTutorialStep`
        // afterward; the cleared slice is the completion signal instead.
        expect(REST_TUTORIAL_STEPS[stepIndex(store)].id).toBe('dawn');
        actions.claimRestOutcome();
        expect(store.getState().rest.session).toBeNull();
    });

    it('completes regardless of which posture the player actually picks', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginRest({ tutorial: true });
        actions.chooseRestPosture('deep'); // ignores the coach's recommendation
        actions.chooseRestOption('spare');
        actions.continueRestWatch();
        actions.chooseRestOption('fade');
        actions.continueRestWatch();
        // 'deep' posture also auto-resolves the stir (no option to pick).
        actions.continueRestWatch();
        expect(REST_TUTORIAL_STEPS[stepIndex(store)].id).toBe('dawn');
        actions.claimRestOutcome();
        expect(store.getState().rest.session).toBeNull();
    });
});

describe('the persistent flag', () => {
    it('completeRestTutorial sets the flag once and persists', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginRest({ tutorial: true });
        actions.completeRestTutorial(false);
        const flags = (store.getState() as unknown as GameState).flags;
        expect(flags.filter((f) => f === REST_TUTORIAL_FLAG)).toHaveLength(1);
        // Idempotent.
        actions.completeRestTutorial(true);
        const again = (store.getState() as unknown as GameState).flags;
        expect(again.filter((f) => f === REST_TUTORIAL_FLAG)).toHaveLength(1);
    });

    it('a normal begin is NOT a tutorial; the pinned begin is', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginRest({ seed: 7 });
        expect(store.getState().rest.tutorial).toBe(false);
        actions.abandonRest();
        actions.beginRest({ tutorial: true });
        expect(store.getState().rest.tutorial).toBe(true);
        expect(session(store).seed).toBe(REST_TUTORIAL_SEED);
    });
});
