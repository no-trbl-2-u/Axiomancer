/**
 * Effect-interaction amplification bounds.
 *
 * The legacy Pressure-Track resolution thresholds (STATUS_RESOLUTION_*,
 * STATUS_ENGAGEMENT_FLOOR_PERCENT, the EFFECTS_RESOLUTION_* re-export, and
 * INTERACTION_PRIORITY) lived here too; they died with the legacy turn-based
 * combat resolver. The interaction-amplification bounds remain — they are
 * shared infrastructure consumed by `effect-modifiers.ts` in both combat
 * systems.
 */

/**
 * Interaction amplification bounds for Phase 142 effect combinations.
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
