/**
 * Hazard puzzle — tuning. Every number the puzzle mode reads lives here.
 *
 * Bands are counted in distinct winning outcomes (see the solver). They
 * apply to authored puzzle content only: a layout declares its band per
 * route and the library test holds it there.
 */

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
