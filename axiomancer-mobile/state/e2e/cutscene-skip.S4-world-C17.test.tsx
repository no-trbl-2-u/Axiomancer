/**
 * S4-world-C17 — the cutscene's SKIP must read as a control, not a caption.
 *
 * A first-time player took the 10px bone SKIP for chrome and, when they did
 * try it, missed it: `padding: 8` around a four-glyph mono label is well under
 * a thumb. It is now a bordered plate with a 44pt minimum box.
 *
 * The suite pins the two things the finding is actually about — that the
 * control is announced and reachable as a button, and that its box clears the
 * 44pt touch minimum — plus the behaviour it exists for (one press reveals the
 * whole omen and the SKIP retires).
 *
 * Hermetic = self-contained + deterministic + isolated. See docs/testing.md.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import type { ResolveMapEventResult } from '@mechanics';

jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false }),
}));

import CutsceneScreen from '@/app/cutscene';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, EMPTY_EVENT_SLICE, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

/** The platform's minimum comfortable touch target, in points. */
const MIN_TOUCH_TARGET = 44;

const LINES = [
    'The tide goes out and does not come back.',
    'Something on the shingle is still breathing.',
    'It knows your name already.',
] as const;

function cutscene(): ResolveMapEventResult {
    return { state: undefined as never, event: { kind: 'cutscene', lines: LINES } };
}

function makeStore(): AppStore {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    store.setState({ event: { ...EMPTY_EVENT_SLICE, pending: cutscene() } });
    return store;
}

function mount(store: AppStore) {
    return render(
        <GameStoreProvider store={store}>
            <CutsceneScreen />
        </GameStoreProvider>,
    );
}

describe('S4-world-C17: SKIP is a button, and a hittable one', () => {
    it('announces itself as a button with a spoken label', () => {
        const tree = mount(makeStore());
        const skip = tree.getByTestId('cutscene-skip');

        expect(skip.props.accessibilityRole).toBe('button');
        expect(skip.props.accessibilityLabel).toBe('Skip to the end');
    });

    it('reserves a box at least 44pt on its short edge', () => {
        const tree = mount(makeStore());
        const style = StyleSheet.flatten(tree.getByTestId('cutscene-skip').props.style) as {
            minHeight?: number;
            minWidth?: number;
        };

        expect(style.minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(style.minWidth).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    });

    it('wears chrome that says pressable — a border and a filled plate', () => {
        const tree = mount(makeStore());
        const style = StyleSheet.flatten(tree.getByTestId('cutscene-skip').props.style) as {
            borderWidth?: number;
            backgroundColor?: string;
        };

        expect(style.borderWidth).toBeGreaterThan(0);
        expect(style.backgroundColor).toBeTruthy();
    });

    it('still does its job: one press reveals every line and retires the control', () => {
        const store = makeStore();
        const tree = mount(store);

        expect(tree.queryByTestId(`cutscene-line-${LINES.length - 1}`)).toBeNull();

        act(() => {
            fireEvent.press(tree.getByTestId('cutscene-skip'));
        });

        for (let i = 0; i < LINES.length; i += 1) {
            expect(tree.getByTestId(`cutscene-line-${i}`)).toBeTruthy();
        }
        expect(tree.queryByTestId('cutscene-skip')).toBeNull();
    });
});
