/**
 * Hermetic component tests — EventGate.
 *
 * EventGate is a side-effect-only component (returns null) that
 * pushes the user into the full-screen `/event` route whenever
 * `selectHasActivePacedEvent` flips true. Combat-prelude events
 * stay out of the router (they render via EncounterModalOverlay
 * over the exploration map). Coverage gap filed by `/iterate`
 * 2026-05-20.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import React from 'react';
import type { ResolveMapEventResult } from 'axiomancer-mechanics';

import { EventGate } from '@/components/EventGate';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import {
    EMPTY_EVENT_SLICE,
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
    // Return a stable reference so the EventGate useEffect's
    // [hasPacedEvent, router] dep array doesn't fire on every
    // re-render (matches expo-router's production behavior).
    useRouter: () => mockRouter,
}));

afterEach(() => {
    mockPush.mockClear();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function setPending(store: AppStore, result: ResolveMapEventResult) {
    store.setState({
        event: {
            ...EMPTY_EVENT_SLICE,
            pending: result,
        },
    });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

function makeEncounterResult(): ResolveMapEventResult {
    const enemy = {
        id: 'cairn-rot',
        name: 'Cairn-rot',
        level: 3,
        health: 24,
    } as never;
    return {
        state: undefined as never,
        event: {
            kind: 'encounter',
            // Phase 60b — canonical {enemies, origin} shape.
            encounter: { enemies: [enemy], origin: 'fishing-village:fv-3' } as never,
            isBoss: false,
        },
    };
}

function makeRestResult(healed: number): ResolveMapEventResult {
    return {
        state: undefined as never,
        event: { kind: 'rest', healed, healFraction: 1 },
    };
}

describe('EventGate: paced events route to /event', () => {
    it('does not push when there is no pending event (fresh store)', () => {
        const store = makeStore();
        render(withProvider(store, <EventGate />));
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not push for a combat-prelude (encounter) event', () => {
        const store = makeStore();
        setPending(store, makeEncounterResult());
        render(withProvider(store, <EventGate />));
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('pushes /event when a paced (rest) event is pending at mount', () => {
        const store = makeStore();
        setPending(store, makeRestResult(5));
        render(withProvider(store, <EventGate />));
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/event');
    });

    it('pushes /event when the state flips from no-event to paced', () => {
        const store = makeStore();
        render(withProvider(store, <EventGate />));
        expect(mockPush).not.toHaveBeenCalled();

        act(() => {
            setPending(store, makeRestResult(3));
        });
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/event');
    });

    it('does not re-push when the paced event stays pending across re-renders', () => {
        const store = makeStore();
        setPending(store, makeRestResult(4));
        const tree = render(withProvider(store, <EventGate />));
        expect(mockPush).toHaveBeenCalledTimes(1);

        // Force a re-render of the gate without changing the selector value.
        act(() => {
            tree.rerender(withProvider(store, <EventGate />));
        });
        // The useEffect dep is the boolean from the selector, which is
        // stable across this re-render — no additional push.
        expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('renders nothing (side-effect-only)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <EventGate />));
        expect(tree.toJSON()).toBeNull();
    });
});
