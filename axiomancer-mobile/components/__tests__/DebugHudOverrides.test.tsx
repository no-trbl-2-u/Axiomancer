/**
 * Hermetic component tests — DebugHudOverrides (Phase 87).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - Toggle buttons set devOverrides.hud flags
 *   - Active overrides show visual feedback (checkmark + style)
 *   - RESET ALL clears all overrides
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

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

describe('DebugHudOverrides: DEV gate', () => {
    it('renders all toggle buttons when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugHudOverrides />));
        expect(tree.queryByTestId('debug-hud-hide-mana')).not.toBeNull();
        expect(tree.queryByTestId('debug-hud-hide-effects')).not.toBeNull();
        expect(tree.queryByTestId('debug-hud-hide-stance')).not.toBeNull();
        expect(tree.queryByTestId('debug-hud-reset-all')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugHudOverrides />));
            expect(tree.queryByTestId('debug-hud-hide-mana')).toBeNull();
            expect(tree.queryByTestId('debug-hud-hide-effects')).toBeNull();
            expect(tree.queryByTestId('debug-hud-hide-stance')).toBeNull();
            expect(tree.queryByTestId('debug-hud-reset-all')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugHudOverrides: toggle behavior', () => {
    it('mana toggle flips devOverrides.hud.hideMana', () => {
        const store = makeStore();
        expect(store.getState().devOverrides.hud.hideMana).toBe(false);

        const tree = render(withProvider(store, <DebugHudOverrides />));
        fireEvent.press(tree.getByTestId('debug-hud-hide-mana'));

        expect(store.getState().devOverrides.hud.hideMana).toBe(true);

        // Toggle back
        fireEvent.press(tree.getByTestId('debug-hud-hide-mana'));
        expect(store.getState().devOverrides.hud.hideMana).toBe(false);
    });

    it('effects toggle flips devOverrides.hud.hideEffects', () => {
        const store = makeStore();
        expect(store.getState().devOverrides.hud.hideEffects).toBe(false);

        const tree = render(withProvider(store, <DebugHudOverrides />));
        fireEvent.press(tree.getByTestId('debug-hud-hide-effects'));

        expect(store.getState().devOverrides.hud.hideEffects).toBe(true);
    });

    it('stance toggle flips devOverrides.hud.hideStance', () => {
        const store = makeStore();
        expect(store.getState().devOverrides.hud.hideStance).toBe(false);

        const tree = render(withProvider(store, <DebugHudOverrides />));
        fireEvent.press(tree.getByTestId('debug-hud-hide-stance'));

        expect(store.getState().devOverrides.hud.hideStance).toBe(true);
    });

    it('toggles are independent — can activate multiple overrides', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugHudOverrides />));
        
        fireEvent.press(tree.getByTestId('debug-hud-hide-mana'));
        fireEvent.press(tree.getByTestId('debug-hud-hide-effects'));

        const overrides = store.getState().devOverrides.hud;
        expect(overrides.hideMana).toBe(true);
        expect(overrides.hideEffects).toBe(true);
        expect(overrides.hideStance).toBe(false); // Still false
    });
});

describe('DebugHudOverrides: reset behavior', () => {
    it('RESET ALL clears all active overrides', () => {
        const store = makeStore();
        
        // Activate all overrides
        store.setState({
            devOverrides: {
                ...store.getState().devOverrides,
                hud: {
                    hideMana: true,
                    hideEffects: true,
                    hideStance: true,
                },
            },
        });

        const tree = render(withProvider(store, <DebugHudOverrides />));
        fireEvent.press(tree.getByTestId('debug-hud-reset-all'));

        const overrides = store.getState().devOverrides.hud;
        expect(overrides.hideMana).toBe(false);
        expect(overrides.hideEffects).toBe(false);
        expect(overrides.hideStance).toBe(false);
    });

    it('RESET ALL is safe when no overrides are active', () => {
        const store = makeStore();
        // All should be false already
        
        const tree = render(withProvider(store, <DebugHudOverrides />));
        fireEvent.press(tree.getByTestId('debug-hud-reset-all'));

        const overrides = store.getState().devOverrides.hud;
        expect(overrides.hideMana).toBe(false);
        expect(overrides.hideEffects).toBe(false);
        expect(overrides.hideStance).toBe(false);
    });
});

describe('DebugHudOverrides: visual feedback', () => {
    it('inactive buttons show "HIDE X" labels', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugHudOverrides />));

        expect(tree.getByTestId('debug-hud-hide-mana')).toHaveTextContent('HIDE MANA');
        expect(tree.getByTestId('debug-hud-hide-effects')).toHaveTextContent('HIDE EFFECTS');
        expect(tree.getByTestId('debug-hud-hide-stance')).toHaveTextContent('HIDE STANCE');
    });

    it('active buttons show "✓ X" labels (checkmark feedback)', () => {
        const store = makeStore();
        
        // Pre-activate mana override
        store.setState({
            devOverrides: {
                ...store.getState().devOverrides,
                hud: { ...store.getState().devOverrides.hud, hideMana: true },
            },
        });

        const tree = render(withProvider(store, <DebugHudOverrides />));
        expect(tree.getByTestId('debug-hud-hide-mana')).toHaveTextContent('✓ MANA');
    });
});

describe('DebugHudOverrides: accessibility', () => {
    it('exposes accessibilityRole=button and toggle-aware labels', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugHudOverrides />));

        const manaToggle = tree.getByTestId('debug-hud-hide-mana');
        expect(manaToggle.props.accessibilityRole).toBe('button');
        expect(manaToggle.props.accessibilityLabel).toMatch(/hide.*mana/i);

        const resetButton = tree.getByTestId('debug-hud-reset-all');
        expect(resetButton.props.accessibilityRole).toBe('button');
        expect(resetButton.props.accessibilityLabel).toMatch(/reset.*override/i);
    });
});