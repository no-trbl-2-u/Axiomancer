/**
 * WILDS map backdrops — Phase V (the Woodcut Codex).
 *
 * Full-bleed engraving plates rendered (dimmed) under the exploration
 * chart so the map reads as a page torn from a chronicle, not a void.
 * Public-domain woodcuts/engravings only; every file is logged in this
 * directory's `provenance.json`. The chart layer (hatch, contours,
 * roads, nodes) draws ABOVE the plate — the handoff rule is dim, never
 * blur, and never fight the nodes for contrast.
 *
 * Region keying mirrors `assets/images/labyrinth/index.ts`: match on
 * the presenter's region display string; unmatched regions fall back
 * to the dark wood (the pilgrim is always midway through it).
 */

const FOREST_DARK = require('./forest-dark.webp');
const CHARON_CROSSING = require('./charon-crossing.webp');
const THE_PIT = require('./the-pit.webp');
const LUDGATE_HILL = require('./ludgate-hill.webp');
const WENTWORTH_STREET = require('./wentworth-street.webp');

/**
 * Ordered: the FIRST pattern that matches wins, so put the specific before the
 * general. Every plate is public domain with its licence read from the source
 * at acquisition — see `provenance.json` and `scripts/acquire-art.mjs`.
 */
const REGION_BACKDROPS: readonly (readonly [RegExp, number])[] = [
    // Underground before anything else: a cavern is never a wood.
    [/cavern|cave|undercroft|deep/i, THE_PIT],
    // A crossing is its own place, not the bank it starts on.
    [/river|crossing|ford|ferry/i, CHARON_CROSSING],
    // The two settled regions share a hand (both London: A Pilgrimage).
    [/city|citadel|capital/i, LUDGATE_HILL],
    // "the Drowned Parish" (phase 44f's rename of the fishing-village map's
    // region string) has none of "village|town|hamlet|harbour" in it, so the
    // rename silently broke this rule's match on the game's own opening
    // region — matched additively rather than re-derived, since
    // `art-sources.json` already records Wentworth Street as intended for
    // "town-across-river / fishing-village".
    [/village|town|hamlet|harbou?r|drowned parish/i, WENTWORTH_STREET],
    [/forest|wood|wilds/i, FOREST_DARK],
];

/** Resolve the backdrop plate for a region display string. */
export function mapBackdropFor(region: string | undefined): number {
    for (const [pattern, art] of REGION_BACKDROPS) {
        if (region && pattern.test(region)) return art;
    }
    // The pilgrim is always midway through the dark wood — the honest default.
    return FOREST_DARK;
}
