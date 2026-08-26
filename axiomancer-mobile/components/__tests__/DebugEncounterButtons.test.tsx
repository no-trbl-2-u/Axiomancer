/**
 * Hermetic component tests — DebugEncounterButtons.
 *
 * Pins the DEV gate + the action-routing contract: tapping
 * fires beginRest() and beginLootCacheChoice(), flipping the respective
 * session signals. The corresponding Gate components handle router
 * navigation.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugEncounterButtons } from '@/components/DebugEncounterButtons';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const mockPush = jest.fn();
jest.mock('@/lib/platform/router', () => ({
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

describe('DebugEncounterButtons: DEV gate', () => {
    it('renders the buttons when dev tools are enabled (jest default)', () => {
        const store = makeStore();
        const tree = render(withProviders(store, <DebugEncounterButtons />));
        expect(tree.queryByTestId('debug-rest-button')).not.toBeNull();
        expect(tree.queryByTestId('debug-cache-button')).not.toBeNull();
    });

    it('renders null when dev tools are disabled (production build simulation)', () => {
        // Mock the buildProfile module to return false for isDevToolsEnabled
        const buildProfile = require('@/lib/buildProfile');
        const original = buildProfile.isDevToolsEnabled;
        buildProfile.isDevToolsEnabled = jest.fn(() => false);

        try {
            const store = makeStore();
            const tree = render(withProviders(store, <DebugEncounterButtons />));
            expect(tree.queryByTestId('debug-rest-button')).toBeNull();
            expect(tree.queryByTestId('debug-cache-button')).toBeNull();
        } finally {
            buildProfile.isDevToolsEnabled = original;
        }
    });
});

describe('DebugEncounterButtons: press routing', () => {
    it('rest button calls beginRest — engine state has an active rest session afterwards', () => {
        const store = makeStore();
        expect(store.getState().rest?.session).toBeNull();

        const tree = render(withProviders(store, <DebugEncounterButtons />));
        fireEvent.press(tree.getByTestId('debug-rest-button'));

        // After beginRest fires, the engine populates the rest slice.
        expect(store.getState().rest?.session).not.toBeNull();
        expect(store.getState().rest?.session?.phase).toBe('offer');
    });

    it('cache button calls beginLootCacheChoice — engine state has an active cache session afterwards', () => {
        const store = makeStore();
        expect(store.getState().cache?.session).toBeNull();

        const tree = render(withProviders(store, <DebugEncounterButtons />));
        fireEvent.press(tree.getByTestId('debug-cache-button'));

        // After beginLootCacheChoice fires, the engine populates the cache slice.
        expect(store.getState().cache?.session).not.toBeNull();
        expect(store.getState().cache?.session?.phase).toBe('offer');
    });

    it('cache button with seeded currency — session carries the requested currency candidate', () => {
        const store = makeStore();
        expect(store.getState().cache?.session).toBeNull();

        const tree = render(withProviders(store, <DebugEncounterButtons />));
        fireEvent.press(tree.getByTestId('debug-cache-button'));

        // The component hardcodes currency: 10.
        const cacheState = store.getState().cache;
        expect(cacheState?.session).not.toBeNull();
        expect(cacheState?.session?.currencyCandidate).toBe(10);
    });
});

describe('DebugEncounterButtons: accessibility', () => {
    it('exposes accessibilityRole=button and descriptive labels for all buttons', () => {
        const store = makeStore();
        const tree = render(withProviders(store, <DebugEncounterButtons />));

        const restBtn = tree.getByTestId('debug-rest-button');
        expect(restBtn.props.accessibilityRole).toBe('button');
        expect(restBtn.props.accessibilityLabel).toMatch(/camp|rest/i);

        const cacheBtn = tree.getByTestId('debug-cache-button');
        expect(cacheBtn.props.accessibilityRole).toBe('button');
        expect(cacheBtn.props.accessibilityLabel).toMatch(/dig|cache|loot/i);
    });
});
