/**
 * nf-19 "The Frightened Friend" — hermetic coverage for the third of S-01's
 * four dilemmas (Phase 53d). Mirrors `fv-14-father-worry.engine.test.ts`'s
 * shape: pool wiring, all three flags settable, each choice a terminating
 * leaf, no `moralDelta`. Northern-forest is unreachable in play until
 * inter-map travel exists, so this dilemma has no in-game reader yet — see
 * S-01's answered ruling for why it ships anyway.
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

function nf19Payload(): NarrationPayload {
    const base = { ...createNewGameState(), world: createStartingWorld('fishing-village') };
    const def = getMapDefinition('coastal-continent', 'northern-forest');
    const map: MapState = createMapState(def);
    const state: GameState = { ...base, world: { ...base.world, currentMap: map } };
    const next: GameState = {
        ...state,
        world: { ...state.world, currentMap: { ...state.world.currentMap, currentNode: 'nf-19', consumedNodes: [] } },
    };
    const result = resolveMapEvent(next);
    if (result.event.kind !== 'narration') throw new Error('nf-19 did not resolve to a narration event');
    return { kind: 'narration', dialogue: result.event.dialogue };
}

describe('nf-19 "The Frightened Friend"', () => {
    it('is wired as a narration node carrying the frightened-friend dialogue tree', () => {
        const payload = nf19Payload();
        expect(payload.kind).toBe('narration');
        expect(payload.dialogue.id).toBe('nf-frightened-friend');
        expect(payload.dialogue.rootId).toBe('find');
    });

    it('offers exactly three unflagged choices at the root, none gated', () => {
        const payload = nf19Payload();
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
        ['helped', 'boy-helped-pell'],
        ['coached', 'boy-coached-pell'],
        ['left', 'boy-left-pell'],
    ])('setting choice leading to %s sets flag %s, advances to a leaf, and sets no moralDelta', (nextNodeId, flag) => {
        const payload = nf19Payload();
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
});
