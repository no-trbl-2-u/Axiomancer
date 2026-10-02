/**
 * The XP curve. Reaching level L+1 costs `L × EXPERIENCE_STEP`
 * more XP, so a level's cost rises with it, as fight payouts do (they are
 * `level × DEFAULT_XP_BY_DIFFICULTY`). `experience` is a running total;
 * this helper is the one place a threshold is computed.
 */

import { EXPERIENCE_STEP } from '../Game/game-mechanics.constants';

/**
 * Total XP at which a character becomes `level`: `STEP × (L−1) × L ÷ 2`.
 * Level 1 is 0; with a step of 250, level 2 is 250, 3 is 750, 4 is 1,500,
 * 5 is 2,500.
 */
export function experienceForLevel(level: number): number {
    const l = Math.max(1, Math.floor(level));
    return (EXPERIENCE_STEP * (l - 1) * l) / 2;
}
