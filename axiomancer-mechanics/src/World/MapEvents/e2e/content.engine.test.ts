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
    // recovery + texture, encounters/interaction/rest tied for largest, and
    // ONE boss node (fv-6, an `encounter` with isBoss). See the new-player
    // override block in `content.ts`.
    it('is a balanced spread, encounters/interaction/rest tied for largest, one boss', () => {
        mockSequentialRng(0.5);
        let state = freshWorldAt('fishing-village');

        const counts: Record<string, number> = {};
        for (let i = 1; i <= 25; i++) {
            const r = visit(state, `fv-${i}`);
            counts[r.kind] = (counts[r.kind] ?? 0) + 1;
            state = r.state;
        }

        // 4 encounter-kind nodes (3 regular + the fv-6 boss). Phase 53c
        // converted three regular encounters (fv-2, fv-7, fv-18) into
        // homed-NPC interactions and dropped fv-12's grave-larva as it
        // re-homed to carry fv-2's displaced loot-cache instead (see
        // `content.ts`'s `FV_ENCOUNTER_FOES`/`FV_LOOT_NODES` comments);
        // little-belle moved fv-7 -> fv-13 to stay reachable ahead of the
        // Beggar's new column. Phase 53d (S-01) then converted two more
        // (fv-16, fv-4) into narration dilemmas, Phase 60 converted a third
        // (fv-21) into the re-homed blacksmith node, and Phase 61 gave one
        // back — fv-15's retired quest-board node rejoined the encounter
        // roster as foot-stealer.
        expect(counts.encounter).toBe(4);
        expect(counts.cutscene).toBe(1);
        expect(counts.rest).toBe(4);
        expect(counts.gathering).toBe(3);
        expect(counts.hazard).toBe(2);
        expect(counts['loot-cache']).toBe(3);
        // fv-14 "What Do I Tell Father?" (Phase 24), fv-16 "The Borrowed
        // Hook" and fv-4 "The Stranger's Net" (both Phase 53d/S-01).
        expect(counts.narration).toBe(3);
        // Phase 53c (S-02) — four homed NPCs: Old Marrow (fv-2), the
        // Coastal Beggar (fv-7), Captain Blackwater (fv-18), and the
        // Fisherman's Daughter (fv-19, was the unrostered 'Weathered
        // Fisher').
        expect(counts.interaction).toBe(4);
        // Phase 60 — the re-homed anvil, a single fixed placement at fv-21
        // (not a cadence — see `content.ts`'s `FV_BLACKSMITH_NODES`).
        expect(counts.blacksmith).toBe(1);
        // Encounter, interaction, and rest now tie for the largest kind at
        // 4 apiece — no single kind dominates the map.
        const maxCount = Math.max(...Object.values(counts));
        expect(counts.interaction).toBe(maxCount);
        expect(counts.rest).toBe(maxCount);
        expect(counts.encounter).toBe(maxCount);
        // Every node resolved to a real kind.
        expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(25);
    });

    it('fv-21 is the re-homed blacksmith node, offering the witness swap variant', () => {
        mockSequentialRng(0.5);
        const state = freshWorldAt('fishing-village');
        const result = resolveMapEvent({
            ...state,
            world: { ...state.world, currentMap: { ...state.world.currentMap, currentNode: 'fv-21', consumedNodes: [] } },
        });
        expect(result.event.kind).toBe('blacksmith');
        if (result.event.kind === 'blacksmith') {
            expect(result.event.variants.map((v) => v.id)).toContain('die-gear-heart-rich-payload');
            expect(result.event.budget).toBeGreaterThan(0);
        }
    });

    it('fv-15 is an encounter node (foot-stealer, Phase 61 — retired quest-board node)', () => {
        mockSequentialRng(0.5);
        const state = freshWorldAt('fishing-village');
        const result = resolveMapEvent({
            ...state,
            world: { ...state.world, currentMap: { ...state.world.currentMap, currentNode: 'fv-15', consumedNodes: [] } },
        });
        expect(result.event.kind).toBe('encounter');
        if (result.event.kind === 'encounter') {
            expect(result.event.encounter.enemies[0].name).toBe('Foot-Stealer');
        }
    });

    it('fv-14 is a narration node carrying the "What Do I Tell Father?" branching dialogue', () => {
        mockSequentialRng(0.5);
        const state = freshWorldAt('fishing-village');
        const result = resolveMapEvent({
            ...state,
            world: { ...state.world, currentMap: { ...state.world.currentMap, currentNode: 'fv-14', consumedNodes: [] } },
        });
        expect(result.event.kind).toBe('narration');
        if (result.event.kind === 'narration') {
            const tree = result.event.dialogue;
            expect(tree.id).toBe('fv-father-worry');
            expect(tree.rootId).toBeTruthy();
            const root = tree.nodes[tree.rootId];
            expect(root).toBeDefined();
            // Unlike the original monologue placeholder, this narration node
            // is a real dilemma: the root offers three unflagged choices,
            // each ending in its own leaf outcome.
            expect(root!.choices).toHaveLength(3);
            expect(Object.keys(tree.nodes).length).toBeGreaterThanOrEqual(4);
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
            // king-of-revenge is mid-tier (L6); the encounter `level`
            // override scales it down so a fresh player can win the climax.
            const boss = result.event.encounter.enemies[0];
            expect(boss.level).toBe(3);
            expect(boss.name).toBe('The King of Revenge');
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
        // later additions still live — 'narration' (fv-14, fishing-village)
        // and 'blacksmith' (fv-21, Phase 60). 'quest' (fv-15) was retired in
        // Phase 61 along with the Quest Board minigame it launched.
        const required = [
            'encounter', 'interaction', 'gathering', 'rest',
            'village', 'cutscene', 'hazard', 'loot-cache',
            'narration', 'blacksmith',
        ];
        for (const k of required) {
            expect(kinds, `authored content should fire ${k} at least once`).toContain(k);
        }
    });
});

describe('Phase 52f — guaranteed per-act shilling income (the calibration input)', () => {
    // The ONLY live, deterministic shilling source on the authored maps today
    // is the flat `loot-cache` MapEvent kind (`resolveLootCache` grants
    // `payload.currency` with no RNG). The deep `World/Hazard` and
    // `World/Gathering` minigame packages have their own shilling economies,
    // but neither is wired to a fishing-village or northern-forest node (the
    // map-level 'hazard'/'gathering' kinds here resolve to flat damage /
    // items only — see `resolveHazard`/`resolveGathering`). Combat victory
    // grants XP + loot items but no currency
    // (`aftermath.engine.ts`'s `currency: null`). This test walks every
    // authored node on a full map completion and pins the guaranteed
    // shilling total the Phase 52f price derivation is anchored to — so a
    // future content edit that changes a loot-cache amount (or adds/removes
    // one) is forced to revisit the pricing constants instead of silently
    // drifting past them.
    it.each([
        ['fishing-village', 26],
        ['northern-forest', 18],
    ] as const)('%s grants exactly %d guaranteed shillings on a full walk', (map, expectedCurrency) => {
        mockSequentialRng(0.5);
        let state = freshWorldAt(map);
        const def = getMapDefinition('coastal-continent', map);
        for (const node of def.nodes) {
            state = visit(state, node.id).state;
        }
        expect(state.player.currency).toBe(expectedCurrency);
    });
});
