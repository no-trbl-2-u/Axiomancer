/**
 * The XP curve. Reaching level 2 costs `EXPERIENCE_BASE`; each later step
 * costs the previous one times its band's growth rate (`EXPERIENCE_GROWTH`),
 * so levels come early and often, then slow after 20 and again after 40.
 * `experience` is a running total; this module is the one place a threshold
 * is computed.
 */

import { EXPERIENCE_BASE, EXPERIENCE_GROWTH } from '../Game/game-mechanics.constants';

/** The growth rate of the step out of `level`. */
function growthRate(level: number): number {
    return EXPERIENCE_GROWTH.find(band => level <= band.fromLevel)!.rate;
}

// Exact (unrounded) step costs and rounded running totals, grown on demand.
// `exactSteps[i]` is the step from level i + 1 to i + 2; `totals[i]` is the
// XP at which a character becomes level i + 1.
const exactSteps: number[] = [EXPERIENCE_BASE];
const totals: number[] = [0];

function extendTo(level: number): void {
    while (totals.length < level) {
        const from = totals.length;
        if (exactSteps.length < from) {
            exactSteps.push(exactSteps[exactSteps.length - 1]! * growthRate(from));
        }
        totals.push(totals[from - 1]! + Math.round(exactSteps[from - 1]!));
    }
}

/** The XP to go from `level` to `level + 1`, rounded to a whole XP. */
export function experienceToNext(level: number): number {
    const l = Math.max(1, Math.floor(level));
    return experienceForLevel(l + 1) - experienceForLevel(l);
}

/**
 * Total XP at which a character becomes `level`: the sum of the steps below
 * it. Level 1 is 0, 2 is 70, 5 is 325, 10 is 950, 20 is 3,582.
 */
export function experienceForLevel(level: number): number {
    const l = Math.max(1, Math.floor(level));
    extendTo(l);
    return totals[l - 1]!;
}

/** The highest level `experience` XP reaches from level 1. */
export function levelForExperience(experience: number): number {
    let level = 1;
    while (experience >= experienceForLevel(level + 1)) level += 1;
    return level;
}
