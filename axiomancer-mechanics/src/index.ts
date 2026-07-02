/**
 * axiomancer-mechanics — public package surface.
 * 
 * Core game engine exports for React Native and other JavaScript consumers.
 * For Node.js specific adapters, import from 'axiomancer-mechanics/node'.
 *
 * The library is consumed as the non-UI engine for an Axiomancer client.
 * Imports are organised by domain.
 */

// ─── Character ────────────────────────────────────────────────────────────────
export {
    createCharacter,
    allocateStatPoint,
    previewStatAllocation,
    equipItem, unequipItem, getEquipmentModifiers,
    computeEquipDelta,
    characterPresets, getPresetById, buildCharacterFromPreset,
    levelLadderPresets, ladderL1Preset, ladderL15Preset, ladderL30Preset, ladderL50Preset,
} from './Character';
export type {
    Character, BaseStats, DerivedStats, NonCombatStats,
    PreviewAllocation, PreviewResult,
    CreateCharacterOptions, AggregatedEquipmentModifiers,
    CharacterPreset, CharacterPresetEquipmentEntry,
    EquipDelta, EquipDeltaMode, EquipDeltaSide,
    StatDeltaEntry, ModifierDeltaEntry, EffectDeltaEntry,
    ResourceDeltaEntry, KeywordDeltaEntry,
} from './Character';

// ─── Enemy ────────────────────────────────────────────────────────────────────
export {
    createEnemy, enemyStatBudget,
    rollLoot, rollLootMany,
    DEFAULT_XP_BY_DIFFICULTY,
} from './Enemy';
export type {
    Enemy, EnemyLogic, EnemyDifficulty, Tier1EffectOverrides,
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
    determineAdvantage, getAdvantageModifier, hasAdvantage,
    resolveEffectiveAdvantage,
    getBaseStat, getAttackStat, getDefenseStat, getSaveStat,
    rollSkillCheck, isCriticalHit, isCriticalMiss,
    applyCriticalMultiplier, calculateFinalDamage, selectCritDamage, isAttackSuccessful,
    applyDamage, heal, isAlive, isDefeated, getHealthPercentage,
    getStudyMarkIntensity, getActiveRollModifier, getThornsReflect,
    updateEffectDuration, tickAllEffects,
    removeRandomBuff, extendRandomBuffDuration, applyRegen,
    getActiveEffectModifiers, getEffectiveStats, canAct,
    // 0.34.0 status-depth epic — HP-model selectors + tunable scalars
    getDamageTakenMultiplier, getPendingDotTotal, consumeDotEffects,
    getDistinctDebuffCount, getDistinctControlCount,
    VULNERABLE_MAX_MULT, RUPTURE_BURST_CAP, COMPOUND_COUNT_CAP,
    DISRUPT_DENY_AT, EXECUTE_DAMAGE_FRACTION,
    AMPLIFY_DEFAULT_MULTIPLIER, AMPLIFY_BURST_CAP,
    getDotAmplificationByEffect, getActiveDotTotal, getActiveDotAmplifications,
    resolveEffectApplication,
    calculateDamageResistance, getSkillDamageType,
    healCharacter,
    calculateEnemyStatMultiplier, applyMoralMeterScaling,
    // `CombatState` constructor — shared infrastructure for the skill / effects
    // / equipment engines (the Hazard-Pattern shim builds the same shape).
    initializeCombat,
    // Phase 142 — effect-interaction amplification bounds (shared infrastructure).
    INTERACTION_AMPLIFICATION,
} from './Combat';
export type {
    Stance, Action, Advantage, CritStyle, CombatAction, CombatPhase,
    BattleLogEntry, CombatState, Combatant,
    AggregatedEffectModifiers, EffectiveStats, DamageType,
    // 0.34.0 status-depth epic — selector result types
    PendingDotEntry, ActiveDotEntry, ActiveDotAmplification,
} from './Combat';

// ─── Spec 25 — Hazard-Pattern Combat ──────────────────────────────────────────
// Card-and-dice combat: HP is the sole win condition. Status effects erode HP
// far faster than the deliberately weak basic strike.
export {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveCombatPhase, resolveThreatPhase, processBetweenPhases,
    selectEncounterMercyChoice, resolveCardDieCost, getCard,
    handCards, cardDieCostPreview, availableDice, buildCombatSummary,
    COMBAT_DICE_COUNT, COMBAT_HAND_SIZE, COMBAT_DIE_FACES,
    rollCombatDice, combatDieCanPower, refreshOneDie,
    toCombatCard, projectDeck, classifyVerbClass, buildCombatDeck,
    COMBAT_DECK_PRESETS, COMBAT_DECK_PRESET_ORDER, listDeckPresets, getDeckPreset, buildPresetDeck,
    getThreatSequence, generateDefaultThreatSequence,
    AUTHORED_THREAT_ENEMY_IDS,
    simulateHazardPatternCombat, runHazardCombatAutoEncounter,
    SYNTHETIC_CARD_IDS, isSyntheticCard, GOLD_CARD_IDS, isGoldCard,
    // Spec 26 / 26b — stance draft, hidden read, Conviction, Signature Skills
    TURN_DICE_COUNT, rollTurnDice, dieHasStance,
    startTurn, draftStanceDie, endTurn, resolveRead, chooseDraft, discardCombatCard,
    playSignatureSkill, getDraftedDie, isPhaseStanceRevealed, revealedCurrentStance,
    cardReadPreview, projectCardImpact, getSignatureSkill, SIGNATURE_SKILLS, SIGNATURE_SKILL_LIST,
    READ_DAMAGE_MULT, CONVICTION_PER_UNPICKED_DIE, CONVICTION_READ_WIN_BONUS,
    COLOR_MATCH_DAMAGE_BONUS, deriveIntentType,
    // 0.34.0 status-depth epic — honesty selectors + deny-threshold consts
    getEnemyIncomingDamageMultiplier, getDisruptMeter,
    projectRupture, isExecuteReady, projectExecute, projectSiphonHeal,
    // Spec 26b tuning §B/§C/§D
    SIGNATURE_KITS, signaturesForArchetype, playerArchetype, CONCLUDE_DMG_PER_STACK,
    COMBAT_REWARD_POOL, STARTING_SKILL_ID, STARTING_SKILL_IDS, rollCombatCardRewards, addRewardCard,
    unlockSkillViaDilemma,
    // PR #190 Press Fate partial re-roll
    dieIsRerollable, hasRerollableDice, rerollSpentDice,
    // soft-control + stat-debuff threat tunables
    THREAT_WEAKEN_PER_ROLL, THREAT_DENY_AT, THREAT_WEAKEN_FLOOR,
    // depth epic — read-scales-status + the escalation clock
    READ_STATUS_MULT, THREAT_ESCALATION_PER_ROUND, THREAT_ESCALATION_GRACE, THREAT_ESCALATION_MAX,
    THREAT_ESCALATION_BOSS_MULT,
    // Phase 169 — curated combat loadout codec + synergy live-check
    COMBAT_LOADOUT_FLAG_PREFIX, COMBAT_LOADOUT_MAX,
    decodeCombatLoadout, getCombatLoadout, addToLoadout, removeFromLoadout,
    isCombatSynergySatisfied,
} from './Combat';
export type {
    CombatEncounterState, CombatEncounterPhase, CombatTransition,
    CombatManaDie, CombatDieColor, CombatDieState,
    CombatCard, CombatHandEntry, CardPlay, CombatVerbClass, CardEffectKind,
    CombatThreatPhase, CombatThreatAction, CombatThreatEffect,
    CombatThreatMark, CombatPhaseResult, CombatOutcome, CombatEvent,
    CombatSummary, CombatAttributionRow, LandedEffect,
    CombatSimStats, CombatSimPolicyId,
    HazardAutoPolicyId, HazardCombatAutoOptions, HazardCombatAutoResult,
    CombatIntentType, CombatReadResult,
    SignatureSkill, SignatureSkillId, SignatureSkillKind, PlayerArchetype,
    CombatDeckPreset, CombatDeckFocus,
    CardDieCost,
} from './Combat';

// ─── Playtest supercharge — stage matrix, policy roster, deck drafting ────────
// Doctrine witnesses at every campaign stage: status play must stay the
// efficient path to dropping enemy HP.
export {
    simulateHazardPatternCombatDetailed, runOneEncounter,
    COMBAT_STAGE_ORDER, COMBAT_STAGE_PROFILES,
    getStageProfile, isCombatStageId, stageEligibleCardIds, buildStagePlayer,
    draftCombatDeck, resolveDeckSelection,
    COMBAT_SIM_POLICIES, COMBAT_SIM_POLICY_ORDER, getSimPolicy, listSimPolicies,
    runPlaytestCell, runPlaytestMatrix, formatPlaytestReport,
} from './Combat';
export type {
    CombatSimRunOptions, CombatSimDetailedOptions, CombatCardUsage,
    CombatStageId, CombatStageProfile,
    DeckDraftOptions, CombatDeckSelection,
    CombatSimPolicy,
    PlaytestCellSpec, PlaytestCellResult, PlaytestMatrixOptions,
    PlaytestStageSummary, PlaytestReport,
} from './Combat';

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

// ─── Effects ──────────────────────────────────────────────────────────────────
export {
    applyEffect, applyTier1CombatEffect,
    clearTier1EffectsForStance,
    lookupEffect, getEffectByName, getEffectsByType, effectsLibrary,
    processWorldEffectTick, getActiveHazards,
    // Phase 142 — Status effect depth functionality
    evaluateInteractions, checkInteractionTrigger, applyInteractionResult,
    EFFECT_INTERACTIONS, getInteractionsForEffect, getAllInteractionIds,
    getInteractionById, validateInteractions,
} from './Effects';
export type {
    Effect, EffectType, EffectTier, EffectStacking, EffectCategory, EffectPayload,
    ActiveEffect, EffectApplicationResult,
    StatModifier, DamageOverTime, RegenerationConfig, ActionRestriction, AdvantageModifier,
    EffectStatTarget,
    ApplyEffectOptions, Tier1Outcome,
    WorldTickResult, ActiveHazard,
    // Phase 142 — Status effect interaction types
    EffectInteraction, InteractionTrigger, InteractionResult, InteractionTriggerType,
} from './Effects';

// ─── Items ────────────────────────────────────────────────────────────────────
export {
    addItem, removeItem, useConsumable, stackItem,
    addItemToInventory, removeItemFromInventory,
    isEquipment, isConsumable, isMaterial, isQuestItem,
    aggregateCombatStartTokens, applyEquipmentGenerationBonus,
    getEquipmentProcTriggers, useConsumableEffect,
    equipmentTemplates, getEquipmentTemplate, getTemplatesBySlot,
    uniqueTemplates, getUniqueTemplate,
    dropItem, dropItemWithAffixes, rollModifiers, resolveModifiers, rarityWeightTable,
    previewTemplateAtRarity, previewTemplateAtAllRarities,
    dropItemAtRarity, AFFIXES_PER_RARITY, countNamedAffixes, hasBakedAffix,
    equipmentFromTemplate, rollCacheLoot, CACHE_LOOT_TUNING, generateRarityDrop,
    firstEquippedPerSlot, isEquippedFirstOfSlot, findEquippedInSlot,
    prefixes, suffixes, allAffixes, getAffixById,
    composeItemName, affixesForSlot, AFFIX_RARITY_WEIGHTS,
    consumableLibrary, getConsumableById,
    buyItem, sellItem, defaultSellPrice,
    getActiveSetBonuses, getActiveSetBonusesForCharacter,
    aggregateSetStartTokens, applySetGenerationBonus,
    getActiveSetPassiveEffectIds, getEquippedItemSets,
    itemSetLibrary, getItemSetById,
} from './Items';
export type {
    Item, Equipment, Consumable, Material, QuestItem,
    ItemCategory, EquipmentSlot, BaseItem,
    EquipmentProcTrigger, ResourceInteraction, ResourceGenerationBonus,
    ItemRarity, RolledModifier, EquipmentTemplate, UniqueItemTemplate,
    ConsumableUseResult,
    DropWithAffixesOptions, AffixControl,
    CacheLootTier, RollCacheLootOptions,
    GenerateRarityDropOptions, GenerateRarityDropResult,
    Affix, AffixRole,
    ShopWare, ShopInventory,
    SetBonus, ItemSet,
} from './Items';

// ─── Skills ───────────────────────────────────────────────────────────────────
export type {
    Card, CardCategory, StatType, CardTier, CardTarget,
    CombatResources,
    CardLearningRequirement, CardCombatEffects, CardSpecialMechanic,
    CardEvent, CardResolution, CardLookup,
    CardSynergy, SynergyPredicate,
    // Phase 142 — Extended synergy predicates
    ExtendedSynergyPredicate,
} from './Cards';
export {
    generateBasicActionResources, generatePhilosophicalResource,
    calculateSkillDamage, executeSkill,
    meetsLearningRequirement, getAvailableSkills, learnSkill,
    cardLibrary, getCardById,
    // Phase 142 — Extended synergy predicate functionality
    evaluateExtendedSynergyPredicate, checkSinglePredicate, checkAnyCountPredicate,
    checkAllRequiredPredicate, checkBuffDebuffCombo, checkTotalIntensityPredicate,
} from './Cards';
// ─── Deprecated card aliases (legacy "skill" public names) ────────────────────
// Kept so external consumers (axiomancer-mobile) keep working until they migrate.
/** @deprecated renamed to cardLibrary */
export { cardLibrary as skillLibrary } from './Cards';
/** @deprecated renamed to getCardById */
export { getCardById as getSkillById } from './Cards';
/**
 * @deprecated The card type family was renamed off the legacy "skill" naming.
 * Use `Card`, `CardCategory`, `StatType`, `CardTier`, `CardTarget`,
 * `CardLearningRequirement`, `CardCombatEffects`, `CardSpecialMechanic`,
 * `CardSynergy`, `CardLookup`, `CardEvent`, `CardResolution`. These aliases
 * will be removed in a future minor.
 */
export type {
    Card as Skill,
    CardCategory as SkillCategory,
    StatType as SkillsStatType,
    CardTier as SkillTier,
    CardTarget as SkillTarget,
    CardLearningRequirement as SkillLearningRequirement,
    CardCombatEffects as SkillCombatEffects,
    CardSpecialMechanic as SkillSpecialMechanic,
    CardSynergy as SkillSynergy,
    CardLookup as SkillLookup,
    CardEvent as SkillEvent,
    CardResolution as SkillResolution,
} from './Cards';

// ─── Game (state, store, persistence, constants) ──────────────────────────────
export {
    createGameStore, createNewGameState, GAME_STATE_VERSION,
    gameReducer, migrate, createEventEmitter,
    selectPlayer, selectIsInCombat,
    selectInventory, selectVersion, selectMoralMeter,
    nullAdapter,
    STAT_MULTIPLIERS, RESOURCE_MULTIPLIERS, EXPERIENCE_PER_LEVEL,
    STAT_POINTS_PER_LEVEL,
    DEFENSE_MULTIPLIERS, PASSIVE_DEFENSE_MULTIPLIER,
    MAX_EFFECT_INTENSITY, MAX_EFFECT_DURATION, FRIENDSHIP_COUNTER_MAX,
    RESOURCE_CARRY,
    generateRunId, STARTING_REGION,
} from './Game';
export type {
    GameState, GameStore, GameActions, PersistenceAdapter, StoreApi,
    GameAction, GameActionOf,
    GameEvent, GameEventEmitter, GameEventHandler, GameEventType,
    CodexEntry, CodexState, RegionConsequences,
} from './Game';

// ─── World ────────────────────────────────────────────────────────────────────
export {
    createStartingWorld, MapNotFoundError,
    MAP_REGISTRY, getMapDefinition, createMapState,
    moveToNode, completeCurrentNode, IllegalMoveError,
    applyDialogueChoice,
    emptyQuestLog, isQuestComplete, findActiveQuest, findQuest,
    startQuest, progressQuest, completeQuest, discoverQuest,
    reachableObjectives, killObjectives,
    seedInputToUint32, minigameRunSeed, branchMinigameSeed,
} from './World';

// Hazard Minigame (v2 — faithful port of the mobile living rules source).
// The full public surface (engine transitions, content, tuning, deck-flag
// codec, seeded RNG, and types) is exported directly from the Hazard module
// so mobile can delete its local engine and import these instead.
// See `docs/hazard-v2-vs-mechanics-divergence.md`.
export * from './World/Hazard';

// Gathering Minigame ("The Gleaning" — faithful copy of the mobile living
// rules source, `../axiomancer-mobile/state/gathering/`). The full public
// surface (engine transitions, content, tuning, sim, and types) is exported
// directly from the Gathering module so mobile can delete its local engine
// and import these instead. Seeded-RNG helpers are aliased (`gathering*`)
// to avoid ambiguous star-exports with the Hazard module's RNG.
export * from './World/Gathering';

// Quest Board minigame ("The Boy's Almanac" — the story-quest encounter:
// each main-story beat plays as an authored tabletop board inside the
// fiction; fully sandboxed, only the completion record flows back).
// Seeded-RNG helpers are aliased (`questBoard*`) per the same doctrine.
export * from './World/QuestBoard';

// Rest encounter ("The Night Watch" — one night at camp in three watches)
// and Loot-cache encounter ("The Reliquary" — three layers, sealed trap
// fates, one probe). RNG aliased `rest*` / `lootCache*`.
export * from './World/Rest';
export * from './World/LootCache';
export {
    changeMap, completeMap, unlockMap,
    completeNode, unlockNode, changeContinent, completeUniqueEvent,
    revealAdjacent, markNodeConsumed, unlockAdjacent,
    // Phase 135: Persistence functions
    recordHazardOutcome, blockMapRoute, getHazardOutcomesForNode, isRouteBlocked,
    validateMoveToNode, findAlternativePaths, getBlockedRoutesFromNode, getReachableNodes,
    // Phase 148: Minigame Harness
    runMinigameHarness, summarizeHarnessReport,
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
    QuestEventPayload, NarrationPayload, ResolvedEvent, ResolveMapEventResult,
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
    HazardModifierEntry, HazardNodeOutcome, BlockedRoute, RouteValidationResult,
    // Phase 148: Minigame Harness types
    MinigameHarnessConfig, MinigameHarnessReport, MinigameHarnessSummary,
} from './World';

// ─── Philosophy (Phase 42 — 3-axis alignment cube + 27-cell registry) ────────
export {
    bucketAxis, getAlignmentCell, applyAlignmentDelta, defaultAlignment,
    AXIS_HIGH_THRESHOLD, AXIS_LOW_THRESHOLD,
    philosophicalAlignmentLibrary,
} from './Philosophy';
export type {
    AxisBucket, PhilosophicalAlignment, AlignmentFallacy,
    PhilosophicalAlignmentCell,
} from './Philosophy';

// ─── Faction (Phase 110 — faction reputation system for boss befriend consequences) ──
export {
    FACTION_REPUTATION_MIN, FACTION_REPUTATION_MAX, DEFAULT_FACTION_REPUTATION,
    clampFactionReputation, createDefaultFactionReputations,
    applyFactionReputationDeltas, getFactionReputation,
    factionLibrary, getFactionInfo, getAllFactions,
} from './Faction';
export type {
    FactionReputation, FactionReputations, FactionReputationDelta, FactionInfo,
} from './Faction';

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
    deriveStats, deriveNonCombatStats, calculateMaxHealth,
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
