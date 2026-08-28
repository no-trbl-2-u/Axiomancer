/**
 * Hermetic E2E — inter-map travel doors through the store action layer.
 *
 * The gameplay contract the player feels (2026-08-28, Phase W1): tapping
 * a door node walks the run onto the next map with no event card and no
 * screen detour — the exploration canvas re-renders the arrival map and
 * a toast narrates the crossing. Cross-continent doors switch the
 * continent in the same stride.
 *
 * Pinned here, mirroring the minigame-routing suite:
 *   - fv-10 (the fishing-village door) → northern-forest; event slice
 *     stays empty, no paced /event route, arrival toast fires
 *   - the arrival map's start node is NOT consumed by the mobile-side
 *     consume bookkeeping (the engine dispatcher already short-circuits
 *     its own consume step for travel; this pins the mobile mirror)
 *   - nf-10 (the cave mouth) → caverns on the NORTHERN continent —
 *     the continent crossing the world catalogue exists to serve
 */

import { describe, expect, it } from '@jest/globals';
import {
    createMapState,
    getMapDefinition,
    type ContinentName,
    type GameState,
} from '@mechanics';

import { createAppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { selectPacedEventRoute, selectHasActiveEvent } from '@/state/presenters/event.engine';

function makeStoreAndActions() {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return { store, actions: createAppActions(store) };
}

/** Seat the player on `nodeId` of `mapName`, mirroring a reachable tap. */
function seatAt(store: AppStore, continent: ContinentName, mapName: Parameters<typeof getMapDefinition>[1], nodeId: string) {
    const base = store.getState() as unknown as GameState;
    const map = createMapState(getMapDefinition(continent, mapName));
    store.setState({
        world: { ...base.world, currentMap: { ...map, currentNode: nodeId } },
    } as never);
}

describe('inter-map travel doors (Phase W1)', () => {
    it('fv-10 walks the run onto northern-forest with a toast and no event card', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'coastal-continent', 'fishing-village', 'fv-10');

        expect(actions.resolveCurrentMapEvent('travel')).toBe(true);

        const after = store.getState();
        expect(after.world.currentMap.name).toBe('northern-forest');
        expect(selectHasActiveEvent(after)).toBe(false);
        expect(selectPacedEventRoute(after)).toBeNull();
        expect(after.notifications?.toast?.text).toMatch(/You cross into/);
    });

    it('the arrival map start node is not consumed by the crossing', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'coastal-continent', 'fishing-village', 'fv-10');

        actions.resolveCurrentMapEvent('travel');

        const map = store.getState().world.currentMap;
        expect(map.name).toBe('northern-forest');
        expect(map.consumedNodes ?? []).not.toContain(map.currentNode);
    });

    it('nf-10 crosses the continent into the caverns', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'coastal-continent', 'northern-forest', 'nf-10');

        expect(actions.resolveCurrentMapEvent('travel')).toBe(true);

        const after = store.getState();
        expect(after.world.currentMap.name).toBe('caverns');
        expect(after.world.currentContinent.name).toBe('northern-continent');
        expect(after.notifications?.toast?.text).toBe('You cross into The Caverns.');
        expect(selectPacedEventRoute(after)).toBeNull();
    });
});
