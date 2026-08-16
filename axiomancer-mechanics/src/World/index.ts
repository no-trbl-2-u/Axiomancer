import { WorldState } from './types';
import { MapName } from './map.library';
import { createMapState, getMapDefinition } from './map.registry';

/** Builds the initial WorldState for a new save. */
export function createStartingWorld(): WorldState {
    const fishingVillage = getMapDefinition('coastal-continent', 'fishing-village');
    return {
        world: [],
        currentContinent: {
            name: 'coastal-continent',
            description: 'The coastal continent is a landmass bordered by the sea to the east and west. It is home to a variety of biomes, including forests, mountains, and plains.',
            availableMaps: ['fishing-village' as MapName],
            lockedMaps: ['northern-forest' as MapName],
            completedMaps: [],
        },
        currentMap: createMapState(fishingVillage),
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

export {
    moveToNode, completeCurrentNode, IllegalMoveError,
    changeMap, completeMap, unlockMap,
    completeNode, unlockNode, changeContinent, completeUniqueEvent,
    revealAdjacent, markNodeConsumed, unlockAdjacent,
    recordHazardOutcome, blockMapRoute, getHazardOutcomesForNode, isRouteBlocked,
    teleportToNode, unblockMapRoute,
    // 2026-08-08 first-map audit: traversal queries + the strand audit.
    legalMovesFrom, isStranded, isMapTerminalNode, auditMapTraversal,
} from './world.reducer';
export type { MapStrand, MapTraversalAudit } from './world.reducer';

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
    QuestEventPayload, NarrationPayload, BlacksmithPayload, ResolvedEvent, ResolveMapEventResult,
} from './MapEvents/types';
// Phase 52b — rest shelter classification (replaces the healFraction >= 1.0
// inn heuristic). Mobile gates the hazard-scar mend on `shelter === 'inn'`.
export type { RestShelter } from './MapEvents/types';
export {
    DEFAULT_REST_SHELTER, REST_PASSIVE_HEAL_FRACTION, restShelterOf, isInnShelter,
} from './MapEvents/rest-shelter';

export {
    applyDialogueChoice,
} from './dialogue.runtime';
export type { ApplyDialogueChoiceResult } from './dialogue.runtime';

// Hazard Minigame (Phase 131)
export * from './Hazard';

// Quest Board minigame, Loot-cache encounter (Phase 137)
export * from './QuestBoard';
export * from './LootCache';

// Gathering Minigame (Phase 142)
export * from './Gathering';

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
