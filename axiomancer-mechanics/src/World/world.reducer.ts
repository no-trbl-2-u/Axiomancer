/**
 * World reducer — pure transitions over WorldState. Idempotent where it
 * makes sense (locking/unlocking, completing).
 */

import { WorldState, MapState, MapNode, NodeId, HazardNodeOutcome } from './types';
import { MapName, ContinentName } from './map.library';
import { getMapDefinition } from './map.registry';

// ── Map navigation ──────────────────────────────────────────────────────────

/** Sets the current map. Caller resolves the MapState from the registry. */
export function changeMap(state: WorldState, map: MapState): WorldState {
    return { ...state, currentMap: map };
}

// ── Node movement (Spec 08 Q2) ──────────────────────────────────────────────

/** Thrown by `moveToNode` when the requested transition is illegal. */
export class IllegalMoveError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IllegalMoveError';
    }
}

/** Lookup a node on the current map's definition. */
function findNode(map: MapState, nodeId: NodeId): MapNode | undefined {
    const def = getMapDefinition(map.continent, map.name);
    return def.nodes.find(n => n.id === nodeId);
}

/**
 * Moves the player to `nodeId` on the current map. Pure WorldState reducer.
 *
 * Validation (Spec 08 Q2 — option B with completed-node locking):
 *   1. The destination must be a real node on the map.
 *   2. The destination must be in the *current* node's `connectedNodes`
 *      (linear adjacency).
 *   3. Completed nodes are locked from re-entry — no back-travel.
 *   4. The destination must not be in `lockedNodes`.
 *
 * Hazard ticking (Spec 08 Q3 — each `moveToNode` call) is performed by the
 * higher-level orchestrator in `Game/world.orchestrator.ts`, since the world
 * reducer is purely WorldState-shaped and the player lives at the
 * `GameState` level.
 */
export function moveToNode(state: WorldState, nodeId: NodeId): WorldState {
    const map = state.currentMap;
    if (map.currentNode === nodeId) {
        // Idempotent on no-op (already here).
        return state;
    }
    const currentNode = findNode(map, map.currentNode);
    if (!currentNode) {
        throw new IllegalMoveError(`moveToNode: current node '${map.currentNode}' is unknown on map '${map.name}'.`);
    }
    if (!currentNode.connectedNodes.includes(nodeId)) {
        throw new IllegalMoveError(`moveToNode: '${nodeId}' is not adjacent to '${map.currentNode}'.`);
    }
    if (map.completedNodes.includes(nodeId)) {
        throw new IllegalMoveError(`moveToNode: '${nodeId}' is already completed — back-travel is not permitted.`);
    }
    if (map.lockedNodes.includes(nodeId)) {
        throw new IllegalMoveError(`moveToNode: '${nodeId}' is locked.`);
    }
    const blockedRoute = map.blockedRoutes.find(
        route => (route.from === map.currentNode && route.to === nodeId) ||
                 (route.from === nodeId && route.to === map.currentNode)
    );
    if (blockedRoute) {
        throw new IllegalMoveError(`moveToNode: route from '${map.currentNode}' to '${nodeId}' is blocked — ${blockedRoute.reason}`);
    }
    return {
        ...state,
        currentMap: { ...map, currentNode: nodeId },
    };
}

/**
 * Completes the current node and unlocks every `connectedNode` that isn't
 * already completed. Idempotent on completed nodes. Used by the world
 * orchestrator after a node event resolves successfully.
 */
export function completeCurrentNode(state: WorldState): WorldState {
    const map = state.currentMap;
    const nodeId = map.currentNode;
    if (map.completedNodes.includes(nodeId)) return state;

    const node = findNode(map, nodeId);
    const unlocks = node?.connectedNodes ?? [];

    const newLocked = map.lockedNodes.filter(n => !unlocks.includes(n));
    const newlyAvailable = unlocks.filter(
        n => !map.completedNodes.includes(n) && !map.availableNodes.includes(n),
    );
    return {
        ...state,
        currentMap: {
            ...map,
            completedNodes: [...map.completedNodes, nodeId],
            availableNodes: [...map.availableNodes, ...newlyAvailable],
            lockedNodes: newLocked,
        },
    };
}

/** Marks a map as completed on the current continent. Idempotent. */
export function completeMap(state: WorldState, mapName: MapName): WorldState {
    const continent = state.currentContinent;
    if (continent.completedMaps.includes(mapName)) return state;
    return {
        ...state,
        currentContinent: {
            ...continent,
            completedMaps: [...continent.completedMaps, mapName],
        },
    };
}

/** Moves a map from `lockedMaps` to `availableMaps`. Idempotent. */
export function unlockMap(state: WorldState, mapName: MapName): WorldState {
    const continent = state.currentContinent;
    if (continent.availableMaps.includes(mapName)) return state;
    return {
        ...state,
        currentContinent: {
            ...continent,
            lockedMaps: continent.lockedMaps.filter(m => m !== mapName),
            availableMaps: [...continent.availableMaps, mapName],
        },
    };
}

// ── Node progression ────────────────────────────────────────────────────────

/** Marks a node as completed on the current map. Idempotent. */
export function completeNode(state: WorldState, nodeId: string): WorldState {
    const map = state.currentMap;
    if (map.completedNodes.includes(nodeId)) return state;
    return {
        ...state,
        currentMap: {
            ...map,
            completedNodes: [...map.completedNodes, nodeId],
        },
    };
}

/** Moves a node from `lockedNodes` to `availableNodes`. Idempotent. */
export function unlockNode(state: WorldState, nodeId: string): WorldState {
    const map = state.currentMap;
    if (map.availableNodes.includes(nodeId)) return state;
    return {
        ...state,
        currentMap: {
            ...map,
            lockedNodes: map.lockedNodes.filter(n => n !== nodeId),
            availableNodes: [...map.availableNodes, nodeId],
        },
    };
}

// ── Continent navigation ────────────────────────────────────────────────────

/** Switches to the named continent. No-op when the name is not in `state.world`. */
export function changeContinent(state: WorldState, continentName: ContinentName): WorldState {
    const continent = state.world.find(c => c.name === continentName);
    if (!continent) return state;
    return { ...state, currentContinent: continent };
}

// ── Event management ────────────────────────────────────────────────────────

/** Marks a unique event as completed on the current map. */
export function completeUniqueEvent(state: WorldState, eventId: string): WorldState {
    return {
        ...state,
        currentMap: {
            ...state.currentMap,
            uniqueEvents: state.currentMap.uniqueEvents.map(e =>
                e.id === eventId ? { ...e, completed: true } : e,
            ),
        },
    };
}

// ── Spec 23: fog-of-war discovery + one-shot consumption ────────────────────

/**
 * Reveals every node adjacent to `nodeId` on the current map. Idempotent —
 * nodes already in `discoveredNodes` are left in place. Looks up the
 * static `MapDefinition` to resolve adjacency.
 */
export function revealAdjacent(state: MapState, nodeId: NodeId): MapState {
    const def = getMapDefinition(state.continent, state.name);
    const node = def.nodes.find(n => n.id === nodeId);
    if (!node) return state;
    const already = new Set<NodeId>(state.discoveredNodes);
    let changed = false;
    const next = [...state.discoveredNodes];
    for (const adj of node.connectedNodes) {
        if (!already.has(adj)) {
            next.push(adj);
            already.add(adj);
            changed = true;
        }
    }
    return changed ? { ...state, discoveredNodes: next } : state;
}

/**
 * Marks a node as consumed. Idempotent — re-marking is a no-op. Used by
 * `resolveMapEvent` to enforce the one-shot contract: a consumed node's
 * MapEvent never resolves again.
 */
export function markNodeConsumed(state: MapState, nodeId: NodeId): MapState {
    if (state.consumedNodes.includes(nodeId)) return state;
    return { ...state, consumedNodes: [...state.consumedNodes, nodeId] };
}

/**
 * Moves every node adjacent to `nodeId` out of `lockedNodes` and into
 * `availableNodes` (per Phase 31 — the legacy `completeCurrentNode` path
 * did this, but Spec 23's `revealAdjacent` only updated `discoveredNodes`,
 * leaving the player stuck at the first map event). Idempotent. Looks up
 * the static `MapDefinition` to resolve adjacency.
 */
export function unlockAdjacent(state: MapState, nodeId: NodeId): MapState {
    const def = getMapDefinition(state.continent, state.name);
    const node = def.nodes.find(n => n.id === nodeId);
    if (!node) return state;
    const adjacents = node.connectedNodes;
    if (adjacents.length === 0) return state;

    const availableSet = new Set<NodeId>(state.availableNodes);
    const newlyAvailable: NodeId[] = [];
    const stillLocked: NodeId[] = [];

    for (const id of state.lockedNodes) {
        if (adjacents.includes(id) && !availableSet.has(id)) {
            newlyAvailable.push(id);
        } else {
            stillLocked.push(id);
        }
    }
    // Also handle the case where an adjacent isn't in lockedNodes but isn't
    // yet in availableNodes (e.g. a sibling map was authored without
    // strict locked-list seeding).
    for (const id of adjacents) {
        if (!availableSet.has(id) && !newlyAvailable.includes(id)) {
            // Was it in lockedNodes already? If so it's in newlyAvailable above.
            // If not, it's neither locked nor available — promote it.
            if (!state.lockedNodes.includes(id)) {
                newlyAvailable.push(id);
            }
        }
    }

    if (newlyAvailable.length === 0) return state;

    return {
        ...state,
        availableNodes: [...state.availableNodes, ...newlyAvailable],
        lockedNodes: stillLocked,
    };
}

// ── Hazard Persistence (Phase 135) ─────────────────────────────────────────

/**
 * Records a persistent hazard outcome for a specific node. Used by hazard 
 * cards H08, H12, H15 to emit world-state modifications that affect future 
 * encounters. Idempotent — overwrites existing outcome for same hazardId/nodeId.
 */
export function recordHazardOutcome(state: MapState, outcome: HazardNodeOutcome): MapState {
    const existing = state.hazardOutcomes.filter(
        h => !(h.nodeId === outcome.nodeId && h.hazardId === outcome.hazardId)
    );
    return {
        ...state,
        hazardOutcomes: [...existing, outcome]
    };
}

/**
 * Blocks a bidirectional route between two nodes. Used by H12 "Riddled Bridge" 
 * final round failure to prevent passage. Idempotent — overwrites existing 
 * block for same route pair.
 */
export function blockMapRoute(state: MapState, from: NodeId, to: NodeId, reason: string): MapState {
    const existing = state.blockedRoutes.filter(
        route => !((route.from === from && route.to === to) || 
                   (route.from === to && route.to === from))
    );
    return {
        ...state,
        blockedRoutes: [...existing, { from, to, reason }]
    };
}

/**
 * Query all hazard outcomes affecting a specific node. Used by the 
 * HazardModifierTable system to compute threshold adjustments.
 */
export function getHazardOutcomesForNode(state: MapState, nodeId: NodeId): HazardNodeOutcome[] {
    return state.hazardOutcomes.filter(outcome => outcome.nodeId === nodeId);
}

/**
 * Check if a route between two nodes is blocked by hazard outcomes.
 * Returns the blocking reason if blocked, undefined otherwise.
 */
export function isRouteBlocked(state: MapState, from: NodeId, to: NodeId): string | undefined {
    const blockedRoute = state.blockedRoutes.find(
        route => (route.from === from && route.to === to) ||
                 (route.from === to && route.to === from)
    );
    return blockedRoute?.reason;
}
