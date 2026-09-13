/**
 * Audit 2026-09-12 — one arrears threshold across the HUD, the SELF sheet
 * and /memoir.
 *
 * Both grace tracks hard-coded their tic at 2/10 (meter ≈ -60) and the new
 * S3-sheet-C12 legend then printed "arrears at 2 or below", while /memoir's
 * IN ARREARS chip starts at meter <= -34 (`AXIS_LOW_THRESHOLD`). The
 * geometry now derives from that engine constant.
 */

import { AXIS_LOW_THRESHOLD, bucketAxis } from '@mechanics';

import { graceBreakLegend, graceTrack, GRACE_TRACK_MAX } from '../character.engine';

describe('graceTrack (audit 2026-09-12)', () => {
    it('places the tic at the engine arrears boundary, not at a hardcoded tenth', () => {
        const t = graceTrack(0);
        expect(t.breakPct).toBeCloseTo(((AXIS_LOW_THRESHOLD + 100) / 200) * 100, 6);
        expect(t.breakPct).toBeCloseTo(33, 6);
        expect(t.max).toBe(GRACE_TRACK_MAX);
    });

    it('agrees with bucketAxis about who is in arrears at every meter value', () => {
        for (let meter = -100; meter <= 100; meter += 1) {
            expect(graceTrack(meter).inArrears).toBe(bucketAxis(meter) === 'low');
        }
    });

    it('draws the fill from the raw meter so the edge case lands on the right side of the tic', () => {
        const arrears = graceTrack(AXIS_LOW_THRESHOLD);
        const indifferent = graceTrack(AXIS_LOW_THRESHOLD + 1);
        expect(arrears.fillPct).toBeLessThanOrEqual(arrears.breakPct);
        expect(indifferent.fillPct).toBeGreaterThan(indifferent.breakPct);
        // Both print the same rounded tenth — which is why the legend names no number.
        expect(arrears.value).toBe(indifferent.value);
    });

    it('keeps the printed tenths on the old 1-10 scale', () => {
        expect(graceTrack(-100).value).toBe(1);
        expect(graceTrack(0).value).toBe(5);
        expect(graceTrack(100).value).toBe(10);
        expect(graceTrack(Number.NaN).value).toBe(5);
    });

    it('words the tic without a tenths figure', () => {
        expect(graceBreakLegend()).toContain('arrears');
        expect(graceBreakLegend()).not.toMatch(/\d/);
    });
});
