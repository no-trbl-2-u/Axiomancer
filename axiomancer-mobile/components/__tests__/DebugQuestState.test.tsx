/**
 * Hermetic component tests — DebugQuestState (real authored quests).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - One chip per authored quest; the first is selected by default
 *   - START pushes the selected quest onto state.quests.active
 *   - ADVANCE bumps an objective on an active quest
 *   - COMPLETE moves the quest from active → completed
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugQuestState } from '@/components/DebugQuestState';
import { listQuests } from '@/state/dev/story-catalog';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
});

const makeStore = (): AppStore => createAppStore({ adapter: createMemoryAdapter() });
const withProvider = (store: AppStore, child: React.ReactNode) => <GameStoreProvider store={store}>{child}</GameStoreProvider>;
const FIRST = listQuests()[0];

describe('DebugQuestState: DEV gate', () => {
    it('renders a chip per authored quest plus the three action buttons', () => {
        const tree = render(withProvider(makeStore(), <DebugQuestState />));
        for (const q of listQuests()) expect(tree.queryByTestId(`debug-quest-${q.key}`)).not.toBeNull();
        expect(tree.queryByTestId('debug-quest-start')).not.toBeNull();
        expect(tree.queryByTestId('debug-quest-advance')).not.toBeNull();
        expect(tree.queryByTestId('debug-quest-complete')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        const g = global as unknown as { __DEV__: boolean };
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const tree = render(withProvider(makeStore(), <DebugQuestState />));
            expect(tree.queryByTestId('debug-quest-start')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugQuestState: start → advance → complete', () => {
    it('START pushes the selected quest onto state.quests.active', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugQuestState />));
        fireEvent.press(tree.getByTestId('debug-quest-start'));
        expect(store.getState().quests.active.map((q) => q.name)).toContain(FIRST.key);
    });

    it('selecting another chip changes which quest START pushes', () => {
        const store = makeStore();
        const second = listQuests()[1];
        const tree = render(withProvider(store, <DebugQuestState />));
        fireEvent.press(tree.getByTestId(`debug-quest-${second.key}`));
        fireEvent.press(tree.getByTestId('debug-quest-start'));
        expect(store.getState().quests.active.map((q) => q.name)).toEqual([second.key]);
    });

    it('ADVANCE bumps an objective on the active quest', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugQuestState />));
        fireEvent.press(tree.getByTestId('debug-quest-start'));
        fireEvent.press(tree.getByTestId('debug-quest-advance'));
        // A one-objective quest auto-completes on its first advance; a
        // longer one stays active with a bumped counter. Either is progress.
        const log = store.getState().quests;
        const active = log.active.find((q) => q.name === FIRST.key);
        const progressed = active ? active.objectives.some((o) => o.currentCount >= 1) : log.completed.includes(FIRST.key);
        expect(progressed).toBe(true);
    });

    it('COMPLETE moves the quest from active → completed', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugQuestState />));
        fireEvent.press(tree.getByTestId('debug-quest-start'));
        fireEvent.press(tree.getByTestId('debug-quest-complete'));
        expect(store.getState().quests.completed).toContain(FIRST.key);
        expect(store.getState().quests.active.map((q) => q.name)).not.toContain(FIRST.key);
    });
});
