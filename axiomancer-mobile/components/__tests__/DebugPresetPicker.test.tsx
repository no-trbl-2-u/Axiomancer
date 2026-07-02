/**
 * Hermetic component tests — DebugPresetPicker (Phase 59).
 *
 * Pins the dev-only mount gate + the action-routing contract.
 * The full preset-application mutation is exercised in
 * `state/e2e/character-preset.engine.test.ts`; here we only
 * verify the component renders correctly in DEV, hides in
 * production, and routes presses through
 * `useGameActions().applyCharacterPreset(presetId)`.
 */

import { describe, expect, it } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugPresetPicker } from '@/components/DebugPresetPicker';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

describe('DebugPresetPicker: DEV gate', () => {
    it('renders the picker when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugPresetPicker />));
        expect(tree.queryByTestId('debug-preset-apprentice')).not.toBeNull();
        expect(tree.queryByTestId('debug-preset-wanderer')).not.toBeNull();
        expect(tree.queryByTestId('debug-preset-sage')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
         
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugPresetPicker />));
            expect(tree.queryByTestId('debug-preset-apprentice')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugPresetPicker: press routing', () => {
    it('a tap replaces the player slice with the chosen preset', () => {
        const store = makeStore();
        const nameBefore = store.getState().player.name;

        const tree = render(withProvider(store, <DebugPresetPicker />));
        fireEvent.press(tree.getByTestId('debug-preset-sage'));

        const playerAfter = store.getState().player;
        expect(playerAfter.name).toBe('Sage');
        expect(playerAfter.name).not.toBe(nameBefore);
    });

    it('subsequent taps swap the player slice cleanly without crashing', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugPresetPicker />));

        fireEvent.press(tree.getByTestId('debug-preset-apprentice'));
        expect(store.getState().player.name).toBe('Apprentice');

        expect(() =>
            fireEvent.press(tree.getByTestId('debug-preset-wanderer')),
        ).not.toThrow();
        expect(store.getState().player.name).toBe('Wanderer');
    });

    it('updates the visible subtitle with the applied preset id', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugPresetPicker />));
        expect(
            tree.queryByText('roster: apprentice / wanderer / sage'),
        ).not.toBeNull();

        fireEvent.press(tree.getByTestId('debug-preset-apprentice'));

        const text = JSON.stringify(tree.toJSON());
        expect(text).toMatch(/applied · apprentice/);
    });
});

describe('DebugPresetPicker: accessibility', () => {
    it('exposes accessibilityRole=button and a per-preset descriptive label', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugPresetPicker />));
        const btn = tree.getByTestId('debug-preset-sage');
        expect(btn.props.accessibilityRole).toBe('button');
        expect(btn.props.accessibilityLabel).toMatch(/sage/i);
    });
});
