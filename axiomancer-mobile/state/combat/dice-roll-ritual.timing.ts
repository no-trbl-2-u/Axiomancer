/**
 * Spec 33 §1/§4 (Phase D6f — The Roll Ritual) — the ONE presenter-adjacent home
 * for every timing/easing constant the dice tumble uses. Choreography logic
 * (the state machine in `dice-roll-ritual.ts`, the visuals in `RollingDie.tsx`)
 * reads these; nobody hard-codes a duration. Tune the feel HERE without touching
 * a line of choreography — the owner feel-rank knob (ritual duration vs. combat
 * pace) lives in `tumbleDurationMs` + `staggerMs`.
 *
 * All values are FLAG-ON only (the ritual never runs flag-off). They describe
 * PRESENTATION; the engine RNG already decided every outcome — nothing here can
 * change what a settled die shows (dice-honesty law, 2026-07-09).
 */

export interface DiceRollTiming {
    /** Per-die start offset so the eye can track four dice landing in sequence. */
    readonly staggerMs: number;
    /** How long a single die spends tumbling before its settle spring fires. */
    readonly tumbleDurationMs: number;
    /** Decorative face-cycle cadence during the tumble (the glyph flicker). */
    readonly faceCycleMs: number;
    /** Whole 3D turns the die spins through while tumbling (feel only). */
    readonly tumbleTurns: number;
    /** Peak lift (px) at the top of the tumble arc. */
    readonly liftPx: number;
    /** Peak scale pop at the top of the tumble arc. */
    readonly popScale: number;
    /** Settle spring — the landing bounce onto the engine-rolled face. */
    readonly settleSpring: { readonly damping: number; readonly stiffness: number; readonly mass: number };
}

/**
 * Round-start / reroll ritual timing. A four-die stagger of ~90ms over a ~600ms
 * tumble lands the whole ritual in well under a second — a physical beat that
 * does not fight the combat pace (the D7 qualitative pass confirms the feel WITH
 * the ritual in place; this is the tunable starting point).
 */
export const DICE_ROLL_TIMING: DiceRollTiming = {
    staggerMs: 90,
    tumbleDurationMs: 600,
    faceCycleMs: 70,
    tumbleTurns: 3,
    liftPx: 14,
    popScale: 1.14,
    settleSpring: { damping: 12, stiffness: 190, mass: 0.7 },
};
