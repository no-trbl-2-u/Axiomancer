/**
 * Philosophy module barrel — 3-axis alignment engine + 27-cell library.
 *
 * Public surface (Phase 42):
 *   - Types: PhilosophicalAlignment, AxisBucket, AlignmentFallacy,
 *     PhilosophicalAlignmentCell
 *   - Engine: bucketAxis, getAlignmentCell, applyAlignmentDelta,
 *     defaultAlignment
 *   - Constants: AXIS_HIGH_THRESHOLD, AXIS_LOW_THRESHOLD
 *   - Content: philosophicalAlignmentLibrary
 */

export type {
    AxisBucket,
    PhilosophicalAlignment,
    AlignmentFallacy,
    PhilosophicalAlignmentCell,
} from './types';

export {
    bucketAxis,
    getAlignmentCell,
    applyAlignmentDelta,
    defaultAlignment,
    AXIS_HIGH_THRESHOLD,
    AXIS_LOW_THRESHOLD,
} from './alignment.engine';

export { philosophicalAlignmentLibrary } from './alignment.library';
