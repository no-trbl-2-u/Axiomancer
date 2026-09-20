/**
 * Typed action layer for the engine store.
 *
 * Per Spec 04 the combat screen never dispatches engine reducers
 * directly — it calls these actions. Each one wraps a small bit of
 * engine state and writes the result back through the store.
 *
 * In-combat resource accounting is fully engine-owned by the
 * Hazard-Pattern combat driver (`CombatEncounterState.resonance`,
 * `dice`/`reserve`) — mobile keeps no parallel mana bookkeeping. The
 * legacy mobile-only `combatMana` slice (Phase 60d) was retired when
 * legacy turn-based combat was removed (mechanics 0.37.0).
 */

import {
    applyDialogueChoice,
    buyItem as engineBuyItem,
    sellItem as engineSellItem,
    defaultSellPrice as engineDefaultSellPrice,
    applyGoodwillDiscount,
    buildCharacterFromPreset,
    defaultAlignment,
    getAvailableCards,
    learnCard as engineLearnCard,
    changeMap as worldChangeMap,
    completeNode as worldCompleteNode,
    consumableLibrary,
    relicLibrary,
    createMapState,
    equipItem as engineEquipItem,
    unequipItem as engineUnequipItem,
    wornPerSlot,
    SLOT_CAPACITY,
    getDialogueNode,
    getMapDefinition,
    getNodePrimaryEventKind,
    getPresetById,
    getCardById,
    healCharacter,
    isConsumable,
    isEquipment,
    markNodeConsumed,
    resolveMapEvent,
    revealAdjacent,
    STARTING_CARD_IDS,
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
    type Card,
    type WorldState,
} from '@mechanics';


import {
    COMBAT_CARDS,
    getCombatCardById,
    cardEffectText,
} from '@/state/selectors/combat-cards';
import { resolveWareItem } from '@/state/presenters/village.engine';
import {
    applyCombatDeckPresetAction,
    chosenStarterBundle,
    randomizeCombatDeckAction,
    BUNDLE_CHOSEN_FLAG,
    type CombatDeckPresetId,
    type CombatDeckPresetResult,
} from './combat/store-actions';
import { EMPTY_EVENT_SLICE, EMPTY_LABYRINTH_SLICE, type AppStore } from './store';
import {
    abandonHazardAction,
    acknowledgeHazardOutcomeAction,
    applyHazardDeckPresetAction,
    applyHazardCardAction,
    beginHazardAction,
    chooseHazardCardKeyAction,
    claimHazardRewardsAction,
    completeHazardTutorialAction,
    continueHazardAfterResolveAction,
    discardHazardCardAction,
    finishHazardRollingAction,
    HAZARD_TUTORIAL_FLAG,
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
import type { HazardProgressKey, HazardRouteKey } from '@mechanics';
import type { LootCacheChoiceOfferId, RestChoiceOfferId } from '@mechanics';
import {
    beginRestAction,
    chooseRestChoiceOfferAction,
    claimRestChoiceOutcomeAction,
    pickRestChoiceCutAction,
    type BeginRestOptions,
    type ClaimRestChoiceResult,
} from './rest/store-actions';
import {
    beginLootCacheChoiceAction,
    chooseLootCacheChoiceOfferAction,
    claimLootCacheChoiceOutcomeAction,
    type BeginLootCacheChoiceOptions,
    type ClaimLootCacheChoiceResult,
} from './cache/store-actions';
import {
    abandonBlacksmithAction,
    beginBlacksmithAction,
    claimBlacksmithOutcomeAction,
    completeBlacksmithTutorialAction,
    continueBlacksmithCardAction,
    honeBlacksmithAction,
    leaveBlacksmithAction,
    startBlacksmithForgingAction,
    swapBlacksmithAction,
    temperBlacksmithAction,
    BLACKSMITH_TUTORIAL_FLAG,
    type BeginBlacksmithOptions,
    type ClaimBlacksmithResult,
} from './blacksmith/store-actions';
import type { CacheLootTier, DieGearColor } from '@mechanics';
import {
    applyPlayerTierPresetAction,
    type ApplyPlayerTierPresetResult,
} from './dev/player-presets';
import {
    addItemByIdAction,
    type AddItemByIdResult,
} from './dev/item-by-id';
import {
    clearLabyrinthArrivalNoteAction,
    enterLabyrinthAction,
    exitLabyrinthAction,
    labyrinthBuyHintAction,
    labyrinthInspectAction,
    labyrinthMoveAction,
    labyrinthPostArriveAction,
    labyrinthPreArriveAction,
    labyrinthRecordBossOutcomeAction,
    labyrinthSettleDebtAction,
    labyrinthSpeakNameAction,
    labyrinthSubmitGateAction,
    type LabyrinthGateOutcome,
    type LabyrinthHintOutcome,
    type LabyrinthInspectOutcome,
} from './labyrinth/store-actions';
import { getAporiaAct } from '@mechanics';
import type { LabyrinthActId, LabyrinthBossOutcome } from '@mechanics';
import { wrapActionsWithLogging } from './logging';
import { getMapLayout } from './exploration-maps';

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
    /** Count of cards appended to the player's `knownCards` list. */
    cardsLearned: number;
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
     * of the pending combat-prelude event, guarantees starter cards (the
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
     * across categories, teaches a handful of fixture cards, and
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
     * with level-relevant cards and equipment for the Kid's
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
    /**
     * Withdraw from an encounter already entered (the combat reveal's
     * WITHDRAW). Pays the non-boss retreat cost — -2 grace + its toast —
     * without requiring a pending event slice, which `beginHazardEncounter`
     * has already cleared by then. Only offered where retreat is allowed;
     * boss encounters never surface it.
     */
    fleeEncounter: () => void;
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
    /** Marks the guided first crossing done (completed or skipped). */
    completeHazardTutorial: (skipped: boolean) => void;
    /**
     * Dev tool — swap the player's combat deck for a preset: replaces
     * `knownCards` with the preset's card ids and clears earned reward
     * cards, so the next encounter deals exactly that deck.
     */
    applyCombatDeckPreset: (presetId: CombatDeckPresetId) => CombatDeckPresetResult;
    /**
     * Dev tool — rebuild the combat deck as a random pull from every
     * defined combat card (starter + reward pool). Returns the granted ids.
     */
    randomizeCombatDeck: () => string[];

    // -----------------------------------------------------------------
    // Rest-choice encounter (see state/rest/). One irreversible choice
    // of two: rest (free, flat 25% heal) / cut (paid deck removal).
    // No back-out.
    // -----------------------------------------------------------------

    /** Start a rest node. Returns false if one is underway. */
    beginRest: (options?: BeginRestOptions) => boolean;
    /** Commit one of the two offers. Locks the other. */
    chooseRestChoiceOffer: (offer: RestChoiceOfferId) => void;
    /** Pick a card to remove (`cut` sub-step). Must be one of the offered ids. */
    pickRestChoiceCut: (cardId: string) => void;
    /** Confirm the settled ledger; applies heal/spend/removal and persists. */
    claimRestOutcome: () => ClaimRestChoiceResult;

    // -----------------------------------------------------------------
    // Loot-cache-choice encounter ("The Reliquary" — see state/cache/,
    // Phase 63). One irreversible choice of three: card / item / sacrifice.
    // -----------------------------------------------------------------

    /** Start a cache from the authored payload. Returns false if one is open. */
    beginLootCacheChoice: (options?: BeginLootCacheChoiceOptions) => boolean;
    /** Commit one offer — the other two vanish. */
    chooseLootCacheChoiceOffer: (offer: LootCacheChoiceOfferId) => void;
    /** Confirm the ledger; applies the grant (or goodwill tick) and persists. */
    claimLootCacheChoiceOutcome: () => ClaimLootCacheChoiceResult;

    // -----------------------------------------------------------------
    // Blacksmith encounter ("The Anvil" — see state/blacksmith/). Phase
    // order: intro → forging ⇄ card → outcome → done. Seeds from the
    // player's rail + wallet; claim writes the rail and deducts the spend.
    // -----------------------------------------------------------------

    /** Start an anvil visit from the player's rail + wallet. False if one is open. */
    beginBlacksmith: (options?: BeginBlacksmithOptions) => boolean;
    /** The anvil acknowledged: intro → forging. */
    startBlacksmithForging: () => void;
    /** HONE a die (add a mana face): forging → card (success or loud refusal). */
    honeBlacksmith: (color: DieGearColor) => void;
    /** TEMPER a die (mana face → special face): forging → card. */
    temperBlacksmith: (color: DieGearColor) => void;
    /** SWAP an offered variant gear piece in for its die: forging → card. */
    swapBlacksmith: (variantId: string) => void;
    /** Acknowledge the open result/refusal flash: card → forging. */
    continueBlacksmithCard: () => void;
    /** Leave the anvil, sealing the ledger: forging → outcome. */
    leaveBlacksmith: () => void;
    /** Confirm the ledger; writes the rail, deducts the spend, persists. */
    claimBlacksmithOutcome: () => ClaimBlacksmithResult;
    /** Clear the anvil without applying anything (dev / escape hatch). */
    abandonBlacksmith: () => void;
    /** Mark the guided first visit done (completed or skipped) and persist. */
    completeBlacksmithTutorial: (skipped: boolean) => void;

    // -----------------------------------------------------------------
    // The Labyrinth — THE APORIA (W-01; see state/labyrinth/). Dev-menu
    // entry only. Durable progress lives on GameState.labyrinth; the
    // transient visit on the labyrinthUi slice. Arrival events resolve
    // through resolveCurrentMapEvent with labyrinth bracketing (waystone
    // before the roll, Oubliette ejection after).
    // -----------------------------------------------------------------

    /** Enter an act: snapshot the overworld, swap maps, resolve arrival. */
    enterLabyrinth: (actId: LabyrinthActId) => void;
    /** Leave: restore the overworld snapshot, clear the visit. */
    exitLabyrinth: () => void;
    /** Walk a door; resolves the arrival event (boss rooms defer). */
    labyrinthMove: (to: string) => boolean;
    /** Fire the boss room's deferred arrival (after the naming rite). */
    labyrinthBeginBossEvent: () => boolean;
    /** Inspect a POI: remark + fragment / secret door / baited clue. */
    labyrinthInspect: (poiId: string) => LabyrinthInspectOutcome | null;
    /** Lay words at the room's gate. */
    labyrinthSubmitGate: (words: readonly string[]) => LabyrinthGateOutcome | null;
    /** Ask the Sophist (tiers 1-3, priced by the engine). Null = broke. */
    labyrinthBuyHint: (tier: 1 | 2 | 3) => LabyrinthHintOutcome | null;
    /** Settle debt points at the Fourth Ledger. Returns points settled. */
    labyrinthSettleDebt: (points: number) => number;
    /** Speak a name at the finale; true → spared, act complete. */
    labyrinthSpeakName: (spoken: string) => boolean;
    /** Record the act boss outcome (descends or completes the maze). */
    labyrinthRecordBossOutcome: (outcome: LabyrinthBossOutcome) => void;
    /** Clear the one-shot waystone/ejection toast signal. */
    clearLabyrinthArrivalNote: () => void;

    /**
     * Buy a ware from the pending village event's shop (Phase 137
     * dedicated village screen). Engine `buyItem` owns the rules
     * (affordability, cloning); returns success.
     */
    buyVillageWare: (itemId: string) => boolean;

    /**
     * Sell an inventory item back to the pending village event's
     * shop (Phase 5). `index` identifies the inventory slot (mirrors
     * the CLI `shopLoop` sell path, which disambiguates the same
     * way). Price is engine `defaultSellPrice` against the shop's
     * ware list when the item matches a listed ware, else the CLI's
     * long-standing fallback of `1`. Quest items are never sellable.
     * Returns success.
     */
    sellVillageItem: (index: number) => boolean;

    // -----------------------------------------------------------------
    // Card-learning pass.
    // -----------------------------------------------------------------

    /**
     * Rolls up to `count` (default 3) level-up card offers from
     * everything the player currently qualifies for (engine
     * `getAvailableCards`, alignment-gated). Empty = nothing new to
     * learn; the caller skips the modal.
     */
    getLearnableCardOffers: (count?: number) => LearnableCardOffer[];
    /** Learns a card through the engine (requirement-checked). */
    learnCard: (cardId: string) => boolean;
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
// Card learning (level-up picks)
// ---------------------------------------------------------------------------

/**
 * Phase 104 (the grey office) — the new player's starting combat repertoire.
 * `STARTING_CARD_IDS` is the engine's 10-card grey recipe (`grey-strike` ×7,
 * `grey-ward` ×3): two colourless shapes, any die powers either, so fight one
 * teaches STRIKE, WARD, FREE-vs-PAID, and the die-spend loop with zero colour
 * arithmetic. `buildCombatDeck` deals `knownCards` verbatim (copies are real,
 * not deduplicated), so `ensureStarterCards` writes the recipe directly
 * rather than `engineLearnCard`-ing a Set — a learn-requirement gate has no
 * business touching cards the world hands every player on day one.
 */
function currentAlignment(store: AppStore): PhilosophicalAlignment {
    const state = store.getState() as unknown as GameState;
    return state.philosophicalAlignment ?? defaultAlignment();
}

/** Seeds the starter deck when the player knows nothing yet — the chosen
 *  starter bundle if one was picked (the dev deck-swap menu only, post-104 —
 *  the fresh-run flow never offers a picker), else the grey office. */
function ensureStarterCards(store: AppStore): void {
    const player = store.getState().player;
    if (!player || (player.knownCards?.length ?? 0) > 0) return;
    // Deck-identity path: a bundle was chosen pre-run (dev tool only). Direct-
    // set its curated deck (the cards are valid engine ids; learn-requirements
    // don't gate the combat deal — knownCards IS the deck source).
    const bundle = chosenStarterBundle(store);
    if (bundle) {
        store.setState({ player: { ...player, knownCards: [...bundle.cardIds], combatRewardCards: [] } });
        return;
    }
    const state = store.getState() as unknown as GameState;
    const flags = new Set(state.flags ?? []);
    flags.add(BUNDLE_CHOSEN_FLAG);
    store.setState({
        player: { ...player, knownCards: [...STARTING_CARD_IDS], combatRewardCards: [] },
        flags: [...flags],
    } as never);
}

/** One learnable-card offer row for the level-up learn modal. */
export interface LearnableCardOffer {
    id: string;
    name: string;
    description: string;
    stance: 'body' | 'mind' | 'heart' | 'any';
    tier: number;
    /** Compact effect line — same format as the combat picker rows. */
    effectText: string;
}

function toLearnableOffer(store: AppStore, card: Card): LearnableCardOffer {
    const combatCard = getCombatCardById(card.id);
    // Spec 32 v3 — THE STRIKE IS DEAD: cards deal no immediate damage, so the
    // offer row carries only the status/effect line (never a fabricated number).
    const damage = 0;
    return {
        id: card.id,
        name: card.name.toUpperCase(),
        description: card.description,
        stance: card.philosophicalAspect,
        tier: card.tier,
        effectText: combatCard
            ? cardEffectText(combatCard, damage)
            : 'NO DIRECT EFFECT',
    };
}

/**
 * Rolls the level-up card offers: up to `count` random picks from
 * everything the player currently qualifies for (engine
 * `getAvailableCards`, alignment-gated). Empty when nothing new is
 * learnable — the caller skips the modal.
 */
function getLearnableCardOffersAction(store: AppStore, count = 3): LearnableCardOffer[] {
    ensureStarterCards(store);
    const player = store.getState().player;
    if (!player) return [];
    const pool = getAvailableCards(player).slice();
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count).map((s) => toLearnableOffer(store, s));
}

/** Learns a card through the engine (requirement-checked). */
function learnCardAction(store: AppStore, cardId: string): boolean {
    const player = store.getState().player;
    if (!player) return false;
    const next = engineLearnCard(player, cardId);
    if (next === player) return false;
    store.setState({ player: next });
    return true;
}

// ---------------------------------------------------------------------------
// Testing knob — live-encounter enemy HP scale
// ---------------------------------------------------------------------------

/**
 * Testing multiplier applied to every LIVE-encounter foe's HP so fights last
 * longer and there's more time to exercise a deck's status-effect play. Applied
 * only at the mobile `beginHazardEncounter` chokepoint (below), NOT in the
 * engine's `createEnemy` — the hermetic engine tests assert exact authored
 * `maxHealth` values (e.g. Grave Larva 25, Disatree 15) and must stay untouched.
 * Set to 1 to restore stock HP.
 */
export const ENCOUNTER_ENEMY_HP_MULTIPLIER = 2;

/**
 * Returns a copy of `enemy` with `health` and `maxHealth` scaled by `mult`
 * (rounded, floored at 1). Both scale together so HP-ratio mechanics
 * (befriend `hpGate`, execute thresholds) keep their proportions. A `mult` of 1
 * returns an equivalent (un-scaled) enemy.
 */
export function withScaledEnemyHp(enemy: Enemy, mult: number): Enemy {
    if (mult === 1) return enemy;
    const maxHealth = Math.max(1, Math.round(enemy.maxHealth * mult));
    const health = Math.max(1, Math.round(enemy.health * mult));
    return { ...enemy, health, maxHealth };
}

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export function createAppActions(store: AppStore): AppActions {
    // AXM Log: every action funnels through this object, so wrapping the
    // literal ONCE instruments the whole dispatch surface (name, duration,
    // error capture-and-rethrow) while preserving the provider-stable
    // AppActions reference contract.
    const actions: AppActions = {
        startCombat: (enemy) => {
            // Starter cards must exist BEFORE the engine snapshots the
            // player — the picker and the engine both read the
            // snapshot's knownCards. The engine's `startCombat` records
            // the encounter (`currentEncounter`) and fires `combat:started`.
            ensureStarterCards(store);
            store.getState().startCombat(enemy);
        },
        beginHazardEncounter: () => {
            // Live map encounters now run the new hazard-pattern combat
            // (Spec 26b), not the legacy stance engine. Pull the foe out of
            // the pending combat-prelude event, guarantee a real deck via
            // starter cards, clear the event slice, and hand the enemy back
            // for the in-place panel to bootstrap. The fight itself is still
            // driven entirely by the panel's local React state — but we DO
            // stage `state.currentEncounter` via `startCombat` (Phase 54) so
            // the exit-time `endCombat` call has a real encounter to resolve
            // rewards, flags, codex unlocks, and faction/alignment deltas
            // against instead of silently no-op'ing.
            const slice = store.getState().event;
            const pending = slice?.pending ?? null;
            if (!pending || pending.event.kind !== 'encounter') return null;
            const enemy = pending.event.encounter.enemies[0] ?? null;
            if (!enemy) return null;
            ensureStarterCards(store);
            clearEventSlice(store);
            // Testing: fatten every live foe so encounters run longer (more
            // turns to exercise status-effect play). See ENCOUNTER_ENEMY_HP_MULTIPLIER.
            const scaledEnemy = withScaledEnemyHp(enemy, ENCOUNTER_ENEMY_HP_MULTIPLIER);
            store.getState().startCombat(scaledEnemy);
            return scaledEnemy;
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
            // A run reset regenerates the overworld (seating the player at
            // the starting node), so any in-flight Labyrinth visit is over.
            // Clear the mobile session slice — otherwise the still-mounted
            // Labyrinth presenter looks the fresh overworld node up in the
            // act and throws LabyrinthContentError (the "battle loss → THE
            // BINDING TORE" crash). This is the single choke point for
            // every reset (combat defeat + hazard out-of-combat death).
            if (store.getState().labyrinthUi?.session) {
                store.setState({ labyrinthUi: EMPTY_LABYRINTH_SLICE });
            }
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
        fleeEncounter: () => fleeEncounterAction(store),
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
        completeHazardTutorial: (skipped) => completeHazardTutorialAction(store, skipped),
        applyCombatDeckPreset: (presetId) => applyCombatDeckPresetAction(store, presetId),
        randomizeCombatDeck: () => randomizeCombatDeckAction(store),
        // ── The Labyrinth (THE APORIA) ──
        enterLabyrinth: (actId) => {
            enterLabyrinthAction(store, actId);
            labyrinthPreArriveAction(store);
            resolveCurrentMapEventAction(store, 'labyrinth');
            labyrinthPostArriveAction(store);
        },
        exitLabyrinth: () => exitLabyrinthAction(store),
        labyrinthMove: (to) => {
            const session = store.getState().labyrinthUi?.session ?? null;
            if (!session) return false;
            if (!labyrinthMoveAction(store, to)) return false;
            // The boss room's arrival is deferred: the finale panel (naming
            // rite, Borrowed Premise reckoning) must precede the fight —
            // `labyrinthBeginBossEvent` fires it (CLI `bossRoomSequence`
            // parity).
            const act = getAporiaAct(session.actId);
            if (store.getState().world.currentMap.currentNode === act.bossRoom) {
                return true;
            }
            labyrinthPreArriveAction(store);
            resolveCurrentMapEventAction(store, 'labyrinth');
            labyrinthPostArriveAction(store);
            return true;
        },
        labyrinthBeginBossEvent: () => resolveCurrentMapEventAction(store, 'labyrinth'),
        labyrinthInspect: (poiId) => labyrinthInspectAction(store, poiId),
        labyrinthSubmitGate: (words) => labyrinthSubmitGateAction(store, words),
        labyrinthBuyHint: (tier) => labyrinthBuyHintAction(store, tier),
        labyrinthSettleDebt: (points) => labyrinthSettleDebtAction(store, points),
        labyrinthSpeakName: (spoken) => labyrinthSpeakNameAction(store, spoken),
        labyrinthRecordBossOutcome: (outcome) => labyrinthRecordBossOutcomeAction(store, outcome),
        clearLabyrinthArrivalNote: () => clearLabyrinthArrivalNoteAction(store),

        beginRest: (options) => beginRestAction(store, options),
        chooseRestChoiceOffer: (offer) => chooseRestChoiceOfferAction(store, offer),
        pickRestChoiceCut: (cardId) => pickRestChoiceCutAction(store, cardId),
        claimRestOutcome: () => claimRestChoiceOutcomeAction(store),
        beginLootCacheChoice: (options) => beginLootCacheChoiceAction(store, options),
        chooseLootCacheChoiceOffer: (offer) => chooseLootCacheChoiceOfferAction(store, offer),
        claimLootCacheChoiceOutcome: () => claimLootCacheChoiceOutcomeAction(store),
        beginBlacksmith: (options) => beginBlacksmithAction(store, options),
        startBlacksmithForging: () => startBlacksmithForgingAction(store),
        honeBlacksmith: (color) => honeBlacksmithAction(store, color),
        temperBlacksmith: (color) => temperBlacksmithAction(store, color),
        swapBlacksmith: (variantId) => swapBlacksmithAction(store, variantId),
        continueBlacksmithCard: () => continueBlacksmithCardAction(store),
        leaveBlacksmith: () => leaveBlacksmithAction(store),
        claimBlacksmithOutcome: () => claimBlacksmithOutcomeAction(store),
        abandonBlacksmith: () => abandonBlacksmithAction(store),
        completeBlacksmithTutorial: (skipped) => completeBlacksmithTutorialAction(store, skipped),
        buyVillageWare: (itemId) => buyVillageWareAction(store, itemId),
        sellVillageItem: (index) => sellVillageItemAction(store, index),
        getLearnableCardOffers: (count) => getLearnableCardOffersAction(store, count),
        learnCard: (cardId) => learnCardAction(store, cardId),
    };
    return wrapActionsWithLogging(actions);
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

/** Surface a one-shot toast, preserving the existing level-up ack flag. */
function pushToast(store: AppStore, text: string): void {
    const prev = store.getState().notifications;
    store.setState({
        notifications: {
            levelUpAcknowledged: prev?.levelUpAcknowledged ?? true,
            questAcknowledged: prev?.questAcknowledged ?? true,
            toast: { text, id: (prev?.toast?.id ?? 0) + 1 },
        },
    });
}

function equipItemAction(store: AppStore, itemId: string): void {
    const state = store.getState();
    const inventory: readonly Item[] = state.player.inventory;
    const target = inventory.find((i: Item) => i.id === itemId);
    if (!target || !isEquipment(target)) return;

    const equip = target as Equipment;
    const targetSlot = equip.slot;

    // Accessory-full guard (Phase 18): with all 3 accessory positions worn and
    // the target not already among them, refuse rather than silently displace.
    let updatedPlayer = state.player;
    if (targetSlot === 'accessory') {
        const wornAcc = wornPerSlot(inventory).get('accessory') ?? [];
        const alreadyWorn = wornAcc.some((a) => a.id === equip.id);
        if (!alreadyWorn) {
            if (wornAcc.length >= SLOT_CAPACITY.accessory) {
                pushToast(store, 'Accessory slots full — remove one first.');
                return;
            }
            // EQUIPMENT STATS FIX: engine equipItem folds stat bonuses / passives.
            updatedPlayer = engineEquipItem(state.player, equip);
        }
        // alreadyWorn → reorder only (avoid a duplicate loadout entry).
    } else {
        // weapon / armor replace in place.
        updatedPlayer = engineEquipItem(state.player, equip);
    }

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
    // Mobile "worn" convention: the first `SLOT_CAPACITY[slot]` equipment items
    // per slot are worn (Phase 18 — capacity-aware `wornPerSlot`). To "unequip"
    // the target under that convention, move it to the END of its slot peers so
    // a benched peer scrolls into the worn window. When a slot has no more items
    // than its capacity the move can't reduce the worn set, so it's a no-op —
    // the inventory convention can't express "wearing fewer than are carried".
    const state = store.getState();
    const inventory: readonly Item[] = state.player.inventory;
    const target = inventory.find((i: Item) => i.id === itemId);
    if (!target || !isEquipment(target)) return;
    const targetSlot = (target as Equipment).slot;

    const slotPeerCount = inventory.filter(
        (it: Item) => isEquipment(it) && (it as Equipment).slot === targetSlot,
    ).length;
    if (slotPeerCount <= SLOT_CAPACITY[targetSlot]) return;

    // EQUIPMENT STATS FIX: engine unequipItem strips the piece's stat bonuses.
    // For an accessory, pass the loadout index so the right position is freed.
    const accessoryIndex =
        targetSlot === 'accessory'
            ? state.player.equipment.accessories.findIndex((a) => a.id === target.id)
            : undefined;
    let updatedPlayer = engineUnequipItem(state.player, targetSlot, accessoryIndex);

    // Rebuild inventory:
    //   1. All non-target, non-slot items in their original order.
    //   2. All slot peers (except target) in their original order
    //      — the formerly-benched peer scrolls into the worn window.
    //   3. Target appended at the end of its slot peers (definitively NOT worn).
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

    // Reconcile the engine loadout with the new worn window: an accessory that
    // scrolled into the worn set but isn't in the loadout gets equipped so its
    // stats fold in (keeps the loadout and the inventory-worn view consistent).
    if (targetSlot === 'accessory') {
        const loadoutAccIds = new Set(updatedPlayer.equipment.accessories.map((a) => a.id));
        for (const acc of wornPerSlot(next).get('accessory') ?? []) {
            if (!loadoutAccIds.has(acc.id)) {
                updatedPlayer = engineEquipItem(updatedPlayer, acc);
            }
        }
    }

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

/**
 * Stand the player on `nodeId` as an ARRIVAL: the cursor moves and the node's
 * unanswered arrival is recorded (`pendingArrival`), exactly as the engine's
 * own arrival verb `moveToNode` does. Mobile keeps its own move (the screen's
 * reachability rules differ from the reducer's), so it must write the same
 * sentence the engine writes — otherwise the move's checkpoint would save a
 * player standing on a node with no record of what they still owe it
 * (burn-day audit 2026-09-19 row 3.1 follow-up).
 */
function writeArrivalNodeId(map: MapState, nodeId: string): MapState {
    return { ...map, currentNode: nodeId, pendingArrival: nodeId };
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
    // boss nodes (both resolve to the `encounter` kind) are not completed or
    // consumed BY THE MOVE, so the node stays walkable and the screen keeps
    // drawing the player on it; every other kind completes here.
    //
    // That is a statement about this function alone, not about the node's
    // life (burn-day audit 2026-09-19 row 3.1). Resolving the arrival marks
    // the node consumed whatever its kind (`resolve-map-event.ts`), so a
    // fight that has been answered is NOT re-offered on a second visit —
    // measured: a second arrival at fv-13 fires nothing.
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
        currentMap: writeArrivalNodeId(nextWorld.currentMap, nodeId),
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

    // PLAYTEST_BUGS_2026-09-18 BUG-03: moving between nodes was NOT a
    // checkpoint. Saves are explicit on mobile (Spec 09) and the checkpoint
    // list was combat outcome, rest, cache, hazard, blacksmith, labyrinth and
    // MAP CROSSING only — so a player who walked two nodes and reloaded was
    // put back where they started, with the walk (and anything picked up by
    // walking) gone. Node movement mutates `currentNode`, `completedNodes`,
    // `availableNodes` and `discoveredNodes`: that is real, hard-won progress,
    // and the same argument the crossing checkpoint already makes applies to
    // it. The adapter debounces writes, so this is cheap even tapped quickly.
    //
    // THE ARRIVAL IS NOT IN THIS SNAPSHOT, AND THAT IS DELIBERATE (burn-day
    // audit 2026-09-19 row 3.1). The caller resolves the node's event AFTER
    // this returns (`app/(tabs)/exploration/index.tsx` → `onConfirmMove`), so
    // the checkpoint records a player standing on a node whose event they
    // have not answered — on an encounter node, a fight they have not had.
    // What makes that honest is that the debt is recorded too, and recorded
    // as itself: the move above wrote `pendingArrival: nodeId` onto the map
    // (`writeArrivalNodeId`), it rides this very save, and the map screen
    // re-offers it on the next mount (`vm.arrivalPending`). Saving here
    // rather than after the resolve is therefore load-bearing, not a
    // leftover — `resolveMapEvent` clears `pendingArrival` the moment the
    // arrival is answered, so a save taken below it would persist "nothing
    // owed" and the reload would walk past the fight.
    //
    // The debt is a record of ARRIVING, not a guess from the shape of the
    // map. Reading it off "the node under the player is unconsumed" instead
    // (the first cut of row 3.1) could not tell a walk from a placement, and
    // `placeOnNode` un-consumes the node it places you on — so every state
    // fixture and every `/dev` JUMP looked like an arrival nobody had
    // answered and fired its event on mount.
    try { store.getState().save(); } catch { /* persistence must not block the road */ }

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
    let cardsLearned = 0;
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

        // 2. One relic per slot kind (weapon / armor / accessory). Phase 21 —
        //    the only equipment is the 8 signet relics; grant the first of each
        //    slot kind so the inventory dock + equip-replace preview have a
        //    piece to render for every slot.
        const seedSlots: ReadonlyArray<EquipmentSlot> = ['weapon', 'armor', 'accessory'];
        for (const slot of seedSlots) {
            try {
                const relic = relicLibrary.find(r => r.slot === slot);
                if (relic) {
                    addItem({ ...relic });
                    itemsAdded++;
                }
            } catch (error) {
                console.warn(`Failed to add relic for slot ${slot}:`, error);
            }
        }

        // 3. Two cards from the engine's library. Phase 16 swapped the
        //    data source from the local mock to `state/selectors/combat-cards`; engine
        //    0.10.2 now re-exports `cardLibrary` at the top level.
        //    Push directly onto `player.knownCards` rather than via
        //    `engine.learnCard` — `learnCard` enforces level-/stat-
        //    gating which the dev seed should bypass. The ids it adds
        //    are exactly what the picker renders from `COMBAT_CARDS`.
        try {
            const fixtureCardIds: ReadonlyArray<string> = COMBAT_CARDS
                .slice(0, 4)
                .map((s) => s.id);
            if (fixtureCardIds.length > 0) {
                const afterAdd = store.getState();
                const player = afterAdd.player;
                const known = new Set<string>(player.knownCards ?? []);
                for (const id of fixtureCardIds) {
                    if (!known.has(id)) {
                        known.add(id);
                        cardsLearned++;
                    }
                }
                const nextPlayer: Character = {
                    ...player,
                    knownCards: Array.from(known),
                };
                store.setState({ player: nextPlayer });
            }
        } catch (error) {
            console.warn('Failed to add cards:', error);
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

    return { itemsAdded, cardsLearned, mapReset };
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
    const unique = 0; // Phase 21 — uniques retired; kept in the breakdown as 0.
    let consumable = 0;

    try {
        const state = store.getState();
        const addItem = state.addItem;

        // Phase 21 — the procedural equipment library is retired; "every item"
        // equipment is now the 8 signet relics. Uniques no longer exist.
        for (const relic of relicLibrary) {
            try {
                addItem({ ...relic });
                equipment++;
            } catch (error) {
                console.warn(`Failed to add relic ${relic.name}:`, error);
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
        // 'travel' must never consume: post-travel, `currentMap` is the
        // DESTINATION, so consuming here would mark the arrival map's
        // start node — mirroring the engine dispatcher's own travel
        // short-circuit. Doors stay repeatable.
        const shouldConsumeNode = result.event.kind !== 'none' &&
            !['encounter', 'travel'].includes(result.event.kind);
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
            // The first-ever crossing runs as the guided tutorial (pinned
            // seed + hazard, coach overlay); the persistent flag set on
            // completion/skip keeps every later crossing organic.
            const tutorialDone = (gameState.flags ?? []).includes(HAZARD_TUTORIAL_FLAG);
            beginHazardAction(store, tutorialDone ? {} : { tutorial: true });
            return true;
        }

        // Gathering events grant their items inline (Phase 76 retired "The
        // Gleaning" minigame). The engine's resolveMapEvent already
        // appended the payload items to the inventory in `resolvedState` —
        // unlike hazard/rest above, that grant stands as-is; there is no
        // minigame spoils step to defer to. No screen detour: clear the
        // event slice and surface a toast naming what was gathered.
        if (result.event.kind === 'gathering') {
            store.setState({
                ...resolvedState,
                event: EMPTY_EVENT_SLICE,
            });
            const itemNames = result.event.items.map(i => i.name).join(', ');
            if (itemNames) {
                pushToast(store, `Gathered ${itemNames}.`);
            }
            return true;
        }

        // Rest events launch the rest-choice node (Phase 52d) instead of
        // the legacy silent heal. The engine's resolveMapEvent already
        // applied the passive heal to `result.state`; restore the
        // pre-event player so the node's settled ledger is the only thing
        // that touches VITAE/currency. `<RestGate>` routes to /rest when
        // the slice fills.
        if (result.event.kind === 'rest') {
            store.setState({
                ...resolvedState,
                player: gameState.player,
                event: EMPTY_EVENT_SLICE,
            });
            beginRestAction(store, {
                // Phase 52b — the authored inn/camp marker, not a heal number.
                shelter: result.event.shelter,
                // Phase 59 — the authored one-liner, same passthrough
                // pattern as the other kinds (event.engine.ts::bodyFromPayload).
                description: result.event.description,
            });
            return true;
        }

        // Loot-cache events launch the three-offer choice screen (Phase
        // 63, replacing the retired Pick Pool minigame) instead of the
        // legacy passive grant. The engine already appended the payload
        // items + currency to `result.state`; restore the pre-event
        // player so the cache's claim is the only thing that touches the
        // inventory. `<CacheGate>` routes to /cache when the slice fills.
        //
        // Reward depth: the `item` offer rolls a real engine-truth
        // loot/relic table scaled to the player's level (Phase 129).
        // Deeper locales (northern-forest) roll the `rich` tier (more
        // items + a unique-relic chance); the coastal opener rolls
        // `modest`. Currency from the event payload is preserved for the
        // `item` offer.
        if (result.event.kind === 'loot-cache') {
            store.setState({
                ...resolvedState,
                player: gameState.player,
                event: EMPTY_EVENT_SLICE,
            });
            const mapName = resolvedState.world?.currentMap?.name;
            const tier: CacheLootTier = mapName === 'northern-forest' ? 'rich' : 'modest';
            beginLootCacheChoiceAction(store, {
                tier,
                currency: result.event.currency,
                description: result.event.description,
            });
            return true;
        }

        // Blacksmith events launch "The Anvil" (Spec 33 §6 die-gear
        // upgrades) instead of dropping a paced /event card. The engine
        // handler touches no state (it only validates the offered variant
        // gear), so there is nothing to restore — but we still clear the
        // event slice and seed the session from the player's live rail +
        // wallet. `<BlacksmithGate>` routes to /blacksmith when the slice
        // fills. The authored payload `budget` is a PLACEHOLDER hint; the
        // slice maps the spendable unit to the player's real currency, so
        // it is intentionally not forwarded here.
        if (result.event.kind === 'blacksmith') {
            store.setState({
                ...resolvedState,
                event: EMPTY_EVENT_SLICE,
            });
            // The first-ever visit runs as the guided tutorial; the
            // persistent flag set on completion/skip keeps every later
            // visit organic.
            const tutorialDone = (gameState.flags ?? []).includes(BLACKSMITH_TUTORIAL_FLAG);
            beginBlacksmithAction(store, {
                variants: result.event.variants,
                tutorial: !tutorialDone,
            });
            return true;
        }

        // Travel events are already fully applied engine-side: the world
        // on `result.state` has crossed maps (and continents when the door
        // spans one). No screen detour and no pending card — clear the
        // event slice so the exploration canvas re-renders the arrival
        // map, and narrate the crossing as a toast.
        if (result.event.kind === 'travel') {
            store.setState({
                ...resolvedState,
                event: EMPTY_EVENT_SLICE,
            });
            const region = getMapLayout(result.event.destinationMap)?.region
                ?? result.event.destinationMap;
            pushToast(store, `You cross into ${region}.`);
            // Crossing a map is a checkpoint, same as a combat or rest
            // outcome — saves are explicit on mobile (Spec 09), and a
            // crossing lost to an app close would strand the run on the
            // wrong map.
            try { store.getState().save(); } catch { /* persistence must not block the road */ }
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

/**
 * The price of walking away from a non-boss encounter.
 *
 * [4.5] DRIFT fix (mechanics-vs-UI audit row 10): the retreat chrome reads
 * `forfeit the path · -ii grace`, so honour it — shift the engine
 * `moralMeter` by -2 and surface the cost. Boss encounters are sealed (the
 * retreat is never offered), so this is only ever called for a foe you were
 * allowed to leave.
 *
 * Phase 92 — flee narrative feedback: prose-style narrative in the lowercase
 * ritual register, carrying the grace cost (deep-playtest F03).
 */
function applyFleeCost(store: AppStore): void {
    store.getState().shiftMoralMeter(-2);
    const prev = store.getState().notifications;
    store.setState({
        notifications: {
            levelUpAcknowledged: prev?.levelUpAcknowledged ?? true,
            questAcknowledged: prev?.questAcknowledged ?? true,
            toast: {
                text: 'you fled the encounter. the path bends away.\n\ngrace -2',
                id: (prev?.toast?.id ?? 0) + 1,
            },
        },
    });
}

/**
 * Withdraw from an encounter the player has already stepped into — the
 * combat reveal's WITHDRAW, which replaced the old prelude modal's FLEE
 * (2026-08-10 user report: two consecutive popups asked to agree to the same
 * fight). By then `beginHazardEncounter` has already cleared the event slice,
 * so unlike `pickEventChoice('flee')` this pays the cost without needing a
 * pending event; the slice is cleared defensively for any path that still has
 * one. The modal teardown is the caller's (the overlay's) concern.
 */
function fleeEncounterAction(store: AppStore): void {
    try {
        applyFleeCost(store);
    } catch (error) {
        console.error('Failed to process flee action:', error);
    }
    clearEventSlice(store);
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
                    ensureStarterCards(store);
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
                    if (!processed.isBoss) applyFleeCost(store);
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
        const goodwillCount = state.mapGoodwill?.[state.world?.currentMap?.name ?? ''] ?? 0;
        const price = applyGoodwillDiscount(ware.price, goodwillCount);
        const next = engineBuyItem(player, item, price);
        if (next === player) return false;
        store.setState({ player: next } as never);
        return true;
    } catch (error) {
        console.error('Failed to buy village ware:', error);
        return false;
    }
}

/**
 * Sells an inventory item back to the pending village event's shop
 * (Phase 5). Quest items are never sellable — mirrors the `dropItem`
 * defend-in-depth guard (`canDiscard` on the inventory VM keeps the
 * screen from ever offering the action, but the action layer checks
 * again for direct dispatch). Price matches the CLI's `shopLoop` sell
 * path: `defaultSellPrice` against the shop's ware list when the item
 * matches a listed ware, else a flat fallback of `1`.
 */
function sellVillageItemAction(store: AppStore, index: number): boolean {
    try {
        const state = store.getState();
        const pending = state.event?.pending;
        if (!pending || pending.event.kind !== 'village') return false;
        const player = (state as unknown as GameState).player;
        const item = player.inventory[index];
        if (!item) return false;
        if (item.category === 'quest-item') return false;
        const wares = pending.event.shop?.wares ?? [];
        const matching = wares.find(w => w.itemId === item.id);
        const price = matching ? engineDefaultSellPrice(matching) : 1;
        const next = engineSellItem(player, item.id, price);
        if (next === player) return false;
        store.setState({ player: next } as never);
        return true;
    } catch (error) {
        console.error('Failed to sell village item:', error);
        return false;
    }
}

