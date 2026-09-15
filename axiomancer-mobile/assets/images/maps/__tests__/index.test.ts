/**
 * Map backdrop resolver (phase V4/V5, `mapBackdropFor`). Previously
 * untested — phase 83 adds coverage while fixing the regression it found:
 * phase 44f (2026-08-12) renamed the fishing-village map's region string
 * from "Fishing Village" to "the Drowned Parish"
 * (`state/exploration-maps/fishing-village.layout.ts`), which has none of
 * "village|town|hamlet|harbour" in it — the coastal village's own map
 * backdrop had silently fallen through to the forest default ever since.
 */

import { describe, expect, it } from '@jest/globals';

import { mapBackdropFor } from '@/assets/images/maps';

describe('mapBackdropFor', () => {
    it('resolves the coastal village ("the Drowned Parish") to Wentworth Street, not the forest fallback', () => {
        const forestFallback = mapBackdropFor(undefined);
        const drownedParish = mapBackdropFor('the Drowned Parish');
        expect(drownedParish).not.toEqual(forestFallback);
        // Same plate as the other settled/village region, per art-sources.json's
        // recorded intent ("town-across-river / fishing-village").
        expect(drownedParish).toEqual(mapBackdropFor("The Sweetheart's Village"));
    });

    it('still resolves the other named regions to their recorded plates', () => {
        const caverns = mapBackdropFor('The Caverns');
        const river = mapBackdropFor('The Connecting River');
        const city = mapBackdropFor('The Northern City');
        const forest = mapBackdropFor('Northern Forest');
        const village = mapBackdropFor("The Sweetheart's Village");
        // All distinct from one another (each named region gets its own plate).
        expect(new Set([caverns, river, city, village]).size).toBe(4);
        expect(forest).toEqual(mapBackdropFor(undefined));
    });

    it('falls back to the forest plate for an unmatched region', () => {
        expect(mapBackdropFor('somewhere unnamed')).toEqual(mapBackdropFor(undefined));
        expect(mapBackdropFor(undefined)).toEqual(mapBackdropFor(undefined));
    });
});
