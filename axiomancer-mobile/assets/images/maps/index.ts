/**
 * WILDS map backdrops (the Woodcut Codex).
 *
 * Full-bleed engraving plates rendered (dimmed) under the exploration
 * chart so the map reads as a page torn from a chronicle, not a void.
 * Public-domain woodcuts/engravings only; every file is logged in this
 * directory's `provenance.json`. The chart layer (hatch, contours,
 * roads, nodes) draws ABOVE the plate — the handoff rule is dim, never
 * blur, and never fight the nodes for contrast.
 *
 * Each map layout names its plate in its sheet
 * (`state/exploration-maps/*.layout.ts`); a screen with no
 * layout falls back to the dark wood (`FALLBACK_SHEET`).
 */

const FOREST_DARK = require('./forest-dark.webp');
const CHARON_CROSSING = require('./charon-crossing.webp');
const THE_PIT = require('./the-pit.webp');
const LUDGATE_HILL = require('./ludgate-hill.webp');
const WENTWORTH_STREET = require('./wentworth-street.webp');

/**
 * The atmosphere plates, by name. Each map layout names its plate explicitly
 * in its sheet, so a region rename cannot silently change which plate a map
 * gets. Every plate is public domain with its licence read from the source
 * at acquisition — see `provenance.json` and `scripts/acquire-art.mjs`.
 */
export const MAP_PLATES = {
    forestDark: FOREST_DARK,
    charonCrossing: CHARON_CROSSING,
    thePit: THE_PIT,
    ludgateHill: LUDGATE_HILL,
    wentworthStreet: WENTWORTH_STREET,
} as const;

/**
 * The four Act 1 plates: one generated Doré-style engraving per region,
 * with landmark positions in `act1-landmarks.json`. Unlike the plates above
 * they are the map itself, not atmosphere; each Act 1 layout names its plate
 * explicitly.
 */
export const ACT1_PLATES = {
    coast: require('./act1-coast.webp'),
    forest: require('./act1-forest.webp'),
    mountains: require('./act1-mountains.webp'),
    underworld: require('./act1-underworld.webp'),
} as const;
