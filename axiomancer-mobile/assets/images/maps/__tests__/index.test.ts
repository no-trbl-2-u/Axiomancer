/**
 * Map backdrop assignment — each layout names its plate.
 *
 * Each layout's sheet names its plate, so these pins state the assignment
 * directly, per map, rather than deriving it from region strings (which a
 * rename could silently break).
 */

import { describe, expect, it } from '@jest/globals';

import { ALL_MAP_LAYOUTS } from '@/state/exploration-maps';

describe('map layouts name their plates', () => {
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
