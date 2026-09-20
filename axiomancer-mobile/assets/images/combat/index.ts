/**
 * Combat arena backdrops — Phase 83 (Woodcut Codex, V-series follow-up),
 * extended in Phases 101 and 103. Not the whole region set: the Northern
 * Forest has no plate and falls back. The count is pinned by this module's
 * test against the map registry, never restated here.
 *
 * `CombatCombatantPane`'s full-bleed battlefield scene, region-keyed the same
 * way `assets/images/maps/index.ts` keys the exploration-map backdrop: an
 * ordered list of rules, first match wins, unmatched falls back to the arena
 * that already shipped.
 *
 * ## One table, not two (Phase 101)
 *
 * The plate and its screen-reader description used to live in two separate
 * functions — an ordered `REGION_ARENAS` table for the image, and a hand-written
 * `if` chain for the alt text. With one region that was merely redundant. With
 * seven it is a drift hazard with a specific failure mode: a plate ships, its
 * `if` branch is forgotten, and a screen-reader user is confidently told they
 * are looking at a storm-lit ruined city while the sighted player sees a
 * cathedral. Nothing would have caught it — the provenance gate checks that art
 * is *reachable*, not that it is *described*.
 *
 * So a plate and its description are now ONE record. You cannot add the image
 * without writing the words, because they are the same object.
 *
 * ## The register
 *
 * Every plate is a 19th-century engraving in the public domain, acquired and
 * licence-proven by `scripts/acquire-art.mjs` (which reads Commons' own
 * `imageinfo` extmetadata and refuses anything it cannot prove is PD/CC0), then
 * graded toward the void by the shared recipe in `scripts/ingest-art.mjs`. See
 * `provenance.json` beside this file for the per-plate record.
 *
 * ## The fallback was replaced (Phase 103)
 *
 * It used to be `arena-ruined-city.jpg`: owner-supplied, licence UNRESOLVED,
 * and — visible the moment anyone looked at it — saturated PIXEL ART of modern
 * high-rise buildings, sitting among nine grayscale wood engravings. Because it
 * is the fallback it was the most-seen arena in the game, so it was both the
 * licence exposure and the worst visual mismatch in the product.
 *
 * THE OPEN GATE ¶6 (2026-08-28) makes that a loop call rather than an owner
 * one: art that cannot be traced within reasonable effort is a re-art decision,
 * "replace via the licensed trove and retire the untraceable asset". This is
 * that retirement. The replacement is Doré's "The New Zealander" (1873), chosen
 * because a fallback must stay coherent behind regions it was not drawn for:
 * heavy dark mass at the edges, a lit band across the middle where the foe
 * composites, and a subject — ruin outliving the city that made it — general
 * enough not to contradict an unmapped region.
 */

const ARENA_DESOLATION = require('./arena-desolation.webp');
const ARENA_COASTAL_VILLAGE = require('./coastal-village.webp');
const ARENA_NORTHERN_CITY = require('./arena-northern-city.webp');
const ARENA_CONNECTING_RIVER = require('./arena-connecting-river.webp');
const ARENA_SWEETHEARTS_VILLAGE = require('./arena-sweethearts-village.webp');
const ARENA_CAVERNS = require('./arena-caverns.webp');
const ARENA_THE_CAPITAL = require('./arena-the-capital.webp');

/**
 * One arena: the region it answers, the plate, and what a screen-reader user is
 * told they are looking at.
 *
 * @property pattern - matched case-insensitively against the region's live
 *   display string (e.g. `'the Drowned Parish'`). Deliberately narrow — see the
 *   ordering note on {@link REGION_ARENAS}.
 * @property art     - the `require()`d asset module id.
 * @property alt     - what is actually IN the plate. Not the region's name: a
 *   user who cannot see the image gains nothing from being told the name of the
 *   place they already know they are standing in.
 */
interface ArenaPlate {
    readonly pattern: RegExp;
    readonly art: number;
    readonly alt: string;
}

/**
 * Ordered: the FIRST pattern that matches wins.
 *
 * Every pattern is narrow and names its own region rather than reusing the maps
 * registry's generic `village|town` / `city|citadel|capital` families. Two
 * reasons, both learned the hard way:
 *
 *   1. A generic rule stops matching SILENTLY when a region is renamed — which
 *      is exactly what happened to the maps registry after the 44f naming pass.
 *   2. The generic `city|capital` family would collapse The Northern City and
 *      The Capital onto one plate, and those are the two places this game most
 *      wants to feel different from each other.
 *
 * Because the patterns are disjoint, order is not currently load-bearing — but
 * it is still first-match-wins, so a future broad rule must be appended AFTER
 * the narrow ones, never before.
 */
const REGION_ARENAS: readonly ArenaPlate[] = [
    // The coastal village (the Drowned Parish) — the game's opening region.
    {
        pattern: /drowned parish/i,
        art: ARENA_COASTAL_VILLAGE,
        alt: 'Fishermen crowd a moored boat’s rigging, masts forested against a backlit dockside sky',
    },
    // Phase 101 — the northern continent's three settled regions. All three are
    // plates from the SAME edition as the coastal arena above (Doré's "London:
    // A Pilgrimage", 1872, via the Gallica scans on Commons), which is what
    // makes the set read as one hand rather than four borrowed pictures.
    {
        // "Over London by Rail". A city grim by ordinary congestion, not by
        // monsters — the register the northern city is written in.
        pattern: /northern city/i,
        art: ARENA_NORTHERN_CITY,
        alt: 'Tenement backyards and chimney stacks crowd beneath a railway viaduct, seen through a dark brick arch',
    },
    {
        // A landing rather than a view of open water: the region is a crossing
        // you arrive at. Deliberately not the maps registry's Charon plate —
        // the player has just walked over that one to get here.
        pattern: /connecting river/i,
        art: ARENA_CONNECTING_RIVER,
        alt: 'A crowd presses at a dock gate under a low sun, a forest of ships’ masts massed behind',
    },
    {
        // "Dudley Street, Seven Dials". Matched on `sweetheart` alone: the live
        // display string carries an apostrophe ("The Sweetheart's Village") and
        // a pattern that spans it would break on a straight/curly swap.
        pattern: /sweetheart/i,
        art: ARENA_SWEETHEARTS_VILLAGE,
        alt: 'A slum lane of low terraces with children in the roadway and second-hand wares laid out on the stones',
    },
    // Phase 103 — the two regions the earlier pass could not reach, now that the
    // acquisition pipeline can crop a plate off a scanned page. Both are Doré
    // Dante plates rather than London ones: neither the caverns nor the capital
    // has a documentary-London equivalent, and the brief for this phase records
    // that deliberate break from the single-source rule.
    {
        // "Abandon all hope ye who enter here" — a gate cut into a rock face,
        // two figures at the threshold, a lit horizon band behind. The region
        // BEGINS underground, so its arena wants the moment of going in rather
        // than a cave interior. Distinct from the maps registry's Titans plate,
        // which the player crossed to get here.
        pattern: /cavern/i,
        art: ARENA_CAVERNS,
        alt: 'A vast gateway cut into a rock face, two small figures at its threshold beneath a lit horizon',
    },
    {
        // The Empyrean Rose. The capital is where the advisor-selection payoff
        // lands, so its arena is the one place that dwarfs the player: a court
        // that is vast, ranked and wholly indifferent. The two supplicants at
        // the base of the frame are exactly the player's position.
        //
        // Ordered AFTER the other rules but its pattern is narrow, so position
        // is not load-bearing — see the ordering note above.
        pattern: /the capital/i,
        art: ARENA_THE_CAPITAL,
        alt: 'Two small figures stand on a rock before an immense spiralling host of winged forms circling a blinding light',
    },
];

/**
 * The arena shown wherever no rule matches.
 *
 * Kept OUT of the table on purpose: it is not a region rule, it is the absence
 * of one, and every unmapped region keeps today's behaviour byte-for-byte.
 */
const FALLBACK_ARENA: Omit<ArenaPlate, 'pattern'> = {
    art: ARENA_DESOLATION,
    alt: 'A cloaked figure sits on a broken wharf sketching the ruins of a dead city across black water under a clouded moon',
};

/** The matching plate for a region display string, or the fallback. */
function plateFor(region: string | undefined): Omit<ArenaPlate, 'pattern'> {
    if (region) {
        for (const plate of REGION_ARENAS) {
            if (plate.pattern.test(region)) return plate;
        }
    }
    return FALLBACK_ARENA;
}

/** Resolve the arena backdrop for a region display string. */
export function arenaBackdropFor(region: string | undefined): number {
    return plateFor(region).art;
}

/**
 * The scene's accessibility label, kept in step with the plate BY CONSTRUCTION —
 * both read the same record, so a plate cannot ship with another plate's words.
 */
export function arenaAltTextFor(region: string | undefined): string {
    return plateFor(region).alt;
}
