/**
 * Gathering Minigame ("The Gleaning") — Public API.
 *
 * Faithful copy of the mobile engine, the living rules source
 * (`../axiomancer-mobile/state/gathering/`). The package exports the
 * exact mobile surface so mobile can delete its local engine and
 * consume these exports instead (the same migration path the Hazard
 * module took). The mobile `store-actions.ts` host glue is
 * intentionally NOT part of this module — affordability checks and
 * item synthesis are host concerns.
 *
 * Note: the seeded-RNG helpers are re-exported under `gathering*`
 * aliases because the Hazard module already exports `seedRng` /
 * `nextFloat` / `nextInt` / `shuffle` from the package root, and
 * ambiguous star-exports would silently drop both.
 */

// ── Engine types ───────────────────────────────────────────────────────────
export type {
    GatherFamily,
    GatherDepth,
    GatherApproachKey,
    GatherPlotTrait,
    GatherPlotDef,
    GatherPlotEntry,
    GatherPiece,
    GatherApproachDef,
    GatherOfferingDemand,
    GatherOfferingDef,
    GatherOfferingState,
    GatherToolId,
    GatherToolDef,
    GatherToolState,
    GatherReprisalId,
    GatherReprisalEvent,
    GatherBoonRewardKind,
    GatherBoonReward,
    GatherBoonDef,
    GatherBoonStatus,
    GatherBoonState,
    GatherBoonResult,
    GatherMetrics,
    GatherDepthPlotEntry,
    GatherSiteDef,
    GatherOutcomeTier,
    GatherFamilyTotal,
    GatherOutcome,
    GatheringPhase,
    GatheringSessionState,
} from './gathering.types';

export {
    EMPTY_GATHER_METRICS,
    GATHER_FAMILIES,
    GATHER_DEPTH_COUNT,
} from './gathering.types';

// ── Seeded RNG (aliased — see module note) ─────────────────────────────────
export type { GatheringRngState } from './gathering.rng';
export {
    seedRng as gatheringSeedRng,
    nextFloat as gatheringNextFloat,
    nextInt as gatheringNextInt,
    shuffle as gatheringShuffle,
} from './gathering.rng';

// ── Tuning ─────────────────────────────────────────────────────────────────
export {
    GATHERING_TUNING,
    GATHER_SPREAD_SIZE,
    GATHER_WRATH_MAX,
    GATHER_WRATH_THRESHOLDS,
    GATHER_DUSK_AFTER,
} from './gathering.tuning';

// ── Authored content (plots, sites, offerings, tools, boons, keywords) ─────
export type { GatherKeywordId } from './gathering.content';
export {
    GATHERING_KEYWORDS,
    GATHERING_PLOTS,
    getGatherPlotDef,
    GATHER_SET_REFINEMENTS,
    GATHERING_OFFERINGS,
    getGatherOfferingDef,
    GATHERING_TOOLS,
    getGatherToolDef,
    GATHERING_REPRISAL_ORDER,
    GATHERING_REPRISALS,
    GATHERING_BOONS,
    getGatherBoonDef,
    GATHER_APPROACH_COPY,
    GATHERING_SITES,
    getGatherSiteDef,
} from './gathering.content';

// ── Pure engine transitions ─────────────────────────────────────────────────
export {
    // selectors / previews
    gatherApproachDef,
    gatheringHarvestWrath,
    gatheringHarvestYield,
    gatheringDuskFallen,
    gatheringFamilyTotals,
    gatheringBoonStatus,
    gatheringBoonResults,
    gatheringTierOf,
    canPayGatheringOffering,
    // lifecycle
    createGatheringSession,
    selectGatheringApproach,
    // foraging
    harvestGatheringPlot,
    descendGathering,
    payGatheringOffering,
    useGatheringTool,
    // reprisal / outcome / spoils
    continueGatheringAfterReprisal,
    withdrawFromGathering,
    acknowledgeGatheringOutcome,
    claimGatheringSpoils,
} from './gathering.engine';

// ── Simulation / balance evidence ──────────────────────────────────────────
export type {
    GatherPolicyId,
    GatherSimRunResult,
    GatherSimSummary,
    RunGatheringSimOptions,
} from './gathering.sim';
export { simulateGathering, runGatheringSim } from './gathering.sim';
