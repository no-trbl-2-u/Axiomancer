/**
 * Labyrinth engine — pure functions over `LabyrinthActDef` content and
 * `LabyrinthProgress`. No RNG anywhere in this module: traversal legality,
 * POI inspection, gate answers, the debt economy, and computed hints are
 * all deterministic. Randomness in the labyrinth lives exclusively in the
 * MapEvents pool roll (`resolveMapEvent`), which already takes injected RNG.
 *
 * Doctrine (W-01): solved space is solved (first-arrival events via
 * `consumedNodes`); guessing at gates is free and unlimited but every
 * refusal is ledgered (assertion debt); the finale's Borrowed Premise
 * stacks are capped at three and settleable at the Fourth Ledger.
 */

import type { NodeId } from '../types';
import type {
    LabyrinthActDef, LabyrinthActId, LabyrinthFragment, LabyrinthGateDef,
    LabyrinthGateResult, LabyrinthInspectResult, LabyrinthProgress,
    LabyrinthRoomDef, LabyrinthVisibleDoor,
} from './types';

// ─── Debt constants (design: DESIGN.md sections 2 + 6) ───────────────────────

/** Debt points per hint tier — a Conclusion weighs four Nudges. */
export const HINT_TIER_POINTS: Record<1 | 2 | 3, number> = { 1: 1, 2: 2, 3: 4 };
/** Debt points per refused gate/center submission. */
export const ASSERTION_POINTS = 1;
/** Borrowed Premise stack thresholds: >=1 point -> 1, >=6 -> 2, >=12 -> 3. */
export const BORROWED_PREMISE_THRESHOLDS = [1, 6, 12] as const;
/** Hard cap (softlock-proofing; see W-01 finale doctrine). */
export const BORROWED_PREMISE_CAP = 3;
/** Coin per debt point at the Fourth Ledger (the Sophist's Study). */
export const SETTLE_PRICE_PER_POINT = 30;

/** The Sophist's real name — the finale mercy key (C-01). Never rendered
 *  by clients; the player must type it. */
const TRUE_NAME = 'PROTAS';

/** Whether a spoken name is the Sophist's own (the naming rite). */
export function isSophistTrueName(spoken: string): boolean {
    return spoken.trim().toUpperCase() === TRUE_NAME;
}

export function edgeKey(from: NodeId, to: NodeId): string {
    return `${from}->${to}`;
}

export function createLabyrinthProgress(): LabyrinthProgress {
    return {
        currentAct: 'act1',
        pocket: [],
        inspectedPois: [],
        walkedEdges: [],
        revealedSecrets: [],
        openGates: [],
        assertionDebt: 0,
        hintPurchases: [],
        settledDebt: 0,
        waystones: [],
        bossOutcomes: {},
        actsCompleted: [],
        completed: false,
    };
}

export class LabyrinthContentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'LabyrinthContentError';
    }
}

export function getRoom(act: LabyrinthActDef, nodeId: NodeId): LabyrinthRoomDef {
    const room = act.rooms.find(r => r.nodeId === nodeId);
    if (!room) throw new LabyrinthContentError(`Room '${nodeId}' is not authored in ${act.id}.`);
    return room;
}

function displayOf(act: LabyrinthActDef, nodeId: NodeId): string {
    return act.rooms.find(r => r.nodeId === nodeId)?.display ?? '?';
}

function gateAt(act: LabyrinthActDef, roomId: NodeId): LabyrinthGateDef | undefined {
    return act.gates.find(g => g.roomId === roomId);
}

// ─── Traversal ────────────────────────────────────────────────────────────────

/**
 * Doors a client should list for a room: authored doors minus unrevealed
 * secrets. Gate doors are listed but flagged until answered.
 */
export function visibleDoors(
    act: LabyrinthActDef,
    progress: LabyrinthProgress,
    nodeId: NodeId,
): LabyrinthVisibleDoor[] {
    const room = getRoom(act, nodeId);
    const doors: LabyrinthVisibleDoor[] = [];
    for (const door of room.doors) {
        const key = edgeKey(nodeId, door.to);
        if (door.secret && !progress.revealedSecrets.includes(key)) continue;
        doors.push({
            to: door.to,
            display: displayOf(act, door.to),
            gated: Boolean(door.gate) && !progress.openGates.includes(key),
        });
    }
    return doors;
}

/** Whether walking `from -> to` is legal right now. */
export function canTraverse(
    act: LabyrinthActDef,
    progress: LabyrinthProgress,
    from: NodeId,
    to: NodeId,
): boolean {
    return visibleDoors(act, progress, from).some(d => d.to === to && !d.gated);
}

// ─── POI inspection ───────────────────────────────────────────────────────────

/**
 * Inspect a POI. Always returns the remark; on FIRST inspection also
 * yields the POI's fragment and/or reveals its secret door (single click —
 * the reveal never hides behind a second interaction).
 */
export function inspectPoi(
    act: LabyrinthActDef,
    progress: LabyrinthProgress,
    nodeId: NodeId,
    poiId: string,
): LabyrinthInspectResult {
    const room = getRoom(act, nodeId);
    const poi = room.pois.find(p => p.id === poiId);
    if (!poi) throw new LabyrinthContentError(`POI '${poiId}' is not authored in room '${nodeId}'.`);

    const inspectKey = `${nodeId}:${poiId}`;
    if (progress.inspectedPois.includes(inspectKey)) {
        return { progress, remark: poi.remark };
    }

    let next: LabyrinthProgress = {
        ...progress,
        inspectedPois: [...progress.inspectedPois, inspectKey],
    };

    let fragment: LabyrinthFragment | undefined;
    if (poi.fragment) {
        fragment = { ...poi.fragment, sourceNodeId: nodeId };
        next = { ...next, pocket: [...next.pocket, fragment] };
    }

    let revealedDoorTo: NodeId | undefined;
    if (poi.revealsSecretDoorTo) {
        revealedDoorTo = poi.revealsSecretDoorTo;
        const forward = edgeKey(nodeId, revealedDoorTo);
        const backward = edgeKey(revealedDoorTo, nodeId);
        // A revealed secret door opens from both sides (retreat is allowed;
        // one-way secrets are authored as one-way doors instead).
        next = {
            ...next,
            revealedSecrets: [...next.revealedSecrets, forward, backward],
        };
    }

    return { progress: next, remark: poi.remark, fragment, revealedDoorTo, trap: poi.trap };
}

// ─── Walk history (fog-of-war map source) ────────────────────────────────────

/** Walked edges, tolerant of saves that predate the field. */
export function walkedEdgesOf(progress: LabyrinthProgress): readonly string[] {
    return progress.walkedEdges ?? [];
}

/** Record a walked directed edge (first walk only; order preserved). */
export function recordWalk(
    progress: LabyrinthProgress,
    from: NodeId,
    to: NodeId,
): LabyrinthProgress {
    const key = edgeKey(from, to);
    const walked = walkedEdgesOf(progress);
    if (walked.includes(key)) return progress;
    return { ...progress, walkedEdges: [...walked, key] };
}

// ─── Gates ────────────────────────────────────────────────────────────────────

/**
 * Words that arrive pre-confirmed at a gate ("the house remembers your
 * assents") — the concatenated answers of the earlier gates listed in
 * `preConfirmedByGates`, provided those gates are open.
 */
export function preConfirmedWords(
    allActs: readonly LabyrinthActDef[],
    progress: LabyrinthProgress,
    gate: LabyrinthGateDef,
): string[] {
    if (!gate.preConfirmedByGates || gate.preConfirmedByGates.length === 0) return [];
    const words: string[] = [];
    for (const roomId of gate.preConfirmedByGates) {
        for (const act of allActs) {
            const earlier = act.gates.find(g => g.roomId === roomId);
            if (!earlier) continue;
            if (progress.openGates.includes(edgeKey(earlier.roomId, earlier.to))) {
                words.push(...earlier.answer);
            }
        }
    }
    return words;
}

/**
 * Submit an ordered word sequence at a gate. Correct: the gate edge opens
 * permanently (fragments are proven, never consumed). Incorrect: the
 * submission is ledgered (+1 assertion debt) and a rotating refusal line
 * is returned. Words the player does not hold are rejected the same way —
 * asserting words you never found is still an assertion.
 */
export function submitGateAnswer(
    act: LabyrinthActDef,
    progress: LabyrinthProgress,
    roomId: NodeId,
    words: readonly string[],
): LabyrinthGateResult {
    const gate = gateAt(act, roomId);
    if (!gate) throw new LabyrinthContentError(`Room '${roomId}' has no gate in ${act.id}.`);

    const key = edgeKey(gate.roomId, gate.to);
    if (progress.openGates.includes(key)) {
        return { progress, ok: true, line: 'The way is already open.' };
    }

    const normalized = words.map(w => w.trim().toUpperCase()).filter(w => w.length > 0);
    const expected = gate.answer.map(w => w.toUpperCase());

    const held = new Set(progress.pocket.map(f => f.word.toUpperCase()));
    const holdsAll = normalized.every(w => held.has(w));

    const correct =
        holdsAll &&
        normalized.length === expected.length &&
        normalized.every((w, i) => w === expected[i]);

    if (correct) {
        return {
            progress: { ...progress, openGates: [...progress.openGates, key] },
            ok: true,
            line: gate.successLine,
        };
    }

    const debt = progress.assertionDebt + ASSERTION_POINTS;
    const line = gate.refusalLines[(debt - 1) % gate.refusalLines.length]
        ?? 'The door declines.';
    return {
        progress: { ...progress, assertionDebt: debt },
        ok: false,
        line,
    };
}

// ─── Hints (computed, deterministic — no authoring burden, no RNG) ───────────

/** Price of a hint at a given tier, rising with reuse of that tier. */
export function hintPrice(progress: LabyrinthProgress, tier: 1 | 2 | 3): number {
    const base: Record<1 | 2 | 3, number> = { 1: 10, 2: 40, 3: 120 };
    const uses = progress.hintPurchases.filter(h => h.tier === tier).length;
    return base[tier] * (uses + 1);
}

/**
 * Shortest-path next hop from `from` toward `goal`, walking only doors the
 * player could eventually use (secrets included — the Conclusion tier is
 * allowed to point at a door the player has not found yet; that is what
 * makes it ruinous). Gate edges are traversable for pathing (the gate is an
 * obstacle of knowledge, not geometry). Returns undefined when unreachable.
 */
export function nextHopToward(
    act: LabyrinthActDef,
    from: NodeId,
    goal: NodeId,
): NodeId | undefined {
    if (from === goal) return undefined;
    const prev = new Map<NodeId, NodeId>();
    const queue: NodeId[] = [from];
    const seen = new Set<NodeId>([from]);
    while (queue.length > 0) {
        const cur = queue.shift() as NodeId;
        for (const door of getRoom(act, cur).doors) {
            if (seen.has(door.to)) continue;
            seen.add(door.to);
            prev.set(door.to, cur);
            if (door.to === goal) {
                // Walk back to the first hop.
                let hop: NodeId = goal;
                while (prev.get(hop) !== from) hop = prev.get(hop) as NodeId;
                return hop;
            }
            queue.push(door.to);
        }
    }
    return undefined;
}

/**
 * Buy a hint in `nodeId`. Content is computed from the act definition:
 *   tier 1 (a Nudge)      — one true sentence about the room, unhelpfully put.
 *   tier 2 (a Reading)    — names what the room actually holds (fragment /
 *                           secret door / nothing), and whether it is honest.
 *   tier 3 (a Conclusion) — names the correct next door toward the act's
 *                           objective (the gate room, then the boss).
 * The purchase is recorded (debt); pricing is the caller's job via
 * `hintPrice` (currency lives on the Character, outside this module).
 */
export function buyHint(
    act: LabyrinthActDef,
    progress: LabyrinthProgress,
    nodeId: NodeId,
    tier: 1 | 2 | 3,
): { progress: LabyrinthProgress; line: string } {
    const room = getRoom(act, nodeId);
    const next: LabyrinthProgress = {
        ...progress,
        hintPurchases: [...progress.hintPurchases, { tier, nodeId }],
    };

    if (tier === 1) {
        const line = room.realm === 'path'
            ? 'You are not wasting your time. That is all I will say for this price.'
            : room.realm === 'loop'
                ? 'You have been making excellent time in a circle.'
                : 'The house has swallowed. You are past the teeth.';
        return { progress: next, line };
    }

    if (tier === 2) {
        const honest = room.pois.find(p => p.fragment?.kind === 'honest');
        const forged = room.pois.find(p => p.fragment?.kind === 'counterfeit');
        const secret = room.pois.find(p => p.revealsSecretDoorTo);
        const line = secret
            ? `This room has one more way out than you have counted. Ask the ${secret.label.toLowerCase()}.`
            : honest
                ? `The ${honest.label.toLowerCase()} carries a word worth carrying.`
                : forged
                    ? `The word in this room is my colleague's work. Buy it a frame if you like.`
                    : 'Nothing here but architecture and consequences. Keep walking.';
        return { progress: next, line };
    }

    // Tier 3 — the Conclusion. Point at the door toward the act objective:
    // the unanswered gate room first, then the boss room.
    const gate = act.gates.find(g => !progress.openGates.includes(edgeKey(g.roomId, g.to)));
    const goal = gate ? gate.roomId : act.bossRoom;
    const hop = nodeId === goal
        ? undefined
        : nextHopToward(act, nodeId, goal);
    const line = hop
        ? `You want the door to ${displayOf(act, hop)}. There. I have done your thinking; the bill reflects it.`
        : gate && nodeId === gate.roomId
            ? `You are standing at the question. The first word is ${gate.answer[0]}. The rest you will buy separately.`
            : 'You are already where you need to be. That knowledge is free; the next one will not be.';
    return { progress: next, line };
}

// ─── Debt / the finale ────────────────────────────────────────────────────────

/** Total outstanding debt points (hints + assertions - settled), floor 0. */
export function debtPoints(progress: LabyrinthProgress): number {
    const hintPts = progress.hintPurchases.reduce(
        (sum, h) => sum + HINT_TIER_POINTS[h.tier], 0,
    );
    return Math.max(0, hintPts + progress.assertionDebt * ASSERTION_POINTS - progress.settledDebt);
}

/** Borrowed Premise stacks for the finale — capped, visible pre-fight. */
export function borrowedPremiseStacks(progress: LabyrinthProgress): number {
    const points = debtPoints(progress);
    let stacks = 0;
    for (const threshold of BORROWED_PREMISE_THRESHOLDS) {
        if (points >= threshold) stacks += 1;
    }
    return Math.min(stacks, BORROWED_PREMISE_CAP);
}

/** Settle debt points at the Fourth Ledger (the Sophist's Study). */
export function settleDebt(
    progress: LabyrinthProgress,
    points: number,
): LabyrinthProgress {
    if (points <= 0) return progress;
    return { ...progress, settledDebt: progress.settledDebt + points };
}

// ─── Waystones (act III checkpoints) ─────────────────────────────────────────

/** Activate a waystone on arrival. Idempotent. */
export function activateWaystone(
    progress: LabyrinthProgress,
    nodeId: NodeId,
): LabyrinthProgress {
    if (progress.waystones.includes(nodeId)) return progress;
    return { ...progress, waystones: [...progress.waystones, nodeId] };
}

/** The waystone an ejection returns to: the last activated, else the entry. */
export function lastWaystone(
    act: LabyrinthActDef,
    progress: LabyrinthProgress,
): NodeId {
    return progress.waystones[progress.waystones.length - 1] ?? act.entry;
}

// ─── The naming fork (ADR-0007 routing) ──────────────────────────────────────

/**
 * Whether the finale's naming fork is open: closed when BOTH earlier act
 * bosses were exploited ("I do not take my name from that mouth").
 */
export function namingForkOpen(progress: LabyrinthProgress): boolean {
    return !(progress.bossOutcomes.act1 === 'exploited'
        && progress.bossOutcomes.act2 === 'exploited');
}

/** Record an act boss outcome. */
export function recordBossOutcome(
    progress: LabyrinthProgress,
    act: LabyrinthActId,
    outcome: 'slain' | 'spared' | 'exploited',
): LabyrinthProgress {
    return {
        ...progress,
        bossOutcomes: { ...progress.bossOutcomes, [act]: outcome },
        actsCompleted: progress.actsCompleted.includes(act)
            ? progress.actsCompleted
            : [...progress.actsCompleted, act],
    };
}
