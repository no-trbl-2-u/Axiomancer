/**
 * Effect-interaction amplification bounds, consumed by
 * `effect-modifiers.ts`.
 */

/**
 * Interaction amplification bounds for effect combinations.
 * These limits prevent runaway amplification while allowing meaningful
 * synergy bonuses.
 */
export const INTERACTION_AMPLIFICATION = {
    /** Maximum intensity multiplier for effect interactions. */
    MAX_INTENSITY_MULTIPLIER: 2.0,
    /** Maximum duration multiplier for effect interactions. */
    MAX_DURATION_MULTIPLIER: 2.5,
    /** Maximum damage amplification for DoT interactions. */
    MAX_DAMAGE_MULTIPLIER: 2.0,
    /** Minimum amplification to be worthwhile (prevents tiny bonuses). */
    MIN_MEANINGFUL_AMPLIFICATION: 1.1
} as const;
