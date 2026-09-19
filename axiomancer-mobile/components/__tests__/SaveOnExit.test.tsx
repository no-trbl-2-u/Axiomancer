/**
 * SaveOnExit — PLAYTEST_BUGS_2026-09-18 BUG-03: nothing saved on the way out.
 *
 * The app had NO save-on-exit of any kind: `flush()` existed on the persistence
 * adapter with zero callers outside its own tests, and there was no `AppState`,
 * `pagehide` or `visibilitychange` handler anywhere in `app/`, `state/`, `lib/`
 * or `components/`. Combined with the adapter's 500ms write debounce, a player
 * could hit a real checkpoint, close the app, and lose it.
 *
 * This file covers the NATIVE `AppState` branch — the product's real target
 * (it ships as a mobile app), and the branch the default jest preset reports
 * (`Platform.OS === 'ios'`). The web/DOM branch needs a real `window` and so
 * lives in `SaveOnExit.web.test.tsx`, which runs under the jsdom environment.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { SaveOnExit } from '@/components/SaveOnExit';
import { withAllProviders } from '@/test-utils/withAllProviders';

type Flushable = { flush?: () => Promise<void> };

/** Mount the component with a stubbed adapter and a spied store `save`. */
function mount(adapter: Flushable) {
    const { store, tree } = withAllProviders(
        <SaveOnExit adapter={{ load: () => null, save: () => undefined, ...adapter } as never} />,
    );
    const save = jest.spyOn(store.getState(), 'save').mockImplementation(() => undefined);
    const rendered = render(tree);
    return { store, save, rendered };
}

/** Capture the AppState listener the component registers. */
function captureAppStateListener() {
    let handler: ((s: AppStateStatus) => void) | null = null;
    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_evt: string, cb: never) => {
        handler = cb as unknown as (s: AppStateStatus) => void;
        return { remove } as never;
    }) as never);
    return { fire: (s: AppStateStatus) => handler?.(s), remove };
}

function pinPlatform(os: 'web' | 'ios') {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
}

afterEach(() => {
    jest.restoreAllMocks();
    pinPlatform('ios');
});

// ── native: the product's real target ───────────────────────────────────────

describe('SaveOnExit — native AppState branch', () => {
    it('saves and flushes when the app goes to background', () => {
        pinPlatform('ios');
        const listener = captureAppStateListener();
        const flush = jest.fn(async () => undefined);
        const { save } = mount({ flush });

        listener.fire('background');

        // THE REGRESSION: before the fix neither of these ever happened —
        // there was no exit handler in the app at all.
        expect(save).toHaveBeenCalledTimes(1);
        expect(flush).toHaveBeenCalledTimes(1);
    });

    it('also fires on `inactive` — iOS may never deliver `background`', () => {
        pinPlatform('ios');
        const listener = captureAppStateListener();
        const flush = jest.fn(async () => undefined);
        const { save } = mount({ flush });

        listener.fire('inactive');

        expect(save).toHaveBeenCalledTimes(1);
        expect(flush).toHaveBeenCalledTimes(1);
    });

    it('does NOT save when the app returns to the foreground', () => {
        pinPlatform('ios');
        const listener = captureAppStateListener();
        const flush = jest.fn(async () => undefined);
        const { save } = mount({ flush });

        listener.fire('active');

        // Coming back is not an exit; writing here would be pure churn.
        expect(save).not.toHaveBeenCalled();
        expect(flush).not.toHaveBeenCalled();
    });

    it('removes its AppState subscription on unmount', () => {
        pinPlatform('ios');
        const listener = captureAppStateListener();
        const { rendered } = mount({ flush: jest.fn(async () => undefined) });

        rendered.unmount();

        expect(listener.remove).toHaveBeenCalled();
    });

    it('still saves, and does not throw, when the adapter has no flush', () => {
        // The fixture-boot adapter is in-memory and has no `flush` — and must
        // not: writing a test fixture to disk would clobber the real save.
        pinPlatform('ios');
        const listener = captureAppStateListener();
        const { save } = mount({});

        expect(() => listener.fire('background')).not.toThrow();
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('flushes even when the final save throws', () => {
        pinPlatform('ios');
        const listener = captureAppStateListener();
        const flush = jest.fn(async () => undefined);
        const { store } = mount({ flush });
        jest.spyOn(store.getState(), 'save').mockImplementation(() => {
            throw new Error('save exploded');
        });

        expect(() => listener.fire('background')).not.toThrow();
        // A failed final save must not cost us an EARLIER debounced write still
        // sitting in the adapter's timer — that write is what this rescues.
        expect(flush).toHaveBeenCalledTimes(1);
    });
});
