/**
 * Combat arena backdrop resolver — phase 83 (one rule), extended to the whole
 * region set in phases 101 and 103. Mirrors
 * `assets/images/maps/__tests__/index.test.ts`'s coverage of `mapBackdropFor`:
 * same region-keyed-with-fallback shape.
 */

import { describe, expect, it } from '@jest/globals';

import { arenaAltTextFor, arenaBackdropFor } from '@/assets/images/combat';

/**
 * Every region string the game can actually hand the resolver, and the plate
 * each one is meant to reach. Written out rather than derived from the module's
 * own table on purpose: a test that reads the implementation's table asserts
 * only that the table equals itself, and would have stayed green through both
 * of the regressions this file exists to catch (a region silently falling back,
 * and a plate shipping with another plate's words).
 */
const KEYED_REGIONS = [
    'the Drowned Parish',
    'The Northern City',
    'The Connecting River',
    "The Sweetheart's Village",
    'The Caverns',
    'The Capital',
] as const;

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

    /**
     * INVARIANT CHANGED, deliberately — phase 103, the second such change to
     * this case.
     *
     * Phase 101 narrowed it from "The Northern City and The Sweetheart's
     * Village fall back" to "The Caverns and The Capital fall back". Both
     * statements were true when written and both described the same bug: a live
     * region fighting in front of a plate drawn for somewhere else.
     *
     * The acquisition pipeline can now crop a plate off a scanned page
     * (`buildPlatePage` / `detectPlateBox` in `scripts/acquire-art.mjs`), which
     * is the exact blocker phase 101's follow-up list named. So the Caverns and
     * the Capital have their own plates and are asserted against them below.
     *
     * What is left here is the only thing that should ever have been here: a
     * region string with no rule at all, and the undefined dev-sandbox case.
     * Those two must keep falling back, and there is no longer any live region
     * among them.
     */
    it('falls back only for a region with no rule, and for no live region', () => {
        const fallback = arenaBackdropFor(undefined);
        expect(arenaBackdropFor('unknown region')).toEqual(fallback);
        expect(arenaBackdropFor('The Kingdom of Nowhere')).toEqual(fallback);
        // The load-bearing half: no region the game can actually be in lands here.
        for (const region of KEYED_REGIONS) {
            expect(arenaBackdropFor(region)).not.toEqual(fallback);
        }
    });

    it('gives each keyed region its OWN plate, all distinct from each other', () => {
        const plates = KEYED_REGIONS.map((r) => arenaBackdropFor(r));
        // No two regions share a plate, which is the whole point: six fights in
        // six places should not look like the same fight. Raised from four in
        // phase 103; it must rise again with every plate added.
        expect(new Set(plates).size).toBe(KEYED_REGIONS.length);
        expect(KEYED_REGIONS.length).toBe(6);
    });

    it("matches the village on `sweetheart` alone, so the apostrophe cannot break it", () => {
        // The live string is "The Sweetheart's Village". A pattern spanning the
        // apostrophe would break on a straight/curly swap in the layout file.
        const village = arenaBackdropFor("The Sweetheart's Village");
        expect(arenaBackdropFor('The Sweetheart’s Village')).toEqual(village);
        expect(arenaBackdropFor('sweetheart')).toEqual(village);
    });

    /**
     * `/the capital/i` is the one pattern that is a substring of nothing else,
     * but it IS a substring of prose. Pinned because the Northern City and the
     * Capital are the two regions the game most wants to feel unlike each
     * other, and a generic `city|capital` family would have collapsed them.
     */
    it('keeps The Capital and The Northern City on separate plates', () => {
        expect(arenaBackdropFor('The Capital')).not.toEqual(arenaBackdropFor('The Northern City'));
    });

    it('never throws on undefined or empty input — undefined is the ordinary dev-sandbox case', () => {
        expect(() => arenaBackdropFor(undefined)).not.toThrow();
        expect(() => arenaBackdropFor('')).not.toThrow();
    });
});

describe('arenaAltTextFor', () => {
    it('describes the dock scene for the coastal village, not the fallback plate', () => {
        const text = arenaAltTextFor('the Drowned Parish');
        expect(text).not.toEqual(arenaAltTextFor(undefined));
        expect(text.toLowerCase()).toContain('boat');
    });

    /**
     * INVARIANT CHANGED, deliberately — phase 103.
     *
     * This case used to assert the fallback text contains 'ruined city', and
     * that The Caverns gets those same words. Neither is true any more and both
     * changes are the point: `arena-ruined-city.jpg` was a saturated pixel-art
     * cityscape carrying licence UNRESOLVED, sitting among grayscale wood
     * engravings and — because it was the fallback — shown more often than any
     * other arena in the game. THE OPEN GATE ¶6 makes retiring an untraceable
     * asset a loop call, so it was retired and Doré's "The New Zealander"
     * (1873) took its place.
     *
     * The assertion is re-derived against the PROPERTY rather than the words,
     * so the next plate swap does not require editing a string literal here:
     * the fallback must describe something, and it must not be any keyed
     * region's description.
     */
    it('has its own fallback description, shared by no keyed region', () => {
        const fallback = arenaAltTextFor(undefined);
        expect(fallback.length).toBeGreaterThan(20);
        expect(arenaAltTextFor('unknown region')).toEqual(fallback);
        for (const region of KEYED_REGIONS) {
            expect(arenaAltTextFor(region)).not.toEqual(fallback);
        }
    });

    /**
     * The drift guard. `arenaBackdropFor` and `arenaAltTextFor` read the same
     * record, so a plate cannot ship carrying another plate's words — but that
     * is only true while they both go through `plateFor`. This asserts the
     * property rather than the wiring: every region with its own plate must
     * also have its own description, and no two may share one.
     */
    it('gives every keyed region its own description, never the fallback text', () => {
        const texts = KEYED_REGIONS.map((r) => arenaAltTextFor(r));
        const fallback = arenaAltTextFor(undefined);
        for (const t of texts) {
            expect(t).not.toEqual(fallback);
            expect(t.length).toBeGreaterThan(20);
        }
        expect(new Set(texts).size).toBe(KEYED_REGIONS.length);
    });

    /**
     * Alt text describes the IMAGE, not the place. A screen-reader user already
     * knows which region they are standing in — the label exists to tell them
     * what the sighted player is looking at. A description that just names the
     * region is the failure mode this pins.
     */
    it('describes the plate rather than naming the region back to the user', () => {
        for (const region of KEYED_REGIONS) {
            expect(arenaAltTextFor(region).toLowerCase()).not.toContain(region.toLowerCase());
        }
    });
});
