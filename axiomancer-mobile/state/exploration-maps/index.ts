import { breakwaterLayout } from './breakwater.layout';
import { charcoalWoodLayout } from './charcoal-wood.layout';
import { beaconCragsLayout } from './beacon-crags.layout';
import { lanternDeepLayout } from './lantern-deep.layout';
import type { MapLayout } from './types';

export type { MapLayout, MapSheet, NodeLayout } from './types';

const REGISTRY: Record<string, MapLayout> = {
    // Act 1's coast, the new-game start.
    'breakwater': breakwaterLayout,
    // Act 1's forest, past the Breakwater's bridge.
    'charcoal-wood': charcoalWoodLayout,
    // Act 1's mountains, past the Charcoal Wood's stair cave.
    'beacon-crags': beaconCragsLayout,
    // Act 1's underworld, below the Beacon Crags' glacier shrine.
    'lantern-deep': lanternDeepLayout,
};

export function getMapLayout(mapId: string): MapLayout | null {
    return REGISTRY[mapId] ?? null;
}

/**
 * Every map layout the game ships, in registry order.
 *
 * Exists so a test can ask "which regions can the game actually put the player
 * in?" without hand-copying the answer. `REGISTRY` is not an implementation
 * detail of anything under test — it is the game's own statement of which maps
 * exist — so it is the correct oracle for that question, and the only one that
 * cannot silently omit a map the way a hand-written region list can.
 */
export const ALL_MAP_LAYOUTS: readonly MapLayout[] = Object.values(REGISTRY);
