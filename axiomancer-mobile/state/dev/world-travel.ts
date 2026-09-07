/**
 * Dev-only WORLD TRAVEL helpers.
 *
 * Pure catalogue + store-transition functions behind the `/dev` WORLD
 * section. They let a tester stand anywhere in the game world in one
 * tap — any continent, any map, any node — and fire that node's real
 * authored event, so late-game content (the Northern Continent, travel
 * doors, THE APORIA acts) is reachable without walking the campaign.
 *
 * Functions (lowest → highest abstraction):
 *   listMaps()                  every (continent, map) pair in MAP_REGISTRY
 *   listNodes(state)            the current map's nodes + primary event kind
 *   travelToMap(store, c, m)    swap continent + map; fresh MapState at start
 *   jumpToNode(store, nodeId)   move the cursor to a node (dev bypass of the
 *                               no-back-travel rule), no event fired
 *   resetCurrentMap(store)      re-seed the current map at its start node
 *   completeCurrentMap(store)   stamp the current map complete + unlock the
 *                               next map in the continent's locked list
 *
 * These mutate `world` only; every other slice is untouched.
 */

import {
    MAP_REGISTRY,
    changeContinent,
    changeMap,
    completeMap,
    createMapState,
    getMapDefinition,
    getNodePrimaryEventKind,
    placeOnNode,
    unlockMap,
} from '@mechanics';
import type { ContinentName, GameState, MapEventKind, MapName, WorldState } from '@mechanics';

import type { AppStore } from '@/state/store';

/** One selectable map. */
export interface MapChoice {
    readonly continent: ContinentName;
    readonly map: MapName;
}

/** One selectable node on the current map. */
export interface NodeChoice {
    readonly id: string;
    /** Highest-weight authored event kind, or `undefined` for a plain node. */
    readonly kind: MapEventKind | undefined;
    readonly isStart: boolean;
    readonly isCurrent: boolean;
}

/** Every authored map, in registry order (coastal → northern → labyrinth). */
export function listMaps(): readonly MapChoice[] {
    return (Object.keys(MAP_REGISTRY) as ContinentName[]).flatMap((continent) =>
        (Object.keys(MAP_REGISTRY[continent]) as MapName[]).map((map) => ({ continent, map })),
    );
}

/** The current map's nodes with their primary authored event kind. */
export function listNodes(state: GameState): readonly NodeChoice[] {
    const map = state.world?.currentMap;
    if (!map) return [];
    const def = getMapDefinition(map.continent, map.name);
    return def.nodes.map((n) => ({
        id: n.id,
        kind: getNodePrimaryEventKind(map.continent, map.name, n.id),
        isStart: n.id === def.startingNode.id,
        isCurrent: n.id === map.currentNode,
    }));
}

/** Read the world slice, or `null` on a store that has none yet. */
const worldOf = (store: AppStore): WorldState | null => (store.getState() as unknown as GameState).world ?? null;

/**
 * Stand at the start of `map` on `continent`. Switches the continent
 * cursor first so the engine's per-continent bookkeeping (available /
 * locked / completed) follows the map. Returns `false` when the world
 * slice is missing or the map is unknown.
 */
export function travelToMap(store: AppStore, continent: ContinentName, map: MapName): boolean {
    const world = worldOf(store);
    if (!world) return false;
    try {
        const onContinent = changeContinent(world, continent);
        const next = changeMap(onContinent, createMapState(getMapDefinition(continent, map)));
        store.setState({ world: next });
        return true;
    } catch {
        return false;
    }
}

/**
 * Put the cursor on `nodeId` without firing its event. Dev bypass: the
 * engine's `moveToNode` forbids back-travel and only allows adjacent
 * moves; testers need neither rule. Delegates to the engine's
 * `placeOnNode` (shared with state fixtures, 2026-09-07), which marks the
 * node discovered + available and unlocks its neighbours so the walk can
 * continue. Returns `false` on an unknown node.
 */
export function jumpToNode(store: AppStore, nodeId: string): boolean {
    const world = worldOf(store);
    if (!world) return false;
    try {
        store.setState({ world: placeOnNode(world, nodeId) });
        return true;
    } catch {
        return false;
    }
}

/** Re-seed the current map at its starting node (clears node progress). */
export function resetCurrentMap(store: AppStore): boolean {
    const world = worldOf(store);
    if (!world) return false;
    return travelToMap(store, world.currentMap.continent, world.currentMap.name);
}

/**
 * Stamp the current map complete and unlock the next locked map on the
 * continent, mirroring what a `travel` door does — so the "maps done /
 * maps open" late-game bookkeeping can be driven without the walk.
 * Returns the unlocked map name, or `null` if nothing was left to unlock.
 */
export function completeCurrentMap(store: AppStore): MapName | null {
    const world = worldOf(store);
    if (!world) return null;
    const current = world.currentMap.name;
    const completed = completeMap(world, current);
    const nextLocked = completed.currentContinent.lockedMaps[0] ?? null;
    const next = nextLocked ? unlockMap(completed, nextLocked) : completed;
    store.setState({ world: next });
    return nextLocked;
}
