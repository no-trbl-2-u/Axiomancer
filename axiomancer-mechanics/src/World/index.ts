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

export {
    MAP_REGISTRY, getMapDefinition, createMapState,
} from './map.registry';

export type {
    WorldState, Quest,
    Encounter,
    MapState, QuestObjective, QuestLog,
} from './types';
export type { MapName, ContinentName } from './map.library';
export type { QuestName } from './quest.library';

export {
    emptyQuestLog, isQuestComplete, findActiveQuest,
    startQuest, progressQuest, completeQuest,
} from './quest.engine';

export {
    moveToNode, completeCurrentNode, IllegalMoveError,
    changeMap, completeMap, unlockMap,
    completeNode, unlockNode, changeContinent,
    revealAdjacent, markNodeConsumed,
    teleportToNode, placeOnNode, unblockMapRoute,
    // 2026-08-08 first-map audit: traversal queries + the strand audit.
    legalMovesFrom,
    // D1 (2026-09-21) — frontier roaming: the derived spent/frontier sets
    // every surface classifies nodes from, plus the forward skeleton the
    // progression audits walk.
    forwardEdges,
} from './world.reducer';

// Spec 23 — MapEvents engine.
// Importing `./MapEvents/content` for its side effect registers every
// authored map's pools (coastal + northern continents) on module load.
import './MapEvents/content';

export {
    resolveMapEvent,
    getNodeEventPool,
    getNodePrimaryEventKind,
} from './MapEvents/resolve-map-event';
export type {
    MapEventKind,
    ResolvedEvent, ResolveMapEventResult,
} from './MapEvents/types';
// Phase 52b — rest shelter classification (replaces the healFraction >= 1.0
// inn heuristic). Mobile gates the hazard-scar mend on `shelter === 'inn'`.
export type { RestShelter } from './MapEvents/types';
export {
    DEFAULT_REST_SHELTER, isInnShelter,
} from './MapEvents/rest-shelter';

// Phase 65 — village goodwill reward tiers (discount / Ally grant / bonus).
export {
    GOODWILL_ALLY_THRESHOLD, GOODWILL_ALLY_CARD_ID,
    GOODWILL_BONUS_THRESHOLD, GOODWILL_BONUS_CURRENCY,
    applyGoodwillDiscount, goodwillBonusFlag,
} from './village-goodwill';

export {
    applyDialogueChoice,
} from './dialogue.runtime';

// Hazard Minigame (Phase 131)
export * from './Hazard';

// The Labyrinth — THE APORIA (W-01). The pools module self-registers the
// three acts' MapEvent pools on import, mirroring the content import above.
import './Labyrinth/labyrinth.pools';

export {
    createLabyrinthProgress, visibleDoors, inspectPoi,
    submitGateAnswer, preConfirmedWords, buyHint, hintPrice,
    debtPoints, borrowedPremiseStacks, settleDebt, activateWaystone,
    lastWaystone, namingForkOpen, recordBossOutcome, getRoom,
    recordWalk, walkedEdgesOf, isSophistTrueName,
    SETTLE_PRICE_PER_POINT,
} from './Labyrinth/labyrinth.engine';
export { resolvePoiTrap } from './Labyrinth/labyrinth.pools';
export {
    APORIA_ACTS, getAporiaAct,
} from './Labyrinth/maps';
export type {
    LabyrinthActDef, LabyrinthActId,
    LabyrinthProgress, LabyrinthBossOutcome,
} from './Labyrinth/types';
