/**
 * Combat barrel.
 *
 * Combat-specific logic is split across focused modules:
 *   advantage.ts        — type-advantage relationships and modifiers
 *   stats.ts            — stat lookups for combatants
 *   dice.ts             — card checks and crit detection
 *   damage.ts           — final damage and attack outcome
 *   health.ts           — applyDamage / heal / status checks
 *   effects.ts          — combatant-side effect manipulations
 *   resist.ts           — tier 2/3 effect application resolver
 *   combat.reducer.ts   — small state-shape mutations on CombatState
 *
 * Round-resolution pure helpers also live here.
 */

import { BefriendabilityConfig } from '../Enemy/types';
import { FRIENDSHIP_COUNTER_MAX } from '../Game/game-mechanics.constants';
import { CombatState } from './types';

export type {
    Stance, Action, Advantage, CritStyle, CombatAction, PlayerCombatAction,
    CombatPhase, CombatState, Combatant,
} from './types';

export { determineAdvantage, hasAdvantage, getAdvantageModifier, resolveEffectiveAdvantage } from './advantage';
export { getBaseStat, getAttackStat, getDefenseStat, getSaveStat } from './stats';
export { isCriticalHit, isCriticalMiss } from './dice';
export { applyCriticalMultiplier, calculateFinalDamage, selectCritDamage, isAttackSuccessful } from './damage';
export { applyDamage, heal, isAlive, isDefeated, getHealthPercentage } from './health';
export {
    MIND_MARK_ID,
    getStudyMarkIntensity, getActiveRollModifier, getThornsReflect,
    updateEffectDuration, tickAllEffects,
    removeRandomBuff, extendRandomBuffDuration, applyRegen, applyDrain,
    processDamageOverTime, processRoundStartEffects, processRoundEndEffects,
    applyCleanse, applyDispel,
    // 0.34.0 status-depth epic — HP-model selectors + tunable scalars
    getDamageTakenMultiplier, getPendingDotTotal, consumeDotEffects, computeRoundsToKill,
    getDistinctDebuffCount, getDistinctControlCount,
    VULNERABLE_MAX_MULT, RESOLUTE_MIN_MULT, RUPTURE_CAP_FRACTION, ruptureBurstCap,
    RUPTURE_PER_AFFLICTION_STACK, DISRUPT_DENY_AT, THREAT_RUNGS, THREAT_RUNGS_BOSS,
    CONCEDE_PREMISES_BASE, CONCEDE_PREMISES_ELITE, CONCEDE_PREMISES_BOSS,
    // CONDEMN Premise floor per enemy difficulty — the single source the engine
    // AND every presenter/catalog surface share (WI-6 concede ladder).
    concedeFloorFor,
    // RELENT (PLEA) resolve threshold — presenters read the live target off
    // this instead of duplicating the rule (WI-5 sway meter).
    capitulateThreshold, CAPITULATE_RESOLVE_FRACTION, CAPITULATE_MIN,
    // Spec 32 v3 — themed-deck selectors
    consumeAfflictions, consumeOneAffliction, getBackfirePerRung,
    getMarkStacks, consumeMarks,
    // P0-truth — the formerly-inert payload channels are real; presenters read
    // the live multipliers off these instead of hard-coding.
    getHealingReceivedMult, getOutgoingDamageMult, decayDotsOnHeal, consumeEffect,
    hasPayloadFlag,
    // WS3.2 — trigger-clock DoT substrate (spec 32 §12 #3)
    fireDotTrigger, growPerEnemyActionDots, EXPECTED_TRIGGERS_PER_ROUND,
    // WS8.2 — telegraph-damage control surface (spec 32 §12 #6)
    getOutgoingThreatDamageMult,
} from './effects';
export type { PendingDotEntry, DotTriggerResult } from './effects';
export {
    getActiveEffectModifiers, getEffectiveStats, canAct,
    // 0.34.0 — surfaced DoT amplification (Hemorrhage / Dissolution / Corrosive Fire)
    getDotAmplificationByEffect, getActiveDotTotal, getActiveDotAmplifications,
    // WS3 — DoT clock classification (round clocks vs event clocks)
    dotRoundClockPhase, dotEventTrigger,
} from './effect-modifiers';
export type {
    AggregatedEffectModifiers, EffectiveStats,
    ActiveDotEntry, ActiveDotAmplification,
    DotEventTrigger,
} from './effect-modifiers';
export { resolveEffectApplication } from './resist';
export { calculateDamageResistance } from './damage-resist';
export type { DamageType } from './damage-resist';
export {
    rollForCombatEffects, applyProcOutcome, applyFumbleOutcome,
    getEligibleTriggers, calculateProcChance, combatEffectsLibrary,
} from './combat-effects';
export type {
    CombatEffectTrigger, ProcUnlocks, ProcOverrides,
    ProcRollOutcome, FumbleOutcome, RollForCombatEffectsParams,
} from './combat-effects';
export { calculateEnemyStatMultiplier, applyMoralMeterScaling } from './difficulty';

// `CombatState` constructor — shared by the card / effects / equipment engines
// (and the Hazard-Pattern shim builds the same shape inline). The legacy
// turn-based driver verbs that lived alongside it were removed.
export { initializeCombat } from './combat.reducer';

/**
 * Phase 68 — friendship-eligibility predicate. Returns true when the
 * current `CombatState` satisfies the active enemy's `BefriendabilityConfig`
 * (all named predicates AND-compose). When the enemy has no config OR the
 * config sets `defaultFallback: 'both-defend-cap'`, falls through to the
 * Phase 36 mechanic (`friendshipCounter >= FRIENDSHIP_COUNTER_MAX`).
 *
 * Not exported from the public barrel — internal helper for
 * `isBefriendAttemptEligible`, the explicit Befriend-attempt check the shared
 * card engine consults via `executeCard`. (The legacy combat-end predicates
 * that also consumed it — `determineCombatEnd` / `isCombatOngoing` /
 * `isFriendshipEligible` — were removed with the legacy turn-based driver.)
 *
 * Remaining predicates are the passive both-defend counter, `roundsThreshold`,
 * and `hpGate`. The former per-round history predicates (`requiredStances` /
 * `requiredCardUse`) were removed with the legacy `CombatState.log`: the
 * Hazard-Pattern engine never populated that log, so they were inert.
 */
function befriendabilityPredicatesPass(
    state: CombatState,
    options: { requirePassiveCounter: boolean },
): boolean {
    const config: BefriendabilityConfig | undefined = state.enemy.befriendabilityConfig;
    if (!config || config.defaultFallback === 'both-defend-cap') {
        return options.requirePassiveCounter
            ? state.friendshipCounter >= FRIENDSHIP_COUNTER_MAX
            : true;
    }
    const threshold = config.roundsThreshold ?? FRIENDSHIP_COUNTER_MAX;
    if (options.requirePassiveCounter && state.friendshipCounter < threshold) return false;
    if (config.hpGate) {
        const maxHp = state.enemy.maxHealth;
        if (maxHp <= 0) return false;
        const hpFraction = state.enemy.health / maxHp;
        if (hpFraction > config.hpGate.belowPct) return false;
    }
    return true;
}

/**
 * Phase 112 — returns true when the enemy is vulnerable to an explicit
 * Befriend attempt. HP gates and the `roundsThreshold` still matter, but
 * passive both-defend counter pressure is not, by itself, a combat end or a
 * mercy decision.
 */
export function isBefriendAttemptEligible(state: CombatState): boolean {
    return befriendabilityPredicatesPass(state, { requirePassiveCounter: false });
}

// Legacy export name retained for backward compatibility with any older code
// that imported `applyDamage` and `healCharacter` separately.
export { heal as healCharacter } from './health';

// Phase 142 — effect-interaction amplification bounds (shared infrastructure).
export { INTERACTION_AMPLIFICATION } from './resolution.constants';

// ─── Spec 25 — Hazard-Pattern Combat ──────────────────────────────────────────
// The card-and-dice combat driver; the
// effects + card engines are unchanged (Spec 25 §12 Q4 recommendation (b)).
export type {
    CombatEncounterState, CombatEncounterPhase, CombatTransition,
    CombatManaDie, CombatDieColor, CombatDieState,
    CombatCard, CombatHandEntry, CardPlay, CombatVerbClass, CardEffectKind,
    CombatThreatPhase, CombatThreatAction, CombatThreatEffect,
    CombatThreatMark, CombatPhaseResult, CombatOutcome, CombatEvent,
    CombatSummary, CombatAttributionRow, LandedEffect,
    // Spec 26 / 26b additions
    CombatIntentType, CombatReadResult,
    SignatureSkill, SignatureSkillId, SignatureSkillKind,
    // WS9 (spec 32 §12 #7) — legible conditional threat branches
    ThreatBranchCondition, CombatThreatBranch, CombatThreatBranchOutcome,
    // Phase 31 — the momentum wheel / THE STAKE shared stance subset
    WheelStance,
    // Spec 33 (Phase D2) — the die-gear interface (D5 makes it a real rail)
    UpgradeableDieGear,
    // Phase 33d — GLYPHS pilot (sandbox-only): the charge-and-crack seal zone
    GlyphInstance, GlyphPayload,
    // Phase 102 — SUMMON's brood: one member of an add wave
    CombatAdd,
} from './combat.encounter.types';
export {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveCombatPhase, resolveThreatPhase, processBetweenPhases,
    selectMercyChoice as selectEncounterMercyChoice, selectCapitulationChoice, getCard,
    handCards, availableDice, buildCombatSummary,
    // Spec 26b — turn lifecycle + read + Conviction + Signature Skills
    startTurn, draftStanceDie, endTurn, resolveRead, chooseDraft, discardCombatCard,
    playSignatureSkill, getDraftedDie, isPhaseStanceRevealed, revealedCurrentStance,
    // Phase 33d — GLYPHS pilot: the dieless crack action
    crackGlyph,
    // Phase 102 — SUMMON: the dieless-but-priced add clear, and its constants
    strikeAdd, ADD_WAVE_CAP, STRIKE_ADD_COST, ADD_BITE_PER_LEVEL,
    // WS8.2 — stance-blur readout flag (mobile renders the stance panel fogged)
    isStanceReadoutBlurred,
    cardReadPreview, projectCardImpact, getSignatureSkill, SIGNATURE_SKILLS, SIGNATURE_SKILL_LIST,
    READ_DAMAGE_MULT, CONVICTION_PER_UNPICKED_DIE, CONVICTION_PER_UNPICKED_WILD, CONVICTION_READ_WIN_BONUS,
    COLOR_MATCH_DAMAGE_BONUS,
    // THE BIG NUMBERS REWRITE — the LIVE colour-match rule. Mobile's presenter
    // must consume this, not the deprecated flat constant above, or the card
    // face prints a bonus the engine does not apply.
    colorMatchBonus,
    COLOR_MATCH_BONUS_PCT,
    COLOR_MATCH_BONUS_MIN,
    THREAT_WEAKEN_PER_ROLL, THREAT_DENY_AT, THREAT_WEAKEN_FLOOR,
    // depth epic — the read bites status in REAL units (P0-truth); the clock escalates threat
    READ_ADVANTAGE_INTENSITY_BONUS, READ_DISADVANTAGE_DURATION_PENALTY,
    THREAT_ESCALATION_PER_ROUND, THREAT_ESCALATION_GRACE, THREAT_ESCALATION_MAX,
    THREAT_ESCALATION_BOSS_MULT, THREAT_EFFECT_ESCALATION_STEP, THREAT_ENCHANT_CURSE_EVERY_ROUNDS,
    // Fate Engine P1 (spec 31) — the dice get a second read
    tapFateDie, riderText,
    PIP_INTENSITY_BONUS, PIP_GUARD_BONUS, COLOR_MATCH_STATUS_DURATION_BONUS, FATE_TAP_CONVICTION,
    // 0.34.0 status-depth epic — honesty selectors
    getEnemyIncomingDamageMultiplier, getDisruptMeter,
    projectRupture, projectRuptureBurst, projectSiphonHeal, projectReapAll,
    // phase 28 — legibility sweep
    projectIncomingThreat,
    // WS7.2 — chosen X-cost clamp range (`recoil_x`), engine-owned
    recoilXRange,
    // Phase 2 — projected-lethality readout (spec 30); heal-aware since 2026-09-04
    projectCombatOutcome, projectEnemyHealPerRound,
    // Spec 32 v3 — floating dice save-back + sway decay knob
    getFloatingDiceColors, SWAY_DECAY_PER_TURN,
    // Phase 31 — the engine-native momentum wheel + THE STAKE
    isMomentumDieId, placeStake,
    // Spec 33 (Phase D2) — Upgradeable Dice: OVERHEAT's flag-on primitive
    overheatSpentDie,
} from './combat.engine';
// Spec 33 (Phase D2, FLAGGED) — the Upgradeable-Dice model. Everything here is
// inert until `setUpgradeableDice(true)`; the flag-off engine is byte-identical.
export {
    setUpgradeableDice, isUpgradeableDiceEnabled,
    UPGRADEABLE_DIE_COLORS, UPGRADEABLE_TABLE_CEILING, KINDLE_CONCURRENT_CAP,
    PRESS_FATE_COST, OVERHEAT_CRACK_CHANCE, SPECIAL_FIRES_ON_USE,
    SPECIAL_CONVICTION_DEFAULT, MOMENTUM_CHAIN_ORDER, MOMENTUM_SURGE_LENGTH,
    SURGE_DIE_PREFIX, DEFAULT_DIE_GEAR, activeDieGear, honedDieGear,
    rollUpgradeableFace, rollUpgradeableDice, rollGoldLeadPair,
    advanceMomentumV2, rerollMissFacesHonest, resolveStanceCheck,
    tableDieObjectCount, tableHasRoom, isChainStance,
} from './combat.upgradeable-dice';
export type { MomentumV2, UpgradeableDieFace } from './combat.upgradeable-dice';
/**
 * @deprecated Superseded by the COLOR LAW for die COST / play legality
 * (`playCombatCard`'s color-match gate); retained only as the legacy 0/1/2
 * advantage-READ classifier (spec 25 §4.8). No `axiomancer-mobile` consumers
 * as of 2026-07-11 (grep-verified) — the mechanics CLI hand renderer is the
 * sole caller; any future mobile adopter migrates next minor. Removal is a
 * semver-major phase (locked-barrel rule), so the exports stay.
 */
export { resolveCardDieCost, cardDieCostPreview } from './combat.engine';
export type { CardDieCost, FinisherProjection, CombatOutcomeProjection } from './combat.engine';
export {
    COMBAT_DICE_COUNT, TURN_DICE_COUNT, COMBAT_DIE_FACES, rollCombatDice, rollTurnDice,
    rollCombatDieColor, dieHasStance,
    combatDieCanPower, refreshOneDie,
    dieIsRerollable, hasRerollableDice, rerollSpentDice,
    // Master Spec §4 — wild-die permanent-growth mechanic
    MAX_PERMANENT_WILD_DICE, rollPermanentBonusDice,
    RESERVE_MAX, RESERVE_PIP_CAP, ripenReserve,
    // Phase 32 part 4c — Forge OVERHEAT (the press-your-luck pip push)
    OVERHEAT_PIP_CEILING, OVERHEAT_BUST_CHANCE, overheatReserve,
} from './combat.dice';
export { COMBAT_HAND_SIZE, buildCombatDeck, drawCombatCards, shuffleCombatDeck } from './combat.deck';
export {
    COMBAT_DECK_PRESETS, COMBAT_DECK_PRESET_ORDER,
    // 5/5/5 recipe color law (spec 32 §12 item 9) — the documented borrow map
    PRESET_LINEAGE,
    listDeckPresets, getDeckPreset, buildPresetDeck,
} from './combat.starter-deck-presets';
export type { CombatDeckPreset, CombatDeckFocus } from './combat.starter-deck-presets';
export {
    toCombatCard, projectDeck, classifyVerbClass,

    mechanicText,
    // WS4.2 — printed text for a combat-state synergy condition (P0-truth)
    statePredicateText,
    isCombatSynergySatisfied,
} from './combat.cards';
export {
    getThreatSequence, generateDefaultThreatSequence,
    deriveIntentType, AUTHORED_THREAT_ENEMY_IDS,
    RAGE_UNLOCK_ROUND, RAGE_DAMAGE_WEIGHT, RAGE_HEAL_FRACTION,
    // WS9 — branch-node authoring + phase-START commit
    isBranchStep, flattenAuthoredSteps,
    describeThreatBranchCondition, evaluateThreatBranchCondition, commitThreatBranch,
} from './combat.threat';
export type { AuthoredThreatPhase, AuthoredThreatBranch, AuthoredThreatStep } from './combat.threat';
export {
    simulateHazardPatternCombat, simulateHazardPatternCombatDetailed, runOneEncounter,
} from './combat.encounter.sim';
export type {
    CombatSimStats, CombatSimPolicyId,
    CombatSimRunOptions, CombatSimDetailedOptions, CombatCardUsage, WinPathCounts,
} from './combat.encounter.sim';
// deck-tuning free-metrics tier — deck-class-aware win-rate curve-shape witness.
export { evaluateWinRateCurve, CURVE_SHAPE_TOLERANCES } from './combat.curve-shape';
export type {
    WinRateCurveClass, WinRateCurvePoint, WinRateCurveResult, CurveShapeTolerances,
} from './combat.curve-shape';
// ─── Playtest supercharge — stage profiles, deck drafting, policy roster, matrix ──
export {
    COMBAT_STAGE_ORDER, COMBAT_STAGE_PROFILES,
    getStageProfile, isCombatStageId, stageEligibleCardIds, buildStagePlayer,
} from './combat.stage-profiles';
export type { CombatStageId, CombatStageProfile } from './combat.stage-profiles';
export { draftCombatDeck, resolveDeckSelection, applyDeckSwaps } from './combat.deck-draft';
export type { DeckDraftOptions, CombatDeckSelection, CombatDeckSwap } from './combat.deck-draft';
export {
    COMBAT_SIM_POLICIES, COMBAT_SIM_POLICY_ORDER, getSimPolicy, listSimPolicies,
} from './combat.sim-policies';
export type { CombatSimPolicy } from './combat.sim-policies';
export {
    runPlaytestCell, runPlaytestMatrix, formatPlaytestReport, PRESET_DOCTRINE_WIN_BANDS,
} from './combat.playtest';
export type {
    PlaytestCellSpec, PlaytestCellResult, PlaytestMatrixOptions,
    PlaytestStageSummary, PlaytestReport,
    PlaytestPresetSummary, PlaytestPresetStageRow,
} from './combat.playtest';
// Metrics slate (2026-07-18) — static card/preset complexity instrument.
export { cardComplexity, presetComplexity } from './combat.card-complexity';
export type { CardComplexityRow, PresetComplexity } from './combat.card-complexity';
export { runHazardCombatAutoEncounter } from './combat.autoplay';
export type { HazardAutoPolicyId, HazardCombatAutoOptions, HazardCombatAutoResult } from './combat.autoplay';
// Phase 19/23 — archetype→signature gating retired; playerArchetype kept for portrait.
export { playerArchetype, CONCLUDE_DMG_PER_STACK } from './combat.signature';
export {
    COMBAT_REWARD_POOL, STARTING_CARD_ID, STARTING_CARD_IDS, rollCombatCardRewards, addRewardCard,
    unlockCardViaDilemma,
    // Theme-aware reward draft (2026-08-08) — the deck-theme read + its pivot lever.
    REWARD_RARITY_WEIGHTS, REWARD_THEMES, REWARD_OFF_THEME_RATE,
    deckThemeCounts, deckThemeShares,
} from './combat.rewards';
export type { RewardTheme } from './combat.rewards';
export type { PlayerArchetype } from './combat.encounter.types';
export {
    COMBAT_LOADOUT_FLAG_PREFIX, COMBAT_LOADOUT_MAX,
    decodeCombatLoadout, getCombatLoadout, addToLoadout, removeFromLoadout,
} from './combat.loadout';
