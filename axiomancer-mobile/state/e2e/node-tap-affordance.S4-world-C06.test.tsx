/**
 * S4-world-C06 — the map's loudest mark must be a place you can GO.
 *
 * A first-time player reported that the brightest, glowing node on the chart
 * was the square they were already standing on, and that tapping it did
 * nothing at all. Two halves, and this file pins the screen half:
 * `onNodePress` fell through to a silent `return` for `kind === 'current'`,
 * so the one node the eye went to first was the one node that answered
 * nothing. (The glyph half — sulfur beacon on `available`, muted bone pin on
 * `current` — is pinned in `components/__tests__/NodeMark.test.tsx`.)
 *
 * Hermetic = self-contained + deterministic + isolated. See `docs/testing.md`.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
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
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { selectExplorationViewModel } from '@/state/presenters/exploration.engine';
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
    // The start-node arrival is deferred a tick (see the screen's own
    // comment); advance by one so the map settles, not `runAllTimers()` —
    // the map hint arms a long-lived timer that would never drain.
    act(() => { jest.advanceTimersByTime(1); });
    return tree;
}

describe('S4-world-C06: every node kind answers a tap', () => {
    it('the node the player stands on says so instead of going silent', () => {
        const store = makeStore();
        const vm = selectExplorationViewModel(store.getState());
        const current = vm.nodes.find((n) => n.kind === 'current')!;
        expect(current).toBeDefined();

        const tree = mountExploration(store);
        expect(tree.queryByTestId('exploration-node-toast')).toBeNull();

        act(() => {
            fireEvent.press(tree.getByTestId(`node-${current.id}`));
        });

        const toast = tree.getByTestId('exploration-node-toast');
        expect(toast).toBeTruthy();
        expect(tree.getByText('you stand here')).toBeTruthy();
    });

    it('tapping where you stand never opens the confirm panel', () => {
        const store = makeStore();
        const vm = selectExplorationViewModel(store.getState());
        const current = vm.nodes.find((n) => n.kind === 'current')!;

        const tree = mountExploration(store);
        act(() => {
            fireEvent.press(tree.getByTestId(`node-${current.id}`));
        });

        // The confirm panel is the CONSEQUENCE of selecting a reachable node;
        // standing still is not a move to confirm.
        expect(tree.queryByTestId('node-confirm-panel')).toBeNull();
    });

    it('a reachable node still selects rather than toasting', () => {
        const store = makeStore();
        const vm = selectExplorationViewModel(store.getState());
        const open = vm.nodes.find((n) => n.kind === 'available')!;
        expect(open).toBeDefined();

        const tree = mountExploration(store);
        act(() => {
            fireEvent.press(tree.getByTestId(`node-${open.id}`));
        });

        expect(tree.queryByTestId('exploration-node-toast')).toBeNull();
        expect(tree.getByTestId('node-confirm-panel')).toBeTruthy();
        expect(tree.getByTestId('node-confirm-go')).toBeTruthy();
    });
});
