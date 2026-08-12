/**
 * Philosophical alignment engine (Phase 42).
 *
 * Pure helpers: bucket a raw axis value into one of three buckets,
 * resolve the current `PhilosophicalAlignment` to a single cell in the
 * 27-cell library, and shift the alignment by a partial delta with
 * clamping.
 *
 * Save/load + reducer wiring live in `src/Game/`. This module is the
 * library-content-aware engine.
 */

import type {
    AxisBucket,
    PhilosophicalAlignment,
    PhilosophicalAlignmentCell,
} from './types';
import { philosophicalAlignmentLibrary } from './alignment.library';

/** Inclusive lower bound for the `'high'` bucket. */
export const AXIS_HIGH_THRESHOLD = 34;
/** Inclusive upper bound for the `'low'` bucket (negative side). */
export const AXIS_LOW_THRESHOLD = -34;

/**
 * Bucket a raw axis value into one of three buckets.
 *
 * Thresholds: values `<= -34` → `'low'`, values `>= 34` → `'high'`,
 * everything in between (including `±33`) → `'mid'`. Three equal-width
 * zones across `[-100, +100]`.
 */
export function bucketAxis(value: number): AxisBucket {
    if (value <= AXIS_LOW_THRESHOLD) return 'low';
    if (value >= AXIS_HIGH_THRESHOLD) return 'high';
    return 'mid';
}

/** Internal: lookup map keyed by `<epistemology>-<outlook>-<scope>` triple. */
const cellsByTriple: Map<string, PhilosophicalAlignmentCell> = (() => {
    const map = new Map<string, PhilosophicalAlignmentCell>();
    for (const cell of philosophicalAlignmentLibrary) {
        const key = `${cell.epistemology}-${cell.outlook}-${cell.scope}`;
        map.set(key, cell);
    }
    return map;
})();

/**
 * Resolve a `PhilosophicalAlignment` to its current cell.
 *
 * Buckets each axis and looks up the cell in the library. Throws if
 * the resulting triple isn't in the library — invariant: the library
 * is exhaustive once Unit 2 lands. Before Unit 2 ships only one
 * triple resolves; consumers calling this for unauthored triples
 * surface the error early.
 */
export function getAlignmentCell(alignment: PhilosophicalAlignment): PhilosophicalAlignmentCell {
    const key = `${bucketAxis(alignment.epistemology)}-${bucketAxis(alignment.outlook)}-${bucketAxis(alignment.scope)}`;
    const cell = cellsByTriple.get(key);
    if (!cell) {
        throw new Error(`getAlignmentCell: no cell for triple "${key}".`);
    }
    return cell;
}

/** Clamp a value to `[-100, +100]`. */
function clampAxis(value: number): number {
    if (value < -100) return -100;
    if (value > 100) return 100;
    return value;
}

/**
 * Return a new alignment with the given axes shifted by their deltas.
 * Missing axes in `delta` pass through unchanged. Each axis clamps to
 * `[-100, +100]`. Pure — does not mutate the input.
 */
export function applyAlignmentDelta(
    current: PhilosophicalAlignment,
    delta: Partial<PhilosophicalAlignment>,
): PhilosophicalAlignment {
    return {
        epistemology: clampAxis(current.epistemology + (delta.epistemology ?? 0)),
        outlook: clampAxis(current.outlook + (delta.outlook ?? 0)),
        scope: clampAxis(current.scope + (delta.scope ?? 0)),
    };
}

/** Default starting alignment — neutral on every axis. */
export function defaultAlignment(): PhilosophicalAlignment {
    return { epistemology: 0, outlook: 0, scope: 0 };
}
