/**
 * Hermetic component tests — DebugStateInspector.
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - RUN + PLAYER open by default; a section chip toggles its group
 *   - Rows re-render on store change (live view)
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugStateInspector } from '@/components/DebugStateInspector';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
});

const makeStore = (): AppStore => createAppStore({ adapter: createMemoryAdapter() });
const withProvider = (store: AppStore, child: React.ReactNode) => <GameStoreProvider store={store}>{child}</GameStoreProvider>;

describe('DebugStateInspector', () => {
    it('opens RUN + PLAYER by default and toggles a section on tap', () => {
        const tree = render(withProvider(makeStore(), <DebugStateInspector />));
        expect(tree.queryByTestId('debug-state-group-run')).not.toBeNull();
        expect(tree.queryByTestId('debug-state-group-player')).not.toBeNull();
        expect(tree.queryByTestId('debug-state-group-world')).toBeNull();
        fireEvent.press(tree.getByTestId('debug-state-section-world'));
        expect(tree.queryByTestId('debug-state-group-world')).not.toBeNull();
        fireEvent.press(tree.getByTestId('debug-state-section-run'));
        expect(tree.queryByTestId('debug-state-group-run')).toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        const g = global as unknown as { __DEV__: boolean };
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            expect(render(withProvider(makeStore(), <DebugStateInspector />)).queryByTestId('debug-state-inspector')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });

    it('rows track store changes', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugStateInspector />));
        expect(tree.queryByText('4242')).toBeNull();
        act(() => {
            store.setState({ player: { ...store.getState().player, currency: 4242 } });
        });
        expect(tree.getByText('4242')).toBeTruthy();
    });
});
