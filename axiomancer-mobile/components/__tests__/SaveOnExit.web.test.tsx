/**
 * @jest-environment jsdom
 */

/**
 * SaveOnExit — the WEB lifecycle branch (PLAYTEST_BUGS_2026-09-18 BUG-03).
 *
 * The sibling `SaveOnExit.test.tsx` covers the native `AppState` branch, which
 * is what the default react-native jest preset reports. That preset provides no
 * real `window`/`document`, so the DOM branch is unreachable there — hence this
 * file, which opts into the jsdom environment via the docblock pragma above.
 *
 * The web branch is not incidental: the exported web build is what every
 * Playwright harness in this repo drives (`critique:drive`, the e2e journeys),
 * and it is where this bug was originally found and reproduced.
 *
 * Pinned here:
 *   1. `pagehide` takes a final save AND flushes it. `pagehide`, not
 *      `beforeunload` — iOS Safari does not fire `beforeunload` for a
 *      backgrounded or discarded tab.
 *   2. `visibilitychange` to `hidden` does the same; a tab switch may never
 *      unload at all.
 *   3. `visibilitychange` to `visible` saves nothing — returning is not exiting.
 *   4. Both listeners are removed on unmount.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { describe, it, expect, jest, afterEach, beforeEach } from '@jest/globals';
import { Platform } from 'react-native';

import { SaveOnExit } from '@/components/SaveOnExit';
import { withAllProviders } from '@/test-utils/withAllProviders';

function mount(adapter: { flush?: () => Promise<void> }) {
    const { store, tree } = withAllProviders(
        <SaveOnExit adapter={{ load: () => null, save: () => undefined, ...adapter } as never} />,
    );
    const save = jest.spyOn(store.getState(), 'save').mockImplementation(() => undefined);
    const rendered = render(tree);
    return { store, save, rendered };
}

beforeEach(() => {
    // The component branches on Platform.OS; jsdom does not change that.
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
});

afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
});

const firePageHide = () => window.dispatchEvent(new Event('pagehide'));
const fireVisibility = (state: 'hidden' | 'visible') => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
    document.dispatchEvent(new Event('visibilitychange'));
};

describe('SaveOnExit — web lifecycle branch', () => {
    it('saves and flushes on pagehide', () => {
        const flush = jest.fn(async () => undefined);
        const { save } = mount({ flush });

        firePageHide();

        // THE REGRESSION: before the fix there was no exit handler anywhere in
        // the app, so neither of these ever happened and a checkpoint taken
        // inside the adapter's 500ms debounce window was simply lost.
        expect(save).toHaveBeenCalledTimes(1);
        expect(flush).toHaveBeenCalledTimes(1);
    });

    it('saves and flushes when the page becomes hidden', () => {
        const flush = jest.fn(async () => undefined);
        const { save } = mount({ flush });

        fireVisibility('hidden');

        expect(save).toHaveBeenCalledTimes(1);
        expect(flush).toHaveBeenCalledTimes(1);
    });

    it('does NOT save when the page becomes visible', () => {
        const flush = jest.fn(async () => undefined);
        const { save } = mount({ flush });

        fireVisibility('visible');

        expect(save).not.toHaveBeenCalled();
        expect(flush).not.toHaveBeenCalled();
    });

    it('removes its DOM listeners on unmount', () => {
        const flush = jest.fn(async () => undefined);
        const { save, rendered } = mount({ flush });

        // Prove the listeners were live BEFORE unmount, so the post-unmount
        // assertion cannot pass vacuously (the trap this file was split to avoid).
        firePageHide();
        expect(save).toHaveBeenCalledTimes(1);

        rendered.unmount();
        firePageHide();
        fireVisibility('hidden');

        expect(save).toHaveBeenCalledTimes(1);
        expect(flush).toHaveBeenCalledTimes(1);
    });
});
