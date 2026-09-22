/**
 * Hermetic engine coverage — the gathering grant is real, on every
 * authored gathering node.
 *
 * 2026-09-21, owner finding 2: "the Gather node is now a no-op". The
 * complaint is about what the PLAYER sees, and the player was right about
 * the symptom — but the engine half was never the cause. This file pins
 * that half, so the mobile fix cannot be blamed for a resolver that grants
 * nothing, and so a later content pass that authors an empty `items: []`
 * pool fails here rather than silently shipping a node that gives nothing.
 *
 * Walked over every gathering-primary node in `MAP_REGISTRY` (12 today,
 * across fishing-village / northern-forest / caverns / northern-city /
 * connecting-river / the-capital):
 *   - the resolved event carries at least one NAMED item;
 *   - resolving appends exactly those items to `player.inventory`,
 *     in order, and disturbs nothing already in it;
 *   - the node is spent by resolving it, so a second arrival grants
 *     nothing — a gathering node is not a farm.
 *
 * Phase 76 retired the "Gleaning" minigame and left `resolveGathering` as
 * the whole mechanism. Nothing here resurrects it: this reads the shipped
 * resolver against the shipped content pools.
 *
 * RNG is pinned because a gathering-PRIMARY node is not always a
 * gathering-ONLY node — `cap-5` carries the Ribbon-Picker on a lighter
 * weight-1 entry beside the weight-3 gathering payload, so an unpinned
 * roll would make this suite flaky one visit in four. A node whose pinned
 * roll lands on a lighter sibling is skipped rather than failed, and
 * `MIN_GATHER_ROLLS` keeps that escape hatch from quietly hollowing the
 * suite out if content shifts.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { MAP_REGISTRY, getMapDefinition, createMapState } from '../../map.registry';
import { resolveMapEvent, getNodePrimaryEventKind } from '../resolve-map-event';
import { mockSequentialRng, restoreOriginalRng } from '../../../test-utils/rng';
import { createNewGameState } from '../../../Game/game.reducer';
import type { GameState } from '../../../Game/types';
import type { ContinentName, MapName } from '../../map.library';

interface GatherNode {
    continent: ContinentName;
    mapName: MapName;
    nodeId: string;
}

/** Every gathering-primary node in the shipped registry, in a stable order. */
function allGatheringNodes(): GatherNode[] {
    const found: GatherNode[] = [];
    for (const continent of Object.keys(MAP_REGISTRY) as ContinentName[]) {
        for (const mapName of Object.keys(MAP_REGISTRY[continent]) as MapName[]) {
            const def = getMapDefinition(continent, mapName);
            for (const node of def.nodes) {
                if (getNodePrimaryEventKind(continent, mapName, node.id) === 'gathering') {
                    found.push({ continent, mapName, nodeId: node.id });
                }
            }
        }
    }
    return found;
}

/** A fresh run, seated on `nodeId` of that map, owing that node's arrival. */
function seatedAt({ continent, mapName, nodeId }: GatherNode): GameState {
    const base = createNewGameState();
    const map = createMapState(getMapDefinition(continent, mapName));
    return {
        ...base,
        world: {
            ...base.world,
            // `resolveMapEvent` reads the map's own `continent`/`name`, which
            // `createMapState` copies off the definition — the continent
            // catalogue above it is not consulted, so it is left alone.
            currentMap: { ...map, currentNode: nodeId, pendingArrival: nodeId },
        },
    } as GameState;
}

const GATHER_NODES = allGatheringNodes();

/**
 * How many of those nodes must actually roll their gathering entry under the
 * pinned RNG for this suite to be worth anything. 12 of 12 do today; the
 * floor leaves room for one node to gain a weighted sibling without a red
 * build, while a content pass that turned gathering into a rare draw
 * everywhere would still be caught.
 */
const MIN_GATHER_ROLLS = 10;

/** `rollPool` consumes one `rng()`; pinning it makes each node's draw fixed. */
function pinRoll(): void {
    mockSequentialRng(0);
}

afterEach(() => {
    vi.restoreAllMocks();
    restoreOriginalRng();
});

describe('gathering nodes grant real, named items', () => {
    it('the shipped registry still authors gathering nodes at all', () => {
        // A guard on the guard: if a content pass retired every gathering
        // node, the sweeps below would pass vacuously.
        expect(GATHER_NODES.length).toBeGreaterThanOrEqual(MIN_GATHER_ROLLS);
    });

    it('every gathering roll carries at least one named item', () => {
        pinRoll();
        let rolled = 0;
        const emptyHanded: string[] = [];

        for (const node of GATHER_NODES) {
            const result = resolveMapEvent(seatedAt(node));
            if (result.event.kind !== 'gathering') continue;
            rolled++;

            const label = `${node.mapName}/${node.nodeId}`;
            if (result.event.items.length === 0) {
                emptyHanded.push(label);
                continue;
            }
            // An item with a blank name is the same bug as no item at all:
            // the acknowledgement card has nothing to put on its face.
            const unnamed = result.event.items
                .filter((i) => i.name.trim().length === 0 || i.id.trim().length === 0)
                .map((i) => `${label}: ${JSON.stringify(i.id)}/${JSON.stringify(i.name)}`);
            expect(unnamed).toEqual([]);
        }

        expect(emptyHanded).toEqual([]);
        expect(rolled).toBeGreaterThanOrEqual(MIN_GATHER_ROLLS);
    });

    it('appends exactly the rolled items to the inventory, disturbing nothing', () => {
        pinRoll();
        let rolled = 0;

        for (const node of GATHER_NODES) {
            const before = seatedAt(node);
            const beforeNames = before.player.inventory.map((i) => i.name);

            const result = resolveMapEvent(before);
            if (result.event.kind !== 'gathering') continue;
            rolled++;

            const afterNames = result.state.player.inventory.map((i) => i.name);
            expect(afterNames.slice(0, beforeNames.length)).toEqual(beforeNames);
            expect(afterNames.slice(beforeNames.length)).toEqual(
                result.event.items.map((i) => i.name),
            );
        }

        expect(rolled).toBeGreaterThanOrEqual(MIN_GATHER_ROLLS);
    });

    it('spends the node — a second arrival grants nothing', () => {
        pinRoll();
        let rolled = 0;

        for (const node of GATHER_NODES) {
            const first = resolveMapEvent(seatedAt(node));
            if (first.event.kind !== 'gathering') continue;
            rolled++;

            const afterFirst = first.state.player.inventory.length;
            const again: GameState = {
                ...first.state,
                world: {
                    ...first.state.world,
                    currentMap: {
                        ...first.state.world.currentMap,
                        currentNode: node.nodeId,
                        pendingArrival: node.nodeId,
                    },
                },
            };
            const second = resolveMapEvent(again);

            expect(second.event.kind).toBe('none');
            expect(second.state.player.inventory.length).toBe(afterFirst);
        }

        expect(rolled).toBeGreaterThanOrEqual(MIN_GATHER_ROLLS);
    });
});

describe('gathering — the coastal opener, by name', () => {
    // One spot-check in plain words, so a reader learns what a gathering node
    // actually hands the player without running the sweeps above.
    it('fv-5 hands the player Driftwood', () => {
        pinRoll();
        const result = resolveMapEvent(
            seatedAt({ continent: 'coastal-continent', mapName: 'fishing-village', nodeId: 'fv-5' }),
        );
        expect(result.event.kind).toBe('gathering');
        if (result.event.kind !== 'gathering') return;
        expect(result.event.items.map((i) => i.name)).toEqual(['Driftwood']);
        expect(result.state.player.inventory.some((i) => i.name === 'Driftwood')).toBe(true);
    });
});
