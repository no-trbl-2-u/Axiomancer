/**
 * Hazard puzzle — public API. A fixed, one-round hazard played on the
 * live minigame's card and die rules. Dev-menu only until
 * Act 1's rollout.
 */

export type {
    HazardPuzzleBand,
    HazardPuzzleGoal,
    HazardPuzzleGoals,
    HazardPuzzleLayout,
    HazardPuzzleMove,
    HazardPuzzlePhase,
    HazardPuzzleResult,
    HazardPuzzleSession,
    HazardPuzzleStat,
    HazardPuzzleUnlock,
    HazardPuzzleUnlockGrant,
    HazardPuzzleValidation,
} from './hazard-puzzle.types';

export { HAZARD_PUZZLE_ACT, validateHazardPuzzleLayout } from './hazard-puzzle.validate';

export {
    createHazardPuzzleSession,
    stageHazardPuzzleCard,
    unstageHazardPuzzleCard,
    powerHazardPuzzleCard,
    applyHazardPuzzleCard,
    discardHazardPuzzleCard,
    playHazardPuzzleMove,
    playHazardPuzzleMoves,
    confirmHazardPuzzle,
} from './hazard-puzzle.session';
