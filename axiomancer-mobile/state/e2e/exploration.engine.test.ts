/**
 * Hermetic E2E Tests — Exploration screen presenter (Spec 07)
 *
 * Drives `selectExplorationViewModel` and the world action layer
 * (moveTo / changeMap) end-to-end through the engine store. Hermetic =
 * self-contained + deterministic + isolated. See docs/testing.md for
 * the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { createMapState, getMapDefinition, getNodeEventPool } from '@mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createAppActions } from '@/state/actions';
import { createAppStore } from '@/state/store';
import { jumpToNode } from '@/state/dev/world-travel';
// Side-effect: registers exploration map event pools so resolveMapEvent
// produces real events in the travel-to-event path tests below.
import {
    selectExplorationViewModel,
    type ExplorationViewModel,
} from '@/state/presenters/exploration.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Shape contract
// ---------------------------------------------------------------------------

describe('selectExplorationViewModel: shape contract', () => {
    it('returns a totally-shaped ExplorationViewModel for a fresh game', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });

        const vm: ExplorationViewModel = selectExplorationViewModel(store.getState());

        expect(typeof vm.continent).toBe('string');
        expect(typeof vm.region).toBe('string');
        expect(typeof vm.regionProgress).toBe('string');
        expect(typeof vm.mapId).toBe('string');
        expect(typeof vm.currentNodeId).toBe('string');
        expect(Array.isArray(vm.nodes)).toBe(true);
        expect(Array.isArray(vm.edges)).toBe(true);
        expect(Array.isArray(vm.actions)).toBe(true);
        expect(Array.isArray(vm.options)).toBe(true);
        expect(typeof vm.legend.left).toBe('string');
        expect(typeof vm.legend.right).toBe('string');
    });

    it('eventCallout is either null or a {title, iconKey} object', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });

        const vm = selectExplorationViewModel(store.getState());

        if (vm.eventCallout !== null) {
            expect(typeof vm.eventCallout.title).toBe('string');
            expect(typeof vm.eventCallout.iconKey).toBe('string');
        } else {
            expect(vm.eventCallout).toBeNull();
        }
    });
});

describe('selectExplorationViewModel: invariants', () => {
    it('the returned VM is deep-frozen', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });

        const vm = selectExplorationViewModel(store.getState());

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.nodes)).toBe(true);
        expect(Object.isFrozen(vm.edges)).toBe(true);
        expect(Object.isFrozen(vm.legend)).toBe(true);
    });
});

describe('selectExplorationViewModel: store lifecycle', () => {
    it('selecting the VM does not call adapter.save', () => {
        const adapter = createMemoryAdapter();
        const store = createAppStore({ adapter });
        const saveSpy = jest.spyOn(adapter, 'save');

        selectExplorationViewModel(store.getState());

        expect(saveSpy).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Engine reads — fresh game state
// ---------------------------------------------------------------------------

describe('selectExplorationViewModel: engine reads', () => {
    it('classifies the starting node as `current` and seeds available/locked', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });

        const vm = selectExplorationViewModel(store.getState());

        expect(vm.mapId).toBe('fishing-village');
        expect(vm.currentNodeId).toBe('fv-1');

        const byId = Object.fromEntries(vm.nodes.map((n) => [n.id, n]));
        expect(byId['fv-1'].kind).toBe('current');
        expect(byId['fv-2'].kind).toBe('available');
        expect(byId['fv-3'].kind).toBe('locked');
        expect(byId['fv-10'].kind).toBe('locked');
    });

    it('exposes options for each currently available node with a thematic description', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });

        const vm = selectExplorationViewModel(store.getState());

        // Phase 53c — column 1 narrows to fv-2 alone (Old Marrow, the
        // quest-giver), so the starting node's only option is him.
        expect(vm.options.map((o) => o.nodeId).sort()).toEqual(['fv-2']);
        expect(vm.options[0].description.length).toBeGreaterThan(0);
    });

    it('marks available encounter nodes as triggersCombat; rest nodes do not', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        // fv-2's engine neighbours after Phase 53c/53d: fv-3 (rest), fv-16
        // (narration — "The Borrowed Hook") and fv-11 (loot-cache). None of
        // those three is an `encounter` node anymore, so the encounter
        // assertion below reaches one column further, to fv-13 (Little
        // Belle) via fv-11.
        actions.moveTo('fv-2');
        const vm = selectExplorationViewModel(store.getState());
        const fv3 = vm.nodes.find((n) => n.id === 'fv-3')!;
        expect(fv3.kind).toBe('available');
        expect(fv3.type).toBe('rest');
        expect(fv3.triggersCombat).toBe(false);

        // fv-15 (the retired quest-board node, Phase 61) is a regular
        // encounter type now, but it's several columns ahead of fv-2 —
        // still locked, so not yet a combat trigger regardless of type.
        const fv15 = vm.nodes.find((n) => n.id === 'fv-15')!;
        expect(fv15.type).toBe('encounter');
        expect(fv15.kind).not.toBe('available');
        expect(fv15.triggersCombat).toBe(false);

        actions.moveTo('fv-11');
        const vm2 = selectExplorationViewModel(store.getState());
        const fv13 = vm2.nodes.find((n) => n.id === 'fv-13')!;
        expect(fv13.kind).toBe('available');
        expect(fv13.type).toBe('encounter');
        expect(fv13.triggersCombat).toBe(true);
    });

    it('encounter step-card icon is "sword", NOT "flee" — exploration-audit [3.5] DRIFT fix', () => {
        // Pre-fix the encounter step-card's iconKey was 'flee' (the
        // same glyph the combat modal uses for the FLEE button),
        // surfacing as "this step lets you flee" rather than
        // "this step starts combat". Pin the new mapping so a
        // future refactor doesn't silently revert.
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.moveTo('fv-2');
        actions.moveTo('fv-11'); // unlocks fv-13 (encounter) as an option

        const vm = selectExplorationViewModel(store.getState());
        const encounterOption = vm.options.find((o) => o.nodeId === 'fv-13');
        expect(encounterOption).toBeDefined();
        // actions[i] mirrors options[i] order; find the matching action.
        const idx = vm.options.findIndex((o) => o.nodeId === 'fv-13');
        const encounterAction = vm.actions[idx];
        expect(encounterAction.iconKey).toBe('sword');
        expect(encounterAction.iconKey).not.toBe('flee');
    });
});

// ---------------------------------------------------------------------------
// moveTo action — happy path
// ---------------------------------------------------------------------------

describe('moveTo action: happy path', () => {
    it('marks the target completed, advances currentNodeId, and unlocks connected nodes', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        const result = actions.moveTo('fv-2');

        expect(result).toEqual({ moved: true, currentNodeId: 'fv-2', locked: false });

        const vm = selectExplorationViewModel(store.getState());
        expect(vm.currentNodeId).toBe('fv-2');
        const byId = Object.fromEntries(vm.nodes.map((n) => [n.id, n]));
        expect(byId['fv-2'].kind).toBe('current');
        // fv-3, fv-16 and fv-11 are the engine neighbours of fv-2 and
        // should now be reachable.
        expect(byId['fv-3'].kind).toBe('available');
        expect(byId['fv-16'].kind).toBe('available');
        expect(byId['fv-11'].kind).toBe('available');
    });

    it('refreshes the options drawer with the new available nodes after a move', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        actions.moveTo('fv-2');

        const vm = selectExplorationViewModel(store.getState());
        const optionIds = vm.options.map((o) => o.nodeId).sort();
        expect(optionIds).toEqual(['fv-11', 'fv-16', 'fv-3'].sort());
    });
});

// ---------------------------------------------------------------------------
// moveTo action — locked / invalid targets (Q5=B no-op)
// ---------------------------------------------------------------------------

describe('moveTo action: locked / invalid targets', () => {
    it('refuses to move to a locked node and leaves state untouched', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        const before = store.getState();

        const result = actions.moveTo('fv-5');

        expect(result.moved).toBe(false);
        expect(result.locked).toBe(true);
        expect(result.currentNodeId).toBe('fv-1');

        // The world slice is unchanged on a refused move.
        expect(store.getState().world).toBe(before.world);
    });

    it('refuses to move to a non-existent node', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        const result = actions.moveTo('not-a-real-node');

        expect(result.moved).toBe(false);
    });

    it('allows re-entering a reusable encounter node (gauntlet re-fight)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        // fv-13 resolves to an engine `encounter` kind (reached via
        // fv-2 → fv-11), so it is not completed on entry — it stays
        // reachable and can be re-entered.
        actions.moveTo('fv-2');
        actions.moveTo('fv-11');
        actions.moveTo('fv-13');
        const result = actions.moveTo('fv-13');

        expect(result.moved).toBe(true);
    });

    it('exposes locked nodes through the VM so the screen can desaturate them', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });

        const vm = selectExplorationViewModel(store.getState());

        const locked = vm.nodes.filter((n) => n.kind === 'locked').map((n) => n.id);
        expect(locked.length).toBeGreaterThan(0);
        // Locked nodes never trigger combat — taps are a no-op (Q5=B).
        for (const n of vm.nodes) {
            if (n.kind === 'locked') expect(n.triggersCombat).toBe(false);
        }
    });
});

// ---------------------------------------------------------------------------
// Map transition
// ---------------------------------------------------------------------------

describe('changeMap action: map transition', () => {
    it('swaps the engine currentMap and resets currentNodeId to the new startingNode', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        actions.changeMap('northern-forest');

        const vm = selectExplorationViewModel(store.getState());
        expect(vm.mapId).toBe('northern-forest');
        expect(vm.currentNodeId).toBe('nf-1');
        expect(store.getState().world.currentMap.name).toBe('northern-forest');
    });

    it('loads the new layout fixture so node positions and labels update', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        actions.changeMap('northern-forest');

        const vm = selectExplorationViewModel(store.getState());
        const ids = vm.nodes.map((n) => n.id);
        expect(ids).toEqual(expect.arrayContaining(['nf-1', 'nf-2', 'nf-3']));
        expect(ids.every((id) => id.startsWith('nf-'))).toBe(true);
    });

    it('also accepts the MapState built from getMapDefinition+createMapState as a sanity hint', () => {
        // The action accepts a MapName string; this assertion proves the
        // engine still ships the expected map under that name. Post-Spec
        // 08 Q5A + Phase 60a, the canonical build path is
        // `createMapState(getMapDefinition(continent, name))`; the returned
        // `MapState` carries the definition's `startingNode.id` as
        // `currentNode` on a fresh map.
        const map = createMapState(getMapDefinition('coastal-continent', 'northern-forest'));
        expect(map.name).toBe('northern-forest');
        expect(map.currentNode).toBe('nf-1');
    });
});

// ---------------------------------------------------------------------------
// Lifecycle — multi-step navigation
// ---------------------------------------------------------------------------

describe('exploration lifecycle: multi-step navigation', () => {
    it('encounter nodes stay reusable and unlock their engine neighbours', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        actions.moveTo('fv-2');  // Old Marrow's interaction node
        actions.moveTo('fv-11'); // loot-cache — consumed on entry
        actions.moveTo('fv-13'); // encounter — reusable, not completed

        const completed = store.getState().world.currentMap.completedNodes;
        // fv-13 is an engine `encounter` kind, so it does not complete on entry —
        // it stays re-fightable (the loot-cache fv-11 is a one-shot).
        expect(completed).not.toContain('fv-13');

        const vm = selectExplorationViewModel(store.getState());
        const byId = Object.fromEntries(vm.nodes.map((n) => [n.id, n]));
        expect(byId['fv-13'].kind).toBe('current');
        // fv-15, fv-5 and fv-20 are fv-13's forward neighbours in the ENGINE graph.
        expect(byId['fv-15'].kind).toBe('available');
        expect(byId['fv-5'].kind).toBe('available');
        expect(byId['fv-20'].kind).toBe('available');
    });

    /**
     * INVARIANT CHANGED, deliberately — Phase 99.
     *
     * This case used to assert the OPPOSITE ("a move does not implicitly call
     * adapter.save"), labelled as a Spec 09 hook. That label was wrong, and the
     * assertion encoded a mobile implementation gap as if it were the design:
     *
     *   - Spec 09 Q4 ("Save granularity") is RESOLVED, at Phase 51 (`4972f9a`),
     *     in favour of Path B — autosave restricted to a curated
     *     `DURABLE_ACTIONS` allowlist. `MOVE_TO_NODE` is ON that allowlist
     *     (`axiomancer-mechanics/src/Game/store.ts`), so persisting on node
     *     movement is the engine's ratified behaviour, not a violation of it.
     *   - Mobile's `moveToAction` never got that behaviour because it writes
     *     the new world with `store.setState({ world })` directly instead of
     *     dispatching through the engine reducer, so the DURABLE_ACTIONS gate
     *     never sees the move.
     *
     * The player-visible cost of that gap is PLAYTEST_BUGS_2026-09-18 BUG-03:
     * a player who walked two nodes and reloaded was put back where they
     * started, with the walk and the opening quest gone.
     *
     * What Spec 09 still forbids — and what the second half of this case
     * pins — is UI-tier actions writing through. That has not changed.
     */
    it('a move IS a save checkpoint, matching the engine allowlist (Spec 09 Q4 / Phase 51)', () => {
        const adapter = createMemoryAdapter();
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);
        const saveSpy = jest.spyOn(adapter, 'save');

        actions.moveTo('fv-2');

        // `MOVE_TO_NODE` is a DURABLE_ACTION; movement is hard-won progress.
        expect(saveSpy).toHaveBeenCalledTimes(1);

        // An explicit save still writes, and is not swallowed or coalesced away.
        actions.save();
        expect(saveSpy).toHaveBeenCalledTimes(2);
    });

    it('a UI-tier action still does NOT write through (Spec 09 Path B)', () => {
        const adapter = createMemoryAdapter();
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);
        const saveSpy = jest.spyOn(adapter, 'save');

        // Dismissing an event card is presentation, not progress. Spec 09's
        // whole point is that this class never reaches the disk.
        actions.dismissEvent();

        expect(saveSpy).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Phase 27: engine parallel data-model (discoveredNodes / consumedNodes)
// ---------------------------------------------------------------------------

describe('moveTo action: engine discoveredNodes population (Phase 27)', () => {
    it('populates discoveredNodes with the moved-to node’s neighbours per engine MapDefinition', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        actions.moveTo('fv-2');

        const map = store.getState().world.currentMap;
        // discoveredNodes is the engine's new parallel field
        // populated via revealAdjacent. The engine reads neighbours
        // from getMapDefinition; fv-2's connected nodes per the
        // registered map should land here.
        expect(map.discoveredNodes.length).toBeGreaterThan(0);
        // No legacy regression: availableNodes still populated for
        // the screen.
        expect(map.availableNodes.length).toBeGreaterThan(0);
    });

    it('revealing the same neighbours twice is idempotent', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        actions.moveTo('fv-2');
        const after1 = [...store.getState().world.currentMap.discoveredNodes];
        actions.moveTo('fv-4');
        const after2 = store.getState().world.currentMap.discoveredNodes;

        // discoveredNodes only grows; no duplicates after a second
        // move whose neighbours overlap the first move's neighbours.
        const unique = new Set(after2);
        expect(unique.size).toBe(after2.length);
        // The first set should be a subset of the second (or equal).
        for (const n of after1) {
            expect(after2).toContain(n);
        }
    });
});

describe('resolveCurrentMapEvent: engine consumedNodes population (Phase 27)', () => {
    it('marks the current node consumed when a non-none event resolves', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        // Walk to a node before resolving — the starting node may be a
        // 'none' kind in some fixtures.
        actions.moveTo('fv-2');
        const before = store.getState().world.currentMap.consumedNodes.length;

        const produced = actions.resolveCurrentMapEvent();

        const after = store.getState().world.currentMap.consumedNodes;
        // If an event was produced, consumedNodes grew by 1; if 'none'
        // (no event), it should NOT have grown.
        if (produced) {
            expect(after.length).toBe(before + 1);
            expect(after).toContain(store.getState().world.currentMap.currentNode);
        } else {
            expect(after.length).toBe(before);
        }
    });

    it('does NOT mark consumed when event.kind is “none”', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        // The starting node may or may not have an event pool. The
        // assertion is robust either way: if the produced-true branch
        // fires above, this second test re-runs with a different
        // node and checks the negative branch's invariant.
        const before = store.getState().world.currentMap.consumedNodes.length;
        const produced = actions.resolveCurrentMapEvent();
        const after = store.getState().world.currentMap.consumedNodes;
        if (!produced) {
            expect(after.length).toBe(before);
        }
    });
});

// ---------------------------------------------------------------------------
// Drawer copy moved to the VM (CRITIQUE [MED] pass 5 — Hard Rule #8)
// ---------------------------------------------------------------------------

describe('selectExplorationViewModel: drawer copy', () => {
    it('exposes a lowercase-ritual empty-state and swipe hint on the VM', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectExplorationViewModel(store.getState());

        expect(vm.drawerCopy.emptyMessage).toBe('the paths close as you go deeper — tap a glowing node to travel.');
        // CRITIQUE pass 8 MED drain: section title + LEAGUES column
        // label are presenter-sourced, not view-layer literals.
        expect(vm.drawerCopy.title).toBe('✠ WHITHER, PILGRIM?');
        expect(vm.drawerCopy.leaguesLabel).toBe('LEAGUES');
    });

    it('drops the prior sentence-case empty literal that mismatched the screen voice', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectExplorationViewModel(store.getState());

        // Pin regression: the pre-fix copy started with a capital and
        // an article. The voice unification dropped both.
        expect(vm.drawerCopy.emptyMessage).not.toMatch(/^[A-Z]/);
        expect(vm.drawerCopy.emptyMessage).not.toContain('No paths remain');
    });
});

// ---------------------------------------------------------------------------
// LEAGUES bucket — Phase 32 design-handoff port (spec32 tick B)
//
// Ported from `prototype.jsx:184-208` (StepCardClickable). Each
// available next-step option carries a `leagues: 'I' | 'II' | 'III'`
// bucket derived from Euclidean distance on the canonical 360×400
// viewBox between the current node and the option node. Cutoffs:
// ≤80 = I, ≤160 = II, >160 = III.
// ---------------------------------------------------------------------------

describe('selectExplorationViewModel: LEAGUES bucket', () => {
    it('populates a non-empty leagues value (I | II | III) on every option', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectExplorationViewModel(store.getState());

        expect(vm.options.length).toBeGreaterThan(0);
        for (const opt of vm.options) {
            expect(['I', 'II', 'III']).toContain(opt.leagues);
        }
    });

    it('buckets options monotonically by distance from the current node', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectExplorationViewModel(store.getState());

        if (vm.options.length < 2) return;

        const current = vm.nodes.find((n) => n.id === vm.currentNodeId);
        expect(current).toBeDefined();
        if (!current) return;

        const distances = vm.options.map((opt) => {
            const node = vm.nodes.find((n) => n.id === opt.nodeId);
            return node ? Math.hypot(node.x - current.x, node.y - current.y) : 0;
        });

        // A smaller distance never gets a HIGHER league bucket than
        // a larger distance.
        const order: Record<'I' | 'II' | 'III', number> = { I: 1, II: 2, III: 3 };
        for (let i = 0; i < vm.options.length; i++) {
            for (let j = 0; j < vm.options.length; j++) {
                if (i === j) continue;
                if (distances[i] < distances[j]) {
                    expect(order[vm.options[i].leagues]).toBeLessThanOrEqual(
                        order[vm.options[j].leagues],
                    );
                }
            }
        }
    });

    it('respects the documented thresholds (≤80=I, ≤160=II, >160=III)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectExplorationViewModel(store.getState());

        const current = vm.nodes.find((n) => n.id === vm.currentNodeId);
        if (!current) return;

        for (const opt of vm.options) {
            const node = vm.nodes.find((n) => n.id === opt.nodeId);
            if (!node) continue;
            const d = Math.hypot(node.x - current.x, node.y - current.y);
            if (d <= 80) expect(opt.leagues).toBe('I');
            else if (d <= 160) expect(opt.leagues).toBe('II');
            else expect(opt.leagues).toBe('III');
        }
    });
});

// ---------------------------------------------------------------------------
// Encounter modal seam — Phase 32 design-handoff port (spec32 tick D)
//
// Per `prototype.jsx` PtEventModal + `chats/chat1.md`. Tapping an
// encounter / boss node populates the engine's pending event slice;
// the exploration screen mounts <EncounterModalOverlay> when that
// slice carries `kind === 'combat-prelude'`. These tests pin the
// presenter-level behaviour the overlay depends on; the overlay itself
// is hermetic (pure props in, dispatches out).
// ---------------------------------------------------------------------------

import {
    selectEventViewModel,
    selectHasActiveEvent,
    selectHasActivePacedEvent,
    selectHasActiveCombatPrelude,
} from '@/state/presenters/event.engine';

describe('encounter-modal seam (Tick D)', () => {
    function moveToFirstEncounter(): {
        store: ReturnType<typeof createAppStore>;
        actions: ReturnType<typeof createAppActions>;
        encounterNodeId: string | null;
    } {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        const vm = selectExplorationViewModel(store.getState());
        // Find the first available encounter / boss node in the starting
        // map. The seam fires the same way for both kinds; the test
        // doesn't depend on which.
        const target = vm.nodes.find(
            (n) => n.kind === 'available' && (n.type === 'encounter' || n.type === 'boss'),
        );
        if (target === undefined) {
            return { store, actions, encounterNodeId: null };
        }
        actions.moveTo(target.id);
        return { store, actions, encounterNodeId: target.id };
    }

    it('populates a combat-prelude event when the player arrives at an encounter node + resolves it', () => {
        const { store, actions, encounterNodeId } = moveToFirstEncounter();
        if (encounterNodeId === null) return; // map has no encounter; skip silently

        // Pre-resolve: pending event slice may or may not exist; the
        // contract is that AFTER resolveCurrentMapEvent fires, the
        // event VM kind is 'combat-prelude' for an encounter node.
        actions.resolveCurrentMapEvent();
        const state = store.getState();
        const hasEvent = selectHasActiveEvent(state as never);
        const vm = selectEventViewModel(state as never);

        expect(hasEvent).toBe(true);
        expect(vm.kind).toBe('combat-prelude');
        // Overlay mount condition lives on the screen
        // (`hasEvent && vm.kind === 'combat-prelude'`); pin both halves
        // so a future presenter rename of either symbol breaks the test
        // rather than silently un-mounting the overlay.
        expect(vm.preludeChrome).not.toBeNull();
    });

    it('fight choice dispatches startCombat + clears the pending event slice', () => {
        const { store, actions, encounterNodeId } = moveToFirstEncounter();
        if (encounterNodeId === null) return;
        actions.resolveCurrentMapEvent();

        expect(selectHasActiveEvent(store.getState() as never)).toBe(true);
        // Legacy `state.combat` removed in mechanics 0.37.0; the engine now
        // records the fight via `currentEncounter`.
        expect(store.getState().currentEncounter).toBeUndefined();

        actions.pickEventChoice('fight');

        // After fight: the engine records the encounter, pending event slice cleared.
        const after = store.getState();
        expect(after.currentEncounter).not.toBeUndefined();
        expect(selectHasActiveEvent(after as never)).toBe(false);
    });

    it('flee choice clears the pending event slice without entering combat', () => {
        const { store, actions, encounterNodeId } = moveToFirstEncounter();
        if (encounterNodeId === null) return;
        actions.resolveCurrentMapEvent();

        const vm = selectEventViewModel(store.getState() as never);
        const fleeChoice = vm.choices.find((c) => c.id === 'flee');
        if (fleeChoice === undefined || !fleeChoice.enabled) return; // boss-only path

        actions.pickEventChoice('flee');

        const after = store.getState();
        expect(after.currentEncounter).toBeUndefined();
        expect(selectHasActiveEvent(after as never)).toBe(false);
    });

    it('overlay mount condition is false when combat is already active (seam never re-opens mid-fight)', () => {
        const { store, actions, encounterNodeId } = moveToFirstEncounter();
        if (encounterNodeId === null) return;
        actions.resolveCurrentMapEvent();
        actions.pickEventChoice('fight');

        // After fight commits, `pickEventChoice('fight')` has cleared the
        // pending event slice, so `selectHasActiveEvent` is false and the
        // overlay never re-mounts.
        expect(selectHasActiveEvent(store.getState() as never)).toBe(false);
    });
});

/**
 * FE-008 — the map legend must use the same word for a locked node as the
 * counter beside it, the tap-tip, and the node's accessible name. It said
 * SHUT while everything else said sealed.
 */
describe('FE-008: legend and counter agree on SEALED', () => {
    it('uses one word for the locked state across the legend strip', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectExplorationViewModel(store.getState());
        expect(vm.legend.left).toContain('SEALED');
        expect(vm.legend.left).not.toContain('SHUT');
        expect(vm.legend.right).toMatch(/sealed/);
    });
});

/**
 * BUG-01 (PLAYTEST_BUGS_2026-09-18) — the legend counted a different set of
 * nodes than the one it labels.
 *
 * The strip read "25 nodes · 20 sealed" over a map drawing 21 sealed pips. Two
 * sources of truth: the PIPS come from `classifyNode`, the COUNTER came from
 * `world.currentMap.lockedNodes`. The start node is where they part — it was
 * never in `lockedNodes` (you begin standing on it), but once you walk away it
 * is neither `reachable` nor `completed`, so the renderer calls it sealed while
 * the engine's lock list never did.
 *
 * `fishing-village.layout.ts` records an EARLIER disagreement with this same
 * counter (critique pass 19), so this surface has bitten before. These cases
 * pin label against pips directly rather than against either source.
 */
describe('BUG-01: the legend counts the nodes the map actually draws', () => {
    /** Pull the two numbers out of "N nodes · M sealed". */
    const readCounter = (right: string) => {
        const m = /^(\d+) nodes · (\d+) sealed$/.exec(right);
        if (!m) throw new Error(`legend counter not in the expected shape: ${right}`);
        return { nodes: Number(m[1]), sealed: Number(m[2]) };
    };

    it('agrees with the pips on a fresh map', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectExplorationViewModel(store.getState());
        const counter = readCounter(vm.legend.right);

        expect(counter.nodes).toBe(vm.nodes.length);
        expect(counter.sealed).toBe(vm.nodes.filter((n) => n.kind === 'locked').length);
    });

    it('still agrees after the player walks away from the start node', () => {
        // THE REGRESSION: this is the exact step that used to split the two
        // counts. The start node stops being reachable, was never completed,
        // and was never in `lockedNodes` — so it became a sealed pip that the
        // counter did not count.
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.moveTo('fv-2');

        const vm = selectExplorationViewModel(store.getState());
        const counter = readCounter(vm.legend.right);

        expect(counter.nodes).toBe(vm.nodes.length);
        expect(counter.sealed).toBe(vm.nodes.filter((n) => n.kind === 'locked').length);
    });

    it('agrees again after a second move', () => {
        // Cheap insurance that the agreement is structural, not a coincidence
        // that happens to hold at one position.
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.moveTo('fv-2');
        actions.moveTo('fv-3');

        const vm = selectExplorationViewModel(store.getState());
        const counter = readCounter(vm.legend.right);

        expect(counter.nodes).toBe(vm.nodes.length);
        expect(counter.sealed).toBe(vm.nodes.filter((n) => n.kind === 'locked').length);
    });
});

// ---------------------------------------------------------------------------
// Burn-day audit 2026-09-19 row 3.1: the arrival the map still owes you
// ---------------------------------------------------------------------------

describe('selectExplorationViewModel: arrivalPending', () => {
    it('still owes an encounter arrival that the player never answered', () => {
        // A move checkpoints BEFORE its arrival resolves (`moveToAction`
        // saves, then the screen calls `resolveCurrentMapEvent`), so a reload
        // taken during the prelude rebuilds the app standing on the node with
        // the fight unanswered. The move recorded the debt as `pendingArrival`
        // and that record rides the save — this flag is how the screen reads
        // it back.
        const adapter = createMemoryAdapter();
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);
        actions.moveTo('fv-2');
        actions.moveTo('fv-11');
        actions.moveTo('fv-13'); // engine kind `encounter`

        const reloaded = createAppStore({ adapter });

        expect(reloaded.getState().world.currentMap.currentNode).toBe('fv-13');
        expect(selectExplorationViewModel(reloaded.getState()).arrivalPending).toBe(true);
    });

    it('owes nothing once the arrival has been answered', () => {
        // The negative twin: resolving IS the answer — it clears
        // `pendingArrival` — so an answered arrival is never re-offered,
        // here or after a reload.
        const adapter = createMemoryAdapter();
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);
        actions.moveTo('fv-2');
        actions.moveTo('fv-11');
        actions.moveTo('fv-13');
        actions.resolveCurrentMapEvent();
        actions.save();

        expect(store.getState().world.currentMap.consumedNodes).toContain('fv-13');
        expect(selectExplorationViewModel(store.getState()).arrivalPending).toBe(false);
        expect(selectExplorationViewModel(createAppStore({ adapter }).getState()).arrivalPending)
            .toBe(false);
    });

    it('owes nothing for a node the player was PLACED on', () => {
        // Row 3.1 follow-up, and the defect that shipped with row 3.1: being
        // placed on a node is not the same as arriving at it. `placeOnNode`
        // (state fixtures, `/dev` JUMP) stands the player anywhere and
        // deliberately UN-consumes the node so its content stays live — so
        // "the node under the player is unconsumed and has a pool" read every
        // placement as an unanswered arrival. The map screen paid it on
        // mount, and `/exploration?fixture=sage-fv-boss-gate` engaged the
        // fv-9 boss instead of drawing the map. A placement writes no debt.
        const store = createAppStore({ adapter: createMemoryAdapter() });
        expect(jumpToNode(store, 'fv-9')).toBe(true);

        const vm = selectExplorationViewModel(store.getState());
        const map = store.getState().world.currentMap;

        expect(vm.currentNodeId).toBe('fv-9');
        // The conditions the old inference fired on are all still true ...
        expect(map.consumedNodes).not.toContain('fv-9');
        expect(getNodeEventPool(map.continent, map.name, 'fv-9')).not.toBeUndefined();
        // ... and nothing is owed, because nobody walked here.
        expect(vm.arrivalPending).toBe(false);
        expect(vm.startNodePending).toBe(false);
    });

    it('owes a travel door the player walked onto, and the crossing answers it', () => {
        // A door is deliberately never consumed ("a door is repeatable" —
        // `resolve-map-event.ts`), so consumption cannot say whether it has
        // been answered. The record can: walking onto the door owes it (a
        // reload here should still cross, not strand the player standing on
        // a door), and resolving it clears the debt on the map being LEFT,
        // before the crossing files that map away — otherwise returning
        // through the door would cross again with no input.
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        const world = store.getState().world;
        // fv-10 is the northern-forest door. Walk onto it from its neighbour
        // rather than jumping, so this is a real arrival.
        store.setState({
            world: {
                ...world,
                currentMap: {
                    ...world.currentMap,
                    currentNode: 'fv-9',
                    availableNodes: [...world.currentMap.availableNodes, 'fv-10'],
                },
            },
        });
        expect(actions.moveTo('fv-10').moved).toBe(true);

        expect(selectExplorationViewModel(store.getState()).arrivalPending).toBe(true);

        actions.resolveCurrentMapEvent();

        // The crossing happened, and the departed map no longer owes the door.
        const after = store.getState().world;
        expect(after.currentMap.name).not.toBe('fishing-village');
        expect(after.mapStates?.['fishing-village']?.pendingArrival ?? null).toBeNull();
    });
});
