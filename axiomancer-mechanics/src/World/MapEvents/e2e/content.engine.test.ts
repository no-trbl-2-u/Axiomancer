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

type AuthoredMap = 'fishing-village' | 'northern-forest' | 'caverns' | 'northern-city' | 'connecting-river' | 'town-across-river' | 'the-capital';

const CONTINENT_OF: Record<AuthoredMap, ContinentName> = {
    'fishing-village': 'coastal-continent',
    'northern-forest': 'coastal-continent',
    'caverns': 'northern-continent',
    'northern-city': 'northern-continent',
    'connecting-river': 'northern-continent',
    'town-across-river': 'northern-continent',
    'the-capital': 'northern-continent',
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

    // Phase 87 — the two CRITIQUE rows that proposed this phase (an elite,
    // multi-phase Brine Hag as a fresh save's first fight; the Ash Mire
    // boss reachable with zero prior encounters) were independently
    // re-verified RESOLVED-STALE on 2026-09-10 (`plan/CRITIQUE.md`,
    // `plan/AUDIT.md`): the Phase 53c/60/61 gauntlet rebuild already fixed
    // both before this phase was promoted. These tests convert the
    // now-true-by-accident invariants into a tested contract so a future
    // content pass can't silently reintroduce either bug.
    it('keeps every pre-boss combat foe non-elite, zero-keyword, and single-phase', () => {
        mockSequentialRng(0.5);
        const preBossEncounterNodes = ['fv-13', 'fv-15']; // little-belle, foot-stealer
        for (const nodeId of preBossEncounterNodes) {
            const state = freshWorldAt('fishing-village');
            const result = resolveMapEvent({
                ...state,
                world: { ...state.world, currentMap: { ...state.world.currentMap, currentNode: nodeId, consumedNodes: [] } },
            });
            expect(result.event.kind).toBe('encounter');
            if (result.event.kind === 'encounter') {
                const foe = result.event.encounter.enemies[0];
                expect(foe.difficulty, `${nodeId}'s foe (${foe.name}) must not be elite/boss`).toBe('normal');
                expect(foe.keywords, `${nodeId}'s foe (${foe.name}) must carry no keywords`).toEqual([]);
                expect(foe.stages, `${nodeId}'s foe (${foe.name}) must be single-phase`).toEqual([]);
            }
        }
    });

    it('never assigns Brine Hag (or any elite) to a fishing-village node', () => {
        // Brine Hag stays in `EnemiesByMap['fishing-village']` (Enemy/index.ts)
        // but every node's event pool carries an explicit pinned `enemySlug`
        // (content.ts) — the map's own random-draw branch is unreachable, so
        // she should never appear at any node, pre-boss or otherwise.
        mockSequentialRng(0.5);
        const def = getMapDefinition('coastal-continent', 'fishing-village');
        for (const node of def.nodes) {
            const state = freshWorldAt('fishing-village');
            const result = resolveMapEvent({
                ...state,
                world: { ...state.world, currentMap: { ...state.world.currentMap, currentNode: node.id, consumedNodes: [] } },
            });
            if (result.event.kind === 'encounter') {
                expect(result.event.encounter.enemies[0].name).not.toBe('Brine Hag');
                if (!result.event.isBoss) {
                    expect(result.event.encounter.enemies[0].difficulty).not.toBe('elite');
                }
            }
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
            ['nc-26', 'travel'],      // Phase W3 — the door up to the city
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

describe('northern-city content (Phase W3)', () => {
    it('each authored node resolves to its declared MapEventKind — the urban spread', () => {
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
            ['ncy-25', 'encounter'],   // the Harbormaster boss
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

    it('the Harbormaster is pinned to a winnable level (he is L18 in the library)', () => {
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
            expect(boss.name).toBe('The Harbormaster');
            expect(boss.level).toBe(9);
        }
    });

    it('a wandering encounter draws from the northern-city pool via the ncy- prefix', () => {
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
    it('each authored node resolves to its declared MapEventKind', () => {
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
            ['cr-12', 'encounter'],    // the Waterreeve boss
            ['cr-13', 'travel'],       // the door to town-across-river
        ];
        for (const [node, kind] of expected) {
            const r = visit(freshWorldAt('connecting-river'), node);
            expect(r.kind, `node ${node} should resolve to ${kind}`).toBe(kind);
        }
    });

    it('the Waterreeve is pinned to a winnable level', () => {
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
            expect(boss.name).toBe('The Waterreeve');
            expect(boss.level).toBe(10);
        }
    });

    it('a wandering encounter draws from the connecting-river pool via the cr- prefix', () => {
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
    it('each authored node resolves to its declared MapEventKind', () => {
        mockSequentialRng(0.5);
        const expected: Array<[string, string]> = [
            ['tar-1', 'cutscene'],    // arrival on the far bank
            ['tar-2', 'interaction'], // The Sweetheart
            ['tar-3', 'rest'],        // The Miller's Rest — an INN
            ['tar-4', 'narration'],   // the village court — the ritual, mirrored
            ['tar-5', 'encounter'],
            ['tar-6', 'encounter'],   // the Portreeve boss
        ];
        for (const [node, kind] of expected) {
            const r = visit(freshWorldAt('town-across-river'), node);
            expect(r.kind, `node ${node} should resolve to ${kind}`).toBe(kind);
        }
    });

    it('the Portreeve is pinned to a winnable level', () => {
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
            expect(boss.name).toBe('The Portreeve');
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
    it('each kind appears at least once across the six maps', () => {
        mockSequentialRng(0.5);
        const kinds = new Set<string>();
        for (const map of ['fishing-village', 'northern-forest', 'caverns', 'northern-city', 'connecting-river', 'town-across-river'] as const) {
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
        // Phase W3 — city coin runs richer than cavern coin (16+12+14).
        ['northern-city', 42],
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
