/**
 * Title plate registry — the one engraving behind the title screen and the
 * main menu: Gustave Doré's Purgatorio, Canto I (Dante and Virgil meet Cato
 * on the shore before dawn), acquired by `scripts/acquire-art.mjs`
 * (`scripts/art-sources.json` → `shore-at-dawn`; licence and crop in
 * `provenance.json`). The launcher icons are cropped from the same plate by
 * `scripts/build-title-assets.mjs`.
 */

/** The plate, 1290x1600, graded toward the void like the map backdrops. */
export const TITLE_PLATE = require('./shore-at-dawn.webp');

/** Width over height of `TITLE_PLATE`, for layout before the image loads. */
export const TITLE_PLATE_ASPECT = 1290 / 1600;
