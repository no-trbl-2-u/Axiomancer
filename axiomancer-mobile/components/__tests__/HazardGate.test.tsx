/**
 * Hermetic component tests — HazardGate.
 *
 * HazardGate is a side-effect-only component (returns null) that
 * pushes the user into the full-screen `/hazard` route whenever
 * `selectHasActiveHazard` flips true. Coverage gap filed by `/iterate`
 * 2026-06-14.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import React from 'react';
import type { HazardSessionState } from 'axiomancer-mechanics';

import { HazardGate } from '@/components/HazardGate';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import {
    createAppStore,
    type AppStore,
    type MobileHazardSlice,
} from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const mockPush = jest.fn();
const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
};

jest.mock('expo-router', () => ({
    // Return a stable reference so the HazardGate useEffect's
    // [hasHazard, router] dep array doesn't fire on every
    // re-render (matches expo-router's production behavior).
    useRouter: () => mockRouter,
}));

afterEach(() => {
    mockPush.mockClear();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function setHazardSession(store: AppStore, session: HazardSessionState | null) {
    const hazardSlice: MobileHazardSlice = { session };
    store.setState({ hazard: hazardSlice });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

function makeHazardSession(): HazardSessionState {
    return {
        hazardId: 'thornwall-crossing',
        seed: 12345,
        phase: 'route-select',
        round: 1,
        totalRounds: 5,
        route: null,
        dice: [],
        hand: [],
        play: [],
        drawPile: [],
        discardPile: [],
        marks: [],
        progressBase: { force: 0, escape: 0 },
        modifiers: { auraForce: 0, auraEscape: 0, surgeForce: 0, surgeEscape: 0 },
        goldVow: null,
        resolveInfo: null,
        outcome: null,
    } as unknown as HazardSessionState;
}

describe('HazardGate: hazard session routes to /hazard', () => {
    it('does not push when there is no hazard session (fresh store)', () => {
        const store = makeStore();
        render(withProvider(store, <HazardGate />));
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('pushes /hazard when a hazard session is active at mount', async () => {
        const store = makeStore();
        setHazardSession(store, makeHazardSession());
        render(withProvider(store, <HazardGate />));
        
        // Wait for the setTimeout to execute
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/hazard');
    });

    it('pushes /hazard when the state flips from no-session to active', async () => {
        const store = makeStore();
        render(withProvider(store, <HazardGate />));
        expect(mockPush).not.toHaveBeenCalled();

        act(() => {
            setHazardSession(store, makeHazardSession());
        });
        
        // Wait for the setTimeout to execute
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/hazard');
    });

    it('does not re-push when the hazard session stays active across re-renders', async () => {
        const store = makeStore();
        setHazardSession(store, makeHazardSession());
        const tree = render(withProvider(store, <HazardGate />));
        
        // Wait for the initial setTimeout to execute
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(mockPush).toHaveBeenCalledTimes(1);

        // Force a re-render of the gate without changing the selector value.
        act(() => {
            tree.rerender(withProvider(store, <HazardGate />));
        });
        // The useEffect dep is the boolean from the selector, which is
        // stable across this re-render — no additional push.
        expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('resets flag when hazard session ends', async () => {
        const store = makeStore();
        setHazardSession(store, makeHazardSession());
        render(withProvider(store, <HazardGate />));
        
        // Wait for the initial setTimeout to execute
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(mockPush).toHaveBeenCalledTimes(1);

        // Clear the session
        act(() => {
            setHazardSession(store, null);
        });

        // Start a new session - should push again
        act(() => {
            setHazardSession(store, makeHazardSession());
        });
        
        // Wait for the second setTimeout to execute
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        
        expect(mockPush).toHaveBeenCalledTimes(2);
        expect(mockPush).toHaveBeenCalledWith('/hazard');
    });

    it('renders nothing (side-effect-only)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <HazardGate />));
        expect(tree.toJSON()).toBeNull();
    });
});