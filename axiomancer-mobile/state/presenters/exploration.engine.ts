/**
 * Screen-level presenter for `app/(tabs)/exploration/index.tsx`.
 *
 * Spec 07: drives the exploration view-model from `state.world`. Node
 * positions, labels, types, and connectivity live in a per-map fixture
 * (`app/(tabs)/exploration/maps/<map-id>.layout.ts`, Q1=A); engine state
 * supplies the completed / available / locked buckets and the
 * presenter-tracked `currentNodeId`. Tapping a locked node is a no-op
 * (Q5=B) — the screen renders locked nodes desaturated to convey state.
 */

import type { GameStore, MapEventKind } from 'axiomancer-mechanics';
import { getMapDefinition, getNodePrimaryEventKind, getNodeEventPool } from 'axiomancer-mechanics';

import { readCurrentNodeId } from '../actions';
import { getMapLayout } from '@/state/exploration-maps';
import { freezeViewModel } from './freeze';

export type NodeKind = 'completed' | 'current' | 'available' | 'locked';
export type NodeType =
    | 'rest'
    | 'gather'
    | 'current'
    | 'encounter'
    | 'treasure'
    | 'boss'
    | 'quest'
    | 'hazard';

export interface ExplorationNode {
    /** Stable engine node ID. */
    id: string;
    /** Pixel position on the canonical 360×400 viewBox. */
    x: number;
    y: number;
    kind: NodeKind;
    label: string;
    type: NodeType;
    /** True when tapping the node should trigger combat. */
    triggersCombat: boolean;
}

export interface ExplorationEdge {
    fromId: string;
    toId: string;
    /** True when the player has already traversed this edge. */
    traveled: boolean;
    /** True when either endpoint is locked. */
    locked: boolean;
}

export interface ExplorationAction {
    /** Stable action key (snake_case engine name). */
    key: string;
    /** Display label, may contain `\n` for two-line cards. */
    label: string;
    /** Icon key the screen maps to an `ActionIcon` kind. */
    iconKey: string;
    /** Sub-label tag (`'TRAVEL · 1 TURN'`). */
    tag: string;
    selected: boolean;
}

/**
 * League indicator for the WHITHER, PILGRIM? step-cards — three buckets
 * (I = closest, II = middle, III = farthest). Pure presenter derivation
 * from Euclidean distance between the current node and the option node
 * on the canonical 360×400 viewBox. Ported from the prototype's
 * `StepCardClickable` (see `prototype.jsx:184-208` in the Claude Design
 * handoff — every step-card carries a `leagues` glyph on its right).
 */
export type LeagueBucket = 'I' | 'II' | 'III';

export interface ExplorationOption {
    /** Engine node id the option moves the player to. */
    nodeId: string;
    label: string;
    type: NodeType;
    /** Thematic blurb sourced from the layout fixture. */
    description: string;
    /** Distance indicator for the step-card right column. */
    leagues: LeagueBucket;
}

export interface ExplorationViewModel {
    continent: string;
    region: string;
    /** Localised "Map ii of vii" string. */
    regionProgress: string;
    /** Engine map id (used to drive map transitions). */
    mapId: string;
    /** Engine node id of the player's current location. */
    currentNodeId: string;
    nodes: readonly ExplorationNode[];
    edges: readonly ExplorationEdge[];
    actions: readonly ExplorationAction[];
    /** Next-step picker shown beneath the map (Q6). */
    options: readonly ExplorationOption[];
    /**
     * Drawer-strip copy. Lowercase ritual register where narrative;
     * uppercase chrome where chrome. The screen renders every field
     * verbatim so view-layer code carries no display literals
     * (Hard Rule #8). `emptyMessage` shows when `options` is empty;
     * `title` is the section eyebrow above the step-card list;
     * `leaguesLabel` is the right-column header on each step-card.
     */
    drawerCopy: {
        emptyMessage: string;
        title: string;
        leaguesLabel: string;
    };
    /** Optional event callout banner; `null` when no callout. */
    eventCallout: { title: string; iconKey: string } | null;
    /** Legend bottom strip — pre-formatted display strings. */
    legend: { left: string; right: string };
}

// Exploration step-card icons. Closes the [3.5] DRIFT row from
// `docs/mechanics-ui-audit-2026-05-22-exploration.md` row 10:
// `encounter` was previously `'flee'` (the same glyph the combat
// modal uses for the FLEE button), making the encounter
// step-card read "this lets you flee" rather than "this starts
// combat". Swapped to `'sword'` so the encounter + boss
// step-cards share the same combat-stakes vocabulary; matches
// the combat tab's ATTACK action icon.
// Exported so the map nodes can render the same kind-icon the option cards use,
// giving adjacent nodes an at-a-glance "what is this" glyph. Boss uses a
// distinct `crown` (not the encounter `sword`) so the climax is signposted.
export const ACTION_ICON_BY_TYPE: Record<NodeType, string> = {
    rest: 'flame',
    gather: 'bag',
    current: 'eye',
    encounter: 'sword',
    treasure: 'scroll',
    boss: 'crown',
    quest: 'scroll',
    hazard: 'arcane',
};

const ACTION_TAG_BY_TYPE: Record<NodeType, string> = {
    rest: 'HEAL · COSTLY',
    gather: 'NODE · GATHER',
    current: 'YOU ARE HERE',
    encounter: 'TRAVEL · 1 TURN',
    treasure: 'SKILL · MIND',
    boss: 'TRAVEL · BOSS',
    quest: 'LORE',
    hazard: 'PERIL · BRAVE IT',
};

const ENCOUNTER_NODE_TYPES = new Set<NodeType>(['encounter', 'boss']);

// Maps the engine's authored MapEvent kind to a display NodeType (icon).
// The engine owns which kind fires at each node; mobile only chooses the
// glyph. `encounter` is promoted to `boss` when the node's pool is a boss
// fight (see `engineNodeType`). interaction/village/cutscene have no bespoke
// glyph yet, so they borrow the nearest narrative/utility icon.
const KIND_TO_NODE_TYPE: Record<MapEventKind, NodeType> = {
    encounter: 'encounter',
    gathering: 'gather',
    rest: 'rest',
    'loot-cache': 'treasure',
    quest: 'quest',
    hazard: 'hazard',
    interaction: 'quest',
    village: 'treasure',
    cutscene: 'quest',
    narration: 'quest',
};

/** Node display type, sourced from the engine's authored event pools. */
function engineNodeType(continent: string, mapName: string, nodeId: string): NodeType {
    const kind = getNodePrimaryEventKind(continent, mapName, nodeId);
    if (!kind) return 'encounter';
    if (kind === 'encounter') {
        const pool = getNodeEventPool(continent, mapName, nodeId);
        const isBoss = pool?.entries.some(
            (e) => e.kind === 'encounter' && (e.payload as { isBoss?: boolean }).isBoss === true,
        );
        return isBoss ? 'boss' : 'encounter';
    }
    return KIND_TO_NODE_TYPE[kind];
}

function classifyNode(
    nodeId: string,
    currentNodeId: string,
    completed: readonly string[],
    available: readonly string[],
): NodeKind {
    if (nodeId === currentNodeId) return 'current';
    if (completed.includes(nodeId)) return 'completed';
    if (available.includes(nodeId)) return 'available';
    return 'locked';
}

/** Resolved per-node display metadata (position + copy + engine-sourced kind). */
interface ResolvedNodeMeta {
    x: number;
    y: number;
    label: string;
    description: string;
    type: NodeType;
}

// Edges come from the ENGINE graph (`getMapDefinition().nodes[].connectedNodes`).
function buildEdges(
    nodes: ReadonlyArray<{ id: string; connectedNodes: readonly string[] }>,
    completed: readonly string[],
    locked: readonly string[],
): ExplorationEdge[] {
    const edges: ExplorationEdge[] = [];
    const seen = new Set<string>();
    for (const node of nodes) {
        for (const target of node.connectedNodes) {
            const key = node.id < target ? `${node.id}|${target}` : `${target}|${node.id}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const traveled = completed.includes(node.id) && completed.includes(target);
            const isLocked = locked.includes(node.id) || locked.includes(target);
            edges.push({ fromId: node.id, toId: target, traveled, locked: isLocked });
        }
    }
    return edges;
}

/**
 * Bucket an Euclidean distance (in 360×400 viewBox pixels) into a
 * three-band league indicator. Cutoffs are calibrated against the
 * canonical layout fixtures — most "next step" hops sit in the 40-140
 * range, so 80 / 160 gives a roughly even three-way split across the
 * shipped maps. Pure function; tested in
 * `state/e2e/exploration.engine.test.ts`.
 */
function leaguesFromDistance(d: number): LeagueBucket {
    if (d <= 80) return 'I';
    if (d <= 160) return 'II';
    return 'III';
}

function buildOptions(
    metaById: ReadonlyMap<string, ResolvedNodeMeta>,
    orderById: ReadonlyMap<string, number>,
    available: readonly string[],
    currentNodeId: string,
): ExplorationOption[] {
    const current = metaById.get(currentNodeId) ?? null;
    return available
        // Don't offer the node the player is standing on (reusable encounter
        // nodes stay in `availableNodes`, but you're already there).
        .filter((id) => id !== currentNodeId && metaById.has(id))
        .sort((a, b) => (orderById.get(a) ?? 0) - (orderById.get(b) ?? 0))
        .map((id) => {
            const n = metaById.get(id)!;
            const distance =
                current === null ? 0 : Math.hypot(n.x - current.x, n.y - current.y);
            return {
                nodeId: id,
                label: n.label,
                type: n.type,
                description: n.description,
                leagues: leaguesFromDistance(distance),
            };
        });
}

function buildActions(options: readonly ExplorationOption[]): ExplorationAction[] {
    return options.map((opt, i) => ({
        key: `move-${opt.nodeId}`,
        label: opt.label,
        iconKey: ACTION_ICON_BY_TYPE[opt.type],
        tag: ACTION_TAG_BY_TYPE[opt.type],
        selected: i === 0,
    }));
}

const DRAWER_COPY = {
    emptyMessage: 'the paths close as you go deeper — tap a glowing node to travel.',
    title: '✠ WHITHER, PILGRIM?',
    leaguesLabel: 'LEAGUES',
} as const;

const FALLBACK_VM: ExplorationViewModel = {
    continent: 'CONTINENT · UNKNOWN',
    region: '—',
    regionProgress: '',
    mapId: '',
    currentNodeId: '',
    nodes: [],
    edges: [],
    actions: [],
    options: [],
    drawerCopy: DRAWER_COPY,
    eventCallout: null,
    legend: { left: '● TRODDEN  ◌ OPEN  ✕ SHUT', right: '' },
};

// Referential-stability memo (1-entry, keyed by the `world` slice this
// selector reads). `useGameState` subscribes via Zustand `useStore`, whose
// `getSnapshot` is the bare selector call — React's `useSyncExternalStore`
// then requires it to return a STABLE reference for unchanged state, or it
// loops ("getSnapshot should be cached → Maximum update depth exceeded").
// The other presenters dodge this by returning frozen singletons; this one
// builds a fresh frozen VM, so we cache it against the immutable `world`
// reference (Zustand replaces it only when the world actually changes).
let _expWorldRef: unknown;
let _expVm: ExplorationViewModel | null = null;

export function selectExplorationViewModel(state: GameStore): ExplorationViewModel {
    if (state.world === _expWorldRef && _expVm !== null) return _expVm;
    const vm = computeExplorationViewModel(state);
    _expWorldRef = state.world;
    _expVm = vm;
    return vm;
}

function computeExplorationViewModel(state: GameStore): ExplorationViewModel {
    // Engine `GameStore = GameState & GameActions`; `GameState.world:
    // WorldState` is typed cleanly (engine
    // `axiomancer-mechanics/dist/Game/types.d.ts:GameState`). The
    // earlier `(state as any).world` cast (closed via [2.5]
    // exploration-audit row 7) was a stale defensive holdover from
    // when `world` was added late.
    const world = state.world;
    if (!world || !world.currentMap || !world.currentContinent) {
        return freezeViewModel(FALLBACK_VM);
    }

    const layout = getMapLayout(world.currentMap.name);
    if (layout === null) {
        return freezeViewModel({
            ...FALLBACK_VM,
            continent: `CONTINENT · ${String(world.currentContinent.name).toUpperCase()}`,
            region: world.currentMap.name,
            mapId: world.currentMap.name,
            currentNodeId: readCurrentNodeId(world),
        });
    }

    // The node GRAPH (ids + edges) is the engine's; the mobile layout supplies
    // only pixel positions + display copy. Resolve the engine map definition.
    const continent = world.currentMap.continent;
    const mapName = world.currentMap.name;
    let def: ReturnType<typeof getMapDefinition> | null = null;
    try {
        def = getMapDefinition(continent, mapName);
    } catch {
        def = null;
    }
    if (def === null) {
        return freezeViewModel({
            ...FALLBACK_VM,
            continent: layout.continent,
            region: layout.region,
            mapId: mapName,
            currentNodeId: readCurrentNodeId(world),
        });
    }

    const completed = world.currentMap.completedNodes as readonly string[];
    const available = world.currentMap.availableNodes as readonly string[];
    const locked = world.currentMap.lockedNodes as readonly string[];
    const currentNodeId = readCurrentNodeId(world);

    // Per-node display meta: position/label/blurb from the mobile layout (by id),
    // kind/icon from the engine's authored event pools. Nodes without an authored
    // layout entry fall back to the canvas centre + their id.
    const layoutById = new Map(layout.nodes.map((n) => [n.id, n] as const));
    const orderById = new Map(def.nodes.map((n, i) => [n.id, i] as const));
    const metaById = new Map<string, ResolvedNodeMeta>();
    for (const eng of def.nodes) {
        const lay = layoutById.get(eng.id);
        metaById.set(eng.id, {
            x: lay?.x ?? 180,
            y: lay?.y ?? 200,
            label: lay?.label ?? eng.id,
            description: lay?.description ?? '',
            type: engineNodeType(continent, mapName, eng.id),
        });
    }

    const nodes: ExplorationNode[] = def.nodes.map((eng) => {
        const meta = metaById.get(eng.id)!;
        const nodeKind = classifyNode(eng.id, currentNodeId, completed, available);
        return {
            id: eng.id,
            x: meta.x,
            y: meta.y,
            kind: nodeKind,
            label: meta.label,
            type: meta.type,
            triggersCombat: nodeKind === 'available' && ENCOUNTER_NODE_TYPES.has(meta.type),
        };
    });

    const options = buildOptions(metaById, orderById, available, currentNodeId);
    const actions = buildActions(options);
    const edges = buildEdges(def.nodes, completed, locked);

    return freezeViewModel({
        continent: layout.continent,
        region: layout.region,
        regionProgress: layout.regionProgress,
        mapId: mapName,
        currentNodeId,
        nodes,
        edges,
        actions,
        options,
        drawerCopy: DRAWER_COPY,
        eventCallout: null,
        legend: {
            left: '● TRODDEN  ◌ OPEN  ✕ SHUT',
            right: `${def.nodes.length} nodes · ${locked.length} sealed`,
        },
    });
}
