/**
 * Spec 08 — exploration loop test suite.
 *
 * Coverage:
 *   - moveToNode adjacency / completed-lock / locked-node validation.
 *   - processWorldEffectTick + getActiveHazards behaviour over multiple steps.
 *   - Per-objective quest engine (start / progress / complete).
 *   - resolveMapEvent dispatch for every kind the demo map exercises
 *     (post-Phase 25 — processNode + the legacy MapEvent surface removed).
 *   - End-to-end flow through fishing-village from start to boss-kill.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    createStartingWorld, moveToNode, completeCurrentNode, IllegalMoveError,
    resolveMapEvent, applyDialogueChoice, getMapDefinition, createMapState,
    emptyQuestLog, startQuest, progressQuest, isQuestComplete, completeQuest,
} from '../index';
import { processWorldEffectTick, getActiveHazards, applyEffect, lookupEffect } from '../../Effects';
import { createCharacter } from '../../Character';
import { createNewGameState } from '../../Game/game.reducer';
import { GameState } from '../../Game/types';
import { mockSequentialRng } from '../../test-utils/rng';

afterEach(() => vi.restoreAllMocks());

const startingState = (): GameState => createNewGameState();

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
        const world = createStartingWorld();
        const next = moveToNode(world, 'fv-2');
        expect(next.currentMap.currentNode).toBe('fv-2');
    });

    it('rejects non-adjacent nodes', () => {
        const world = createStartingWorld();
        expect(() => moveToNode(world, 'fv-5')).toThrow(IllegalMoveError);
    });

    it('rejects locked nodes', () => {
        const world = createStartingWorld();
        // fv-3 starts locked (only fv-2 is adjacent to start).
        expect(world.currentMap.lockedNodes).toContain('fv-3');
        expect(() => moveToNode(world, 'fv-3')).toThrow(IllegalMoveError);
    });

    it('locks completed nodes against back-travel (Q2)', () => {
        let world = createStartingWorld();
        world = moveToNode(world, 'fv-2');
        world = completeCurrentNode(world);
        // After completing fv-2, fv-3 becomes available.
        expect(world.currentMap.availableNodes).toContain('fv-3');
        world = moveToNode(world, 'fv-3');
        // Can't go back to the completed fv-2.
        expect(() => moveToNode(world, 'fv-2')).toThrow(IllegalMoveError);
    });

    it('returns the same state when target equals current node', () => {
        const world = createStartingWorld();
        const same = moveToNode(world, world.currentMap.currentNode);
        expect(same).toBe(world);
    });
});

// ── processWorldEffectTick (Q3) ─────────────────────────────────────────────

describe('processWorldEffectTick + getActiveHazards', () => {
    it('applies poison DoT each step (two steps verified)', () => {
        const player = createCharacter({
            name: 'Tester',
            level: 5,
            baseStats: { heart: 5, body: 5, mind: 5 },
        });
        const poison = lookupEffect('debuff_poison');
        expect(poison).toBeDefined();
        const { activeEffects } = applyEffect(player.effects, poison!, 0);
        const poisoned = { ...player, effects: activeEffects };

        const hpBefore = poisoned.health;
        const step1 = processWorldEffectTick(poisoned);
        expect(step1.damage).toBeGreaterThan(0);
        expect(step1.player.health).toBeLessThan(hpBefore);

        const step2 = processWorldEffectTick(step1.player);
        expect(step2.player.health).toBeLessThan(step1.player.health);
    });

    it('exposes active hazards via getActiveHazards (Q4)', () => {
        const player = createCharacter({
            name: 'Tester',
            level: 5,
            baseStats: { heart: 5, body: 5, mind: 5 },
        });
        const poison = lookupEffect('debuff_poison')!;
        const { activeEffects } = applyEffect(player.effects, poison, 0);
        const hazards = getActiveHazards({ effects: activeEffects });
        expect(hazards.length).toBeGreaterThan(0);
        expect(hazards[0].effectId).toBe('debuff_poison');
        expect(hazards[0].damagePerStep).toBeGreaterThan(0);
    });

    it('decrements duration each step and drops expired effects', () => {
        const player = createCharacter({
            name: 'Tester',
            level: 5,
            baseStats: { heart: 5, body: 5, mind: 5 },
        });
        const poison = lookupEffect('debuff_poison')!;
        let target = { ...player, effects: applyEffect(player.effects, poison, 0).activeEffects };
        const startDuration = target.effects[0].remainingDuration;
        const after = processWorldEffectTick(target);
        if (after.player.effects.length > 0) {
            expect(after.player.effects[0].remainingDuration).toBe(startDuration - 1);
        } else {
            expect(after.expired.length).toBeGreaterThan(0);
        }
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
        state = { ...state, world: moveToNode(state.world, 'fv-2') };
        state = { ...state, world: completeCurrentNode(state.world) };
        state = { ...state, world: moveToNode(state.world, 'fv-3') };
        state = { ...state, world: completeCurrentNode(state.world) };
        state = { ...state, world: moveToNode(state.world, 'fv-4') };
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
        for (const target of ['fv-2', 'fv-3', 'fv-4', 'fv-5', 'fv-6'] as const) {
            state = { ...state, world: moveToNode(state.world, target) };
            if (target !== 'fv-6') state = { ...state, world: completeCurrentNode(state.world) };
        }
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('encounter');
        if (result.event.kind === 'encounter') {
            expect(result.event.isBoss).toBe(true);
            expect(result.event.encounter.enemies[0].name).toBe('The Coastal Tyrant');
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

    it('grows from 10 to 25 nodes (spine + 3 sub-areas)', () => {
        expect(fv().nodes.length).toBe(25);
    });

    it('preserves the spine fv-1..fv-10 along y=0', () => {
        const map = fv();
        for (let i = 1; i <= 10; i++) {
            const node = map.nodes.find(n => n.id === `fv-${i}`);
            expect(node, `fv-${i} should exist`).toBeDefined();
            expect(node!.location[1], `fv-${i} should be on y=0`).toBe(0);
        }
    });

    it('extends (does not replace) the spine connectedNodes with new branch IDs', () => {
        const map = fv();
        // fv-3 gains fv-13 (harbor) + fv-16 (inland) on top of the spine fv-4.
        const fv3 = map.nodes.find(n => n.id === 'fv-3')!;
        expect(fv3.connectedNodes).toContain('fv-4');   // spine preserved
        expect(fv3.connectedNodes).toContain('fv-13');  // harbor branch
        expect(fv3.connectedNodes).toContain('fv-16');  // inland branch
    });

    it('fv-15 (gull crag) is a dead-end via fv-14', () => {
        const map = fv();
        const fv15 = map.nodes.find(n => n.id === 'fv-15')!;
        expect(fv15.connectedNodes).toEqual(['fv-14']);
    });

    it('fv-25 (gulls nest) is a dead-end via fv-24', () => {
        const map = fv();
        const fv25 = map.nodes.find(n => n.id === 'fv-25')!;
        expect(fv25.connectedNodes).toEqual(['fv-24']);
    });

    it('fv-17 ↔ fv-19 small loop in the inland streets sub-area', () => {
        const map = fv();
        const fv17 = map.nodes.find(n => n.id === 'fv-17')!;
        const fv19 = map.nodes.find(n => n.id === 'fv-19')!;
        // Loop: fv-17 → fv-19 and fv-19 → fv-17 (bidirectional).
        expect(fv17.connectedNodes).toContain('fv-19');
        expect(fv19.connectedNodes).toContain('fv-17');
    });

    it('all 25 nodes have a registered MapEventPool', () => {
        // Drive resolveMapEvent against each node id; expect every one to
        // surface a non-null event (i.e. the registered pool fired).
        const map = fv();
        for (const node of map.nodes) {
            const state = createNewGameState();
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

    it('preserves existing nf-1..nf-10 structure', () => {
        const map = nf();
        // Verify the existing fork-and-rejoin pattern is intact
        const nf1 = map.nodes.find(n => n.id === 'nf-1')!;
        const nf6 = map.nodes.find(n => n.id === 'nf-6')!;
        expect(nf1.connectedNodes).toContain('nf-2');
        expect(nf1.connectedNodes).toContain('nf-3');
        expect(nf6.connectedNodes).toContain('nf-7');
    });

    it('nf-3 branches to glen path via nf-12', () => {
        const map = nf();
        const nf3 = map.nodes.find(n => n.id === 'nf-3')!;
        expect(nf3.connectedNodes).toContain('nf-12');
    });

    it('nf-17 (bone circle) is a dead-end via nf-16', () => {
        const map = nf();
        const nf17 = map.nodes.find(n => n.id === 'nf-17')!;
        expect(nf17.connectedNodes).toEqual(['nf-16']);
    });

    it('nf-21 (ranger cairn) is a dead-end via nf-20', () => {
        const map = nf();
        const nf21 = map.nodes.find(n => n.id === 'nf-21')!;
        expect(nf21.connectedNodes).toEqual(['nf-20']);
    });

    it('nf-24 ↔ nf-25 small loop in the mist ridge sub-area', () => {
        const map = nf();
        const nf24 = map.nodes.find(n => n.id === 'nf-24')!;
        const nf25 = map.nodes.find(n => n.id === 'nf-25')!;
        // Loop: nf-24 → nf-25 and nf-25 → nf-24 (bidirectional).
        expect(nf24.connectedNodes).toContain('nf-25');
        expect(nf25.connectedNodes).toContain('nf-24');
    });

    it('all 25 nodes have a registered MapEventPool', () => {
        // Drive resolveMapEvent against each node id; expect every one to
        // surface a non-null event (i.e. the registered pool fired).
        const map = nf();
        for (const node of map.nodes) {
            const state = createNewGameState();
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
