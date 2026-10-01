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
 * 2026-09-21 (owner finding 2) — "no screen" turned out to be the bug: a
 * gather node granted its items and then said nothing a player could read.
 * The grant is still inline and still session-free, but it now surfaces on
 * the paced `/event` card. See `gathering-acknowledgement.engine.test.ts`.
 *
 * This pins that contract end-to-end through the store action layer
 * (the same path `app/(tabs)/exploration` drives on a node tap):
 *   - treasure node → loot-cache session, no paced /event route
 *   - rest node → rest session
 *   - gather node → items land in inventory inline, no session, and the
 *     paced /event acknowledgement card
 *
 * The previous gap (2026-06-14): the only coverage of these kinds was
 * `DebugTriggerEncounter.test.tsx`, which asserted the BROKEN
 * slice-seeding behavior. Nothing pinned the actual minigame launch,
 * so the debug panel silently dead-ended at "NO EVENT".
 *
 * (Phase 61 — the quest-board node retired; the earlier "one
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

type CoastalMap = 'breakwater' | 'charcoal-wood';

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

// The varied minigame kinds, on the Charcoal Wood.
describe('map encounter → minigame routing (charcoal-wood)', () => {
    it('loot-cache node opens the loot-cache, not a paced /event', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'charcoal-wood', firstNodeOfKind('charcoal-wood', 'loot-cache'));

        expect(actions.resolveCurrentMapEvent('treasure')).toBe(true);

        expect(selectHasActiveCache(store.getState())).toBe(true);
        expect(selectHasActiveEvent(store.getState())).toBe(false);
        expect(selectPacedEventRoute(store.getState())).toBeNull();
    });

    it('rest node opens the rest-choice session, not a paced /event', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'charcoal-wood', firstNodeOfKind('charcoal-wood', 'rest'));

        expect(actions.resolveCurrentMapEvent('rest')).toBe(true);

        expect(selectHasActiveRest(store.getState())).toBe(true);
        expect(selectPacedEventRoute(store.getState())).toBeNull();
    });

    // 2026-09-21 (owner finding 2, "the Gather node is now a no-op") — this
    // case used to assert the OPPOSITE tail: items land, and then nothing.
    // That was the bug. The grant still happens in the engine resolver with
    // no session and no minigame (the Gleaning stays retired), but the node
    // now pays out onto the paced `/event` card so the player is told what
    // they picked up. Full coverage of the card lives in
    // `gathering-acknowledgement.engine.test.ts`.
    it('gather node grants its items and opens the paced /event acknowledgement, with no session', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'charcoal-wood', firstNodeOfKind('charcoal-wood', 'gathering'));
        const before = store.getState().player.inventory.length;

        expect(actions.resolveCurrentMapEvent('gather')).toBe(true);

        expect(store.getState().player.inventory.length).toBeGreaterThan(before);
        expect(selectHasActiveEvent(store.getState())).toBe(true);
        expect(selectPacedEventRoute(store.getState())).toBe('/event');
        // The Gleaning's session slices stay empty — this is a card, not a
        // minigame coming back.
        expect(selectHasActiveCache(store.getState())).toBe(false);
        expect(selectHasActiveRest(store.getState())).toBe(false);
    });
});
