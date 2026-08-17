/**
 * Map traversal invariants (2026-08-08 first-map audit).
 *
 * The gauntlet doctrine — completed nodes lock behind you, no back-travel —
 * makes map topology load-bearing for whether a run can finish at all. The
 * audit that produced this file found the shipped Fishing Village stranding
 * players on eight different nodes, the shortest strand four nodes deep
 * (fv-1 -> fv-11 -> fv-14 -> fv-15). A stranded run is silent: the player is
 * alive, the map is unfinished, and the exploration screen has no glowing
 * node left to tap.
 *
 * These tests are the structural guard. `auditMapTraversal` walks EVERY legal
 * single-life route through a map definition; the invariant is that a route
 * only ever runs out of moves on an authored terminal node.
 */

import { describe, expect, it } from 'vitest';

import { MAP_REGISTRY } from '../map.registry';
import { auditMapTraversal, auditRouteCoverage } from '../world.reducer';
import { fishingVillage, northernForest } from '../Continents/Coastal-Village/maps';
import type { MapDefinition } from '../types';

/** Every registered gauntlet map, flattened. Labyrinth maps are exempt. */
const GAUNTLET_MAPS: MapDefinition[] = Object.values(MAP_REGISTRY)
    .flatMap(maps => Object.values(maps))
    .filter((def): def is MapDefinition => def !== undefined && def.traversal !== 'labyrinth');

describe('gauntlet map traversal invariants', () => {
    it('registers at least the two coastal maps as gauntlets', () => {
        expect(GAUNTLET_MAPS.map(d => d.name).sort()).toEqual(['fishing-village', 'northern-forest']);
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

            it('runs every edge strictly forward by one column', () => {
                // The column law is what makes strands structurally impossible:
                // a route visits exactly one node per column and can never
                // revisit one, so a node's forward neighbours can never already
                // be completed. Any edge that skips or reverses a column
                // re-opens the soft-lock class this audit closed.
                const columnOf = new Map(def.nodes.map(n => [n.id, n.location[0]]));
                for (const node of def.nodes) {
                    for (const next of node.connectedNodes) {
                        expect(
                            columnOf.get(next),
                            `${node.id} -> ${next} must run from column ${columnOf.get(node.id)} to the next`,
                        ).toBe(columnOf.get(node.id)! + 1);
                    }
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
                // boss, and — as of Phase 53c — fishing-village's
                // quest-giver spine node) — a map made only of them is not
                // a map. The tolerance is 3, not 2: Phase 53c intentionally
                // added a third guaranteed-reachable chokepoint (fv-2, Old
                // Marrow) so the quest premise is never a coin flip. That's
                // a deliberate design choice, re-verified explicitly below
                // for fishing-village rather than left to this generic
                // headroom alone.
                const widths = new Map<number, number>();
                for (const node of def.nodes) {
                    widths.set(node.location[0], (widths.get(node.location[0]) ?? 0) + 1);
                }
                const branching = [...widths.values()].filter(w => w > 1).length;
                expect(branching).toBeGreaterThanOrEqual(widths.size - 3);
            });
        });
    }
});

describe('fishing-village — the first map the player ever walks', () => {
    const audit = auditMapTraversal(fishingVillage);

    it('routes every run through the breakwater boss', () => {
        // fv-6 is alone in its column, so no route can skip the region
        // climax. Pre-audit, 17% of routes never reached it.
        const bossColumn = fishingVillage.nodes.find(n => n.id === 'fv-6')!.location[0];
        const sameColumn = fishingVillage.nodes.filter(n => n.location[0] === bossColumn);
        expect(sameColumn.map(n => n.id)).toEqual(['fv-6']);
    });

    it('makes the boss and the quest board co-reachable in one life', () => {
        // The headline audit finding: across all 260 pre-audit routes, the
        // quest-board node (fv-15, "build the boat") and the boss were never
        // both reachable, and reaching fv-15 at all ended the run on the spot.
        const questColumn = fishingVillage.nodes.find(n => n.id === 'fv-15')!.location[0];
        const bossColumn = fishingVillage.nodes.find(n => n.id === 'fv-6')!.location[0];
        expect(questColumn).toBeLessThan(bossColumn);
        expect(fishingVillage.nodes.find(n => n.id === 'fv-15')!.connectedNodes).toContain('fv-6');
    });

    it('lets every route rest immediately before the boss', () => {
        // fv-20 is the pre-boss rest; every node in the column before it
        // opens onto it, so no route is forced into the climax unhealed.
        const restColumn = fishingVillage.nodes.find(n => n.id === 'fv-20')!.location[0];
        const priorColumn = fishingVillage.nodes.filter(n => n.location[0] === restColumn - 1);
        expect(priorColumn.length).toBeGreaterThan(0);
        for (const node of priorColumn) {
            expect(node.connectedNodes, `${node.id} cannot reach the pre-boss rest`).toContain('fv-20');
        }
    });

    it('keeps the spine fv-1..fv-10 on y=0 (Phase 65 D1)', () => {
        for (let i = 1; i <= 10; i++) {
            const node = fishingVillage.nodes.find(n => n.id === `fv-${i}`)!;
            expect(node.location[1], `fv-${i} should be on the spine`).toBe(0);
            expect(node.location[0], `fv-${i} should sit in column ${i - 1}`).toBe(i - 1);
        }
    });

    it('walks a full ten-beat run every time', () => {
        // One node per column, ten columns. Every route is the same length,
        // which is what makes the 25-node map a set of three real lanes
        // rather than a maze with good and bad exits.
        expect(audit.longestRoute).toBe(10);
        expect(audit.strands).toEqual([]);
    });

    it('narrows column 1 to Old Marrow alone (Phase 53c)', () => {
        // fv-2 is now fishing-village's third forced-singleton column
        // (with fv-1 and fv-6) — deliberately, so the quest-giver is
        // guaranteed rather than a coin flip. fv-12 and fv-13, displaced
        // from column 1, must not have quietly become a fourth.
        const widths = new Map<number, number>();
        for (const node of fishingVillage.nodes) {
            widths.set(node.location[0], (widths.get(node.location[0]) ?? 0) + 1);
        }
        const singletonColumns = [...widths.entries()].filter(([, w]) => w === 1).map(([x]) => x);
        expect(singletonColumns.sort((a, b) => a - b)).toEqual([0, 1, 5]);
    });
});

describe('fishing-village — narrative coverage floor (Phase 53c)', () => {
    // The first-map audit's headline finding: before this phase, only
    // fv-1 (arrival) and fv-6 (boss) sat on 100% of legal routes, and the
    // quest-giver who starts `starting-quest` had no node at all. This is
    // the floor that stops load-bearing narrative from silently landing on
    // a coin-flip lane again — each node named below is asserted, not
    // assumed.
    const coverage = auditRouteCoverage(fishingVillage);

    it('guarantees the arrival, the quest-giver, and the boss on every legal route', () => {
        expect(coverage.shareOfRoutes['fv-1']).toBe(1);
        expect(coverage.shareOfRoutes['fv-2']).toBe(1);
        expect(coverage.shareOfRoutes['fv-6']).toBe(1);
    });

    it('measures the quest board rather than assuming it', () => {
        // fv-15 ("build the boat") stays off the spine on purpose — see
        // Phase 53c's brief, Follow-ups: moving it to 100% is a design
        // question for 46a/46c, which own the early-game. This asserts the
        // actual number so a future re-layer can't silently change it
        // without a test noticing.
        expect(coverage.shareOfRoutes['fv-15']).toBeCloseTo(1 / 3, 2);
    });
});

describe('northern-forest', () => {
    it('ends at the cave mouth the get-to-cave quest reaches for', () => {
        const nf10 = northernForest.nodes.find(n => n.id === 'nf-10')!;
        expect(nf10.connectedNodes).toEqual([]);
        const maxX = Math.max(...northernForest.nodes.map(n => n.location[0]));
        expect(nf10.location[0]).toBe(maxX);
    });
});
