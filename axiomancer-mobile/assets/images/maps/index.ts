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

const REGION_BACKDROPS: readonly (readonly [RegExp, number])[] = [
    [/forest/i, FOREST_DARK],
];

/** Resolve the backdrop plate for a region display string. */
export function mapBackdropFor(region: string | undefined): number {
    for (const [pattern, art] of REGION_BACKDROPS) {
        if (region && pattern.test(region)) return art;
    }
    return FOREST_DARK;
}
