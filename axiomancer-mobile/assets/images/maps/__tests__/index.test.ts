/**
 * Map backdrop assignment — each layout names its plate (map revamp M2).
 *
 * The plate used to be picked by a regex over the region display string
 * (`mapBackdropFor`). Phase 83 found that a rename (phase 44f's "the Drowned
 * Parish") had silently dropped the coastal village's own plate for the forest
 * fallback. M2 retired the regex: each layout's sheet now names its plate, so
 * these pins state the assignment directly, per map, instead of re-deriving it
 * from region strings.
 */

import { describe, expect, it } from '@jest/globals';

import { MAP_PLATES } from '@/assets/images/maps';
import { ALL_MAP_LAYOUTS, getMapLayout } from '@/state/exploration-maps';
import { FALLBACK_SHEET } from '@/state/exploration-maps/sheet';

describe('map layouts name their plates', () => {
    it('keeps the plate each shipped map rendered under the region regex', () => {
        const expected: Record<string, number> = {
            'fishing-village': MAP_PLATES.wentworthStreet,
            'northern-forest': MAP_PLATES.forestDark,
            'caverns': MAP_PLATES.thePit,
            'northern-city': MAP_PLATES.ludgateHill,
            'connecting-river': MAP_PLATES.charonCrossing,
            'town-across-river': MAP_PLATES.wentworthStreet,
            'the-capital': MAP_PLATES.ludgateHill,
        };
        for (const [mapId, plate] of Object.entries(expected)) {
            expect({ mapId, plate: getMapLayout(mapId)?.sheet.backdrop }).toEqual({ mapId, plate });
        }
    });

    it('gives the coastal village ("the Drowned Parish") its own plate, not the forest fallback', () => {
        expect(getMapLayout('fishing-village')?.sheet.backdrop).not.toEqual(FALLBACK_SHEET.backdrop);
    });

    it('gives every layout a plate', () => {
        for (const layout of ALL_MAP_LAYOUTS) {
            // A `require()` handle: a number under Metro, a module object under
            // Jest's asset transform. Either way it must be there.
            expect({ mapId: layout.mapId, has: layout.sheet.backdrop != null }).toEqual({
                mapId: layout.mapId,
                has: true,
            });
        }
    });
});
