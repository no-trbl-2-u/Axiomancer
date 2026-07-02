import { fishingVillageLayout } from './fishing-village.layout';
import { northernForestLayout } from './northern-forest.layout';
import type { MapLayout } from './types';

export type { MapLayout, NodeLayout } from './types';

const REGISTRY: Record<string, MapLayout> = {
    'fishing-village': fishingVillageLayout,
    'northern-forest': northernForestLayout,
};

export function getMapLayout(mapId: string): MapLayout | null {
    return REGISTRY[mapId] ?? null;
}
