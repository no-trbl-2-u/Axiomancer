/**
 * Hermetic E2E Tests — the guided first crossing (tutorial).
 *
 * Drives the tutorial through the store action layer and the step
 * script: the pinned session must contain everything the coach teaches
 * (a zero-hex dice roll, a hand where every card colour has a matching
 * die), the step predicates must advance in order under real engine
 * transitions — including the `round > 1` fallback that lets a player
 * who resolves a round without explicitly powering/applying still
 * advance — and the persistent flag must gate the map trigger. Seeded;
 * no timers, no network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState } from '@mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import {
    HAZARD_TUTORIAL_FLAG,
    HAZARD_TUTORIAL_ID,
    HAZARD_TUTORIAL_SEED,
} from '@/state/hazard/store-actions';
import {
    HAZARD_TUTORIAL_STEPS,
    currentTutorialStep,
} from '@/components/hazard/tutorial-steps';
import { selectHazardViewModel } from '@/state/presenters/hazard.engine';
import type { HazardSessionState } from '@mechanics';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStoreAndActions(): { store: AppStore; actions: AppActions } {
    const store = createAppStore();
    return { store, actions: createAppActions(store) };
}

function session(store: AppStore): HazardSessionState {
    const s = store.getState().hazard.session;
    if (!s) throw new Error('expected an active hazard session');
    return s;
}

function stepIndex(store: AppStore): number {
    const state = store.getState();
    return currentTutorialStep(session(store), selectHazardViewModel({ hazard: state.hazard }));
}

describe('the pinned tutorial session', () => {
    it('contains everything the coach script teaches with', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginHazard({ tutorial: true });
        const s = session(store);
        expect(s.hazardId).toBe(HAZARD_TUTORIAL_ID);
        expect(s.seed).toBe(HAZARD_TUTORIAL_SEED);
        expect(store.getState().hazard.tutorial).toBe(true);

        // The opening hand: every card's colour matches a die once cast.
        expect(s.hand.map((h) => h.cardId)).toEqual(['ironwill', 'footing', 'footing', 'refrain', 'spite']);

        actions.selectHazardRoute('safe');
        actions.finishHazardRolling();
        const diceKinds = session(store).dice.map((d) => d.kind);
        expect(diceKinds).toEqual(['purple', 'red', 'purple', 'red']);
        expect(diceKinds).not.toContain('hex');
    });
});

describe('the step script', () => {
    it('advances in order under real engine transitions', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginHazard({ tutorial: true });

        // 0: route
        expect(HAZARD_TUTORIAL_STEPS[stepIndex(store)].id).toBe('route');
        actions.selectHazardRoute('safe');

        // 1: stage
        expect(HAZARD_TUTORIAL_STEPS[stepIndex(store)].id).toBe('stage');
        actions.finishHazardRolling();
        const first = session(store).hand[0]; // ironwill (red)
        actions.stageHazardCard(first.uid);

        // 2: power
        expect(HAZARD_TUTORIAL_STEPS[stepIndex(store)].id).toBe('power');
        const die = session(store).dice.find((d) => d.kind === 'red' && d.state === 'available')!;
        expect(die).toBeDefined();
        actions.powerHazardCard(first.uid, die.id);
        expect(session(store).dice.find((d) => d.id === die.id)?.state).toBe('spent');

        // 3: apply
        expect(HAZARD_TUTORIAL_STEPS[stepIndex(store)].id).toBe('apply');
        actions.applyHazardCard(first.uid);

        // 4: resolve
        expect(HAZARD_TUTORIAL_STEPS[stepIndex(store)].id).toBe('resolve');
        actions.resolveHazardRound();
        actions.continueHazardAfterResolve();
        expect(session(store).round).toBe(2);

        // 5: outcome
        expect(HAZARD_TUTORIAL_STEPS[stepIndex(store)].id).toBe('outcome');

        // Play out the remaining rounds (stage one card, resolve, continue)
        // until the crossing settles into 'outcome'.
        while (session(store).phase === 'playing') {
            const card = session(store).hand[0];
            actions.stageHazardCard(card.uid);
            actions.resolveHazardRound();
            actions.continueHazardAfterResolve();
        }
        expect(session(store).phase).toBe('outcome');
        actions.acknowledgeHazardOutcome();
        expect(session(store).phase).toBe('rewards');

        // Script complete once the rewards screen is reached.
        expect(stepIndex(store)).toBe(-1);
    });

    it('is stateless: resolving a round with no explicit power/apply satisfies all four move steps at once', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginHazard({ tutorial: true });
        actions.selectHazardRoute('safe');
        actions.finishHazardRolling();
        expect(HAZARD_TUTORIAL_STEPS[stepIndex(store)].id).toBe('stage');

        const card = session(store).hand[0];
        actions.stageHazardCard(card.uid);
        // Skip explicit power/apply — the engine auto-applies staged cards
        // on resolve, and the round advancing past 1 satisfies power/apply
        // via their fallback even though no die was ever spent.
        actions.resolveHazardRound();
        actions.continueHazardAfterResolve();

        expect(HAZARD_TUTORIAL_STEPS[stepIndex(store)].id).toBe('outcome');
    });
});

describe('the persistent flag', () => {
    it('completeHazardTutorial sets the flag once and persists', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginHazard({ tutorial: true });
        actions.completeHazardTutorial(false);
        const flags = (store.getState() as unknown as GameState).flags;
        expect(flags.filter((f) => f === HAZARD_TUTORIAL_FLAG)).toHaveLength(1);
        // Idempotent.
        actions.completeHazardTutorial(true);
        const again = (store.getState() as unknown as GameState).flags;
        expect(again.filter((f) => f === HAZARD_TUTORIAL_FLAG)).toHaveLength(1);
    });

    it('a normal begin is NOT a tutorial; the pinned begin is', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginHazard({ seed: 7, hazardId: 'bandit-hunt' });
        expect(store.getState().hazard.tutorial).toBe(false);
        actions.abandonHazard();
        actions.beginHazard({ tutorial: true });
        expect(store.getState().hazard.tutorial).toBe(true);
        expect(session(store).hazardId).toBe(HAZARD_TUTORIAL_ID);
    });
});
