/**
 * nf-12 "The Crowning Witnessed" — hermetic coverage for the last of S-01's
 * four dilemmas (Phase 53d). Mirrors `fv-14-father-worry.engine.test.ts`'s
 * shape: pool wiring, all three flags settable, each choice a terminating
 * leaf. Unlike the other three, branch 3 carries the spec's one permitted
 * `alignmentDelta` — "note the spot, mean to tell someone" names a
 * worldview (`scope`), not a virtue, per S-01's answered Open Question 2.
 * Northern-forest is unreachable in play until inter-map travel exists, so
 * this dilemma has no in-game reader yet — see S-01's answered ruling for
 * why it ships anyway.
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

function nf12Payload(): NarrationPayload {
    const base = { ...createNewGameState(), world: createStartingWorld('fishing-village') };
    const def = getMapDefinition('coastal-continent', 'northern-forest');
    const map: MapState = createMapState(def);
    const state: GameState = { ...base, world: { ...base.world, currentMap: map } };
    const next: GameState = {
        ...state,
        world: { ...state.world, currentMap: { ...state.world.currentMap, currentNode: 'nf-12', consumedNodes: [] } },
    };
    const result = resolveMapEvent(next);
    if (result.event.kind !== 'narration') throw new Error('nf-12 did not resolve to a narration event');
    return { kind: 'narration', dialogue: result.event.dialogue };
}

describe('nf-12 "The Crowning Witnessed"', () => {
    it('is wired as a narration node carrying the crowning-witnessed dialogue tree', () => {
        const payload = nf12Payload();
        expect(payload.kind).toBe('narration');
        expect(payload.dialogue.id).toBe('nf-crowning-witnessed');
        expect(payload.dialogue.rootId).toBe('glimpse');
    });

    it('offers exactly three unflagged choices at the root, none gated', () => {
        const payload = nf12Payload();
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
        ['witnessed', 'boy-witnessed-the-crowning'],
        ['ignored', 'boy-ignored-the-crowning'],
        ['marked', 'boy-marked-the-crowning'],
    ])('setting choice leading to %s sets flag %s, advances to a leaf, and sets no moralDelta', (nextNodeId, flag) => {
        const payload = nf12Payload();
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

    it('the "mark the spot" branch nudges scope alignment — a worldview move, not a virtue', () => {
        const payload = nf12Payload();
        const tree = payload.dialogue;
        const root = tree.nodes[tree.rootId]!;
        const marked = root.choices!.find(c => c.nextNodeId === 'marked')!;

        const state = createNewGameState();
        const before = state.philosophicalAlignment.scope;
        const result = applyDialogueChoice(state, tree, marked);
        expect(result.gameState.philosophicalAlignment.scope).toBe(before + 1);
    });
});
