/**
 * Hermetic component tests — DebugFlags.
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - A chip flips its flag on GameState.flags
 *   - ALL TUTS ON / OFF batch every tutorial flag
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugFlags } from '@/components/DebugFlags';
import { KNOWN_FLAGS, TUTORIAL_FLAGS } from '@/state/dev/flags';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
});

const makeStore = (): AppStore => createAppStore({ adapter: createMemoryAdapter() });
const withProvider = (store: AppStore, child: React.ReactNode) => <GameStoreProvider store={store}>{child}</GameStoreProvider>;

describe('DebugFlags', () => {
    it('renders a chip per known flag', () => {
        const tree = render(withProvider(makeStore(), <DebugFlags />));
        for (const f of KNOWN_FLAGS) expect(tree.queryByTestId(`debug-flag-${f.flag}`)).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        const g = global as unknown as { __DEV__: boolean };
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const tree = render(withProvider(makeStore(), <DebugFlags />));
            expect(tree.queryByTestId('debug-flags-tuts-on')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });

    it('a chip flips its flag', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugFlags />));
        fireEvent.press(tree.getByTestId('debug-flag-combat-tutorial-done'));
        expect(store.getState().flags).toContain('combat-tutorial-done');
        fireEvent.press(tree.getByTestId('debug-flag-combat-tutorial-done'));
        expect(store.getState().flags).not.toContain('combat-tutorial-done');
    });

    it('ALL TUTS ON / OFF batch the tutorial flags', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugFlags />));
        fireEvent.press(tree.getByTestId('debug-flags-tuts-on'));
        for (const f of TUTORIAL_FLAGS) expect(store.getState().flags).toContain(f);
        fireEvent.press(tree.getByTestId('debug-flags-tuts-off'));
        for (const f of TUTORIAL_FLAGS) expect(store.getState().flags).not.toContain(f);
    });
});
