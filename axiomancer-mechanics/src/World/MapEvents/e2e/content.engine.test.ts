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
import { resolveMapEvent, getNodePrimaryEventKind } from '../resolve-map-event';
import { mockSequentialRng } from '../../../test-utils/rng';
import { createStartingWorld } from '../../index';
import { createNewGameState } from '../../../Game/game.reducer';
import { getMapDefinition } from '../../map.registry';
import { createMapState } from '../../map.registry';
import type { GameState } from '../../../Game/types';
import type { MapState } from '../../types';
import type { ContinentName } from '../../map.library';
// Import for side effect — registers the pools when the test loads.
import '../content';

type AuthoredMap = 'fishing-village' | 'northern-forest' | 'caverns';

const CONTINENT_OF: Record<AuthoredMap, ContinentName> = {
    'fishing-village': 'coastal-continent',
    'northern-forest': 'coastal-continent',
    'caverns': 'northern-continent',
};

function freshWorldAt(mapName: AuthoredMap): GameState {
    const base = { ...createNewGameState(), world: createStartingWorld() };
    const def = getMapDefinition(CONTINENT_OF[mapName], mapName);
    const map: MapState = createMapState(def);
    return { ...base, world: { ...base.world, currentMap: map } };
}

/**
 * Walks every authored node on `mapName` from a FRESH state each visit and
 * tallies the resolved kinds. Fresh-per-node matters since the travel kind
 * landed (2026-08-28): resolving a door node moves the whole world to the
 * destination map, so a threaded walk would resolve every later node
 * against the wrong map.
 */
function kindTally(mapName: AuthoredMap): Record<string, number> {
    const def = getMapDefinition(CONTINENT_OF[mapName], mapName);
    const counts: Record<string, number> = {};
    for (const node of def.nodes) {
        const r = visit(freshWorldAt(mapName), node.id);
        counts[r.kind] = (counts[r.kind] ?? 0) + 1;
    }
    return counts;
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
        const counts = kindTally('fishing-village');

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
        // roster as foot-stealer. 2026-08-28 (inter-map travel): fv-10, the
        // terminal-column barnacle hazard, became the coast-road DOOR to
        // northern-forest — hazard drops 2 → 1, travel appears at 1.
        expect(counts.encounter).toBe(4);
        expect(counts.cutscene).toBe(1);
        expect(counts.rest).toBe(4);
        expect(counts.gathering).toBe(3);
        expect(counts.hazard).toBe(1);
        expect(counts.travel).toBe(1);
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
            // 2026-08-28 — the cave mouth is the DOOR to the caverns now
            // (formerly a cutscene describing a cave nobody could enter).
            // Last in this list on purpose: resolving it moves the world.
            ['nf-10', 'travel'],
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

describe('caverns content (2026-08-28 — inter-map travel)', () => {
    it('each authored node resolves to its declared MapEventKind', () => {
        mockSequentialRng(0.5);
        const expected: Array<[string, string]> = [
            ['nc-1',  'cutscene'],    // the arrival — the dark takes you in
            ['nc-2',  'interaction'], // The Delver, the quest-giver singleton
            ['nc-3',  'encounter'],
            ['nc-4',  'rest'],
            ['nc-5',  'encounter'],
            ['nc-6',  'village'],     // the Ledger Camp — the continent's shop
            ['nc-7',  'encounter'],
            ['nc-8',  'encounter'],
            ['nc-9',  'rest'],
            ['nc-10', 'gathering'],   // the iron seam
            ['nc-11', 'gathering'],
            ['nc-12', 'loot-cache'],
            ['nc-13', 'encounter'],
            ['nc-14', 'loot-cache'],
            ['nc-15', 'encounter'],
            ['nc-16', 'cutscene'],    // the sealed stair toward northern-city
            ['nc-17', 'hazard'],
            ['nc-18', 'encounter'],
            ['nc-19', 'gathering'],
            ['nc-20', 'hazard'],
            ['nc-21', 'rest'],
            ['nc-22', 'hazard'],
            ['nc-23', 'loot-cache'],
            ['nc-24', 'cutscene'],    // the bones of an older delve
            ['nc-25', 'encounter'],   // the Under-Gate boss
        ];
        for (const [node, kind] of expected) {
            const r = visit(freshWorldAt('caverns'), node);
            expect(r.kind, `node ${node} should resolve to ${kind}`).toBe(kind);
        }
    });

    it('the Under-Gate boss is pinned to a winnable level (rawhead-rex is L25 elsewhere)', () => {
        mockSequentialRng(0.5);
        const result = resolveMapEvent({
            ...freshWorldAt('caverns'),
            world: {
                ...freshWorldAt('caverns').world,
                currentMap: { ...freshWorldAt('caverns').world.currentMap, currentNode: 'nc-25', consumedNodes: [] },
            },
        });
        expect(result.event.kind).toBe('encounter');
        if (result.event.kind === 'encounter') {
            expect(result.event.isBoss).toBe(true);
            const boss = result.event.encounter.enemies[0];
            expect(boss.name).toBe('Rawhead Rex');
            expect(boss.level).toBe(6);
        }
    });

    it('a wandering encounter draws from the caverns pool via the nc- prefix', () => {
        mockSequentialRng(0.5);
        const result = resolveMapEvent({
            ...freshWorldAt('caverns'),
            world: {
                ...freshWorldAt('caverns').world,
                currentMap: { ...freshWorldAt('caverns').world.currentMap, currentNode: 'nc-3', consumedNodes: [] },
            },
        });
        expect(result.event.kind).toBe('encounter');
        if (result.event.kind === 'encounter') {
            expect(result.event.isBoss).toBe(false);
            expect(result.event.encounter.origin).toBe('caverns:nc-3');
            expect(result.event.encounter.enemies).toHaveLength(1);
        }
    });
});

describe('every MapEventKind is covered by the authored content', () => {
    it('each kind appears at least once across the three maps', () => {
        mockSequentialRng(0.5);
        const kinds = new Set<string>();
        for (const map of ['fishing-village', 'northern-forest', 'caverns'] as const) {
            const def = getMapDefinition(CONTINENT_OF[map], map);
            for (const node of def.nodes) {
                // Fresh state per node — a threaded walk would cross a
                // travel door mid-loop and resolve the rest off-map.
                kinds.add(visit(freshWorldAt(map), node.id).kind);
            }
        }
        // The original eight kinds plus the three later additions —
        // 'narration' (fv-14), 'blacksmith' (fv-21, Phase 60), and
        // 'travel' (fv-10 / nf-10, 2026-08-28 inter-map travel). 'quest'
        // (fv-15) was retired in Phase 61 along with the Quest Board
        // minigame it launched.
        const required = [
            'encounter', 'interaction', 'gathering', 'rest',
            'village', 'cutscene', 'hazard', 'loot-cache',
            'narration', 'blacksmith', 'travel',
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
        ['caverns', 35],
    ] as const)('%s grants exactly %d guaranteed shillings on a full walk', (map, expectedCurrency) => {
        mockSequentialRng(0.5);
        let state = freshWorldAt(map);
        const def = getMapDefinition(CONTINENT_OF[map], map);
        for (const node of def.nodes) {
            // Skip the travel doors (fv-10 / nf-10, 2026-08-28): resolving
            // one moves the whole world to the destination map, and a door
            // grants no shillings anyway.
            if (getNodePrimaryEventKind(CONTINENT_OF[map], map, node.id) === 'travel') continue;
            state = visit(state, node.id).state;
        }
        expect(state.player.currency).toBe(expectedCurrency);
    });
});
