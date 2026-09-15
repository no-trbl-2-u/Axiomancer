/**
 * Combat arena backdrop resolver (phase 83). Mirrors
 * `assets/images/maps/__tests__/index.test.ts`'s coverage of
 * `mapBackdropFor` — same region-keyed-with-fallback shape, one rule so far.
 */

import { describe, expect, it } from '@jest/globals';

import { arenaAltTextFor, arenaBackdropFor } from '@/assets/images/combat';

describe('arenaBackdropFor', () => {
    it('resolves the coastal village (the Drowned Parish) to its own plate', () => {
        const fallback = arenaBackdropFor(undefined);
        expect(arenaBackdropFor('the Drowned Parish')).not.toEqual(fallback);
    });

    it('matches case-insensitively and as a substring of a longer region string', () => {
        expect(arenaBackdropFor('THE DROWNED PARISH')).toEqual(arenaBackdropFor('the Drowned Parish'));
        expect(arenaBackdropFor('Somewhere in the Drowned Parish, near the docks'))
            .toEqual(arenaBackdropFor('the Drowned Parish'));
    });

    it('falls back to the shipped ruined-city plate for every other region', () => {
        const fallback = arenaBackdropFor(undefined);
        expect(arenaBackdropFor('The Caverns')).toEqual(fallback);
        expect(arenaBackdropFor('The Northern City')).toEqual(fallback);
        expect(arenaBackdropFor("The Sweetheart's Village")).toEqual(fallback);
        expect(arenaBackdropFor('unknown region')).toEqual(fallback);
    });

    it('never throws on undefined or empty input — undefined is the ordinary dev-sandbox case', () => {
        expect(() => arenaBackdropFor(undefined)).not.toThrow();
        expect(() => arenaBackdropFor('')).not.toThrow();
    });
});

describe('arenaAltTextFor', () => {
    it('describes the dock scene for the coastal village, not the ruined city', () => {
        const text = arenaAltTextFor('the Drowned Parish');
        expect(text.toLowerCase()).not.toContain('ruined city');
    });

    it('keeps the original ruined-city description as the fallback', () => {
        expect(arenaAltTextFor(undefined)).toContain('ruined city');
        expect(arenaAltTextFor('The Caverns')).toContain('ruined city');
    });
});
