/**
 * Hermetic component tests — DebugHudOverrides (2026-09 audit: one live toggle).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - HIDE EFFECTS flips devOverrides.hud.hideEffects and shows a checkmark
 *   - RESET clears it and is safe when nothing is set
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugHudOverrides } from '@/components/DebugHudOverrides';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
});

const makeStore = (): AppStore => createAppStore({ adapter: createMemoryAdapter() });
const withProvider = (store: AppStore, child: React.ReactNode) => <GameStoreProvider store={store}>{child}</GameStoreProvider>;

describe('DebugHudOverrides: DEV gate', () => {
    it('renders the effects toggle and RESET when __DEV__ is true', () => {
        const tree = render(withProvider(makeStore(), <DebugHudOverrides />));
        expect(tree.queryByTestId('debug-hud-hide-effects')).not.toBeNull();
        expect(tree.queryByTestId('debug-hud-reset-all')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        const g = global as unknown as { __DEV__: boolean };
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const tree = render(withProvider(makeStore(), <DebugHudOverrides />));
            expect(tree.queryByTestId('debug-hud-hide-effects')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugHudOverrides: toggle + reset', () => {
    it('HIDE EFFECTS flips devOverrides.hud.hideEffects and shows the checkmark label', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugHudOverrides />));
        fireEvent.press(tree.getByTestId('debug-hud-hide-effects'));
        expect(store.getState().devOverrides.hud.hideEffects).toBe(true);
        expect(tree.getByText('✓ EFFECTS HIDDEN')).toBeTruthy();
        fireEvent.press(tree.getByTestId('debug-hud-hide-effects'));
        expect(store.getState().devOverrides.hud.hideEffects).toBe(false);
    });

    it('RESET clears the override and is safe when nothing is set', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugHudOverrides />));
        fireEvent.press(tree.getByTestId('debug-hud-reset-all'));
        expect(store.getState().devOverrides.hud.hideEffects).toBe(false);
        fireEvent.press(tree.getByTestId('debug-hud-hide-effects'));
        fireEvent.press(tree.getByTestId('debug-hud-reset-all'));
        expect(store.getState().devOverrides.hud.hideEffects).toBe(false);
    });
});
