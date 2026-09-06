/**
 * Hermetic component tests — DebugDialogueJump (real NPC trees).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - One chip per staged NPC with a tree
 *   - Pressing a chip seeds state.event.pending with an interaction for
 *     that NPC, a dialogueCursor at the tree root, and flips
 *     selectHasActiveEvent
 *   - Two different chips land two different trees
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugDialogueJump } from '@/components/DebugDialogueJump';
import { listNpcs, slug } from '@/state/dev/story-catalog';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { selectHasActiveEvent } from '@/state/presenters/event.engine';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
});

const makeStore = (): AppStore => createAppStore({ adapter: createMemoryAdapter() });
const withProvider = (store: AppStore, child: React.ReactNode) => <GameStoreProvider store={store}>{child}</GameStoreProvider>;
const NPCS = listNpcs();
const chipId = (npc: (typeof NPCS)[number]) => `debug-dialogue-${npc.map}-${slug(npc.name)}`;

describe('DebugDialogueJump: DEV gate', () => {
    it('renders a chip per staged NPC when __DEV__ is true (jest default)', () => {
        const tree = render(withProvider(makeStore(), <DebugDialogueJump />));
        expect(NPCS.length).toBeGreaterThan(1);
        for (const npc of NPCS) expect(tree.queryByTestId(chipId(npc))).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        const g = global as unknown as { __DEV__: boolean };
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const tree = render(withProvider(makeStore(), <DebugDialogueJump />));
            expect(tree.queryByTestId(chipId(NPCS[0]))).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugDialogueJump: jump routing', () => {
    it('seeds the event slice with an interaction + dialogue cursor at the root', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugDialogueJump />));
        fireEvent.press(tree.getByTestId(chipId(NPCS[0])));
        const slice = store.getState().event;
        expect((slice.pending!.event as { kind: string; npcName: string }).kind).toBe('interaction');
        expect((slice.pending!.event as { npcName: string }).npcName).toBe(NPCS[0].name);
        expect(slice.dialogueCursor?.nodeId).toBe(NPCS[0].tree.rootId);
        expect(selectHasActiveEvent(store.getState())).toBe(true);
    });

    it('different chips land different NPC trees', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugDialogueJump />));
        fireEvent.press(tree.getByTestId(chipId(NPCS[0])));
        const first = store.getState().event.dialogueCursor?.tree;
        fireEvent.press(tree.getByTestId(chipId(NPCS[1])));
        const second = store.getState().event.dialogueCursor?.tree;
        expect(first).not.toBe(second);
        expect((store.getState().event.pending!.event as { npcName: string }).npcName).toBe(NPCS[1].name);
    });
});
