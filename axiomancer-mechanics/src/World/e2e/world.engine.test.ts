/**
 * Spec 08 — exploration loop test suite.
 *
 * Coverage:
 *   - moveToNode adjacency / completed-lock / locked-node validation.
 *   - Per-objective quest engine (start / progress / complete).
 *   - resolveMapEvent dispatch for every kind the demo map exercises
 *     (post-Phase 25 — processNode + the legacy MapEvent surface removed).
 *   - End-to-end flow through fishing-village from start to boss-kill.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    createStartingWorld, moveToNode, completeCurrentNode, IllegalMoveError, forwardEdges,
    resolveMapEvent, applyDialogueChoice, getMapDefinition, createMapState,
    emptyQuestLog, startQuest, progressQuest, isQuestComplete, completeQuest,
} from '../index';
import { createNewGameState } from '../../Game/game.reducer';
import { GameState } from '../../Game/types';
import { mockSequentialRng } from '../../test-utils/rng';

afterEach(() => vi.restoreAllMocks());

const startingState = (): GameState => createNewGameState({ startMap: 'fishing-village' });

// fishing-village is now a combat-only new-player gauntlet, so the varied
// MapEvent kinds (interaction / village / loot-cache) are exercised against
// northern-forest, which retains the authored content. Sets currentNode
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
        const world = createStartingWorld('fishing-village');
        const next = moveToNode(world, 'fv-2');
        expect(next.currentMap.currentNode).toBe('fv-2');
    });

    it('rejects non-adjacent nodes', () => {
        const world = createStartingWorld('fishing-village');
        expect(() => moveToNode(world, 'fv-5')).toThrow(IllegalMoveError);
    });

    it('rejects locked nodes', () => {
        const world = createStartingWorld('fishing-village');
        // fv-26 (the first gate) starts locked (only fv-2 is adjacent to start).
        expect(world.currentMap.lockedNodes).toContain('fv-26');
        expect(() => moveToNode(world, 'fv-26')).toThrow(IllegalMoveError);
    });

    it('locks completed nodes against back-travel (Q2)', () => {
        let world = createStartingWorld('fishing-village');
        world = moveToNode(world, 'fv-2');
        world = completeCurrentNode(world);
        // After completing fv-2, the first gate (fv-26) becomes available.
        expect(world.currentMap.availableNodes).toContain('fv-26');
        world = moveToNode(world, 'fv-26');
        // Can't go back to the completed fv-2.
        expect(() => moveToNode(world, 'fv-2')).toThrow(IllegalMoveError);
    });

    it('returns the same state when target equals current node', () => {
        const world = createStartingWorld('fishing-village');
        const same = moveToNode(world, world.currentMap.currentNode);
        expect(same).toBe(world);
    });
});

// ── Quest engine (Q7B) ──────────────────────────────────────────────────────

describe('per-objective quest engine', () => {
    const fishingDef = () => getMapDefinition('coastal-continent', 'fishing-village');

    it('starts a quest and tracks objectives', () => {
        const quest = fishingDef().quests!.find(q => q.name === 'starting-quest')!;
        const log = startQuest(emptyQuestLog(), quest);
        expect(log.active).toHaveLength(1);
        expect(log.active[0].status).toBe('active');
        expect(isQuestComplete(log.active[0])).toBe(false);
    });

    it('progressQuest advances counters and auto-completes when filled', () => {
        const quest = fishingDef().quests!.find(q => q.name === 'starting-quest')!;
        let log = startQuest(emptyQuestLog(), quest);
        const res = progressQuest(log, 'starting-quest', 'kill-tyrant', 1);
        log = res.log;
        expect(log.completed).toContain('starting-quest');
        expect(res.completedName).toBe('starting-quest');
    });

    it('completeQuest moves the quest to completed list', () => {
        const quest = fishingDef().quests!.find(q => q.name === 'starting-quest')!;
        let log = startQuest(emptyQuestLog(), quest);
        log = completeQuest(log, 'starting-quest');
        expect(log.completed).toContain('starting-quest');
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
        // fv-26 is the first of the three gates (2026-09-21): the nearest
        // encounter from fv-2, and on every route.
        state = { ...state, world: moveToNode(state.world, 'fv-2') };
        state = { ...state, world: completeCurrentNode(state.world) };
        state = { ...state, world: moveToNode(state.world, 'fv-26') };
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
        for (const target of ['fv-2', 'fv-26', 'fv-3', 'fv-27', 'fv-4', 'fv-28', 'fv-5', 'fv-6'] as const) {
            state = { ...state, world: moveToNode(state.world, target) };
            if (target !== 'fv-6') state = { ...state, world: completeCurrentNode(state.world) };
        }
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('encounter');
        if (result.event.kind === 'encounter') {
            expect(result.event.isBoss).toBe(true);
            expect(result.event.encounter.enemies[0].name).toBe('The King of Revenge');
        }
    });
});

// ── Dialogue (Q9) ──────────────────────────────────────────────────────────

describe('applyDialogueChoice', () => {
    // Old Marrow's NPC + dialogue tree still lives in the fishing-village map
    // DEFINITION (only the event-pool wiring at fv-2 changed to the new-player
    // gauntlet), so the dialogue mechanics are exercised against that tree
    // fetched from the map def.
    const oldMarrowTree = () =>
        getMapDefinition('coastal-continent', 'fishing-village').npcs!.find(
            n => n.name === 'Old Marrow',
        )!.dialogueTree!;

    it('starts a quest when a choice carries startQuest', () => {
        mockSequentialRng(0.5);
        const state = startingState();
        const tree = oldMarrowTree();
        const root = tree.nodes[tree.rootId];
        // Pick "What needs doing?" → leads to 'offer'
        const offerChoice = root.choices!.find(c => c.text.startsWith('What needs'));
        expect(offerChoice).toBeDefined();
        const step1 = applyDialogueChoice(state, tree, offerChoice!);
        expect(step1.nextNode?.id).toBe('offer');
        // Pick "Consider it done" → starts the quest
        const accept = step1.nextNode!.choices!.find(c => c.effect?.startQuest);
        const step2 = applyDialogueChoice(step1.gameState, tree, accept!);
        expect(step2.effects.startedQuest).toBe('starting-quest');
        expect(step2.gameState.quests.active.find(q => q.name === 'starting-quest')).toBeDefined();
    });

    it('grants currency when a choice carries grantCurrency', () => {
        mockSequentialRng(0.5);
        const state = startingState();
        const tree = oldMarrowTree();
        const thanksNode = tree.nodes.thanks;
        const choice = thanksNode.choices![0];
        const before = state.player.currency;
        const step = applyDialogueChoice(state, tree, choice);
        expect(step.gameState.player.currency).toBe(before + 25);
    });
});

describe('Phase 65 — expanded fishing-village layout', () => {
    const fv = () => getMapDefinition('coastal-continent', 'fishing-village');

    it('grows from 10 to 28 nodes (spine + 3 sub-areas + the three gates)', () => {
        expect(fv().nodes.length).toBe(28);
    });

    it('preserves the spine fv-1..fv-10 along y=0', () => {
        const map = fv();
        for (let i = 1; i <= 10; i++) {
            const node = map.nodes.find(n => n.id === `fv-${i}`);
            expect(node, `fv-${i} should exist`).toBeDefined();
            expect(node!.location[1], `fv-${i} should be on y=0`).toBe(0);
        }
    });

    it('every gate opens onto its whole next column, and every lane funnels into the next gate', () => {
        // THE THREE GATES (2026-09-21): the lanes are what they were, but a
        // gate sits before each open column. A gate opens onto every lane;
        // every lane's nodes lead only to the next gate — so no route can
        // skip a fight, and every route can still choose its lane.
        //
        // Read against the FORWARD SKELETON, not raw `connectedNodes`: D1
        // (same day) added lateral ribs between neighbouring lanes, which are
        // sideways traversal and never a way onward. The gate guarantee is a
        // statement about progression, so it is measured on progression edges.
        const map = fv();
        const forward = forwardEdges(map);
        const onward = (id: string) => [...(forward.get(id) ?? [])].sort();
        expect(onward('fv-2')).toEqual(['fv-26']);
        expect(onward('fv-26')).toEqual(['fv-11', 'fv-16', 'fv-3']);
        for (const id of ['fv-16', 'fv-3', 'fv-11']) expect(onward(id)).toEqual(['fv-27']);
        expect(onward('fv-27')).toEqual(['fv-12', 'fv-13', 'fv-14', 'fv-17', 'fv-4']);
        for (const id of ['fv-17', 'fv-4', 'fv-14', 'fv-12', 'fv-13']) expect(onward(id)).toEqual(['fv-28']);
        expect(onward('fv-28')).toEqual(['fv-15', 'fv-20', 'fv-5']);
        for (const id of ['fv-15', 'fv-5', 'fv-20']) expect(onward(id)).toEqual(['fv-6']);
    });

    it('ribs every open lane column sideways without giving a lane a second way onward (D1)', () => {
        // The ribs are the half of D1 that shows on the canvas: each open
        // column is walkable end to end, so a hazard that blocks one approach
        // cannot orphan a lane. They must not add PROGRESSION, though — the
        // gate guarantee above depends on a lane having exactly one way
        // onward, and a rib that reached forward would break it silently.
        const map = fv();
        const node = (id: string) => map.nodes.find(n => n.id === id)!;
        const columnOf = (id: string) => node(id).location[0];
        for (const [a, b] of [['fv-16', 'fv-3'], ['fv-3', 'fv-11'],
                              ['fv-12', 'fv-17'], ['fv-17', 'fv-4'], ['fv-4', 'fv-14'], ['fv-14', 'fv-13'],
                              ['fv-15', 'fv-5'], ['fv-5', 'fv-20']] as const) {
            expect(columnOf(a), `${a}/${b} must share a column`).toBe(columnOf(b));
            expect(node(a).connectedNodes, `${a} -> ${b}`).toContain(b);
            expect(node(b).connectedNodes, `${b} -> ${a}`).toContain(a);
        }
    });

    it('leaves no dead-end spurs off the lanes', () => {
        // These three assertions replace the Phase 65 tests that REQUIRED
        // fv-15, fv-25 and the fv-17/fv-19 loop to be dead ends. Under the
        // gauntlet's completed-node lock those spurs were soft-locks, not
        // level design: entering fv-15 ended the run outright, four nodes in.
        const map = fv();
        const terminal = map.nodes.filter(n => n.connectedNodes.length === 0);
        // D1's ribs never touch the terminal column, so raw-edge terminality
        // still names exactly the authored ends of the map.
        expect(terminal.map(n => n.id).sort()).toEqual(['fv-10', 'fv-24']);
        for (const id of ['fv-15', 'fv-25', 'fv-17', 'fv-19']) {
            const node = map.nodes.find(n => n.id === id)!;
            expect(node.connectedNodes.length, `${id} must keep a way onward`).toBeGreaterThan(0);
        }
    });

    it('all 25 nodes have a registered MapEventPool', () => {
        // Drive resolveMapEvent against each node id; expect every one to
        // surface a non-null event (i.e. the registered pool fired).
        const map = fv();
        for (const node of map.nodes) {
            const state = createNewGameState({ startMap: 'fishing-village' });
            state.world = {
                ...state.world,
                currentMap: {
                    ...state.world.currentMap,
                    currentNode: node.id,
                    availableNodes: [node.id],
                    discoveredNodes: [node.id],
                    consumedNodes: [],
                },
            };
            const result = resolveMapEvent(state);
            expect(result.event, `fv ${node.id} should have a registered pool`).not.toBeNull();
        }
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
            const state = createNewGameState({ startMap: 'fishing-village' });
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
