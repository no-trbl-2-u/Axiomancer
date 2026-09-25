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

const world = () => createStartingWorld();

/** Test fixture: block the route between two nodes (either direction). The
 *  engine's own blocker (`blockMapRoute`) was deleted in TRIM THE FAT T2a;
 *  movement still honours `MapState.blockedRoutes`, which this writes. */
const withBlockedRoute = (map: MapState, from: string, to: string, reason: string): MapState => ({
    ...map,
    blockedRoutes: [...map.blockedRoutes, { from, to, reason }],
});

/** A fishing-village world with the runtime map fields overridden. */
const fvWorld = (patch: Partial<MapState>): WorldState => {
    const w = createStartingWorld();
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
        expect(northern.lockedMaps).toContain('caverns');
        expect(northern.availableMaps).toEqual([]);
    });
});

describe('completeMap', () => {
    it('adds to completedMaps', () => {
        const w = completeMap(world(), 'fishing-village');
        expect(w.currentContinent.completedMaps).toContain('fishing-village');
    });
    it('idempotent', () => {
        const w1 = completeMap(world(), 'fishing-village');
        const w2 = completeMap(w1, 'fishing-village');
        expect(w2.currentContinent.completedMaps.filter(m => m === 'fishing-village')).toHaveLength(1);
    });
});

describe('unlockMap', () => {
    it('moves from locked to available', () => {
        const w = unlockMap(world(), 'northern-forest');
        expect(w.currentContinent.lockedMaps).not.toContain('northern-forest');
        expect(w.currentContinent.availableMaps).toContain('northern-forest');
    });
    it('idempotent if already available', () => {
        const w1 = unlockMap(world(), 'northern-forest');
        const w2 = unlockMap(w1, 'northern-forest');
        expect(w2).toBe(w1);
    });
});

describe('completeNode', () => {
    it('adds to completedNodes', () => {
        const w = completeNode(world(), 'fv-2');
        expect(w.currentMap.completedNodes).toContain('fv-2');
    });
});

describe('unlockNode', () => {
    it('moves from locked to available', () => {
        const w = unlockNode(world(), 'fv-3');
        expect(w.currentMap.lockedNodes).not.toContain('fv-3');
        expect(w.currentMap.availableNodes).toContain('fv-3');
    });
});

describe('changeContinent', () => {
    // Pre-travel (2026-08-28) the catalogue was `[]`, so this function could
    // ONLY no-op and the test pinned that. The catalogue is real now.
    it('switches to a catalogued continent', () => {
        const w = changeContinent(world(), 'northern-continent');
        expect(w.currentContinent.name).toBe('northern-continent');
        expect(w.currentContinent.lockedMaps).toContain('caverns');
    });

    it('writes the outgoing continent back into the catalogue before switching', () => {
        const w1 = completeMap(world(), 'fishing-village');
        const w2 = changeContinent(w1, 'northern-continent');
        const coastal = w2.world.find(c => c.name === 'coastal-continent')!;
        expect(coastal.completedMaps).toContain('fishing-village');
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
// once the frontier runs out.

describe('D1 — the frontier', () => {
    it('opens with the start node\'s neighbours and nothing else', () => {
        const map = world().currentMap;
        // fv-1 is a singleton column with one way onward.
        expect(frontierNodes(map)).toEqual(['fv-2']);
        expect(legalMovesFrom(map)).toEqual(['fv-2']);
        expect(isFrontierExhausted(map)).toBe(false);
        expect(isStranded(map)).toBe(false);
    });

    it('offers a lane hanging off a node the player left three moves ago', () => {
        // THE HEART OF D1. After clearing the first gate (fv-26) and taking
        // the wharf lane (fv-16), the inland lane fv-11 is NOT adjacent to
        // where the player stands — its only edges run to fv-26, fv-27 and
        // its lane neighbour fv-3. Under the old adjacency rule it was gone
        // for the rest of the run. It now stays open because fv-26, which it
        // touches, has been visited.
        let w = world();
        w = advance(w, 'fv-2');
        w = advance(w, 'fv-26');
        w = advance(w, 'fv-16');

        expect(w.currentMap.currentNode).toBe('fv-16');
        // fv-11 shares no edge with the node the player stands on…
        const def = getMapDefinition(w.currentMap.continent, w.currentMap.name);
        expect(def.nodes.find(n => n.id === 'fv-16')!.connectedNodes).not.toContain('fv-11');
        // …and is offered anyway, because it touches the visited fv-26.
        expect(frontierNodes(w.currentMap)).toContain('fv-11');
        expect(legalMovesFrom(w.currentMap)).toContain('fv-11');

        // And the move itself is legal, not merely advertised.
        const roamed = moveToNode(w, 'fv-11');
        expect(roamed.currentMap.currentNode).toBe('fv-11');
        expect(roamed.currentMap.pendingArrival).toBe('fv-11');
    });

    it('spends a resolved node — it leaves the frontier and refuses re-entry', () => {
        let w = world();
        w = advance(w, 'fv-2');
        w = advance(w, 'fv-26');

        expect(isNodeSpent(w.currentMap, 'fv-2')).toBe(true);
        // fv-1 is deliberately absent: `advance` answers the node it arrives
        // at, and the player never answered the shore before walking off it.
        // In play `resolveMapEvent` consumes the start node, which seals it
        // the same way — see the RESOLUTION-not-departure case below.
        expect(visitedNodes(w.currentMap).sort()).toEqual(['fv-2', 'fv-26']);
        expect(frontierNodes(w.currentMap)).not.toContain('fv-2');
        expect(() => moveToNode(w, 'fv-2')).toThrow(IllegalMoveError);
        expect(() => moveToNode(w, 'fv-2')).toThrow(/spent/);
    });

    it('spends a node on RESOLUTION, not on departure', () => {
        // Walking off a node without answering it leaves it unanswered, so it
        // drops back onto the frontier and can be returned to. Only
        // completing (or consuming) it seals it.
        let w = world();
        w = moveToNode(w, 'fv-2');          // arrive, do not resolve
        expect(isNodeSpent(w.currentMap, 'fv-1')).toBe(false);
        expect(frontierNodes(w.currentMap)).toContain('fv-1');
        w = completeCurrentNode(w);          // now resolve fv-2 and move on
        w = advance(w, 'fv-26');
        expect(frontierNodes(w.currentMap)).toContain('fv-1');
    });

    it('never re-farms a spent node: completing it twice is a no-op', () => {
        let w = world();
        w = advance(w, 'fv-2');
        const once = w.currentMap.completedNodes.filter(id => id === 'fv-2');
        w = completeNode(w, 'fv-2');
        expect(w.currentMap.completedNodes.filter(id => id === 'fv-2')).toEqual(once);
    });

    it('forces the boss only once the frontier is exhausted', () => {
        // Everything up to and including the third gate's lane column is
        // spent. fv-6 (the breakwater) is the one thing left touching the
        // explored region — the post-boss columns hang off fv-6 alone, so
        // they are not on the frontier yet.
        const spent = [
            'fv-1', 'fv-2', 'fv-26', 'fv-16', 'fv-3', 'fv-11', 'fv-27',
            'fv-17', 'fv-4', 'fv-14', 'fv-12', 'fv-13', 'fv-28',
            'fv-15', 'fv-5', 'fv-20',
        ];
        const w = fvWorld({ currentNode: 'fv-20', completedNodes: spent });
        expect(frontierNodes(w.currentMap)).toEqual(['fv-6']);
        expect(legalMovesFrom(w.currentMap)).toEqual(['fv-6']);
        expect(isFrontierExhausted(w.currentMap)).toBe(false);

        // Up to that point the player was never cornered into it: one column
        // earlier, three lanes were still open beside the boss's approach.
        const earlier = fvWorld({
            currentNode: 'fv-28',
            completedNodes: ['fv-1', 'fv-2', 'fv-26', 'fv-16', 'fv-3', 'fv-11', 'fv-27', 'fv-4'],
        });
        expect(frontierNodes(earlier.currentMap).length).toBeGreaterThan(1);
        expect(frontierNodes(earlier.currentMap)).not.toContain('fv-6');
    });

    it('reports an exhausted frontier as the end of the walk, not a strand', () => {
        const everything = fvWorld({
            currentNode: 'fv-10',
            completedNodes: createStartingWorld().currentMap.lockedNodes.concat(['fv-1', 'fv-2']),
        });
        expect(isFrontierExhausted(everything.currentMap)).toBe(true);
        expect(isStranded(everything.currentMap)).toBe(true);
        expect(legalMovesFrom(everything.currentMap)).toEqual([]);
    });
});

describe('D1 — blocked routes still block', () => {
    it('drops a node whose only approach is blocked off the frontier', () => {
        const w = world();
        const blocked = { ...w, currentMap: withBlockedRoute(w.currentMap, 'fv-1', 'fv-2', 'Test blockage') };
        expect(frontierNodes(blocked.currentMap)).toEqual([]);
        expect(isFrontierExhausted(blocked.currentMap)).toBe(true);
        // And the refusal names the blockage rather than the frontier.
        expect(() => moveToNode(blocked, 'fv-2')).toThrow(/blocked — Test blockage/);
    });

    it('keeps a node whose lane rib offers another approach', () => {
        // D1's lateral ribs earn their keep here: with the gate's approach to
        // fv-3 collapsed, fv-3 is still reachable sideways from its visited
        // lane neighbour fv-16, so a hazard cannot orphan authored content.
        let w = world();
        w = advance(w, 'fv-2');
        w = advance(w, 'fv-26');
        w = advance(w, 'fv-16');
        const blocked = { ...w, currentMap: withBlockedRoute(w.currentMap, 'fv-26', 'fv-3', 'The tide-line gave way') };
        expect(frontierNodes(blocked.currentMap)).toContain('fv-3');
        expect(moveToNode(blocked, 'fv-3').currentMap.currentNode).toBe('fv-3');
    });
});

describe('D1 — the legacy unlock lists follow the frontier', () => {
    it('promotes every frontier node out of lockedNodes when a node is resolved', () => {
        let w = world();
        expect(w.currentMap.lockedNodes).toContain('fv-26');
        w = advance(w, 'fv-2');
        expect(w.currentMap.availableNodes).toContain('fv-26');
        expect(w.currentMap.lockedNodes).not.toContain('fv-26');
        // Everything still out of reach stays locked — the sync promotes the
        // frontier, not the map.
        expect(w.currentMap.lockedNodes).toContain('fv-6');
    });

    it('leaves a lane available after the player walks past it', () => {
        // The regression this guards: under the old unlock walk, a lane whose
        // column the player had moved beyond read as locked on the map even
        // though D1 makes it a legal destination.
        let w = world();
        w = advance(w, 'fv-2');
        w = advance(w, 'fv-26');
        w = advance(w, 'fv-16');
        for (const id of ['fv-3', 'fv-11']) {
            expect(w.currentMap.availableNodes, `${id} should stay offered`).toContain(id);
            expect(w.currentMap.lockedNodes, `${id} should not read as sealed`).not.toContain(id);
        }
    });
});
