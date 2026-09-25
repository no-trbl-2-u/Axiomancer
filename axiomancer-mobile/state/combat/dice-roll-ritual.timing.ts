/**
 * Spec 33 §1/§4 (Phase D6f — The Roll Ritual) — the ONE presenter-adjacent home
 * for every timing/easing constant the dice tumble uses. Choreography logic
 * (the state machine in `dice-roll-ritual.ts`, the visuals in `RollingDie.tsx`)
 * reads these; nobody hard-codes a duration. Tune the feel HERE without touching
 * a line of choreography — the owner feel-rank knob (ritual duration vs. combat
 * pace) lives in `tumbleDurationMs` + `staggerMs`.
 *
 * The choreography is the HAZARD CAST (owner call 2026-07-19): the proven
 * `TumblingDie` fall-in from `components/hazard/HazardOverlays.tsx` — each die
 * drops from above the tray rotated hard, lands, and micro-bounces to rest.
 * The drop geometry constants below mirror that overlay verbatim.
 *
 * They describe PRESENTATION; the engine RNG already decided every outcome — nothing here can
 * change what a settled die shows (dice-honesty law, 2026-07-09).
 */

export interface DiceRollTiming {
    /** Per-die start offset so the eye can track four dice landing in sequence. */
    readonly staggerMs: number;
    /** How long a single die spends falling before its landing springs fire. */
    readonly tumbleDurationMs: number;
    /** Drop height (px) the die falls in from above the tray line. */
    readonly dropPx: number;
    /** Entry rotation (deg) the die carries at the top of the fall (unwinds to 0). */
    readonly entryRotateDeg: number;
    /** Peak micro-bounce lift (px) after the landing (the settle overshoot). */
    readonly bounceLiftPx: number;
    /** Peak micro-bounce wobble (deg) after the landing. */
    readonly bounceRotateDeg: number;
    /** Landing spring — the first bounce off the tray line. */
    readonly landSpring: { readonly damping: number; readonly stiffness: number };
    /** Settle spring — the final rest onto the engine-rolled face. */
    readonly settleSpring: { readonly damping: number; readonly stiffness: number };
}

/**
 * Round-start / reroll ritual timing. A four-die stagger over a ~480ms fall
 * lands the whole ritual in about a second — the same physical beat as the
 * hazard minigame's dice-cast interstitial (fall + rotate + spring bounce).
 */
export const DICE_ROLL_TIMING: DiceRollTiming = {
    staggerMs: 130,
    tumbleDurationMs: 480,
    dropPx: 160,
    entryRotateDeg: -40,
    bounceLiftPx: 18,
    bounceRotateDeg: 14,
    landSpring: { damping: 6, stiffness: 220 },
    settleSpring: { damping: 9, stiffness: 180 },
};
