/**
 * `resolveMapEvent` — the Spec 23 dispatcher.
 *
 * Walks the contract:
 *   1. Look up the active node on the current map.
 *   2. If the node is already in `consumedNodes`, return
 *      `{ kind: 'none' }` immediately (one-shot enforcement).
 *   3. Roll one entry from the node's event pool. Pool resolution
 *      prefers `MapDefinition.nodeEventPools[nodeId]` over
 *      `MapDefinition.defaultEventPool`. Missing pool → `{ kind: 'none' }`.
 *   4. Hand the rolled payload off to the matching handler from
 *      `handlers.ts`.
 *   5. Add the node to `consumedNodes` and reveal its adjacents.
 *   6. Return the handler's `{ state, event }` with the discovery /
 *      consumption updates folded in.
 *
 * Pure when `rng` is deterministic.
 */

import type { GameState } from '../../Game/types';
import { revealAdjacent, markNodeConsumed, unlockAdjacent } from '../world.reducer';
import { getRng } from '../../Utils/rng';
import { applyPayload } from './handlers';
import { reachableObjectives, progressQuest } from '../quest.engine';
import { applyAlignmentDelta } from '../../Philosophy';
import type { QuestLog, NodeId } from '../types';
import type {
    MapEventPool, MapEventPoolEntry, MapEventKind, ResolveMapEventResult, ResolvedEvent,
} from './types';

/**
 * Advances any active `reach`-type quest objectives that target `nodeId`.
 * Restores the auto-advance behaviour the deleted `process-node.ts` provided
 * before Phase 25. Pure — re-entering a node whose reach objective already
 * completed is a silent no-op via `reachableObjectives`' `currentCount <
 * requiredCount` filter.
 */
function advanceReachObjectives(quests: QuestLog, nodeId: NodeId): QuestLog {
    const reaches = reachableObjectives(quests, nodeId);
    let log = quests;
    for (const r of reaches) {
        log = progressQuest(log, r.questName, r.objectiveId).log;
    }
    return log;
}

/**
 * Map-level extension surface for Phase 23. We attach pools via a side
 * registry rather than mutating `MapDefinition` directly — that keeps
 * the existing Spec 08 surface unchanged for the duration of Phase 23.
 * Phase 24 will fold pools onto `MapDefinition` proper and migrate
 * content.
 */
const poolRegistry = new Map<string, MapEventPool>();
const defaultPoolByMap = new Map<string, string>();
const nodePoolOverrides = new Map<string, string>();
// Phase 161 — count how many times each node-override key has been set so the
// content-parity guard can detect a node that was authored then silently
// clobbered (last-write-wins shadowing). The live override `Map` collapses
// duplicates; this preserves the registration history.
const nodePoolOverrideWrites = new Map<string, number>();

function poolKey(continent: string, mapName: string, nodeId?: string): string {
    return nodeId ? `${continent}:${mapName}:${nodeId}` : `${continent}:${mapName}`;
}

export function registerMapEventPool(pool: MapEventPool): void {
    poolRegistry.set(pool.id, pool);
}

export function setDefaultMapEventPool(
    continent: string,
    mapName: string,
    poolId: string,
): void {
    defaultPoolByMap.set(poolKey(continent, mapName), poolId);
}

export function setNodeEventPoolOverride(
    continent: string,
    mapName: string,
    nodeId: string,
    poolId: string,
): void {
    const key = poolKey(continent, mapName, nodeId);
    nodePoolOverrides.set(key, poolId);
    nodePoolOverrideWrites.set(key, (nodePoolOverrideWrites.get(key) ?? 0) + 1);
}

/**
 * Read-only (Phase 161 content-parity guard): the `continent:map:node` keys
 * whose node-override was registered more than once on module load — i.e. an
 * authored pool that was silently clobbered by a later registration
 * (last-write-wins shadowing). An empty array means there is exactly one source
 * of truth per node and no two content blocks are silently diverging. Returned
 * sorted for deterministic assertions.
 */
export function getShadowedNodeOverrideKeys(): string[] {
    const shadowed: string[] = [];
    for (const [key, writes] of nodePoolOverrideWrites) {
        if (writes > 1) shadowed.push(key);
    }
    return shadowed.sort();
}

/** Test-only: clear every pool registration. Used by hermetic tests. */
export function _clearMapEventPoolRegistry(): void {
    poolRegistry.clear();
    defaultPoolByMap.clear();
    nodePoolOverrides.clear();
    nodePoolOverrideWrites.clear();
}

function lookupPool(
    continent: string,
    mapName: string,
    nodeId: string,
): MapEventPool | undefined {
    const overrideId = nodePoolOverrides.get(poolKey(continent, mapName, nodeId));
    const poolId = overrideId ?? defaultPoolByMap.get(poolKey(continent, mapName));
    return poolId ? poolRegistry.get(poolId) : undefined;
}

/**
 * Read-only: the event pool registered for a node (override → map default),
 * without rolling RNG or mutating state. Lets UI clients inspect what a node
 * *can* resolve to (e.g. to choose a map icon) instead of re-deriving node
 * semantics from a parallel client-side table.
 */
export function getNodeEventPool(
    continent: string,
    mapName: string,
    nodeId: string,
): MapEventPool | undefined {
    return lookupPool(continent, mapName, nodeId);
}

/**
 * Read-only: the distinct event kinds a node can resolve to, in pool order.
 * Empty when no pool is registered for the node.
 */
export function getNodeEventKinds(
    continent: string,
    mapName: string,
    nodeId: string,
): MapEventKind[] {
    const pool = lookupPool(continent, mapName, nodeId);
    if (!pool) return [];
    const seen = new Set<MapEventKind>();
    const kinds: MapEventKind[] = [];
    for (const entry of pool.entries) {
        if (!seen.has(entry.kind)) {
            seen.add(entry.kind);
            kinds.push(entry.kind);
        }
    }
    return kinds;
}

/**
 * Read-only: the node's primary (highest-weight) event kind — the single
 * representative kind a client should use for a node icon/tag. `undefined`
 * when no pool is registered or the pool is empty. Ties resolve to the
 * earlier-declared entry (stable with authoring order).
 */
export function getNodePrimaryEventKind(
    continent: string,
    mapName: string,
    nodeId: string,
): MapEventKind | undefined {
    const pool = lookupPool(continent, mapName, nodeId);
    if (!pool || pool.entries.length === 0) return undefined;
    let best = pool.entries[0];
    for (const entry of pool.entries) {
        if (entry.weight > best.weight) best = entry;
    }
    return best.kind;
}

function rollPool(
    pool: MapEventPool,
    rng: () => number,
): MapEventPoolEntry | undefined {
    if (pool.entries.length === 0) return undefined;
    const total = pool.entries.reduce((s, e) => s + e.weight, 0);
    if (total <= 0) return undefined;
    let roll = rng() * total;
    for (const entry of pool.entries) {
        roll -= entry.weight;
        if (roll <= 0) return entry;
    }
    return pool.entries[pool.entries.length - 1];
}

/**
 * Resolves the MapEvent for the player's current node. See file header.
 */
export function resolveMapEvent(
    state: GameState,
    rng: () => number = () => getRng().random(),
): ResolveMapEventResult {
    const map = state.world.currentMap;
    const nodeId = map.currentNode;

    // 1. Already consumed? Idempotent no-op.
    if (map.consumedNodes.includes(nodeId)) {
        const none: ResolvedEvent = { kind: 'none' };
        return { state, event: none };
    }

    // Restore the pre-Phase-25 reach-objective auto-advance — any active
    // `reach: target=nodeId` quest objective ticks on arrival, before the
    // pool roll. Pure no-op for non-reach quests or fully-completed reaches.
    const questsAfterReach = advanceReachObjectives(state.quests, nodeId);
    const stateAfterReach: GameState = questsAfterReach === state.quests
        ? state
        : { ...state, quests: questsAfterReach };

    // 2. Find the active pool.
    const pool = lookupPool(map.continent, map.name, nodeId);
    if (!pool) {
        // No pool registered — reveal + unlock adjacents + consume to advance
        // discovery and traversal, but produce no event.
        const next = unlockAdjacent(revealAdjacent(map, nodeId), nodeId);
        const consumed = markNodeConsumed(next, nodeId);
        return {
            state: { ...stateAfterReach, world: { ...stateAfterReach.world, currentMap: consumed } },
            event: { kind: 'none' },
        };
    }

    // 3. Roll an entry.
    const entry = rollPool(pool, rng);
    if (!entry) {
        const next = unlockAdjacent(revealAdjacent(map, nodeId), nodeId);
        const consumed = markNodeConsumed(next, nodeId);
        return {
            state: { ...stateAfterReach, world: { ...stateAfterReach.world, currentMap: consumed } },
            event: { kind: 'none' },
        };
    }

    // 4. Apply the matching handler.
    const result = applyPayload(stateAfterReach, entry.payload, rng);

    // 4b. Apply the pool entry's authored alignment delta, if any (Phase 43).
    // Mirrors the dialogue-runtime moralDelta path — the handler computes its
    // event delta on the pre-shift state; the alignment shift applies on top.
    const stateWithAlignment: GameState = entry.alignmentDelta
        ? {
            ...result.state,
            philosophicalAlignment: applyAlignmentDelta(
                result.state.philosophicalAlignment,
                entry.alignmentDelta,
            ),
        }
        : result.state;

    // 5. Reveal + unlock adjacents + mark consumed. Phase 31 — unlock is what
    // moves the adjacents out of `lockedNodes` into `availableNodes` so the
    // CLI `mapTab` filter actually offers them as valid moves. The reveal
    // path (Spec 23) only updates `discoveredNodes`.
    const next = unlockAdjacent(
        revealAdjacent(stateWithAlignment.world.currentMap, nodeId),
        nodeId,
    );
    const consumed = markNodeConsumed(next, nodeId);
    const nextState: GameState = {
        ...stateWithAlignment,
        world: { ...stateWithAlignment.world, currentMap: consumed },
    };

    return { state: nextState, event: result.event };
}
