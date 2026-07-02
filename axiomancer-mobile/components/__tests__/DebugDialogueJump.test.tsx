/**
 * Hermetic component tests — DebugDialogueJump (Phase 62a).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - Both tree buttons mount (OMEN, FRIEND)
 *   - Pressing a tree seeds state.event.pending with the
 *     interaction event, sets dialogueCursor to the tree's
 *     root, and surfaces the event modal via selectHasActiveEvent
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugDialogueJump } from '@/components/DebugDialogueJump';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { selectHasActiveEvent } from '@/state/presenters/event.engine';
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

describe('DebugDialogueJump: DEV gate', () => {
    it('renders both tree buttons when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugDialogueJump />));
        expect(tree.queryByTestId('debug-dialogue-omen')).not.toBeNull();
        expect(tree.queryByTestId('debug-dialogue-friend')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
         
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugDialogueJump />));
            expect(tree.queryByTestId('debug-dialogue-omen')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugDialogueJump: jump routing', () => {
    it('seeds the event slice with an interaction + dialogue cursor', () => {
        const store = makeStore();
        expect(store.getState().event.pending).toBeNull();
        expect(store.getState().event.dialogueCursor).toBeNull();

        const tree = render(withProvider(store, <DebugDialogueJump />));
        fireEvent.press(tree.getByTestId('debug-dialogue-omen'));

        const slice = store.getState().event;
        expect(slice.pending).not.toBeNull();
        expect(slice.pending!.event.kind).toBe('interaction');
        expect(slice.dialogueCursor).not.toBeNull();
        expect(slice.dialogueCursor!.nodeId).toBe(slice.dialogueCursor!.tree.rootId);
    });

    it('selectHasActiveEvent flips true after a jump', () => {
        const store = makeStore();
        expect(selectHasActiveEvent(store.getState())).toBe(false);

        const tree = render(withProvider(store, <DebugDialogueJump />));
        fireEvent.press(tree.getByTestId('debug-dialogue-friend'));

        expect(selectHasActiveEvent(store.getState())).toBe(true);
    });

    it('FRIEND vs OMEN jumps land different trees', () => {
        const storeA = makeStore();
        const treeA = render(withProvider(storeA, <DebugDialogueJump />));
        fireEvent.press(treeA.getByTestId('debug-dialogue-omen'));
        const cursorA = storeA.getState().event.dialogueCursor!;

        const storeB = makeStore();
        const treeB = render(withProvider(storeB, <DebugDialogueJump />));
        fireEvent.press(treeB.getByTestId('debug-dialogue-friend'));
        const cursorB = storeB.getState().event.dialogueCursor!;

        // Different trees → different root-node texts.
        expect(cursorA.tree.nodes[cursorA.nodeId].text).not.toBe(
            cursorB.tree.nodes[cursorB.nodeId].text,
        );
    });
});

describe('DebugDialogueJump: accessibility', () => {
    it('exposes accessibilityRole=button and descriptive labels', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugDialogueJump />));

        const omen = tree.getByTestId('debug-dialogue-omen');
        expect(omen.props.accessibilityRole).toBe('button');
        expect(omen.props.accessibilityLabel).toMatch(/omen/i);

        const friend = tree.getByTestId('debug-dialogue-friend');
        expect(friend.props.accessibilityLabel).toMatch(/friend/i);
    });
});
