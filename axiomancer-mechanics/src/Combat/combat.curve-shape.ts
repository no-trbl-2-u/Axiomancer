/**
 * Win-rate CURVE-SHAPE evaluation — grading a deck across the stage
 * progression, not at a single point.
 *
 * The balance-band e2e checks each stage's win rate INDEPENDENTLY, so a
 * dominance curve that never falls off (e.g. early 80% / mid 78% / late 75%,
 * or a flat 100/100/100) passes every per-stage band while being exactly the
 * anti-pattern the deck-progression doctrine forbids: a starter preset that
 * never needs replacing (VISION.md → Combat vision, 2026-07-08).
 *
 * This module is the SHAPE witness. It is deck-class-aware because the healthy
 * shape depends on what the deck is FOR:
 *
 *   - `starter` presets are early/mid-game decks by design (the player trades
 *     into a mid-game deck after the labyrinth). Their healthy curve is
 *     MONOTONE NON-INCREASING with a real total decay — high early, decaying to
 *     a soft loss late. VISION targets early ~0.80 → mid ~0.50 → late ~0.25-0.35.
 *   - `late` presets (NOT YET BUILT — the class exists here so the assertion has
 *     room for them) are the replacement decks. Their healthy curve is the
 *     MIRROR: MONOTONE NON-DECREASING with a real total RISE — irrelevant early,
 *     coming online through mid, competitive late. (The impossible-stage hard
 *     wall is a SEPARATE check — universal to every deck class — not part of the
 *     curve shape.)
 *
 * Pure functions, no RNG, no I/O — safe to unit-test hermetically and to call
 * from the sim e2e over real preset win rates.
 */

import { COMBAT_STAGE_ORDER, type CombatStageId } from './combat.stage-profiles';

/** The design intent of a deck, which fixes the shape its curve must take. */
export type WinRateCurveClass = 'starter' | 'late';

/** One measured point on a deck's win-rate curve (same seeds across stages). */
export interface WinRateCurvePoint {
    stage: CombatStageId;
    winRate: number;
}

/** Tolerances for a curve-shape check (all in win-rate fraction units, 0–1). */
export interface CurveShapeTolerances {
    /** How far a step may move AGAINST the class direction before it counts as a
     *  real inversion (absorbs enemy-mix + finite-run noise). */
    monotoneEpsilon: number;
    /** The minimum |first − last| the curve must move in the class direction —
     *  a starter must DECAY at least this much; a late deck must RISE at least
     *  this much. Below it, the curve is "flat" (dominance / dead-on-arrival). */
    minTotalMove: number;
}

/**
 * PLAYTEST-CALIBRATION — the live tolerances per deck class.
 *
 * `minTotalMove` 0.30 is a conservative floor derived from the VISION curve
 * (early ~0.80 → late ~0.25-0.35 ⇒ ~0.45-0.55 of intended decay): a deck that
 * moves less than 30 points across its whole design window has not meaningfully
 * fallen off (starter) or come online (late). `monotoneEpsilon` 0.10 lets a
 * single step drift against the trend by up to 10 points (enemy-mix noise at
 * 30-60 runs) without flagging a false inversion. Ratchet toward the VISION
 * spread as the library is proven; do NOT loosen to make a failing preset pass —
 * a preset that cannot clear a sane decay is a FINDING (see the deck-tuning
 * report), not a reason to relax the band.
 */
export const CURVE_SHAPE_TOLERANCES: Readonly<Record<WinRateCurveClass, CurveShapeTolerances>> = {
    starter: { monotoneEpsilon: 0.10, minTotalMove: 0.30 },
    late: { monotoneEpsilon: 0.10, minTotalMove: 0.30 },
};

/** The result of a curve-shape evaluation. */
export interface WinRateCurveResult {
    pass: boolean;
    deckClass: WinRateCurveClass;
    /** Points sorted into campaign order (early → mid → late). */
    ordered: WinRateCurvePoint[];
    /** Signed first→last move (positive = rose, negative = decayed). */
    totalMove: number;
    /** Human-readable rule violations ('' set means the curve is healthy). */
    violations: string[];
    tolerances: CurveShapeTolerances;
}

/** Campaign rank of a stage (lower = earlier); non-curve stages sort last. */
function stageRank(stage: CombatStageId): number {
    const i = COMBAT_STAGE_ORDER.indexOf(stage);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
}

/**
 * Evaluates whether a deck's win-rate curve has the SHAPE its class requires.
 *
 * `starter`: monotone non-increasing (each step may rise by at most
 * `monotoneEpsilon`) AND first − last ≥ `minTotalMove` (real decay).
 * `late`: the mirror — monotone non-decreasing AND last − first ≥ `minTotalMove`.
 *
 * The `impossible` stage, if present, is IGNORED here (its hard-wall ceiling is
 * a separate, class-independent check). Fewer than two curve points → a single
 * violation (nothing to shape).
 */
export function evaluateWinRateCurve(
    points: readonly WinRateCurvePoint[],
    deckClass: WinRateCurveClass,
    tolerances: CurveShapeTolerances = CURVE_SHAPE_TOLERANCES[deckClass],
): WinRateCurveResult {
    const ordered = points
        .filter(p => p.stage !== 'impossible')
        .slice()
        .sort((a, b) => stageRank(a.stage) - stageRank(b.stage));

    const violations: string[] = [];
    const first = ordered[0]?.winRate ?? 0;
    const last = ordered[ordered.length - 1]?.winRate ?? 0;
    const totalMove = last - first;

    if (ordered.length < 2) {
        violations.push(`need ≥2 curve points to grade a shape (got ${ordered.length})`);
        return { pass: false, deckClass, ordered, totalMove, violations, tolerances };
    }

    const { monotoneEpsilon, minTotalMove } = tolerances;
    const dir = deckClass === 'starter' ? 'decreasing' : 'increasing';

    // Monotonicity: each adjacent step must not move against the class direction
    // by more than the epsilon.
    for (let i = 1; i < ordered.length; i++) {
        const prev = ordered[i - 1];
        const cur = ordered[i];
        const step = cur.winRate - prev.winRate; // +ve = rose
        if (deckClass === 'starter' && step > monotoneEpsilon) {
            violations.push(
                `non-monotone (${dir}): ${cur.stage} ${cur.winRate.toFixed(2)} rose `
                + `${step.toFixed(2)} over ${prev.stage} ${prev.winRate.toFixed(2)} (> ε ${monotoneEpsilon})`,
            );
        }
        if (deckClass === 'late' && -step > monotoneEpsilon) {
            violations.push(
                `non-monotone (${dir}): ${cur.stage} ${cur.winRate.toFixed(2)} fell `
                + `${(-step).toFixed(2)} under ${prev.stage} ${prev.winRate.toFixed(2)} (> ε ${monotoneEpsilon})`,
            );
        }
    }

    // Total move: the curve must travel far enough in the class direction.
    const movedInDirection = deckClass === 'starter' ? -totalMove : totalMove;
    if (movedInDirection < minTotalMove) {
        violations.push(
            `flat curve: first→last moved ${totalMove.toFixed(2)} `
            + `(${deckClass} needs ${dir === 'decreasing' ? 'a decay' : 'a rise'} of ≥ ${minTotalMove})`,
        );
    }

    return { pass: violations.length === 0, deckClass, ordered, totalMove, violations, tolerances };
}
