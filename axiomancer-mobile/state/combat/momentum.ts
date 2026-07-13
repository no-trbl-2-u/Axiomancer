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
