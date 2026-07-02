/**
 * Hermetic E2E Tests — the guided first gleaning (tutorial).
 *
 * Drives the tutorial through the store action layer and the step
 * script: the pinned session must contain everything the coach
 * teaches (a free taking, a BREATH plot, a payable offering, tools),
 * the step predicates must advance in order under real engine
 * transitions, and the persistent flag must gate the map trigger.
 * Seeded; no timers, no network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState } from 'axiomancer-mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import {
    GATHERING_TUTORIAL_FLAG,
    GATHERING_TUTORIAL_SEED,
    GATHERING_TUTORIAL_SITE,
} from '@/state/gathering/store-actions';
import { getGatherPlotDef } from 'axiomancer-mechanics';
import {
    GATHERING_TUTORIAL_STEPS,
    currentTutorialStep,
} from '@/components/gathering/tutorial-steps';
import { selectGatheringViewModel } from '@/state/presenters/gathering.engine';
import type { GatheringSessionState } from 'axiomancer-mechanics';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStoreAndActions(): { store: AppStore; actions: AppActions } {
    const store = createAppStore();
    return { store, actions: createAppActions(store) };
}

function session(store: AppStore): GatheringSessionState {
    const s = store.getState().gathering.session;
    if (!s) throw new Error('expected an active gathering session');
    return s;
}

function stepIndex(store: AppStore): number {
    const state = store.getState();
    return currentTutorialStep(
        session(store),
        selectGatheringViewModel({ gathering: state.gathering, player: state.player }),
    );
}

describe('the pinned tutorial session', () => {
    it('contains every prop the coach script teaches with', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginGathering({ tutorial: true });
        const s = session(store);
        expect(s.siteId).toBe(GATHERING_TUTORIAL_SITE);
        expect(s.seed).toBe(GATHERING_TUTORIAL_SEED);
        expect(store.getState().gathering.tutorial).toBe(true);

        const defs = s.spread.map((e) => getGatherPlotDef(e.plotId));
        // A BREATH plot face-up for the TEND step…
        expect(defs.some((d) => d.trait === 'breath')).toBe(true);
        // …a taking for the TAKE step…
        expect(defs.some((d) => d.trait !== 'breath')).toBe(true);
        // …and the always-payable BLOOD TITHE for the OFFER step.
        expect(s.offerings.map((o) => o.id)).toContain('blood-tithe');
        expect(s.tools.length).toBeGreaterThan(0);
    });
});

describe('the step script', () => {
    it('advances in order under real engine transitions', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginGathering({ tutorial: true });

        // 0: approach
        expect(GATHERING_TUTORIAL_STEPS[stepIndex(store)].id).toBe('approach');
        actions.selectGatheringApproach('glean');

        // 1: take — the free WAX SHELF.
        expect(GATHERING_TUTORIAL_STEPS[stepIndex(store)].id).toBe('take');
        const taking = session(store).spread.find(
            (e) => getGatherPlotDef(e.plotId).trait !== 'breath',
        )!;
        actions.harvestGatheringPlot(taking.uid);
        if (session(store).phase === 'reprisal') actions.continueGatheringAfterReprisal();

        // 2: tend — GREEN HUSH.
        expect(GATHERING_TUTORIAL_STEPS[stepIndex(store)].id).toBe('tend');
        const breath = session(store).spread.find(
            (e) => getGatherPlotDef(e.plotId).trait === 'breath',
        )!;
        actions.harvestGatheringPlot(breath.uid);

        // 3: offer — the blood tithe (default player health 15 covers it).
        expect(GATHERING_TUTORIAL_STEPS[stepIndex(store)].id).toBe('offer');
        expect(actions.payGatheringOffering('blood-tithe')).toBe(true);

        // 4: tool.
        expect(GATHERING_TUTORIAL_STEPS[stepIndex(store)].id).toBe('tool');
        actions.useGatheringTool(session(store).tools[0].id);

        // 5: descend.
        expect(GATHERING_TUTORIAL_STEPS[stepIndex(store)].id).toBe('descend');
        actions.descendGathering();

        // 6: withdraw.
        expect(GATHERING_TUTORIAL_STEPS[stepIndex(store)].id).toBe('withdraw');
        actions.withdrawFromGathering();

        // Script complete.
        expect(stepIndex(store)).toBe(-1);
    });

    it('is stateless: a player who runs ahead skips proven steps', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginGathering({ tutorial: true });
        actions.selectGatheringApproach('glean');
        // Tend FIRST, then take — the script lands on 'take', and after
        // taking it jumps straight past 'tend' to 'offer'.
        const breath = session(store).spread.find(
            (e) => getGatherPlotDef(e.plotId).trait === 'breath',
        )!;
        actions.harvestGatheringPlot(breath.uid);
        expect(GATHERING_TUTORIAL_STEPS[stepIndex(store)].id).toBe('take');
        const taking = session(store).spread.find(
            (e) => getGatherPlotDef(e.plotId).trait !== 'breath',
        )!;
        actions.harvestGatheringPlot(taking.uid);
        if (session(store).phase === 'reprisal') actions.continueGatheringAfterReprisal();
        expect(GATHERING_TUTORIAL_STEPS[stepIndex(store)].id).toBe('offer');
    });
});

describe('the persistent flag', () => {
    it('completeGatheringTutorial sets the flag once and persists', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginGathering({ tutorial: true });
        actions.completeGatheringTutorial(false);
        const flags = (store.getState() as unknown as GameState).flags;
        expect(flags.filter((f) => f === GATHERING_TUTORIAL_FLAG)).toHaveLength(1);
        // Idempotent.
        actions.completeGatheringTutorial(true);
        const again = (store.getState() as unknown as GameState).flags;
        expect(again.filter((f) => f === GATHERING_TUTORIAL_FLAG)).toHaveLength(1);
    });

    it('a normal begin is NOT a tutorial; the pinned begin is', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginGathering({ seed: 7, siteId: 'bone-orchard' });
        expect(store.getState().gathering.tutorial).toBe(false);
        actions.abandonGathering();
        actions.beginGathering({ tutorial: true });
        expect(store.getState().gathering.tutorial).toBe(true);
        expect(session(store).siteId).toBe(GATHERING_TUTORIAL_SITE);
    });
});
