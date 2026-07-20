import { describe, expect, it } from '@jest/globals';

import { pulsePeakScale } from '../pulse';
import { JUICE_TIMING } from '../juice.timing';

describe('pulsePeakScale', () => {
    it('hits the full doctrine-moment peak at intensity 1', () => {
        expect(pulsePeakScale(1)).toBeCloseTo(JUICE_TIMING.pulse.peakScale, 5);
    });

    it('is a subtler nudge at intensity 0 — settles at 1', () => {
        expect(pulsePeakScale(0)).toBeCloseTo(1, 5);
    });

    it('interpolates linearly between the two', () => {
        const mid = pulsePeakScale(0.5);
        expect(mid).toBeCloseTo((1 + JUICE_TIMING.pulse.peakScale) / 2, 5);
    });

    it('clamps intensity to [0, 1]', () => {
        expect(pulsePeakScale(5)).toBeCloseTo(JUICE_TIMING.pulse.peakScale, 5);
        expect(pulsePeakScale(-5)).toBeCloseTo(1, 5);
    });
});
