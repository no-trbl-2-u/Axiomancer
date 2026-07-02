/**
 * Combat momentum wheel (2026-07-02, owner-directed).
 *
 * Playing cards whose stances step AROUND the wheel — heart → body → mind →
 * heart… (each stance pressing the advantage over the last, the RPS "beats"
 * chain) — builds momentum:
 *
 *   · the FIRST card of a cycle starts the wheel on ITS stance (any node);
 *   · each subsequent card must be the NEXT stance in wheel order — right
 *     stance lights the next node, wrong stance RESETS the wheel (the wrong
 *     card starts a fresh cycle on its own node);
 *   · lighting all three nodes completes the cycle: the wheel empties and the
 *     player is granted a WILD momentum die (engine-native `color: 'wild'`,
 *     `temporary: true`) — it can power ANY card, with the wild colour-match
 *     bonus, through the exact drag-to-power interaction the player already
 *     knows. While that die is live, plays don't advance the wheel.
 *
 * Pure module — the panel owns the wiring; the presenter/engine stay untouched.
 * TODO(engine): fold momentum into axiomancer-mechanics as a first-class rule
 * so the grant isn't a host-side state write (see CombatEncounterPanel).
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

export interface WheelAdvance {
    /** Stances lit after this play, in play order ([] right after a completed cycle). */
    lit: WheelStance[];
    /** True when this play lit the third node — the cycle completed. */
    completed: boolean;
}

/**
 * Advance the wheel with a played stance.
 *   [] + s            → [s]                 (start anywhere)
 *   […, last] + next  → […, last, next]     (right stance lights on)
 *   […, last] + wrong → [wrong]             (reset; the wrong card restarts)
 *   third node lit    → { lit: [], completed: true }
 */
export function advanceWheel(lit: readonly WheelStance[], played: WheelStance): WheelAdvance {
    const last = lit[lit.length - 1];
    const next = last === undefined || played !== nextWheelStance(last) ? [played] : [...lit, played];
    if (next.length >= WHEEL_ORDER.length) return { lit: [], completed: true };
    return { lit: next, completed: false };
}

/** The stance that would light the NEXT node (null while the wheel is empty). */
export function wheelNext(lit: readonly WheelStance[]): WheelStance | null {
    const last = lit[lit.length - 1];
    return last === undefined ? null : nextWheelStance(last);
}

const MOMENTUM_DIE_PREFIX = 'momentum-';

export function momentumDieId(n: number): string {
    return `${MOMENTUM_DIE_PREFIX}${n}`;
}

export function isMomentumDieId(id: string): boolean {
    return id.startsWith(MOMENTUM_DIE_PREFIX);
}
