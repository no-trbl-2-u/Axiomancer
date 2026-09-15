/**
 * Combat arena backdrops — Phase 83 (Woodcut Codex, V-series follow-up).
 *
 * `CombatCombatantPane`'s full-bleed battlefield scene, region-keyed the same
 * way `assets/images/maps/index.ts` keys the exploration-map backdrop: an
 * ordered list of `(RegExp, plate)` rules, first match wins, unmatched falls
 * back to the arena that already shipped. V5 deferred "arena plates beyond
 * the one that exists" to a per-plate curation follow-up (its own brief's
 * words) rather than pad the slot with whatever engraving was to hand; this
 * is that follow-up's first plate, not a replacement for the slot.
 *
 * The region match is deliberately narrow (`/drowned parish/i`, the actual
 * live display string) rather than a reuse of the maps registry's generic
 * `village|town` rule — that generality is exactly what let it stop matching
 * silently after the 44f naming pass renamed the region, and a second
 * coastal-flavoured region can register its own rule later without
 * contorting this one.
 */

const ARENA_RUINED_CITY = require('./arena-ruined-city.jpg');
const ARENA_COASTAL_VILLAGE = require('./coastal-village.webp');

/**
 * Ordered: the FIRST pattern that matches wins. Every plate's licence is
 * proven at acquisition — see `provenance.json` and `scripts/acquire-art.mjs`
 * (the coastal plate) or `arena-ruined-city.provenance.json` (the
 * owner-supplied fallback, licence UNRESOLVED and tracked in `plan/AUDIT.md`).
 */
const REGION_ARENAS: readonly (readonly [RegExp, number])[] = [
    // The coastal village (the Drowned Parish) — the game's opening region.
    [/drowned parish/i, ARENA_COASTAL_VILLAGE],
];

/** Resolve the arena backdrop for a region display string. */
export function arenaBackdropFor(region: string | undefined): number {
    for (const [pattern, art] of REGION_ARENAS) {
        if (region && pattern.test(region)) return art;
    }
    // The one arena that already shipped is the honest default — not a
    // rule in the table, so every currently-unmapped region keeps today's
    // behaviour byte-for-byte.
    return ARENA_RUINED_CITY;
}

/**
 * The scene's accessibility label, kept in step with the plate. A
 * screen-reader user hearing "ruined city skyline" over a dockside plate
 * would be told something false.
 */
export function arenaAltTextFor(region: string | undefined): string {
    if (region && /drowned parish/i.test(region)) {
        return 'Fishermen crowd a moored boat’s rigging, masts forested against a backlit dockside sky';
    }
    return 'A storm-lit ruined city skyline over a cracked stone floor';
}
