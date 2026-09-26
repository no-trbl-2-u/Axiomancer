/**
 * fv-4 "The Stranger's Net" — hermetic coverage for the second of S-01's
 * remaining three dilemmas (Phase 53d). Mirrors
 * `fv-14-father-worry.engine.test.ts`'s shape: pool wiring, all three
 * flags settable, each choice a terminating leaf, no `moralDelta`. Also
 * proves the binding placement constraint from S-01's answered Open
 * Question 1 — a dilemma read by a later node must sit strictly ahead of
 * it on the gauntlet's column axis.
 */

import { describe, expect, it } from 'vitest';

import { createNewGameState } from '../../../Game/game.reducer';
import { resolveMapEvent } from '../resolve-map-event';
import { createStartingWorld } from '../../index';
import { getMapDefinition, createMapState } from '../../map.registry';
import { applyDialogueChoice } from '../../dialogue.runtime';
import { visibleChoices } from '../../../NPCs/dialogue';
import type { DialogueContext } from '../../../NPCs/dialogue';
import type { NarrationPayload } from '../types';
import type { DialogueNode } from '../../../NPCs/types';
import type { GameState } from '../../../Game/types';
import type { MapState } from '../../types';
// Import for side effect — registers the pools when the test loads.
import '../content';

function fv4Payload(): NarrationPayload {
    const base = { ...createNewGameState(), world: createStartingWorld('fishing-village') };
    const def = getMapDefinition('coastal-continent', 'fishing-village');
    const map: MapState = createMapState(def);
    const state: GameState = { ...base, world: { ...base.world, currentMap: map } };
    const next: GameState = {
        ...state,
        world: { ...state.world, currentMap: { ...state.world.currentMap, currentNode: 'fv-4', consumedNodes: [] } },
    };
    const result = resolveMapEvent(next);
    if (result.event.kind !== 'narration') throw new Error('fv-4 did not resolve to a narration event');
    return { kind: 'narration', dialogue: result.event.dialogue };
}

describe('fv-4 "The Stranger\'s Net"', () => {
    it('is wired as a narration node carrying the strangers-net dialogue tree', () => {
        const payload = fv4Payload();
        expect(payload.kind).toBe('narration');
        expect(payload.dialogue.id).toBe('fv-strangers-net');
        expect(payload.dialogue.rootId).toBe('find');
    });

    it('offers exactly three unflagged choices at the root, none gated', () => {
        const payload = fv4Payload();
        const tree = payload.dialogue;
        const root = tree.nodes[tree.rootId]!;
        expect(root.choices).toHaveLength(3);

        const emptyCtx: DialogueContext = {
            activeQuests: new Set(),
            completedQuests: new Set(),
            flags: new Set(),
        };
        expect(visibleChoices(root, emptyCtx)).toHaveLength(3);
    });

    it.each([
        ['returned', 'boy-returned-the-net'],
        ['skimmed', 'boy-skimmed-the-net'],
        ['took', 'boy-took-the-net'],
    ])('setting choice leading to %s sets flag %s, advances to a leaf, and sets no moralDelta', (nextNodeId, flag) => {
        const payload = fv4Payload();
        const tree = payload.dialogue;
        const root = tree.nodes[tree.rootId]!;
        const choice = root.choices!.find(c => c.nextNodeId === nextNodeId)!;
        expect(choice).toBeDefined();
        expect(choice.effect?.moralDelta).toBeUndefined();

        const state = createNewGameState();
        expect(state.flags).not.toContain(flag);
        const before = state.moralMeter;

        const result = applyDialogueChoice(state, tree, choice);
        expect(result.gameState.flags).toContain(flag);
        expect(result.gameState.moralMeter).toBe(before);

        const nextNode: DialogueNode = tree.nodes[choice.nextNodeId!]!;
        expect(nextNode.choices).toBeUndefined(); // each outcome is a leaf
        expect(nextNode.text.length).toBeGreaterThan(0);
    });

    it('sits in a strictly earlier column than every post-boss reader (S-01\'s binding placement rule)', () => {
        const def = getMapDefinition('coastal-continent', 'fishing-village');
        const netColumn = def.nodes.find(n => n.id === 'fv-4')!.location[0];
        for (const readerId of ['fv-18', 'fv-7', 'fv-19']) {
            const readerColumn = def.nodes.find(n => n.id === readerId)!.location[0];
            expect(netColumn, `fv-4 must precede ${readerId}`).toBeLessThan(readerColumn);
        }
    });
});
