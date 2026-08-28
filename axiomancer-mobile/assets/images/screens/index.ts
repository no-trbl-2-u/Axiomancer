/**
 * Screen backdrop plates — Phase V (the Woodcut Codex), wired in V5.
 *
 * The key → plate resolver for `components/ScreenBg`. It lives beside the art,
 * exactly as `maps/index.ts` maps a region, so `ScreenBg` stays a layout
 * component that knows nothing about which engraving is which.
 *
 * Metro needs static `require()` literals — no dynamic paths, no computed keys.
 *
 * Every plate here is REUSED from `assets/images/maps/`. They were acquired as
 * map backdrops (phase V4, public domain, licence read from the source at
 * acquisition); where one suits a screen it is reused and that directory's
 * `provenance.json` records the second consumer. Nothing is re-acquired to give
 * a screen a private copy of the same engraving.
 */

/** A screen that can carry a backdrop. Adding one means adding a plate. */
export type ScreenArtKey =
    | 'event'
    | 'labyrinth'
    | 'combat';

const PLATES: Record<ScreenArtKey, number> = {
    // Map events happen on the road between places: the crossing plate.
    event: require('../maps/charon-crossing.webp'),
    // The Aporia is a hole in the ground with something at the bottom of it.
    labyrinth: require('../maps/the-pit.webp'),
    // The one arena we have. Combat variety is a coverage problem, not a
    // wiring one — see the phase V5 brief's follow-ups.
    combat: require('../combat/arena-ruined-city.jpg'),
};

/**
 * The plate for a screen key, or null.
 *
 * Null is the ordinary case, not an error: a screen with no key keeps the
 * procedural look, which stays the fallback rather than becoming a leftover.
 */
export function screenBackdropFor(key: ScreenArtKey | undefined | null): number | null {
    if (!key) return null;
    return PLATES[key] ?? null;
}

/** Every wired key — the drift test asserts each resolves. */
export const SCREEN_ART_KEYS = Object.keys(PLATES) as ScreenArtKey[];
