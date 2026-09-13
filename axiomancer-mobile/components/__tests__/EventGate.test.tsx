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
import type { ResolveMapEventResult } from '@mechanics';

import { EventGate } from '@/components/EventGate';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import {
    EMPTY_EVENT_SLICE,
    createAppStore,
    type AppStore,
} from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const mockPush = jest.fn();

jest.mock('@/lib/platform/router', () => ({
    // S4-world-C03: the real `useRouter()` (lib/platform/router.ts) builds a
    // FRESH object literal on every call, so `router` changes identity on
    // every render and an effect keyed on it re-runs each time. This mock
    // reproduces that exactly — a stable reference here would hide the
    // double-push the gate now latches against.
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
        canGoBack: () => true,
    }),
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
        event: { kind: 'rest', healed, shelter: 'camp' },
    };
}

/** The opening omen: the paced event a fresh boot lands on first. */
function makeCutsceneResult(): ResolveMapEventResult {
    return {
        state: undefined as never,
        event: { kind: 'cutscene', lines: ['The tide goes out and does not come back.'] },
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

/**
 * S4-world-C03 — the opening omen mounted twice and buried the screen the
 * player asked for. `useRouter()` returns a new object every render, so the
 * gate's `[route, router]` effect re-fired (and re-pushed) on every re-render
 * of the root layout while an event was still pending. The gate now latches
 * the route it has already opened and releases the latch when the event
 * resolves.
 */
describe('EventGate: one push per event (S4-world-C03)', () => {
    it('pushes once across repeated re-renders with a fresh router each time', () => {
        const store = makeStore();
        setPending(store, makeRestResult(6));
        const tree = render(withProvider(store, <EventGate />));
        expect(mockPush).toHaveBeenCalledTimes(1);

        // Each re-render hands the effect a brand-new router object, exactly
        // as production does; the pending event has not changed.
        for (let i = 0; i < 4; i += 1) {
            act(() => {
                tree.rerender(withProvider(store, <EventGate />));
            });
        }
        expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('routes the omen to /cutscene exactly once, not twice onto itself', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <EventGate />));

        act(() => {
            setPending(store, makeCutsceneResult());
        });
        act(() => {
            tree.rerender(withProvider(store, <EventGate />));
        });

        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/cutscene');
    });

    it('releases the latch when the event resolves, so the next event still routes', () => {
        const store = makeStore();
        render(withProvider(store, <EventGate />));

        act(() => {
            setPending(store, makeCutsceneResult());
        });
        expect(mockPush).toHaveBeenCalledTimes(1);

        // The player dismisses the omen — the slice empties.
        act(() => {
            store.setState({ event: { ...EMPTY_EVENT_SLICE, pending: null } });
        });
        expect(mockPush).toHaveBeenCalledTimes(1);

        // A second omen on a later node must open its screen again.
        act(() => {
            setPending(store, makeCutsceneResult());
        });
        expect(mockPush).toHaveBeenCalledTimes(2);
        expect(mockPush).toHaveBeenLastCalledWith('/cutscene');
    });
});
