/**
 * Combat-private tuning constants.
 *
 * Cross-cutting numbers (`PASSIVE_DEFENSE_MULTIPLIER`, `DEFENSE_MULTIPLIERS`,
 * `FRIENDSHIP_COUNTER_MAX`, etc.) live in `Game/game-mechanics.constants.ts`
 * because Game / Combat / World all touch them. The constants here are
 * private to the Combat module's proc / effect math — readers tuning
 * combat balance can find every dial in one file.
 *
 * Folded out of `combat-effects.ts` to drain the iterate finding from
 * critique pass 11 (commit `ced226a`).
 */

/** 2% per relevant stance base-stat point — caps proc inflation at reasonable values. */
export const STAT_PROC_BONUS_PER_POINT = 0.02;

/** 5% per intensity stack of `buff_status_chance_up`. */
export const STATUS_CHANCE_BUFF_BONUS = 0.05;

/** Effect id the proc system reads to scale status-chance per-stack. */
export const STATUS_CHANCE_EFFECT_ID = 'buff_status_chance_up';

/** Bonus intensity granted on a crit-guaranteed proc. */
export const CRIT_INTENSITY_BONUS = 1;

/** Bonus duration granted on a crit-guaranteed proc. */
export const CRIT_DURATION_BONUS = 1;
