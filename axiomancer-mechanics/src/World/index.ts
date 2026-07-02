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
    reachableObjectives, killObjectives,
} from './quest.engine';

export {
    moveToNode, completeCurrentNode, IllegalMoveError,
    changeMap, completeMap, unlockMap,
    completeNode, unlockNode, changeContinent, completeUniqueEvent,
    revealAdjacent, markNodeConsumed, unlockAdjacent,
    recordHazardOutcome, blockMapRoute, getHazardOutcomesForNode, isRouteBlocked,
} from './world.reducer';

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
    QuestEventPayload, NarrationPayload, ResolvedEvent, ResolveMapEventResult,
} from './MapEvents/types';

export {
    applyDialogueChoice,
} from './dialogue.runtime';
export type { ApplyDialogueChoiceResult } from './dialogue.runtime';

// Hazard Minigame (Phase 131)
export * from './Hazard';

// Quest Board minigame, Rest encounter, Loot-cache encounter (Phase 137)
export * from './QuestBoard';
export * from './Rest';
export * from './LootCache';

// Gathering Minigame (Phase 142)
export * from './Gathering';

// Minigame Harness (Phase 148) — composable cross-minigame testing
export {
    runMinigameHarness, summarizeHarnessReport,
} from './minigame-harness.resolver';
export type {
    MinigameHarnessConfig, MinigameHarnessReport, MinigameHarnessSummary,
} from './minigame-harness.types';
