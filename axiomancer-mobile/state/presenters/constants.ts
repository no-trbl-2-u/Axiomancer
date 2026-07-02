/**
 * Cross-presenter mobile-side display constants.
 *
 * Shared by sibling presenters (`combat.engine.ts`,
 * `combat-hud.engine.ts`, ...) that would otherwise hold parallel
 * `const` literals. Engine ships no opinion on these — they're
 * pure mobile chrome.
 */

/**
 * Maximum number of active effects surfaced on a combat HUD strip
 * (player and enemy alike). Strips beyond this count truncate in
 * insertion order. Holds steady at 4 to fit the visual band; bump
 * here and both presenters pick it up.
 */
export const MAX_EFFECTS_SHOWN = 4;
