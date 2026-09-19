/**
 * Combat arena backdrops — Phase 83 (Woodcut Codex, V-series follow-up),
 * extended to the whole region set in Phase 101.
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
 * The one exception is the fallback, `arena-ruined-city.jpg` — owner-supplied,
 * licence UNRESOLVED, tracked in `plan/AUDIT.md`. It is the reason the licence
 * check exists at all.
 */

const ARENA_RUINED_CITY = require('./arena-ruined-city.jpg');
const ARENA_COASTAL_VILLAGE = require('./coastal-village.webp');
const ARENA_NORTHERN_CITY = require('./arena-northern-city.webp');
const ARENA_CONNECTING_RIVER = require('./arena-connecting-river.webp');
const ARENA_SWEETHEARTS_VILLAGE = require('./arena-sweethearts-village.webp');

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
];

/**
 * The arena shown wherever no rule matches.
 *
 * Kept OUT of the table on purpose: it is not a region rule, it is the absence
 * of one, and every unmapped region keeps today's behaviour byte-for-byte.
 */
const FALLBACK_ARENA: Omit<ArenaPlate, 'pattern'> = {
    art: ARENA_RUINED_CITY,
    alt: 'A storm-lit ruined city skyline over a cracked stone floor',
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
