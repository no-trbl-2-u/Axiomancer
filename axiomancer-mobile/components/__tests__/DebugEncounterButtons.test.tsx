/**
 * Hermetic component tests — DebugEncounterButtons.
 *
 * Pins the DEV gate + the action-routing contract: tapping
 * fires beginQuestBoard(), beginRest(), and beginLootCache(),
 * flipping the respective session signals. The corresponding
 * Gate components handle router navigation.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugEncounterButtons } from '@/components/DebugEncounterButtons';
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

describe('DebugEncounterButtons: DEV gate', () => {
    it('renders the buttons when dev tools are enabled (jest default)', () => {
        const store = makeStore();
        const tree = render(withProviders(store, <DebugEncounterButtons />));
        expect(tree.queryByTestId('debug-quest-button')).not.toBeNull();
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
            expect(tree.queryByTestId('debug-quest-button')).toBeNull();
            expect(tree.queryByTestId('debug-rest-button')).toBeNull();
            expect(tree.queryByTestId('debug-cache-button')).toBeNull();
        } finally {
            buildProfile.isDevToolsEnabled = original;
        }
    });
});

describe('DebugEncounterButtons: press routing', () => {
    it('quest button calls beginQuestBoard — engine state has an active quest session afterwards', () => {
        const store = makeStore();
        expect(store.getState().quest?.session).toBeNull();

        const tree = render(withProviders(store, <DebugEncounterButtons />));
        fireEvent.press(tree.getByTestId('debug-quest-button'));

        // After beginQuestBoard fires, the engine populates the quest slice.
        expect(store.getState().quest?.session).not.toBeNull();
        expect(store.getState().quest?.session?.phase).toBe('intro');
    });

    it('rest button calls beginRest — engine state has an active rest session afterwards', () => {
        const store = makeStore();
        expect(store.getState().rest?.session).toBeNull();

        const tree = render(withProviders(store, <DebugEncounterButtons />));
        fireEvent.press(tree.getByTestId('debug-rest-button'));

        // After beginRest fires, the engine populates the rest slice.
        expect(store.getState().rest?.session).not.toBeNull();
        expect(store.getState().rest?.session?.phase).toBe('posture');
    });

    it('cache button calls beginLootCache — engine state has an active cache session afterwards', () => {
        const store = makeStore();
        expect(store.getState().cache?.session).toBeNull();

        const tree = render(withProviders(store, <DebugEncounterButtons />));
        fireEvent.press(tree.getByTestId('debug-cache-button'));

        // After beginLootCache fires, the engine populates the cache slice.
        expect(store.getState().cache?.session).not.toBeNull();
        expect(store.getState().cache?.session?.phase).toBe('intro');
    });

    it('quest button with specific boardId — session contains the requested board', () => {
        const store = makeStore();
        expect(store.getState().quest?.session).toBeNull();

        const tree = render(withProviders(store, <DebugEncounterButtons />));
        fireEvent.press(tree.getByTestId('debug-quest-button'));

        // The component hardcodes boardId: 'build-the-boat', verify it's used.
        const questState = store.getState().quest;
        expect(questState?.session).not.toBeNull();
        expect(questState?.session?.boardId).toBe('build-the-boat');
    });

    it('cache button with seeded currency — session contains the requested currency', () => {
        const store = makeStore();
        expect(store.getState().cache?.session).toBeNull();

        const tree = render(withProviders(store, <DebugEncounterButtons />));
        fireEvent.press(tree.getByTestId('debug-cache-button'));

        // The component hardcodes currency: 10, verify it's distributed to layers.
        const cacheState = store.getState().cache;
        expect(cacheState?.session).not.toBeNull();
        const totalCurrency = cacheState?.session?.layers.reduce((sum, layer) => sum + layer.loot.currency, 0) ?? 0;
        expect(totalCurrency).toBeGreaterThan(0); // Should have some currency distributed across layers
    });
});

describe('DebugEncounterButtons: accessibility', () => {
    it('exposes accessibilityRole=button and descriptive labels for all buttons', () => {
        const store = makeStore();
        const tree = render(withProviders(store, <DebugEncounterButtons />));
        
        const questBtn = tree.getByTestId('debug-quest-button');
        expect(questBtn.props.accessibilityRole).toBe('button');
        expect(questBtn.props.accessibilityLabel).toMatch(/unfold|quest|board/i);
        
        const restBtn = tree.getByTestId('debug-rest-button');
        expect(restBtn.props.accessibilityRole).toBe('button');
        expect(restBtn.props.accessibilityLabel).toMatch(/camp|rest/i);
        
        const cacheBtn = tree.getByTestId('debug-cache-button');
        expect(cacheBtn.props.accessibilityRole).toBe('button');
        expect(cacheBtn.props.accessibilityLabel).toMatch(/dig|cache|loot/i);
    });
});