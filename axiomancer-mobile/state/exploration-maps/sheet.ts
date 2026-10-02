import { MAP_PLATES } from '@/assets/images/maps';
import type { MapSheet } from './types';

/**
 * The default sheet size: a 360×400 viewBox spread 2.6x into a 936×1040
 * canvas. The map canvas falls back to it when no sheet is given, and the
 * no-layout fallback sheet uses it.
 */
export const LEGACY_SHEET_SIZE = { width: 360, height: 400, scale: 2.6 } as const;

/**
 * A default-size sheet over the given atmosphere plate, dimmed under the
 * procedural hatch.
 *
 * @param backdrop - the plate's `require()` handle, from `MAP_PLATES`.
 * @returns the 360×400 ×2.6 sheet, plate at 0.2 opacity, chart texture on.
 */
export function legacySheet(backdrop: number): MapSheet {
    return { ...LEGACY_SHEET_SIZE, backdrop, plateOpacity: 0.2, chartTexture: true };
}

/**
 * The sheet a screen falls back to when the current map has no layout: the
 * default size over the dark wood (the pilgrim is always midway through it).
 */
export const FALLBACK_SHEET: MapSheet = legacySheet(MAP_PLATES.forestDark);
