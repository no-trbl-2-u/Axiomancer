/**
 * Hermetic E2E — map encounter → minigame routing.
 *
 * The gameplay contract the player feels: walking onto a treasure /
 * rest / gather node opens the matching minigame, NOT the "/event"
 * card. `resolveCurrentMapEventAction` intercepts those three kinds
 * (plus hazard) and starts a minigame session instead of dropping a
 * `ResolvedEvent` on the event slice.
 *
 * This pins that contract end-to-end through the store action layer
 * (the same path `app/(tabs)/exploration` drives on a node tap):
 *   - treasure node → loot-cache session, no paced /event route
 *   - rest node → rest session
 *   - gather node → gathering session
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
 * quest node" coverage went with it, see `content.engine.test.ts`.)
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
import { selectHasActiveGathering } from '@/state/presenters/gathering.engine';

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

    it('gather node opens "The Gleaning", not a paced /event', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'northern-forest', firstNodeOfKind('northern-forest', 'gathering'));

        expect(actions.resolveCurrentMapEvent('gather')).toBe(true);

        expect(selectHasActiveGathering(store.getState())).toBe(true);
        expect(selectPacedEventRoute(store.getState())).toBeNull();
    });
});

describe('fishing-village gauntlet routing', () => {
    it('is varied with a balanced node mix: encounter/interaction/rest tied at the top, plus texture/narration nodes', () => {
        const def = getMapDefinition('coastal-continent', 'fishing-village');
        const kinds = def.nodes.map((n) =>
            getNodePrimaryEventKind('coastal-continent', 'fishing-village', n.id),
        );
        const count = (k: string) => kinds.filter((x) => x === k).length;
        // Balanced variety (owner-requested), re-tuned by Phase 53c/53d/60/61
        // (S-02 homed four NPCs onto former encounter/hazard nodes; S-01
        // spent two more encounters on dilemmas; Phase 60 spent a third on
        // the re-homed anvil; Phase 61 gave one back — the retired
        // quest-board node rejoined the encounter roster): encounter,
        // interaction, and rest now TIE for the largest kind at 4 apiece —
        // no kind is dominant — and a real spread of recovery / texture /
        // narration nodes remains.
        expect(count('encounter')).toBe(4);
        expect(count('interaction')).toBe(4);
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
