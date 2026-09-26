/**
 * Hermetic e2e — Phase 52b: the inn is a first-class thing.
 *
 * "Is this an inn?" used to mean `healFraction >= 1.0`. Three wilderness
 * rest nodes were authored at 1.0 (`nf-4` cold spring, `nf-24` hidden
 * grove, and the labyrinth's own generosity band never reached it), so
 * forest springs mended hazard-scarred max-VITAE exactly like a paid
 * shelter. `RestPayload.shelter` replaces the inference.
 *
 * This suite is the regression pin: EVERY authored rest pool in the game
 * is enumerated from the live registry and its shelter asserted by name.
 * If someone re-authors a spring as an inn (or forgets the marker on a
 * new node), this fails.
 *
 * Hermetic: registry-only reads plus one seeded `resolveMapEvent`; no
 * disk, network, or TTY. RNG stubbed via `src/test-utils/rng.ts`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
    _clearMapEventPoolRegistry,
    getNodeEventPool,
    registerMapEventPool,
    setNodeEventPoolOverride,
    resolveMapEvent,
} from '../resolve-map-event';
import { registerMapEventContent } from '../content';
import {
    registerAporiaEventPools,
    _resetAporiaEventPoolRegistration,
} from '../../Labyrinth/labyrinth.pools';
import { MAP_REGISTRY } from '../../map.registry';
import { resolveRest } from '../handlers';
import {
    DEFAULT_REST_SHELTER,
    REST_PASSIVE_HEAL_FRACTION,
    isInnShelter,
    restShelterOf,
} from '../rest-shelter';
import type { ContinentName, MapName } from '../../map.library';
import type { MapEventPool, RestPayload, RestShelter } from '../types';
import { createNewGameState } from '../../../Game/game.reducer';
import type { GameState } from '../../../Game/types';
import { mockSequentialRng } from '../../../test-utils/rng';

/** `<continent>:<map>:<node>` → the shelter each rest entry authors. */
type ShelterCensus = Record<string, RestShelter[]>;

function censusOfAuthoredRestPools(): ShelterCensus {
    const census: ShelterCensus = {};
    for (const continent of Object.keys(MAP_REGISTRY) as ContinentName[]) {
        for (const mapName of Object.keys(MAP_REGISTRY[continent]) as MapName[]) {
            const def = MAP_REGISTRY[continent][mapName];
            if (!def) continue;
            for (const node of def.nodes) {
                const pool = getNodeEventPool(continent, mapName, node.id);
                if (!pool) continue;
                const shelters = pool.entries
                    .filter(e => e.payload.kind === 'rest')
                    .map(e => restShelterOf(e.payload as RestPayload));
                if (shelters.length > 0) census[`${continent}:${mapName}:${node.id}`] = shelters;
            }
        }
    }
    return census;
}

/** Every rest payload authored anywhere in the live registry. */
function authoredRestPayloads(): RestPayload[] {
    const seen = new Set<MapEventPool>();
    const out: RestPayload[] = [];
    for (const continent of Object.keys(MAP_REGISTRY) as ContinentName[]) {
        for (const mapName of Object.keys(MAP_REGISTRY[continent]) as MapName[]) {
            const def = MAP_REGISTRY[continent][mapName];
            if (!def) continue;
            for (const node of def.nodes) {
                const pool = getNodeEventPool(continent, mapName, node.id);
                if (!pool || seen.has(pool)) continue;
                seen.add(pool);
                for (const entry of pool.entries) {
                    if (entry.payload.kind === 'rest') out.push(entry.payload);
                }
            }
        }
    }
    return out;
}

beforeEach(() => {
    _clearMapEventPoolRegistry();
    registerMapEventContent();
    _resetAporiaEventPoolRegistration();
    registerAporiaEventPools();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Phase 52b — RestPayload.shelter is authored, never inferred', () => {
    it("defaults to 'camp' when a node forgets to say", () => {
        expect(DEFAULT_REST_SHELTER).toBe('camp');
        expect(restShelterOf({ kind: 'rest' })).toBe('camp');
        expect(restShelterOf({ kind: 'rest', description: 'silent' })).toBe('camp');
    });

    it('only an inn passes the inn test', () => {
        expect(isInnShelter('inn')).toBe(true);
        expect(isInnShelter('camp')).toBe(false);
    });

    it('no authored rest payload carries a heal number any more (healFraction is retired)', () => {
        const payloads = authoredRestPayloads();
        expect(payloads.length).toBeGreaterThan(0);
        for (const p of payloads) {
            expect(Object.keys(p)).not.toContain('healFraction');
        }
    });
});

describe('Phase 52b — the shelter classification of every authored rest pool', () => {
    it('pins the fishing-village inns', () => {
        const census = censusOfAuthoredRestPools();
        // fv-3 / fv-9 / fv-20 / fv-25 are `fvRestPool(...)` — the game's inns.
        for (const nodeId of ['fv-3', 'fv-9', 'fv-20', 'fv-25']) {
            expect(
                census[`coastal-continent:fishing-village:${nodeId}`],
                `${nodeId} must be an inn (fvRestPool)`,
            ).toEqual(['inn']);
        }
    });

    it('pins the three wilderness nodes that the 1.0 heuristic wrongly called inns', () => {
        const census = censusOfAuthoredRestPools();
        // nf-4 (cold spring) and nf-24 (hidden grove) were authored at
        // healFraction 1.0 and therefore mended hazard scars for free.
        expect(
            census['coastal-continent:northern-forest:nf-4'],
            'nf-4 cold spring is wilderness, not a paid shelter',
        ).toEqual(['camp']);
        expect(
            census['coastal-continent:northern-forest:nf-24'],
            'nf-24 hidden grove is wilderness, not a paid shelter',
        ).toEqual(['camp']);
        // nf-11 (mossy clearing) was at 0.75 — already not inn-grade, but it
        // is pinned here so the whole northern-forest rest set is covered.
        expect(
            census['coastal-continent:northern-forest:nf-11'],
            'nf-11 mossy clearing is a camp',
        ).toEqual(['camp']);
    });

    it('pins both labyrinth rest entries as camps', () => {
        const census = censusOfAuthoredRestPools();
        // The act default pool ("a corner the house forgot to make
        // uncomfortable") and the waystone override are both camps — the
        // house is not an innkeeper.
        const labyrinthShelters = Object.entries(census)
            .filter(([key]) => key.startsWith('labyrinth-continent:'))
            .flatMap(([, shelters]) => shelters);
        expect(labyrinthShelters.length).toBeGreaterThan(0);
        expect(new Set(labyrinthShelters)).toEqual(new Set<RestShelter>(['camp']));
    });

    it('the ONLY inns in the game are inside settlements: the Breakwater, fishing-village, the northern city, town-across-river, and the capital', () => {
        // Phase W3 — the northern city is the second SETTLEMENT with
        // tended, paid beds: its three rests are inns by the same 52b law
        // that made the village's four inns and every wilderness rest a
        // camp. Phase W4 — town-across-river is the third: a proper town,
        // one inn (The Miller's Rest). Phase W5 — the-capital is the
        // fourth: one inn (The Waiting Room). Everything else — including
        // connecting-river, wild again after the city — still only camps.
        // Map revamp M3a — the Breakwater is a walled harbour town: its
        // customs house and harbour inn are inns, its windmill a camp.
        const census = censusOfAuthoredRestPools();
        const innKeys = Object.entries(census)
            .filter(([, shelters]) => shelters.includes('inn'))
            .map(([key]) => key)
            .sort();
        expect(innKeys).toEqual([
            'coastal-continent:breakwater:bw-13',
            'coastal-continent:breakwater:bw-9',
            'coastal-continent:fishing-village:fv-20',
            'coastal-continent:fishing-village:fv-25',
            'coastal-continent:fishing-village:fv-3',
            'coastal-continent:fishing-village:fv-9',
            'northern-continent:northern-city:ncy-16',
            'northern-continent:northern-city:ncy-4',
            'northern-continent:northern-city:ncy-9',
            'northern-continent:the-capital:cap-4',
            'northern-continent:town-across-river:tar-3',
        ].sort());
    });
});

describe('Phase 52b — the resolved rest event carries the shelter', () => {
    function stateAtNode(nodeId: string): GameState {
        const base = createNewGameState();
        return {
            ...base,
            player: { ...base.player, health: 1 },
            world: {
                ...base.world,
                currentMap: {
                    ...base.world.currentMap,
                    continent: 'coastal-continent',
                    name: 'fishing-village',
                    currentNode: nodeId,
                },
            },
        } as GameState;
    }

    it('an inn node resolves with shelter inn', () => {
        mockSequentialRng(0.5);
        const result = resolveMapEvent(stateAtNode('fv-3'));
        expect(result.event.kind).toBe('rest');
        if (result.event.kind === 'rest') {
            expect(result.event.shelter).toBe('inn');
        }
    });

    it('a pool that omits the marker resolves with shelter camp', () => {
        mockSequentialRng(0.5);
        const pool: MapEventPool = {
            id: 'phase52b-unmarked-rest',
            entries: [{ kind: 'rest', weight: 1, payload: { kind: 'rest' } }],
        };
        registerMapEventPool(pool);
        setNodeEventPoolOverride('coastal-continent', 'fishing-village', 'fv-3', pool.id);

        const result = resolveMapEvent(stateAtNode('fv-3'));
        expect(result.event.kind).toBe('rest');
        if (result.event.kind === 'rest') {
            expect(result.event.shelter).toBe('camp');
        }
    });

    it('the passive heal runs at the carried-forward shipped default for both shelters', () => {
        // Phase 52b changes NO heal numbers: the retired `healFraction`
        // defaulted to 1.0 and that value is carried forward verbatim until
        // 52c derives the heal from `shelter`.
        expect(REST_PASSIVE_HEAL_FRACTION).toBe(1.0);

        const base = createNewGameState();
        const damaged = { ...base, player: { ...base.player, health: 1 } } as GameState;
        const max = damaged.player.maxHealth;

        const camp = resolveRest(damaged, { kind: 'rest', shelter: 'camp' });
        const inn = resolveRest(damaged, { kind: 'rest', shelter: 'inn' });

        expect(camp.event).toEqual({ kind: 'rest', healed: max - 1, shelter: 'camp' });
        expect(inn.event).toEqual({ kind: 'rest', healed: max - 1, shelter: 'inn' });
        expect(camp.state.player.health).toBe(max);
        expect(inn.state.player.health).toBe(max);
    });
});
