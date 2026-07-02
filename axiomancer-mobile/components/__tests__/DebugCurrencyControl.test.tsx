/**
 * Hermetic component tests — DebugCurrencyControl (Phase 87).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - +50S button increments player.currency by 50
 *   - +500S button increments player.currency by 500
 *   - BROKE button sets player.currency to 0
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugCurrencyControl } from '@/components/DebugCurrencyControl';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

describe('DebugCurrencyControl: DEV gate', () => {
    it('renders all buttons when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugCurrencyControl />));
        expect(tree.queryByTestId('debug-currency-small-grant')).not.toBeNull();
        expect(tree.queryByTestId('debug-currency-large-grant')).not.toBeNull();
        expect(tree.queryByTestId('debug-currency-broke')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugCurrencyControl />));
            expect(tree.queryByTestId('debug-currency-small-grant')).toBeNull();
            expect(tree.queryByTestId('debug-currency-large-grant')).toBeNull();
            expect(tree.queryByTestId('debug-currency-broke')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugCurrencyControl: press routing', () => {
    it('+50S button adds 50 to player.currency', () => {
        const store = makeStore();
        const before = Number(store.getState().player.currency ?? 0);

        const tree = render(withProvider(store, <DebugCurrencyControl />));
        fireEvent.press(tree.getByTestId('debug-currency-small-grant'));

        const after = Number(store.getState().player.currency ?? 0);
        expect(after).toBe(before + 50);
    });

    it('+500S button adds 500 to player.currency', () => {
        const store = makeStore();
        const before = Number(store.getState().player.currency ?? 0);

        const tree = render(withProvider(store, <DebugCurrencyControl />));
        fireEvent.press(tree.getByTestId('debug-currency-large-grant'));

        const after = Number(store.getState().player.currency ?? 0);
        expect(after).toBe(before + 500);
    });

    it('grant buttons are additive — 50 + 500 adds 550 total', () => {
        const store = makeStore();
        const before = Number(store.getState().player.currency ?? 0);

        const tree = render(withProvider(store, <DebugCurrencyControl />));
        fireEvent.press(tree.getByTestId('debug-currency-small-grant'));
        fireEvent.press(tree.getByTestId('debug-currency-large-grant'));

        expect(Number(store.getState().player.currency ?? 0)).toBe(before + 550);
    });

    it('BROKE button sets player.currency to 0', () => {
        const store = makeStore();
        // Seed some currency first
        store.setState({
            player: { ...store.getState().player, currency: 1000 },
        });

        const tree = render(withProvider(store, <DebugCurrencyControl />));
        fireEvent.press(tree.getByTestId('debug-currency-broke'));

        expect(Number(store.getState().player.currency ?? 0)).toBe(0);
    });

    it('currency grants clamp to non-negative values', () => {
        const store = makeStore();
        // Edge case: start with negative value (shouldn't happen but defensive)
        store.setState({
            player: { ...store.getState().player, currency: -100 },
        });

        const tree = render(withProvider(store, <DebugCurrencyControl />));
        fireEvent.press(tree.getByTestId('debug-currency-small-grant'));

        expect(Number(store.getState().player.currency ?? 0)).toBe(0); // max(0, -100 + 50) = 0
    });
});

describe('DebugCurrencyControl: accessibility', () => {
    it('exposes accessibilityRole=button and descriptive labels', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugCurrencyControl />));

        const smallGrant = tree.getByTestId('debug-currency-small-grant');
        expect(smallGrant.props.accessibilityRole).toBe('button');
        expect(smallGrant.props.accessibilityLabel).toMatch(/50.*shilling/i);

        const largeGrant = tree.getByTestId('debug-currency-large-grant');
        expect(largeGrant.props.accessibilityRole).toBe('button');
        expect(largeGrant.props.accessibilityLabel).toMatch(/500.*shilling/i);

        const broke = tree.getByTestId('debug-currency-broke');
        expect(broke.props.accessibilityRole).toBe('button');
        expect(broke.props.accessibilityLabel).toMatch(/zero/i);
    });
});