/**
 * Hermetic component tests — DebugGatheringButton.
 *
 * Pins the DEV gate + the action-routing contract: tapping
 * fires beginGathering(), flips the gathering session signal.
 * The GatheringGate component handles router navigation.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugGatheringButton } from '@/components/DebugGatheringButton';
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

describe('DebugGatheringButton: DEV gate', () => {
    it('renders the button when dev tools are enabled (jest default)', () => {
        const store = makeStore();
        const tree = render(withProviders(store, <DebugGatheringButton />));
        expect(tree.queryByTestId('debug-gathering-button')).not.toBeNull();
        expect(tree.queryByTestId('debug-gathering-tutorial-button')).not.toBeNull();
    });

    it('renders null when dev tools are disabled (production build simulation)', () => {
        // Mock the buildProfile module to return false for isDevToolsEnabled
        const buildProfile = require('@/lib/buildProfile');
        const original = buildProfile.isDevToolsEnabled;
        buildProfile.isDevToolsEnabled = jest.fn(() => false);
        
        try {
            const store = makeStore();
            const tree = render(withProviders(store, <DebugGatheringButton />));
            expect(tree.queryByTestId('debug-gathering-button')).toBeNull();
            expect(tree.queryByTestId('debug-gathering-tutorial-button')).toBeNull();
        } finally {
            buildProfile.isDevToolsEnabled = original;
        }
    });
});

describe('DebugGatheringButton: press routing', () => {
    it('a tap calls beginGathering — engine state has an active gathering session afterwards', () => {
        const store = makeStore();
        expect(store.getState().gathering?.session).toBeNull();

        const tree = render(withProviders(store, <DebugGatheringButton />));
        fireEvent.press(tree.getByTestId('debug-gathering-button'));

        // After beginGathering fires, the engine populates the gathering slice.
        expect(store.getState().gathering?.session).not.toBeNull();
    });

    it('tutorial button calls beginGathering with tutorial option — session has tutorial flag', () => {
        const store = makeStore();
        expect(store.getState().gathering?.session).toBeNull();

        const tree = render(withProviders(store, <DebugGatheringButton />));
        fireEvent.press(tree.getByTestId('debug-gathering-tutorial-button'));

        // After beginGathering fires with tutorial: true, the session should exist and tutorial flag should be set.
        const gatheringState = store.getState().gathering;
        expect(gatheringState?.session).not.toBeNull();
        expect(gatheringState?.tutorial).toBe(true);
    });

    it('normal gathering button creates session without tutorial flag', () => {
        const store = makeStore();
        expect(store.getState().gathering?.session).toBeNull();

        const tree = render(withProviders(store, <DebugGatheringButton />));
        fireEvent.press(tree.getByTestId('debug-gathering-button'));

        // After beginGathering fires without tutorial option, tutorial flag should be false.
        const gatheringState = store.getState().gathering;
        expect(gatheringState?.session).not.toBeNull();
        expect(gatheringState?.tutorial).toBe(false);
    });
});

describe('DebugGatheringButton: accessibility', () => {
    it('exposes accessibilityRole=button and descriptive labels for both buttons', () => {
        const store = makeStore();
        const tree = render(withProviders(store, <DebugGatheringButton />));
        
        const mainBtn = tree.getByTestId('debug-gathering-button');
        expect(mainBtn.props.accessibilityRole).toBe('button');
        expect(mainBtn.props.accessibilityLabel).toMatch(/gathering|gleaning/i);
        
        const tutorialBtn = tree.getByTestId('debug-gathering-tutorial-button');
        expect(tutorialBtn.props.accessibilityRole).toBe('button');
        expect(tutorialBtn.props.accessibilityLabel).toMatch(/gathering|tutorial/i);
    });
});