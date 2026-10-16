/**
 * Hazard puzzle — tuning. Every number the puzzle mode reads lives here.
 *
 * Bands are counted in distinct winning outcomes (see the solver). They
 * apply to authored puzzle content only: a layout declares its band per
 * route and the library test holds it there.
 */

import type { CacheLootTier } from '../../../Items/cache-reward';
import { HAZARD_TUNING } from '../hazard.tuning';
import type { HazardRouteKey } from '../hazard.types';

export const HAZARD_PUZZLE_TUNING = {
    bands: {
        /** Easy: many ways through. */
        easy: { minOutcomes: 30 },
        /** Medium: a handful of ways through. */
        medium: { minOutcomes: 5, maxOutcomes: 29 },
        /** Hard: one to four ways through, and the best line barely clears. */
        hard: { minOutcomes: 1, maxOutcomes: 4, maxBestSurplus: 1 },
    },
    solver: {
        /**
         * Most distinct board states the solver explores in one round. A
         * layout past it fails the library test as "too open to count":
         * shrink the layout rather than raise this.
         */
        budget: 20_000,
    },
} as const;

export const HAZARD_PUZZLE_BANDS = HAZARD_PUZZLE_TUNING.bands;
export const HAZARD_PUZZLE_SOLVER_BUDGET = HAZARD_PUZZLE_TUNING.solver.budget;

/**
 * What every resolve pays, and the bonus a full completion adds.
 *
 *  - `xpPerLevel`: XP per player level on any resolve.
 *  - `completionXpBonus`: the extra share of that XP on a full completion.
 *  - `consumableTier`: the tier of the one consumable roll.
 *  - `purse`: shillings a full completion pays, per route (the live
 *    hazards' purses).
 */
export const HAZARD_PUZZLE_REWARDS: Readonly<{
    xpPerLevel: number;
    completionXpBonus: number;
    consumableTier: CacheLootTier;
    purse: Readonly<Record<HazardRouteKey, number>>;
}> = Object.freeze({
    xpPerLevel: 10,
    completionXpBonus: 0.5,
    consumableTier: 'modest',
    purse: Object.freeze({
        safe: HAZARD_TUNING.rewards.shillings,
        risk: HAZARD_TUNING.rewards.riskShillings,
    }),
});

/**
 * What a short resolve costs.
 *
 *  - `maxVitaeLoss`: VITAE lost at p = 0, per route; a resolve short of the
 *    goal loses round(max × (1 − p)).
 *  - `scarBelow`: the scar applies only when p is under this.
 *  - `scar`: max VITAE the scar takes (the live hazards' scar).
 */
export const HAZARD_PUZZLE_FAILURE: Readonly<{
    maxVitaeLoss: Readonly<Record<HazardRouteKey, number>>;
    scarBelow: number;
    scar: number;
}> = Object.freeze({
    maxVitaeLoss: Object.freeze({ safe: 6, risk: 12 }),
    scarBelow: 0.5,
    scar: HAZARD_TUNING.rewards.maxhpScar,
});
