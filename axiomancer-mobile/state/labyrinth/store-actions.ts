/**
 * The Labyrinth (THE APORIA, W-01) — store action glue.
 *
 * The pure engine lives in `axiomancer-mechanics` (World/Labyrinth);
 * these wrappers thread a visit through the mobile `labyrinthUi`
 * slice and read/write the DURABLE progress on the engine state
 * (`GameState.labyrinth`, persisted with the save). Every judgment —
 * door visibility, traversal legality, fragments, gates, hints, debt,
 * traps — comes from `@mechanics`; nothing is re-derived here
 * (bearings hard rule 6). The CLI (`npm run labyrinth`) is the
 * behavioral reference for the sequencing below.
 *
 * Arrival events themselves resolve through the existing
 * `resolveCurrentMapEvent` action (wired in `state/actions.ts`); this
 * module owns the labyrinth-specific bracketing: waystone activation
 * BEFORE the roll, Oubliette ejection AFTER it.
 */

import {
    activateWaystone,
    buyHint,
    createLabyrinthProgress,
    createMapState,
    debtPoints,
    getAporiaAct,
    getMapDefinition,
    getRoom,
    hintPrice,
    inspectPoi,
    isSophistTrueName,
    lastWaystone,
    moveToNode,
    recordBossOutcome,
    recordWalk,
    resolvePoiTrap,
    settleDebt,
    SETTLE_PRICE_PER_POINT,
    submitGateAnswer,
    teleportToNode,
    unblockMapRoute,
    visibleDoors,
} from '@mechanics';
import type {
    GameState,
    LabyrinthActId,
    LabyrinthBossOutcome,
    LabyrinthProgress,
    WorldState,
} from '@mechanics';

import { beginHazardAction } from '../hazard/store-actions';
import {
    EMPTY_EVENT_SLICE,
    EMPTY_LABYRINTH_SLICE,
    type AppStore,
    type MobileLabyrinthSlice,
} from '../store';

type LabyrinthSession = NonNullable<MobileLabyrinthSlice['session']>;

// ─── Progress + session accessors ────────────────────────────────────────────

export function labyrinthProgressOf(state: { labyrinth?: LabyrinthProgress }): LabyrinthProgress {
    return state.labyrinth ?? createLabyrinthProgress();
}

function sessionOf(store: AppStore) {
    return store.getState().labyrinthUi?.session ?? null;
}

function setSession(store: AppStore, session: LabyrinthSession): void {
    store.setState({ labyrinthUi: { session } });
}

function saveQuietly(store: AppStore): void {
    try {
        store.getState().save();
    } catch {
        // Persistence failures must never strand the walker mid-room.
    }
}

// ─── Enter / exit ─────────────────────────────────────────────────────────────

function labyrinthWorld(actId: LabyrinthActId): WorldState {
    const act = getAporiaAct(actId);
    const def = getMapDefinition('labyrinth-continent', act.mapName);
    return {
        world: [],
        currentContinent: {
            name: 'labyrinth-continent',
            description: 'THE APORIA — a building in the shape of a country.',
            availableMaps: [act.mapName],
            lockedMaps: [],
            completedMaps: [],
        },
        currentMap: createMapState(def),
    };
}

/**
 * Enter an act. Snapshots the overworld (restored on exit), swaps the
 * world to the act's map, and stamps `currentAct` on the durable
 * progress. The caller (actions.ts) resolves the entry room's arrival
 * event afterwards — entrances narrate (authored override).
 */
export function enterLabyrinthAction(store: AppStore, actId: LabyrinthActId): void {
    const state = store.getState();
    const existing = sessionOf(store);
    const progress = labyrinthProgressOf(state as unknown as GameState);
    store.setState({
        world: labyrinthWorld(actId),
        labyrinth: { ...progress, currentAct: actId },
        labyrinthUi: {
            session: {
                actId,
                // A descent (act1 → act2 → act3) keeps the ORIGINAL snapshot.
                savedWorld: existing?.savedWorld ?? state.world ?? null,
                lastRemark: null,
                arrivalNote: null,
            },
        },
        event: EMPTY_EVENT_SLICE,
    });
    saveQuietly(store);
}

/** Leave the labyrinth: restore the overworld snapshot, clear the visit. */
export function exitLabyrinthAction(store: AppStore): void {
    const session = sessionOf(store);
    if (!session) return;
    store.setState({
        ...(session.savedWorld ? { world: session.savedWorld } : {}),
        labyrinthUi: EMPTY_LABYRINTH_SLICE,
        event: EMPTY_EVENT_SLICE,
    });
    saveQuietly(store);
}

// ─── Arrival bracketing (CLI `arrive` parity) ────────────────────────────────

/**
 * BEFORE the arrival roll: waystones take your hand (free, automatic,
 * idempotent). Surfaces a one-shot `arrivalNote` for the toast.
 */
export function labyrinthPreArriveAction(store: AppStore): void {
    const session = sessionOf(store);
    if (!session) return;
    const state = store.getState();
    const act = getAporiaAct(session.actId);
    const nodeId = state.world.currentMap.currentNode;
    const room = getRoom(act, nodeId);
    if (!room.waystone) return;
    const progress = labyrinthProgressOf(state as unknown as GameState);
    const next = activateWaystone(progress, nodeId);
    if (next === progress) return;
    store.setState({
        labyrinth: next,
        labyrinthUi: { session: { ...session, arrivalNote: 'waystone' } },
    });
}

/**
 * AFTER the arrival roll: the Oubliette returns you to the last
 * activated waystone (the act entry when none is lit).
 */
export function labyrinthPostArriveAction(store: AppStore): void {
    const session = sessionOf(store);
    if (!session) return;
    const state = store.getState();
    const act = getAporiaAct(session.actId);
    const nodeId = state.world.currentMap.currentNode;
    const room = getRoom(act, nodeId);
    if (!room.eject) return;
    const back = lastWaystone(act, labyrinthProgressOf(state as unknown as GameState));
    store.setState({
        world: teleportToNode(state.world, back),
        labyrinthUi: { session: { ...session, arrivalNote: 'ejected' } },
    });
}

/** Clear the one-shot arrival toast signal. */
export function clearLabyrinthArrivalNoteAction(store: AppStore): void {
    const session = sessionOf(store);
    if (!session || session.arrivalNote === null) return;
    setSession(store, { ...session, arrivalNote: null });
}

// ─── Traversal ────────────────────────────────────────────────────────────────

/**
 * Walk a door. Legality comes from the engine (`visibleDoors` — gated
 * doors refuse; the world reducer enforces adjacency/blocks again
 * underneath). Records the directed edge for the fog-of-war map.
 * Returns whether the move happened; the caller resolves arrival.
 */
export function labyrinthMoveAction(store: AppStore, to: string): boolean {
    const session = sessionOf(store);
    if (!session) return false;
    const state = store.getState();
    const act = getAporiaAct(session.actId);
    const from = state.world.currentMap.currentNode;
    const progress = labyrinthProgressOf(state as unknown as GameState);
    const door = visibleDoors(act, progress, from).find((d) => d.to === to);
    if (!door || door.gated) return false;
    store.setState({
        world: moveToNode(state.world, to),
        labyrinth: recordWalk(progress, from, to),
        labyrinthUi: { session: { ...session, lastRemark: null } },
    });
    return true;
}

// ─── POI inspection (clues, fragments, secrets, baited clues) ────────────────

export interface LabyrinthInspectOutcome {
    remark: string;
    fragmentWord: string | null;
    revealedDisplay: string | null;
    trap: 'encounter' | 'hazard' | null;
}

/**
 * Inspect a POI. First inspection may yield a fragment, reveal a
 * secret door (also unblocked on the world map so traversal agrees
 * with `visibleDoors`), or spring a baited clue:
 *
 * - `trap: 'encounter'` — `resolvePoiTrap` generates the foe and the
 *   pending event is seeded on the event slice, so the same
 *   combat-prelude modal that handles arrival encounters rises.
 * - `trap: 'hazard'` — launches "the building fights you" (the hazard
 *   minigame), mirroring how arrival hazards run in mobile: the
 *   minigame's outcome is the only thing that touches VITAE.
 */
export function labyrinthInspectAction(
    store: AppStore,
    poiId: string,
): LabyrinthInspectOutcome | null {
    const session = sessionOf(store);
    if (!session) return null;
    const state = store.getState();
    const act = getAporiaAct(session.actId);
    const nodeId = state.world.currentMap.currentNode;
    const result = inspectPoi(
        act,
        labyrinthProgressOf(state as unknown as GameState),
        nodeId,
        poiId,
    );

    let world = state.world;
    let revealedDisplay: string | null = null;
    if (result.revealedDoorTo) {
        world = {
            ...world,
            currentMap: unblockMapRoute(world.currentMap, nodeId, result.revealedDoorTo),
        };
        revealedDisplay = getRoom(act, result.revealedDoorTo).display;
    }

    const outcome: LabyrinthInspectOutcome = {
        remark: result.remark,
        fragmentWord: result.fragment?.word ?? null,
        revealedDisplay,
        trap: result.trap ?? null,
    };

    store.setState({
        world,
        labyrinth: result.progress,
        labyrinthUi: {
            session: { ...session, lastRemark: { poiId, ...outcome } },
        },
    });

    if (result.trap === 'encounter') {
        const withProgress = store.getState() as unknown as GameState;
        const sprung = resolvePoiTrap(withProgress, act, 'encounter');
        store.setState({
            event: {
                ...EMPTY_EVENT_SLICE,
                pending: sprung,
                sourceNodeType: 'labyrinth-trap',
            },
        });
    } else if (result.trap === 'hazard') {
        beginHazardAction(store);
    }

    if (result.fragment || result.revealedDoorTo || result.trap) {
        saveQuietly(store);
    }
    return outcome;
}

// ─── Gates, hints, debt, the finale ──────────────────────────────────────────

export interface LabyrinthGateOutcome {
    ok: boolean;
    line: string;
}

/** Lay words at the room's gate. Success also unblocks the world route. */
export function labyrinthSubmitGateAction(
    store: AppStore,
    words: readonly string[],
): LabyrinthGateOutcome | null {
    const session = sessionOf(store);
    if (!session) return null;
    const state = store.getState();
    const act = getAporiaAct(session.actId);
    const nodeId = state.world.currentMap.currentNode;
    const gate = act.gates.find((g) => g.roomId === nodeId);
    if (!gate) return null;
    const result = submitGateAnswer(
        act,
        labyrinthProgressOf(state as unknown as GameState),
        nodeId,
        words,
    );
    let world = state.world;
    if (result.ok) {
        world = {
            ...world,
            currentMap: unblockMapRoute(world.currentMap, gate.roomId, gate.to),
        };
    }
    store.setState({ world, labyrinth: result.progress });
    if (result.ok) saveQuietly(store);
    return { ok: result.ok, line: result.line };
}

export interface LabyrinthHintOutcome {
    line: string;
    price: number;
}

/** Ask the Sophist. Price in coin via `hintPrice`; refuses when broke. */
export function labyrinthBuyHintAction(
    store: AppStore,
    tier: 1 | 2 | 3,
): LabyrinthHintOutcome | null {
    const session = sessionOf(store);
    if (!session) return null;
    const state = store.getState();
    const progress = labyrinthProgressOf(state as unknown as GameState);
    const price = hintPrice(progress, tier);
    if ((state.player?.currency ?? 0) < price) return null;
    const act = getAporiaAct(session.actId);
    const nodeId = state.world.currentMap.currentNode;
    const { progress: next, line } = buyHint(act, progress, nodeId, tier);
    store.setState({
        labyrinth: next,
        player: { ...state.player, currency: state.player.currency - price },
    });
    saveQuietly(store);
    return { line, price };
}

/** Settle debt points at the Fourth Ledger (act III quest room only). */
export function labyrinthSettleDebtAction(store: AppStore, points: number): number {
    const session = sessionOf(store);
    if (!session) return 0;
    const state = store.getState();
    const progress = labyrinthProgressOf(state as unknown as GameState);
    const outstanding = debtPoints(progress);
    const affordable = Math.floor((state.player?.currency ?? 0) / SETTLE_PRICE_PER_POINT);
    const settled = Math.max(0, Math.min(points, outstanding, affordable));
    if (settled === 0) return 0;
    store.setState({
        labyrinth: settleDebt(progress, settled),
        player: {
            ...state.player,
            currency: state.player.currency - settled * SETTLE_PRICE_PER_POINT,
        },
    });
    saveQuietly(store);
    return settled;
}

/**
 * Speak a name at the finale. True name → the Sophist stands aside
 * (`spared`, act complete, no fight). The name is never rendered by
 * the UI — the player types what they deduced.
 */
export function labyrinthSpeakNameAction(store: AppStore, spoken: string): boolean {
    const session = sessionOf(store);
    if (!session) return false;
    if (!isSophistTrueName(spoken)) return false;
    labyrinthRecordBossOutcomeAction(store, 'spared');
    return true;
}

/**
 * Record the act boss outcome. Completing act I/II re-enters at the
 * next act (the descent); completing act III marks the labyrinth
 * walked (the Unfounded Door).
 */
export function labyrinthRecordBossOutcomeAction(
    store: AppStore,
    outcome: LabyrinthBossOutcome,
): void {
    const session = sessionOf(store);
    if (!session) return;
    const state = store.getState();
    const act = getAporiaAct(session.actId);
    let progress = recordBossOutcome(
        labyrinthProgressOf(state as unknown as GameState),
        act.id,
        outcome,
    );
    if (act.descent === 'exit') {
        progress = { ...progress, completed: true };
        store.setState({ labyrinth: progress });
        saveQuietly(store);
        return;
    }
    store.setState({ labyrinth: progress });
    enterLabyrinthAction(store, act.descent);
}
