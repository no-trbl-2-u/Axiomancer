/**
 * Hermetic component tests — DebugXpGrant (Phase 61b).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - +100 XP button increments player.experience
 *   - FORCE LEVELUP button advances player.level via the engine's
 *     LEVEL_UP dispatch and re-arms the level-up notification.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugXpGrant } from '@/components/DebugXpGrant';
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

describe('DebugXpGrant: DEV gate', () => {
    it('renders both buttons when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugXpGrant />));
        expect(tree.queryByTestId('debug-xp-grant-button')).not.toBeNull();
        expect(tree.queryByTestId('debug-xp-levelup-button')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
         
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugXpGrant />));
            expect(tree.queryByTestId('debug-xp-grant-button')).toBeNull();
            expect(tree.queryByTestId('debug-xp-levelup-button')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugXpGrant: press routing', () => {
    it('grant button adds 100 to player.experience', () => {
        const store = makeStore();
        const before = store.getState().player.experience ?? 0;

        const tree = render(withProvider(store, <DebugXpGrant />));
        fireEvent.press(tree.getByTestId('debug-xp-grant-button'));

        const after = store.getState().player.experience ?? 0;
        expect(after).toBe(before + 100);
    });

    it('grant button is additive — two taps add 200 total', () => {
        const store = makeStore();
        const before = store.getState().player.experience ?? 0;

        const tree = render(withProvider(store, <DebugXpGrant />));
        fireEvent.press(tree.getByTestId('debug-xp-grant-button'));
        fireEvent.press(tree.getByTestId('debug-xp-grant-button'));

        expect((store.getState().player.experience ?? 0)).toBe(before + 200);
    });

    it('levelup button advances player.level via the engine LEVEL_UP dispatch', () => {
        const store = makeStore();
        const beforeLevel = store.getState().player.level;

        const tree = render(withProvider(store, <DebugXpGrant />));
        fireEvent.press(tree.getByTestId('debug-xp-levelup-button'));

        expect(store.getState().player.level).toBe(beforeLevel + 1);
    });

    it('levelup button re-arms levelUpAcknowledged (badge re-shows)', () => {
        const store = makeStore();
        // Provider boots with levelUpAcknowledged: true.
        expect(store.getState().notifications.levelUpAcknowledged).toBe(true);

        const tree = render(withProvider(store, <DebugXpGrant />));
        fireEvent.press(tree.getByTestId('debug-xp-levelup-button'));

        expect(store.getState().notifications.levelUpAcknowledged).toBe(false);
    });
});

describe('DebugXpGrant: accessibility', () => {
    it('exposes accessibilityRole=button and descriptive labels', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugXpGrant />));

        const grant = tree.getByTestId('debug-xp-grant-button');
        expect(grant.props.accessibilityRole).toBe('button');
        expect(grant.props.accessibilityLabel).toMatch(/experience/i);

        const levelup = tree.getByTestId('debug-xp-levelup-button');
        expect(levelup.props.accessibilityRole).toBe('button');
        expect(levelup.props.accessibilityLabel).toMatch(/level/i);
    });
});
