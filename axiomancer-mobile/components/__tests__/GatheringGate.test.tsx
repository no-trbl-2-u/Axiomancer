/**
 * Hermetic component tests — GatheringGate.
 *
 * GatheringGate is a side-effect-only component (returns null) that
 * pushes the user into the full-screen `/gathering` route whenever
 * `selectHasActiveGathering` flips true. Coverage gap filed by `/iterate`
 * 2026-06-14.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import React from 'react';
import type { GatheringSessionState } from 'axiomancer-mechanics';

import { GatheringGate } from '@/components/GatheringGate';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import {
    EMPTY_GATHERING_SLICE,
    createAppStore,
    type AppStore,
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
    // Return a stable reference so the GatheringGate useEffect's
    // [hasGathering, router] dep array doesn't fire on every
    // re-render (matches expo-router's production behavior).
    useRouter: () => mockRouter,
}));

afterEach(() => {
    mockPush.mockClear();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function setActiveSession(store: AppStore, session: GatheringSessionState | null) {
    store.setState({
        gathering: {
            ...EMPTY_GATHERING_SLICE,
            session,
        },
    });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

function makeMockSession(): GatheringSessionState {
    return {
        siteId: 'coastal-grove',
        toolId: 'worn-sickle',
        plotId: 'herb-bounty',
        offeringId: null,
        boonId: null,
        keywords: [],
        turnCount: 0,
        maxTurns: 8,
        completed: false,
        success: null,
        rewards: [],
    } as never;
}

describe('GatheringGate: active sessions route to /gathering', () => {
    it('does not push when there is no active session (fresh store)', () => {
        const store = makeStore();
        render(withProvider(store, <GatheringGate />));
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('pushes /gathering when a session is active at mount', () => {
        const store = makeStore();
        setActiveSession(store, makeMockSession());
        render(withProvider(store, <GatheringGate />));
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/gathering');
    });

    it('pushes /gathering when the state flips from no-session to active', () => {
        const store = makeStore();
        render(withProvider(store, <GatheringGate />));
        expect(mockPush).not.toHaveBeenCalled();

        act(() => {
            setActiveSession(store, makeMockSession());
        });
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/gathering');
    });

    it('does not re-push when the session stays active across re-renders', () => {
        const store = makeStore();
        setActiveSession(store, makeMockSession());
        const tree = render(withProvider(store, <GatheringGate />));
        expect(mockPush).toHaveBeenCalledTimes(1);

        // Force a re-render of the gate without changing the selector value.
        act(() => {
            tree.rerender(withProvider(store, <GatheringGate />));
        });
        // The useEffect dep is the boolean from the selector, which is
        // stable across this re-render — no additional push.
        expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('renders nothing (side-effect-only)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <GatheringGate />));
        expect(tree.toJSON()).toBeNull();
    });
});