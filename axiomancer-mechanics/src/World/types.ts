import { Item } from '../Items/types';
import { Enemy } from '../Enemy/types';
import { Image } from '../Utils/types';
import { ContinentName, MapName } from './map.library';
import { QuestName } from './quest.library';
import { NPC } from '../NPCs/types';

/**
 * A reward grantable on event/combat completion. Either a tag (`'experience'`,
 * `'currency'`, `'skill'`, `'quest'`) or a concrete `Item`.
 */
export type Reward =
    | 'experience'
    | 'currency'
    | 'skill'
    | 'quest'
    | Item
    | { kind: 'currency'; amount: number }
    | { kind: 'experience'; amount: number }
    | { kind: 'skill'; skillId: string }
    | { kind: 'item'; item: Item };

/**
 * A combat encounter (Spec 07 Q5B). Wraps the list of enemies that take
 * part in the fight plus any encounter-level rewards beyond the per-enemy
 * `xpReward` / `loot` tables.
 *
 * @property enemies  - Enemies in the encounter (length 1 today).
 * @property rewards  - Optional bonus rewards layered on top of per-enemy drops.
 * @property origin   - Optional source label (`<mapName>:<nodeId>`).
 */
export interface Encounter {
    enemies: Enemy[];
    rewards?: Reward[];
    origin?: string;
}

// ─── Quests (Spec 08 Q7B) ─────────────────────────────────────────────────────

/**
 * What an objective tracks. Per Spec 08 Q7 (option B) the engine tracks
 * per-objective progress rather than treating a quest as binary.
 *
 * - `kill`    — defeat N enemies of `target` slug.
 * - `collect` — gather N items with `target` item id.
 * - `reach`   — arrive at the node `target` (counts as 1).
 * - `talk`    — talk to the NPC named `target` (counts as 1).
 * - `flag`    — generic world-flag advanced explicitly by the dialogue or CLI.
 */
export type QuestObjectiveType = 'kill' | 'collect' | 'reach' | 'talk' | 'flag';

/** Per-objective state attached to a Quest. */
export interface QuestObjective {
    id: string;
    type: QuestObjectiveType;
    description: string;
    /** Enemy slug / item id / node id / npc name / flag key. */
    target?: string;
    requiredCount: number;
    currentCount: number;
}

/** Lifecycle of a quest in the player's log. */
export type QuestStatus = 'available' | 'active' | 'completed' | 'failed';

/**
 * A quest with per-objective progress tracking.
 *
 * @property mapName     - The map where the quest takes place.
 * @property objectives  - Sub-goals — quest completes when all are at `currentCount === requiredCount`.
 * @property reward      - Granted on completion.
 * @property nextQuest   - Next quest in a chain, if any.
 */
export interface Quest {
    name: QuestName;
    description: string;
    mapName: MapName;
    objectives: QuestObjective[];
    reward: Reward;
    nextQuest?: QuestName;
    status: QuestStatus;
}

/** Player's persistent quest log. */
export interface QuestLog {
    available: Quest[];
    active: Quest[];
    completed: QuestName[];
}

/** An event that can only occur once per save. */
export interface UniqueEvent {
    id: string;
    /** Free-form tag; the engine doesn't dispatch on this any more. */
    type: string;
    description: string;
    nodeLocation: [number, number];
    completed: boolean;
}

/** Node IDs are formatted as `<map-acronym>-<number>`, e.g. `"fv-1"`. */
export type NodeId = string;

/** A traversable location on a map. */
export interface MapNode {
    id: NodeId;
    location: [number, number];
    connectedNodes: NodeId[];
}

// ─── Map split (Spec 08 Q5A): static MapDefinition vs runtime MapState ────────

/**
 * Static, frozen template for a map. Lives in the map registry; never mutated.
 *
 * @property nodes        - Every traversable node (including the starting one).
 * @property npcs         - NPCs that can be referenced by node events.
 * @property uniqueEvents - Event templates that fire at most once per save.
 * @property quests       - Quests this map can hand out.
 *
 * Node events are no longer authored on the definition. Spec 23
 * shifted to weighted pools registered via `registerMapEventPool` /
 * `setDefaultMapEventPool` / `setNodeEventPoolOverride`; see
 * `src/World/MapEvents/content.ts` for the authored content.
 */
export interface MapDefinition {
    readonly name: MapName;
    readonly continent: ContinentName;
    readonly description: string;
    readonly startingNode: MapNode;
    readonly nodes: readonly MapNode[];
    readonly npcs?: readonly NPC[];
    readonly enemies?: readonly Enemy[];
    readonly uniqueEvents?: readonly UniqueEvent[];
    readonly quests?: readonly Quest[];
    readonly images?: { mapImage: Image; combatImage: Image };
}

// ─── Hazard Persistence (Phase 135) ────────────────────────────────────────

/**
 * Hazard modifier effect applied to future encounters at tagged nodes.
 * Used by H08 (supply threshold -2), H12 (stability auto-success ≤6), etc.
 */
export interface HazardModifierEntry {
    hazardType: 'supply' | 'stability' | 'escape' | 'force';
    thresholdAdjustment: number; // negative = easier, positive = harder
    description: string;
}

/**
 * Persistent outcome of a completed hazard encounter at a specific node.
 * Enables world-state modifications that affect future hazard encounters.
 */
export interface HazardNodeOutcome {
    nodeId: NodeId;
    hazardId: string;
    outcome: 'cleared' | 'blocked' | 'modified';
    appliedDate: string; // ISO timestamp
    modifierEffects?: HazardModifierEntry[];
}

/**
 * Blocked route between two connected nodes due to hazard outcome.
 * Used by H12 "Riddled Bridge" final round failure to block bridge passage.
 */
export interface BlockedRoute {
    from: NodeId;
    to: NodeId;
    reason: string;
}

/**
 * Runtime, per-save state for a map.
 *
 * @property currentNode    - Player's current position on this map (Spec 08 Q1: per-map).
 * @property completedNodes - Nodes the player has fully resolved (locked from back-travel — Q2).
 * @property availableNodes - Nodes currently traversable from the player's progress.
 * @property lockedNodes    - Nodes not yet unlocked.
 * @property uniqueEvents   - Mutable runtime copy of the definition's unique events.
 * @property discoveredNodes - Spec 23: nodes the player has revealed via the
 *                             fog-of-war discovery mechanic. Seeded with the
 *                             map's `startingNode` by `createMapState`.
 * @property consumedNodes   - Spec 23: nodes whose MapEvent has been resolved.
 *                             One-shot: a consumed node returns `{ kind: 'none' }`
 *                             from `resolveMapEvent`.
 * @property hazardOutcomes   - Phase 135: persistent hazard effects applied to this map.
 *                             Tracks modifier effects and cleared/blocked/modified states.
 * @property blockedRoutes    - Phase 135: routes blocked by hazard outcomes (e.g., collapsed bridge).
 *                             Checked by moveToNode validation for path availability.
 */
export interface MapState {
    name: MapName;
    continent: ContinentName;
    currentNode: NodeId;
    completedNodes: NodeId[];
    availableNodes: NodeId[];
    lockedNodes: NodeId[];
    uniqueEvents: UniqueEvent[];
    discoveredNodes: NodeId[];
    consumedNodes: NodeId[];
    hazardOutcomes: HazardNodeOutcome[];
    blockedRoutes: BlockedRoute[];
}

/** A region containing several maps. */
export interface Continent {
    name: ContinentName;
    description: string;
    availableMaps: MapName[];
    lockedMaps: MapName[];
    completedMaps: MapName[];
}

/**
 * Aggregate world state — the catalogue of continents plus the current
 * navigation context.
 */
export interface WorldState {
    world: Continent[];
    currentContinent: Continent;
    currentMap: MapState;
}
