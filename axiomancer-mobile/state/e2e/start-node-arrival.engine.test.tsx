/**
 * Start-node arrival (2026-08-08 first-map audit).
 *
 * Map events fire on ARRIVAL at a node, and the player never arrives at the
 * node `createMapState` places them on — so whatever a map authored for its
 * starting node was unreachable content. On fishing-village that silently
 * swallowed fv-1's whole pool for the entire life of the map.
 *
 * The fix has two halves and this file pins both: the engine re-authored fv-1
 * as the village's arrival CUTSCENE (a kind that is safe to fire the moment
 * the map opens, unlike a fight nobody has had a chance to prepare for), and
 * `ExplorationScreen` resolves the start node once on entry.
 *
 * Hermetic = self-contained + deterministic + isolated. See `docs/testing.md`.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/lib/platform/router', () => {
    const ReactLib = require('react');
    const { View } = require('react-native');
    const mockTabsScreenComponent = jest.fn((props: { name: string }) =>
        ReactLib.createElement(View, { testID: `mock-tab-screen-${props.name}` }),
    );
    const mockTabsComponent = Object.assign(
        jest.fn((props: { children?: unknown }) =>
            ReactLib.createElement(View, { testID: 'mock-tabs' }, props.children as React.ReactNode),
        ),
        { Screen: mockTabsScreenComponent },
    );
    return {
        useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => false }),
        Tabs: mockTabsComponent,
    };
});

import { CombatModeProvider } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, EMPTY_EVENT_SLICE, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { selectExplorationViewModel } from '@/state/presenters/exploration.engine';
import { selectHasAnyActiveSession } from '@/state/presenters/navigation.engine';
import { createAppActions } from '@/state/actions';
import ExplorationScreen from '@/app/(tabs)/exploration';

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function mountExploration(store: AppStore) {
    const tree = render(
        <CombatModeProvider>
            <GameStoreProvider store={store}>
                <ExplorationScreen />
            </GameStoreProvider>
        </CombatModeProvider>,
    );
    // The arrival is deliberately deferred a tick so a caller that navigates
    // here and opens its own session in the same handler wins the race — see
    // the effect's comment in `app/(tabs)/exploration/index.tsx`. Advance by
    // a tick rather than `runAllTimers()`: the screen also arms long-lived
    // UI timers (the map hint) that re-schedule and would never drain.
    act(() => { jest.advanceTimersByTime(1); });
    return tree;
}

describe('start-node arrival: the map resolves the node it puts you on', () => {
    it('reports the start node as pending on a fresh store', () => {
        const store = makeStore();
        const vm = selectExplorationViewModel(store.getState());

        expect(vm.currentNodeId).toBe('fv-1');
        expect(vm.startNodePending).toBe(true);
    });

    it('resolves fv-1 into a live cutscene event when the map screen mounts', () => {
        const store = makeStore();
        mountExploration(store);

        const pending = store.getState().event?.pending;
        expect(pending).not.toBeNull();
        expect(pending?.event.kind).toBe('cutscene');
    });

    it('consumes the start node so the arrival is a one-shot', () => {
        const store = makeStore();
        mountExploration(store);

        expect(store.getState().world.currentMap.consumedNodes).toContain('fv-1');
        expect(selectExplorationViewModel(store.getState()).startNodePending).toBe(false);
    });

    it('stands down when another session already owns the app', () => {
        // The regression CI caught on PR #186. Every minigame owns its own
        // slice, so a caller can navigate to this screen and open a CACHE (or
        // hazard, or rest…) session without ever touching `state.event`. The
        // arrival used to check only the event slice, see an "idle" app, and
        // steal the caller's route — the dev treasure trigger ended up on
        // /cutscene instead of /cache.
        const store = makeStore();
        const actions = createAppActions(store);
        actions.beginLootCacheChoice({ tier: 'modest', currency: 25 });
        expect(selectHasAnyActiveSession(store.getState())).toBe(true);

        mountExploration(store);

        // The cache session is untouched and no cutscene was armed.
        expect(store.getState().event?.pending ?? null).toBeNull();
        expect(store.getState().world.currentMap.consumedNodes).not.toContain('fv-1');
        expect(selectHasAnyActiveSession(store.getState())).toBe(true);
    });

    it('stands down when the session opens a tick AFTER this screen mounts', () => {
        // The other half of the same bug: callers push this route and open
        // their session in the same handler, so the screen can mount one
        // commit before the session exists. Deciding on the render-time
        // reading would fire into a caller that is about to be busy.
        const store = makeStore();
        const actions = createAppActions(store);

        render(
            <CombatModeProvider>
                <GameStoreProvider store={store}>
                    <ExplorationScreen />
                </GameStoreProvider>
            </CombatModeProvider>,
        );
        // Mounted, decision still pending — now the caller opens its session.
        act(() => { actions.beginLootCacheChoice({ tier: 'modest', currency: 25 }); });
        act(() => { jest.advanceTimersByTime(1); });

        expect(store.getState().event?.pending ?? null).toBeNull();
        expect(store.getState().world.currentMap.consumedNodes).not.toContain('fv-1');
    });

    it('does not fire again on a re-mount of the same map', () => {
        const store = makeStore();
        mountExploration(store).unmount();

        // Clear the event slice as the cutscene screen's dismissal would, then
        // come back to the map. Nothing should re-arm.
        store.setState({ event: EMPTY_EVENT_SLICE });
        mountExploration(store);

        expect(store.getState().event?.pending ?? null).toBeNull();
    });
});

/**
 * Burn-day audit 2026-09-19 row 3.1 — the arrival is owed across a reload.
 *
 * A move is a checkpoint (BUG-03), and the checkpoint is taken BEFORE the
 * arrival event resolves: `moveToAction` saves, and only then does
 * `onConfirmMove` call `resolveCurrentMapEvent`. On an encounter node that
 * used to mean a player who reloaded during the prelude came back standing
 * ON the node, with its onward edges already open and no fight pending —
 * the encounter was silently skipped. The arrival re-fire (the screen's
 * `vm.arrivalPending` effect) is what makes the early checkpoint honest.
 */
describe('an arrival the player never answered survives a reload', () => {
    it('engages the encounter when the map screen remounts on the saved node', () => {
        const adapter = createMemoryAdapter();
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);
        actions.moveTo('fv-2');
        actions.moveTo('fv-26');
        actions.moveTo('fv-11');
        actions.moveTo('fv-27');
        actions.moveTo('fv-13'); // engine kind `encounter`

        // The player reloads before answering the prelude: rebuild the app
        // from the bytes the move checkpointed.
        const reloaded = createAppStore({ adapter });
        expect(reloaded.getState().world.currentMap.currentNode).toBe('fv-13');
        expect(reloaded.getState().world.currentMap.consumedNodes).not.toContain('fv-13');

        const tree = mountExploration(reloaded);

        // The arrival is answered ...
        expect(reloaded.getState().world.currentMap.consumedNodes).toContain('fv-13');
        // ... and the fight the player was owed is actually on screen. Do NOT
        // assert `event.pending` here: `EncounterModalOverlay` auto-engages on
        // mount and `beginHazardEncounter` clears the event slice on the way
        // in, so `pending` is null by the time this line runs — before AND
        // after the fix. The sibling start-node case can assert `pending`
        // only because fv-1 is a CUTSCENE, which has no auto-engage.
        expect(reloaded.getState().currentEncounter).not.toBeNull();
        expect(tree.queryByTestId('encounter-modal-hazard-combat')).not.toBeNull();
    });
});
