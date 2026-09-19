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

    /**
     * INVARIANT CHANGED, deliberately — Phase 101.
     *
     * This case used to assert that The Northern City and The Sweetheart's
     * Village fall back to the ruined-city plate. That was true, and it was the
     * bug: six of seven live regions fought in front of the same generic
     * cityscape. Three of them now have their own plate, so they are asserted
     * against their plates below instead. What still falls back — a region with
     * no rule, and the undefined dev-sandbox case — is asserted here.
     */
    it('falls back to the shipped ruined-city plate for a region with no rule', () => {
        const fallback = arenaBackdropFor(undefined);
        expect(arenaBackdropFor('The Caverns')).toEqual(fallback);
        expect(arenaBackdropFor('The Capital')).toEqual(fallback);
        expect(arenaBackdropFor('unknown region')).toEqual(fallback);
    });

    it('gives each keyed region its OWN plate, all distinct from each other', () => {
        const fallback = arenaBackdropFor(undefined);
        const keyed = {
            parish: arenaBackdropFor('the Drowned Parish'),
            city: arenaBackdropFor('The Northern City'),
            river: arenaBackdropFor('The Connecting River'),
            village: arenaBackdropFor("The Sweetheart's Village"),
        };
        // None of them is the fallback any more...
        for (const art of Object.values(keyed)) expect(art).not.toEqual(fallback);
        // ...and no two regions share a plate, which is the whole point: four
        // fights in four places should not look like the same fight.
        expect(new Set(Object.values(keyed)).size).toBe(4);
    });

    it("matches the village on `sweetheart` alone, so the apostrophe cannot break it", () => {
        // The live string is "The Sweetheart's Village". A pattern spanning the
        // apostrophe would break on a straight/curly swap in the layout file.
        const village = arenaBackdropFor("The Sweetheart's Village");
        expect(arenaBackdropFor('The Sweetheart\u2019s Village')).toEqual(village);
        expect(arenaBackdropFor('sweetheart')).toEqual(village);
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
        // The Caverns still has no plate of its own, so it still gets these words.
        expect(arenaAltTextFor('The Caverns')).toContain('ruined city');
    });

    /**
     * The drift guard. `arenaBackdropFor` and `arenaAltTextFor` read the same
     * record, so a plate cannot ship carrying another plate's words — but that
     * is only true while they both go through `plateFor`. This asserts the
     * property rather than the wiring: every region with its own plate must
     * also have its own description, and none may keep the fallback's.
     */
    it('gives every keyed region its own description, never the fallback text', () => {
        const regions = [
            'the Drowned Parish',
            'The Northern City',
            'The Connecting River',
            "The Sweetheart's Village",
        ];
        const texts = regions.map((r) => arenaAltTextFor(r));
        for (const t of texts) {
            expect(t).not.toContain('ruined city');
            expect(t.length).toBeGreaterThan(20);
        }
        expect(new Set(texts).size).toBe(regions.length);
    });
});
