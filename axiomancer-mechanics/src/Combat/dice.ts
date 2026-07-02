/**
 * Combat dice: skill checks and crit detection.
 */

import { createDieRoll } from '../Utils';
import { Advantage } from './types';

/**
 * Performs a d20 skill check, applying advantage/disadvantage and a flat modifier.
 *
 * @returns Object with the final `total`, the raw d20 `roll`, and the `modifier` applied.
 */
export function rollSkillCheck(
    modifier: number,
    advantage: Advantage,
): { total: number; roll: number; modifier: number } {
    const roll = createDieRoll(advantage)();
    return { total: roll + modifier, roll, modifier };
}

/** True on a natural 20. */
export function isCriticalHit(roll: number): boolean { return roll === 20; }

/** True on a natural 1. */
export function isCriticalMiss(roll: number): boolean { return roll === 1; }
