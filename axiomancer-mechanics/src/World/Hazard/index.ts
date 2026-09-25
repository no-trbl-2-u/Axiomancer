/**
 * Hazard Minigame — Public API (v2).
 *
 * Faithful port of the mobile v2 Hazard engine that was the living rules
 * source (`../axiomancer-mobile/state/hazard/`, now only store actions).
 * The package exports the exact mobile surface; mobile has deleted its
 * local engine and consumes these exports. See
 * `plan/archive/2026-09-25-trim-t1/axiomancer-mechanics/docs/hazard-v2-vs-mechanics-divergence.md` (archived 2026-09-25).
 */

// ── Engine types ───────────────────────────────────────────────────────────
export type {
    HazardColor,
    HazardDieKind,
    HazardProgressKey,
    HazardCardDef,
    HazardHandEntry,
    HazardSubquestReward,
    HazardSubquestStatus,
    HazardRouteKey,
    HazardDef,
    HazardMark,
    HazardOutcomeTier,
    HazardPhase,
    HazardSessionState,
} from './hazard.types';

// ── Seeded RNG ─────────────────────────────────────────────────────────────
export { seedRng } from './hazard.rng';

// ── Tuning ─────────────────────────────────────────────────────────────────
export { HAZARD_TUNING } from './hazard.tuning';

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
    HAZARD_VITAE_REWARD,
    HAZARD_CACHE_SHILLINGS,
    HAZARD_RELIC_SHILLINGS,
    HAZARD_MINHP_LOSS,
    HAZARD_MAXHP_SCAR,
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
    hazardProjectedProgress,
    dieCanPowerCard,
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
