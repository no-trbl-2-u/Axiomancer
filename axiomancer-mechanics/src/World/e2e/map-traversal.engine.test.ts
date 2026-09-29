/**
 * Map traversal invariants (2026-08-08 first-map audit).
 *
 * The gauntlet doctrine — completed nodes lock behind you, no back-travel —
 * makes map topology load-bearing for whether a run can finish at all. The
 * audit that produced this file found the then-first map (the Fishing
 * Village, purged in R3b) stranding players on eight different nodes, the
 * shortest strand four nodes deep. A stranded run is silent: the player is
 * alive, the map is unfinished, and the exploration screen has no glowing
 * node left to tap.
 *
 * These tests are the structural guard. `auditMapTraversal` walks EVERY legal
 * single-life route through a map definition; the invariant is that a route
 * only ever runs out of moves on an authored terminal node.
 */

import { describe, expect, it } from 'vitest';

import { MAP_REGISTRY } from '../map.registry';
import { auditMapTraversal, auditRouteCoverage, forwardEdges } from '../world.reducer';
import { northernForest } from '../Continents/Coastal-Village/maps';
import { caverns, northernCity, connectingRiver, townAcrossRiver, theCapital } from '../Continents/Northern-Continent/maps';
import type { MapDefinition } from '../types';

/** Every registered gauntlet map, flattened. Labyrinth maps are exempt. */
const GAUNTLET_MAPS: MapDefinition[] = Object.values(MAP_REGISTRY)
    .flatMap(maps => Object.values(maps))
    .filter((def): def is MapDefinition => def !== undefined && def.traversal !== 'labyrinth');

describe('gauntlet map traversal invariants', () => {
    it('registers the three coastal maps plus the seven northern maps as gauntlets', () => {
        expect(GAUNTLET_MAPS.map(d => d.name).sort()).toEqual([
            'beacon-crags', 'breakwater', 'caverns', 'charcoal-wood', 'connecting-river', 'lantern-deep',
            'northern-city', 'northern-forest', 'the-capital', 'town-across-river',
        ]);
    });

    for (const def of GAUNTLET_MAPS) {
        describe(def.name, () => {
            const audit = auditMapTraversal(def);

            it('never strands a run on a non-terminal node', () => {
                // A strand is a soft-lock. The message names the exact route so
                // a failure is actionable without re-running the audit by hand.
                const detail = audit.strands
                    .slice(0, 5)
                    .map(s => `  ${s.route.join(' -> ')}  (stuck at ${s.nodeId})`)
                    .join('\n');
                expect(
                    audit.strands.length,
                    `${def.name}: ${audit.strands.length} route(s) dead-end on a non-terminal node:\n${detail}`,
                ).toBe(0);
            });

            it('can reach every authored node from the start', () => {
                expect(audit.unreachableNodes).toEqual([]);
            });

            it('authors its terminal nodes in one final column', () => {
                // The end of the map is where the map says it ends: every
                // terminal node shares the highest x-coordinate on the grid.
                const maxX = Math.max(...def.nodes.map(n => n.location[0]));
                for (const id of audit.terminalNodes) {
                    const node = def.nodes.find(n => n.id === id)!;
                    expect(node.location[0], `${id} is terminal but not in the last column`).toBe(maxX);
                }
                expect(audit.terminalNodes.length).toBeGreaterThan(0);
            });

            it('runs every edge one column forward, or sideways between neighbouring lanes (D1)', () => {
                // THE LAYER LAW, 2026-09-21. The column law — every edge runs
                // from column x to x+1 — is what made strands structurally
                // impossible under the old gauntlet walk, and it still governs
                // the FORWARD SKELETON that both route audits measure. D1's
                // lateral lane ribs are the one permitted exception: an edge
                // may also run sideways WITHIN a column, between two lanes that
                // are neighbours in that column's y-order. A rib never skips or
                // reverses a column, so it cannot let a route miss a gate, and
                // it cannot re-open the soft-lock class this audit closed.
                const columnOf = new Map(def.nodes.map(n => [n.id, n.location[0]]));
                const rowOf = new Map(def.nodes.map(n => [n.id, n.location[1]]));
                // Per column, the lanes in y-order — a rib is legal only
                // between entries that are adjacent in this list.
                const lanes = new Map<number, number[]>();
                for (const node of def.nodes) {
                    const col = node.location[0];
                    lanes.set(col, [...(lanes.get(col) ?? []), node.location[1]].sort((a, b) => b - a));
                }
                for (const node of def.nodes) {
                    const here = columnOf.get(node.id)!;
                    for (const next of node.connectedNodes) {
                        const there = columnOf.get(next);
                        expect(there, `${node.id} -> ${next}: unknown node`).toBeDefined();
                        if (there === here + 1) continue;
                        expect(
                            there,
                            `${node.id} -> ${next} must run one column forward or stay in column ${here}`,
                        ).toBe(here);
                        const order = lanes.get(here)!;
                        const gap = Math.abs(order.indexOf(rowOf.get(node.id)!) - order.indexOf(rowOf.get(next)!));
                        expect(
                            gap,
                            `${node.id} -> ${next} is a lateral rib across ${gap} lanes; ribs join NEIGHBOURING lanes only`,
                        ).toBe(1);
                    }
                }
            });

            it('keeps the terminal column free of lateral ribs', () => {
                // A rib in the last column would give a terminal node an
                // outgoing edge, and `connectedNodes: []` is how several
                // per-map tests (and mobile's map legend) recognise the
                // authored end of a map.
                const maxX = Math.max(...def.nodes.map(n => n.location[0]));
                for (const node of def.nodes.filter(n => n.location[0] === maxX)) {
                    expect(node.connectedNodes, `${node.id} is in the terminal column`).toEqual([]);
                }
            });

            it('gives every multi-node column a walkable lane chain (D1)', () => {
                // The ribs are what turn a column of parallel rungs into a
                // place the player can move along. Every non-terminal column
                // with more than one node must be connected sideways end to
                // end, or one of its lanes is only reachable through the
                // column before it — exactly the fragility a blocked route
                // turns into orphaned content.
                const maxX = Math.max(...def.nodes.map(n => n.location[0]));
                const byColumn = new Map<number, string[]>();
                for (const node of def.nodes) {
                    byColumn.set(node.location[0], [...(byColumn.get(node.location[0]) ?? []), node.id]);
                }
                const edgesOf = (id: string): readonly string[] =>
                    def.nodes.find(n => n.id === id)?.connectedNodes ?? [];
                for (const [col, members] of byColumn) {
                    if (col === maxX || members.length < 2) continue;
                    const inColumn = new Set<string>(members);
                    const seen = new Set<string>([members[0]]);
                    const queue = [members[0]];
                    while (queue.length > 0) {
                        const cur = queue.shift()!;
                        const touching = [
                            ...edgesOf(cur).filter(id => inColumn.has(id)),
                            ...members.filter(id => edgesOf(id).includes(cur)),
                        ];
                        for (const id of touching) {
                            if (seen.has(id)) continue;
                            seen.add(id);
                            queue.push(id);
                        }
                    }
                    expect(seen.size, `${def.name} column ${col} is not laterally connected`).toBe(members.length);
                }
            });

            it('gives every node a distinct grid coordinate', () => {
                // Two nodes on one coordinate render stacked on the map canvas.
                const seen = new Map<string, string>();
                for (const node of def.nodes) {
                    const key = node.location.join(',');
                    expect(seen.get(key), `${node.id} shares [${key}] with ${seen.get(key)}`).toBeUndefined();
                    seen.set(key, node.id);
                }
            });

            it('offers a real choice at every branch (no single-file corridors)', () => {
                // A column of one is a deliberate chokepoint (the start, a
                // boss, a door) — a map made only of them is not a map. The
                // tolerance is 3: an Act 1 map opens on its arrival and ends
                // on its door fight and its door, each alone in its column.
                const widths = new Map<number, number>();
                for (const node of def.nodes) {
                    widths.set(node.location[0], (widths.get(node.location[0]) ?? 0) + 1);
                }
                const branching = [...widths.values()].filter(w => w > 1).length;
                // Phase W3/W4/W5 — caverns, northern-city, connecting-river,
                // town-across-river, and the-capital all tolerate a FOURTH
                // singleton: arrival, quest-giver/npc, boss/pre-boss
                // convergence, and the door column the travel phase
                // appended past the boss (the door is a chokepoint by
                // design, exactly like the boss it follows). the-capital
                // additionally narrows a pre-boss convergence column
                // (cap-8) to a singleton on purpose — the court-convenes
                // narration is the guaranteed final beat before the climax.
                const FOUR_SINGLETON_MAPS = [
                    'caverns', 'northern-city', 'connecting-river',
                    'town-across-river', 'the-capital',
                ];
                const singletonTolerance = FOUR_SINGLETON_MAPS.includes(def.name) ? 4 : 3;
                expect(branching).toBeGreaterThanOrEqual(widths.size - singletonTolerance);
            });
        });
    }
});

describe('northern-forest', () => {
    it('ends at the cave mouth the get-to-cave quest reaches for', () => {
        const nf10 = northernForest.nodes.find(n => n.id === 'nf-10')!;
        expect(nf10.connectedNodes).toEqual([]);
        const maxX = Math.max(...northernForest.nodes.map(n => n.location[0]));
        expect(nf10.location[0]).toBe(maxX);
    });
});

describe('caverns — first map of the northern continent (2026-08-28)', () => {
    const audit = auditMapTraversal(caverns);
    const coverage = auditRouteCoverage(caverns);

    it('guarantees the arrival, the Delver, the Under-Gate boss, and the door on every route', () => {
        // The deliberate singleton columns — the same shape the village
        // settled on: the premise (nc-2, the quest-giver), the climax
        // (nc-25), and — Phase W3 — the door up to the city (nc-26) are
        // structural, never a coin flip.
        expect(coverage.shareOfRoutes['nc-1']).toBe(1);
        expect(coverage.shareOfRoutes['nc-2']).toBe(1);
        expect(coverage.shareOfRoutes['nc-25']).toBe(1);
        expect(coverage.shareOfRoutes['nc-26']).toBe(1);
    });

    it('walks a full eleven-beat run every time, strand-free', () => {
        // Phase W3 added the door column: 10 → 11 beats.
        expect(audit.longestRoute).toBe(11);
        expect(audit.strands).toEqual([]);
        expect(audit.unreachableNodes).toEqual([]);
    });

    it('ends at the door alone — every run leaves through the Under-Gate (Phase W3)', () => {
        // The boss is no longer terminal: nc-26, one column past it, is
        // the travel door to northern-city (the bw-18 pattern — the way
        // out opens only after the climax).
        expect(audit.terminalNodes).toEqual(['nc-26']);
        const boss = caverns.nodes.find(n => n.id === 'nc-25')!;
        expect(boss.connectedNodes).toEqual(['nc-26']);
    });
});

describe('northern-city — map 2 of the northern continent (Phase W3)', () => {
    const audit = auditMapTraversal(northernCity);
    const coverage = auditRouteCoverage(northernCity);

    it('guarantees the arrival, the Gate-Clerk, the Harbormaster, and the door on every route', () => {
        // The four deliberate singleton columns, the settled shape: the
        // city's first face (ncy-2), the climax (ncy-25), and — Phase W4 —
        // the water-gate door (ncy-26) are structural, never a coin flip.
        expect(coverage.shareOfRoutes['ncy-1']).toBe(1);
        expect(coverage.shareOfRoutes['ncy-2']).toBe(1);
        expect(coverage.shareOfRoutes['ncy-25']).toBe(1);
        expect(coverage.shareOfRoutes['ncy-26']).toBe(1);
    });

    it('walks a full eleven-beat run every time, strand-free', () => {
        // Phase W4 added the door column: 10 → 11 beats.
        expect(audit.longestRoute).toBe(11);
        expect(audit.strands).toEqual([]);
        expect(audit.unreachableNodes).toEqual([]);
    });

    it('ends at the door alone — every run leaves through the water-gate (Phase W4)', () => {
        // The boss is no longer terminal: ncy-26, one column past it, is
        // the travel door to connecting-river (the nc-26 pattern — the way
        // out opens only after the climax). ncy-23 stays sealed scenery.
        expect(audit.terminalNodes).toEqual(['ncy-26']);
        const boss = northernCity.nodes.find(n => n.id === 'ncy-25')!;
        expect(boss.connectedNodes).toEqual(['ncy-26']);
        const seam = northernCity.nodes.find(n => n.id === 'ncy-23')!;
        expect(seam.location[0]).toBe(8);
        // Forward skeleton, not raw edges — D1 gave ncy-23 a lateral rib to
        // its lane neighbour, which is traversal, not progression.
        expect(forwardEdges(northernCity).get('ncy-23')).toEqual(['ncy-25']);
    });
});

describe('connecting-river — map 3 of the northern continent (Phase W4)', () => {
    const audit = auditMapTraversal(connectingRiver);
    const coverage = auditRouteCoverage(connectingRiver);

    it('guarantees the arrival, the Boatwoman, the Waterreeve, and the door on every route', () => {
        expect(coverage.shareOfRoutes['cr-1']).toBe(1);
        expect(coverage.shareOfRoutes['cr-2']).toBe(1);
        expect(coverage.shareOfRoutes['cr-12']).toBe(1);
        expect(coverage.shareOfRoutes['cr-13']).toBe(1);
    });

    it('walks a full seven-beat run every time, strand-free', () => {
        expect(audit.longestRoute).toBe(7);
        expect(audit.strands).toEqual([]);
        expect(audit.unreachableNodes).toEqual([]);
    });

    it('ends at the door alone — every run leaves through the water-gate', () => {
        expect(audit.terminalNodes).toEqual(['cr-13']);
        const boss = connectingRiver.nodes.find(n => n.id === 'cr-12')!;
        expect(boss.connectedNodes).toEqual(['cr-13']);
    });
});

describe('town-across-river — map 4 of the northern continent (Phase W4)', () => {
    const audit = auditMapTraversal(townAcrossRiver);
    const coverage = auditRouteCoverage(townAcrossRiver);

    it('guarantees the arrival, the Sweetheart, the Portreeve, and the door on every route', () => {
        expect(coverage.shareOfRoutes['tar-1']).toBe(1);
        expect(coverage.shareOfRoutes['tar-2']).toBe(1);
        expect(coverage.shareOfRoutes['tar-6']).toBe(1);
        expect(coverage.shareOfRoutes['tar-7']).toBe(1);
    });

    it('walks a full five-beat run every time, strand-free', () => {
        // Phase W5 added the door column: 4 → 5 beats.
        expect(audit.longestRoute).toBe(5);
        expect(audit.strands).toEqual([]);
        expect(audit.unreachableNodes).toEqual([]);
    });

    it('ends at the door alone — every run leaves through the ribbon-road (Phase W5)', () => {
        // The boss is no longer terminal: tar-7, one column past it, is
        // the travel door to the-capital (the nc-26 pattern — the way out
        // opens only after the climax).
        expect(audit.terminalNodes).toEqual(['tar-7']);
        const boss = townAcrossRiver.nodes.find(n => n.id === 'tar-6')!;
        expect(boss.connectedNodes).toEqual(['tar-7']);
    });
});

describe('the-capital — map 5 of the northern continent (Phase W5)', () => {
    const audit = auditMapTraversal(theCapital);
    const coverage = auditRouteCoverage(theCapital);

    it('guarantees the arrival, the Herald, the court, and the Factor on every route', () => {
        expect(coverage.shareOfRoutes['cap-1']).toBe(1);
        expect(coverage.shareOfRoutes['cap-2']).toBe(1);
        expect(coverage.shareOfRoutes['cap-8']).toBe(1);
        expect(coverage.shareOfRoutes['cap-9']).toBe(1);
    });

    it('walks a full six-beat run every time, strand-free', () => {
        expect(audit.longestRoute).toBe(6);
        expect(audit.strands).toEqual([]);
        expect(audit.unreachableNodes).toEqual([]);
    });

    it('ends at the Factor alone — no door onward yet', () => {
        // The next continent is not shipped; the-capital is the current
        // frontier, same shape town-across-river had before Phase W5.
        expect(audit.terminalNodes).toEqual(['cap-9']);
    });
});
