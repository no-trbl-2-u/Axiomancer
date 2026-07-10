/**
 * Hermetic E2E Tests — the guided first session (tutorial).
 *
 * Drives the tutorial through the store action layer and the step
 * script: the pinned session must resolve to the documented seed/board,
 * the opening loop must land on the documented space and resolve it the
 * documented way, the step predicates must advance in order under real
 * engine transitions, and the persistent flag must gate the map trigger.
 * Seeded; no timers, no network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState, QuestBoardSession } from '@mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import {
    QUEST_TUTORIAL_FLAG,
    QUEST_TUTORIAL_SEED,
} from '@/state/quest/store-actions';
import {
    QUEST_TUTORIAL_STEPS,
    currentTutorialStep,
} from '@/components/quest/tutorial-steps';
import { selectQuestBoardVM } from '@/state/presenters/quest.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStoreAndActions(): { store: AppStore; actions: AppActions } {
    const store = createAppStore();
    return { store, actions: createAppActions(store) };
}

function session(store: AppStore): QuestBoardSession {
    const s = store.getState().quest.session;
    if (!s) throw new Error('expected an active quest-board session');
    return s;
}

function stepIndex(store: AppStore): number {
    const state = store.getState();
    return currentTutorialStep(session(store), selectQuestBoardVM({ quest: state.quest }));
}

describe('the pinned tutorial session', () => {
    it('resolves the documented seed and board', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginQuestBoard({ tutorial: true });
        const s = session(store);
        expect(s.seed).toBe(QUEST_TUTORIAL_SEED);
        expect(s.boardId).toBe('build-the-boat');
        expect(store.getState().quest.tutorial).toBe(true);
    });

    it('the opening roll lands on a gather space and a press-then-stop line banks a clean haul', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginQuestBoard({ tutorial: true });
        actions.startQuestBoardPlay();
        actions.rollQuestBone();

        let s = session(store);
        expect(s.phase).toBe('space');
        expect(s.pending?.kind).toBe('gather');
        expect(s.pending?.options.map((o) => o.id)).toEqual(['press', 'stop']);

        actions.chooseQuestSpaceOption('press');
        actions.chooseQuestSpaceOption('stop');
        s = session(store);
        expect(s.pending?.result?.partsDelta.plank).toBe(2);

        actions.continueQuestSpace();
        s = session(store);
        expect(s.phase).toBe('idle');
        expect(s.parts.plank).toBe(2);
        expect(s.stretch).toBe(1);
    });
});

describe('the step script', () => {
    it('advances in order under real engine transitions', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginQuestBoard({ tutorial: true });
        actions.startQuestBoardPlay();

        // 0: roll
        expect(QUEST_TUTORIAL_STEPS[stepIndex(store)].id).toBe('roll');
        actions.rollQuestBone();

        // 'roll' is already satisfied the instant the space opens
        // (rolling and opening the space are the same atomic engine
        // transition) — 'again' is the current step for the whole space
        // interaction, even though the coach itself never renders it live
        // (phase !== 'idle').
        expect(QUEST_TUTORIAL_STEPS[stepIndex(store)].id).toBe('again');
        actions.chooseQuestSpaceOption('press');
        actions.chooseQuestSpaceOption('stop');
        actions.continueQuestSpace();

        // Back at idle after one full loop — still 'again' (rolls === 1).
        expect(QUEST_TUTORIAL_STEPS[stepIndex(store)].id).toBe('again');
        actions.rollQuestBone();

        // A second roll has been made — script complete.
        expect(stepIndex(store)).toBe(-1);
    });
});

describe('the persistent flag', () => {
    it('completeQuestBoardTutorial sets the flag once and persists', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginQuestBoard({ tutorial: true });
        actions.completeQuestBoardTutorial(false);
        const flags = (store.getState() as unknown as GameState).flags;
        expect(flags.filter((f) => f === QUEST_TUTORIAL_FLAG)).toHaveLength(1);
        // Idempotent.
        actions.completeQuestBoardTutorial(true);
        const again = (store.getState() as unknown as GameState).flags;
        expect(again.filter((f) => f === QUEST_TUTORIAL_FLAG)).toHaveLength(1);
    });

    it('a normal begin is NOT a tutorial; the pinned begin is', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginQuestBoard({ seed: 7 });
        expect(store.getState().quest.tutorial).toBe(false);
        actions.abandonQuestBoard();
        actions.beginQuestBoard({ tutorial: true });
        expect(store.getState().quest.tutorial).toBe(true);
        expect(session(store).seed).toBe(QUEST_TUTORIAL_SEED);
    });
});
