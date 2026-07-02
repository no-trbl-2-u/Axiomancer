/**
 * Hermetic component tests — QuestGate.
 *
 * QuestGate is a side-effect-only component (returns null) that
 * pushes the user into the full-screen `/quest` route whenever
 * `selectHasActiveQuestBoard` flips true. Coverage gap filed by `/iterate`
 * 2026-06-14.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import React from 'react';
import type { QuestBoardSession } from 'axiomancer-mechanics';

import { QuestGate } from '@/components/QuestGate';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import {
    EMPTY_QUEST_SLICE,
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
    // Return a stable reference so the QuestGate useEffect's
    // [hasQuest, router] dep array doesn't fire on every
    // re-render (matches expo-router's production behavior).
    useRouter: () => mockRouter,
}));

afterEach(() => {
    mockPush.mockClear();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function setQuestSession(store: AppStore, session: QuestBoardSession | null) {
    store.setState({
        quest: {
            ...EMPTY_QUEST_SLICE,
            session,
        },
    });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

function makeQuestSession(): QuestBoardSession {
    // Mock minimal quest session structure
    return {
        boardId: 'test-quest',
        phase: 'idle',
        day: 1,
        stretch: 0,
        pos: 0,
        fish: 10,
        vigor: 8,
        wind: 3,
        parts: {},
        fitted: {},
        charms: [],
        pending: null,
        collapsedToday: false,
        outcome: null,
        lastRoll: null,
    } as never;
}

describe('QuestGate: quest board sessions route to /quest', () => {
    it('does not push when there is no quest session (fresh store)', () => {
        const store = makeStore();
        render(withProvider(store, <QuestGate />));
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('pushes /quest when a quest session is active at mount', () => {
        const store = makeStore();
        setQuestSession(store, makeQuestSession());
        render(withProvider(store, <QuestGate />));
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/quest');
    });

    it('pushes /quest when the state flips from no-session to active quest', () => {
        const store = makeStore();
        render(withProvider(store, <QuestGate />));
        expect(mockPush).not.toHaveBeenCalled();

        act(() => {
            setQuestSession(store, makeQuestSession());
        });
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/quest');
    });

    it('does not re-push when the quest session stays active across re-renders', () => {
        const store = makeStore();
        setQuestSession(store, makeQuestSession());
        const tree = render(withProvider(store, <QuestGate />));
        expect(mockPush).toHaveBeenCalledTimes(1);

        // Force a re-render of the gate without changing the selector value.
        act(() => {
            tree.rerender(withProvider(store, <QuestGate />));
        });
        // The useEffect dep is the boolean from the selector, which is
        // stable across this re-render — no additional push.
        expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('renders nothing (side-effect-only)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <QuestGate />));
        expect(tree.toJSON()).toBeNull();
    });
});