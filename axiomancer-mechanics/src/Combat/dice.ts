/**
 * Combat dice: crit detection.
 */

/** True on a natural 20. */
export function isCriticalHit(roll: number): boolean { return roll === 20; }

/** True on a natural 1. */
export function isCriticalMiss(roll: number): boolean { return roll === 1; }
