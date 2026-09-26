/**
 * axiomancer-mechanics — public package surface.
 * 
 * Core game engine exports for React Native and other JavaScript consumers.
 * For Node.js specific adapters, import from 'axiomancer-mechanics/node'.
 *
 * The library is consumed as the non-UI engine for a Miserere Mei, Deus client.
 * Imports are organised by domain.
 *
 * The barrel carries only what a consumer outside the engine imports
 * (axiomancer-mobile, axiomancer-card-editor, root scripts). Engine-internal
 * helpers and test-only symbols are imported from their defining module
 * (pruned 2026-09-25, TRIM THE FAT).
 */

// ─── Character ────────────────────────────────────────────────────────────────
export {
    createCharacter,
    equipItem, unequipItem, getEquippedItems,
    computeEquipDelta,
    validateDieGear, concreteDefaultRail,
    dieSpecialCap, dieGearMissFaces,
    DIE_GEAR_COLORS,
    characterPresets, getPresetById, buildCharacterFromPreset,
    grantFirstNodeRelic, withholdFirstNodeRelic, isFirstNodeRelicPending,
    FIRST_NODE_RELIC_ID, STAND_IN_RELIC_ID, FIRST_NODE_RELIC_FLAG,
    levelLadderPresets,
} from './Character';
export type {
    Character, BaseStats,
    CharacterPreset,
    EquipDelta,
    SignatureDeltaEntry,
    DieGearColor, DieGearRail,
} from './Character';

// ─── Enemy ────────────────────────────────────────────────────────────────────
export {
    createEnemy,
} from './Enemy';
export type {
    Enemy, EnemyDifficulty,
    // CodexEntry moved to ./Game block — Phase 73 type's semantic home
    // is the Game-loop persistence surface; the Enemy module re-exports
    // it via `src/Enemy/types.ts` for the per-foe content site, but the
    // top-level barrel now pulls from Game alongside CodexState.
} from './Enemy';
export {
    EnemyLibrary, EnemiesByMap, ENEMY_REGISTRY,
} from './Enemy/enemy.library';

// ─── Combat ───────────────────────────────────────────────────────────────────
export {
    heal, isDefeated,
    getActiveEffectModifiers, canAct,
    // 0.34.0 status-depth epic — HP-model selectors + tunable scalars
    VULNERABLE_MAX_MULT, RUPTURE_CAP_FRACTION,
    DISRUPT_DENY_AT,
    CONCEDE_PREMISES_BASE, CONCEDE_PREMISES_ELITE, CONCEDE_PREMISES_BOSS,
    healCharacter,
} from './Combat';
export type {
    Stance,
    AggregatedEffectModifiers,
} from './Combat';

// ─── Spec 25 — Hazard-Pattern Combat ──────────────────────────────────────────
// Card-and-dice combat: VITAE (`isDefeated`) is the main win condition beside
// the alt-wins (Befriend, RELENT, CONDEMN); status play and direct damage
// compete on merit (THE BIG NUMBERS REWRITE, 2026-09-02).
export {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase, processBetweenPhases,
    selectEncounterMercyChoice, selectCapitulationChoice, getCard,
    handCards, buildCombatSummary,
    combatDieCanPower,
    toCombatCard, buildCombatDeck,
    COMBAT_DECK_PRESETS, COMBAT_DECK_PRESET_ORDER,
    listDeckPresets,
    getThreatSequence,
    mechanicText,
    // Spec 26b / spec 33 — turn lifecycle, Conviction, Signature Skills
    startTurn, endTurn, discardCombatCard,
    playSignatureSkill, isPhaseStanceRevealed,
    // Phase 102 — SUMMON: the dieless-but-priced add clear, and its constants
    strikeAdd, ADD_WAVE_CAP, STRIKE_ADD_COST,
    getSignatureSkill,
    READ_DAMAGE_MULT,
    colorMatchBonus,
    // 0.34.0 status-depth epic — honesty selectors + deny-threshold consts
    projectRuptureBurst,
    // phase 28 — legibility sweep
    projectIncomingThreat,
    // WS7.2 — chosen X-cost clamp range (`recoil_x`), engine-owned
    recoilXRange,
    // Phase 2 — projected-lethality readout (spec 30)
    projectCombatOutcome,
    // Spec 32 v3 — floating dice save-back + sway decay knob
    getFloatingDiceColors, SWAY_DECAY_PER_TURN,
    // RELENT (PLEA) resolve threshold — the sway meter's target (WI-5)
    capitulateThreshold,
    // CONDEMN Premise floor per difficulty — the concede-ladder source (WI-6)
    concedeFloorFor,
    // Spec 26b tuning §B/§C/§D
    COMBAT_REWARD_POOL, STARTING_CARD_IDS, rollCombatCardRewards, addRewardCard,
    unlockCardViaDilemma,
    // Fate Engine P1 (spec 31) — the dice get a second read
    riderText, RESERVE_MAX,
    // Spec 33 — Upgradeable Dice (THE combat dice model since the D7 flag
    // collapse): the surfaces the app/sim layers need.
    PRESS_FATE_COST,
    SPECIAL_CONVICTION_DEFAULT, MOMENTUM_CHAIN_ORDER, MOMENTUM_SURGE_LENGTH,
    DEFAULT_DIE_GEAR, activeDieGear,
} from './Combat';
export type { UpgradeableDieGear } from './Combat';
export type {
    CombatEncounterState,
    CombatManaDie, CombatDieColor,
    CombatCard, CombatVerbClass, CardEffectKind,
    CombatThreatPhase, CombatThreatAction, CombatThreatEffect,
    CombatOutcome, CombatEvent,
    CombatSummary,
    CombatIntentType, CombatReadResult,
    SignatureSkill,
    // The three chain/stance colours (spec 33 momentum chain + stance checks)
    WheelStance,
    // Phase 102 — SUMMON's brood: one member of an add wave
    CombatAdd,
} from './Combat';

// ─── Sandbox cards — the deck-forge experimentation surface ───────────────────
// New experimental cards + numeric overrides of library cards, live everywhere
// `getCardById` is consulted; the `/deck-tuning` loop A/Bs them here before a
// literal is promoted into the library.
export {
    registerSandboxCards,
    clearSandboxCards,
} from './Cards/cards.sandbox';

// ─── Deck removal (Phase 52a) — taking a card OUT, and what that costs ───────
// The engine's first removal primitive plus the per-run escalating price. The
// rest-choice engine (52c) and the picker screen (52d) consume these; prices
// were ratified in Phase 52f against measured income.
export {
    removeCardFromCombatDeck,
    cardRemovalPrice, cardRemovalsOf,
} from './Cards/card.removal';

// ─── Effects ──────────────────────────────────────────────────────────────────
export {
    applyEffect,
    lookupEffect, effectsLibrary,
} from './Effects';
export type {
    Effect, EffectType, EffectCategory,
    ActiveEffect,
} from './Effects';

// ─── Items ────────────────────────────────────────────────────────────────────
export {
    isEquipment, isConsumable, isMaterial, isQuestItem,
    // Phase 96 — the desperation band (a healing potion pays 1.5x under half
    // VITAE). `resolveConsumableHeal` is the shared resolver mobile's presenters
    // preview with, so the shop line and the drink preview cannot drift from
    // what the engine actually pays.
    resolveConsumableHeal,
    // Phase 21 — procedural equipment factory/templates retired; loot caches
    // yield consumables via rollCacheReward. Phase 23 — modifier catalogue,
    // affix library, item sets, and the rarity model are torn down.
    rollCacheReward,
    wornPerSlot, isEquippedFirstOfSlot, findEquippedInSlot,
    SLOT_CAPACITY,
    consumableLibrary, getConsumableById,
    buyItem, sellItem, defaultSellPrice,
    relicLibrary, getRelicById,
    // The shared grant/equip/swap path. `equipItem` never returns the displaced
    // piece (weapon/armor replace in place; a full accessory row is a guarded
    // no-op), so every grant site routes through `grantItem` rather than
    // re-deriving the unequip -> addItem -> equipItem chain.
    // `qualifiesForItemRewardScreen` is D5: the one predicate that decides
    // ceremony (reward screen) vs. the lightweight inline grant.
    grantItem, qualifiesForItemRewardScreen, partitionGrantsForReward, displacedBy,
} from './Items';
export type {
    Item, Equipment, Consumable, Material, QuestItem,
    EquipmentSlot,
    CacheLootTier,
    ShopWare,
    GrantOutcome,
} from './Items';

// ─── Cards ───────────────────────────────────────────────────────────────────
export type {
    Card, CardAspect, CardTier, CardTarget,
    CardCombatEffects, CardSpecialMechanic,
    CardSynergy,
    // Spec 32 v3 — the rank ladder / rarity / card-type axes
    CardRank, CardRarity, CardType, CardRider,
} from './Cards';
export {
    // Spec 32 v3 — rank/rarity helpers (mobile renders rank names off these)
    CARD_RANK_NAMES, rankToRarity,
    getAvailableCards, learnCard,
    cardLibrary, getCardById,
    // Spec 32 §3/§6 — card themes + keyword families (phase 29 parity lint)
    THEME_KEYWORDS,
    // Phase 68 — runtime enumeration of the CardSpecialMechanic union, bound to
    // the type by compile-time assertions. Mobile KW-2 walks this list.
    CARD_SPECIAL_MECHANIC_KINDS,
} from './Cards';
export type { CardTheme } from './Cards';

// ─── Game (state, store, persistence, constants) ──────────────────────────────
export {
    createGameStore, createNewGameState, GAME_STATE_VERSION,
    migrate, createEventEmitter,
    selectPlayer, selectIsInCombat,
    selectVersion,
    nullAdapter,
    MAX_EFFECT_INTENSITY,
    // State fixtures (2026-09-07) — one declarative state for CLI / Jest / web.
    buildStateFromFixture,
    validateStateFixture,
    getStateFixtureById, listStateFixtureIds,
} from './Game';
export type {
    StateFixture,
    GameState, GameStore, PersistenceAdapter, StoreApi,
    GameEvent, GameEventEmitter, GameEventHandler,
    CodexEntry,
} from './Game';

// ─── World ────────────────────────────────────────────────────────────────────
export {
    MAP_REGISTRY, getMapDefinition, createMapState,
    // Map revamp M3a — the new-game start (D27) and "start on any map" (dev tools).
    createStartingWorld, STARTING_MAP, STARTABLE_MAPS,
    moveToNode,
    teleportToNode, placeOnNode, unblockMapRoute,
    applyDialogueChoice,
    emptyQuestLog, findActiveQuest,
    startQuest, progressQuest, completeQuest,
} from './World';

// Hazard Minigame (v2 — faithful port of the former mobile living rules source).
// The engine transitions, content, tuning, deck-flag codec and types mobile
// consumes (mobile has deleted its local engine); the rest of the Hazard
// module's surface is reachable from `./World/Hazard`.
// See `plan/archive/2026-09-25-trim-t1/axiomancer-mechanics/docs/hazard-v2-vs-mechanics-divergence.md` (archived 2026-09-25).
export {
    HAZARD_TUNING, HAZARD_KEYWORDS, HAZARD_DECK, HAZARD_CRACK_CARD,
    HAZARD_REWARD_CARDS, getHazardCardDef, HAZARD_REWARDS, HAZARD_CONSEQUENCES,
    HAZARD_VITAE_REWARD, HAZARD_CACHE_SHILLINGS, HAZARD_RELIC_SHILLINGS,
    HAZARD_MINHP_LOSS, HAZARD_MAXHP_SCAR, HAZARD_LIBRARY, getHazardDef,
    HAZARD_CARD_FLAG_PREFIX, hazardStarterBag, decodeAcquiredCards,
    hazardDeckBag, appendAcquiredCard, hazardCardPowerColors,
    hazardProjectedProgress, dieCanPowerCard, createHazardSession,
    selectHazardRoute, finishHazardRolling, stageHazardCard, unstageHazardCard,
    powerHazardCard, chooseHazardCardKey, applyHazardCard, discardHazardCard,
    resolveHazardRound, hazardSubquestResults, continueHazardAfterResolve,
    acknowledgeHazardOutcome, claimHazardRewards, confirmHazardForetell,
} from './World/Hazard';
export type {
    HazardColor, HazardDieKind, HazardProgressKey, HazardCardDef,
    HazardHandEntry, HazardSubquestReward, HazardSubquestStatus, HazardRouteKey,
    HazardMark, HazardOutcomeTier, HazardPhase, HazardSessionState,
} from './World/Hazard';

// Quest Board minigame ("The Boy's Almanac") — retired in Phase 61; nothing
// is exported for it any more (see `game.migrate.ts`'s v17 → v18 hop).

// Blacksmith encounter ("The Anvil" — Spec 33 §6 die-gear upgrades: HONE /
// TEMPER / gear swap).
export {
    ANVIL_VERB_PRICING, BLACKSMITH_WITNESS_VARIANTS, HEART_RICH_PAYLOAD_VARIANT,
    createBlacksmithSession, beginBlacksmith, honeBlacksmith, temperBlacksmith,
    swapBlacksmith, continueBlacksmithCard, leaveBlacksmith,
    claimBlacksmithOutcome,
} from './World/Blacksmith';
export type {
    BlacksmithVariantOffer, BlacksmithSession,
} from './World/Blacksmith';
// Rest-choice encounter (Phase 52c-d) — the rest node's one irreversible
// choice of `rest` / `cut` (the `anvil` offer was dropped in Phase 59),
// composing the Cards/card.removal primitive rather than rebuilding it.
// Replaced the former rest minigame, retired in Phase 52e.
export {
    RESTCHOICE_TUNING, createRestChoiceSession, previewRestChoiceHeal,
    chooseRestChoiceOffer, pickRestChoiceCut, claimRestChoiceOutcome,
} from './World/RestChoice';
export type {
    RestChoiceOfferId, RestChoiceSession,
} from './World/RestChoice';
// Loot-cache-choice encounter ("The Reliquary") — the cache node's one
// irreversible choice of `card` / `item` / `sacrifice`. Replaced the
// former Pick Pool dice-pool minigame, retired in Phase 63.
export {
    createLootCacheChoiceSession, chooseLootCacheChoiceOffer,
    claimLootCacheChoiceOutcome,
} from './World/LootCacheChoice';
export type {
    LootCacheChoiceOfferId, LootCacheChoiceOutcome, LootCacheChoiceSession,
} from './World/LootCacheChoice';
export {
    changeMap, completeMap, unlockMap,
    completeNode, unlockNode, changeContinent,
    revealAdjacent, markNodeConsumed,
    // 2026-08-08 first-map audit: traversal queries.
    legalMovesFrom,
    // D1 (2026-09-21) — the forward skeleton the progression audits walk.
    forwardEdges,
} from './World';
export {
    resolveMapEvent,
    getNodeEventPool,
    getNodePrimaryEventKind,
} from './World';
export type {
    MapEventKind,
    ResolvedEvent, ResolveMapEventResult,
} from './World';
// Phase 52b — rest shelter classification (retires the healFraction >= 1.0
// inn heuristic). Mobile gates the hazard-scar max-VITAE mend on this.
export type { RestShelter } from './World';
export {
    DEFAULT_REST_SHELTER, isInnShelter,
} from './World';
// Phase 65 — village goodwill reward tiers (discount / Ally grant / bonus).
export {
    GOODWILL_ALLY_THRESHOLD, GOODWILL_ALLY_CARD_ID,
    GOODWILL_BONUS_THRESHOLD, GOODWILL_BONUS_CURRENCY,
    applyGoodwillDiscount, goodwillBonusFlag,
} from './World';
// W-01 — The Labyrinth (THE APORIA). Additive surface for the mobile
// dev-menu entry + labyrinth presenters.
export {
    createLabyrinthProgress, visibleDoors, inspectPoi,
    submitGateAnswer, preConfirmedWords, buyHint, hintPrice,
    debtPoints, borrowedPremiseStacks, settleDebt, activateWaystone,
    lastWaystone, namingForkOpen, recordBossOutcome, getRoom,
    recordWalk, walkedEdgesOf, isSophistTrueName, resolvePoiTrap,
    SETTLE_PRICE_PER_POINT,
    APORIA_ACTS, getAporiaAct,
} from './World';
export type {
    LabyrinthActDef, LabyrinthActId,
    LabyrinthProgress,
    LabyrinthBossOutcome,
} from './World';
export type {
    WorldState, Quest,
    Encounter,
    MapName, ContinentName, QuestName,
    MapState, QuestObjective, QuestLog,
    SeedInput,
} from './World';

// ─── Ledger (Phase 42 cube + 27-cell registry; né Philosophy, Phase 44h) ─────
export {
    bucketAxis, getAlignmentCell, defaultAlignment,
    AXIS_LOW_THRESHOLD,
} from './Ledger';
export type {
    PhilosophicalAlignment,
} from './Ledger';

// ─── NPCs (types + dialogue helpers) ──────────────────────────────────────────
export type {
    NPC, DialogueTree, DialogueNode, DialogueChoice, DialogueContext,
} from './NPCs';
export { getDialogueNode, visibleChoices } from './NPCs';

// ─── Utilities ────────────────────────────────────────────────────────────────
export {
    deepClone,
} from './Utils';
export { setRng, getRng } from './Utils/rng';
export type { Rng } from './Utils/rng';

// ── Events ─────────────────────────────────────────────────────────────────
export type {
    TypedGameEvent,
} from './Game/events.types';

export {
    isCombatEndedEvent,
    isWorldMovedEvent,
    isLevelUpEvent, isInventoryChangedEvent,
    isDialogueAppliedEvent,
} from './Game/events.utils';

// ── AXM Log (structured logging — docs/logging.md) ────────────────────────
export {
    getLogger, configureLogging,
    resetLoggingForTests,
    AXM_LOG_DOMAINS, AXM_LOG_LEVEL_RANK,
} from './Log';
export type {
    AxmLogEntry, AxmLogLevel, AxmLogDomain,
    AxmLogFilter,
} from './Log';
