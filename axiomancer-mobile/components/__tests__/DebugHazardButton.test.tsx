/**
 * Hermetic component tests — DebugHazardButton.
 *
 * Pins the DEV gate + the action-routing contract: tapping
 * fires beginHazard(), flips the hazard session signal.
 * The HazardGate component handles router navigation.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugHazardButton } from '@/components/DebugHazardButton';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
        canGoBack: () => false,
    }),
}));

afterEach(() => {
    mockPush.mockClear();
    jest.restoreAllMocks();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProviders(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

describe('DebugHazardButton: DEV gate', () => {
    it('renders the button when dev tools are enabled (jest default)', () => {
        const store = makeStore();
        const tree = render(withProviders(store, <DebugHazardButton />));
        expect(tree.queryByTestId('debug-hazard-button')).not.toBeNull();
    });

    it('renders null when dev tools are disabled (production build simulation)', () => {
        // Mock the buildProfile module to return false for isDevToolsEnabled
        const buildProfile = require('@/lib/buildProfile');
        const original = buildProfile.isDevToolsEnabled;
        buildProfile.isDevToolsEnabled = jest.fn(() => false);
        
        try {
            const store = makeStore();
            const tree = render(withProviders(store, <DebugHazardButton />));
            expect(tree.queryByTestId('debug-hazard-button')).toBeNull();
        } finally {
            buildProfile.isDevToolsEnabled = original;
        }
    });
});

describe('DebugHazardButton: press routing', () => {
    it('a tap calls beginHazard — engine state has an active hazard session afterwards', () => {
        const store = makeStore();
        expect(store.getState().hazard?.session).toBeNull();

        const tree = render(withProviders(store, <DebugHazardButton />));
        fireEvent.press(tree.getByTestId('debug-hazard-button'));

        // After beginHazard fires, the engine populates the hazard slice.
        expect(store.getState().hazard?.session).not.toBeNull();
    });
});

describe('DebugHazardButton: accessibility', () => {
    it('exposes accessibilityRole=button and a descriptive label', () => {
        const store = makeStore();
        const tree = render(withProviders(store, <DebugHazardButton />));
        const btn = tree.getByTestId('debug-hazard-button');
        expect(btn.props.accessibilityRole).toBe('button');
        expect(btn.props.accessibilityLabel).toMatch(/hazard/i);
    });
});