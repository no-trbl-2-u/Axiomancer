/**
 * World reducer — pure transitions over WorldState. Idempotent where it
 * makes sense (locking/unlocking, completing).
 */

import { WorldState, MapState, MapDefinition, MapNode, NodeId, HazardNodeOutcome, Continent } from './types';
import { MapName, ContinentName } from './map.library';
import { getMapDefinition } from './map.registry';

/**
 * Writes an updated continent into BOTH `currentContinent` and its slot in
 * the `world` catalogue (2026-08-28 travel). Before the world array was
 * populated, continent mutations only touched `currentContinent` and the
 * empty catalogue could not drift; with a real catalogue the two must stay
 * in sync or a continent switch would resurrect stale map lists.
 */
function withCurrentContinent(state: WorldState, continent: Continent): WorldState {
    return {
        ...state,
        currentContinent: continent,
        world: state.world.map(c => (c.name === continent.name ? continent : c)),
    };
}

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

// ── D1 — the frontier (2026-09-21) ──────────────────────────────────────────
//
// The ratified traversal doctrine. A node the player has RESOLVED is SPENT:
// still drawn, still part of the graph, but answered — it yields nothing and
// is no longer a destination. Everything unvisited that touches the visited
// set across an unblocked edge is the FRONTIER, and the whole frontier is
// open at once. The player therefore roams the explored edge of the map
// instead of being pushed down a single lane, and the region boss becomes
// unavoidable only once the frontier is empty.
//
// Nothing here is persisted. The frontier is DERIVED from the three sets the
// save already carries (`currentNode`, `completedNodes`, `consumedNodes`)
// plus the static graph, so D1 needs no `GAME_STATE_VERSION` bump and no
// migration — old saves read correctly on the first load.

/**
 * The nodes that count as ALREADY ANSWERED for frontier purposes: everything
 * resolved (`completedNodes` ∪ `consumedNodes`) plus the node the player is
 * standing on.
 *
 * Standing on a node counts, but merely having WALKED THROUGH one does not:
 * `moveToNode` marks nothing spent, so a node the player stepped off without
 * resolving drops back onto the frontier and can be returned to. D1 spends a
 * node on RESOLUTION, not on departure.
 */
function visitedSet(map: MapState): Set<NodeId> {
    const seen = new Set<NodeId>(map.completedNodes);
    for (const id of map.consumedNodes) seen.add(id);
    seen.add(map.currentNode);
    return seen;
}

/** `visitedSet` as an array — the spent set plus the node under the player. */
export function visitedNodes(map: MapState): NodeId[] {
    return [...visitedSet(map)];
}

/**
 * True when `nodeId` has been resolved on this map — D1's "spent/sealed".
 * A spent node still renders and still carries its authored content; it
 * simply cannot be re-entered or re-farmed. The node the player is standing
 * on is NOT spent by standing there (see `visitedSet`).
 */
export function isNodeSpent(map: MapState, nodeId: NodeId): boolean {
    return map.completedNodes.includes(nodeId) || map.consumedNodes.includes(nodeId);
}

/**
 * Undirected, unblocked adjacency over the map definition.
 *
 * Edges are authored one-way (forward, plus D1's lateral lane ribs) but are
 * drawn and walked as undirected lines, so the frontier reads them both
 * ways. Blocked routes are cut here, which is what makes a hazard-blocked
 * edge genuinely block: a node reachable only across it never enters the
 * frontier.
 */
function unblockedAdjacency(map: MapState): Map<NodeId, Set<NodeId>> {
    const def = getMapDefinition(map.continent, map.name);
    const adj = new Map<NodeId, Set<NodeId>>();
    for (const node of def.nodes) adj.set(node.id, new Set<NodeId>());
    for (const node of def.nodes) {
        for (const next of node.connectedNodes) {
            if (!adj.has(next)) continue;
            if (isRouteBlocked(map, node.id, next) !== undefined) continue;
            adj.get(node.id)!.add(next);
            adj.get(next)!.add(node.id);
        }
    }
    return adj;
}

/**
 * D1's frontier: every UNVISITED node joined by an unblocked edge to ANY
 * visited node. Returned in map-definition order so callers render a stable
 * list. Gauntlet-shaped; labyrinth maps have their own rule and should ask
 * `legalMovesFrom` instead.
 */
export function frontierNodes(map: MapState): NodeId[] {
    const def = getMapDefinition(map.continent, map.name);
    if (!def.nodes.some(n => n.id === map.currentNode)) return [];
    const visited = visitedSet(map);
    const adj = unblockedAdjacency(map);
    return def.nodes
        .map(n => n.id)
        .filter(id => !visited.has(id))
        .filter(id => {
            for (const neighbour of adj.get(id) ?? []) {
                if (visited.has(neighbour)) return true;
            }
            return false;
        });
}

/**
 * True when nothing unvisited touches the explored set any more — the map is
 * walked out. On a map whose climax sits behind its last open lane this is
 * also the moment the boss stops being optional, which is D1's "the boss is
 * forced only when the frontier is exhausted" stated as a query.
 */
export function isFrontierExhausted(map: MapState): boolean {
    return frontierNodes(map).length === 0;
}

/**
 * Promotes the current frontier into `availableNodes` and out of
 * `lockedNodes`.
 *
 * Those two lists are the LEGACY unlock bookkeeping (the CLI's move filter
 * and mobile's defence-in-depth tap gate still read them); `legalMovesFrom`
 * is the authority. The sync is ADDITIVE on `availableNodes` — it never
 * removes, because that list is documented as cumulative and consumers
 * subtract from it themselves — and subtractive on `lockedNodes`, so a node
 * that has joined the frontier stops reading as locked.
 *
 * No-ops on labyrinth maps, which do not consult either list.
 */
function syncFrontierLists(map: MapState): MapState {
    const def = getMapDefinition(map.continent, map.name);
    if (def.traversal === 'labyrinth') return map;
    const frontier = new Set<NodeId>(frontierNodes(map));
    if (frontier.size === 0) return map;
    const available = new Set<NodeId>(map.availableNodes);
    const added = [...frontier].filter(id => !available.has(id));
    const stillLocked = map.lockedNodes.filter(id => !frontier.has(id));
    if (added.length === 0 && stillLocked.length === map.lockedNodes.length) return map;
    return {
        ...map,
        availableNodes: [...map.availableNodes, ...added],
        lockedNodes: stillLocked,
    };
}

/**
 * Moves the player to `nodeId` on the current map. Pure WorldState reducer.
 *
 * Validation (D1, 2026-09-21 — FRONTIER ROAMING replaces linear adjacency):
 *   1. The destination must be a real node on the map.
 *   2. The destination must not be SPENT — a node the player has already
 *      resolved (`completedNodes` / `consumedNodes`) is answered; it stays
 *      drawn on the canvas but is no longer a destination, so nothing can
 *      be re-farmed.
 *   3. The destination must be on the FRONTIER: unvisited, and joined by an
 *      unblocked edge to ANY visited node — not merely to the node the
 *      player is standing on. That is the whole of D1: the explored edge of
 *      the map is open, so a player may double back and clear a lane they
 *      skipped instead of being shovelled forward into the boss. The boss
 *      is never *forced* until the frontier is exhausted, which falls out
 *      of this rule rather than being special-cased.
 *   4. Blocked routes (hazard outcomes, secret doors) are cut out of the
 *      adjacency the frontier is derived from, so a node reachable ONLY
 *      across a blocked edge is not a legal destination. A node still
 *      reachable by some other unblocked edge stays legal — that is
 *      `map.dispatcher.ts`'s "alternative path", now expressed in the
 *      legality rule itself instead of only in a suggestion.
 *
 * Labyrinth maps are untouched by D1: they keep free travel along the
 * CURRENT room's doors including back into solved rooms (W-01).
 *
 * Hazard ticking (Spec 08 Q3 — each `moveToNode` call) is performed by the
 * higher-level orchestrator in `Game/world.orchestrator.ts`, since the world
 * reducer is purely WorldState-shaped and the player lives at the
 * `GameState` level.
 *
 * THIS IS THE ARRIVAL VERB, and arriving is what a MapEvent fires on. The
 * move therefore records the debt — `pendingArrival` — which `resolveMapEvent`
 * clears when the arrival is answered (burn-day audit 2026-09-19 row 3.1
 * follow-up). Being PLACED on a node is a different act with a different
 * verb (`placeOnNode` / `teleportToNode`), and those clear the field: a
 * fixture or a dev jump stands the player somewhere, it does not walk them
 * there, so nothing is owed.
 */
export function moveToNode(state: WorldState, nodeId: NodeId): WorldState {
    const map = state.currentMap;
    if (map.currentNode === nodeId) {
        // Idempotent on no-op (already here).
        return state;
    }
    const def = getMapDefinition(map.continent, map.name);
    const currentNode = def.nodes.find(n => n.id === map.currentNode);
    if (!currentNode) {
        throw new IllegalMoveError(`moveToNode: current node '${map.currentNode}' is unknown on map '${map.name}'.`);
    }
    if (def.traversal === 'labyrinth') {
        // W-01 — labyrinth maps allow free travel along the current room's
        // doors, including back into completed/consumed rooms ("solved space
        // is solved" — re-entry is free, the one-shot event just won't fire).
        if (!currentNode.connectedNodes.includes(nodeId)) {
            throw new IllegalMoveError(`moveToNode: '${nodeId}' is not adjacent to '${map.currentNode}'.`);
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
            currentMap: { ...map, currentNode: nodeId, pendingArrival: nodeId },
        };
    }

    if (!def.nodes.some(n => n.id === nodeId)) {
        throw new IllegalMoveError(`moveToNode: '${nodeId}' is unknown on map '${map.name}'.`);
    }
    if (visitedSet(map).has(nodeId)) {
        throw new IllegalMoveError(`moveToNode: '${nodeId}' is spent — its arrival has already been answered.`);
    }
    if (!frontierNodes(map).includes(nodeId)) {
        // Name the blockage when that is what actually stopped the move: if
        // the destination touches the node the player stands on and THAT
        // edge is blocked, "the bridge is down" is the true and useful
        // sentence. It only reaches here when no other unblocked edge to
        // the explored region exists — a destination still reachable the
        // long way round stays legal, which is `map.dispatcher.ts`'s
        // alternative path honoured in the legality rule.
        const touching = currentNode.connectedNodes.includes(nodeId)
            || def.nodes.find(n => n.id === nodeId)?.connectedNodes.includes(map.currentNode);
        const blockedReason = touching ? isRouteBlocked(map, map.currentNode, nodeId) : undefined;
        if (blockedReason !== undefined) {
            throw new IllegalMoveError(`moveToNode: route from '${map.currentNode}' to '${nodeId}' is blocked — ${blockedReason}`);
        }
        throw new IllegalMoveError(`moveToNode: '${nodeId}' is not on the explored frontier of '${map.name}'.`);
    }
    return {
        ...state,
        currentMap: { ...map, currentNode: nodeId, pendingArrival: nodeId },
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
    // D1 — completing a node spends it, which grows the frontier: sync the
    // legacy unlock lists against the whole frontier, not just this node's
    // own edges, so a lane the player left open earlier still reads as
    // available.
    return {
        ...state,
        currentMap: syncFrontierLists({
            ...map,
            completedNodes: [...map.completedNodes, nodeId],
            availableNodes: [...map.availableNodes, ...newlyAvailable],
            lockedNodes: newLocked,
        }),
    };
}

/** Marks a map as completed on the current continent. Idempotent. */
export function completeMap(state: WorldState, mapName: MapName): WorldState {
    const continent = state.currentContinent;
    if (continent.completedMaps.includes(mapName)) return state;
    return withCurrentContinent(state, {
        ...continent,
        completedMaps: [...continent.completedMaps, mapName],
    });
}

/** Moves a map from `lockedMaps` to `availableMaps`. Idempotent. */
export function unlockMap(state: WorldState, mapName: MapName): WorldState {
    const continent = state.currentContinent;
    if (continent.availableMaps.includes(mapName)) return state;
    return withCurrentContinent(state, {
        ...continent,
        lockedMaps: continent.lockedMaps.filter(m => m !== mapName),
        availableMaps: [...continent.availableMaps, mapName],
    });
}

// ── Node progression ────────────────────────────────────────────────────────

/** Marks a node as completed on the current map. Idempotent. */
export function completeNode(state: WorldState, nodeId: string): WorldState {
    const map = state.currentMap;
    if (map.completedNodes.includes(nodeId)) return state;
    return {
        ...state,
        currentMap: syncFrontierLists({
            ...map,
            completedNodes: [...map.completedNodes, nodeId],
        }),
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

/**
 * Switches to the named continent. No-op when the name is not in
 * `state.world` (the catalogue is the authority — labyrinth-continent is
 * deliberately uncatalogued, dev-menu + CLI only, and stays unreachable
 * here). The outgoing `currentContinent` is written back into the catalogue
 * first, so nothing accumulated on it is lost by the switch (2026-08-28
 * travel — before the catalogue was populated this function could only
 * no-op, and `world.reducer.test.ts` pinned that).
 */
export function changeContinent(state: WorldState, continentName: ContinentName): WorldState {
    const synced = withCurrentContinent(state, state.currentContinent);
    const continent = synced.world.find(c => c.name === continentName);
    if (!continent) return state;
    return { ...synced, currentContinent: continent };
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
    // D1 — a consumed node is SPENT, so everything it touches joins the
    // frontier. Keep the legacy unlock lists honest about that.
    return syncFrontierLists({ ...state, consumedNodes: [...state.consumedNodes, nodeId] });
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

    // D1 — the local promotion above is kept (callers and their tests pin
    // it), then widened to the whole frontier: a lane the player walked past
    // without resolving must not silently fall back into `lockedNodes`.
    if (newlyAvailable.length === 0) return syncFrontierLists(state);

    return syncFrontierLists({
        ...state,
        availableNodes: [...state.availableNodes, ...newlyAvailable],
        lockedNodes: stillLocked,
    });
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
 * Removes any block on the route between two nodes (either direction).
 * W-01 — opens a labyrinth secret door or an answered act gate. No-op
 * when the route isn't blocked.
 */
export function unblockMapRoute(state: MapState, from: NodeId, to: NodeId): MapState {
    const remaining = state.blockedRoutes.filter(
        route => !((route.from === from && route.to === to) ||
                   (route.from === to && route.to === from))
    );
    if (remaining.length === state.blockedRoutes.length) return state;
    return { ...state, blockedRoutes: remaining };
}

/**
 * Places the player directly on `nodeId`, bypassing adjacency. W-01 —
 * labyrinth-only movements that are not walks: the Oubliette's ejection
 * to the last activated Waystone. Throws off labyrinth maps so gauntlet
 * traversal can never be teleport-skipped, and on unknown nodes.
 */
export function teleportToNode(state: WorldState, nodeId: NodeId): WorldState {
    const map = state.currentMap;
    const def = getMapDefinition(map.continent, map.name);
    if (def.traversal !== 'labyrinth') {
        throw new IllegalMoveError(`teleportToNode: '${map.name}' is not a labyrinth map.`);
    }
    if (!def.nodes.some(n => n.id === nodeId)) {
        throw new IllegalMoveError(`teleportToNode: '${nodeId}' is unknown on map '${map.name}'.`);
    }
    if (map.currentNode === nodeId) return state;
    // A teleport PLACES the player (the Oubliette's eject, a waystone recall):
    // no door was walked, so no arrival is owed at the far end.
    return { ...state, currentMap: { ...map, currentNode: nodeId, pendingArrival: null } };
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

// ── Traversal audit (2026-08-08 first-map audit) ─────────────────────────────

/**
 * The nodes the player may legally move to right now.
 *
 * This is the single source of truth for "where can I go" — `moveToNode`'s
 * validation, expressed as a query instead of an exception.
 *
 * D1 (2026-09-21): on a gauntlet map this is the FRONTIER, not the current
 * node's neighbours. The set no longer depends on where the player is
 * standing at all — every unvisited node touching the explored region is
 * offered, so a skipped lane stays open and the boss is only forced once
 * nothing else is left. `lockedNodes` is no longer consulted: it is legacy
 * bookkeeping that `syncFrontierLists` keeps in step, never the authority.
 * Labyrinth maps keep W-01's rule — the current room's doors, solved rooms
 * included. Blocked routes are excluded on both.
 */
export function legalMovesFrom(map: MapState): NodeId[] {
    const def = getMapDefinition(map.continent, map.name);
    const node = def.nodes.find(n => n.id === map.currentNode);
    if (!node) return [];
    if (def.traversal === 'labyrinth') {
        return node.connectedNodes.filter(
            id => isRouteBlocked(map, map.currentNode, id) === undefined,
        );
    }
    return frontierNodes(map);
}

/**
 * True when the player has no legal move left.
 *
 * Under D1 a gauntlet map runs out of moves only when the FRONTIER is
 * exhausted — every node has been resolved, or the survivors are cut off
 * behind blocked routes. Walking into a corner is no longer possible: the
 * frontier does not depend on where the player stands, so a dead-end lane
 * is a detour, not a soft-lock. `isMapTerminalNode` still distinguishes the
 * authored end of a map.
 */
export function isStranded(map: MapState): boolean {
    return legalMovesFrom(map).length === 0;
}

/**
 * True when `nodeId` is an AUTHORED terminal node — one the map definition
 * gives no outgoing edges at all. Running out of moves here is the map
 * ending, not a soft-lock.
 */
export function isMapTerminalNode(map: MapState, nodeId: NodeId): boolean {
    const def = getMapDefinition(map.continent, map.name);
    const node = def.nodes.find(n => n.id === nodeId);
    if (node === undefined) return false;
    // Forward skeleton, not raw edges: D1's lateral lane ribs are traversal,
    // not progression, so a last-column node that gained a rib is still the
    // authored end of the map.
    return (forwardEdges(def).get(nodeId) ?? []).length === 0;
}

/** One strand a traversal audit found: entering `nodeId` by `via` dead-ends. */
export interface MapStrand {
    /** The node the run walked into with no legal move left. */
    nodeId: NodeId;
    /** The node it arrived from. */
    via: NodeId;
    /** The full route, start node first. */
    route: NodeId[];
}

/** The verdict of `auditMapTraversal`. */
export interface MapTraversalAudit {
    mapName: string;
    /** Nodes with no outgoing edges at all — the authored ends of the map. */
    terminalNodes: NodeId[];
    /**
     * Routes that ran out of legal moves on a NON-terminal node. Any entry
     * here is a soft-lock: the player is alive, the map is unfinished, and
     * the UI has nothing to offer. Empty is the invariant.
     */
    strands: MapStrand[];
    /** Nodes no legal route can ever reach from the starting node. */
    unreachableNodes: NodeId[];
    /** Length in nodes of the longest legal single-life route. */
    longestRoute: number;
    /** Total distinct routes walked to exhaustion. */
    routesExplored: number;
}

/**
 * Exhaustively walks every legal single-life route through a gauntlet map
 * and reports the ways it can end. Pure and definition-only — it reads the
 * static `MapDefinition`, never a live `MapState`, so content tests can run
 * it over the whole registry.
 *
 * Only meaningful for gauntlet maps: labyrinth traversal permits re-entry,
 * so a labyrinth route never runs out of moves and the walk would not
 * terminate. Callers should skip those (`auditMapTraversal` returns an empty
 * audit for them rather than hanging).
 *
 * `maxRoutes` bounds the search on pathological content; exceeding it stops
 * the walk early rather than looping forever, and the returned
 * `routesExplored` will equal the cap.
 */
/**
 * The FORWARD SKELETON of a map: for every node, the neighbours that sit one
 * column further along (`location[0] + 1`).
 *
 * D1 (2026-09-21) added LATERAL RIBS — same-column edges between neighbouring
 * lanes — so the canvas draws a branching web instead of a ladder of rungs
 * and a hazard-blocked edge can be routed around. Those ribs are traversal
 * edges, not progression edges. The two route audits below measure
 * PROGRESSION — "how many beats does a run take", "what share of runs meets
 * the quest-giver" — so they walk the forward skeleton alone. Walking the
 * ribs as well would let a single-life route snake sideways through a whole
 * column and would multiply the route count into the millions without
 * describing anything a player experiences.
 */
export function forwardEdges(def: MapDefinition): Map<string, string[]> {
    const columnOf = new Map(def.nodes.map(n => [n.id, n.location[0]]));
    const forward = new Map<string, string[]>();
    for (const node of def.nodes) {
        const here = columnOf.get(node.id)!;
        forward.set(
            node.id,
            node.connectedNodes.filter(id => columnOf.get(id) === here + 1),
        );
    }
    return forward;
}

export function auditMapTraversal(
    def: MapDefinition,
    maxRoutes = 500_000,
): MapTraversalAudit {
    const byId = forwardEdges(def);
    const terminalNodes = def.nodes.filter(n => (byId.get(n.id) ?? []).length === 0).map(n => n.id);
    const audit: MapTraversalAudit = {
        mapName: def.name,
        terminalNodes,
        strands: [],
        unreachableNodes: [],
        longestRoute: 0,
        routesExplored: 0,
    };
    if (def.traversal === 'labyrinth') return audit;

    const reached = new Set<NodeId>([def.startingNode.id]);
    const walk = (cur: NodeId, completed: Set<NodeId>, route: NodeId[]): void => {
        if (audit.routesExplored >= maxRoutes) return;
        const options = (byId.get(cur) ?? []).filter(id => !completed.has(id));
        if (options.length === 0) {
            audit.routesExplored += 1;
            audit.longestRoute = Math.max(audit.longestRoute, route.length);
            if (!terminalNodes.includes(cur)) {
                audit.strands.push({ nodeId: cur, via: route[route.length - 2] ?? cur, route: [...route] });
            }
            return;
        }
        for (const next of options) {
            reached.add(next);
            completed.add(next);
            route.push(next);
            walk(next, completed, route);
            route.pop();
            completed.delete(next);
        }
    };
    walk(def.startingNode.id, new Set([def.startingNode.id]), [def.startingNode.id]);
    audit.unreachableNodes = def.nodes.map(n => n.id).filter(id => !reached.has(id));
    return audit;
}

/** The verdict of `auditRouteCoverage`. */
export interface MapRouteCoverage {
    mapName: string;
    /** Total distinct legal single-life routes walked. */
    totalRoutes: number;
    /** For each node, how many of those routes pass through it. */
    routesThrough: Record<NodeId, number>;
    /** `routesThrough[id] / totalRoutes` — 1 means every legal route. */
    shareOfRoutes: Record<NodeId, number>;
}

/**
 * Exhaustively walks every legal single-life route (same walk as
 * `auditMapTraversal`) and, for every node, counts how many of those routes
 * pass through it. This is the measurement behind the first-map audit's
 * "share of routes" table (2026-08-08) and the Phase 53c coverage-floor
 * test: a node whose `shareOfRoutes` is below 1 is a coin flip or worse,
 * and load-bearing narrative (a quest-giver, a boss) cannot silently land
 * there again without a test catching it.
 *
 * Pure and definition-only, same contract as `auditMapTraversal`: labyrinth
 * maps return an empty verdict rather than walking forever.
 */
export function auditRouteCoverage(
    def: MapDefinition,
    maxRoutes = 500_000,
): MapRouteCoverage {
    const byId = forwardEdges(def);
    const routesThrough: Record<NodeId, number> = {};
    for (const node of def.nodes) routesThrough[node.id] = 0;
    const coverage: MapRouteCoverage = {
        mapName: def.name,
        totalRoutes: 0,
        routesThrough,
        shareOfRoutes: {},
    };
    if (def.traversal === 'labyrinth') return coverage;

    const walk = (cur: NodeId, completed: Set<NodeId>, route: NodeId[]): void => {
        if (coverage.totalRoutes >= maxRoutes) return;
        const options = (byId.get(cur) ?? []).filter(id => !completed.has(id));
        if (options.length === 0) {
            coverage.totalRoutes += 1;
            for (const id of route) routesThrough[id] = (routesThrough[id] ?? 0) + 1;
            return;
        }
        for (const next of options) {
            completed.add(next);
            route.push(next);
            walk(next, completed, route);
            route.pop();
            completed.delete(next);
        }
    };
    walk(def.startingNode.id, new Set([def.startingNode.id]), [def.startingNode.id]);

    for (const node of def.nodes) {
        coverage.shareOfRoutes[node.id] = coverage.totalRoutes > 0
            ? (routesThrough[node.id] ?? 0) / coverage.totalRoutes
            : 0;
    }
    return coverage;
}

/**
 * Stand the player on `nodeId` with no adjacency or back-travel rule and
 * no event fired — the state-fixture / dev-tools placement primitive
 * (2026-09-07). Unlike `teleportToNode` it works on every map kind; unlike
 * `moveToNode` it never throws for a legal-but-unwalked node. The node is
 * also marked discovered + available (and cleared from locked / completed /
 * consumed) so an exploration renderer shows it as the live position, and
 * its neighbours are revealed + unlocked so the walk can continue from
 * there (`legalMovesFrom` filters on `lockedNodes`).
 * Throws `IllegalMoveError` only when `nodeId` is not on the current map.
 *
 * Mobile's `/dev` WORLD → JUMP row delegates here.
 *
 * BEING PLACED IS NOT ARRIVING, and this verb says so in the state it writes:
 * `pendingArrival` is cleared (burn-day audit 2026-09-19 row 3.1 follow-up).
 * Placement un-consumes the node so its content is live for a tester, and
 * before the debt was recorded explicitly that "live, unconsumed node under
 * the player" was indistinguishable from an arrival nobody had answered —
 * the exploration screen fired the fixture's boss gate on mount and the map
 * was never seen. `no event fired` above is the contract; this keeps it.
 */
export function placeOnNode(state: WorldState, nodeId: NodeId): WorldState {
    const map = state.currentMap;
    const def = getMapDefinition(map.continent, map.name);
    if (!def.nodes.some(n => n.id === nodeId)) {
        throw new IllegalMoveError(`placeOnNode: '${nodeId}' is unknown on map '${map.name}'.`);
    }
    const without = (xs: readonly NodeId[]) => xs.filter(x => x !== nodeId);
    const withOnce = (xs: readonly NodeId[]) => (xs.includes(nodeId) ? [...xs] : [...xs, nodeId]);
    const placed: MapState = {
        ...map,
        currentNode: nodeId,
        pendingArrival: null,
        lockedNodes: without(map.lockedNodes),
        completedNodes: without(map.completedNodes),
        consumedNodes: without(map.consumedNodes),
        availableNodes: withOnce(map.availableNodes),
        discoveredNodes: withOnce(map.discoveredNodes),
    };
    return { ...state, currentMap: unlockAdjacent(revealAdjacent(placed, nodeId), nodeId) };
}
