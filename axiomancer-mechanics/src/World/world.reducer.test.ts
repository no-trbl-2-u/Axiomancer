import { describe, it, expect } from 'vitest';
import {
    completeMap, unlockMap, completeNode, unlockNode, completeUniqueEvent,
    changeContinent, completeCurrentNode, moveToNode,
    frontierNodes, isFrontierExhausted, isNodeSpent, visitedNodes,
    legalMovesFrom, isStranded, IllegalMoveError,
} from './world.reducer';
import { createStartingWorld } from './index';
import { getMapDefinition } from './map.registry';
import type { MapState, WorldState } from './types';

const world = () => createStartingWorld('breakwater');

/** Test fixture: block the route between two nodes (either direction). The
 *  engine's own blocker (`blockMapRoute`) was deleted in TRIM THE FAT T2a;
 *  movement still honours `MapState.blockedRoutes`, which this writes. */
const withBlockedRoute = (map: MapState, from: string, to: string, reason: string): MapState => ({
    ...map,
    blockedRoutes: [...map.blockedRoutes, { from, to, reason }],
});

/** A Breakwater world with the runtime map fields overridden. */
const bwWorld = (patch: Partial<MapState>): WorldState => {
    const w = createStartingWorld('breakwater');
    return { ...w, currentMap: { ...w.currentMap, ...patch } };
};

/** Walk + resolve: the real loop's shape — arrive, then answer the arrival. */
const advance = (from: WorldState, nodeId: string): WorldState =>
    completeCurrentNode(moveToNode(from, nodeId));

describe('createStartingWorld', () => {
    it('does not list a map in both available and locked', () => {
        const { currentContinent } = world();
        for (const name of currentContinent.availableMaps) {
            expect(currentContinent.lockedMaps).not.toContain(name);
        }
    });

    it('catalogues the two campaign continents, coastal current (2026-08-28 travel)', () => {
        const w = world();
        expect(w.world.map(c => c.name)).toEqual(['coastal-continent', 'northern-continent']);
        expect(w.currentContinent.name).toBe('coastal-continent');
        // The labyrinth-continent (W-01) is deliberately uncatalogued —
        // dev-menu + CLI only.
        expect(w.world.map(c => c.name)).not.toContain('labyrinth-continent');
        const northern = w.world.find(c => c.name === 'northern-continent')!;
        expect(northern.lockedMaps).toContain('beacon-crags');
        expect(northern.availableMaps).toEqual([]);
    });
});

describe('completeMap', () => {
    it('adds to completedMaps', () => {
        const w = completeMap(world(), 'breakwater');
        expect(w.currentContinent.completedMaps).toContain('breakwater');
    });
    it('idempotent', () => {
        const w1 = completeMap(world(), 'breakwater');
        const w2 = completeMap(w1, 'breakwater');
        expect(w2.currentContinent.completedMaps.filter(m => m === 'breakwater')).toHaveLength(1);
    });
});

describe('unlockMap', () => {
    it('moves from locked to available', () => {
        const w = unlockMap(world(), 'charcoal-wood');
        expect(w.currentContinent.lockedMaps).not.toContain('charcoal-wood');
        expect(w.currentContinent.availableMaps).toContain('charcoal-wood');
    });
    it('idempotent if already available', () => {
        const w1 = unlockMap(world(), 'charcoal-wood');
        const w2 = unlockMap(w1, 'charcoal-wood');
        expect(w2).toBe(w1);
    });
});

describe('completeNode', () => {
    it('adds to completedNodes', () => {
        const w = completeNode(world(), 'bw-2');
        expect(w.currentMap.completedNodes).toContain('bw-2');
    });
});

describe('unlockNode', () => {
    it('moves from locked to available', () => {
        const w = unlockNode(world(), 'bw-7');
        expect(w.currentMap.lockedNodes).not.toContain('bw-7');
        expect(w.currentMap.availableNodes).toContain('bw-7');
    });
});

describe('changeContinent', () => {
    // Pre-travel (2026-08-28) the catalogue was `[]`, so this function could
    // ONLY no-op and the test pinned that. The catalogue is real now.
    it('switches to a catalogued continent', () => {
        const w = changeContinent(world(), 'northern-continent');
        expect(w.currentContinent.name).toBe('northern-continent');
        expect(w.currentContinent.lockedMaps).toContain('beacon-crags');
    });

    it('writes the outgoing continent back into the catalogue before switching', () => {
        const w1 = completeMap(world(), 'breakwater');
        const w2 = changeContinent(w1, 'northern-continent');
        const coastal = w2.world.find(c => c.name === 'coastal-continent')!;
        expect(coastal.completedMaps).toContain('breakwater');
    });

    it('still no-ops for an uncatalogued continent (the labyrinth stays dev-only)', () => {
        const w = world();
        expect(changeContinent(w, 'labyrinth-continent')).toBe(w);
    });
});

describe('completeUniqueEvent', () => {
    it('returns unchanged when event id is unknown', () => {
        const w = world();
        const next = completeUniqueEvent(w, 'unknown-id');
        expect(next.currentMap.uniqueEvents).toEqual(w.currentMap.uniqueEvents);
    });
});

// ── D1 (2026-09-21) — frontier roaming and spent nodes ──────────────────────
//
// The ratified traversal doctrine, stated as behaviour: a resolved node is
// SPENT and cannot be re-entered; every unvisited node joined by an unblocked
// edge to ANY visited node is a legal destination, not merely the ones
// adjacent to where the player stands; and the boss becomes unavoidable only
// once the frontier runs out. Staged on the Breakwater (the new-game map):
// bw-1 (the windmill) fans out to bw-2..bw-5; bw-17 is the door fight and
// bw-18 the terminal door behind it.

/** Every node id on the Breakwater, in definition order. */
const allBreakwaterNodes = (): string[] => {
    const map = world().currentMap;
    return getMapDefinition(map.continent, map.name).nodes.map(n => n.id);
};

describe('D1 — the frontier', () => {
    it('opens with the start node\'s neighbours and nothing else', () => {
        const map = world().currentMap;
        // bw-1 (the windmill) opens on the four c1 landmarks.
        expect(frontierNodes(map)).toEqual(['bw-2', 'bw-3', 'bw-4', 'bw-5']);
        expect(legalMovesFrom(map)).toEqual(['bw-2', 'bw-3', 'bw-4', 'bw-5']);
        expect(isFrontierExhausted(map)).toBe(false);
        expect(isStranded(map)).toBe(false);
    });

    it('offers a lane hanging off a node the player left three moves ago', () => {
        // THE HEART OF D1. After taking bw-5 → bw-6 → bw-11, the lane bw-4 is
        // NOT adjacent to where the player stands — its edges run to bw-1,
        // bw-3, bw-5 and bw-10. Under the old adjacency rule it was gone for
        // the rest of the run. It now stays open because bw-5, which it
        // touches, has been visited.
        let w = world();
        w = advance(w, 'bw-5');
        w = advance(w, 'bw-6');
        w = advance(w, 'bw-11');

        expect(w.currentMap.currentNode).toBe('bw-11');
        // bw-4 shares no edge with the node the player stands on…
        const def = getMapDefinition(w.currentMap.continent, w.currentMap.name);
        expect(def.nodes.find(n => n.id === 'bw-11')!.connectedNodes).not.toContain('bw-4');
        // …and is offered anyway, because it touches the visited bw-5.
        expect(frontierNodes(w.currentMap)).toContain('bw-4');
        expect(legalMovesFrom(w.currentMap)).toContain('bw-4');

        // And the move itself is legal, not merely advertised.
        const roamed = moveToNode(w, 'bw-4');
        expect(roamed.currentMap.currentNode).toBe('bw-4');
        expect(roamed.currentMap.pendingArrival).toBe('bw-4');
    });

    it('spends a resolved node — it leaves the frontier and refuses re-entry', () => {
        let w = world();
        w = advance(w, 'bw-2');
        w = advance(w, 'bw-7');

        expect(isNodeSpent(w.currentMap, 'bw-2')).toBe(true);
        // bw-1 is deliberately absent: `advance` answers the node it arrives
        // at, and the player never answered the windmill before walking off
        // it. In play `resolveMapEvent` consumes the start node, which seals
        // it the same way — see the RESOLUTION-not-departure case below.
        expect(visitedNodes(w.currentMap).sort()).toEqual(['bw-2', 'bw-7']);
        expect(frontierNodes(w.currentMap)).not.toContain('bw-2');
        expect(() => moveToNode(w, 'bw-2')).toThrow(IllegalMoveError);
        expect(() => moveToNode(w, 'bw-2')).toThrow(/spent/);
    });

    it('spends a node on RESOLUTION, not on departure', () => {
        // Walking off a node without answering it leaves it unanswered, so it
        // drops back onto the frontier and can be returned to. Only
        // completing (or consuming) it seals it.
        let w = world();
        w = moveToNode(w, 'bw-2');          // arrive, do not resolve
        expect(isNodeSpent(w.currentMap, 'bw-1')).toBe(false);
        expect(frontierNodes(w.currentMap)).toContain('bw-1');
        w = completeCurrentNode(w);          // now resolve bw-2 and move on
        w = advance(w, 'bw-7');
        expect(frontierNodes(w.currentMap)).toContain('bw-1');
    });

    it('never re-farms a spent node: completing it twice is a no-op', () => {
        let w = world();
        w = advance(w, 'bw-2');
        const once = w.currentMap.completedNodes.filter(id => id === 'bw-2');
        w = completeNode(w, 'bw-2');
        expect(w.currentMap.completedNodes.filter(id => id === 'bw-2')).toEqual(once);
    });

    it('forces the boss only once the frontier is exhausted', () => {
        // Everything before the watchtower is spent. bw-17 (the door fight)
        // is the one thing left touching the explored region — the door
        // behind it (bw-18) hangs off bw-17 alone, so it is not on the
        // frontier yet.
        const spent = allBreakwaterNodes().filter(id => id !== 'bw-17' && id !== 'bw-18');
        const w = bwWorld({ currentNode: 'bw-16', completedNodes: spent });
        expect(frontierNodes(w.currentMap)).toEqual(['bw-17']);
        expect(legalMovesFrom(w.currentMap)).toEqual(['bw-17']);
        expect(isFrontierExhausted(w.currentMap)).toBe(false);

        // Up to that point the player was never cornered into it: two columns
        // earlier, three lanes were still open ahead of the boss's approach.
        const earlier = bwWorld({
            currentNode: 'bw-12',
            completedNodes: ['bw-1', 'bw-2', 'bw-3', 'bw-4', 'bw-5', 'bw-6', 'bw-7', 'bw-8', 'bw-9', 'bw-10', 'bw-11'],
        });
        expect(frontierNodes(earlier.currentMap).length).toBeGreaterThan(1);
        expect(frontierNodes(earlier.currentMap)).not.toContain('bw-17');
    });

    it('reports an exhausted frontier as the end of the walk, not a strand', () => {
        const everything = bwWorld({
            currentNode: 'bw-18',
            completedNodes: allBreakwaterNodes(),
        });
        expect(isFrontierExhausted(everything.currentMap)).toBe(true);
        expect(isStranded(everything.currentMap)).toBe(true);
        expect(legalMovesFrom(everything.currentMap)).toEqual([]);
    });
});

describe('D1 — blocked routes still block', () => {
    it('drops a node whose only approach is blocked off the frontier', () => {
        const w = world();
        const blocked = { ...w, currentMap: withBlockedRoute(w.currentMap, 'bw-1', 'bw-2', 'Test blockage') };
        // bw-2's only visited neighbour is the windmill; with that edge cut
        // it leaves the frontier.
        expect(frontierNodes(blocked.currentMap)).toEqual(['bw-3', 'bw-4', 'bw-5']);
        // And the refusal names the blockage rather than the frontier.
        expect(() => moveToNode(blocked, 'bw-2')).toThrow(/blocked — Test blockage/);

        // Cut every approach and the frontier is empty.
        let sealed = blocked.currentMap;
        for (const to of ['bw-3', 'bw-4', 'bw-5']) sealed = withBlockedRoute(sealed, 'bw-1', to, 'Test blockage');
        expect(frontierNodes(sealed)).toEqual([]);
        expect(isFrontierExhausted(sealed)).toBe(true);
    });

    it('keeps a node whose lane rib offers another approach', () => {
        // D1's lateral ribs earn their keep here: with bw-2's approach to
        // bw-8 collapsed, bw-8 is still reachable sideways from its visited
        // lane neighbour bw-7, so a hazard cannot orphan authored content.
        let w = world();
        w = advance(w, 'bw-2');
        w = advance(w, 'bw-7');
        const blocked = { ...w, currentMap: withBlockedRoute(w.currentMap, 'bw-2', 'bw-8', 'The quay gave way') };
        expect(frontierNodes(blocked.currentMap)).toContain('bw-8');
        expect(moveToNode(blocked, 'bw-8').currentMap.currentNode).toBe('bw-8');
    });
});

describe('D1 — the legacy unlock lists follow the frontier', () => {
    it('promotes every frontier node out of lockedNodes when a node is resolved', () => {
        let w = world();
        expect(w.currentMap.lockedNodes).toContain('bw-7');
        w = advance(w, 'bw-2');
        expect(w.currentMap.availableNodes).toContain('bw-7');
        expect(w.currentMap.lockedNodes).not.toContain('bw-7');
        // Everything still out of reach stays locked — the sync promotes the
        // frontier, not the map.
        expect(w.currentMap.lockedNodes).toContain('bw-17');
    });

    it('leaves a lane available after the player walks past it', () => {
        // The regression this guards: under the old unlock walk, a lane whose
        // column the player had moved beyond read as locked on the map even
        // though D1 makes it a legal destination.
        let w = world();
        w = advance(w, 'bw-5');
        w = advance(w, 'bw-6');
        w = advance(w, 'bw-11');
        for (const id of ['bw-4', 'bw-7']) {
            expect(w.currentMap.availableNodes, `${id} should stay offered`).toContain(id);
            expect(w.currentMap.lockedNodes, `${id} should not read as sealed`).not.toContain(id);
        }
    });
});
