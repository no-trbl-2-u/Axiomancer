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

jest.mock('expo-router', () => {
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

import { AestheticModeProvider } from '@/state/aesthetic-mode';
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
        <AestheticModeProvider skipHydration>
            <CombatModeProvider>
                <GameStoreProvider store={store}>
                    <ExplorationScreen />
                </GameStoreProvider>
            </CombatModeProvider>
        </AestheticModeProvider>,
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
        actions.beginLootCache({ items: [], currency: 25 });
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
            <AestheticModeProvider skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>
                        <ExplorationScreen />
                    </GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>,
        );
        // Mounted, decision still pending — now the caller opens its session.
        act(() => { actions.beginLootCache({ items: [], currency: 25 }); });
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
