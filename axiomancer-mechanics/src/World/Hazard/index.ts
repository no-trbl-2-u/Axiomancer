/**
 * Hazard Minigame — Public API (v2).
 *
 * Faithful port of the mobile v2 Hazard engine, the living rules source
 * (`../axiomancer-mobile/state/hazard/`). The package exports the exact
 * mobile surface so mobile can delete its local engine and consume these
 * exports instead. See `docs/hazard-v2-vs-mechanics-divergence.md`.
 */

// ── Engine types ───────────────────────────────────────────────────────────
export type {
    HazardColor,
    HazardDieKind,
    HazardProgressKey,
    HazardDieState,
    HazardDie,
    HazardCardRarity,
    HazardUtilityEffect,
    HazardKeywordId,
    HazardModifiers,
    HazardSalvage,
    HazardCardDef,
    HazardHandEntry,
    HazardSubquestRewardKind,
    HazardSubquestReward,
    HazardSubquestDef,
    HazardSubquestStatus,
    HazardSubquestState,
    HazardQuestMetrics,
    HazardSubquestResult,
    HazardRouteKey,
    HazardSafeRouteDef,
    HazardRiskRouteDef,
    HazardRouteDef,
    HazardDef,
    HazardMark,
    HazardResolveInfo,
    HazardOutcomeTier,
    HazardRewardId,
    HazardConsequenceId,
    HazardOutcome,
    HazardPhase,
    HazardSessionState,
    // Phase 149 types
    HazardDeckFocus,
    HazardDeckScars,
    HazardDeckIdentity,
    HazardRewardOffer,
    HazardSubquestDraft,
} from './hazard.types';

export {
    EMPTY_HAZARD_MODIFIERS,
    EMPTY_HAZARD_QUEST_METRICS,
    HAZARD_DICE_COUNT,
    HAZARD_HAND_SIZE,
    HAZARD_MOMENTUM_CAP,
} from './hazard.types';

// ── Seeded RNG ─────────────────────────────────────────────────────────────
export type { HazardRngState } from './hazard.rng';
export { seedRng, nextFloat, nextInt, shuffle } from './hazard.rng';

// ── Tuning ─────────────────────────────────────────────────────────────────
export { HAZARD_TUNING, HAZARD_DIE_FACES } from './hazard.tuning';

// ── Authored content (cards, rewards, hazards, keywords, catalogues) ────────
export {
    HAZARD_KEYWORDS,
    HAZARD_DECK,
    HAZARD_CRACK_CARD,
    HAZARD_REWARD_CARDS,
    getHazardCardDef,
    HAZARD_REWARDS,
    HAZARD_CONSEQUENCES,
    HAZARD_SUBQUESTS,
    getHazardSubquestDef,
    HAZARD_VITAE_REWARD,
    HAZARD_CACHE_SHILLINGS,
    HAZARD_RELIC_SHILLINGS,
    HAZARD_MINHP_LOSS,
    HAZARD_MAXHP_SCAR,
    HAZARD_TYPES,
    HAZARD_LIBRARY,
    getHazardDef,
} from './hazard.content';

// ── Deck persistence (GameState.flags codec) ────────────────────────────────
export {
    HAZARD_CARD_FLAG_PREFIX,
    hazardStarterBag,
    decodeAcquiredCards,
    hazardDeckBag,
    appendAcquiredCard,
} from './hazard.deck-flags';

// ── Pure engine transitions ─────────────────────────────────────────────────
export {
    // selectors
    hazardCardPowerColors,
    hazardCardValue,
    hazardStagedProgress,
    hazardProjectedProgress,
    dieCanPower,
    dieCanPowerCard,
    hazardTierOf,
    // lifecycle
    createHazardSession,
    selectHazardRoute,
    finishHazardRolling,
    // round play
    stageHazardCard,
    unstageHazardCard,
    powerHazardCard,
    chooseHazardCardKey,
    applyHazardCard,
    discardHazardCard,
    // resolve / outcome / rewards
    resolveHazardRound,
    hazardSubquestStatus,
    hazardSubquestResults,
    continueHazardAfterResolve,
    acknowledgeHazardOutcome,
    claimHazardRewards,
    // Phase 149 functions
    selectSubquestFromDraft,
    getHazardDeckIdentity,
    removeHazardDeckCard,
    // Foretell resolution (2026-06-25)
    confirmHazardForetell,
} from './hazard.engine';

// ── Simulation / balance evidence ──────────────────────────────────────────
export type { SimStats } from './hazard.sim';
export { simulateHazard } from './hazard.sim';

// ── Divergence audit (Phase 140) ───────────────────────────────────────────
export type {
    DivergenceItem,
    ImplementationGap,
    VerificationResult,
} from './audit/divergence.verification';

export {
    verifyHazardDivergence,
    formatDivergenceReport,
} from './audit/divergence.verification';

export type { GapAnalysis } from './audit/gap.report';

export {
    analyzeHazardGaps,
    formatGapReport,
    executeGapAudit,
} from './audit/gap.report';

// ── Phase 149 — Engagement mechanics ───────────────────────────────────────
export {
    classifyDeckFocus,
    calculateDeckScars,
    generateRewardOffer,
    generateSubquestDraft,
    chooseSubquest,
    generateDeckIdentity,
    removeCardFromDeck,
} from './hazard.engagement';
