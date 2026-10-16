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
import type { HazardPuzzleBand, HazardPuzzleLayout, HazardPuzzleUnlock } from './hazard-puzzle.types';
import { hazardPuzzleUnlockSubsets } from './hazard-puzzle.unlocks';

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
    const solution = solveHazardPuzzle(layout, route, [], options);
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

export interface HazardPuzzleUnlockAudit {
    route: HazardRouteKey;
    unlocks: HazardPuzzleUnlock[];
    /** Winning outcomes with these unlocks granted. */
    winningOutcomes: number;
    /** Winning outcomes with none granted. */
    baseOutcomes: number;
    /** Why this subset fails the check; empty when it passes. */
    problems: string[];
}

function unlockLabel(unlocks: readonly HazardPuzzleUnlock[]): string {
    return unlocks.map((u) => `${u.stat}>=${u.min} ${u.kind}`).join(' + ');
}

/**
 * Checks every non-empty subset of a layout's unlocks on both routes: the
 * puzzle stays solvable and inside the solver budget, and its winning-outcome
 * count is at least the no-unlock count, so an unlock never makes it harder.
 */
export function auditHazardPuzzleUnlocks(
    layout: HazardPuzzleLayout,
    options: HazardPuzzleSolveOptions = {},
): HazardPuzzleUnlockAudit[] {
    const subsets = hazardPuzzleUnlockSubsets(layout).filter((s) => s.length > 0);
    const audits: HazardPuzzleUnlockAudit[] = [];
    for (const route of ['safe', 'risk'] as const) {
        const baseOutcomes = solveHazardPuzzle(layout, route, [], options).winningOutcomes;
        for (const unlocks of subsets) {
            const solution = solveHazardPuzzle(layout, route, unlocks, options);
            const label = unlockLabel(unlocks);
            const problems: string[] = [];
            if (solution.overBudget) {
                problems.push(`${label}: too open to count (over ${solution.boardsExplored} boards)`);
            }
            if (solution.winningOutcomes === 0) problems.push(`${label}: unsolvable`);
            if (solution.winningOutcomes < baseOutcomes) {
                problems.push(`${label}: ${solution.winningOutcomes} outcomes, fewer than ${baseOutcomes} with no unlock`);
            }
            audits.push({ route, unlocks, winningOutcomes: solution.winningOutcomes, baseOutcomes, problems });
        }
    }
    return audits;
}
