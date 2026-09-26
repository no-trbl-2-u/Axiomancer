/**
 * Map sheets (map revamp M2, D15/D16).
 *
 * Each layout declares its own sheet: coordinate space, render scale, plate.
 * D16 rules that a map must not read as a climb, and that its canvas is larger
 * than the viewport on BOTH axes, so reaching the whole map takes panning in
 * every direction. The rendered canvas is `width * scale` by `height * scale`.
 */

import { describe, expect, it } from '@jest/globals';

import { canvasSizeOf } from '@/components/exploration/MapCanvas';
import { ALL_MAP_LAYOUTS } from '../index';
import { LEGACY_SHEET_SIZE } from '../sheet';

/**
 * The largest phone portrait viewport the smoke screens drive (414×896).
 * The canvas has to exceed it on both axes or one axis never pans.
 */
const PHONE_VIEWPORT = { w: 414, h: 896 };

describe('map sheets', () => {
    it('renders every map on a canvas larger than a phone viewport on both axes (D16)', () => {
        for (const layout of ALL_MAP_LAYOUTS) {
            const canvas = canvasSizeOf(layout.sheet);
            expect({ mapId: layout.mapId, wider: canvas.w > PHONE_VIEWPORT.w, taller: canvas.h > PHONE_VIEWPORT.h })
                .toEqual({ mapId: layout.mapId, wider: true, taller: true });
        }
    });

    it('gives every plate a visible, bounded opacity', () => {
        for (const layout of ALL_MAP_LAYOUTS) {
            expect(layout.sheet.plateOpacity).toBeGreaterThan(0);
            expect(layout.sheet.plateOpacity).toBeLessThanOrEqual(1);
        }
    });

    it('keeps the legacy canvas at 936×1040, the size the shipped maps were laid out for', () => {
        expect(canvasSizeOf(LEGACY_SHEET_SIZE)).toEqual({ w: 936, h: 1040 });
    });
});
