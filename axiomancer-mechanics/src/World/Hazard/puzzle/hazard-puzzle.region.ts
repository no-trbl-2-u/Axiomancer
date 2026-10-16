/**
 * Hazard puzzle — a region's gathering materials.
 *
 * Read from the map-event pools the region's nodes already carry, so no
 * material is authored here and a new gathering node is picked up on its own.
 */

import '../../MapEvents/content';
import { getNodeEventPool } from '../../MapEvents/resolve-map-event';
import type { ContinentName, MapName } from '../../map.library';
import { MAP_REGISTRY } from '../../map.registry';
import type { Item } from '../../../Items/types';

/**
 * The distinct materials a region's gathering nodes give, in node order.
 * A region with no gathering node, or one not in the map registry, gives `[]`.
 */
export function hazardRegionMaterials(region: MapName): Item[] {
    const out: Item[] = [];
    const seen = new Set<string>();
    for (const continent of Object.keys(MAP_REGISTRY) as ContinentName[]) {
        const def = MAP_REGISTRY[continent][region];
        if (!def) continue;
        for (const node of def.nodes) {
            const pool = getNodeEventPool(continent, region, node.id);
            for (const entry of pool?.entries ?? []) {
                const payload = entry.payload;
                if (payload.kind !== 'gathering') continue;
                for (const item of payload.items) {
                    if (item.category !== 'material' || seen.has(item.id)) continue;
                    seen.add(item.id);
                    out.push({ ...item, quantity: 1 });
                }
            }
        }
    }
    return out;
}
