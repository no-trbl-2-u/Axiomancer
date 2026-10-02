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
 * The live regions that legitimately still reach the fallback plate. Pinned in
 * BOTH directions below: a region added here that is not falling back fails,
 * and a region falling back that is not here fails. So the day a plate ships,
 * the case goes red and points at this entry.
 */
// Map revamp M3a-M3d — the Breakwater (Act 1's coast), the Charcoal Wood
// (Act 1's forest), the Beacon Crags (Act 1's mountains) and the Lantern Deep
// (Act 1's underworld) ship before their arena plates; their fights fall back
// until one is chosen. R7e (D72) deleted the Northern Forest with the parked
// maps, and the five plated parked regions with it.
const AWAITING_PLATE: readonly string[] = [
    'The Breakwater', 'The Charcoal Wood', 'The Beacon Crags', 'The Lantern Deep',
];

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
     * dev-sandbox case, and the live regions `AWAITING_PLATE` names.
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
        // Revamp R3b purged the fishing-village map (the Drowned Parish), so its
        // plated region left the live set (6 → 5); R7e deleted the other five
        // with the parked maps (→ 0).
        expect(PLATED_REGIONS).toHaveLength(0);
        // The four Act 1 maps are the whole world since R7e.
        expect(LIVE_REGIONS).toHaveLength(4);
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
