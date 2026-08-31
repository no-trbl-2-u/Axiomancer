import { fishingVillageLayout } from './fishing-village.layout';
import { northernForestLayout } from './northern-forest.layout';
import { cavernsLayout } from './caverns.layout';
import { northernCityLayout } from './northern-city.layout';
import { connectingRiverLayout } from './connecting-river.layout';
import { townAcrossRiverLayout } from './town-across-river.layout';
import type { MapLayout } from './types';

export type { MapLayout, NodeLayout } from './types';

const REGISTRY: Record<string, MapLayout> = {
    'fishing-village': fishingVillageLayout,
    'northern-forest': northernForestLayout,
    'caverns': cavernsLayout,
    'northern-city': northernCityLayout,
    'connecting-river': connectingRiverLayout,
    'town-across-river': townAcrossRiverLayout,
};

export function getMapLayout(mapId: string): MapLayout | null {
    return REGISTRY[mapId] ?? null;
}
