/**
 * adjust-npcs pass 1 (2026-09-05) — the Forest Ranger and Lost Trader were
 * authored (Phase 117) with full `DialogueTree`s but sat in northern-forest's
 * `unstagedNpcs` with no node ever assigned. `auditNarrativeReachability`
 * only checks that an unstaged NPC is *declared*, not that the declaration
 * is temporary — so this was invisible to every existing test. Worse: the
 * Forest Ranger's tree carries the ONLY authored path to
 * `startQuest('get-to-cave')` (Phase 8), so that quest could never be
 * started in live play while he stayed unstaged.
 *
 * This file is the hermetic witness for the fix: both NPCs now resolve as
 * `interaction` events at their new nodes (nf-21, nf-14), carrying their
 * dialogue trees, and the Ranger's quest grant actually starts the quest
 * through the real `applyDialogueChoice` orchestrator.
 */

import { describe, expect, it } from 'vitest';

import { createNewGameState } from '../../../Game/game.reducer';
import { resolveMapEvent } from '../resolve-map-event';
import { createStartingWorld } from '../../index';
import { getMapDefinition, createMapState } from '../../map.registry';
import { applyDialogueChoice } from '../../dialogue.runtime';
import type { GameState } from '../../../Game/types';
import type { MapState } from '../../types';
import type { ResolvedEvent } from '../types';
// Import for side effect — registers the pools when the test loads.
import '../content';

function resolveNode(nodeId: string): ResolvedEvent {
    const base = { ...createNewGameState(), world: createStartingWorld() };
    const def = getMapDefinition('coastal-continent', 'northern-forest');
    const map: MapState = createMapState(def);
    const state: GameState = {
        ...base,
        world: {
            ...base.world,
            currentMap: { ...map, currentNode: nodeId, consumedNodes: [] },
        },
    };
    return resolveMapEvent(state).event;
}

describe('Forest Ranger staged at nf-21', () => {
    it('resolves as an interaction naming the Forest Ranger, carrying his dialogue tree', () => {
        const event = resolveNode('nf-21');
        expect(event.kind).toBe('interaction');
        if (event.kind !== 'interaction') throw new Error('unreachable');
        expect(event.npcName).toBe('Forest Ranger');
        expect(event.dialogue).toBeDefined();
        expect(event.dialogue!.id).toBe('forest-ranger');
    });

    it('starts get-to-cave through the real dialogue orchestrator (Phase 8 quest, previously unstartable)', () => {
        const event = resolveNode('nf-21');
        if (event.kind !== 'interaction' || !event.dialogue) throw new Error('nf-21 did not resolve to a dialogue-bearing interaction');
        const tree = event.dialogue;
        const root = tree.nodes[tree.rootId]!;
        const choice = root.choices!.find(c => c.effect?.startQuest === 'get-to-cave');
        expect(choice).toBeDefined();

        const base = { ...createNewGameState(), world: createStartingWorld() };
        const def = getMapDefinition('coastal-continent', 'northern-forest');
        const map: MapState = createMapState(def);
        const state: GameState = { ...base, world: { ...base.world, currentMap: map } };

        expect(state.quests.active.some(q => q.name === 'get-to-cave')).toBe(false);
        const result = applyDialogueChoice(state, tree, choice!);
        expect(result.effects.startedQuest).toBe('get-to-cave');
        expect(result.gameState.quests.active.some(q => q.name === 'get-to-cave')).toBe(true);
    });
});

describe('Lost Trader staged at nf-14', () => {
    it('resolves as an interaction naming the Lost Trader, carrying his dialogue tree', () => {
        const event = resolveNode('nf-14');
        expect(event.kind).toBe('interaction');
        if (event.kind !== 'interaction') throw new Error('unreachable');
        expect(event.npcName).toBe('Lost Trader');
        expect(event.dialogue).toBeDefined();
        expect(event.dialogue!.id).toBe('lost-trader');
    });
});

describe('northern-forest unstagedNpcs backlog', () => {
    it('is empty — all 6 rostered NPCs are homed', () => {
        const def = getMapDefinition('coastal-continent', 'northern-forest');
        expect(def.unstagedNpcs ?? []).toEqual([]);
    });
});
