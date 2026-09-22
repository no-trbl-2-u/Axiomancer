/**
 * Hermetic presenter tests — what the exploration chart has to SAY after D1.
 *
 * Wave 1 changed the rules underneath this presenter in two ways it could
 * not absorb silently:
 *
 *   1. `legalMovesFrom` became the FRONTIER (`world.reducer.ts`), so a node
 *      the player has resolved is no longer a legal destination. The
 *      presenter's `classifyNode` had exactly three ways to say "not a
 *      destination" and only one of them was true.
 *   2. 69 LATERAL LANE RIBS landed across the seven maps. They are traversal,
 *      not progression — the engine's own route audits walk the forward
 *      skeleton and ignore them — and the canvas has to draw that difference
 *      or a branching map reads as a tangle.
 *
 * Neither is a cosmetic question, which is why these live beside the engine
 * facts rather than in a snapshot.
 */

import { describe, it, expect } from '@jest/globals';
import { getMapDefinition, forwardEdges } from '@mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createAppStore } from '@/state/store';
import { createAppActions } from '@/state/actions';
import {
    selectExplorationViewModel,
    MAP_LEGEND_KEYS,
    MAP_LEGEND_LEFT,
} from '@/state/presenters/exploration.engine';

const freshStore = () => createAppStore({ adapter: createMemoryAdapter() });

// ---------------------------------------------------------------------------
// D1 — SPENT IS NOT SEALED
// ---------------------------------------------------------------------------

/**
 * `isNodeSpent()` is `completedNodes ∪ consumedNodes`, and the two lists are
 * written by different verbs: `completeNode` and `markNodeConsumed`. Mobile
 * exercises both — `moveToAction` completes, `resolveMapEvent`'s follow-up
 * consumes — and a rest / treasure / quest / gathering node resolved without
 * a completion lands in `consumedNodes` alone.
 *
 * The presenter used to test `completedNodes` by itself. Once D1 took spent
 * nodes out of the frontier, such a node matched neither `completed` nor
 * `available`, fell through to `locked`, and was drawn SEALED — counted in
 * the legend's "N sealed" and announced to a screen reader as sealed — when
 * the player had in fact walked it and answered it.
 */
describe('D1: a consumed node reads as TRODDEN, never as SEALED', () => {
    /** Put `nodeId` in `consumedNodes` ONLY, leaving `completedNodes` alone. */
    const consumeOnly = (store: ReturnType<typeof freshStore>, nodeId: string) => {
        const world = (store.getState() as any).world;
        store.setState({
            world: {
                ...world,
                currentMap: {
                    ...world.currentMap,
                    consumedNodes: [...(world.currentMap.consumedNodes ?? []), nodeId],
                    completedNodes: (world.currentMap.completedNodes as string[])
                        .filter((id: string) => id !== nodeId),
                },
            },
        } as any);
    };

    it('classifies a consumed-but-not-completed node as completed', () => {
        const store = freshStore();
        const actions = createAppActions(store);
        actions.moveTo('fv-2');
        actions.moveTo('fv-26');

        // fv-1 is the shore the player woke on and has now left behind.
        consumeOnly(store, 'fv-1');

        const vm = selectExplorationViewModel(store.getState());
        const fv1 = vm.nodes.find((n) => n.id === 'fv-1');
        expect(fv1).toBeDefined();
        // THE REGRESSION: this read 'locked' before the spent union landed.
        expect(fv1!.kind).toBe('completed');
    });

    it('keeps the engine and the screen agreeing on what is still shut', () => {
        const store = freshStore();
        const actions = createAppActions(store);
        actions.moveTo('fv-2');
        consumeOnly(store, 'fv-1');

        const vm = selectExplorationViewModel(store.getState());
        // A node the player resolved is not a legal destination, but it is
        // also not sealed — those are different sentences and the chart now
        // draws them differently.
        expect(vm.nodes.filter((n) => n.kind === 'locked').map((n) => n.id)).not.toContain('fv-1');
        expect(vm.options.map((o) => o.nodeId)).not.toContain('fv-1');
    });

    it('stops the legend counting a walked node among the sealed', () => {
        const store = freshStore();
        const actions = createAppActions(store);
        actions.moveTo('fv-2');

        const before = selectExplorationViewModel(store.getState());
        const sealedBefore = before.nodes.filter((n) => n.kind === 'locked').length;

        consumeOnly(store, 'fv-1');
        const after = selectExplorationViewModel(store.getState());
        const sealedAfter = after.nodes.filter((n) => n.kind === 'locked').length;

        // Resolving a node can only ever REMOVE it from the sealed tally.
        expect(sealedAfter).toBeLessThanOrEqual(sealedBefore);
        // And the counter keeps agreeing with the pips it sits beside (BUG-01).
        expect(after.legend.right).toBe(`${after.nodes.length} nodes · ${sealedAfter} sealed`);
    });

    it('marks a road travelled once BOTH its ends are spent, by either list', () => {
        const store = freshStore();
        const actions = createAppActions(store);
        actions.moveTo('fv-2');
        actions.moveTo('fv-26');
        consumeOnly(store, 'fv-1');

        const vm = selectExplorationViewModel(store.getState());
        const fv1fv2 = vm.edges.find(
            (e) => (e.fromId === 'fv-1' && e.toId === 'fv-2') || (e.fromId === 'fv-2' && e.toId === 'fv-1'),
        );
        expect(fv1fv2).toBeDefined();
        expect(fv1fv2!.traveled).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// D1 — LATERAL LANE RIBS
// ---------------------------------------------------------------------------

describe('D1: the chart separates lateral ribs from forward roads', () => {
    const vmEdges = () => selectExplorationViewModel(freshStore().getState()).edges;

    it('finds ribs on the starting map at all', () => {
        // Guards against the flag silently defaulting to false everywhere,
        // which would make every assertion below vacuous.
        expect(vmEdges().some((e) => e.lateral)).toBe(true);
        expect(vmEdges().some((e) => !e.lateral)).toBe(true);
    });

    it('calls an edge lateral exactly when the engine does not call it forward', () => {
        const def = getMapDefinition('coastal-continent', 'fishing-village');
        const forward = forwardEdges(def);
        const isForward = (a: string, b: string) =>
            (forward.get(a) ?? []).includes(b) || (forward.get(b) ?? []).includes(a);

        for (const e of vmEdges()) {
            expect(e.lateral).toBe(!isForward(e.fromId, e.toId));
        }
    });

    it('puts every rib inside ONE column and every road across TWO', () => {
        // The layer law D1 replaced the column law with, read off the chart
        // rather than off the engine's own invariant test — if the presenter
        // ever mislabels an edge, the canvas draws a sideways step as
        // progress.
        const def = getMapDefinition('coastal-continent', 'fishing-village');
        const columnOf = new Map(def.nodes.map((n) => [n.id, n.location[0]] as const));

        for (const e of vmEdges()) {
            const a = columnOf.get(e.fromId)!;
            const b = columnOf.get(e.toId)!;
            if (e.lateral) expect(a).toBe(b);
            else expect(Math.abs(a - b)).toBe(1);
        }
    });

    it('draws each rib once, though D1 authors it in both directions', () => {
        // `connectedNodes` carries a rib as two entries. Drawn twice they
        // stack, doubling the ink on exactly the lines meant to be faintest.
        const seen = new Set<string>();
        for (const e of vmEdges()) {
            const key = [e.fromId, e.toId].sort().join('|');
            expect(seen.has(key)).toBe(false);
            seen.add(key);
        }
    });
});

// ---------------------------------------------------------------------------
// owner finding 9 — the legend teaches the three states
// ---------------------------------------------------------------------------

describe('the legend key matches the marks the chart actually draws', () => {
    it('names exactly the three states a player must tell apart', () => {
        expect(MAP_LEGEND_KEYS.map((k) => k.label)).toEqual(['TRODDEN', 'OPEN', 'SEALED']);
    });

    it('retires the ✕ that 23 of 28 nodes wore', () => {
        // The mark is gone from `NodeMark`, so the key must not promise it.
        expect(MAP_LEGEND_LEFT).not.toContain('✕');
        expect(selectExplorationViewModel(freshStore().getState()).legend.left).not.toContain('✕');
    });

    it('gives each state a DIFFERENT glyph, and each glyph a different fill weight', () => {
        const glyphs = MAP_LEGEND_KEYS.map((k) => k.glyph);
        expect(new Set(glyphs).size).toBe(glyphs.length);
        // ● solid mass · ◉ ring with a lit core · ◌ empty broken ring.
        expect(glyphs).toEqual(['●', '◉', '◌']);
    });

    it('keeps FE-008: one word for the shut state, in the key and the counter', () => {
        const vm = selectExplorationViewModel(freshStore().getState());
        expect(vm.legend.left).toContain('SEALED');
        expect(vm.legend.left).not.toContain('SHUT');
        expect(vm.legend.right).toMatch(/sealed/);
    });

    it('builds the strip from the key list, so the two cannot drift apart', () => {
        const vm = selectExplorationViewModel(freshStore().getState());
        expect(vm.legend.left).toBe(MAP_LEGEND_LEFT);
        for (const k of MAP_LEGEND_KEYS) {
            expect(vm.legend.left).toContain(`${k.glyph} ${k.label}`);
        }
    });
});
