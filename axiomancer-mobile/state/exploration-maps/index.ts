import { breakwaterLayout } from './breakwater.layout';
import { charcoalWoodLayout } from './charcoal-wood.layout';
import { beaconCragsLayout } from './beacon-crags.layout';
import { fishingVillageLayout } from './fishing-village.layout';
import { northernForestLayout } from './northern-forest.layout';
import { cavernsLayout } from './caverns.layout';
import { northernCityLayout } from './northern-city.layout';
import { connectingRiverLayout } from './connecting-river.layout';
import { townAcrossRiverLayout } from './town-across-river.layout';
import { theCapitalLayout } from './the-capital.layout';
import type { MapLayout } from './types';

export type { MapLayout, MapSheet, NodeLayout } from './types';

const REGISTRY: Record<string, MapLayout> = {
    // Map revamp M3a — Act 1's coast, the new-game start (D27).
    'breakwater': breakwaterLayout,
    // Map revamp M3b — Act 1's forest, past the Breakwater's bridge.
    'charcoal-wood': charcoalWoodLayout,
    // Map revamp M3c — Act 1's mountains, past the Charcoal Wood's stair cave.
    'beacon-crags': beaconCragsLayout,
    'fishing-village': fishingVillageLayout,
    'northern-forest': northernForestLayout,
    'caverns': cavernsLayout,
    'northern-city': northernCityLayout,
    'connecting-river': connectingRiverLayout,
    'town-across-river': townAcrossRiverLayout,
    'the-capital': theCapitalLayout,
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
 * cannot silently omit a map (burn-day audit 3.11: the arena test's hand-written
 * region list omitted the Northern Forest, and nothing noticed).
 */
export const ALL_MAP_LAYOUTS: readonly MapLayout[] = Object.values(REGISTRY);
