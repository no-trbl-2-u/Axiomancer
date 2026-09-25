/**
 * Ledger module barrel — 3-axis alignment engine + 27-cell library
 * (né `src/Philosophy/`, renamed Phase 44h per spec 34 §6.2.2).
 *
 * Public surface:
 *   - Types: PhilosophicalAlignment, AxisBucket, BesettingSin,
 *     PhilosophicalAlignmentCell
 *   - Engine: bucketAxis, getAlignmentCell, applyAlignmentDelta,
 *     defaultAlignment
 *   - Constants: AXIS_HIGH_THRESHOLD, AXIS_LOW_THRESHOLD
 *   - Content: philosophicalAlignmentLibrary
 */

export type {
    PhilosophicalAlignment,
} from './types';

export {
    bucketAxis,
    getAlignmentCell,
    applyAlignmentDelta,
    defaultAlignment,
    AXIS_LOW_THRESHOLD,
} from './alignment.engine';

