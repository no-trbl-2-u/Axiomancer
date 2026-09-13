/**
 * S4-world-C11 — the nameplate must name the speaker the prose names.
 *
 * A first-time player read a dialogue card whose header said A FIGURE while
 * the line directly beneath it called the character by name. The engine's
 * `DialogueNode` has carried no `.speaker` since Phase 60c, and the presenter
 * hard-fell back to 'A FIGURE' for EVERY dialogue node — but the `interaction`
 * event that opened the tree carries `npcName`, the very name
 * `composeInteraction` already puts on the no-tree card.
 *
 * The fallback survives for a `narration` monologue, which has no speaker by
 * design; that is the only case it is honest for.
 *
 * Hermetic = self-contained + deterministic + isolated. See docs/testing.md.
 */

import { describe, expect, it } from '@jest/globals';
import type { DialogueTree, ResolveMapEventResult } from '@mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createAppStore, EMPTY_EVENT_SLICE, type AppStore } from '@/state/store';
import { selectEventViewModel } from '@/state/presenters/event.engine';

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

/** A one-node monologue tree — enough to seat the dialogue cursor. */
function makeTree(text: string): DialogueTree {
    return {
        rootId: 'root',
        nodes: {
            root: { id: 'root', text, choices: [{ text: 'Say nothing' }] },
        },
    } as unknown as DialogueTree;
}

function interaction(npcName: string): ResolveMapEventResult {
    return {
        state: undefined as never,
        event: { kind: 'interaction', npcName },
    };
}

function narration(): ResolveMapEventResult {
    return {
        state: undefined as never,
        event: { kind: 'narration', dialogue: makeTree('The tide goes out.') },
    };
}

function seatCursor(store: AppStore, pending: ResolveMapEventResult, tree: DialogueTree) {
    store.setState({
        event: {
            ...EMPTY_EVENT_SLICE,
            pending,
            dialogueCursor: { tree, nodeId: 'root' },
        },
    });
}

describe('S4-world-C11: the dialogue nameplate names the speaker', () => {
    it('uses the interaction event`s npcName, uppercased', () => {
        const store = makeStore();
        const tree = makeTree('Old Marrow spits into the water. "Mind the tide."');
        seatCursor(store, interaction('Old Marrow'), tree);

        const vm = selectEventViewModel(store.getState());
        expect(vm.title).toBe('OLD MARROW');
        expect(vm.title).not.toBe('A FIGURE');
    });

    it('names a second speaker without carrying the first one`s plate', () => {
        const store = makeStore();
        seatCursor(store, interaction('Captain Blackwater'), makeTree('A slow nod.'));

        const vm = selectEventViewModel(store.getState());
        expect(vm.title).toBe('CAPTAIN BLACKWATER');
    });

    it('keeps the A FIGURE chrome for a speakerless narration', () => {
        const store = makeStore();
        seatCursor(store, narration(), makeTree('Something moves under the pier.'));

        const vm = selectEventViewModel(store.getState());
        expect(vm.title).toBe('A FIGURE');
    });

    it('keeps the A FIGURE chrome when the event names an empty speaker', () => {
        const store = makeStore();
        seatCursor(store, interaction('   '), makeTree('A voice, from nowhere in particular.'));

        const vm = selectEventViewModel(store.getState());
        expect(vm.title).toBe('A FIGURE');
    });
});
