/**
 * axiomancer-mechanics — public package surface.
 * 
 * Core game engine exports for React Native and other JavaScript consumers.
 * For Node.js specific adapters, import from 'axiomancer-mechanics/node'.
 *
 * The library is consumed as the non-UI engine for a Miserere Mei, Deus client.
 * Imports are organised by domain.
 */

// ─── Character ────────────────────────────────────────────────────────────────
export {
    createCharacter,
    allocateStatPoint,
    previewStatAllocation,
    equipItem, unequipItem, getEquippedItems,
    emptyLoadout,
    computeEquipDelta,
    honeDieGear, temperDieGear, swapDieGear,
    validateDieGear, concreteDefaultRail, characterDieGear,
    dieSpecialCap, dieGearMissFaces,
    DIE_GEAR_COLORS, DIE_GEAR_FACE_COUNT,
    characterPresets, getPresetById, buildCharacterFromPreset,
    grantFirstNodeRelic, withholdFirstNodeRelic, isFirstNodeRelicPending,
    FIRST_NODE_RELIC_ID, STAND_IN_RELIC_ID, FIRST_NODE_RELIC_FLAG,
    levelLadderPresets, ladderL1Preset, ladderL15Preset, ladderL30Preset, ladderL50Preset,
} from './Character';
export type {
    Character, BaseStats, EquipmentLoadout,
    PreviewAllocation, PreviewResult,
    CreateCharacterOptions,
    CharacterPreset, CharacterPresetEquipmentEntry,
    EquipDelta, EquipDeltaMode,
    StatDeltaEntry, SignatureDeltaEntry,
    DieGearColor, DieGearRail, DieGearOutcome,
    FirstNodeRelicGrant, FirstNodeGrantReason,
} from './Character';

// ─── Enemy ────────────────────────────────────────────────────────────────────
export {
    createEnemy, enemyStatBudget,
    rollLoot, rollLootMany,
    DEFAULT_XP_BY_DIFFICULTY,
} from './Enemy';
export type {
    Enemy, EnemyLogic, EnemyDifficulty,
    LootTableEntry, CreateEnemyOptions,
    LootRng,
    FriendshipReward, BefriendabilityConfig,
    FinalBlowLines, PactLines, CauseLines,
    // CodexEntry moved to ./Game block — Phase 73 type's semantic home
    // is the Game-loop persistence surface; the Enemy module re-exports
    // it via `src/Enemy/types.ts` for the per-foe content site, but the
    // top-level barrel now pulls from Game alongside CodexState.
} from './Enemy';
export {
    EnemyLibrary, EnemiesByMap, ENEMY_REGISTRY,
} from './Enemy/enemy.library';
export type { EnemySlug } from './Enemy/enemy.library';

// ─── Combat ───────────────────────────────────────────────────────────────────
export {
    applyDamage, heal, isAlive, isDefeated, getHealthPercentage,
    getStudyMarkIntensity, getActiveRollModifier, getThornsReflect,
    updateEffectDuration, tickAllEffects,
    removeRandomBuff, extendRandomBuffDuration, applyRegen,
    getActiveEffectModifiers, canAct,
    // 0.34.0 status-depth epic — HP-model selectors + tunable scalars
    getDamageTakenMultiplier, getPendingDotTotal, consumeDotEffects,
    getDistinctDebuffCount, getDistinctControlCount,
    VULNERABLE_MAX_MULT, RESOLUTE_MIN_MULT, RUPTURE_CAP_FRACTION, ruptureBurstCap,
    RUPTURE_PER_AFFLICTION_STACK, DISRUPT_DENY_AT, THREAT_RUNGS, THREAT_RUNGS_BOSS,
    CONCEDE_PREMISES_BASE, CONCEDE_PREMISES_ELITE, CONCEDE_PREMISES_BOSS,
    // Spec 32 v3 — themed-deck selectors
    consumeAfflictions, consumeOneAffliction, getBackfirePerRung,
    getMarkStacks, consumeMarks,
    // P0-truth — formerly-inert payload channels, now real + presenter-readable
    getHealingReceivedMult, getOutgoingDamageMult, decayDotsOnHeal, consumeEffect,
    hasPayloadFlag,
    // WS8.2 — telegraph-damage control surface (spec 32 §12 #6)
    getOutgoingThreatDamageMult,
    getDotAmplificationByEffect, getActiveDotTotal, getActiveDotAmplifications,
    resolveEffectApplication,
    healCharacter,
    // `CombatState` constructor — shared infrastructure for the card / effects
    // / equipment engines (the Hazard-Pattern shim builds the same shape).
    initializeCombat,
    // Phase 142 — effect-interaction amplification bounds (shared infrastructure).
    INTERACTION_AMPLIFICATION,
} from './Combat';
export type {
    Stance, Action, Advantage, CritStyle, CombatAction, CombatPhase,
    CombatState, Combatant,
    AggregatedEffectModifiers,
    // 0.34.0 status-depth epic — selector result types
    PendingDotEntry, ActiveDotEntry, ActiveDotAmplification,
} from './Combat';

// ─── Spec 25 — Hazard-Pattern Combat ──────────────────────────────────────────
// Card-and-dice combat: VITAE (`isDefeated`) is the main win condition beside
// the alt-wins (Befriend, RELENT, CONDEMN); status play and direct damage
// compete on merit (THE BIG NUMBERS REWRITE, 2026-09-02).
export {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveCombatPhase, resolveThreatPhase, processBetweenPhases,
    selectEncounterMercyChoice, selectCapitulationChoice, getCard,
    handCards, availableDice, buildCombatSummary,
    COMBAT_HAND_SIZE, COMBAT_DIE_FACES,
    combatDieCanPower, refreshOneDie,
    toCombatCard, projectDeck, classifyVerbClass, buildCombatDeck,
    COMBAT_DECK_PRESETS, COMBAT_DECK_PRESET_ORDER, PRESET_LINEAGE,
    listDeckPresets, getDeckPreset, buildPresetDeck,
    getThreatSequence, generateDefaultThreatSequence,
    AUTHORED_THREAT_ENEMY_IDS,
    RAGE_UNLOCK_ROUND, RAGE_DAMAGE_WEIGHT, RAGE_HEAL_FRACTION,
    simulateHazardPatternCombat,
    mechanicText,
    // Spec 26b / spec 33 — turn lifecycle, Conviction, Signature Skills
    dieHasStance,
    startTurn, endTurn, discardCombatCard, firstLegalPoweringDie,
    playSignatureSkill, isPhaseStanceRevealed, revealedCurrentStance,
    // Phase 33d — GLYPHS pilot (sandbox-only): the dieless crack action
    crackGlyph,
    // Phase 102 — SUMMON: the dieless-but-priced add clear, and its constants
    strikeAdd, ADD_WAVE_CAP, STRIKE_ADD_COST, ADD_BITE_PER_LEVEL,
    // WS8.2 — stance-blur readout flag (mobile renders the stance panel fogged)
    isStanceReadoutBlurred,
    projectCardImpact, getSignatureSkill, SIGNATURE_SKILLS, SIGNATURE_SKILL_LIST,
    READ_DAMAGE_MULT,
    COLOR_MATCH_DAMAGE_BONUS, colorMatchBonus, COLOR_MATCH_BONUS_PCT, COLOR_MATCH_BONUS_MIN,
    deriveIntentType,
    // 0.34.0 status-depth epic — honesty selectors + deny-threshold consts
    getEnemyIncomingDamageMultiplier, getDisruptMeter,
    projectRupture, projectRuptureBurst, projectSiphonHeal, projectReapAll,
    // phase 28 — legibility sweep
    projectIncomingThreat,
    // WS7.2 — chosen X-cost clamp range (`recoil_x`), engine-owned
    recoilXRange,
    // Phase 2 — projected-lethality readout (spec 30)
    computeRoundsToKill, projectCombatOutcome, projectEnemyHealPerRound,
    // Spec 32 v3 — floating dice save-back + sway decay knob
    getFloatingDiceColors, SWAY_DECAY_PER_TURN,
    // RELENT (PLEA) resolve threshold — the sway meter's target (WI-5)
    capitulateThreshold,
    // CONDEMN Premise floor per difficulty — the concede-ladder source (WI-6)
    concedeFloorFor,
    // Spec 26b tuning §B/§C/§D
    playerArchetype, CONCLUDE_DMG_PER_STACK,
    COMBAT_REWARD_POOL, STARTING_CARD_ID, STARTING_CARD_IDS, rollCombatCardRewards, addRewardCard,
    unlockCardViaDilemma,
    // Theme-aware reward draft (2026-08-08) — the deck-theme read + its pivot lever.
    REWARD_RARITY_WEIGHTS, REWARD_THEMES, REWARD_OFF_THEME_RATE,
    // Phase 104 — the first-three-takes-uniform gate for the keyword pull.
    REWARD_RANDOM_PICKS,
    deckThemeCounts, deckThemeShares,
    // The `reroll_spent` card mechanic's partial re-roll
    dieIsRerollable, hasRerollableDice, rerollSpentDice,
    // soft-control + stat-debuff threat tunables
    THREAT_WEAKEN_PER_ROLL, THREAT_DENY_AT, THREAT_WEAKEN_FLOOR,
    // depth epic — the escalation clock
    THREAT_ESCALATION_PER_ROUND, THREAT_ESCALATION_GRACE, THREAT_ESCALATION_MAX,
    THREAT_ESCALATION_BOSS_MULT, THREAT_EFFECT_ESCALATION_STEP,
    // Phase 169 — curated combat loadout codec + synergy live-check
    COMBAT_LOADOUT_FLAG_PREFIX, COMBAT_LOADOUT_MAX,
    decodeCombatLoadout, getCombatLoadout, addToLoadout, removeFromLoadout,
    isCombatSynergySatisfied,
    // Master Spec §4 — wild-die permanent-growth mechanic
    MAX_PERMANENT_WILD_DICE,
    // Fate Engine P1 (spec 31) — the dice get a second read
    riderText, RESERVE_MAX, RESERVE_PIP_CAP, ripenReserve,
    PIP_INTENSITY_BONUS, PIP_GUARD_BONUS, COLOR_MATCH_STATUS_DURATION_BONUS,
    // Phase 32 part 4c — Forge OVERHEAT
    OVERHEAT_PIP_CEILING, OVERHEAT_BUST_CHANCE, overheatReserve,
    // Spec 33 — Upgradeable Dice (THE combat dice model since the D7 flag
    // collapse): the surfaces the app/sim layers need.
    overheatSpentDie,
    UPGRADEABLE_DIE_COLORS, UPGRADEABLE_TABLE_CEILING, PRESS_FATE_COST,
    SPECIAL_CONVICTION_DEFAULT, MOMENTUM_CHAIN_ORDER, MOMENTUM_SURGE_LENGTH,
    SURGE_DIE_PREFIX, DEFAULT_DIE_GEAR, activeDieGear, honedDieGear,
} from './Combat';
export type { MomentumV2, UpgradeableDieFace, UpgradeableDieGear } from './Combat';
/**
 * @deprecated Superseded by the COLOR LAW for die COST / play legality
 * (`playCombatCard`'s color-match gate); retained only as the legacy 0/1/2
 * advantage-READ classifier (spec 25 §4.8). No `axiomancer-mobile` consumers
 * as of 2026-07-11 (grep-verified) — the mechanics CLI hand renderer is the
 * sole caller; any future mobile adopter migrates next minor. Removal is a
 * semver-major phase (locked-barrel rule), so the exports stay.
 */
export type {
    CombatEncounterState, CombatEncounterPhase, CombatTransition,
    CombatManaDie, CombatDieColor, CombatDieState,
    CombatCard, CombatHandEntry, CardPlay, CombatVerbClass, CardEffectKind,
    CombatThreatPhase, CombatThreatAction, CombatThreatEffect,
    CombatThreatMark, CombatPhaseResult, CombatOutcome, CombatEvent,
    CombatSummary, CombatAttributionRow, LandedEffect,
    // WS9 (spec 32 §12 #7) — legible conditional threat branches
    ThreatBranchCondition, CombatThreatBranch, CombatThreatBranchOutcome,
    AuthoredThreatPhase, AuthoredThreatBranch, AuthoredThreatStep,
    CombatSimStats, CombatSimPolicyId,
    CombatIntentType, CombatReadResult,
    SignatureSkill, SignatureSkillId, SignatureSkillKind, PlayerArchetype,
    CombatDeckPreset, CombatDeckFocus,
    // The three chain/stance colours (spec 33 momentum chain + stance checks)
    WheelStance,
    FinisherProjection, CombatOutcomeProjection,
    // Phase 33d — GLYPHS pilot (sandbox-only): the charge-and-crack seal zone
    GlyphInstance, GlyphPayload,
    // Phase 102 — SUMMON's brood: one member of an add wave
    CombatAdd,
} from './Combat';

// ─── Playtest supercharge — stage matrix, policy roster, deck drafting ────────
// Witnesses at every campaign stage (the status-primacy doctrine they once
// enforced was repealed 2026-09-02; nothing is graded against it).
export {
    simulateHazardPatternCombatDetailed, runOneEncounter,
    COMBAT_STAGE_ORDER, COMBAT_STAGE_PROFILES,
    getStageProfile, isCombatStageId, stageEligibleCardIds, buildStagePlayer,
    draftCombatDeck, resolveDeckSelection, applyDeckSwaps,
    COMBAT_SIM_POLICIES, COMBAT_SIM_POLICY_ORDER, getSimPolicy, listSimPolicies,
    runPlaytestCell, runPlaytestMatrix, formatPlaytestReport,
} from './Combat';
export type {
    CombatSimRunOptions, CombatSimDetailedOptions, CombatCardUsage, WinPathCounts,
    CombatStageId, CombatStageProfile,
    DeckDraftOptions, CombatDeckSelection, CombatDeckSwap,
    CombatSimPolicy,
    PlaytestCellSpec, PlaytestCellResult, PlaytestMatrixOptions,
    PlaytestStageSummary, PlaytestReport,
} from './Combat';
export type { PlaytestPresetSummary, PlaytestPresetStageRow } from './Combat/combat.playtest';

// ─── Combat Quality Index (Phase 43) — diagnostic only ────────────────────────
// Printed by `/deck-tuning` and `/combat-playtest` beside the legacy
// `statusEngagement` warning light; nothing is graded against it — THE BIG
// NUMBERS REWRITE (2026-09-02) repealed every governing combat objective
// function, CQI included. `assertLockedMechanicsFirstClass` still keeps
// Conviction, the Surge meter and the Dice system first-class in the score.
export {
    scoreCombatObjective, formatCombatQuality, assertLockedMechanicsFirstClass,
    scoreConvictionUse, scoreSurgeUse, scoreDiceUse,
    scoreArcShape, scoreDecisionWidth, scoreDeckIdentity,
    COMBAT_QUALITY_WEIGHTS, SPINE_SUBWEIGHTS, COMBAT_QUALITY_CALIBRATION,
    LOCKED_MECHANIC_TERMS, LOCKED_SPINE_WEIGHT_FLOOR,
} from './Combat/combat.objective';
export type {
    CombatQualityScore, CombatQualityWeights, CombatQualityComponents,
    CombatSpineComponents, CombatQualityReadings, LockedMechanicTerm,
} from './Combat/combat.objective';
export {
    emptyObjectiveTelemetry, addObjectiveTelemetry, mergeObjectiveTelemetry,
    poolObjectiveTelemetry, foldObjectiveEvents, damageCentroid,
    diceEconomyBreadth, DICE_ECONOMY_VERBS,
} from './Combat/combat.objective.telemetry';
export type {
    CombatObjectiveTelemetry, DiceEconomyVerb,
} from './Combat/combat.objective.telemetry';

// ─── Sandbox cards — the deck-forge experimentation surface ───────────────────
// New experimental cards + numeric overrides of library cards, live everywhere
// `getCardById` is consulted; the `/deck-tuning` loop A/Bs them here before a
// literal is promoted into the library.
export {
    bindSandboxLibraryGuard, registerSandboxCards, registerSandboxOverride,
    clearSandboxCards, getSandboxCard, listSandboxCards, hasSandboxContent,
} from './Cards/cards.sandbox';
export type { SandboxCardPatch } from './Cards/cards.sandbox';
export {
    SANDBOX_CARD_SETS, listSandboxSets, applySandboxSet,
} from './Cards/cards.sandbox-sets';
export type { SandboxCardSet } from './Cards/cards.sandbox-sets';

// ─── Deck removal (Phase 52a) — taking a card OUT, and what that costs ───────
// The engine's first removal primitive plus the per-run escalating price. The
// rest-choice engine (52c) and the picker screen (52d) consume these; prices
// were ratified in Phase 52f against measured income.
export {
    removeCardFromCombatDeck, MIN_COMBAT_DECK_SIZE,
    CARD_REMOVAL_PRICING,
    cardRemovalPrice, cardRemovalPriceFor, cardRemovalsOf, canAffordCardRemoval,
} from './Cards/card.removal';
export type {
    CardRemovalResult, CardRemovalAccepted, CardRemovalRefused,
    CardRemovalRefusal, CardRemovalRefusalCode, CardRemovalSource,
} from './Cards/card.removal';

// ─── Effects ──────────────────────────────────────────────────────────────────
export {
    applyEffect,
    lookupEffect, getEffectByName, getEffectsByType, effectsLibrary,
    // Phase 142 — Status effect depth functionality
    evaluateInteractions, checkInteractionTrigger,
    EFFECT_INTERACTIONS,
    validateInteractions,
} from './Effects';
export type {
    Effect, EffectType, EffectTier, EffectStacking, EffectCategory, EffectPayload,
    ActiveEffect, EffectApplicationResult,
    StatModifier, DamageOverTime, RegenerationConfig, ActionRestriction, AdvantageModifier,
    ApplyEffectOptions,
    // Phase 142 — Status effect interaction types
    EffectInteraction, InteractionTrigger, InteractionResult, InteractionTriggerType,
} from './Effects';

// ─── Items ────────────────────────────────────────────────────────────────────
export {
    addItem, removeItem, useConsumable, stackItem,
    addItemToInventory, removeItemFromInventory,
    isEquipment, isConsumable, isMaterial, isQuestItem,
    useConsumableEffect,
    // Phase 96 — the desperation band (a healing potion pays 1.5x under half
    // VITAE). `resolveConsumableHeal` is the shared resolver mobile's presenters
    // preview with, so the shop line and the drink preview cannot drift from
    // what the engine actually pays.
    DESPERATION_HP_FRACTION, isDesperate, resolveConsumableHeal,
    // Phase 21 — procedural equipment factory/templates retired; loot caches
    // yield consumables via rollCacheReward. Phase 23 — modifier catalogue,
    // affix library, item sets, and the rarity model are torn down.
    rollCacheReward, CACHE_REWARD_TUNING,
    wornPerSlot, isEquippedFirstOfSlot, findEquippedInSlot,
    SLOT_CAPACITY,
    consumableLibrary, getConsumableById,
    buyItem, sellItem, defaultSellPrice,
    relicLibrary, getRelicById, getSignaturesForLoadout, cloneStartingRelics,
    DEFAULT_WORN_RELIC_IDS, BENCHED_RELIC_IDS,
    // The shared grant/equip/swap path. `equipItem` never returns the displaced
    // piece (weapon/armor replace in place; a full accessory row is a guarded
    // no-op), so every grant site routes through `grantItem` rather than
    // re-deriving the unequip -> addItem -> equipItem chain.
    // `qualifiesForItemRewardScreen` is D5: the one predicate that decides
    // ceremony (reward screen) vs. the lightweight inline grant.
    addItemStacking,
    grantItem, qualifiesForItemRewardScreen, partitionGrantsForReward, displacedBy,
} from './Items';
export type {
    Item, Equipment, Consumable, Material, QuestItem,
    ItemCategory, EquipmentSlot, AccessoryKind, BaseItem,
    ConsumableUseResult,
    CacheLootTier, RollCacheRewardOptions,
    ShopWare, ShopInventory,
    GrantItemOptions, ItemGrantResult, GrantOutcome,
} from './Items';

// ─── Cards ───────────────────────────────────────────────────────────────────
export type {
    Card, StatType, CardAspect, CardTier, CardTarget,
    CardCombatEffects, CardSpecialMechanic,
    CardEvent, CardResolution, CardLookup,
    CardSynergy, SynergyPredicate,
    // Spec 32 v3 — the rank ladder / rarity / card-type axes
    CardRank, CardRarity, CardType, CardRider,
    // Phase 142 — Extended synergy predicates
    // WS4.2 — combat-state synergy predicate + its ledger view (spec 32 §12 #4)
    SynergyStatePredicate, SynergyLedgerView,
} from './Cards';
export {
    executeCard,
    // Spec 32 v3 — rank/rarity helpers (mobile renders rank names off these)
    CARD_RANK_NAMES, rankToRarity,
    getAvailableCards, learnCard,
    cardLibrary, getCardById,
    // WS2.1 — the Haunt registry (spec 34 R-13: was Thoughtform; CONJURE targets; outside the pinned 70)
    hauntLibrary, getHauntById,
    // Phase 142 — Extended synergy predicate functionality
    // WS4.2 — the combat-ledger gate evaluator
    checkStatePredicate,
    // Spec 32 §3/§6 — card themes + keyword families (phase 29 parity lint)
    CARD_THEMES, THEME_KEYWORDS, keywordsForTheme, isCardTheme,
    // Phase 104 — a card's keyword surface for reward-draft matching
    keywordsOf,
    // Phase 68 — runtime enumeration of the CardSpecialMechanic union, bound to
    // the type by compile-time assertions. Mobile KW-2 walks this list.
    CARD_SPECIAL_MECHANIC_KINDS, isCardSpecialMechanicKind,
} from './Cards';
export type { CardTheme } from './Cards';
export type { RewardTheme } from './Combat';

// ─── Game (state, store, persistence, constants) ──────────────────────────────
export {
    createGameStore, createNewGameState, GAME_STATE_VERSION,
    gameReducer, migrate, createEventEmitter,
    selectPlayer, selectIsInCombat,
    selectInventory, selectVersion, selectMoralMeter,
    nullAdapter,
    RESOURCE_MULTIPLIERS, EXPERIENCE_PER_LEVEL,
    STAT_POINTS_PER_LEVEL,
    MAX_EFFECT_INTENSITY, MAX_EFFECT_DURATION, FRIENDSHIP_COUNTER_MAX,
    RESOURCE_CARRY,
    generateRunId, STARTING_REGION,
    LEGACY_SLOT_MAP, reslotLegacyEquipment, reslotLegacyLoadout,
    // State fixtures (2026-09-07) — one declarative state for CLI / Jest / web.
    buildStateFromFixture,
    StateFixtureError, problemsFor, validateStateFixture, parseStateFixture,
    STATE_FIXTURES, getStateFixtureById, listStateFixtureIds,
} from './Game';
export type {
    StateFixture, StateFixturePlayer, StateFixtureWorld,
    GameState, GameStore, GameActions, PersistenceAdapter, StoreApi,
    GameAction, GameActionOf,
    GameEvent, GameEventEmitter, GameEventHandler, GameEventType,
    CodexEntry, CodexState, RegionConsequences,
    LegacySlot, LegacySlotMapping,
} from './Game';

// ─── World ────────────────────────────────────────────────────────────────────
export {
    createStartingWorld, MapNotFoundError,
    MAP_REGISTRY, getMapDefinition, createMapState,
    moveToNode, completeCurrentNode, IllegalMoveError,
    teleportToNode, placeOnNode, unblockMapRoute,
    applyDialogueChoice,
    emptyQuestLog, isQuestComplete, findActiveQuest, findQuest,
    startQuest, progressQuest, completeQuest, discoverQuest,
    reachableObjectives, killObjectives, collectObjectives, advanceKillObjectives,
    // The `Reward` union resolver — the payout half `quest.engine.ts` leaves to
    // the store. Covers the `{ kind: 'item' }` and bare-`Item` reward shapes
    // that were declarable but never paid.
    payQuestReward, payQuestRewards, isItemReward, isKindedReward, itemOf,
    seedInputToUint32, minigameRunSeed, branchMinigameSeed,
} from './World';
export type { QuestRewardPayout } from './World';

// Hazard Minigame (v2 — faithful port of the former mobile living rules source).
// The full public surface (engine transitions, content, tuning, deck-flag
// codec, seeded RNG, and types) is exported directly from the Hazard module;
// mobile has deleted its local engine and imports these.
// See `plan/archive/2026-09-25-trim-t1/axiomancer-mechanics/docs/hazard-v2-vs-mechanics-divergence.md` (archived 2026-09-25).
export * from './World/Hazard';

// Quest Board minigame ("The Boy's Almanac") — retired in Phase 61; nothing
// is exported for it any more (see `game.migrate.ts`'s v17 → v18 hop).

// Blacksmith encounter ("The Anvil" — Spec 33 §6 die-gear upgrades: HONE /
// TEMPER / gear swap). RNG aliased `blacksmith*`.
export * from './World/Blacksmith';
// Rest-choice encounter (Phase 52c-d) — the rest node's one irreversible
// choice of `rest` / `cut` (the `anvil` offer was dropped in Phase 59),
// composing the Cards/card.removal primitive rather than rebuilding it.
// Replaced the former rest minigame, retired in Phase 52e.
export * from './World/RestChoice';
// Loot-cache-choice encounter ("The Reliquary") — the cache node's one
// irreversible choice of `card` / `item` / `sacrifice`. Replaced the
// former Pick Pool dice-pool minigame, retired in Phase 63.
export * from './World/LootCacheChoice';
export {
    changeMap, completeMap, unlockMap,
    completeNode, unlockNode, changeContinent, completeUniqueEvent,
    revealAdjacent, markNodeConsumed, unlockAdjacent,
    // Phase 135: Persistence functions
    // 2026-08-08 first-map audit: traversal queries + the strand audit.
    legalMovesFrom, isStranded, isMapTerminalNode, auditMapTraversal,
    // D1 (2026-09-21) — frontier roaming: the derived spent/frontier sets
    // every surface classifies nodes from, plus the forward skeleton the
    // progression audits walk.
    visitedNodes, isNodeSpent, frontierNodes, isFrontierExhausted, forwardEdges,
    // Phase 53c — the route-coverage walk, beside the strand audit.
    auditRouteCoverage,
} from './World';
export {
    resolveMapEvent,
    registerMapEventPool,
    setDefaultMapEventPool,
    setNodeEventPoolOverride,
    getNodeEventPool,
    getNodeEventKinds,
    getNodePrimaryEventKind,
    getShadowedNodeOverrideKeys,
} from './World';
export type {
    MapEventKind, MapEventPayload, MapEventPool, MapEventPoolEntry,
    EncounterPayload, InteractionPayload, GatheringPayload, RestPayload,
    VillagePayload, CutscenePayload, HazardPayload, LootCachePayload,
    NarrationPayload, BlacksmithPayload, TravelPayload, ResolvedEvent, ResolveMapEventResult,
} from './World';
// Phase 52b — rest shelter classification (retires the healFraction >= 1.0
// inn heuristic). Mobile gates the hazard-scar max-VITAE mend on this.
export type { RestShelter } from './World';
export {
    DEFAULT_REST_SHELTER, REST_PASSIVE_HEAL_FRACTION, restShelterOf, isInnShelter,
} from './World';
// Phase 65 — village goodwill reward tiers (discount / Ally grant / bonus).
export {
    GOODWILL_DISCOUNT_THRESHOLD, GOODWILL_DISCOUNT_RATE,
    GOODWILL_ALLY_THRESHOLD, GOODWILL_ALLY_CARD_ID,
    GOODWILL_BONUS_THRESHOLD, GOODWILL_BONUS_CURRENCY, GOODWILL_BONUS_FLAG_PREFIX,
    applyGoodwillDiscount, goodwillBonusFlag,
} from './World';
// W-01 — The Labyrinth (THE APORIA). Additive surface for the mobile
// dev-menu entry + labyrinth presenters.
export {
    createLabyrinthProgress, visibleDoors, canTraverse, inspectPoi,
    submitGateAnswer, preConfirmedWords, buyHint, hintPrice,
    debtPoints, borrowedPremiseStacks, settleDebt, activateWaystone,
    lastWaystone, namingForkOpen, recordBossOutcome, getRoom, edgeKey,
    recordWalk, walkedEdgesOf, isSophistTrueName, resolvePoiTrap,
    HINT_TIER_POINTS, SETTLE_PRICE_PER_POINT,
    APORIA_ACTS, getAporiaAct, getAporiaActByMap,
    aporiaColonnade, aporiaArchive, aporiaProof,
} from './World';
export type {
    LabyrinthActDef, LabyrinthActId, LabyrinthRoomDef, LabyrinthPoiDef,
    LabyrinthDoorDef, LabyrinthGateDef, LabyrinthRealm, LabyrinthFragment,
    LabyrinthProgress, LabyrinthVisibleDoor, LabyrinthInspectResult,
    LabyrinthGateResult, LabyrinthHintPurchase, LabyrinthBossOutcome,
} from './World';
export {
    generateEncounter, scaleEnemyToLevel, scaledEncounterLevel,
    DIFFICULTY_LEVEL_BANDS,
} from './World';
export type {
    WorldState, Continent, Quest, UniqueEvent,
    Reward, MapNode, NodeId, Encounter,
    MapName, ContinentName, QuestName,
    MapDefinition, MapState, QuestObjective, QuestObjectiveType, QuestStatus, QuestLog,
    GenerateEncounterOptions,
    ApplyDialogueChoiceResult,
    SeedInput,
    // Phase 135: Persistence types
    HazardModifierEntry, HazardNodeOutcome, BlockedRoute,
} from './World';

// ─── Ledger (Phase 42 cube + 27-cell registry; né Philosophy, Phase 44h) ─────
export {
    bucketAxis, getAlignmentCell, applyAlignmentDelta, defaultAlignment,
    AXIS_HIGH_THRESHOLD, AXIS_LOW_THRESHOLD,
    philosophicalAlignmentLibrary,
} from './Ledger';
export type {
    AxisBucket, PhilosophicalAlignment, BesettingSin,
    PhilosophicalAlignmentCell,
} from './Ledger';

// ─── NPCs (types + dialogue helpers) ──────────────────────────────────────────
export type {
    NPC, DialogueMap, DialogueTree, DialogueNode, DialogueChoice, DialogueContext,
    AlignmentGate,
} from './NPCs';
export { getDialogueNode, visibleChoices, isLeafNode } from './NPCs';

// ─── Utilities ────────────────────────────────────────────────────────────────
export {
    clamp, randomInt, deepClone, average, sum, max, min, inRange,
    capitalize, formatPercent,
    createDie, createDieRoll, determineRollAdvantageModifier,
    calculateMaxHealth,
} from './Utils';
export { setRng, getRng, setSeed } from './Utils/rng';
export type { Rng } from './Utils/rng';
export { isCharacter, isEnemy, isCombatActive } from './Utils/typeGuards';
export type { Image } from './Utils/types';

// ── Events ─────────────────────────────────────────────────────────────────
export type {
    EnginePayload, TypedGameEvent,
    TypedCombatStartedEvent, TypedCombatEndedEvent,
    TypedWorldMovedEvent, TypedWorldProcessedEvent,
    TypedLevelUpEvent, TypedInventoryChangedEvent,
    TypedDialogueAppliedEvent, TypedGameSavedEvent, TypedGameLoadedEvent,
} from './Game/events.types';

export {
    isCombatStartedEvent, isCombatEndedEvent,
    isWorldMovedEvent, isWorldProcessedEvent,
    isLevelUpEvent, isInventoryChangedEvent,
    isDialogueAppliedEvent, isGameSavedEvent, isGameLoadedEvent,
} from './Game/events.utils';

// ── AXM Log (structured logging — docs/logging.md) ────────────────────────
export {
    createAxmLogger, getLogger, configureLogging, isLoggingEnabled,
    resetLoggingForTests, forwardCombatEventsToLog,
    AXM_LOG_LEVELS, AXM_LOG_DOMAINS, AXM_LOG_LEVEL_RANK,
} from './Log';
export type {
    AxmLogger, AxmLogEntry, AxmLogLevel, AxmLogDomain, AxmLogSink,
    AxmLogFilter, AxmLoggerStats, AxmLoggerConfig,
} from './Log';
