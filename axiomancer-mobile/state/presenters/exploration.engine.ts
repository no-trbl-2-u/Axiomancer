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

import type { GameStore, MapEventKind } from '@mechanics';
import { getMapDefinition, getNodePrimaryEventKind, getNodeEventPool, legalMovesFrom, forwardEdges } from '@mechanics';

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
    | 'hazard'
    | 'blacksmith'
    | 'village';

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
    /**
     * True for a D1 LATERAL LANE RIB — an edge that steps sideways between
     * two lanes of the same column instead of one column forward.
     *
     * The engine draws the distinction itself (`forwardEdges()` in
     * `world.reducer.ts`, which is what its own route audits walk), so the
     * presenter reads it rather than re-deriving it from coordinates. The
     * canvas needs it because 69 ribs landed on the seven maps at once: drawn
     * at the same weight as the forward roads they turn the chart into an
     * undifferentiated mesh, and the spine the player is actually progressing
     * along stops being findable. Drawn lighter, they read as what they are —
     * you may also step sideways here.
     */
    lateral: boolean;
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
    /**
     * True while the map's STARTING node still has an unresolved event.
     *
     * The ONE placement the game deliberately treats as an arrival. Events
     * fire on arrival, and the player never arrives at the node they are
     * placed on, so a map's starting-node content used to be unreachable
     * (2026-08-08 first-map audit) — on fishing-village that silently
     * swallowed fv-1's whole pool. The exploration screen pays this on entry,
     * as the CLI's `--resolve-start` does
     * (`state/e2e/start-node-arrival.engine.test.tsx`).
     *
     * It is deliberately NOT the same sentence as `arrivalPending`: this one
     * is derived from the map's shape (you are on the start node, it carries
     * unconsumed content), because a placement leaves no record of itself.
     */
    startNodePending: boolean;
    /**
     * True while the node the player WALKED ONTO still owes them its arrival
     * event.
     *
     * Events fire on ARRIVAL, but a move checkpoints before the arrival
     * resolves: `moveToAction` saves (BUG-03), and only then does the screen
     * call `resolveCurrentMapEvent`. A player who reloaded in between came
     * back standing on the node with its onward edges already open and
     * nothing pending — on an encounter node the fight was silently skipped
     * (burn-day audit 2026-09-19 row 3.1).
     *
     * This reads the engine's own record of the debt — `pendingArrival`,
     * written by the arrival verb and cleared by `resolveMapEvent` — rather
     * than inferring it from an unconsumed node, because BEING PLACED ON A
     * NODE IS NOT ARRIVING AT IT and only the record can tell the two apart.
     * `placeOnNode` (state fixtures, `/dev` JUMP) even un-consumes the node
     * it places you on, so the inference read every placement as an
     * unanswered arrival and fired it on mount: the fixture deep link
     * `/exploration?fixture=sage-fv-boss-gate` engaged the fv-9 boss instead
     * of drawing the map (row 3.1 follow-up). The record rides the save, so
     * the debt is legible off the bytes on disk.
     */
    arrivalPending: boolean;
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
        /**
         * First-visit nudge drawn over the chart (FE-005). Lives here rather
         * than in the screen so the map's furniture (legend, compass, hint)
         * is authored in one place.
         */
        mapHint: string;
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
    // Phase V — every node kind wears its own woodcut: campfire for
    // rest, herb bundle for gathering, falling rocks for hazard.
    rest: 'rest',
    gather: 'herbs',
    current: 'eye',
    encounter: 'sword',
    // Phase V1 — treasure reads as a chest, not a scroll (the scroll
    // stays the quest/document mark), and a boss node wears the crowned
    // skull rather than the plain crown (the crown stays the SELF mark).
    treasure: 'chest',
    boss: 'boss',
    quest: 'scroll',
    hazard: 'hazard',
    blacksmith: 'anvil',
    village: 'village',
};

const ACTION_TAG_BY_TYPE: Record<NodeType, string> = {
    rest: 'HEAL · COSTLY',
    gather: 'NODE · GATHER',
    current: 'YOU ARE HERE',
    encounter: 'TRAVEL · 1 TURN',
    treasure: 'CARD · MIND',
    boss: 'TRAVEL · BOSS',
    quest: 'LORE',
    hazard: 'PERIL · BRAVE IT',
    blacksmith: 'FORGE · DIE GEAR',
    village: 'HAVEN · TRADE',
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
    hazard: 'hazard',
    interaction: 'quest',
    // Phase V — village and blacksmith wear their own woodcuts now
    // (huts and anvil); no more borrowed glyphs.
    village: 'village',
    cutscene: 'quest',
    narration: 'quest',
    blacksmith: 'blacksmith',
    // 2026-08-28 — inter-map travel doors. No bespoke door glyph yet; the
    // follow-up travel-UI wave owns one. Borrows the narrative icon.
    travel: 'quest',
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

/**
 * `available` here means REACHABLE RIGHT NOW — the engine's
 * `legalMovesFrom`, not the map's cumulative `availableNodes` unlock set.
 *
 * The two used to be conflated, and the 2026-08-08 first-map audit made the
 * gap visible on every move: `availableNodes` accumulates every node ever
 * unlocked, so the map lit up (and the drawer offered) nodes that
 * `moveToNode` would refuse as non-adjacent. Tapping one opened a confirm
 * panel that then did nothing. A node you have seen but cannot walk to from
 * where you stand reads as 'locked' — which is exactly what the gauntlet's
 * no-back-travel rule makes it.
 *
 * ── 2026-09-21, D1: SPENT IS NOT SEALED ──
 *
 * `spent` is the set the engine calls `isNodeSpent()`:
 * `completedNodes ∪ consumedNodes`. Those two lists are written by DIFFERENT
 * verbs — `completeNode` and `markNodeConsumed` — and neither implies the
 * other, so a node answered through the consume path lands in one list and
 * not the other.
 *
 * This function used to test `completedNodes` alone. Under the pre-D1 rules
 * that was survivable; under D1 it is a lie on screen, because the frontier
 * now excludes every spent node from `legalMovesFrom`. A consumed-but-not-
 * completed node therefore matched none of the three branches above and fell
 * through to `locked` — drawn SEALED, counted in the legend's "N sealed", and
 * described to a screen reader as sealed, when in truth the player had walked
 * it and answered it. Exactly the state D1 named TRODDEN, wearing the badge
 * of the state it is furthest from.
 *
 * The spent set is passed in (rather than recomputed here) so the ONE place
 * that decides what "resolved" means stays `world.reducer.ts` — see the call
 * site, which reads both engine lists and never redefines their union.
 */
function classifyNode(
    nodeId: string,
    currentNodeId: string,
    spent: ReadonlySet<string>,
    reachable: readonly string[],
): NodeKind {
    if (nodeId === currentNodeId) return 'current';
    if (spent.has(nodeId)) return 'completed';
    if (reachable.includes(nodeId)) return 'available';
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
//
// D1's lateral lane ribs are authored BOTH WAYS, so the same pair appears
// twice in `connectedNodes`; the `seen` key is order-insensitive precisely so
// one line is drawn per pair rather than two stacked on each other.
//
// `forward` is the engine's own forward-skeleton adjacency
// (`forwardEdges(def)`), passed in by the caller. An edge is a RIB exactly
// when neither endpoint lists the other as a forward neighbour — the same
// test the engine's route audits use, asked once here instead of being
// re-derived from `location[0]` in the presenter.
function buildEdges(
    nodes: readonly { id: string; connectedNodes: readonly string[] }[],
    forward: ReadonlyMap<string, readonly string[]>,
    spent: ReadonlySet<string>,
    locked: readonly string[],
): ExplorationEdge[] {
    const edges: ExplorationEdge[] = [];
    const seen = new Set<string>();
    const isForward = (a: string, b: string): boolean =>
        (forward.get(a) ?? []).includes(b) || (forward.get(b) ?? []).includes(a);
    for (const node of nodes) {
        for (const target of node.connectedNodes) {
            const key = node.id < target ? `${node.id}|${target}` : `${target}|${node.id}`;
            if (seen.has(key)) continue;
            seen.add(key);
            // A road reads as TRAVELLED once both its ends are answered —
            // spent, in D1's word, not merely `completedNodes` (see
            // `classifyNode`: the two lists diverge, and reading only one
            // left roads between walked nodes drawn as untrodden).
            const traveled = spent.has(node.id) && spent.has(target);
            const isLocked = locked.includes(node.id) || locked.includes(target);
            edges.push({
                fromId: node.id,
                toId: target,
                traveled,
                locked: isLocked,
                lateral: !isForward(node.id, target),
            });
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
    reachable: readonly string[],
    currentNodeId: string,
): ExplorationOption[] {
    const current = metaById.get(currentNodeId) ?? null;
    return reachable
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

/**
 * The three map-node states, as the legend strip names them.
 *
 * ── owner finding 9 / D1, 2026-09-21 ──
 *
 * The glyphs are not decoration: they are the legend's half of the
 * colour-blind contract that `components/NodeMark.tsx` draws the other half
 * of. Each one is a picture of how much of the disc its state fills, so the
 * key teaches the same distinction the chart makes:
 *
 *   ● TRODDEN — a SOLID mass. Answered; it yields nothing more.
 *   ◉ OPEN    — a ring around a lit core. The frontier: walk here.
 *   ◌ SEALED  — an EMPTY broken ring. Shut to you.
 *
 * The retired `✕ SEALED` is the mark the owner's Drowned Parish screenshot
 * caught: a blood-red cross on 23 of 28 nodes, so the loudest thing on the
 * chart was the state that means "nothing for you here". A sealed node now
 * recedes instead of shouting, and the legend had to stop promising a cross
 * that is no longer drawn.
 *
 * FE-008 still holds: SEALED, not SHUT — one word for the state across the
 * legend, the counter beside it, the node tap-tip, and every locked node's
 * accessible name.
 */
export const MAP_LEGEND_KEYS = [
    { glyph: '\u25CF', label: 'TRODDEN' },
    { glyph: '\u25C9', label: 'OPEN' },
    { glyph: '\u25CC', label: 'SEALED' },
] as const;

/** The legend strip's left half, built from `MAP_LEGEND_KEYS` so the two cannot drift. */
export const MAP_LEGEND_LEFT: string = MAP_LEGEND_KEYS
    .map((k) => `${k.glyph} ${k.label}`)
    .join('   ');

const DRAWER_COPY = {
    emptyMessage: 'the paths close as you go deeper — tap a glowing node to travel.',
    title: '✠ WHITHER, PILGRIM?',
    leaguesLabel: 'LEAGUES',
    // S4-world-C07: the chart is a 936x1040 spread behind a phone-sized
    // window — a first-time player counted 25 nodes in the legend, saw
    // eight, and had no reason to think the sheet moved. The nudge names
    // the gesture as well as the tap.
    mapHint: 'Tap a glowing node to travel — drag or pinch the chart',
} as const;

const FALLBACK_VM: ExplorationViewModel = {
    continent: 'CONTINENT · UNKNOWN',
    region: '—',
    regionProgress: '',
    mapId: '',
    currentNodeId: '',
    startNodePending: false,
    arrivalPending: false,
    nodes: [],
    edges: [],
    actions: [],
    options: [],
    drawerCopy: DRAWER_COPY,
    eventCallout: null,
    legend: { left: MAP_LEGEND_LEFT, right: '' },
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
            startNodePending: false,
            arrivalPending: false,
        });
    }

    const completed = world.currentMap.completedNodes as readonly string[];
    const consumedNodes = (world.currentMap.consumedNodes ?? []) as readonly string[];
    const locked = world.currentMap.lockedNodes as readonly string[];
    const currentNodeId = readCurrentNodeId(world);
    // The engine owns "where can I go from here" (see `classifyNode`).
    const reachable: readonly string[] = legalMovesFrom(world.currentMap);
    // D1's SPENT set — `isNodeSpent()`'s union, read off the two lists the
    // save actually carries. The engine's own predicate takes a `MapState`
    // one node at a time; over ~28 nodes per map that is 28 map-definition
    // lookups per render, so the union is materialised once here against the
    // same two lists `isNodeSpent` reads and never against a third rule.
    const spent: ReadonlySet<string> = new Set<string>([...completed, ...consumedNodes]);
    // The engine's forward skeleton — what separates a progression road from
    // a D1 lateral rib on the canvas. Definition-only, so it is stable for
    // the life of the map.
    const forward = forwardEdges(def);

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
        const nodeKind = classifyNode(eng.id, currentNodeId, spent, reachable);
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

    // THE ARRIVAL THE MAP STILL OWES THE PLAYER (burn-day audit 2026-09-19
    // row 3.1 + follow-up). Two different sentences, deliberately kept apart.
    //
    // `arrivalPending` is READ, not inferred: `pendingArrival` is the record
    // the arrival verb writes (`moveToNode`, and mobile's own move) and
    // `resolveMapEvent` clears the moment the arrival is answered. It rides
    // the save, so an arrival interrupted by a reload — the move checkpoints
    // BEFORE its event resolves — is still owed on the next mount instead of
    // being walked past. Travel doors need no special case here: crossing
    // answers the door even though a door is never consumed, and a reload
    // taken while standing on one still owes the crossing the player walked
    // into.
    //
    // Inferring it instead from "the node under the player is unconsumed"
    // cannot tell a walk from a placement, and `placeOnNode` un-consumes the
    // node it places you on — so every state fixture and every `/dev` JUMP
    // read as an unanswered arrival and the screen fired it on mount.
    //
    // `startNodePending` is the one placement the game treats as an arrival,
    // and it has to be derived precisely because a placement leaves no
    // record: the player is put on the start node by `createMapState`, never
    // walks onto it. Whether it is SAFE to resolve either of them right now
    // (no event or combat already owning the screen) is the screen's call,
    // not the map's — this view model is memoised on `state.world` and must
    // not read the event slice.
    //
    // The labyrinth is out of scope only because the aporia maps carry no
    // mobile layout (`state/exploration-maps`), so those states take the
    // fallback view model above. `labyrinthMove` defers the boss room's
    // arrival for the finale panel on purpose — it leaves `pendingArrival`
    // set until the finale resolves it — so registering a labyrinth layout
    // would need this read revisited first.
    const arrivalPending = (world.currentMap.pendingArrival ?? null) === currentNodeId;
    const startNodePending =
        currentNodeId === def.startingNode.id
        && !consumedNodes.includes(currentNodeId)
        && getNodeEventPool(continent, mapName, currentNodeId) !== undefined;

    const options = buildOptions(metaById, orderById, reachable, currentNodeId);
    const actions = buildActions(options);
    const edges = buildEdges(def.nodes, forward, spent, locked);

    return freezeViewModel({
        continent: layout.continent,
        region: layout.region,
        regionProgress: layout.regionProgress,
        mapId: mapName,
        currentNodeId,
        startNodePending,
        arrivalPending,
        nodes,
        edges,
        actions,
        options,
        drawerCopy: DRAWER_COPY,
        eventCallout: null,
        legend: {
            // FE-008: SEALED, not SHUT. The counter at the other end of this
            // same strip says 'N sealed', the node tap-tip says 'This path is
            // sealed.', and every locked node's accessible name ends 'sealed'
            // — the legend was the only surface using a fourth word for the
            // state it exists to define.
            left: MAP_LEGEND_LEFT,
            // PLAYTEST_BUGS_2026-09-18 BUG-01: this counter used to read
            // `locked.length` off `world.currentMap.lockedNodes`, while the
            // PIPS beside it are classified by `classifyNode`. Those are two
            // different sources of truth and they disagreed on screen: the
            // strip said "25 nodes · 20 sealed" over 21 nodes actually drawn
            // sealed. The start node is the reason — it was never in
            // `lockedNodes` (you begin standing on it), but once you walk away
            // it is neither `reachable` nor `completed`, so the renderer calls
            // it sealed while the engine's lock list never did.
            //
            // Counting the array the pips are drawn from makes the label a
            // description of the map rather than a second opinion about it.
            // `fishing-village.layout.ts` records an EARLIER disagreement with
            // this same counter (critique pass 19), so this surface has bitten
            // before — hence the test that pins label against pips directly.
            right: `${nodes.length} nodes · ${nodes.filter((n) => n.kind === 'locked').length} sealed`,
        },
    });
}
