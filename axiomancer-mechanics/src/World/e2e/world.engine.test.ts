/**
 * Spec 08 — exploration loop test suite.
 *
 * Coverage:
 *   - moveToNode adjacency / completed-lock / locked-node validation.
 *   - Per-objective quest engine (start / progress / complete).
 *   - resolveMapEvent dispatch for every kind the demo map exercises
 *     (post-Phase 25 — processNode + the legacy MapEvent surface removed).
 *   - End-to-end flow through the Breakwater from start to its door fight.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    createStartingWorld, moveToNode, completeCurrentNode, IllegalMoveError,
    resolveMapEvent, applyDialogueChoice, getMapDefinition, createMapState,
    emptyQuestLog, startQuest, progressQuest, isQuestComplete, completeQuest,
} from '../index';
import { createNewGameState } from '../../Game/game.reducer';
import { GameState } from '../../Game/types';
import { mockSequentialRng } from '../../test-utils/rng';

afterEach(() => vi.restoreAllMocks());

const startingState = (): GameState => createNewGameState({ startMap: 'breakwater' });

// The Act 1 maps carry no NPC, village or quest, so the varied MapEvent kinds
// (interaction / village / loot-cache) and the quest/dialogue mechanics are
// exercised against the parked northern-forest, which retains the authored
// content. Sets currentNode
// directly — resolveMapEvent works off currentNode regardless of traversal.
const nfStateAt = (nodeId: string): GameState => {
    const base = startingState();
    const def = getMapDefinition('coastal-continent', 'northern-forest');
    return {
        ...base,
        world: { ...base.world, currentMap: { ...createMapState(def), currentNode: nodeId } },
    };
};

// ── moveToNode ──────────────────────────────────────────────────────────────

describe('moveToNode', () => {
    it('moves to a connected, unlocked, uncompleted node', () => {
        const world = createStartingWorld('breakwater');
        const next = moveToNode(world, 'bw-2');
        expect(next.currentMap.currentNode).toBe('bw-2');
    });

    it('rejects non-adjacent nodes', () => {
        const world = createStartingWorld('breakwater');
        expect(() => moveToNode(world, 'bw-12')).toThrow(IllegalMoveError);
    });

    it('rejects locked nodes', () => {
        const world = createStartingWorld('breakwater');
        // bw-7 (the south pier) starts locked (only bw-2..bw-5 touch the windmill).
        expect(world.currentMap.lockedNodes).toContain('bw-7');
        expect(() => moveToNode(world, 'bw-7')).toThrow(IllegalMoveError);
    });

    it('locks completed nodes against back-travel (Q2)', () => {
        let world = createStartingWorld('breakwater');
        world = moveToNode(world, 'bw-2');
        world = completeCurrentNode(world);
        // After completing bw-2, the south pier (bw-7) becomes available.
        expect(world.currentMap.availableNodes).toContain('bw-7');
        world = moveToNode(world, 'bw-7');
        // Can't go back to the completed bw-2.
        expect(() => moveToNode(world, 'bw-2')).toThrow(IllegalMoveError);
    });

    it('returns the same state when target equals current node', () => {
        const world = createStartingWorld('breakwater');
        const same = moveToNode(world, world.currentMap.currentNode);
        expect(same).toBe(world);
    });
});

// ── Quest engine (Q7B) ──────────────────────────────────────────────────────

describe('per-objective quest engine', () => {
    const forestDef = () => getMapDefinition('coastal-continent', 'northern-forest');

    it('starts a quest and tracks objectives', () => {
        const quest = forestDef().quests!.find(q => q.name === 'gather-wood')!;
        const log = startQuest(emptyQuestLog(), quest);
        expect(log.active).toHaveLength(1);
        expect(log.active[0].status).toBe('active');
        expect(isQuestComplete(log.active[0])).toBe(false);
    });

    it('progressQuest advances counters and auto-completes when filled', () => {
        const quest = forestDef().quests!.find(q => q.name === 'gather-wood')!;
        let log = startQuest(emptyQuestLog(), quest);
        const partial = progressQuest(log, 'gather-wood', 'collect-oak-branch', 2);
        expect(partial.log.completed).not.toContain('gather-wood');
        const res = progressQuest(partial.log, 'gather-wood', 'collect-oak-branch', 1);
        log = res.log;
        expect(log.completed).toContain('gather-wood');
        expect(res.completedName).toBe('gather-wood');
    });

    it('completeQuest moves the quest to completed list', () => {
        const quest = forestDef().quests!.find(q => q.name === 'gather-wood')!;
        let log = startQuest(emptyQuestLog(), quest);
        log = completeQuest(log, 'gather-wood');
        expect(log.completed).toContain('gather-wood');
        expect(log.active).toHaveLength(0);
    });
});

// ── resolveMapEvent dispatcher (post-Phase 25) ────────────────────────────

describe('resolveMapEvent dispatch', () => {
    it('returns kind=interaction with dialogue tree for the NPC node', () => {
        mockSequentialRng(0.5);
        const result = resolveMapEvent(nfStateAt('nf-3'));
        expect(result.event.kind).toBe('interaction');
        if (result.event.kind === 'interaction') {
            expect(result.event.npcName).toBe('Shrine Keeper');
            expect(result.event.dialogue).toBeDefined();
        }
    });

    it('returns kind=village for the shop node (folded into village)', () => {
        mockSequentialRng(0.5);
        const result = resolveMapEvent(nfStateAt('nf-8'));
        expect(result.event.kind).toBe('village');
        if (result.event.kind === 'village') {
            expect(result.event.merchants.length).toBeGreaterThan(0);
        }
    });

    it('returns kind=encounter on encounter nodes', () => {
        mockSequentialRng(0.5);
        let state = startingState();
        // bw-2 (the crane quay) is a Float-Eye fight one step from the windmill.
        state = { ...state, world: moveToNode(state.world, 'bw-2') };
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('encounter');
        if (result.event.kind === 'encounter') {
            expect(result.event.isBoss).toBe(false);
            expect(result.event.encounter.enemies).toHaveLength(1);
        }
    });

    it('grants currency on loot-cache nodes (treasure folded into loot-cache)', () => {
        mockSequentialRng(0.5);
        const state = nfStateAt('nf-16');
        const before = state.player.currency;
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('loot-cache');
        if (result.event.kind === 'loot-cache') {
            expect(result.event.currency).toBe(10);
        }
        expect(result.state.player.currency).toBe(before + 10);
    });

    it('returns kind=encounter with isBoss=true on the boss node', () => {
        mockSequentialRng(0.5);
        let state = startingState();
        // The watchtower (bw-17) holds the Breakwater's door fight.
        for (const target of ['bw-2', 'bw-7', 'bw-11', 'bw-14', 'bw-17'] as const) {
            state = { ...state, world: moveToNode(state.world, target) };
            if (target !== 'bw-17') state = { ...state, world: completeCurrentNode(state.world) };
        }
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('encounter');
        if (result.event.kind === 'encounter') {
            expect(result.event.isBoss).toBe(true);
            expect(result.event.encounter.enemies[0].name).toBe('The Doorwarden');
        }
    });
});

// ── Dialogue (Q9) ──────────────────────────────────────────────────────────

describe('applyDialogueChoice', () => {
    // No Act 1 map carries an NPC, so the dialogue mechanics are exercised
    // against the Forest Ranger's tree on the parked northern-forest, with
    // the player standing there (a quest starts only if the CURRENT map
    // defines it).
    const rangerTree = () =>
        getMapDefinition('coastal-continent', 'northern-forest').npcs!.find(
            n => n.name === 'Forest Ranger',
        )!.dialogueTree!;

    it('starts a quest when a choice carries startQuest', () => {
        mockSequentialRng(0.5);
        const state = nfStateAt('nf-1');
        const tree = rangerTree();
        const root = tree.nodes[tree.rootId];
        // "What's past the tree line?" → starts get-to-cave
        const ask = root.choices!.find(c => c.effect?.startQuest);
        expect(ask).toBeDefined();
        const step = applyDialogueChoice(state, tree, ask!);
        expect(step.nextNode?.id).toBe('ranger_cave_directions');
        expect(step.effects.startedQuest).toBe('get-to-cave');
        expect(step.gameState.quests.active.find(q => q.name === 'get-to-cave')).toBeDefined();
    });

    it('grants currency when a choice carries grantCurrency', () => {
        mockSequentialRng(0.5);
        const state = nfStateAt('nf-1');
        const tree = rangerTree();
        const choice = tree.nodes.talk_duties.choices!.find(c => (c.effect?.grantCurrency ?? 0) > 0)!;
        const before = state.player.currency;
        const step = applyDialogueChoice(state, tree, choice);
        expect(step.gameState.player.currency).toBe(before + choice.effect!.grantCurrency!);
        expect(choice.effect!.grantCurrency).toBe(35);
    });
});

describe('Phase 117 — expanded northern-forest layout', () => {
    const nf = () => getMapDefinition('coastal-continent', 'northern-forest');

    it('grows from 10 to 25 nodes (existing structure + 3 sub-areas)', () => {
        expect(nf().nodes.length).toBe(25);
    });

    it('opens the treeline onto all three lanes', () => {
        const map = nf();
        const nf1 = map.nodes.find(n => n.id === 'nf-1')!;
        expect(nf1.connectedNodes).toContain('nf-2');
        expect(nf1.connectedNodes).toContain('nf-3');
        expect(nf1.connectedNodes).toContain('nf-12');
    });

    it('leaves no dead-end spurs off the lanes', () => {
        // Replaces the Phase 117 tests that REQUIRED nf-17 / nf-21 to be
        // dead ends and nf-24 <-> nf-25 to loop back on itself. Same defect
        // as the village: under the gauntlet lock those were soft-locks.
        const map = nf();
        const terminal = map.nodes.filter(n => n.connectedNodes.length === 0);
        expect(terminal.map(n => n.id).sort()).toEqual(['nf-10', 'nf-24', 'nf-25']);
        for (const id of ['nf-17', 'nf-21', 'nf-12']) {
            const node = map.nodes.find(n => n.id === id)!;
            expect(node.connectedNodes.length, `${id} must keep a way onward`).toBeGreaterThan(0);
        }
    });

    it('all 25 nodes have a registered MapEventPool', () => {
        // Drive resolveMapEvent against each node id; expect every one to
        // surface a non-null event (i.e. the registered pool fired).
        const map = nf();
        for (const node of map.nodes) {
            const state = createNewGameState({ startMap: 'breakwater' });
            state.world = {
                ...state.world,
                currentMap: {
                    ...state.world.currentMap,
                    name: 'northern-forest',
                    continent: 'coastal-continent',
                    currentNode: node.id,
                    availableNodes: [node.id],
                    discoveredNodes: [node.id],
                    consumedNodes: [],
                },
            };
            const result = resolveMapEvent(state);
            expect(result.event, `nf ${node.id} should have a registered pool`).not.toBeNull();
        }
    });

});
