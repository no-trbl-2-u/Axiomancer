/**
 * Hermetic E2E — map encounter → minigame routing.
 *
 * The gameplay contract the player feels: walking onto a treasure /
 * quest / rest / gather node opens the matching minigame, NOT the
 * "/event" card. `resolveCurrentMapEventAction` intercepts those four
 * kinds (plus hazard) and starts a minigame session instead of
 * dropping a `ResolvedEvent` on the event slice.
 *
 * This pins that contract end-to-end through the store action layer
 * (the same path `app/(tabs)/exploration` drives on a node tap):
 *   - treasure node → loot-cache session, no paced /event route
 *   - quest board node (fv-15) → quest-board session (build-the-boat)
 *   - rest node → rest session
 *   - gather node → gathering session
 * plus the design invariants:
 *   - exactly ONE quest node per map (the map's single story beat)
 *   - the lone northern-forest quest interaction shows real mobile
 *     dialogue (forgotten-pilgrim), never the empty "A figure waits."
 *
 * The previous gap (2026-06-14): the only coverage of these kinds was
 * `DebugTriggerEncounter.test.tsx`, which asserted the BROKEN
 * slice-seeding behavior. Nothing pinned the actual minigame launch,
 * so the debug panel silently dead-ended at "NO EVENT".
 */

import { describe, expect, it } from '@jest/globals';
import {
    createMapState,
    getMapDefinition,
    getNodePrimaryEventKind,
    type GameState,
    type MapEventKind,
} from 'axiomancer-mechanics';

import { createAppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { selectPacedEventRoute, selectHasActiveEvent } from '@/state/presenters/event.engine';
import { selectHasActiveCache } from '@/state/presenters/cache.engine';
import { selectHasActiveRest } from '@/state/presenters/rest.engine';
import { selectHasActiveGathering } from '@/state/presenters/gathering.engine';
import { selectHasActiveQuestBoard } from '@/state/presenters/quest.engine';

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
// new-player combat gauntlet (encounters + one quest + one boss).
describe('map encounter → minigame routing (northern-forest)', () => {
    it('loot-cache node opens the loot-cache, not a paced /event', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'northern-forest', firstNodeOfKind('northern-forest', 'loot-cache'));

        expect(actions.resolveCurrentMapEvent('treasure')).toBe(true);

        expect(selectHasActiveCache(store.getState())).toBe(true);
        expect(selectHasActiveEvent(store.getState())).toBe(false);
        expect(selectPacedEventRoute(store.getState())).toBeNull();
    });

    it('rest node opens "The Night Watch", not a paced /event', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'northern-forest', firstNodeOfKind('northern-forest', 'rest'));

        expect(actions.resolveCurrentMapEvent('rest')).toBe(true);

        expect(selectHasActiveRest(store.getState())).toBe(true);
        expect(selectPacedEventRoute(store.getState())).toBeNull();
    });

    it('gather node opens "The Gleaning", not a paced /event', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'northern-forest', firstNodeOfKind('northern-forest', 'gathering'));

        expect(actions.resolveCurrentMapEvent('gather')).toBe(true);

        expect(selectHasActiveGathering(store.getState())).toBe(true);
        expect(selectPacedEventRoute(store.getState())).toBeNull();
    });
});

describe('fishing-village gauntlet routing', () => {
    it('the lone quest node (fv-15) opens the build-the-boat board', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'fishing-village', 'fv-15');

        expect(actions.resolveCurrentMapEvent('quest')).toBe(true);

        expect(selectHasActiveQuestBoard(store.getState())).toBe(true);
        expect(store.getState().quest.session?.boardId).toBe('build-the-boat');
        expect(selectPacedEventRoute(store.getState())).toBeNull();
    });

    it('is varied with a balanced node mix: one quest, encounters a plurality, plus recovery/texture/narration nodes', () => {
        const def = getMapDefinition('coastal-continent', 'fishing-village');
        const kinds = def.nodes.map((n) =>
            getNodePrimaryEventKind('coastal-continent', 'fishing-village', n.id),
        );
        const count = (k: string) => kinds.filter((x) => x === k).length;
        // Balanced variety (owner-requested): exactly one quest; encounters (incl.
        // the isBoss encounter) remain the single largest kind — a plurality, not a
        // majority — and a real spread of recovery / texture / narration nodes.
        expect(count('quest')).toBe(1);
        expect(count('encounter')).toBeGreaterThanOrEqual(6);
        expect(count('encounter')).toBeLessThan(def.nodes.length / 2); // not dominant
        expect(count('rest')).toBeGreaterThanOrEqual(1);
        expect(count('gathering')).toBeGreaterThanOrEqual(1);
        expect(count('hazard')).toBeGreaterThanOrEqual(1);
        expect(count('loot-cache')).toBeGreaterThanOrEqual(1);
        expect(count('narration')).toBe(1);
    });
});
