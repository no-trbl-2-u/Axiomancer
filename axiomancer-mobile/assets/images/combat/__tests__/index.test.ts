/**
 * Combat arena backdrop resolver — phase 83 (one rule), extended in phases 101
 * and 103. Mirrors `assets/images/maps/__tests__/index.test.ts`'s coverage of
 * the retired `mapBackdropFor`: same region-keyed-with-fallback shape. Six of
 * the eight live regions have a plate of their own; `AWAITING_PLATE` below
 * names the other two and the assertions here pin that count in both
 * directions.
 */

import { describe, expect, it } from '@jest/globals';

import { arenaAltTextFor, arenaBackdropFor } from '@/assets/images/combat';
import { ALL_MAP_LAYOUTS } from '@/state/exploration-maps';

/**
 * Every region string the game can actually hand the resolver, read from the
 * map registry rather than hand-listed.
 *
 * This list used to be written out, on the argument that deriving it from the
 * module's own table would assert only that the table equals itself. That
 * argument is right about the EXPECTED PLATES below — never derive those from
 * `REGION_ARENAS` — and was wrong about the INPUT set, which is what this is.
 * `ALL_MAP_LAYOUTS` is not the implementation under test; it is the game's own
 * statement of which maps exist. Hand-written, the input set omitted the
 * Northern Forest for two phases and every assertion here stayed green over the
 * six regions that were left (burn-day audit 3.11). Derived, a new map with no
 * arena rule fails on its first commit.
 */
const LIVE_REGIONS: readonly string[] = ALL_MAP_LAYOUTS.map((l) => l.region);

/**
 * The live regions that legitimately still reach the fallback plate, and why.
 *
 * `Northern Forest` (`state/exploration-maps/northern-forest.layout.ts`, map
 * `northern-forest`, "Map ii of ii") has no plate of its own yet. Phase 103
 * took the set from 4/7 to 6/7 and the brief says so — `plan/phases/
 * phase_103_the_last_two_arenas.md:13` reads "6 of 7" — but the comments in
 * this file, in `CombatCombatantPane.tsx` and in
 * `__tests__/CombatBoard.region-arena.test.tsx` all claimed 7/7, and the
 * hand-written input set above made the omission invisible. It is named here
 * instead, where it is asserted rather than assumed.
 *
 * This list is meant to reach length 0. It is pinned in BOTH directions below:
 * a region added to it that is not falling back fails, and a region falling
 * back that is not in it fails. So the day the forest plate ships, the case
 * goes red and points at this entry and at the comments that name it.
 */
// Map revamp M3a/M3b/M3c — the Breakwater (Act 1's coast), the Charcoal Wood
// (Act 1's forest) and the Beacon Crags (Act 1's mountains) ship before their
// arena plates; their fights fall back like the Northern Forest's until one is
// chosen.
const AWAITING_PLATE: readonly string[] = ['Northern Forest', 'The Breakwater', 'The Charcoal Wood', 'The Beacon Crags'];

/** The live regions that are meant to have a plate of their own. */
const PLATED_REGIONS: readonly string[] = LIVE_REGIONS.filter((r) => !AWAITING_PLATE.includes(r));

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
     * this case; corrected again by burn-day audit 3.11.
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
     * What is left here is a region string with no rule at all, the undefined
     * dev-sandbox case, and one live region — the Northern Forest, which has no
     * plate yet and is named in `AWAITING_PLATE` above. This case used to say
     * there was no live region among them, which was never true of phase 103's
     * tree.
     */
    it('falls back for a region with no rule, for undefined, and for exactly the regions AWAITING_PLATE names', () => {
        const fallback = arenaBackdropFor(undefined);
        expect(arenaBackdropFor('unknown region')).toEqual(fallback);
        expect(arenaBackdropFor('The Kingdom of Nowhere')).toEqual(fallback);
        // The load-bearing half, in both directions. Fails with MORE than
        // AWAITING_PLATE when a live region loses or never had a rule — the
        // regression this file exists to catch. Fails with FEWER when a plate
        // ships, which is the signal to delete that entry above and correct the
        // comments that name it.
        const fellBack = LIVE_REGIONS.filter((r) => arenaBackdropFor(r) === fallback);
        expect([...fellBack].sort()).toEqual([...AWAITING_PLATE].sort());
    });

    /**
     * AWAITING_PLATE is an exemption, so it must not be able to rot into one.
     * A region renamed in its layout file would otherwise leave a ghost entry
     * quietly excusing the new name from every assertion in this file.
     */
    it('AWAITING_PLATE names only regions the game can actually be in', () => {
        expect(AWAITING_PLATE.filter((r) => !LIVE_REGIONS.includes(r))).toEqual([]);
    });

    it('gives each plated region its OWN plate, all distinct from each other', () => {
        const plates = PLATED_REGIONS.map((r) => arenaBackdropFor(r));
        // No two regions share a plate, which is the whole point: six fights in
        // six places should not look like the same fight. Raised from four in
        // phase 103; it must rise again with every plate added.
        expect(new Set(plates).size).toBe(PLATED_REGIONS.length);
        // Pinned as two numbers, not one: a dropped plate and a dropped map are
        // different failures and neither may hide behind the other.
        expect(PLATED_REGIONS).toHaveLength(6);
        // Map revamp M3a added the Breakwater (7 → 8), M3b the Charcoal Wood (→ 9),
        // M3c the Beacon Crags (→ 10).
        expect(LIVE_REGIONS).toHaveLength(10);
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
    it('has its own fallback description, shared by no plated region', () => {
        const fallback = arenaAltTextFor(undefined);
        expect(fallback.length).toBeGreaterThan(20);
        expect(arenaAltTextFor('unknown region')).toEqual(fallback);
        for (const region of PLATED_REGIONS) {
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
    it('gives every plated region its own description, never the fallback text', () => {
        const texts = PLATED_REGIONS.map((r) => arenaAltTextFor(r));
        const fallback = arenaAltTextFor(undefined);
        for (const t of texts) {
            expect(t).not.toEqual(fallback);
            expect(t.length).toBeGreaterThan(20);
        }
        expect(new Set(texts).size).toBe(PLATED_REGIONS.length);
    });

    /**
     * Alt text describes the IMAGE, not the place. A screen-reader user already
     * knows which region they are standing in — the label exists to tell them
     * what the sighted player is looking at. A description that just names the
     * region is the failure mode this pins.
     */
    it('describes the plate rather than naming the region back to the user', () => {
        for (const region of PLATED_REGIONS) {
            expect(arenaAltTextFor(region).toLowerCase()).not.toContain(region.toLowerCase());
        }
    });
});
