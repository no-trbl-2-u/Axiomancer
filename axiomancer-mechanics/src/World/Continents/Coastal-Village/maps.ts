/**
 * Coastal Continent map definitions (Spec 08 Q5A — static templates only).
 *
 * Each export is a frozen `MapDefinition`. Runtime per-save progress lives in
 * `MapState`, built via `createMapState(definition)` and stored under
 * `WorldState.currentMap`.
 *
 * Only the parked northern-forest lives here since fishing-village was purged
 * (R3b, D53); the Act 1 coast and forest have their own files.
 */

import { MapDefinition, Quest } from '../../types';
import { shrineKeeper, chronicler, wanderingPhilosopher, forestRanger, hermitSage, lostTrader } from '../Northern-Forest/npcs';

/**
 * CoastalContinentMapNames are all the maps in the Coastal Continent
 * - 'breakwater': Act 1, map 1 — the storm coast, where a new game starts
 *   (map revamp M3a, D27). Defined in `./breakwater.ts`.
 * - 'charcoal-wood': Act 1, map 2 — the forest past the Breakwater's bridge
 *   (map revamp M3b). Defined in `./charcoal-wood.ts`.
 * - 'northern-forest': Small forest. Gather Wood. Parked (D53).
 */
export type CoastalContinentMapNames =
  'breakwater' |
  'charcoal-wood' |
  'northern-forest';

// ─── Quest content ────────────────────────────────────────────────────────────

const gatherWoodQuest: Quest = {
    name: 'gather-wood',
    description: "Gather three bundles of oak branches for the Hermit Sage's hearth.",
    mapName: 'northern-forest',
    status: 'available',
    objectives: [
        {
            id: 'collect-oak-branch',
            type: 'collect',
            target: 'oak-branch',
            description: "Collect 3 oak branches.",
            requiredCount: 3,
            currentCount: 0,
        },
    ],
    reward: { kind: 'currency', amount: 20 },
};

const getToCaveQuest: Quest = {
    name: 'get-to-cave',
    description: "Follow the Forest Ranger's directions to the cave at the forest's edge.",
    mapName: 'northern-forest',
    status: 'available',
    objectives: [
        {
            id: 'reach-cave',
            type: 'reach',
            target: 'nf-10',
            description: "Reach the cave mouth.",
            requiredCount: 1,
            currentCount: 0,
        },
    ],
    reward: { kind: 'experience', amount: 40 },
};

// ─── Map definitions ──────────────────────────────────────────────────────────
//
// Per Spec 23 / Phase 24, node events are no longer authored on the
// MapDefinition. See `src/World/MapEvents/content.ts` for the per-node pool
// overrides that drive `resolveMapEvent` against northern-forest.

const northernForest: MapDefinition = {
    name: 'northern-forest',
    continent: 'coastal-continent',
    description: 'A pine-thick wood inland from the village; cold springs, low light, and a cave mouth at the far edge.',
    // 2026-08-08 first-map audit — re-layered onto the column law (see
    // `docs/reports/FIRST-MAP-AUDIT.md`). The Phase-65-era forest carried a
    // stranding defect: seven nodes could strand a run outright, the
    // longest single life covered 13 of 25 nodes, and nf-9/nf-22 and
    // nf-10/nf-23 shared grid coordinates so the map canvas drew them
    // stacked on top of each other.
    //
    // Nine columns, three lanes: the RIDGE (y=+1), the TRAIL (y=0), and
    // the GLEN (y=-1). nf-10 — the cave mouth the `get-to-cave` quest
    // reaches for — moves to the authored terminal column so the map ends
    // where the story says it ends.
    //
    // 2026-09-21, D1 — carries lateral lane ribs: sideways edges between
    // neighbouring lanes in every multi-node column but the terminal one,
    // on top of an unchanged forward skeleton.
    startingNode: {
        id: 'nf-1',
        location: [0, 0],
        connectedNodes: ['nf-3', 'nf-2', 'nf-12'],
    },
    nodes: [
        // ── c0 — the treeline ────────────────────────────────────────
        { id: 'nf-1',  location: [0, 0], connectedNodes: ['nf-3', 'nf-2', 'nf-12'] },
        // ── c1 — interaction / gathering / encounter ─────────────────
        { id: 'nf-3',  location: [1, 1], connectedNodes: ['nf-5', 'nf-4', 'nf-2'] },
        { id: 'nf-2',  location: [1, 0], connectedNodes: ['nf-5', 'nf-4', 'nf-13', 'nf-3', 'nf-12'] },
        { id: 'nf-12', location: [1, -1], connectedNodes: ['nf-4', 'nf-13', 'nf-2'] },
        // ── c2 — interaction / rest / gathering ──────────────────────
        { id: 'nf-5',  location: [2, 1], connectedNodes: ['nf-15', 'nf-6', 'nf-4'] },
        { id: 'nf-4',  location: [2, 0], connectedNodes: ['nf-15', 'nf-6', 'nf-14', 'nf-5', 'nf-13'] },
        { id: 'nf-13', location: [2, -1], connectedNodes: ['nf-6', 'nf-14', 'nf-4'] },
        // ── c3 — hazard / encounter / interaction ────────────────────
        { id: 'nf-15', location: [3, 1], connectedNodes: ['nf-16', 'nf-7', 'nf-6'] },
        { id: 'nf-6',  location: [3, 0], connectedNodes: ['nf-16', 'nf-7', 'nf-11', 'nf-15', 'nf-14'] },
        { id: 'nf-14', location: [3, -1], connectedNodes: ['nf-7', 'nf-11', 'nf-6'] },
        // ── c4 — loot / interaction / rest ───────────────────────────
        { id: 'nf-16', location: [4, 1], connectedNodes: ['nf-17', 'nf-8', 'nf-7'] },
        { id: 'nf-7',  location: [4, 0], connectedNodes: ['nf-17', 'nf-8', 'nf-20', 'nf-16', 'nf-11'] },
        { id: 'nf-11', location: [4, -1], connectedNodes: ['nf-8', 'nf-20', 'nf-7'] },
        // ── c5 — cutscene / village / loot ───────────────────────────
        { id: 'nf-17', location: [5, 1], connectedNodes: ['nf-21', 'nf-9', 'nf-8'] },
        { id: 'nf-8',  location: [5, 0], connectedNodes: ['nf-21', 'nf-9', 'nf-19', 'nf-17', 'nf-20'] },
        { id: 'nf-20', location: [5, -1], connectedNodes: ['nf-9', 'nf-19', 'nf-8'] },
        // ── c6 — cutscene / interaction / encounter ──────────────────
        { id: 'nf-21', location: [6, 1], connectedNodes: ['nf-22', 'nf-23', 'nf-9'] },
        { id: 'nf-9',  location: [6, 0], connectedNodes: ['nf-22', 'nf-23', 'nf-18', 'nf-21', 'nf-19'] },
        { id: 'nf-19', location: [6, -1], connectedNodes: ['nf-23', 'nf-18', 'nf-9'] },
        // ── c7 — gathering / interaction / village ───────────────────
        { id: 'nf-22', location: [7, 1], connectedNodes: ['nf-24', 'nf-10', 'nf-23'] },
        { id: 'nf-23', location: [7, 0], connectedNodes: ['nf-24', 'nf-10', 'nf-25', 'nf-22', 'nf-18'] },
        { id: 'nf-18', location: [7, -1], connectedNodes: ['nf-10', 'nf-25', 'nf-23'] },
        // ── c8 — rest / THE CAVE MOUTH / hazard. Terminal column. ────
        { id: 'nf-24', location: [8, 1], connectedNodes: [] },
        { id: 'nf-10', location: [8, 0], connectedNodes: [] },
        { id: 'nf-25', location: [8, -1], connectedNodes: [] },
    ],
    npcs: [shrineKeeper, chronicler, wanderingPhilosopher, forestRanger, hermitSage, lostTrader],
    enemies: [],
    uniqueEvents: [],
    quests: [gatherWoodQuest, getToCaveQuest],
    images: {
        mapImage: { alt: '', src: '' },
        combatImage: { alt: '', src: '' },
    },
    // adjust-npcs pass 1 (2026-09-05) — the Forest Ranger and Lost Trader
    // are homed at nf-21 and nf-14 respectively (see `MapEvents/content.ts`);
    // northern-forest now reaches all 6 rostered NPCs and no longer declares
    // any unstaged. See the adjust-npcs pass 1 entry in
    // `plan/archive/CONTENT_LEDGER_2026.md` for the finding.
};

export { northernForest };
