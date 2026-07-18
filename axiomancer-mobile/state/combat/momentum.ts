/**
 * Combat momentum wheel — UI-only helpers (2026-07-02, owner-directed;
 * ported engine-native Phase 31/EA-6).
 *
 * Playing cards whose stances step AROUND the wheel — heart → body → mind →
 * heart… (each stance pressing the advantage over the last, the RPS "beats"
 * chain) — builds momentum: the FIRST card of a cycle starts the wheel on
 * ITS stance (any node); each subsequent card must be the NEXT stance in
 * wheel order — right stance lights the next node, wrong stance RESETS the
 * wheel; lighting all three nodes completes the cycle and grants a WILD
 * momentum die.
 *
 * The advance/reset/grant RULES now live engine-native
 * (`axiomancer-mechanics/src/Combat/combat.engine.ts`'s
 * `advanceMomentumWheel`) — `CombatEncounterPanel` reads the wheel state and
 * the granted die straight off the engine via the presenter's
 * `CombatViewModel.momentum`. This module keeps only the pure UI-side
 * helpers `CombatBoard`'s `MomentumWheel` chip needs for its a11y hint.
 */

export type WheelStance = 'heart' | 'body' | 'mind';

/** Wheel order — the "beats" chain: heart beats body beats mind beats heart. */
export const WHEEL_ORDER: readonly WheelStance[] = ['heart', 'body', 'mind'];

export function isWheelStance(s: unknown): s is WheelStance {
    return s === 'heart' || s === 'body' || s === 'mind';
}

export function nextWheelStance(s: WheelStance): WheelStance {
    return WHEEL_ORDER[(WHEEL_ORDER.indexOf(s) + 1) % WHEEL_ORDER.length];
}

/** The stance that would light the NEXT node (null while the wheel is empty). */
export function wheelNext(lit: readonly WheelStance[]): WheelStance | null {
    const last = lit[lit.length - 1];
    return last === undefined ? null : nextWheelStance(last);
}

// ── Spec 33 §3 (Phase D6b, FLAG-ON ONLY) — the Momentum-V2 chain a11y ─────────
//
// Spec-33 momentum is a single chain `{ color, length } | null` (NOT the old
// three-node wheel). A BREAK resets it to null and must be taught LOUDLY; a
// SURGE (length reached the ceiling) forges a temporary gold die and also resets
// to null. These flag-on states all read as null momentum, so the a11y sentence
// is driven by the transient break/surge flags the presenter derives from the
// event log — not by the null value alone.

/** The a11y sentence for the Momentum-V2 chain chip. */
export function momentumV2A11y(m: {
    color: WheelStance | null;
    length: number;
    next: WheelStance | null;
    surgeAt: number;
    broke: boolean;
    surged: boolean;
}): string {
    if (m.surged) {
        return 'Momentum SURGED — a wild momentum die waits in your tray; the chain resets.';
    }
    if (m.broke) {
        return 'Momentum BROKEN — the chain collapsed to nothing. Play the right next stance to rebuild it.';
    }
    if (m.color === null || m.length === 0) {
        return 'No momentum — play any stance to start the chain.';
    }
    return `Momentum ${m.length} of ${m.surgeAt} — chain on ${m.color.toUpperCase()};`
        + ` next stance ${m.next?.toUpperCase() ?? ''} to advance.`;
}
