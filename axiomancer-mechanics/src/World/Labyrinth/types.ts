/**
 * The Labyrinth (The Aporia) — type surface.
 *
 * Spec: `specs/world/W-01-aporia-labyrinth-continent.md`; room-level
 * content contract: `plan/labyrinth/acts/act*.md` (repo root). The
 * labyrinth is a directed room graph played MAZE-style: free travel
 * along the current room's doors (including back into cleared rooms),
 * one-shot first-arrival events, secret doors revealed by POI
 * inspection, act gates answered with carried Fragments, and a debt
 * economy (hints + refused assertions) that arms the finale.
 */

import type { NodeId } from '../types';
import type { MapName } from '../map.library';

/** Which realm a room belongs to (design taxonomy; drives hints/UI tags). */
export type LabyrinthRealm = 'path' | 'loop' | 'trap';

export type LabyrinthActId = 'act1' | 'act2' | 'act3';

/** A word the player can carry to a Gate of Assent / the Foundation. */
export interface LabyrinthFragment {
    /** Uppercase word, e.g. 'WALK'. */
    word: string;
    kind: 'honest' | 'counterfeit';
    sourceNodeId: NodeId;
}

/** A clickable point of interest inside a room scene. */
export interface LabyrinthPoiDef {
    /** Kebab slug, unique within the room. */
    id: string;
    /** Player-facing label, e.g. 'Relief of a stair'. */
    label: string;
    /** The Sophist's inspection line. */
    remark: string;
    /** Fragment yielded on FIRST inspection (one-shot). */
    fragment?: { word: string; kind: 'honest' | 'counterfeit' };
    /**
     * Secret door revealed on FIRST inspection (single click — remark and
     * reveal land in the same beat; never a second hidden step).
     */
    revealsSecretDoorTo?: NodeId;
    /**
     * The clue is bait: FIRST inspection springs a combat encounter or a
     * hazard (one-shot, like fragments). Never authored on a POI that
     * carries a fragment or reveals a secret door — a trap is a cost,
     * not a toll on progress.
     */
    trap?: 'encounter' | 'hazard';
}

/** An outgoing door. One-way doors simply have no mirror on the far side. */
export interface LabyrinthDoorDef {
    to: NodeId;
    /** Hidden until revealed via a POI (`revealsSecretDoorTo`). */
    secret?: boolean;
    /** Blocked until the act gate at this room is answered. */
    gate?: boolean;
}

export interface LabyrinthRoomDef {
    nodeId: NodeId;
    /** Player-facing display number (clue material; NOT the engine id). */
    display: string;
    name: string;
    realm: LabyrinthRealm;
    /** Scene description (what you see). */
    scene: string;
    /** The Sophist's narration for the accordion. */
    narration: string;
    pois: readonly LabyrinthPoiDef[];
    doors: readonly LabyrinthDoorDef[];
    /** Act III checkpoint room. Auto-activates and rests (one-shot). */
    waystone?: boolean;
    /** Arrival ejects the player to the last activated waystone. */
    eject?: boolean;
}

/** A Gate of Assent (acts I-II) or the Foundation's socket door (act III). */
export interface LabyrinthGateDef {
    /** Room holding the gate. */
    roomId: NodeId;
    /** Destination unblocked by the correct answer. */
    to: NodeId;
    /** The riddle the gate answers. */
    riddle: string;
    /** Correct words in walking order (uppercase). */
    answer: readonly string[];
    /**
     * The Foundation pre-confirms words already proven at earlier gates
     * ("the house remembers your assents"): indices into `answer` that
     * arrive pre-filled when the listed earlier gates are open.
     */
    preConfirmedByGates?: readonly string[];
    /** Rotating refusal lines; each refusal is ledgered (assertion debt). */
    refusalLines: readonly string[];
    successLine: string;
}

export interface LabyrinthActDef {
    id: LabyrinthActId;
    mapName: MapName;
    title: string;
    /** Entrance room (map starting node). */
    entry: NodeId;
    /**
     * Pre-boss ledger chamber — narrates the Sophist's line once on
     * arrival. Also gates the act3 "settle debt" action
     * (`labyrinth.cli.ts` / `state/presenters/labyrinth.engine.ts`), an
     * unrelated mechanic that reuses this same room id.
     */
    questRoom: NodeId;
    /**
     * Boss room + enemy slug. Typed as string (not `EnemySlug`) to keep
     * content modules decoupled from the enemy registry; the event-pool
     * builder validates the slug against `ENEMY_REGISTRY` at wiring time.
     */
    bossRoom: NodeId;
    bossSlug: string;
    /** Where the act leads after the boss. */
    descent: LabyrinthActId | 'exit';
    /** The act riddle as stated at the entrance. */
    riddle: string;
    gates: readonly LabyrinthGateDef[];
    rooms: readonly LabyrinthRoomDef[];
}

// ─── Progress (persisted on GameState.labyrinth) ─────────────────────────────

export interface LabyrinthHintPurchase {
    tier: 1 | 2 | 3;
    nodeId: NodeId;
}

export type LabyrinthBossOutcome = 'slain' | 'spared' | 'exploited';

/**
 * Cross-act labyrinth progress. Optional slice on `GameState`
 * (`state.labyrinth`) — absent until the player first enters the
 * continent; older saves need no migration (lazy default, like
 * `lastSeenAlignmentCells`).
 */
export interface LabyrinthProgress {
    currentAct: LabyrinthActId;
    pocket: LabyrinthFragment[];
    /** `${nodeId}:${poiId}` keys already inspected (fragments are one-shot). */
    inspectedPois: string[];
    /**
     * Directed edges actually walked, `${from}->${to}` keys in first-walk
     * order. Drives the fog-of-war map: an edge renders only in the
     * direction walked. Optional — absent on saves written before the
     * mobile UI landed (read through `walkedEdgesOf`).
     */
    walkedEdges?: string[];
    /** Edge keys `${from}->${to}` whose secret door is revealed. */
    revealedSecrets: string[];
    /** Edge keys `${from}->${to}` whose gate is answered. */
    openGates: string[];
    /** Refused gate/center submissions — the Ledger of Assertions. */
    assertionDebt: number;
    hintPurchases: LabyrinthHintPurchase[];
    /** Debt points repaid at the Fourth Ledger (the Sophist's Study). */
    settledDebt: number;
    /** Activated waystones in activation order (act III). */
    waystones: NodeId[];
    bossOutcomes: Partial<Record<LabyrinthActId, LabyrinthBossOutcome>>;
    actsCompleted: LabyrinthActId[];
    /** The Unfounded Door has been walked. */
    completed: boolean;
}

/** What a door looks like to a client (CLI list / UI POI). */
export interface LabyrinthVisibleDoor {
    to: NodeId;
    /** Display number of the destination room. */
    display: string;
    /** Present but locked (an unanswered gate). */
    gated: boolean;
}

export interface LabyrinthInspectResult {
    progress: LabyrinthProgress;
    remark: string;
    /** Fragment picked up by THIS inspection (undefined on re-inspect). */
    fragment?: LabyrinthFragment;
    /** Secret door revealed by THIS inspection. */
    revealedDoorTo?: NodeId;
    /**
     * Trap sprung by THIS inspection (undefined on re-inspect). The caller
     * resolves it — `resolvePoiTrap` builds and applies the event.
     */
    trap?: 'encounter' | 'hazard';
}

export interface LabyrinthGateResult {
    progress: LabyrinthProgress;
    ok: boolean;
    line: string;
}
