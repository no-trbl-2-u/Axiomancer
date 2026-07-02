/**
 * Hermetic e2e — Phase 24 content.
 *
 * Walks the fishing-village and northern-forest pools authored in
 * `src/World/MapEvents/content.ts` and asserts the expected event
 * kind fires at each node. Verifies the side-effect import path
 * registers the pools and that the dispatcher routes each authored
 * node to its declared kind.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { resolveMapEvent } from '../resolve-map-event';
import { mockSequentialRng } from '../../../test-utils/rng';
import { createStartingWorld } from '../../index';
import { createNewGameState } from '../../../Game/game.reducer';
import { getMapDefinition } from '../../map.registry';
import { createMapState } from '../../map.registry';
import type { GameState } from '../../../Game/types';
import type { MapState } from '../../types';
// Import for side effect — registers the pools when the test loads.
import '../content';

function freshWorldAt(mapName: 'fishing-village' | 'northern-forest'): GameState {
    const base = { ...createNewGameState(), world: createStartingWorld() };
    const def = getMapDefinition('coastal-continent', mapName);
    const map: MapState = createMapState(def);
    return { ...base, world: { ...base.world, currentMap: map } };
}

function visit(state: GameState, nodeId: string): { state: GameState; kind: string } {
    const next: GameState = {
        ...state,
        world: { ...state.world, currentMap: { ...state.world.currentMap, currentNode: nodeId } },
    };
    const result = resolveMapEvent(next);
    return { state: result.state, kind: result.event.kind };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('fishing-village content — new-player map', () => {
    // The starting map is combat-focused but varied: a real spread of kinds
    // (rest / gathering / hazard / loot-cache / narration / interaction) for
    // recovery + texture, with encounters kept a slight plurality, exactly ONE
    // quest node (fv-15), and ONE boss node (fv-6, an `encounter` with isBoss).
    // See the new-player override block in `content.ts`.
    it('is a balanced spread with encounters a slight plurality and one quest + one boss', () => {
        mockSequentialRng(0.5);
        let state = freshWorldAt('fishing-village');

        const counts: Record<string, number> = {};
        for (let i = 1; i <= 25; i++) {
            const r = visit(state, `fv-${i}`);
            counts[r.kind] = (counts[r.kind] ?? 0) + 1;
            state = r.state;
        }

        // 8 encounter-kind nodes (7 regular + the fv-6 boss) — a slight plurality.
        expect(counts.encounter).toBe(8);
        expect(counts.rest).toBe(4);
        expect(counts.gathering).toBe(4);
        expect(counts.hazard).toBe(3);
        expect(counts['loot-cache']).toBe(3);
        expect(counts.narration).toBe(1);
        expect(counts.interaction).toBe(1);
        expect(counts.quest).toBe(1);
        // Encounters remain the single largest kind.
        const maxCount = Math.max(...Object.values(counts));
        expect(counts.encounter).toBe(maxCount);
        // Every node resolved to a real kind.
        expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(25);
    });

    it('fv-15 is the single quest node (build-the-boat)', () => {
        mockSequentialRng(0.5);
        const state = freshWorldAt('fishing-village');
        const result = resolveMapEvent({
            ...state,
            world: { ...state.world, currentMap: { ...state.world.currentMap, currentNode: 'fv-15', consumedNodes: [] } },
        });
        expect(result.event.kind).toBe('quest');
        if (result.event.kind === 'quest') {
            expect(result.event.boardId).toBe('build-the-boat');
        }
    });

    it('fv-14 is a narration node carrying a dialogue tree', () => {
        mockSequentialRng(0.5);
        const state = freshWorldAt('fishing-village');
        const result = resolveMapEvent({
            ...state,
            world: { ...state.world, currentMap: { ...state.world.currentMap, currentNode: 'fv-14', consumedNodes: [] } },
        });
        expect(result.event.kind).toBe('narration');
        if (result.event.kind === 'narration') {
            const tree = result.event.dialogue;
            expect(tree.rootId).toBeTruthy();
            expect(tree.nodes[tree.rootId]).toBeDefined();
            // A narration is a monologue: the root leaf has no choices.
            expect(tree.nodes[tree.rootId]!.choices).toBeUndefined();
            expect(Object.keys(tree.nodes).length).toBeGreaterThanOrEqual(2);
        }
    });

    it('boss flag is set on fv-6, pinned to the authored override level (not the enemy L6)', () => {
        mockSequentialRng(0.5);
        const state = freshWorldAt('fishing-village');
        const r = visit(state, 'fv-6');
        expect(r.kind).toBe('encounter');
        const result = resolveMapEvent({
            ...state,
            world: { ...state.world, currentMap: { ...state.world.currentMap, currentNode: 'fv-6', consumedNodes: [] } },
        });
        if (result.event.kind === 'encounter') {
            expect(result.event.isBoss).toBe(true);
            // coastal-tyrant is endgame-tier (L6); the encounter `level`
            // override scales it down so a fresh player can win the climax.
            const boss = result.event.encounter.enemies[0];
            expect(boss.level).toBe(3);
            expect(boss.name).toBe('The Coastal Tyrant');
        }
    });
});

describe('northern-forest content (Phase 24)', () => {
    it('each authored node resolves to its declared MapEventKind', () => {
        mockSequentialRng(0.5);
        let state = freshWorldAt('northern-forest');

        const expected: Array<[string, string]> = [
            ['nf-1',  'cutscene'],
            ['nf-2',  'gathering'],
            ['nf-3',  'interaction'], // Phase 115: Shrine Keeper NPC
            ['nf-4',  'rest'],
            ['nf-5',  'interaction'], // Phase 115: Chronicler NPC
            ['nf-6',  'encounter'],
            ['nf-7',  'interaction'],
            ['nf-8',  'village'],
            ['nf-9',  'interaction'], // Phase 115: Wandering Philosopher NPC
            ['nf-10', 'cutscene'],
        ];

        for (const [node, kind] of expected) {
            const r = visit(state, node);
            expect(r.kind, `node ${node} should resolve to ${kind}`).toBe(kind);
            state = r.state;
        }
    });
});

describe('Phase 37 shop content', () => {
    // The starting map (fishing-village) is now a combat gauntlet with no
    // village/shop node — the surviving authored shop lives on
    // northern-forest (nf-8, Glen Market).
    it('the authored village payload carries a shop inventory with consumable IDs that resolve', async () => {
        mockSequentialRng(0.5);
        const { getConsumableById } = await import('../../../Items/consumable.library');
        for (const map of ['northern-forest'] as const) {
            const state = freshWorldAt(map);
            const def = getMapDefinition('coastal-continent', map);
            const villageNode = def.nodes.find(n => n.id === 'nf-8');
            expect(villageNode, `${map} must have an authored village node`).toBeDefined();
            const r = visit(state, villageNode!.id);
            expect(r.kind).toBe('village');
            // Re-resolve to inspect the shop field on the event payload.
            const next: GameState = {
                ...state,
                world: { ...state.world, currentMap: { ...state.world.currentMap, currentNode: villageNode!.id } },
            };
            const result = resolveMapEvent(next);
            expect(result.event.kind).toBe('village');
            if (result.event.kind !== 'village') return; // type narrowing
            expect(result.event.shop, `${map} village should carry a shop`).toBeDefined();
            expect(result.event.shop!.wares.length).toBeGreaterThan(0);
            for (const ware of result.event.shop!.wares) {
                expect(getConsumableById(ware.itemId), `ware ${ware.itemId} must resolve in consumableLibrary`).toBeDefined();
                expect(ware.price).toBeGreaterThanOrEqual(0);
            }
        }
    });
});

describe('every MapEventKind is covered by the authored content', () => {
    it('each kind appears at least once across the two maps', () => {
        mockSequentialRng(0.5);
        const kinds = new Set<string>();
        for (const map of ['fishing-village', 'northern-forest'] as const) {
            let state = freshWorldAt(map);
            const def = getMapDefinition('coastal-continent', map);
            for (const node of def.nodes) {
                const r = visit(state, node.id);
                kinds.add(r.kind);
                state = r.state;
            }
        }
        // The original eight kinds (covered across both maps) plus the two
        // later additions — 'quest' (fv-15) and 'narration' (fv-14), both
        // authored on fishing-village.
        const required = [
            'encounter', 'interaction', 'gathering', 'rest',
            'village', 'cutscene', 'hazard', 'loot-cache',
            'quest', 'narration',
        ];
        for (const k of required) {
            expect(kinds, `authored content should fire ${k} at least once`).toContain(k);
        }
    });
});
