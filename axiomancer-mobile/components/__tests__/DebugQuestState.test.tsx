/**
 * Hermetic component tests — DebugQuestState (Phase 62b).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - START pushes the quest into state.quests.active
 *   - ADVANCE bumps the first objective's currentCount
 *     (only meaningful after the quest is active)
 *   - COMPLETE moves the quest from active → completed
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugQuestState } from '@/components/DebugQuestState';
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

describe('DebugQuestState: DEV gate', () => {
    it('renders all six action buttons (2 quests × 3 actions) when __DEV__ is true', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugQuestState />));
        expect(tree.queryByTestId('debug-quest-starting-quest-start')).not.toBeNull();
        expect(tree.queryByTestId('debug-quest-starting-quest-advance')).not.toBeNull();
        expect(tree.queryByTestId('debug-quest-starting-quest-complete')).not.toBeNull();
        expect(tree.queryByTestId('debug-quest-gather-wood-start')).not.toBeNull();
        expect(tree.queryByTestId('debug-quest-gather-wood-advance')).not.toBeNull();
        expect(tree.queryByTestId('debug-quest-gather-wood-complete')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
         
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugQuestState />));
            expect(tree.queryByTestId('debug-quest-starting-quest-start')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugQuestState: START', () => {
    it('pushes the quest onto state.quests.active', () => {
        const store = makeStore();
        expect(store.getState().quests.active).toHaveLength(0);

        const tree = render(withProvider(store, <DebugQuestState />));
        fireEvent.press(tree.getByTestId('debug-quest-starting-quest-start'));

        const active = store.getState().quests.active;
        expect(active).toHaveLength(1);
        expect(active[0].name).toBe('starting-quest');
    });

    it('STARTING vs GATHER push different quests', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugQuestState />));
        fireEvent.press(tree.getByTestId('debug-quest-starting-quest-start'));
        fireEvent.press(tree.getByTestId('debug-quest-gather-wood-start'));

        const names = store.getState().quests.active.map((q) => q.name);
        expect(names).toContain('starting-quest');
        expect(names).toContain('gather-wood');
    });
});

describe('DebugQuestState: ADVANCE', () => {
    it('bumps the first objective.currentCount on an active quest', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugQuestState />));

        // START first, then ADVANCE.
        fireEvent.press(tree.getByTestId('debug-quest-gather-wood-start'));
        const before = store.getState().quests.active[0].objectives[0].currentCount;
        fireEvent.press(tree.getByTestId('debug-quest-gather-wood-advance'));
        const after = store.getState().quests.active[0].objectives[0].currentCount;

        expect(after).toBe(before + 1);
    });
});

describe('DebugQuestState: COMPLETE', () => {
    it('moves the quest from active → completed', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugQuestState />));

        fireEvent.press(tree.getByTestId('debug-quest-starting-quest-start'));
        expect(store.getState().quests.active.map((q) => q.name)).toContain('starting-quest');

        fireEvent.press(tree.getByTestId('debug-quest-starting-quest-complete'));

        const active = store.getState().quests.active.map((q) => q.name);
        const completed = store.getState().quests.completed;
        expect(active).not.toContain('starting-quest');
        expect(completed).toContain('starting-quest');
    });
});

describe('DebugQuestState: accessibility', () => {
    it('exposes accessibilityRole=button and descriptive labels', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugQuestState />));

        const start = tree.getByTestId('debug-quest-starting-quest-start');
        expect(start.props.accessibilityRole).toBe('button');
        expect(start.props.accessibilityLabel).toMatch(/start/i);

        const advance = tree.getByTestId('debug-quest-gather-wood-advance');
        expect(advance.props.accessibilityLabel).toMatch(/advance/i);
    });
});
