/**
 * Spec 33 §1/§4 (Phase D6f — The Roll Ritual) — the HERMETIC data layer of the
 * dice tumble.
 *
 * THE LAW THIS FILE ENFORCES: the engine RNG is the sole authority on outcomes
 * (dice-honesty, 2026-07-09). This module NEVER invents a face — it only plans
 * how to ANIMATE toward the faces the engine already rolled (the faces D6a's
 * `CombatDieVM` renders). `planDiceRoll(...).settledFace` is copied verbatim
 * from the input die every time, in every mode; that invariant is the whole
 * reason the visuals can be non-deterministic while the OUTCOME cannot.
 *
 * The visuals (`RollingDie.tsx`) aren't hermetic, but this — the state machine
 * and the per-die plan — is: pure functions over plain data, unit-tested.
 *
 * State machine (per die):
 *   idle ──roll(animate)──▶ tumbling ──settle/skip──▶ settled
 *   idle ──roll(instant)──────────────────────────▶ settled   (reduced-motion / e2e)
 *   settled ──roll──▶ (re-enters per the mode above; a reroll re-tumbles)
 */

export type DieRollState = 'idle' | 'tumbling' | 'settled';

/** animate = the full tumble; instant = snap to the settled face (no wait). */
export type RollMode = 'animate' | 'instant';

export type DieFace = 'special' | 'mana' | 'miss';

/** The subset of `CombatDieVM` the ritual reads — the engine-rolled result. */
export interface DieRollTarget {
    id: string;
    face?: DieFace;
    cracked?: boolean;
    isX?: boolean;
}

/** Per-die animation plan. `settledFace` ALWAYS equals the input die's face. */
export interface DieRollPlan {
    id: string;
    /** The face this die settles on — copied verbatim from the engine roll. */
    settledFace?: DieFace;
    /** An OVERHEAT-cracked die sits the ritual out (renders dead, never tumbles). */
    cracked: boolean;
    /** True only when this die actually plays the tumble (else it snaps settled). */
    tumbles: boolean;
    /** Stagger offset (ms) before this die begins its tumble. */
    startDelayMs: number;
    /** Tumble length (ms) before the settle spring; 0 when it does not tumble. */
    tumbleDurationMs: number;
    /** Resting state the die is in once the plan resolves. */
    settledState: Extract<DieRollState, 'settled'>;
}

export interface RollTimingLike {
    readonly staggerMs: number;
    readonly tumbleDurationMs: number;
}

/**
 * A stable signature of a die's RESULT (face + cracked). A round-start roll
 * changes every die's signature; a Press-Fate reroll changes only the rerolled
 * miss dice — so diffing signatures tells the ritual exactly which dice replay
 * the tumble (the cracked dice, unchanged, correctly sit it out).
 */
export function dieRollSignature(die: DieRollTarget): string {
    return `${die.face ?? '-'}:${die.cracked ? 'x' : '-'}:${die.isX ? 'x' : '-'}`;
}

/** Fold a die list into an id→signature map (the "previous roll" memo). */
export function rollSignatureMap(dice: readonly DieRollTarget[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const d of dice) out[d.id] = dieRollSignature(d);
    return out;
}

/**
 * Resolve the effective roll mode. Reduced-motion (OS preference) OR the
 * instant-settle escape hatch (the D6a-style runtime global the seeded e2e
 * sets) force `instant`; otherwise the ritual animates.
 */
export function resolveRollMode(opts: { reducedMotion?: boolean; instantSettle?: boolean }): RollMode {
    return opts.reducedMotion || opts.instantSettle ? 'instant' : 'animate';
}

/**
 * The instant-settle escape hatch — a runtime test global in the
 * `__AXM_COMBAT_SEED__` pattern. The seeded e2e sets
 * `globalThis.__AXM_DICE_INSTANT_SETTLE__` BEFORE the bundle boots so the roll
 * ritual snaps straight to the settled faces and the harness never waits on
 * (nor races) an animation. Inert in production — nothing sets it there.
 */
export function shouldInstantSettleDice(): boolean {
    const g = (globalThis as { __AXM_DICE_INSTANT_SETTLE__?: unknown }).__AXM_DICE_INSTANT_SETTLE__;
    return g === true || g === 1 || g === '1';
}

export type RollEvent = 'roll' | 'settle' | 'skip';

/**
 * The per-die transition function — the machine, in one pure step. `mode` only
 * matters for the `roll` event (animate → tumbling; instant → straight to
 * settled). `settle` and `skip` both land on `settled` from `tumbling`.
 */
export function nextRollState(current: DieRollState, event: RollEvent, mode: RollMode): DieRollState {
    switch (event) {
        case 'roll':
            return mode === 'instant' ? 'settled' : 'tumbling';
        case 'settle':
        case 'skip':
            return current === 'tumbling' ? 'settled' : current;
        default:
            return current;
    }
}

/**
 * Plan the ritual for a fresh set of engine-rolled dice.
 *
 * @param dice  the current (already-rolled) dice — the sole source of faces.
 * @param prev  the previous roll's signature map, or null for a first/round-start
 *              roll (null ⇒ every die is "changed" ⇒ every eligible die tumbles).
 * @param mode  animate or instant (instant ⇒ nothing tumbles; all snap settled).
 * @param timing stagger + tumble durations.
 *
 * Invariant (asserted in the suite): for every die and every mode,
 * `plan.settledFace === die.face`. The animation lands on the engine roll; it
 * never decides it.
 */
export function planDiceRoll(
    dice: readonly DieRollTarget[],
    prev: Record<string, string> | null,
    mode: RollMode,
    timing: RollTimingLike,
): DieRollPlan[] {
    let tumbleIndex = 0;
    return dice.map((die) => {
        const cracked = die.cracked === true;
        const changed = prev == null || prev[die.id] !== dieRollSignature(die);
        // A die tumbles only when: we're animating, its result actually changed
        // (a reroll re-tumbles just the rerolled dice), and it is neither an
        // OVERHEAT-cracked die (sits it out, visibly dead) nor a fate-X die.
        const tumbles = mode === 'animate' && changed && !cracked && !die.isX;
        // Stagger only the dice that tumble, in encounter order, so the four
        // land in a trackable sequence (cracked/instant dice take no slot).
        const startDelayMs = tumbles ? tumbleIndex++ * timing.staggerMs : 0;
        return {
            id: die.id,
            settledFace: die.face, // ← copied verbatim: the engine's result, never re-rolled
            cracked,
            tumbles,
            startDelayMs,
            tumbleDurationMs: tumbles ? timing.tumbleDurationMs : 0,
            settledState: 'settled',
        };
    });
}

/** Total wall-clock the ritual occupies (last die's delay + its tumble). 0 in instant mode. */
export function rollDurationMs(plan: readonly DieRollPlan[]): number {
    let max = 0;
    for (const p of plan) {
        if (!p.tumbles) continue;
        max = Math.max(max, p.startDelayMs + p.tumbleDurationMs);
    }
    return max;
}
