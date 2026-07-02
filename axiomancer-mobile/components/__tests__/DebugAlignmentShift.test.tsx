/**
 * Hermetic component tests — DebugAlignmentShift (Phase 61d).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - All six per-axis buttons mount (three axes × ± each)
 *   - Per-axis ± dispatches engine's shiftPhilosophicalAlignment;
 *     state.philosophicalAlignment reflects the delta
 *   - Negative shift independently moves the axis down
 *   - Other axes are unchanged by a single-axis press
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugAlignmentShift } from '@/components/DebugAlignmentShift';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

describe('DebugAlignmentShift: DEV gate', () => {
    it('renders all six buttons when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugAlignmentShift />));
        expect(tree.queryByTestId('debug-align-epistemology-minus')).not.toBeNull();
        expect(tree.queryByTestId('debug-align-epistemology-plus')).not.toBeNull();
        expect(tree.queryByTestId('debug-align-outlook-minus')).not.toBeNull();
        expect(tree.queryByTestId('debug-align-outlook-plus')).not.toBeNull();
        expect(tree.queryByTestId('debug-align-scope-minus')).not.toBeNull();
        expect(tree.queryByTestId('debug-align-scope-plus')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
         
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugAlignmentShift />));
            expect(tree.queryByTestId('debug-align-epistemology-plus')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugAlignmentShift: shift routing', () => {
    it('epistemology + button increments epistemology by 10', () => {
        const store = makeStore();
         
        const before = (store.getState() as any).philosophicalAlignment.epistemology;

        const tree = render(withProvider(store, <DebugAlignmentShift />));
        fireEvent.press(tree.getByTestId('debug-align-epistemology-plus'));

         
        expect((store.getState() as any).philosophicalAlignment.epistemology).toBe(before + 10);
    });

    it('outlook − button decrements outlook by 10', () => {
        const store = makeStore();
         
        const before = (store.getState() as any).philosophicalAlignment.outlook;

        const tree = render(withProvider(store, <DebugAlignmentShift />));
        fireEvent.press(tree.getByTestId('debug-align-outlook-minus'));

         
        expect((store.getState() as any).philosophicalAlignment.outlook).toBe(before - 10);
    });

    it('scope shifts do not affect epistemology or outlook', () => {
        const store = makeStore();
         
        const before = (store.getState() as any).philosophicalAlignment;

        const tree = render(withProvider(store, <DebugAlignmentShift />));
        fireEvent.press(tree.getByTestId('debug-align-scope-plus'));

         
        const after = (store.getState() as any).philosophicalAlignment;
        expect(after.epistemology).toBe(before.epistemology);
        expect(after.outlook).toBe(before.outlook);
        expect(after.scope).toBe(before.scope + 10);
    });

    it('stacked presses are additive (3× +10 = +30 net)', () => {
        const store = makeStore();
         
        const before = (store.getState() as any).philosophicalAlignment.epistemology;

        const tree = render(withProvider(store, <DebugAlignmentShift />));
        const plus = tree.getByTestId('debug-align-epistemology-plus');
        fireEvent.press(plus);
        fireEvent.press(plus);
        fireEvent.press(plus);

         
        expect((store.getState() as any).philosophicalAlignment.epistemology).toBe(before + 30);
    });
});

describe('DebugAlignmentShift: accessibility', () => {
    it('exposes accessibilityRole=button and descriptive labels for each axis', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugAlignmentShift />));

        const epistPlus = tree.getByTestId('debug-align-epistemology-plus');
        expect(epistPlus.props.accessibilityRole).toBe('button');
        expect(epistPlus.props.accessibilityLabel).toMatch(/epistemology/i);

        const outlookMinus = tree.getByTestId('debug-align-outlook-minus');
        expect(outlookMinus.props.accessibilityLabel).toMatch(/outlook/i);
    });
});
