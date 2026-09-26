/**
 * Map registry (Spec 08 Q6).
 *
 * Keyed by `ContinentName` → `MapName` → `MapDefinition`. Adding a new
 * continent or map is a single-file change here plus the underlying
 * map-definition file. Consumers should reach a map via
 * `getMapDefinition(continent, mapName)` + `createMapState(def)`.
 */

import { MapDefinition, MapState, NodeId, UniqueEvent } from './types';
import { ContinentName, MapName } from './map.library';
import { fishingVillage, northernForest } from './Continents/Coastal-Village/maps';
import { breakwater } from './Continents/Coastal-Village/breakwater';
import { charcoalWood } from './Continents/Coastal-Village/charcoal-wood';
import { caverns, northernCity, connectingRiver, townAcrossRiver, theCapital } from './Continents/Northern-Continent/maps';
import { aporiaColonnade, aporiaArchive, aporiaProof } from './Labyrinth/maps';

/** Thrown when navigating to a map that isn't registered. */
export class MapNotFoundError extends Error {
    constructor(mapName: string, continent: string) {
        super(`Map "${mapName}" not found in ${continent}`);
        this.name = 'MapNotFoundError';
    }
}

/**
 * Continent-keyed map registry. `Partial` on the inner record so a continent
 * can be authored before every map under it ships.
 */
export const MAP_REGISTRY: Record<ContinentName, Partial<Record<MapName, MapDefinition>>> = {
    'coastal-continent': {
        // Map revamp M3a (D21, D28) — Act 1's coast, the new-game start (D27).
        'breakwater': breakwater,
        // Map revamp M3b — Act 1's forest, past the Breakwater's bridge.
        'charcoal-wood': charcoalWood,
        'fishing-village': fishingVillage,
        'northern-forest': northernForest,
    },
    // 2026-08-28 — inter-map travel: the iron caverns, first map of the
    // second continent, and (Phase W3, same day) the northern city behind
    // the Under-Gate. Phase W4 (2026-08-31) ships the river crossing and
    // the town beyond it.
    'northern-continent': {
        'caverns': caverns,
        'northern-city': northernCity,
        'connecting-river': connectingRiver,
        'town-across-river': townAcrossRiver,
        // W5 (2026-09-10) — the capital, where every ribbon-road ends.
        'the-capital': theCapital,
    },
    // W-01 — The Aporia (dev-menu + CLI access only until the last
    // continent exists; see specs/world/W-01).
    'labyrinth-continent': {
        'aporia-colonnade': aporiaColonnade,
        'aporia-archive': aporiaArchive,
        'aporia-proof': aporiaProof,
    },
};

/**
 * Returns the static `MapDefinition` for `(continent, mapName)`. Throws when
 * the pairing isn't registered — callers should treat that as a programming
 * error, not a runtime fallback.
 */
export function getMapDefinition(continent: ContinentName, mapName: MapName): MapDefinition {
    const def = MAP_REGISTRY[continent]?.[mapName];
    if (!def) throw new MapNotFoundError(mapName, continent);
    return def;
}

/**
 * Builds the initial runtime `MapState` for a map definition.
 *
 * The starting node is *not* listed in `availableNodes` — the player is
 * standing on it, and per Spec 08 Q2 completed nodes are locked from
 * back-travel, so it shouldn't be re-entered.
 */
export function createMapState(def: MapDefinition): MapState {
    const startId = def.startingNode.id;
    const adjacent = new Set<NodeId>(def.startingNode.connectedNodes);
    const available: NodeId[] = [];
    const locked: NodeId[] = [];
    for (const n of def.nodes) {
        if (n.id === startId) continue;
        if (adjacent.has(n.id)) available.push(n.id);
        else locked.push(n.id);
    }
    return {
        name: def.name,
        continent: def.continent,
        currentNode: startId,
        completedNodes: [],
        availableNodes: available,
        lockedNodes: locked,
        uniqueEvents: (def.uniqueEvents ?? []).map(ue => ({ ...ue }) as UniqueEvent),
        // Spec 23 — fog-of-war seeded with the starting node; nothing consumed yet.
        discoveredNodes: [startId],
        consumedNodes: [],
        // The player is PLACED on the starting node, never arrives at it, so
        // the map opens owing no arrival. The start node's own content is the
        // screen's `startNodePending` affair (2026-08-08 first-map audit).
        pendingArrival: null,
        // Phase 135 — hazard persistence extensions, initialized as empty.
        hazardOutcomes: [],
        // W-01 — secret doors / act gates arrive pre-blocked on labyrinth
        // maps; empty everywhere else.
        blockedRoutes: (def.initialBlockedRoutes ?? []).map(r => ({ ...r })),
    };
}

