/**
 * Hazard puzzle — the band check.
 *
 * Reads a solver count against the bands in the tuning module, and audits
 * a whole layout on both routes: solvable, inside its declared band, inside
 * the solver budget, and its winning line replays to a cleared resolve
 * through the session functions.
 */

import type { HazardRouteKey } from '../hazard.types';
import { confirmHazardPuzzle, createHazardPuzzleSession, playHazardPuzzleMoves } from './hazard-puzzle.session';
import { solveHazardPuzzle, type HazardPuzzleSolution, type HazardPuzzleSolveOptions } from './hazard-puzzle.solver';
import { HAZARD_PUZZLE_BANDS } from './hazard-puzzle.tuning';
import type { HazardPuzzleBand, HazardPuzzleLayout } from './hazard-puzzle.types';

/**
 * The band a solved round falls in, or null when it is unsolvable or a
 * one-to-four-way round whose best line clears by more than the hard cap.
 */
export function hazardPuzzleBandOf(winningOutcomes: number, bestSurplus: number | null): HazardPuzzleBand | null {
    const { easy, medium, hard } = HAZARD_PUZZLE_BANDS;
    if (winningOutcomes >= easy.minOutcomes) return 'easy';
    if (winningOutcomes >= medium.minOutcomes && winningOutcomes <= medium.maxOutcomes) return 'medium';
    if (
        winningOutcomes >= hard.minOutcomes &&
        winningOutcomes <= hard.maxOutcomes &&
        bestSurplus !== null &&
        bestSurplus <= hard.maxBestSurplus
    ) {
        return 'hard';
    }
    return null;
}

export interface HazardPuzzleRouteAudit {
    route: HazardRouteKey;
    declared: HazardPuzzleBand;
    /** The band the solver count falls in; null when none. */
    measured: HazardPuzzleBand | null;
    solution: HazardPuzzleSolution;
    /** The winning line replayed through the session clears the round. */
    replayCleared: boolean;
    /** Why the route fails the check; empty when it passes. */
    problems: string[];
}

export function auditHazardPuzzleRoute(
    layout: HazardPuzzleLayout,
    route: HazardRouteKey,
    options: HazardPuzzleSolveOptions = {},
): HazardPuzzleRouteAudit {
    const declared = layout.bands[route];
    const solution = solveHazardPuzzle(layout, route, options);
    const measured = hazardPuzzleBandOf(solution.winningOutcomes, solution.bestSurplus);
    const replayCleared =
        solution.winningLine !== null &&
        confirmHazardPuzzle(playHazardPuzzleMoves(createHazardPuzzleSession(layout, route), solution.winningLine))
            .result?.cleared === true;
    const problems: string[] = [];
    if (solution.overBudget) problems.push(`too open to count (over ${solution.boardsExplored} boards)`);
    if (solution.winningOutcomes === 0) problems.push('unsolvable');
    if (measured !== declared) {
        problems.push(
            `declared ${declared}, measured ${measured ?? 'no band'} ` +
                `(${solution.winningOutcomes} outcomes, best surplus ${solution.bestSurplus ?? '-'})`,
        );
    }
    if (solution.winningOutcomes > 0 && !replayCleared) problems.push('winning line does not replay to a clear');
    return { route, declared, measured, solution, replayCleared, problems };
}

/** Audits a layout on both routes. */
export function auditHazardPuzzleLayout(
    layout: HazardPuzzleLayout,
    options: HazardPuzzleSolveOptions = {},
): HazardPuzzleRouteAudit[] {
    return (['safe', 'risk'] as const).map((route) => auditHazardPuzzleRoute(layout, route, options));
}
