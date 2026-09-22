import { WorldState, Continent } from './types';
import { createMapState, getMapDefinition } from './map.registry';

/**
 * Builds the initial WorldState for a new save.
 *
 * The `world` catalogue is REAL as of 2026-08-28 (inter-map travel): it
 * carries the two campaign continents, and `changeContinent` / `unlockMap`
 * keep it in sync with `currentContinent`. The labyrinth-continent (THE
 * APORIA, W-01) stays deliberately uncatalogued — dev-menu + CLI access
 * only until the last continent exists.
 */
export function createStartingWorld(): WorldState {
    const fishingVillage = getMapDefinition('coastal-continent', 'fishing-village');
    const coastal: Continent = {
        name: 'coastal-continent',
        description: 'The coastal continent is a landmass bordered by the sea to the east and west. It is home to a variety of biomes, including forests, mountains, and plains.',
        availableMaps: ['fishing-village'],
        lockedMaps: ['northern-forest'],
        completedMaps: [],
    };
    const northern: Continent = {
        name: 'northern-continent',
        description: 'The northern continent begins underground. Iron caverns climb toward the first city; a river runs on from there. Nobody arrives by daylight.',
        availableMaps: [],
        // Phase W3 — 'northern-city' joins the ledger of locked maps.
        // Phase W4 — 'connecting-river' and 'town-across-river' join it too.
        // Phase W5 — 'the-capital' joins it too.
        // Note for old saves: a v21 save seeded before W3/W4/W5 lists fewer
        // entries here, and that is FINE — `unlockMap` (the travel handler's
        // step 3) moves any registered destination into `availableMaps`
        // whether or not the catalogue ever listed it as locked, so no
        // migration hop is needed for the door to work (pinned in
        // travel-kind e2e).
        lockedMaps: ['caverns', 'northern-city', 'connecting-river', 'town-across-river', 'the-capital'],
        completedMaps: [],
    };
    return {
        world: [coastal, northern],
        currentContinent: coastal,
        currentMap: createMapState(fishingVillage),
        mapStates: {},
    };
}

export type { SeedInput } from './seed';
export { seedInputToUint32, minigameRunSeed, branchMinigameSeed } from './seed';

export {
    MAP_REGISTRY, getMapDefinition, createMapState, MapNotFoundError,
} from './map.registry';

export type {
    WorldState, Continent, Quest, UniqueEvent,
    Reward, MapNode, NodeId, Encounter,
    MapDefinition, MapState, QuestObjective, QuestObjectiveType, QuestStatus, QuestLog,
    HazardModifierEntry, HazardNodeOutcome, BlockedRoute,
} from './types';
export type { RouteValidationResult } from './map.dispatcher';
export type { MapName, ContinentName } from './map.library';
export type { QuestName } from './quest.library';

export {
    generateEncounter, scaleEnemyToLevel, scaledEncounterLevel,
    DIFFICULTY_LEVEL_BANDS,
} from './encounter';
export type { GenerateEncounterOptions } from './encounter';

export {
    emptyQuestLog, isQuestComplete, findActiveQuest, findQuest,
    startQuest, progressQuest, completeQuest, discoverQuest,
    reachableObjectives, killObjectives, collectObjectives, advanceKillObjectives,
} from './quest.engine';

// The `Reward` union resolver. `quest.engine.ts` owns log/objective machinery
// and pays nothing; this is the payout half, including the `{ kind: 'item' }`
// and bare-`Item` reward shapes the store's END_COMBAT branch never handled.
export {
    payQuestReward, payQuestRewards, isItemReward, isKindedReward, itemOf,
} from './quest-reward';
export type { QuestRewardPayout } from './quest-reward';

export {
    moveToNode, completeCurrentNode, IllegalMoveError,
    changeMap, completeMap, unlockMap,
    completeNode, unlockNode, changeContinent, completeUniqueEvent,
    revealAdjacent, markNodeConsumed, unlockAdjacent,
    recordHazardOutcome, blockMapRoute, getHazardOutcomesForNode, isRouteBlocked,
    teleportToNode, placeOnNode, unblockMapRoute,
    // 2026-08-08 first-map audit: traversal queries + the strand audit.
    legalMovesFrom, isStranded, isMapTerminalNode, auditMapTraversal,
    // D1 (2026-09-21) — frontier roaming: the derived spent/frontier sets
    // every surface classifies nodes from, plus the forward skeleton the
    // progression audits walk.
    visitedNodes, isNodeSpent, frontierNodes, isFrontierExhausted, forwardEdges,
    // Phase 53c — the route-coverage walk, beside the strand audit.
    auditRouteCoverage,
} from './world.reducer';
export type { MapStrand, MapTraversalAudit, MapRouteCoverage } from './world.reducer';

// Phase 53a — narrative reachability guard.
export { auditNarrativeReachability } from './narrative-reachability';
export type { NarrativeReachabilityAudit } from './narrative-reachability';

export {
    validateMoveToNode, findAlternativePaths, getBlockedRoutesFromNode, getReachableNodes,
} from './map.dispatcher';

// Spec 23 — MapEvents engine.
// Importing `./MapEvents/content` for its side effect registers the
// Phase 24 pools (fishing-village + northern-forest) on module load.
import './MapEvents/content';

export {
    resolveMapEvent,
    registerMapEventPool,
    setDefaultMapEventPool,
    setNodeEventPoolOverride,
    getNodeEventPool,
    getNodeEventKinds,
    getNodePrimaryEventKind,
    getShadowedNodeOverrideKeys,
} from './MapEvents/resolve-map-event';
export type {
    MapEventKind, MapEventPayload, MapEventPool, MapEventPoolEntry,
    EncounterPayload, InteractionPayload, GatheringPayload, RestPayload,
    VillagePayload, CutscenePayload, HazardPayload, LootCachePayload,
    NarrationPayload, BlacksmithPayload, TravelPayload, ResolvedEvent, ResolveMapEventResult,
} from './MapEvents/types';
// Phase 52b — rest shelter classification (replaces the healFraction >= 1.0
// inn heuristic). Mobile gates the hazard-scar mend on `shelter === 'inn'`.
export type { RestShelter } from './MapEvents/types';
export {
    DEFAULT_REST_SHELTER, REST_PASSIVE_HEAL_FRACTION, restShelterOf, isInnShelter,
} from './MapEvents/rest-shelter';

// Phase 65 — village goodwill reward tiers (discount / Ally grant / bonus).
export {
    GOODWILL_DISCOUNT_THRESHOLD, GOODWILL_DISCOUNT_RATE,
    GOODWILL_ALLY_THRESHOLD, GOODWILL_ALLY_CARD_ID,
    GOODWILL_BONUS_THRESHOLD, GOODWILL_BONUS_CURRENCY, GOODWILL_BONUS_FLAG_PREFIX,
    applyGoodwillDiscount, goodwillBonusFlag,
} from './village-goodwill';

export {
    applyDialogueChoice,
} from './dialogue.runtime';
export type { ApplyDialogueChoiceResult } from './dialogue.runtime';

// Hazard Minigame (Phase 131)
export * from './Hazard';

// The Labyrinth — THE APORIA (W-01). The pools module self-registers the
// three acts' MapEvent pools on import, mirroring the content import above.
import './Labyrinth/labyrinth.pools';

export {
    createLabyrinthProgress, visibleDoors, canTraverse, inspectPoi,
    submitGateAnswer, preConfirmedWords, buyHint, hintPrice, nextHopToward,
    debtPoints, borrowedPremiseStacks, settleDebt, activateWaystone,
    lastWaystone, namingForkOpen, recordBossOutcome, getRoom, edgeKey,
    recordWalk, walkedEdgesOf, isSophistTrueName,
    LabyrinthContentError,
    HINT_TIER_POINTS, ASSERTION_POINTS,
    BORROWED_PREMISE_THRESHOLDS, BORROWED_PREMISE_CAP,
    SETTLE_PRICE_PER_POINT,
} from './Labyrinth/labyrinth.engine';
export { resolvePoiTrap } from './Labyrinth/labyrinth.pools';
export {
    APORIA_ACTS, getAporiaAct, getAporiaActByMap,
    buildLabyrinthMapDefinition,
    aporiaColonnade, aporiaArchive, aporiaProof,
} from './Labyrinth/maps';
export type {
    LabyrinthActDef, LabyrinthActId, LabyrinthRoomDef, LabyrinthPoiDef,
    LabyrinthDoorDef, LabyrinthGateDef, LabyrinthRealm, LabyrinthFragment,
    LabyrinthProgress, LabyrinthHintPurchase, LabyrinthBossOutcome,
    LabyrinthVisibleDoor, LabyrinthInspectResult, LabyrinthGateResult,
} from './Labyrinth/types';

// Minigame Harness (Phase 148) — composable cross-minigame testing
export {
    runMinigameHarness, summarizeHarnessReport,
} from './minigame-harness.resolver';
export type {
    MinigameHarnessConfig, MinigameHarnessReport, MinigameHarnessSummary,
} from './minigame-harness.types';
