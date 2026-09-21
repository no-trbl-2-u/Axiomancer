/**
 * Hermetic E2E — map encounter → minigame routing.
 *
 * The gameplay contract the player feels: walking onto a treasure /
 * rest node opens the matching minigame, NOT the "/event" card.
 * `resolveCurrentMapEventAction` intercepts those two kinds (plus
 * hazard) and starts a minigame session instead of dropping a
 * `ResolvedEvent` on the event slice. A gather node is different since
 * Phase 76 retired "The Gleaning": it grants its items inline through
 * the same intercept point, with no session and no screen.
 *
 * This pins that contract end-to-end through the store action layer
 * (the same path `app/(tabs)/exploration` drives on a node tap):
 *   - treasure node → loot-cache session, no paced /event route
 *   - rest node → rest session
 *   - gather node → items land in inventory inline, no session, no
 *     paced /event route
 * plus the design invariant:
 *   - the lone northern-forest quest interaction shows real mobile
 *     dialogue (forgotten-pilgrim), never the empty "A figure waits."
 *
 * The previous gap (2026-06-14): the only coverage of these kinds was
 * `DebugTriggerEncounter.test.tsx`, which asserted the BROKEN
 * slice-seeding behavior. Nothing pinned the actual minigame launch,
 * so the debug panel silently dead-ended at "NO EVENT".
 *
 * (Phase 61 — fv-15's quest-board node retired; the earlier "one
 * quest node" coverage went with it, see `content.engine.test.ts`.
 * Phase 76 — the gathering node's minigame session assertion below
 * was rewritten to an inline-grant assertion; the node itself and its
 * kind census are untouched.)
 */

import { describe, expect, it } from '@jest/globals';
import {
    createMapState,
    getMapDefinition,
    getNodePrimaryEventKind,
    type GameState,
    type MapEventKind,
} from '@mechanics';

import { createAppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { selectPacedEventRoute, selectHasActiveEvent } from '@/state/presenters/event.engine';
import { selectHasActiveCache } from '@/state/presenters/cache.engine';
import { selectHasActiveRest } from '@/state/presenters/rest.engine';

function makeStoreAndActions() {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return { store, actions: createAppActions(store) };
}

type CoastalMap = 'fishing-village' | 'northern-forest';

/** Seat the player on `nodeId` of `mapName`, mirroring a reachable tap. */
function seatAt(store: AppStore, mapName: CoastalMap, nodeId: string) {
    const base = store.getState() as unknown as GameState;
    const map = createMapState(getMapDefinition('coastal-continent', mapName));
    store.setState({
        world: { ...base.world, currentMap: { ...map, currentNode: nodeId } },
    } as never);
}

/** First node resolving to a given engine event kind (the engine owns kind). */
function firstNodeOfKind(mapName: CoastalMap, kind: MapEventKind): string {
    const def = getMapDefinition('coastal-continent', mapName);
    const node = def.nodes.find(
        (n) => getNodePrimaryEventKind('coastal-continent', mapName, n.id) === kind,
    );
    if (!node) throw new Error(`no ${kind} node in ${mapName}`);
    return node.id;
}

// The varied minigame kinds live on northern-forest; fishing-village is the
// new-player combat gauntlet.
describe('map encounter → minigame routing (northern-forest)', () => {
    it('loot-cache node opens the loot-cache, not a paced /event', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'northern-forest', firstNodeOfKind('northern-forest', 'loot-cache'));

        expect(actions.resolveCurrentMapEvent('treasure')).toBe(true);

        expect(selectHasActiveCache(store.getState())).toBe(true);
        expect(selectHasActiveEvent(store.getState())).toBe(false);
        expect(selectPacedEventRoute(store.getState())).toBeNull();
    });

    it('rest node opens the rest-choice session, not a paced /event', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'northern-forest', firstNodeOfKind('northern-forest', 'rest'));

        expect(actions.resolveCurrentMapEvent('rest')).toBe(true);

        expect(selectHasActiveRest(store.getState())).toBe(true);
        expect(selectPacedEventRoute(store.getState())).toBeNull();
    });

    it('gather node grants its items inline, no session and no paced /event', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'northern-forest', firstNodeOfKind('northern-forest', 'gathering'));
        const before = store.getState().player.inventory.length;

        expect(actions.resolveCurrentMapEvent('gather')).toBe(true);

        expect(store.getState().player.inventory.length).toBeGreaterThan(before);
        expect(selectHasActiveEvent(store.getState())).toBe(false);
        expect(selectPacedEventRoute(store.getState())).toBeNull();
    });
});

describe('fishing-village gauntlet routing', () => {
    it('is varied with a balanced node mix: interaction and encounter the largest kinds, plus texture/narration nodes', () => {
        const def = getMapDefinition('coastal-continent', 'fishing-village');
        const kinds = def.nodes.map((n) =>
            getNodePrimaryEventKind('coastal-continent', 'fishing-village', n.id),
        );
        const count = (k: string) => kinds.filter((x) => x === k).length;
        // Balanced variety (owner-requested), re-tuned by Phase 53c/53d/60/61
        // (four NPCs homed onto former encounter/hazard nodes; two more
        // encounters spent on dilemmas; a third on the re-homed anvil; one
        // given back — the retired quest-board node rejoined the encounter
        // roster) and adjust-npcs pass 12 (2026-09-18, a fifth NPC — the
        // Village Healer — homed onto a former gathering node): encounter
        // and rest tie at 4, interaction is now the single largest kind at
        // 5 — no kind dominates, and a real spread of recovery / texture /
        // narration nodes remains.
        // 2026-09-20 — fv-5 became the spine's grave-larva encounter (the grey
        // office rebalance): encounter 4 → 5, tying interaction as the largest kind.
        expect(count('encounter')).toBe(5);
        expect(count('interaction')).toBe(5);
        expect(count('rest')).toBe(4);
        expect(count('gathering')).toBeGreaterThanOrEqual(1);
        expect(count('hazard')).toBeGreaterThanOrEqual(1);
        expect(count('loot-cache')).toBeGreaterThanOrEqual(1);
        expect(count('narration')).toBe(3);
        // Phase 60 — exactly one authored blacksmith node (fv-21,
        // owner-decided single placement, NOT a cadence).
        expect(count('blacksmith')).toBe(1);
    });
});
