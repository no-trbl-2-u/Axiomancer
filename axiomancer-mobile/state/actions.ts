/**
 * Typed action layer for the engine store.
 *
 * Per Spec 04 the combat screen never dispatches engine reducers
 * directly — it calls these actions. Each one wraps a small bit of
 * engine state and writes the result back through `updateCombat`.
 *
 * Resource (mana) accounting on the in-combat player is a
 * presentation placeholder until Phase 21 (engine-driven skill
 * resolution) wires the engine's per-resource pools. **Phase 60d**
 * lifted mana off `Character` (engine 0.10.1+ removed those fields
 * from the public type) onto a mobile-only `combatMana` slice on
 * `AppStoreState`. The slice is `null` outside combat and gets
 * seeded on `startCombat`, decremented on skill burn, and cleared on
 * `endCombat`. Phase 16 is `[skipped]` pending an
 * `axiomancer-mechanics` release that re-exports `skillLibrary` /
 * `getSkillById`; once that lands and Phase 16 ships, the stop-gap
 * pool gets replaced.
 */

import {
    applyDialogueChoice,
    buyItem as engineBuyItem,
    buildCharacterFromPreset,
    calculateSkillDamage,
    defaultAlignment,
    getAvailableSkills,
    learnSkill as engineLearnSkill,
    changeMap as worldChangeMap,
    completeNode as worldCompleteNode,
    consumableLibrary,
    equipmentTemplates,
    uniqueTemplates,
    createMapState,
    equipItem as engineEquipItem,
    unequipItem as engineUnequipItem,
    getDialogueNode,
    getTemplatesBySlot,
    getMapDefinition,
    getNodePrimaryEventKind,
    getPresetById,
    getSkillById,
    healCharacter,
    isConsumable,
    isEquipment,
    markNodeConsumed,
    resolveMapEvent,
    revealAdjacent,
    unlockNode as worldUnlockNode,
    type Character,
    type GameStore,
    type Consumable,
    type DialogueChoice,
    type DialogueTree,
    type Enemy,
    type Equipment,
    type EquipmentSlot,
    type GameState,
    type Item,
    type MapName,
    type MapState,
    type PhilosophicalAlignment,
    type ResolveMapEventResult,
    type Skill,
    type WorldState,
} from 'axiomancer-mechanics';


import {
    COMBAT_SKILLS,
    getCombatSkillById,
    skillEffectText,
} from '@/state/selectors/combat-skills';
import { equipmentFromTemplate as templateToEquipment } from 'axiomancer-mechanics';
import { resolveWareItem } from '@/state/presenters/village.engine';
import {
    applyCombatDeckPresetAction,
    chosenStarterBundle,
    randomizeCombatDeckAction,
    type CombatDeckPresetId,
    type CombatDeckPresetResult,
} from './combat/store-actions';
import { EMPTY_EVENT_SLICE, type AppStore } from './store';
import {
    abandonHazardAction,
    acknowledgeHazardOutcomeAction,
    applyHazardDeckPresetAction,
    applyHazardCardAction,
    beginHazardAction,
    chooseHazardCardKeyAction,
    claimHazardRewardsAction,
    continueHazardAfterResolveAction,
    discardHazardCardAction,
    finishHazardRollingAction,
    powerHazardCardAction,
    randomizeHazardDeckAction,
    resolveHazardRoundAction,
    selectHazardRouteAction,
    stageHazardCardAction,
    unstageHazardCardAction,
    confirmHazardForetellAction,
    type BeginHazardOptions,
    type ClaimHazardRewardsResult,
    type HazardDeckPresetId,
    type HazardDeckPresetResult,
} from './hazard/store-actions';
import type { HazardProgressKey, HazardRouteKey } from 'axiomancer-mechanics';
import {
    abandonGatheringAction,
    acknowledgeGatheringOutcomeAction,
    beginGatheringAction,
    completeGatheringTutorialAction,
    GATHERING_TUTORIAL_FLAG,
    claimGatheringSpoilsAction,
    continueGatheringAfterReprisalAction,
    descendGatheringAction,
    harvestGatheringPlotAction,
    payGatheringOfferingAction,
    selectGatheringApproachAction,
    useGatheringToolAction,
    withdrawFromGatheringAction,
    type BeginGatheringOptions,
    type ClaimGatheringSpoilsResult,
} from './gathering/store-actions';
import type { GatherApproachKey, GatherToolId } from 'axiomancer-mechanics';
import {
    abandonQuestBoardAction,
    acknowledgeQuestDuskAction,
    beginQuestBoardAction,
    chooseQuestSpaceOptionAction,
    claimQuestBoardCompletionAction,
    continueQuestSpaceAction,
    rollQuestBoneAction,
    startQuestBoardPlayAction,
    useQuestCharmAction,
    type BeginQuestBoardOptions,
    type ClaimQuestBoardResult,
} from './quest/store-actions';
import type { QuestCharmId, RestPosture } from 'axiomancer-mechanics';
import {
    abandonRestAction,
    beginRestAction,
    chooseRestOptionAction,
    chooseRestPostureAction,
    claimRestOutcomeAction,
    continueRestWatchAction,
    type BeginRestOptions,
    type ClaimRestOutcomeResult,
} from './rest/store-actions';
import {
    abandonLootCacheAction,
    beginLootCacheAction,
    claimLootCacheOutcomeAction,
    continueLootCacheCardAction,
    delveLootCacheAction,
    probeLootCacheAction,
    sealLootCacheAction,
    startLootCacheDelvingAction,
    type BeginLootCacheOptions,
    type ClaimLootCacheResult,
} from './cache/store-actions';
import type { CacheLootTier } from 'axiomancer-mechanics';
import {
    applyPlayerTierPresetAction,
    type ApplyPlayerTierPresetResult,
} from './dev/player-presets';
import {
    addItemByIdAction,
    type AddItemByIdResult,
} from './dev/item-by-id';
import {
    lootCommonItemAction,
    lootUncommonItemAction,
    lootRareItemAction,
    lootUniqueItemAction,
    type LootRarityResult,
} from './dev/loot-rarity';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Phase 78 — `CombatEndReport` is not re-exported from the engine
 * package root (only via `axiomancer-mechanics/Game`, which the
 * package `exports` field doesn't expose). Derive the type from
 * the GameStore.endCombat signature so the alias tracks engine
 * changes without a deep import.
 */
export type CombatEndReport = ReturnType<GameStore['endCombat']>;

export interface MoveToResult {
    /** True when the engine state was advanced. */
    moved: boolean;
    /** Engine node id the player now occupies (unchanged on no-op). */
    currentNodeId: string;
    /** True when the target was locked or not currently reachable. */
    locked: boolean;
}

/** Phase 54 — debug seed action summary. */
export interface DebugSeedResult {
    /** Count of items pushed to the player's inventory across categories. */
    itemsAdded: number;
    /** Count of skills appended to the player's `knownSkills` list. */
    skillsLearned: number;
    /** True when the current map was successfully re-seeded. */
    mapReset: boolean;
}

/**
 * Dev-only "populate every item" affordance (user-direct request
 * 2026-05-22, mid-`/march` interjection). Adds one of every item
 * known to the engine's central registries to the player's
 * inventory: equipment templates, unique-item templates,
 * consumables. Useful for surface-testing inventory rendering,
 * equip dock peer ordering, and per-rarity / per-slot chrome under
 * a maximal load. Mirrors `DebugSeedResult`'s shape so callers can
 * toast a uniform summary.
 */
export interface PopulateAllItemsResult {
    /** Total items pushed across all registries. */
    itemsAdded: number;
    /** Per-registry breakdown so the dev toast can spot a regression at a glance. */
    breakdown: {
        equipment: number;
        unique: number;
        consumable: number;
    };
}

/** Phase 59 — character-preset adoption result. */
export interface ApplyCharacterPresetResult {
    /** True when the preset id matched an engine preset and `player` was replaced. */
    applied: boolean;
    /** Resolved preset id ('apprentice' / 'wanderer' / 'sage'), or null when unknown. */
    presetId: string | null;
    /** Display name from the preset, or null when unknown. */
    presetName: string | null;
}

export interface AppActions {
    startCombat: (enemy: Enemy) => void;
    /**
     * Phase 200 — begin a LIVE map encounter on the new hazard-pattern
     * combat (Spec 26b) instead of legacy `startCombat`. Pulls the foe out
     * of the pending combat-prelude event, guarantees starter skills (the
     * real-deck safe fallback), clears the event slice, and returns the
     * `Enemy` for the in-place `<CombatEncounterPanel>` to initialise from.
     * Deliberately does NOT touch the engine `combat` slice — the new
     * engine state lives in the panel's local React state. Returns `null`
     * when there's no pending encounter.
     */
    beginHazardEncounter: () => Enemy | null;
    /**
     * Phase 78 — returns the engine `CombatEndReport` (was `void`).
     * Callers that need post-combat metadata (codex unlock, alignment
     * shift, narrative) read it off the return value; legacy callers
     * that ignore the return value remain compatible.
     */
    /**
     * Legacy engine `endCombat` bridge (Phase 78). The live hazard
     * encounter applies its own spoils; this store-level action forwards
     * an outcome to the engine's `endCombat` method (which now requires
     * an explicit outcome) and surfaces the resulting `CombatEndReport`
     * (XP, loot, friendship codex unlock). Defaults to `'flee'` (no
     * reward) when called with no argument. Returns `null` outside an
     * encounter.
     */
    endCombat: (outcome?: CombatEndReport['outcome']) => CombatEndReport | null;
    addItem: (item: Item) => void;
    removeItem: (itemId: string) => void;
    useConsumable: (itemId: string) => void;
    /**
     * Apply a consumable's effect to the player and decrement the stack
     * (Spec 06 Q2=A). Heals parsed from the consumable's `effect` string
     * (e.g. `"Heal 6 HP"` / `"Restore 4 HP"` / `"+10 HP"`). No-op when
     * the item isn't a consumable or doesn't exist.
     */
    useItem: (itemId: string) => UseItemResult;
    /**
     * Soft-equip an item by reordering inventory so it is the first
     * occurrence of its slot — the convention shared with
     * `selectCharacterViewModel`. No-op when the item isn't equipment.
     */
    equipItem: (itemId: string) => void;
    /**
     * User-jot 2026-05-22 (oversight 29th): unequip is the swap
     * counterpart to equip. Under mobile's
     * "first-equipment-per-slot = worn" convention, unequip moves
     * the target to the END of its slot peers in inventory; the
     * next slot-peer (currently at index 1) becomes the new
     * first-in-slot worn item. If the target is the sole item in
     * its slot, the action is a no-op (the convention can't
     * express "worn nothing" without a richer mobile-side flag).
     */
    unequipItem: (itemId: string) => void;
    /** Discard an item — wraps `removeItem` with a quest-item guard. */
    dropItem: (itemId: string) => void;
    /**
     * Move the player to a connected, available node.
     * Marks the target completed, advances `currentNodeId`, and unlocks
     * outbound edges declared in the screen-side layout fixture
     * (`app/(tabs)/exploration/maps/<map>.layout.ts`).
     */
    moveTo: (nodeId: string) => MoveToResult;
    /** Swap the active map within the current continent. */
    changeMap: (mapName: MapName) => void;
    /**
     * Dev-only seed action (Phase 54). Adds representative items
     * across categories, teaches a handful of fixture skills, and
     * resets the current map back to its starting node. Returns a
     * summary so the calling UI can toast the result. Component
     * mount is `__DEV__`-guarded; production never reaches this.
     */
    debugSeed: () => DebugSeedResult;
    /**
     * Dev-only "populate every item" affordance (user-direct request
     * 2026-05-22). Walks the engine's central item registries
     * (`equipmentTemplates`, `uniqueTemplates`, `consumableLibrary`)
     * and pushes one of each to the player's inventory. Component
     * mount is `__DEV__`-guarded; production never reaches this.
     */
    populateAllItems: () => PopulateAllItemsResult;
    /**
     * Dev-only character preset adoption (Phase 59). Looks up the
     * engine `characterPresets` row by id and replaces the player
     * slice with a fresh `buildCharacterFromPreset(preset)` result.
     * No-op (returns `applied: false`) when the id is unknown.
     * Component mount is `__DEV__`-guarded; production never reaches
     * this.
     */
    applyCharacterPreset: (presetId: string) => ApplyCharacterPresetResult;
    /**
     * Phase 131 — dev-only player-tier preset adoption. Looks up the
     * mobile `PLAYER_TIER_PRESETS` row (`kid-l1` / `kid-l15` /
     * `kid-l30` / `kid-l50`) and replaces the player slice with a
     * fresh `buildCharacterFromPreset` build at that level — seeded
     * with level-relevant skills and equipment for the Kid's
     * evidence runs. No-op (`applied: false`) on unknown ids.
     * Component mount is `isDevToolsEnabled()`-guarded.
     */
    applyPlayerTierPreset: (presetId: string) => ApplyPlayerTierPresetResult;
    /**
     * Phase 131 — dev-only "add item by id". Resolves `id` against
     * the engine's item registries (equipment template → unique
     * template → consumable) and pushes the match to the player's
     * inventory. Returns a graceful failure for unknown ids.
     * Component mount is `isDevToolsEnabled()`-guarded.
     */
    addItemById: (id: string) => AddItemByIdResult;
    /**
     * Phase 136 — dev-only "loot a real common drop". Generates a
     * genuine common equipment drop (zero modifiers) through the engine
     * `dropItem` path and pushes it to inventory. Reports the generated
     * item name + modifier count. Component mount is
     * `isDevToolsEnabled()`-guarded.
     */
    lootCommonItem: () => LootRarityResult;
    /**
     * Phase 136 — dev-only "loot a real uncommon drop". Generates a
     * genuine uncommon equipment drop through the engine
     * `dropItem(templateId, level, 'uncommon')` path (exactly one rolled
     * modifier) and pushes it to inventory. Reports the generated item
     * name + modifier count. Component mount is
     * `isDevToolsEnabled()`-guarded.
     */
    lootUncommonItem: () => LootRarityResult;
    /**
     * Phase 136 — dev-only "loot a real rare drop". Generates a
     * genuine rare equipment drop through the engine
     * `dropItem(templateId, level, 'rare')` path (exactly two rolled
     * modifiers) and pushes it to inventory. Reports the generated item
     * name + modifier count. Component mount is
     * `isDevToolsEnabled()`-guarded.
     */
    lootRareItem: () => LootRarityResult;
    /**
     * Phase 136 — dev-only "loot a unique relic". Generates a genuine
     * unique drop from `uniqueTemplates` through the engine
     * `dropItem(templateId, level, 'unique')` path (its three fixed
     * modifiers, rolled to level-appropriate values) and pushes it to
     * inventory. Reports the generated item name + modifier count.
     * Component mount is `isDevToolsEnabled()`-guarded.
     */
    lootUniqueItem: () => LootRarityResult;
    /**
     * Phase 73 — allocate a single stat point. Wraps the engine's
     * `allocateStatPoint(stat)` action. The engine clamps
     * `availableStatPoints >= 1` before applying; this wrapper trusts
     * the caller to gate. Returns the new `availableStatPoints` count
     * so the LevelUpModal can update its local "spent / total" math
     * without round-tripping through the store selector.
     */
    allocateStatPoint: (stat: 'heart' | 'body' | 'mind') => number;
    /**
     * Phase 73 follow-up (user-jot 2026-05-24): engine `levelUp`
     * action. Drains accumulated XP and grants stat points via the
     * engine's `applyLevelUps` loop (handles stacked level-ups in
     * one pass). Caller is responsible for gating on
     * `vm.levelUpReady`; the engine's `LEVEL_UP` reducer is a no-op
     * when `experience < experienceToNextLevel`.
     */
    levelUp: () => void;
    /**
     * Phase 77 — engine run-reset (`RESET_RUN` action). Atomic:
     * regenerates `runId`, full-heals the player, clears active
     * effects, regenerates world / quests / flags. With
     * `keepCharacter: true` the player slice survives the reset
     * (only health + effects refresh); with `keepCharacter: false`
     * a brand-new game state is built. Wraps the engine GameStore
     * method exposed on `GameStore = GameState & GameActions`.
     */
    resetRun: (opts: { keepCharacter: boolean }) => void;
    save: () => void;
    /**
     * Run `resolveMapEvent(state)` on the current node, cache the
     * `ResolveMapEventResult` in the mobile event slice, and apply
     * the resulting `state` to the engine store. No-ops while combat
     * is active (Spec 08 Q4 = Future spec).
     *
     * `sourceNodeType` — the map node type that triggered this event
     * (e.g. `'quest'`, `'rest'`, `'treasure'`). Stored in the event
     * slice so the event modal can apply category-specific visual
     * treatment even when the engine resolves to a generic kind.
     *
     * Returns `true` when an event was produced (kind !== 'none').
     */
    resolveCurrentMapEvent: (sourceNodeType?: string) => boolean;
    /**
     * Resolve the currently-pending event by id. Branches on VM kind:
     *  - combat-prelude + 'fight'  -> startCombat(encounter.enemies[0]); clear
     *  - combat-prelude + 'flee'   -> clear (no combat)
     *  - narrative-choice + NPC dialogue with cursor -> applyDialogue;
     *    advance cursor if `nextNode !== null`, else clear
     *  - narrative-choice + auto-resolve (rest/gather/treasure/quest)
     *    -> clear (engine already advanced state via resolveMapEvent)
     */
    pickEventChoice: (choiceId: string) => void;
    /** Clear the pending event without dispatching any engine call. */
    dismissEvent: () => void;

    // -----------------------------------------------------------------
    // Hazard minigame (engine: axiomancer-mechanics World/Hazard). The pure
    // engine owns every rule; these wrappers thread the session through
    // the `hazard` slice. Phase order: route-select → rolling → playing
    // → resolve-flash → … → outcome → rewards → done.
    // -----------------------------------------------------------------

    /** Start a hazard session (random hazard unless pinned). Returns false if one is active. */
    beginHazard: (options?: BeginHazardOptions) => boolean;
    /** Binding route choice; casts the 4 mana dice (once per hazard). */
    selectHazardRoute: (route: HazardRouteKey) => void;
    /** Dice-cast interstitial finished animating. */
    finishHazardRolling: () => void;
    /** Drag a hand card into the play area (max 6; utility effects fire). */
    stageHazardCard: (uid: string) => void;
    /** Tap a staged card to return it to hand (frees its die). */
    unstageHazardCard: (uid: string) => void;
    /** Drag a card to the trash bin — discard it for its SALVAGE benefit. */
    discardHazardCard: (uid: string) => void;
    /** Drop a matching-colour (or wild gold) die on a staged card. */
    powerHazardCard: (uid: string, dieId: string) => void;
    /** Apply a staged card: fire its utility and lock it in (one-way). */
    applyHazardCard: (uid: string) => void;
    /** CHOOSE card (TWIN PATHS): pick which meter its surge value feeds. */
    chooseHazardCardKey: (uid: string, key: HazardProgressKey) => void;
    /** Confirm FORETELL/SCOUR: pass kept card ids in draw-order; omitted ids go to discard. */
    confirmHazardForetell: (orderedIds: string[]) => void;
    /** Commit the staged set; the engine stamps O or X. */
    resolveHazardRound: () => void;
    /** Dismiss the resolve flash; advances the round or computes the outcome. */
    continueHazardAfterResolve: () => void;
    /** Outcome modal acknowledged → rewards ledger. */
    acknowledgeHazardOutcome: () => void;
    /**
     * Confirm rewards (cardId = picked offer, null = skip/none) and
     * apply the outcome to live game state (VITAE, currency, deck
     * flags). Clears the session and persists.
     */
    claimHazardRewards: (cardId: string | null) => ClaimHazardRewardsResult;
    /** Clear the session without rewards or penalties (dev / escape hatch). */
    abandonHazard: () => void;
    /**
     * Dev tool — replace the acquired-card flags with a random pull
     * from every defined hazard card (starter + reward pool). Returns
     * the granted card ids.
     */
    randomizeHazardDeck: () => string[];
    /** Dev tool — apply one deterministic Kid strategy deck preset. */
    applyHazardDeckPreset: (presetId: HazardDeckPresetId) => HazardDeckPresetResult;
    /**
     * Dev tool — swap the player's combat deck for a preset: replaces
     * `knownSkills` with the preset's card ids and clears earned reward
     * cards, so the next encounter deals exactly that deck.
     */
    applyCombatDeckPreset: (presetId: CombatDeckPresetId) => CombatDeckPresetResult;
    /**
     * Dev tool — rebuild the combat deck as a random pull from every
     * defined combat card (starter + reward pool). Returns the granted ids.
     */
    randomizeCombatDeck: () => string[];

    // -----------------------------------------------------------------
    // Gathering minigame ("The Gleaning" — see state/gathering/). The
    // pure engine owns every rule; these wrappers thread the session
    // through the `gathering` slice. Phase order: approach-select →
    // foraging ⇄ reprisal → outcome → rewards → done.
    // -----------------------------------------------------------------

    /** Start a gleaning (random site unless pinned). Returns false if one is active. */
    beginGathering: (options?: BeginGatheringOptions) => boolean;
    /** Binding stance: GLEAN (restraint) or STRIP (greed). */
    selectGatheringApproach: (approach: GatherApproachKey) => void;
    /** Harvest a plot from the spread (a BREATH plot tends instead). */
    harvestGatheringPlot: (uid: string) => void;
    /** Descend one stratum (one-way; richer, angrier). */
    descendGathering: () => void;
    /** Pay an offering demand (affordability-gated). Returns success. */
    payGatheringOffering: (offeringId: string) => boolean;
    /** Use a one-shot field tool. */
    useGatheringTool: (toolId: GatherToolId) => void;
    /** Dismiss the current reprisal flash. */
    continueGatheringAfterReprisal: () => void;
    /** Walk away with the satchel — restraint is always available. */
    withdrawFromGathering: () => void;
    /** Outcome modal acknowledged → spoils ledger. */
    acknowledgeGatheringOutcome: () => void;
    /**
     * Confirm the spoils and apply the outcome to live game state
     * (inventory materials, VITAE, currency, flags). Clears the
     * session and persists.
     */
    claimGatheringSpoils: () => ClaimGatheringSpoilsResult;
    /** Clear the session without spoils or penalties (dev / escape hatch). */
    abandonGathering: () => void;
    /** Mark the guided first gleaning done (completed or skipped) and persist. */
    completeGatheringTutorial: (skipped: boolean) => void;

    // -----------------------------------------------------------------
    // Quest Board minigame ("The Boy's Almanac" — see state/quest/).
    // Fully sandboxed: only the completion record flows back. Phase
    // order: intro → idle ⇄ space → dusk → … → outcome → done.
    // -----------------------------------------------------------------

    /** Start a quest board (first board unless pinned). Returns false if one is on the table. */
    beginQuestBoard: (options?: BeginQuestBoardOptions) => boolean;
    /** Board-reveal overlay acknowledged: intro → idle. */
    startQuestBoardPlay: () => void;
    /** Cast the bone die: move the piece, fit parts at the slipway, open the space. */
    rollQuestBone: () => void;
    /** Prime a one-use charm (idle only; consumed by its trigger). */
    useQuestCharm: (charmId: QuestCharmId) => void;
    /** Pick an option on the open space (market stalls stay open until LEAVE). */
    chooseQuestSpaceOption: (optionId: string) => void;
    /** Acknowledge the space's result card; dusk or the bone die follows. */
    continueQuestSpace: () => void;
    /** Dusk acknowledged: a new day dawns with supper. */
    acknowledgeQuestDusk: () => void;
    /** Confirm the outcome ledger; records the completion flag and persists. */
    claimQuestBoardCompletion: () => ClaimQuestBoardResult;
    /** Clear the board without a record (dev / escape hatch). */
    abandonQuestBoard: () => void;

    // -----------------------------------------------------------------
    // Rest encounter ("The Night Watch" — see state/rest/). Phase
    // order: posture → watch ×3 → outcome → done.
    // -----------------------------------------------------------------

    /** Start a night at camp. Returns false if one is underway. */
    beginRest: (options?: BeginRestOptions) => boolean;
    /** Choose how to lie: deep / doze / watch. */
    chooseRestPosture: (posture: RestPosture) => void;
    /** Pick an option on the open watch card (embers, dreams). */
    chooseRestOption: (optionId: string) => void;
    /** Acknowledge the watch's result; the next watch or dawn follows. */
    continueRestWatch: () => void;
    /** Confirm the dawn ledger; applies heal/cleanse/keepsakes and persists. */
    claimRestOutcome: () => ClaimRestOutcomeResult;
    /** Clear the night without a heal (dev / escape hatch). */
    abandonRest: () => void;

    // -----------------------------------------------------------------
    // Loot-cache encounter ("The Reliquary" — see state/cache/). Phase
    // order: intro → delving ⇄ card → outcome → done.
    // -----------------------------------------------------------------

    /** Start a cache from the authored payload. Returns false if one is open. */
    beginLootCache: (options?: BeginLootCacheOptions) => boolean;
    /** The find acknowledged: intro → delving. */
    startLootCacheDelving: () => void;
    /** Open the next layer (a sealed trap fires unconditionally). */
    delveLootCache: () => void;
    /** Spend the one probe to reveal the next layer's fate. */
    probeLootCache: () => void;
    /** Walk away with everything lifted so far. */
    sealLootCache: () => void;
    /** Acknowledge the open card; delving, or the ledger, follows. */
    continueLootCacheCard: () => void;
    /** Confirm the ledger; applies items/currency/bite and persists. */
    claimLootCacheOutcome: () => ClaimLootCacheResult;
    /** Clear the cache without loot or bites (dev / escape hatch). */
    abandonLootCache: () => void;

    /**
     * Buy a ware from the pending village event's shop (Phase 137
     * dedicated village screen). Engine `buyItem` owns the rules
     * (affordability, cloning); returns success.
     */
    buyVillageWare: (itemId: string) => boolean;

    // -----------------------------------------------------------------
    // Skill-learning pass.
    // -----------------------------------------------------------------

    /**
     * Rolls up to `count` (default 3) level-up skill offers from
     * everything the player currently qualifies for (engine
     * `getAvailableSkills`, alignment-gated). Empty = nothing new to
     * learn; the caller skips the modal.
     */
    getLearnableSkillOffers: (count?: number) => LearnableSkillOffer[];
    /** Learns a skill through the engine (requirement-checked). */
    learnSkill: (skillId: string) => boolean;
}

export interface UseItemResult {
    /** Item was found and a consumable. */
    applied: boolean;
    /** Healing applied to player HP (positive integer). */
    healed: number;
    /** Damage applied to player HP (positive integer). */
    damaged: number;
}

// ---------------------------------------------------------------------------
// Skill learning (level-up picks)
// ---------------------------------------------------------------------------

/**
 * Starter repertoire — sourced from the engine's level-1 `apprentice`
 * preset (`getPresetById('apprentice').knownSkills`) so the engine remains
 * the single source of truth for the starting skill set. New games create
 * the player with `knownSkills: []` and the normal flow never applies a
 * preset, so the first combat / first level-up seeds these.
 * `engineLearnSkill` enforces requirements, so anything the level-1 player
 * doesn't qualify for is skipped.
 */
// Spec 26b §D — the new player's starting combat repertoire.
//
// In this engine a combat *card* is the draw-able projection of a *skill*: the
// draw pile is built from `player.knownSkills` (`buildCombatDeck`), and a card's
// POWERED action runs `executeSkill`, which THROWS unless the player knows that
// skill. So the hand can only be as varied — and as effective — as the set of
// skills the level-1 player actually KNOWS.
//
// We can NOT source these from the engine's exported `STARTING_SKILL_IDS`: that
// set lists `slippery-slope`, which has a level-14 learning requirement, so a
// level-1 player silently fails to learn it (engine `meetsLearningRequirement`).
// That collapsed the starter deck to a single card (`brace-for-impact`), the
// engine padded the 6-card hand with duplicates, and every card was a 0-power
// guard — i.e. the player drew the same ~3 do-nothing cards every turn.
//
// Instead we seed an explicit set of five tier-1 skills that are ALL learnable
// at level 1, span every stance (body / mind / heart), and mix attack, defense
// and control so cards have a real, varied effect from the first fight. Five
// skills + the synthetic `card-retreat` = a six-card deck against a six-card
// hand, so the player draws all five action cards (retreat is hidden in the UI)
// with no duplicates; the deckbuilder card rewards grow the deck from there.
// `engineLearnSkill` re-checks each requirement, so anything unlearnable is
// skipped safely.
const STARTER_SKILL_IDS: readonly string[] = [
    'ad-hominem-strike', // body · attack (strips a random enemy buff)
    'brace-for-impact',  // body · defense (guard)
    'false-dilemma',     // mind · attack + control (confusion)
    'suspend-judgment',  // mind · defense (guard)
    'ship-of-theseus',   // heart · attack (direct HP damage)
];

function currentAlignment(store: AppStore): PhilosophicalAlignment {
    const state = store.getState() as unknown as GameState;
    return state.philosophicalAlignment ?? defaultAlignment();
}

/** Seeds the starter deck when the player knows nothing yet — the chosen
 *  starter bundle if one was picked (deck identity), else the tier-1 default. */
function ensureStarterSkills(store: AppStore): void {
    const player = store.getState().player;
    if (!player || (player.knownSkills?.length ?? 0) > 0) return;
    // Deck-identity path: a bundle was chosen pre-run. Direct-set its curated
    // deck (the cards are valid engine ids; learn-requirements don't gate the
    // combat deal — knownSkills IS the deck source).
    const bundle = chosenStarterBundle(store);
    if (bundle) {
        store.setState({ player: { ...player, knownSkills: [...bundle.cardIds], combatRewardCards: [] } });
        return;
    }
    const alignment = currentAlignment(store);
    let next = player;
    for (const id of STARTER_SKILL_IDS) {
        next = engineLearnSkill(next, id, alignment);
    }
    if (next !== player) store.setState({ player: next });
}

/** One learnable-skill offer row for the level-up learn modal. */
export interface LearnableSkillOffer {
    id: string;
    name: string;
    description: string;
    stance: 'body' | 'mind' | 'heart';
    category: 'fallacy' | 'paradox';
    tier: number;
    /** Compact effect line — same format as the combat picker rows. */
    effectText: string;
}

function toLearnableOffer(store: AppStore, skill: Skill): LearnableSkillOffer {
    const player = store.getState().player;
    const combatSkill = getCombatSkillById(skill.id);
    let damage = Math.max(0, skill.basePower);
    try {
        damage = calculateSkillDamage(player, skill);
    } catch {
        // incomplete caster shape — keep the base-power estimate
    }
    return {
        id: skill.id,
        name: skill.name.toUpperCase(),
        description: skill.description,
        stance: skill.philosophicalAspect,
        category: skill.category,
        tier: skill.tier,
        effectText: combatSkill
            ? skillEffectText(combatSkill, damage)
            : 'NO DIRECT EFFECT',
    };
}

/**
 * Rolls the level-up skill offers: up to `count` random picks from
 * everything the player currently qualifies for (engine
 * `getAvailableSkills`, alignment-gated). Empty when nothing new is
 * learnable — the caller skips the modal.
 */
function getLearnableSkillOffersAction(store: AppStore, count = 3): LearnableSkillOffer[] {
    ensureStarterSkills(store);
    const player = store.getState().player;
    if (!player) return [];
    const pool = getAvailableSkills(player, currentAlignment(store)).slice();
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count).map((s) => toLearnableOffer(store, s));
}

/** Learns a skill through the engine (requirement-checked). */
function learnSkillAction(store: AppStore, skillId: string): boolean {
    const player = store.getState().player;
    if (!player) return false;
    const next = engineLearnSkill(player, skillId, currentAlignment(store));
    if (next === player) return false;
    store.setState({ player: next });
    return true;
}

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export function createAppActions(store: AppStore): AppActions {
    return {
        startCombat: (enemy) => {
            // Starter skills must exist BEFORE the engine snapshots the
            // player — the picker and the engine both read the
            // snapshot's knownSkills. The engine's `startCombat` records
            // the encounter (`currentEncounter`) and fires `combat:started`.
            ensureStarterSkills(store);
            store.getState().startCombat(enemy);
        },
        beginHazardEncounter: () => {
            // Live map encounters now run the new hazard-pattern combat
            // (Spec 26b), not the legacy stance engine. Pull the foe out of
            // the pending combat-prelude event, guarantee a real deck via
            // starter skills, clear the event slice, and hand the enemy back
            // for the in-place panel to bootstrap. Crucially we do NOT call
            // the legacy `startCombat` — the new engine state is owned by the
            // panel's local React state, so `state.combat` stays null.
            const slice = store.getState().event;
            const pending = slice?.pending ?? null;
            if (!pending || pending.event.kind !== 'encounter') return null;
            const enemy = pending.event.encounter.enemies[0] ?? null;
            if (!enemy) return null;
            ensureStarterSkills(store);
            clearEventSlice(store);
            return enemy;
        },
        endCombat: (outcome) => {
            // Cross-combat resource carry is engine-owned now (the reducer's
            // END_COMBAT banks unspent philosophical resources onto the player
            // and folds them into the next combat's seed) — no client carry.
            // Phase 78 — surface the engine `CombatEndReport` so callers can
            // read post-combat metadata (codex unlock, alignment shift,
            // narrative). The engine `endCombat` now requires an explicit
            // outcome; default to `'flee'` (no reward) when unspecified. It
            // returns a stub 'flee' report when called outside an encounter.
            const report = store.getState().endCombat(outcome ?? 'flee');
            return report ?? null;
        },
        // Action creators used elsewhere — wired here for completeness.
        addItem: (item) => store.getState().addItem(item),
        removeItem: (itemId) => store.getState().removeItem(itemId),
        useConsumable: (itemId) => store.getState().useConsumable(itemId),
        useItem: (itemId) => useItemAction(store, itemId),
        equipItem: (itemId) => equipItemAction(store, itemId),
        unequipItem: (itemId) => unequipItemAction(store, itemId),
        dropItem: (itemId) => dropItemAction(store, itemId),
        moveTo: (nodeId) => moveToAction(store, nodeId),
        changeMap: (mapName) => changeMapAction(store, mapName),
        debugSeed: () => debugSeedAction(store),
        populateAllItems: () => populateAllItemsAction(store),
        applyCharacterPreset: (presetId) => applyCharacterPresetAction(store, presetId),
        applyPlayerTierPreset: (presetId) => applyPlayerTierPresetAction(store, presetId),
        addItemById: (id) => addItemByIdAction(store, id),
        lootCommonItem: () => lootCommonItemAction(store),
        lootUncommonItem: () => lootUncommonItemAction(store),
        lootRareItem: () => lootRareItemAction(store),
        lootUniqueItem: () => lootUniqueItemAction(store),
        allocateStatPoint: (stat) => {
            // Engine's `allocateStatPoint` is a zustand action attached
            // to the GameStore (`node_modules/axiomancer-mechanics/dist/
            // Game/store.d.ts:34`). We forward verbatim and return the
            // post-mutation `availableStatPoints` value for the UI.
            const engineStore = store.getState() as unknown as {
                allocateStatPoint?: (s: 'heart' | 'body' | 'mind') => void;
            };
            engineStore.allocateStatPoint?.(stat);
            return store.getState().player?.availableStatPoints ?? 0;
        },
        resetRun: (opts) => {
            // Phase 77 — engine `resetRun` (Phase 72 [ENGINE LANDED]).
            // Same cast pattern as `allocateStatPoint`: the method is
            // attached to the zustand store directly, not the engine
            // selectors. Return value (the fresh GameState) is unused
            // here — the store already reflects the new state.
            const engineStore = store.getState() as unknown as {
                resetRun?: (o: { keepCharacter: boolean }) => unknown;
            };
            engineStore.resetRun?.(opts);
        },
        levelUp: () => {
            // Phase 73 follow-up — engine `levelUp` action. Same
            // cast pattern as `allocateStatPoint` / `resetRun`. The
            // engine's `LEVEL_UP` reducer applies `applyLevelUps`
            // which loops while `experience >= experienceToNextLevel`,
            // so a single dispatch covers stacked level-ups.
            const engineStore = store.getState() as unknown as {
                levelUp?: () => void;
            };
            engineStore.levelUp?.();
        },
        save: () => store.getState().save(),
        resolveCurrentMapEvent: (sourceNodeType?: string) => resolveCurrentMapEventAction(store, sourceNodeType),
        pickEventChoice: (choiceId) => pickEventChoiceAction(store, choiceId),
        dismissEvent: () => dismissEventAction(store),
        beginHazard: (options) => beginHazardAction(store, options),
        selectHazardRoute: (route) => selectHazardRouteAction(store, route),
        finishHazardRolling: () => finishHazardRollingAction(store),
        stageHazardCard: (uid) => stageHazardCardAction(store, uid),
        unstageHazardCard: (uid) => unstageHazardCardAction(store, uid),
        discardHazardCard: (uid) => discardHazardCardAction(store, uid),
        powerHazardCard: (uid, dieId) => powerHazardCardAction(store, uid, dieId),
        applyHazardCard: (uid) => applyHazardCardAction(store, uid),
        confirmHazardForetell: (orderedIds) => confirmHazardForetellAction(store, orderedIds),
        chooseHazardCardKey: (uid, key) => chooseHazardCardKeyAction(store, uid, key),
        resolveHazardRound: () => resolveHazardRoundAction(store),
        continueHazardAfterResolve: () => continueHazardAfterResolveAction(store),
        acknowledgeHazardOutcome: () => acknowledgeHazardOutcomeAction(store),
        claimHazardRewards: (cardId) => claimHazardRewardsAction(store, cardId),
        abandonHazard: () => abandonHazardAction(store),
        randomizeHazardDeck: () => randomizeHazardDeckAction(store),
        applyHazardDeckPreset: (presetId) => applyHazardDeckPresetAction(store, presetId),
        applyCombatDeckPreset: (presetId) => applyCombatDeckPresetAction(store, presetId),
        randomizeCombatDeck: () => randomizeCombatDeckAction(store),
        beginGathering: (options) => beginGatheringAction(store, options),
        selectGatheringApproach: (approach) => selectGatheringApproachAction(store, approach),
        harvestGatheringPlot: (uid) => harvestGatheringPlotAction(store, uid),
        descendGathering: () => descendGatheringAction(store),
        payGatheringOffering: (offeringId) => payGatheringOfferingAction(store, offeringId),
        useGatheringTool: (toolId) => useGatheringToolAction(store, toolId),
        continueGatheringAfterReprisal: () => continueGatheringAfterReprisalAction(store),
        withdrawFromGathering: () => withdrawFromGatheringAction(store),
        acknowledgeGatheringOutcome: () => acknowledgeGatheringOutcomeAction(store),
        claimGatheringSpoils: () => claimGatheringSpoilsAction(store),
        abandonGathering: () => abandonGatheringAction(store),
        completeGatheringTutorial: (skipped) => completeGatheringTutorialAction(store, skipped),
        beginQuestBoard: (options) => beginQuestBoardAction(store, options),
        startQuestBoardPlay: () => startQuestBoardPlayAction(store),
        rollQuestBone: () => rollQuestBoneAction(store),
        useQuestCharm: (charmId) => useQuestCharmAction(store, charmId),
        chooseQuestSpaceOption: (optionId) => chooseQuestSpaceOptionAction(store, optionId),
        continueQuestSpace: () => continueQuestSpaceAction(store),
        acknowledgeQuestDusk: () => acknowledgeQuestDuskAction(store),
        claimQuestBoardCompletion: () => claimQuestBoardCompletionAction(store),
        abandonQuestBoard: () => abandonQuestBoardAction(store),
        beginRest: (options) => beginRestAction(store, options),
        chooseRestPosture: (posture) => chooseRestPostureAction(store, posture),
        chooseRestOption: (optionId) => chooseRestOptionAction(store, optionId),
        continueRestWatch: () => continueRestWatchAction(store),
        claimRestOutcome: () => claimRestOutcomeAction(store),
        abandonRest: () => abandonRestAction(store),
        beginLootCache: (options) => beginLootCacheAction(store, options),
        startLootCacheDelving: () => startLootCacheDelvingAction(store),
        delveLootCache: () => delveLootCacheAction(store),
        probeLootCache: () => probeLootCacheAction(store),
        sealLootCache: () => sealLootCacheAction(store),
        continueLootCacheCard: () => continueLootCacheCardAction(store),
        claimLootCacheOutcome: () => claimLootCacheOutcomeAction(store),
        abandonLootCache: () => abandonLootCacheAction(store),
        buyVillageWare: (itemId) => buyVillageWareAction(store, itemId),
        getLearnableSkillOffers: (count) => getLearnableSkillOffersAction(store, count),
        learnSkill: (skillId) => learnSkillAction(store, skillId),
    };
}

// ---------------------------------------------------------------------------
// Inventory action implementations (Spec 06)
// ---------------------------------------------------------------------------

/**
 * Parse a consumable's free-form `effect` string for a healing value.
 * Recognises patterns like `"Heal N HP"`, `"Restore N HP"`, `"+N HP"`,
 * or `"N HP"`. Returns 0 when no value is found.
 */
export function parseHealAmount(effect: string): number {
    if (!effect) return 0;
    const lowered = effect.toLowerCase();
    // Skip strings that explicitly mention damage so we don't heal from
    // a damage-coded consumable.
    if (/\bdamage|\bharm|\binflict|\bburn|\bpoison|\bbleed/.test(lowered)) {
        const matchDamageOnly = /(?:^|\b)(heal|restore|\+)/.test(lowered);
        if (!matchDamageOnly) return 0;
    }
    const re = /(?:heal|restore|\+)\s*(\d+)\s*hp\b/i;
    const m = effect.match(re);
    if (m && m[1]) return Math.max(0, parseInt(m[1], 10));
    const re2 = /\b(\d+)\s*hp\b/i;
    const m2 = effect.match(re2);
    if (m2 && m2[1]) return Math.max(0, parseInt(m2[1], 10));
    return 0;
}

function useItemAction(store: AppStore, itemId: string): UseItemResult {
    const state = store.getState();
    const inventory: readonly Item[] = state.player.inventory;
    const item = inventory.find((i: Item) => i.id === itemId);
    if (!item || !isConsumable(item)) {
        return { applied: false, healed: 0, damaged: 0 };
    }

    const consumable = item as Consumable;
    const hpBefore = state.player.health;
    // The engine's `store.useConsumable` runs `useConsumableEffect`
    // internally, which already applies `consumable.healAmount` when the
    // structured field is present. We only need to apply heal ourselves
    // for legacy fixtures / records that still encode the value as a
    // free-form `effectId` string ("Heal N HP") — the engine ignores
    // those (lookupEffect returns undefined).
    const legacyHeal = consumable.healAmount != null
        ? 0
        : parseHealAmount(consumable.effectId ?? '');
    let nextPlayer: Character = state.player;
    if (legacyHeal > 0) {
        nextPlayer = healCharacter(nextPlayer, legacyHeal);
    }

    // Apply the player-state update first, then route the stack
    // decrement through the engine's reducer.
    if (nextPlayer !== state.player) {
        store.setState({ player: nextPlayer });
    }
    store.getState().useConsumable(itemId);

    const hpAfter = store.getState().player.health;
    const delta = hpAfter - hpBefore;
    return {
        applied: true,
        healed: Math.max(0, delta),
        damaged: Math.max(0, -delta),
    };
}

function equipItemAction(store: AppStore, itemId: string): void {
    const state = store.getState();
    const inventory: readonly Item[] = state.player.inventory;
    const target = inventory.find((i: Item) => i.id === itemId);
    if (!target || !isEquipment(target)) return;

    // EQUIPMENT STATS FIX: Call engine's equipItem to apply stat bonuses
    const updatedPlayer = engineEquipItem(state.player, target as Equipment);

    const targetSlot = (target as Equipment).slot;

    // Build the reordered inventory:
    //   1. The target item (now first in its slot).
    //   2. All other items, preserving their relative order, with the
    //      old "first in slot" item demoted behind the target.
    const targetIndex = inventory.indexOf(target);
    const rest = inventory.filter((_: Item, idx: number) => idx !== targetIndex);
    const slotPeers: Item[] = [];
    const nonSlot: Item[] = [];
    for (const it of rest) {
        if (isEquipment(it) && (it as Equipment).slot === targetSlot) {
            slotPeers.push(it);
        } else {
            nonSlot.push(it);
        }
    }
    const next: Item[] = [target, ...slotPeers, ...nonSlot];

    store.setState({ player: { ...updatedPlayer, inventory: next } });
}

function unequipItemAction(store: AppStore, itemId: string): void {
    // Mobile "worn" convention: first equipment item per slot is
    // worn (see `state/selectors/equipment.ts:firstEquippedPerSlot`).
    // To "unequip" the worn item under that convention, move it
    // to the END of its slot peers in inventory; the next peer
    // (formerly second in slot) becomes the new first-in-slot
    // worn item. If there's only one item in the slot, the move
    // is a no-op — the convention can't express "wearing nothing"
    // without a richer flag (could be added when engine surfaces a
    // proper `unequipItem(slot)` API and the mobile presenter
    // reads from `character.equipment` directly).
    const state = store.getState();
    const inventory: readonly Item[] = state.player.inventory;
    const target = inventory.find((i: Item) => i.id === itemId);
    if (!target || !isEquipment(target)) return;
    const targetSlot = (target as Equipment).slot;

    // Count slot peers (including target). If only one, no-op —
    // there's no other item to "swap to."
    const slotPeerCount = inventory.filter(
        (it: Item) => isEquipment(it) && (it as Equipment).slot === targetSlot,
    ).length;
    if (slotPeerCount <= 1) return;

    // EQUIPMENT STATS FIX: Call engine's unequipItem to remove stat bonuses
    const updatedPlayer = engineUnequipItem(state.player, targetSlot);

    // Rebuild inventory:
    //   1. All non-target, non-slot items in their original order.
    //   2. All slot peers (except target) in their original order
    //      — the formerly-second-in-slot becomes first-in-slot
    //      and so on.
    //   3. Target appended at the end of its slot peers (so it's
    //      last-in-slot, definitively NOT worn).
    const slotPeersExceptTarget: Item[] = [];
    const nonSlot: Item[] = [];
    for (const it of inventory) {
        if (it.id === target.id) continue;
        if (isEquipment(it) && (it as Equipment).slot === targetSlot) {
            slotPeersExceptTarget.push(it);
        } else {
            nonSlot.push(it);
        }
    }
    const next: Item[] = [...nonSlot, ...slotPeersExceptTarget, target];

    store.setState({ player: { ...updatedPlayer, inventory: next } });
}

function dropItemAction(store: AppStore, itemId: string): void {
    const state = store.getState();
    const inventory: readonly Item[] = state.player.inventory;
    const target = inventory.find((i: Item) => i.id === itemId);
    if (!target) return;
    // Quest items cannot be discarded — `canDiscard` on the VM mirrors
    // this guard so the screen never offers the action, but defend in
    // depth here for direct dispatch.
    if (target.category === 'quest-item') return;
    store.getState().removeItem(itemId);
}

// ---------------------------------------------------------------------------
// World actions (Spec 07)
// ---------------------------------------------------------------------------

/**
 * Read the player's current node id from the world slice. As of
 * `axiomancer-mechanics@0.5.0` (Spec 08 Q5A), the runtime `MapState`
 * exposes `currentNode` directly — `createMapState` seeds it from the
 * static definition's `startingNode.id` for a fresh map.
 */
export function readCurrentNodeId(world: WorldState): string {
    return world.currentMap.currentNode;
}

function writeCurrentNodeId(map: MapState, nodeId: string): MapState {
    return { ...map, currentNode: nodeId };
}

function moveToAction(store: AppStore, nodeId: string): MoveToResult {
    const world: WorldState | undefined = store.getState().world;
    if (!world) {
        return { moved: false, currentNodeId: '', locked: false };
    }

    const currentNodeId = readCurrentNodeId(world);
    const map = world.currentMap;
    const available = map.availableNodes;
    const completed = map.completedNodes;

    // Target must be currently reachable. Locked or already-completed
    // taps no-op (the screen also gates this, but defend in depth).
    const isAvailable = available.includes(nodeId);
    const isLocked = map.lockedNodes.includes(nodeId);
    if (!isAvailable) {
        return { moved: false, currentNodeId, locked: isLocked };
    }

    // Node kind comes from the engine's authored event pools. Encounter /
    // boss nodes (both resolve to the `encounter` kind) stay reusable — they
    // are not completed/consumed on entry; every other kind completes.
    const nodeKind = getNodePrimaryEventKind(map.continent, map.name, nodeId);
    const isEncounterNode = nodeKind === 'encounter';

    // Only complete/consume nodes that aren't encounters
    let nextWorld: WorldState = world;
    if (!isEncounterNode) {
        nextWorld = worldCompleteNode(world, nodeId);
        // The engine reducer only *adds* to completedNodes; tidy up the
        // available list so the same node can't be re-entered.
        nextWorld = {
            ...nextWorld,
            currentMap: {
                ...nextWorld.currentMap,
                availableNodes: (nextWorld.currentMap.availableNodes as readonly string[]).filter(
                    (n: string) => n !== nodeId,
                ),
            },
        };
    }

    // Populate `availableNodes` (the screen's reachable set) from the ENGINE
    // graph's outbound edges — `getMapDefinition` is the single source of truth
    // for the unlock graph, so the client no longer carries its own edge list.
    const engineNode = getMapDefinition(map.continent, map.name).nodes.find(
        (n) => n.id === nodeId,
    );
    for (const targetId of engineNode?.connectedNodes ?? []) {
        if (completed.includes(targetId)) continue;
        if (nextWorld.currentMap.availableNodes.includes(targetId)) continue;
        nextWorld = worldUnlockNode(nextWorld, targetId);
    }

    nextWorld = {
        ...nextWorld,
        currentMap: writeCurrentNodeId(nextWorld.currentMap, nodeId),
    };

    // Phase 27: populate the engine's parallel data model
    // (`discoveredNodes`) via `revealAdjacent`. The engine reads
    // neighbours from `getMapDefinition(continent, name).nodes[].connectedNodes`
    // — no mobile-side traversal needed. Coexists with the legacy
    // `availableNodes` population above until the screen migrates
    // (future Phase 30 TBD).
    nextWorld = {
        ...nextWorld,
        currentMap: revealAdjacent(nextWorld.currentMap, nodeId),
    };

    store.setState({ world: nextWorld });

    return { moved: true, currentNodeId: nodeId, locked: false };
}

function changeMapAction(store: AppStore, mapName: MapName): void {
    try {
        const world: WorldState | undefined = store.getState().world;
        if (!world) return;

        // Phase 60a — adopted `createMapState(getMapDefinition(...))`
        // pattern. The engine's `getCoastalMap` was the single-arg
        // convenience on 0.10.0 (`getCoastalMap(name)`); 0.10.1+
        // removed it in favour of the two-step
        // `createMapState(getMapDefinition(continent, name))` form.
        // Both paths exist on 0.10.0, so this migration is safe under
        // the current lockfile. Continent is sourced from the current
        // map (Coastal Cradle today; world-state-tracked when the
        // northern continent ships).
        const continent = world.currentMap.continent;
        const nextMap = createMapState(getMapDefinition(continent, mapName));
        const nextWorld = worldChangeMap(world, nextMap);
        store.setState({ world: nextWorld });
    } catch (error) {
        console.error(`Failed to change map to ${mapName}:`, error);
    }
}

// ---------------------------------------------------------------------------
// Debug seed (Phase 54 — dev-only manual-testing affordance)
// ---------------------------------------------------------------------------

// `templateToEquipment` extracted to `state/selectors/equipment.ts`
// (AUDIT [4.0] engine-duplication fix 2026-05-22). This debug-seed
// path still routes through the shared helper; mobile's former
// `state/exploration-maps/event-pools.ts` override was deleted in
// Phase 161 when map-event content moved fully to engine truth.

function debugSeedAction(store: AppStore): DebugSeedResult {
    let itemsAdded = 0;
    let skillsLearned = 0;
    let mapReset = false;

    try {
        const state = store.getState();
        const addItem = state.addItem;

        // 1. One consumable from the engine library (Healing Potion as the
        //    canonical test item). `addItem` is the engine reducer; we
        //    spread to a fresh object so the engine's stack-merge path can
        //    do its work without alias issues.
        try {
            const potion = consumableLibrary[0];
            if (potion) {
                addItem({ ...potion });
                itemsAdded++;
            }
        } catch (error) {
            console.warn('Failed to add consumable item:', error);
        }

        // 2. One equipment per major slot (head / body / weapon). The
        //    inventory dock and equip-replace preview both key off slot,
        //    so covering three slots gives a meaningful smoke test. The
        //    slot list is typed by engine `EquipmentSlot` so an engine
        //    rename is a tsc error; templates are pulled via the engine's
        //    `getTemplatesBySlot` rather than a local `equipmentTemplates`
        //    scan, so new templates per slot pick the first available.
        const seedSlots: ReadonlyArray<EquipmentSlot> = ['head', 'body', 'weapon'];
        for (const slot of seedSlots) {
            try {
                const tpl = getTemplatesBySlot(slot)[0];
                if (tpl) {
                    addItem(templateToEquipment(tpl));
                    itemsAdded++;
                }
            } catch (error) {
                console.warn(`Failed to add equipment for slot ${slot}:`, error);
            }
        }

        // 3. Two skills from the engine's library (covers both paradox +
        //    fallacy categories). Phase 16 swapped the data source from
        //    the local mock to `state/selectors/combat-skills`; engine
        //    0.10.2 now re-exports `skillLibrary` at the top level.
        //    Push directly onto `player.knownSkills` rather than via
        //    `engine.learnSkill` — `learnSkill` enforces level-/stat-
        //    gating which the dev seed should bypass. The ids it adds
        //    are exactly what the picker renders from `COMBAT_SKILLS`.
        try {
            const fixtureSkillIds: ReadonlyArray<string> = COMBAT_SKILLS
                .slice(0, 4)
                .map((s) => s.id);
            if (fixtureSkillIds.length > 0) {
                const afterAdd = store.getState();
                const player = afterAdd.player;
                const known = new Set<string>(player.knownSkills ?? []);
                for (const id of fixtureSkillIds) {
                    if (!known.has(id)) {
                        known.add(id);
                        skillsLearned++;
                    }
                }
                const nextPlayer: Character = {
                    ...player,
                    knownSkills: Array.from(known),
                };
                store.setState({ player: nextPlayer });
            }
        } catch (error) {
            console.warn('Failed to add skills:', error);
        }

        // 4. Reset the current map: re-seed via the engine's two-step
        //    `createMapState(getMapDefinition(continent, name))` +
        //    `changeMap`. Engine guarantees the returned `MapState` is at
        //    `currentNode = startingNode.id` with cleared
        //    discoveredNodes / consumedNodes.
        //    (Phase 60a — migrated from the deprecated single-arg
        //    `getCoastalMap`; both paths exist on 0.10.0 but 0.10.1+
        //    drops the old form.)
        const world: WorldState | undefined = store.getState().world;
        if (world && world.currentMap) {
            try {
                const fresh = createMapState(
                    getMapDefinition(world.currentMap.continent, world.currentMap.name),
                );
                const nextWorld = worldChangeMap(world, fresh);
                store.setState({ world: nextWorld });
                mapReset = true;
            } catch (error) {
                // changeMap can throw if the map name is unknown. Swallow
                // and report — the seed action is best-effort dev affordance.
                console.warn('Failed to reset map:', error);
                mapReset = false;
            }
        }
    } catch (error) {
        console.error('Debug seed action failed:', error);
    }

    return { itemsAdded, skillsLearned, mapReset };
}

/**
 * Walk every engine item registry and push one of each into the
 * player's inventory. Dev-only — surfaced via the SELF-tab Debug
 * menu's POPULATE button. Mirrors the existing `debugSeedAction`
 * shape so the Debug button can render a uniform toast.
 *
 * Filed against the user-direct request 2026-05-22 (mid-`/march`
 * interjection): "let's add a button that 'populates' items and
 * gives the player every item in the game". "Every item" here means
 * every entry in the engine's three central item registries:
 * `equipmentTemplates` (base equipment), `uniqueTemplates` (uniques,
 * marked `rarity: 'unique'`), and `consumableLibrary`. Materials
 * and quest-items aren't in central registries (materials are
 * authored per engine event payload; quest-items live per quest),
 * so they're out of scope.
 */
function populateAllItemsAction(store: AppStore): PopulateAllItemsResult {
    let equipment = 0;
    let unique = 0;
    let consumable = 0;

    try {
        const state = store.getState();
        const addItem = state.addItem;

        // Add equipment templates with error handling
        for (const tpl of equipmentTemplates) {
            try {
                addItem(templateToEquipment(tpl));
                equipment++;
            } catch (error) {
                console.warn(`Failed to add equipment template ${tpl.name}:`, error);
            }
        }

        // Uniques share the EquipmentTemplate shape (UniqueItemTemplate
        // extends it) so `templateToEquipment` works, but the helper
        // hard-codes `rarity: 'common'`. Override per-item so the
        // inventory chrome surfaces the unique rarity correctly.
        for (const tpl of uniqueTemplates) {
            try {
                const base = templateToEquipment(tpl);
                addItem({ ...base, rarity: 'unique' });
                unique++;
            } catch (error) {
                console.warn(`Failed to add unique template ${tpl.name}:`, error);
            }
        }

        for (const item of consumableLibrary) {
            try {
                // Spread to a fresh object so the engine's stack-merge path
                // can do its work without alias issues (same pattern as
                // `debugSeedAction`).
                addItem({ ...item });
                consumable++;
            } catch (error) {
                console.warn(`Failed to add consumable ${item.name}:`, error);
            }
        }
    } catch (error) {
        console.error('Populate all items action failed:', error);
    }

    const itemsAdded = equipment + unique + consumable;
    return { itemsAdded, breakdown: { equipment, unique, consumable } };
}

function applyCharacterPresetAction(
    store: AppStore,
    presetId: string,
): ApplyCharacterPresetResult {
    try {
        const preset = getPresetById(presetId);
        if (!preset) {
            return { applied: false, presetId: null, presetName: null };
        }
        const nextPlayer = buildCharacterFromPreset(preset) as Character;
        store.setState({ player: nextPlayer });
        return { applied: true, presetId: preset.id, presetName: preset.name };
    } catch (error) {
        console.error(`Failed to apply character preset ${presetId}:`, error);
        return { applied: false, presetId: null, presetName: null };
    }
}

// ---------------------------------------------------------------------------
// Event actions (Spec 08 — Phase 6 Tick B)
// ---------------------------------------------------------------------------

function resolveCurrentMapEventAction(store: AppStore, sourceNodeType?: string): boolean {
    try {
        const state = store.getState();
        const gameState = state as unknown as GameState;
        const result: ResolveMapEventResult = resolveMapEvent(gameState);

        // Phase 27: when a non-'none' event resolves, mark the current
        // node consumed in the engine's parallel data model
        // (`consumedNodes`) for one-time events only. Encounter and boss
        // events should be reusable (can trigger multiple times), while
        // rest, treasure, quest, and gathering events are consumable
        // (one-time only). This fixes the issue where encounters stop
        // triggering after the first completion.
        // Coexists with legacy `completedNodes` (already populated by
        // `moveToAction`'s `worldCompleteNode` call). Screen still reads
        // legacy fields; Phase 30+ TBD migrates the read side.
        let resolvedState: GameState = result.state;
        const shouldConsumeNode = result.event.kind !== 'none' && 
            !['encounter'].includes(result.event.kind);
        if (shouldConsumeNode) {
            const currentNodeId = resolvedState.world?.currentMap?.currentNode;
            if (currentNodeId) {
                resolvedState = {
                    ...resolvedState,
                    world: {
                        ...resolvedState.world,
                        currentMap: markNodeConsumed(resolvedState.world.currentMap, currentNodeId),
                    },
                };
            }
        }

        // Hazard events launch the v2 minigame instead of the legacy
        // passive damage consequence (design handoff 2026-06-10). The
        // engine's resolveMapEvent already applied its flat damage to
        // `result.state`; restore the pre-event player so the minigame's
        // outcome is the only thing that touches VITAE, then start a
        // session. `<HazardGate>` routes to /hazard when the slice fills.
        if (result.event.kind === 'hazard') {
            store.setState({
                ...resolvedState,
                player: gameState.player,
                event: EMPTY_EVENT_SLICE,
            });
            beginHazardAction(store);
            return true;
        }

        // Gathering events launch "The Gleaning" minigame instead of the
        // legacy passive item grant. The engine's resolveMapEvent already
        // appended the payload items to the inventory in `result.state`;
        // restore the pre-event player so the minigame's spoils are the
        // only thing that touches the satchel, then start a session.
        // `<GatheringGate>` routes to /gathering when the slice fills.
        if (result.event.kind === 'gathering') {
            store.setState({
                ...resolvedState,
                player: gameState.player,
                event: EMPTY_EVENT_SLICE,
            });
            // The first-ever gleaning runs as the guided tutorial (pinned
            // seed + site, coach overlay); the persistent flag set on
            // completion/skip keeps every later encounter organic.
            const tutorialDone = (gameState.flags ?? []).includes(GATHERING_TUTORIAL_FLAG);
            beginGatheringAction(store, tutorialDone ? {} : { tutorial: true });
            return true;
        }

        // Quest events launch the board-game minigame ("The Boy's
        // Almanac"). The engine handler is a validated pass-through —
        // nothing to restore. `<QuestGate>` routes to /quest when the
        // slice fills.
        if (result.event.kind === 'quest') {
            store.setState({
                ...resolvedState,
                event: EMPTY_EVENT_SLICE,
            });
            beginQuestBoardAction(store, { boardId: result.event.boardId });
            return true;
        }

        // Rest events launch "The Night Watch" instead of the legacy
        // silent heal. The engine's resolveMapEvent already applied the
        // passive heal to `result.state`; restore the pre-event player so
        // the night's dawn outcome is the only thing that touches VITAE.
        // `<RestGate>` routes to /rest when the slice fills.
        if (result.event.kind === 'rest') {
            store.setState({
                ...resolvedState,
                player: gameState.player,
                event: EMPTY_EVENT_SLICE,
            });
            beginRestAction(store, { healFraction: result.event.healFraction });
            return true;
        }

        // Loot-cache events launch "The Reliquary" instead of the legacy
        // passive grant. The engine already appended the payload items +
        // currency to `result.state`; restore the pre-event player so the
        // cache's claim is the only thing that touches the inventory.
        // `<CacheGate>` routes to /cache when the slice fills.
        //
        // Phase 129 — reward depth: rather than the authored static
        // roster (`result.event.items`, always base-rarity), roll a real
        // engine-truth loot/relic table scaled to the player's level.
        // Deeper locales (northern-forest) roll the `rich` tier (more
        // items + a unique-relic chance); the coastal opener rolls
        // `modest`. Currency from the event payload is preserved.
        if (result.event.kind === 'loot-cache') {
            store.setState({
                ...resolvedState,
                player: gameState.player,
                event: EMPTY_EVENT_SLICE,
            });
            const mapName = resolvedState.world?.currentMap?.name;
            const tier: CacheLootTier = mapName === 'northern-forest' ? 'rich' : 'modest';
            beginLootCacheAction(store, {
                lootTable: { tier },
                currency: result.event.currency,
            });
            return true;
        }

        // Spread the advanced state onto the store. `event` is mobile-only
        // and survives because `result.state` does not include it.
        // If the resolved event is an interaction, seed the dialogue cursor at
        // the tree's root so `selectEventViewModel` composes against the right
        // node. The engine supplies the authored tree (its map definition owns
        // the NPCs); when it carries none, the card shows its default copy.
        let dialogueCursor: { tree: DialogueTree; nodeId: string } | null = null;
        if ((result.event.kind === 'interaction' || result.event.kind === 'narration') && result.event.dialogue) {
            const tree = result.event.dialogue;
            dialogueCursor = { tree, nodeId: tree.rootId };
        }

        const nextEvent = {
            ...(state.event ?? EMPTY_EVENT_SLICE),
            pending: result,
            dialogueCursor,
            history: [],
            sourceNodeType: sourceNodeType ?? null,
        };
        store.setState({ ...resolvedState, event: nextEvent });

        return result.event.kind !== 'none';
    } catch (error) {
        console.error('Failed to resolve current map event:', error);
        return false;
    }
}

function clearEventSlice(store: AppStore): void {
    store.setState({ event: EMPTY_EVENT_SLICE });
}

function pickEventChoiceAction(store: AppStore, choiceId: string): void {
    try {
        const state = store.getState();
        const slice = state.event;
        if (!slice || slice.pending === null) return;

        const processed = slice.pending.event;

        // combat-prelude path
        if (processed.kind === 'encounter') {
            if (choiceId === 'fight') {
                try {
                    // Phase 60b — engine's canonical `Encounter` shape is
                    // `{ enemies: Enemy[], origin?: string, rewards?:
                    // Reward[] }` (axiomancer-mechanics/dist/World/types.d.ts).
                    // The prelude consumes the first enemy. The earlier
                    // `as any` cast (closed via [2.5] event-audit row 4)
                    // dated back to Phase 60b's migration; the engine type
                    // exposes `.enemies` directly today.
                    const enemy = processed.encounter.enemies[0];
                    ensureStarterSkills(store);
                    store.getState().startCombat(enemy);
                    clearEventSlice(store);
                } catch (error) {
                    console.error('Failed to start combat from encounter:', error);
                    clearEventSlice(store);
                }
                return;
            }
            if (choiceId === 'flee') {
                try {
                    // [4.5] DRIFT fix (mechanics-vs-UI audit row 10):
                    // the FLEE button's chrome subtitle reads
                    // `forfeit the path · -ii morale` on non-boss
                    // encounters. Honour the chrome — shift the
                    // engine `moralMeter` by -2 so the SELF tab's
                    // alignment readout reflects the cost. Boss
                    // flee is engine-disabled in the UI (KNEEL /
                    // `enabled: false`) and the subtitle reads
                    // `sealed · no retreat` — no morale delta
                    // applies there even if the choice somehow
                    // dispatched.
                    if (!processed.isBoss) {
                        store.getState().shiftMoralMeter(-2);
                        // Phase 92 — flee narrative feedback. Display prose-style
                        // narrative after successful flee action matching existing
                        // lowercase ritual register patterns. Combined with morale
                        // cost feedback as requested in deep-playtest F03.
                        const prev = store.getState().notifications;
                        store.setState({
                            notifications: {
                                levelUpAcknowledged: prev?.levelUpAcknowledged ?? true,
                                toast: {
                                    text: 'you fled the encounter. the path bends away.\n\nmorale -2',
                                    id: (prev?.toast?.id ?? 0) + 1,
                                },
                            },
                        });
                    }
                    clearEventSlice(store);
                } catch (error) {
                    console.error('Failed to process flee action:', error);
                    clearEventSlice(store);
                }
                return;
            }
            // Unknown choice id on combat-prelude — defensive no-op.
            return;
        }

        // npc dialogue path (cursor-driven)
        if (slice.dialogueCursor !== null) {
            try {
                const { tree, nodeId } = slice.dialogueCursor;
                const node = getDialogueNode(tree, nodeId);
                // Phase 60c — engine flattened DialogueChoice (dropped `.id`).
                // The presenter now derives `choiceId` from the choice's
                // index in `node.choices`; lookup mirrors that index. If the
                // id isn't a valid index, treat as unknown choice
                // (defensive no-op preserved).
                const idx = Number(choiceId);
                const choices = node.choices ?? [];
                const choice: DialogueChoice | undefined =
                    Number.isInteger(idx) && idx >= 0 && idx < choices.length
                        ? choices[idx]
                        : undefined;
                if (!choice) {
                    // Unknown choice on dialogue node — defensive no-op.
                    return;
                }

                // applyDialogue advances engine state. Mobile-side: walk the cursor.
                store.getState().applyDialogue(tree, choice);
                const nextState = store.getState() as unknown as GameState;
                const result = applyDialogueChoice(nextState, tree, choice);

                const nextHistory = [
                    ...(slice.history as ReadonlyArray<{ nodeId: string; choiceId: string }>),
                    { nodeId, choiceId },
                ];

                if (result.nextNode !== null) {
                    store.setState({
                        event: {
                            ...slice,
                            dialogueCursor: {
                                tree,
                                nodeId: result.nextNode.id ?? nodeId,
                            },
                            history: nextHistory,
                        },
                    });
                } else {
                    // Dialogue tree exhausted — clear the event.
                    clearEventSlice(store);
                }
            } catch (error) {
                console.error('Failed to process dialogue choice:', error);
                clearEventSlice(store);
            }
            return;
        }

        // narrative-choice auto-resolve path (rest / gathering / loot-cache /
        // interaction-without-dialogue / village / cutscene / hazard). Engine
        // already advanced state via resolveMapEvent; just clear the event slice.
        clearEventSlice(store);
    } catch (error) {
        console.error('Failed to pick event choice:', error);
        clearEventSlice(store);
    }
}

function dismissEventAction(store: AppStore): void {
    clearEventSlice(store);
}

/**
 * Buys a ware off the pending village event's shop (Phase 137). The
 * engine reducer owns affordability and item cloning; a no-op result
 * (can't afford, unknown ware) returns false so the screen can leave
 * the row enabled-but-inert rather than crash.
 */
function buyVillageWareAction(store: AppStore, itemId: string): boolean {
    try {
        const state = store.getState();
        const pending = state.event?.pending;
        if (!pending || pending.event.kind !== 'village') return false;
        const ware = pending.event.shop?.wares.find(w => w.itemId === itemId);
        if (!ware) return false;
        const item = resolveWareItem(ware);
        if (!item) return false;
        const player = (state as unknown as GameState).player;
        const next = engineBuyItem(player, item, ware.price);
        if (next === player) return false;
        store.setState({ player: next } as never);
        return true;
    } catch (error) {
        console.error('Failed to buy village ware:', error);
        return false;
    }
}

