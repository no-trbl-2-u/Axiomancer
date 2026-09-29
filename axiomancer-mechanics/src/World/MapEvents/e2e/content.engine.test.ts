/**
 * Hermetic e2e — Phase 24 content.
 *
 * Walks the Breakwater, northern-forest and parked northern pools authored in
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

type AuthoredMap = 'breakwater' | 'northern-forest' | 'caverns' | 'northern-city' | 'connecting-river' | 'town-across-river' | 'the-capital';

const CONTINENT_OF: Record<AuthoredMap, ContinentName> = {
    'breakwater': 'coastal-continent',
    'northern-forest': 'coastal-continent',
    'caverns': 'northern-continent',
    'northern-city': 'northern-continent',
    'connecting-river': 'northern-continent',
    'town-across-river': 'northern-continent',
    'the-capital': 'northern-continent',
};

function freshWorldAt(mapName: AuthoredMap): GameState {
    const base = { ...createNewGameState(), world: createStartingWorld('breakwater') };
    const def = getMapDefinition(CONTINENT_OF[mapName], mapName);
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
    // No Act 1 map carries a village/shop node — the surviving authored
    // shop lives on the parked northern-forest (nf-8, Glen Market).
    it('the authored village payload carries a shop inventory with consumable IDs that resolve', async () => {
        mockSequentialRng(0.5);
        const { getConsumableById } = await import('../../../Items/consumable.library');
        const { getRelicById } = await import('../../../Items/relic.library');
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
                // A ware is a consumable OR (since 2026-09-23, THE VERY START)
                // a signet relic sold by fixed id — the markets are where the
                // Phase-19 kit is bought now that a fresh run seeds none.
                const resolves = getConsumableById(ware.itemId) ?? getRelicById(ware.itemId);
                expect(resolves, `ware ${ware.itemId} must resolve in consumableLibrary or relicLibrary`).toBeDefined();
                expect(ware.price).toBeGreaterThanOrEqual(0);
            }
        }
    });
});

describe('caverns content (2026-08-28 — inter-map travel)', () => {
    // SKIP-ISSUE: #417
    it.skip('each authored node resolves to its declared MapEventKind — parked (D53)', () => {
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
            ['nc-26', 'travel'],      // Phase W3 — the door up to the city
        ];
        for (const [node, kind] of expected) {
            const r = visit(freshWorldAt('caverns'), node);
            expect(r.kind, `node ${node} should resolve to ${kind}`).toBe(kind);
        }
    });

    it('the Under-Gate boss is pinned to a winnable level (the Doorwarden since R2)', () => {
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
            expect(boss.name).toBe('The Doorwarden');
            expect(boss.level).toBe(6);
        }
    });

    // SKIP-ISSUE: #417
    it.skip('a wandering encounter draws from the caverns pool via the nc- prefix — parked (D53)', () => {
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

describe('northern-city content (Phase W3)', () => {
    // SKIP-ISSUE: #417
    it.skip('each authored node resolves to its declared MapEventKind — the urban spread — parked (D53)', () => {
        mockSequentialRng(0.5);
        const expected: Array<[string, string]> = [
            ['ncy-1',  'cutscene'],    // the arrival — up into lamplight
            ['ncy-2',  'interaction'], // the Gate-Clerk, the city's first face
            ['ncy-3',  'encounter'],
            ['ncy-4',  'rest'],        // The Scales — an INN
            ['ncy-5',  'narration'],   // the advisor rumor, the campaign seam
            ['ncy-6',  'village'],     // the Iron Market
            ['ncy-7',  'encounter'],
            ['ncy-8',  'encounter'],
            ['ncy-9',  'rest'],        // the Ferry Bell — pre-boss inn
            ['ncy-10', 'gathering'],   // ship-timber (the build-boat seam)
            ['ncy-11', 'hazard'],
            ['ncy-12', 'loot-cache'],
            ['ncy-13', 'loot-cache'],
            ['ncy-14', 'encounter'],
            ['ncy-15', 'cutscene'],    // the assize bell
            ['ncy-16', 'rest'],        // the Long Watch — an INN
            ['ncy-17', 'loot-cache'],
            ['ncy-18', 'gathering'],   // caulker's pitch
            ['ncy-19', 'village'],     // the Chandlery
            ['ncy-20', 'hazard'],
            ['ncy-21', 'interaction'], // the Shipwright
            ['ncy-22', 'encounter'],
            ['ncy-23', 'cutscene'],    // the sealed river-gate (still scenery)
            ['ncy-24', 'cutscene'],    // the drowned slip
            ['ncy-25', 'encounter'],   // the district boss (the Doorwarden since R2)
            ['ncy-26', 'travel'],      // Phase W4 — the door to connecting-river
        ];
        for (const [node, kind] of expected) {
            const r = visit(freshWorldAt('northern-city'), node);
            expect(r.kind, `node ${node} should resolve to ${kind}`).toBe(kind);
        }
    });

    it('every city rest is an INN — tended, paid, scar-mending (Phase 52b law)', () => {
        mockSequentialRng(0.5);
        for (const node of ['ncy-4', 'ncy-9', 'ncy-16'] as const) {
            const result = resolveMapEvent({
                ...freshWorldAt('northern-city'),
                world: {
                    ...freshWorldAt('northern-city').world,
                    currentMap: { ...freshWorldAt('northern-city').world.currentMap, currentNode: node, consumedNodes: [] },
                },
            });
            expect(result.event.kind).toBe('rest');
            if (result.event.kind === 'rest') {
                expect(result.event.shelter, `${node} should be an inn`).toBe('inn');
            }
        }
    });

    it('the district boss (the Doorwarden since R2) is pinned to a winnable level', () => {
        mockSequentialRng(0.5);
        const result = resolveMapEvent({
            ...freshWorldAt('northern-city'),
            world: {
                ...freshWorldAt('northern-city').world,
                currentMap: { ...freshWorldAt('northern-city').world.currentMap, currentNode: 'ncy-25', consumedNodes: [] },
            },
        });
        expect(result.event.kind).toBe('encounter');
        if (result.event.kind === 'encounter') {
            expect(result.event.isBoss).toBe(true);
            const boss = result.event.encounter.enemies[0];
            expect(boss.name).toBe('The Doorwarden');
            expect(boss.level).toBe(9);
        }
    });

    // SKIP-ISSUE: #417
    it.skip('a wandering encounter draws from the northern-city pool via the ncy- prefix — parked (D53)', () => {
        mockSequentialRng(0.5);
        const result = resolveMapEvent({
            ...freshWorldAt('northern-city'),
            world: {
                ...freshWorldAt('northern-city').world,
                currentMap: { ...freshWorldAt('northern-city').world.currentMap, currentNode: 'ncy-3', consumedNodes: [] },
            },
        });
        expect(result.event.kind).toBe('encounter');
        if (result.event.kind === 'encounter') {
            expect(result.event.isBoss).toBe(false);
            expect(result.event.encounter.origin).toBe('northern-city:ncy-3');
            expect(result.event.encounter.enemies).toHaveLength(1);
        }
    });

    it('the advisor rumor is a real three-way dilemma (the campaign seam)', () => {
        mockSequentialRng(0.5);
        const result = resolveMapEvent({
            ...freshWorldAt('northern-city'),
            world: {
                ...freshWorldAt('northern-city').world,
                currentMap: { ...freshWorldAt('northern-city').world.currentMap, currentNode: 'ncy-5', consumedNodes: [] },
            },
        });
        expect(result.event.kind).toBe('narration');
        if (result.event.kind === 'narration') {
            const tree = result.event.dialogue;
            expect(tree.id).toBe('ncy-advisor-rumor');
            const root = tree.nodes[tree.rootId];
            expect(root!.choices).toHaveLength(3);
            for (const choice of root!.choices!) {
                expect(choice.effect?.setFlag).toBeTruthy();
            }
        }
    });
});

describe('connecting-river content (Phase W4)', () => {
    // SKIP-ISSUE: #417
    it.skip('each authored node resolves to its declared MapEventKind — parked (D53)', () => {
        mockSequentialRng(0.5);
        const expected: Array<[string, string]> = [
            ['cr-1',  'cutscene'],     // the current takes the boat
            ['cr-2',  'interaction'],  // The Boatwoman, the crossing's premise
            ['cr-3',  'encounter'],
            ['cr-4',  'rest'],
            ['cr-5',  'gathering'],    // river reed
            ['cr-6',  'hazard'],
            ['cr-7',  'loot-cache'],
            ['cr-8',  'encounter'],
            ['cr-9',  'narration'],    // the river court — the ritual
            ['cr-10', 'village'],      // The Landing
            ['cr-11', 'encounter'],
            ['cr-12', 'encounter'],    // the river boss (the Doorwarden since R2)
            ['cr-13', 'travel'],       // the door to town-across-river
        ];
        for (const [node, kind] of expected) {
            const r = visit(freshWorldAt('connecting-river'), node);
            expect(r.kind, `node ${node} should resolve to ${kind}`).toBe(kind);
        }
    });

    it('the river boss (the Doorwarden since R2) is pinned to a winnable level', () => {
        mockSequentialRng(0.5);
        const result = resolveMapEvent({
            ...freshWorldAt('connecting-river'),
            world: {
                ...freshWorldAt('connecting-river').world,
                currentMap: { ...freshWorldAt('connecting-river').world.currentMap, currentNode: 'cr-12', consumedNodes: [] },
            },
        });
        expect(result.event.kind).toBe('encounter');
        if (result.event.kind === 'encounter') {
            expect(result.event.isBoss).toBe(true);
            const boss = result.event.encounter.enemies[0];
            expect(boss.name).toBe('The Doorwarden');
            expect(boss.level).toBe(10);
        }
    });

    // SKIP-ISSUE: #417
    it.skip('a wandering encounter draws from the connecting-river pool via the cr- prefix — parked (D53)', () => {
        mockSequentialRng(0.5);
        const result = resolveMapEvent({
            ...freshWorldAt('connecting-river'),
            world: {
                ...freshWorldAt('connecting-river').world,
                currentMap: { ...freshWorldAt('connecting-river').world.currentMap, currentNode: 'cr-3', consumedNodes: [] },
            },
        });
        expect(result.event.kind).toBe('encounter');
        if (result.event.kind === 'encounter') {
            expect(result.event.isBoss).toBe(false);
            expect(result.event.encounter.origin).toBe('connecting-river:cr-3');
            expect(result.event.encounter.enemies).toHaveLength(1);
        }
    });

    it('the river court reads the S-01 / ncy-5 flags for reactive branches and grants join-islanders-for-ritual', () => {
        mockSequentialRng(0.5);
        const result = resolveMapEvent({
            ...freshWorldAt('connecting-river'),
            world: {
                ...freshWorldAt('connecting-river').world,
                currentMap: { ...freshWorldAt('connecting-river').world.currentMap, currentNode: 'cr-9', consumedNodes: [] },
            },
        });
        expect(result.event.kind).toBe('narration');
        if (result.event.kind === 'narration') {
            const tree = result.event.dialogue;
            expect(tree.id).toBe('cr-river-court');
            const root = tree.nodes[tree.rootId];
            const reactive = root!.choices!.filter(c => c.requires?.flag);
            expect(reactive.map(c => c.requires!.flag).sort()).toEqual(
                ['boy-chased-the-rumor', 'boy-witnessed-the-crowning'].sort(),
            );
            const watch = root!.choices!.find(c => c.text === 'Watch.')!;
            expect(watch.effect?.startQuest).toBe('join-islanders-for-ritual');
        }
    });
});

describe('town-across-river content (Phase W4)', () => {
    // SKIP-ISSUE: #417
    it.skip('each authored node resolves to its declared MapEventKind — parked (D53)', () => {
        mockSequentialRng(0.5);
        const expected: Array<[string, string]> = [
            ['tar-1', 'cutscene'],    // arrival on the far bank
            ['tar-2', 'interaction'], // The Sweetheart
            ['tar-3', 'rest'],        // The Miller's Rest — an INN
            ['tar-4', 'narration'],   // the village court — the ritual, mirrored
            ['tar-5', 'encounter'],
            ['tar-6', 'encounter'],   // the town boss (the Doorwarden since R2)
        ];
        for (const [node, kind] of expected) {
            const r = visit(freshWorldAt('town-across-river'), node);
            expect(r.kind, `node ${node} should resolve to ${kind}`).toBe(kind);
        }
    });

    it('the town boss (the Doorwarden since R2) is pinned to a winnable level', () => {
        mockSequentialRng(0.5);
        const result = resolveMapEvent({
            ...freshWorldAt('town-across-river'),
            world: {
                ...freshWorldAt('town-across-river').world,
                currentMap: { ...freshWorldAt('town-across-river').world.currentMap, currentNode: 'tar-6', consumedNodes: [] },
            },
        });
        expect(result.event.kind).toBe('encounter');
        if (result.event.kind === 'encounter') {
            expect(result.event.isBoss).toBe(true);
            const boss = result.event.encounter.enemies[0];
            expect(boss.name).toBe('The Doorwarden');
            expect(boss.level).toBe(12);
        }
    });

    it('the village court mirrors the river court and reads its planted flag', () => {
        mockSequentialRng(0.5);
        const result = resolveMapEvent({
            ...freshWorldAt('town-across-river'),
            world: {
                ...freshWorldAt('town-across-river').world,
                currentMap: { ...freshWorldAt('town-across-river').world.currentMap, currentNode: 'tar-4', consumedNodes: [] },
            },
        });
        expect(result.event.kind).toBe('narration');
        if (result.event.kind === 'narration') {
            const tree = result.event.dialogue;
            expect(tree.id).toBe('tar-village-court');
            const root = tree.nodes[tree.rootId];
            const reactive = root!.choices!.find(c => c.requires?.flag === 'boy-witnessed-the-river-ritual');
            expect(reactive).toBeDefined();
        }
    });
});

describe('the capital — cap-5, The Ribbon-Picker (adjust-npcs pass 5)', () => {
    // The Capital (Phase W5) staged only The Herald; this pass adds The
    // Ribbon-Picker as a SECOND weighted `MapEventPoolEntry` on cap-5's
    // existing gathering pool rather than a new node. Only this node's own
    // behaviour is asserted here — a full per-node kind-tally for the rest
    // of the-capital's nine nodes is Phase W5's own untouched scope, not
    // this pass's.
    it('gathering keeps its weight-3 majority — the node\'s primary/icon kind', () => {
        mockSequentialRng(0.5);
        const r = visit(freshWorldAt('the-capital'), 'cap-5');
        expect(r.kind).toBe('gathering');
    });

    it('a high roll draws the weight-1 interaction entry and resolves The Ribbon-Picker\'s dialogue', () => {
        mockSequentialRng(0.9);
        const result = resolveMapEvent({
            ...freshWorldAt('the-capital'),
            world: {
                ...freshWorldAt('the-capital').world,
                currentMap: { ...freshWorldAt('the-capital').world.currentMap, currentNode: 'cap-5', consumedNodes: [] },
            },
        });
        expect(result.event.kind).toBe('interaction');
        if (result.event.kind === 'interaction') {
            expect(result.event.npcName).toBe('The Ribbon-Picker');
            expect(result.event.dialogue?.id).toBe('the-ribbon-picker');
        }
    });

    it('is rostered on the-capital alongside The Herald (clears the ≥2-staged-NPCs floor)', () => {
        const def = getMapDefinition('northern-continent', 'the-capital');
        expect(def.npcs?.map(n => n.name).sort()).toEqual(['The Herald', 'The Ribbon-Picker']);
    });

    it('the recognition branch is gated on the earlier sweetheart-was-nominated flag, hidden without it', () => {
        const def = getMapDefinition('northern-continent', 'the-capital');
        const picker = def.npcs!.find(n => n.name === 'The Ribbon-Picker')!;
        const tree = picker.dialogueTree!;
        const root = tree.nodes[tree.rootId]!;
        const reactive = root.choices!.find(c => c.requires?.flag === 'sweetheart-was-nominated');
        expect(reactive).toBeDefined();
        expect(reactive!.nextNodeId).toBe('recognized');
    });
});

describe('every MapEventKind is covered by the authored content', () => {
    it('each kind appears at least once across the maps that still fight', () => {
        mockSequentialRng(0.5);
        const kinds = new Set<string>();
        // THE REVAMP R3a: the northern continent is parked (D53), its pools
        // empty, so its wandering fights no longer resolve.
        for (const map of ['breakwater', 'northern-forest'] as const) {
            const def = getMapDefinition(CONTINENT_OF[map], map);
            for (const node of def.nodes) {
                // Fresh state per node — a threaded walk would cross a
                // travel door mid-loop and resolve the rest off-map.
                kinds.add(visit(freshWorldAt(map), node.id).kind);
            }
        }
        // The original eight kinds plus the three later additions —
        // 'narration' (nf-12 / nf-19), 'blacksmith' (Phase 60; the
        // Breakwater's Anvil at bw-16 since R3b), and 'travel' (bw-18 /
        // nf-10, 2026-08-28 inter-map travel). 'quest' was retired in
        // Phase 61 along with the Quest Board minigame it launched. The
        // Act 1 maps carry no NPC, village or narration node, so those
        // kinds come from the parked northern-forest.
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
    // but neither is wired to a Breakwater or northern-forest node (the
    // map-level 'hazard'/'gathering' kinds here resolve to flat damage /
    // items only — see `resolveHazard`/`resolveGathering`). Combat victory
    // grants XP + loot items but no currency
    // (`aftermath.engine.ts`'s `currency: null`). This test walks every
    // authored node on a full map completion and pins the guaranteed
    // shilling total the Phase 52f price derivation is anchored to — so a
    // future content edit that changes a loot-cache amount (or adds/removes
    // one) is forced to revisit the pricing constants instead of silently
    // drifting past them.
    const walk = (map: AuthoredMap, expectedCurrency: number) => {
        mockSequentialRng(0.5);
        let state = freshWorldAt(map);
        const def = getMapDefinition(CONTINENT_OF[map], map);
        for (const node of def.nodes) {
            // Skip the travel doors (bw-18 / nf-10, 2026-08-28): resolving
            // one moves the whole world to the destination map, and a door
            // grants no shillings anyway.
            if (getNodePrimaryEventKind(CONTINENT_OF[map], map, node.id) === 'travel') continue;
            state = visit(state, node.id).state;
        }
        expect(state.player.currency).toBe(expectedCurrency);
    };
    it.each([
        ['breakwater', 26],
        ['northern-forest', 18],
    ] as const)('%s grants exactly %d guaranteed shillings on a full walk', walk);
    // SKIP-ISSUE: #417
    it.skip.each([
        ['caverns', 35],
        // Phase W3 — city coin runs richer than cavern coin (16+12+14).
        ['northern-city', 42],
    ] as const)('%s grants exactly %d guaranteed shillings on a full walk — parked (D53)', walk);
});
