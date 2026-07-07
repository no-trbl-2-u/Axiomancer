/**
 * The Aporia — per-room scene backdrops.
 *
 * Keyed by engine node id (`ap1-1` … `ap3-16`). When a room has an
 * entry here, `<RoomScene>` renders it under the POI layer instead of
 * the procedural ink placeholder; the door/POI hotspots stay engine-
 * driven either way.
 *
 * INTENTIONALLY EMPTY at ship: the 1985 MAZE book scans under
 * `plan/labyrinth/reference/maze-images/` are reference-only
 * (copyrighted, and their in-picture door numbers contradict our
 * authored rooms — display numbers are clue material). Art contract
 * for replacements, per room:
 *
 *  - black-ink-on-parchment, landscape 3:2 (720x480 or 2x),
 *  - back wall holding the room's authored door count, doorways left
 *    blank (the POI layer draws plaques + arches on top),
 *  - floor band (lower ~40%) kept quiet so object POIs read,
 *  - no digits anywhere in the art (numbers come from the engine).
 *
 * Drop files in this folder and register them:
 *   'ap1-1': require('./ap1-1.webp'),
 */

export const LABYRINTH_SCENE_BACKDROPS: Readonly<Record<string, number>> = Object.freeze({});
