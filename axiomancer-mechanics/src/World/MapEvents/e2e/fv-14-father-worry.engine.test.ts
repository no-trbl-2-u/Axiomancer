/**
 * fv-14 "What Do I Tell Father?" — hermetic coverage for the boy's first
 * ethical dilemma (2026-07). The narration node hands the host a real
 * branching `DialogueTree` (not a leaf monologue): three choices at dinner,
 * each setting a distinct flag with no choice signposted as "correct" by
 * the engine. This test exercises the full round-trip — pool wiring,
 * `applyDialogueChoice` setting each flag, and `visibleChoices` gating a
 * later choice on one of those flags (proving the flag plumbing a future
 * Northern Forest node would rely on already works end to end).
 */

import { describe, expect, it } from 'vitest';

import { createNewGameState } from '../../../Game/game.reducer';
import { applyPayload, resolveNarration } from '../handlers';
import { resolveMapEvent } from '../resolve-map-event';
import { createStartingWorld } from '../../index';
import { getMapDefinition, createMapState } from '../../map.registry';
import { applyDialogueChoice } from '../../dialogue.runtime';
import { visibleChoices } from '../../../NPCs/dialogue';
import type { DialogueContext } from '../../../NPCs/dialogue';
import type { NarrationPayload } from '../types';
import type { DialogueChoice, DialogueNode } from '../../../NPCs/types';
import type { GameState } from '../../../Game/types';
import type { MapState } from '../../types';
// Import for side effect — registers the pools when the test loads.
import '../content';

/** Resolves fv-14 on a fresh fishing-village world and returns its narration payload. */
function fv14Payload(): NarrationPayload {
    const base = { ...createNewGameState(), world: createStartingWorld('fishing-village') };
    const def = getMapDefinition('coastal-continent', 'fishing-village');
    const map: MapState = createMapState(def);
    const state: GameState = { ...base, world: { ...base.world, currentMap: map } };
    const next: GameState = {
        ...state,
        world: { ...state.world, currentMap: { ...state.world.currentMap, currentNode: 'fv-14', consumedNodes: [] } },
    };
    const result = resolveMapEvent(next);
    if (result.event.kind !== 'narration') throw new Error('fv-14 did not resolve to a narration event');
    return { kind: 'narration', dialogue: result.event.dialogue };
}

describe('fv-14 "What Do I Tell Father?"', () => {
    it('is wired as a narration node carrying the father-worry dialogue tree', () => {
        const payload = fv14Payload();
        expect(payload.kind).toBe('narration');
        expect(payload.dialogue.id).toBe('fv-father-worry');
        expect(payload.dialogue.rootId).toBe('overhear');
    });

    it('resolves through the narration handler without touching state', () => {
        const payload = fv14Payload();
        const state = createNewGameState();
        const result = resolveNarration(state, payload);
        expect(result.state).toBe(state);
        expect(result.event).toEqual({ kind: 'narration', dialogue: payload.dialogue });

        const dispatched = applyPayload(state, payload, () => 0.5);
        expect(dispatched.event.kind).toBe('narration');
    });

    it('offers exactly three unflagged choices at the root, none gated', () => {
        const payload = fv14Payload();
        const tree = payload.dialogue;
        const root = tree.nodes[tree.rootId]!;
        expect(root.choices).toHaveLength(3);

        const emptyCtx: DialogueContext = {
            activeQuests: new Set(),
            completedQuests: new Set(),
            flags: new Set(),
        };
        // No `requires` on any of the three root choices — all are visible
        // regardless of context; the dilemma isn't pre-gated by state.
        expect(visibleChoices(root, emptyCtx)).toHaveLength(3);
    });

    it.each([
        ['told-truth', 'boy-told-father-truth'],
        ['spared-worry', 'boy-spared-father-worry'],
        ['deflected', 'boy-deflected-father'],
    ])('setting choice leading to %s sets flag %s and advances the tree', (nextNodeId, flag) => {
        const payload = fv14Payload();
        const tree = payload.dialogue;
        const root = tree.nodes[tree.rootId]!;
        const choice = root.choices!.find(c => c.nextNodeId === nextNodeId)!;
        expect(choice).toBeDefined();

        const state = createNewGameState();
        expect(state.flags).not.toContain(flag);

        const result = applyDialogueChoice(state, tree, choice);
        expect(result.gameState.flags).toContain(flag);

        const nextNode: DialogueNode = tree.nodes[choice.nextNodeId!]!;
        expect(nextNode.choices).toBeUndefined(); // each outcome is a leaf
        expect(nextNode.text.length).toBeGreaterThan(0);
    });

    it('the deflection choice also nudges outlook alignment positive', () => {
        const payload = fv14Payload();
        const tree = payload.dialogue;
        const root = tree.nodes[tree.rootId]!;
        const deflect = root.choices!.find(c => c.nextNodeId === 'deflected')!;

        const state = createNewGameState();
        const before = state.philosophicalAlignment.outlook;
        const result = applyDialogueChoice(state, tree, deflect);
        expect(result.gameState.philosophicalAlignment.outlook).toBe(before + 1);
    });

    it('a hypothetical future choice gated on boy-spared-father-worry is hidden until that flag is set', () => {
        // Proves the exact flag-gating mechanism a future Northern Forest
        // node would use to react to this dilemma's outcome (per the spec's
        // "flags read later" note) — not wired to any node tonight.
        const gatedChoice: DialogueChoice = {
            text: '"Are you alright? You seemed short with Father earlier."',
            requires: { flag: 'boy-spared-father-worry' },
        };
        const probeNode: DialogueNode = {
            id: 'probe',
            text: 'probe',
            choices: [gatedChoice],
        };

        const withoutFlag: DialogueContext = {
            activeQuests: new Set(),
            completedQuests: new Set(),
            flags: new Set(),
        };
        expect(visibleChoices(probeNode, withoutFlag)).toHaveLength(0);

        const withFlag: DialogueContext = {
            activeQuests: new Set(),
            completedQuests: new Set(),
            flags: new Set(['boy-spared-father-worry']),
        };
        expect(visibleChoices(probeNode, withFlag)).toHaveLength(1);
    });
});
