/**
 * Hermetic component tests — ToastHost (Phase 29 Tick B).
 *
 * ToastHost is the global transient-feedback strip. Subscribes
 * to engine events for inventory-driven toasts AND renders the
 * current `notifications.toast` slice with a 3-second TTL.
 *
 * The selector path (`selectInventoryToast`) already has unit
 * coverage in `state/e2e/inventory-feedback.engine.test.ts`.
 * This file covers the **component lifecycle**: the render
 * gate (null when no toast), the auto-clear after TOAST_TTL_MS,
 * the race protection (a newer toast id is not wiped by an
 * older timer), and the accessibilityLiveRegion contract.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import React from 'react';

import { ToastHost } from '@/components/ToastHost';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, getEmitterForStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const TOAST_TTL_MS = 3000;

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

/** Push a toast directly into the notifications slice with the
 * given id, bypassing the event-emitter path (covered separately). */
function pushToast(store: AppStore, text: string, id = 1) {
    const prev = store.getState().notifications;
    store.setState({
        notifications: {
            levelUpAcknowledged: prev?.levelUpAcknowledged ?? true,
            toast: { text, id },
        },
    });
}

describe('ToastHost: render gate', () => {
    it('renders nothing when toast.text is null (initial state)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <ToastHost />));
        expect(tree.toJSON()).toBeNull();
    });

    it('renders the toast text when notifications.toast.text is set', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <ToastHost />));

        act(() => {
            pushToast(store, 'Picked up Iron Tonic.');
        });

        expect(tree.queryByText('Picked up Iron Tonic.')).not.toBeNull();
    });
});

describe('ToastHost: TTL auto-clear', () => {
    it('clears the toast after TOAST_TTL_MS (3 seconds)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <ToastHost />));

        act(() => {
            pushToast(store, 'Equipped Ash Blade.');
        });
        expect(tree.queryByText('Equipped Ash Blade.')).not.toBeNull();

        act(() => {
            jest.advanceTimersByTime(TOAST_TTL_MS);
        });

        expect(tree.queryByText('Equipped Ash Blade.')).toBeNull();
        expect(store.getState().notifications?.toast?.text).toBeNull();
    });

    it('does not clear before the TTL elapses', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <ToastHost />));

        act(() => {
            pushToast(store, 'Used.');
        });

        act(() => {
            jest.advanceTimersByTime(TOAST_TTL_MS - 1);
        });
        expect(tree.queryByText('Used.')).not.toBeNull();
    });
});

describe('ToastHost: race protection', () => {
    it('an older timer does not wipe a newer toast', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <ToastHost />));

        // First toast at id=1.
        act(() => {
            pushToast(store, 'Equipped.', 1);
        });
        // Advance halfway through the first toast's TTL.
        act(() => {
            jest.advanceTimersByTime(1500);
        });
        // Second toast at id=2 — its timer starts now.
        act(() => {
            pushToast(store, 'Unequipped.', 2);
        });
        // Let the first toast's timer fire. It checks `cur.toast.id`
        // and finds 2, so it must NOT clear the slice.
        act(() => {
            jest.advanceTimersByTime(1500);
        });

        // 1500ms after the second toast arrived; well before its
        // 3000ms TTL — it should still be on screen.
        expect(tree.queryByText('Unequipped.')).not.toBeNull();
        expect(store.getState().notifications?.toast?.text).toBe('Unequipped.');

        // Let the second toast's timer fire.
        act(() => {
            jest.advanceTimersByTime(TOAST_TTL_MS);
        });
        expect(tree.queryByText('Unequipped.')).toBeNull();
    });
});

describe('ToastHost: emitter path', () => {
    it('shows a toast when an inventory:changed event fires with an item name', () => {
        const store = makeStore();
        const emitter = getEmitterForStore(store);
        const tree = render(withProvider(store, <ToastHost />));

        act(() => {
            emitter?.emit({
                type: 'inventory:changed',
                payload: { item: { id: 'healing-potion-1', name: 'Healing Potion' }, state: {} } as never,
            });
        });

        expect(tree.queryByText('Picked up Healing Potion.')).not.toBeNull();
    });

    it('does not throw or loop when four inventory:changed events fire in rapid succession', () => {
        const store = makeStore();
        const emitter = getEmitterForStore(store);
        const tree = render(withProvider(store, <ToastHost />));

        // Simulate 4 items added synchronously (the DevAutoSeed / chest scenario
        // that previously caused "Maximum update depth exceeded").
        expect(() => {
            act(() => {
                for (let i = 1; i <= 4; i++) {
                    emitter?.emit({
                        type: 'inventory:changed',
                        payload: { item: { id: `item-${i}`, name: `Item ${i}` }, state: {} } as never,
                    });
                }
            });
        }).not.toThrow();

        // Last toast wins — the id has incremented but the component is stable.
        expect(store.getState().notifications?.toast?.id).toBe(4);
        expect(tree.toJSON()).not.toBeNull();
    });

    it('stays silent for inventory:changed events without an item name', () => {
        const store = makeStore();
        const emitter = getEmitterForStore(store);
        const tree = render(withProvider(store, <ToastHost />));

        act(() => {
            // removeItem path — no item name in payload
            emitter?.emit({
                type: 'inventory:changed',
                payload: { state: {} } as never,
            });
        });

        expect(tree.toJSON()).toBeNull();
        expect(store.getState().notifications?.toast?.text).toBeNull();
    });
});

describe('ToastHost: accessibility', () => {
    it('marks the host with accessibilityLiveRegion="polite"', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <ToastHost />));
        act(() => {
            pushToast(store, 'Picked up Iron Tonic.');
        });
        // Walk up from the Text until we find the View carrying
        // accessibilityLiveRegion — production component nests
        // <View live> > <View> > <Text>, but the testing-library
        // tree may add wrapper levels.
        type Walkable = { props: { accessibilityLiveRegion?: string }; parent: Walkable | null };
        let node: Walkable | null = tree.getByText('Picked up Iron Tonic.') as unknown as Walkable;
        let live: string | undefined;
        for (let i = 0; i < 6 && node; i++) {
            if (node.props.accessibilityLiveRegion) {
                live = node.props.accessibilityLiveRegion;
                break;
            }
            node = node.parent;
        }
        expect(live).toBe('polite');
    });
});
