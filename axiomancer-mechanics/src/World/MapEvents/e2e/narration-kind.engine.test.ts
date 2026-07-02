/**
 * MapEvents 'narration' kind (2026-06) — hermetic dispatcher coverage.
 * The narration kind is a SHELL that reuses the dialogue system: it hands
 * the host a `DialogueTree` (authored inline, a monologue of leaf nodes)
 * and touches no state. Modeled on the `interaction` handler.
 */

import { describe, expect, it } from 'vitest';

import { createNewGameState } from '../../../Game/game.reducer';
import { applyPayload, resolveNarration } from '../handlers';
import type { NarrationPayload } from '../types';
import type { DialogueTree } from '../../../NPCs/types';

const TREE: DialogueTree = {
    id: 'test-narration',
    rootId: 'a',
    nodes: {
        a: { id: 'a', text: 'The first line of a quiet monologue.' },
        b: { id: 'b', text: 'And the last.' },
    },
};
const PAYLOAD: NarrationPayload = { kind: 'narration', dialogue: TREE };

describe("MapEvents 'narration' kind", () => {
    it('resolves to a narration event carrying the dialogue tree without touching state', () => {
        const state = createNewGameState();
        const result = resolveNarration(state, PAYLOAD);
        expect(result.state).toBe(state);
        expect(result.event).toEqual({ kind: 'narration', dialogue: TREE });
    });

    it('dispatches through applyPayload', () => {
        const state = createNewGameState();
        const result = applyPayload(state, PAYLOAD, () => 0.5);
        expect(result.event.kind).toBe('narration');
        if (result.event.kind === 'narration') {
            // A monologue: leaf nodes carry no choices.
            const tree = result.event.dialogue;
            expect(tree.nodes[tree.rootId]!.choices).toBeUndefined();
        }
    });
});
