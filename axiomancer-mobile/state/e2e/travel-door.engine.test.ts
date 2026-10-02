/**
 * Hermetic E2E — inter-map travel doors through the store action layer.
 *
 * The gameplay contract the player feels: tapping
 * a door node walks the run onto the next map with no event card and no
 * screen detour — the exploration canvas re-renders the arrival map and
 * a toast narrates the crossing. Cross-continent doors switch the
 * continent in the same stride.
 *
 * Pinned here, mirroring the minigame-routing suite:
 *   - bw-18 (the Breakwater's river bridge) → charcoal-wood; event slice
 *     stays empty, no paced /event route, arrival toast fires
 *   - the arrival map's start node is NOT consumed by the mobile-side
 *     consume bookkeeping (the engine dispatcher already short-circuits
 *     its own consume step for travel; this pins the mobile mirror)
 *   - cw-20 (the stair cave) → beacon-crags on the NORTHERN continent —
 *     the continent crossing the world catalogue exists to serve
 */

import { describe, expect, it } from '@jest/globals';
import type { ContinentName, MapName } from '@mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createFixtureStore } from '@/test-utils/fixtureStore';
import { selectPacedEventRoute, selectHasActiveEvent } from '@/state/presenters/event.engine';

/**
 * Seat the player on a door node through a state fixture (see
 * docs/testing.md "Seeding state with fixtures"). The same document
 * shape boots the CLI (`--fixture`) and the web build (`?fixture=`).
 */
function seatAt(continent: ContinentName, map: MapName, node: string, adapter = createMemoryAdapter()) {
    return createFixtureStore(
        { id: `travel-door-${node}`, seed: `travel-door-${node}`, world: { continent, map, node } },
        { adapter },
    );
}

describe('inter-map travel doors (Phase W1)', () => {
    it('bw-18 walks the run onto charcoal-wood with a toast, no event card, and a checkpoint save', () => {
        const adapter = createMemoryAdapter();
        const { store, actions } = seatAt('coastal-continent', 'breakwater', 'bw-18', adapter);
        const savesBefore = adapter.saveCount;

        expect(actions.resolveCurrentMapEvent('travel')).toBe(true);

        const after = store.getState();
        expect(after.world.currentMap.name).toBe('charcoal-wood');
        expect(selectHasActiveEvent(after)).toBe(false);
        expect(selectPacedEventRoute(after)).toBeNull();
        expect(after.notifications?.toast?.text).toMatch(/You cross into/);
        // Crossing checkpoints the run — saves are explicit on mobile;
        // without this, an app close after the door loses it.
        expect(adapter.saveCount).toBe(savesBefore + 1);
    });

    it('the arrival map start node is not consumed by the crossing', () => {
        const { store, actions } = seatAt('coastal-continent', 'breakwater', 'bw-18');

        actions.resolveCurrentMapEvent('travel');

        const map = store.getState().world.currentMap;
        expect(map.name).toBe('charcoal-wood');
        expect(map.consumedNodes ?? []).not.toContain(map.currentNode);
    });

    it('cw-20 crosses the continent onto the Beacon Crags', () => {
        const { store, actions } = seatAt('coastal-continent', 'charcoal-wood', 'cw-20');

        expect(actions.resolveCurrentMapEvent('travel')).toBe(true);

        const after = store.getState();
        expect(after.world.currentMap.name).toBe('beacon-crags');
        expect(after.world.currentContinent.name).toBe('northern-continent');
        expect(after.notifications?.toast?.text).toBe('You cross into The Beacon Crags.');
        expect(selectPacedEventRoute(after)).toBeNull();
    });
});
