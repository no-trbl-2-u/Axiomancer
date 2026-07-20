import { describe, expect, it } from '@jest/globals';

import { flashPeakOpacity } from '../flash';
import { JUICE_TIMING } from '../juice.timing';

describe('flashPeakOpacity', () => {
    it('scales linearly with intensity', () => {
        expect(flashPeakOpacity(1)).toBeCloseTo(JUICE_TIMING.flash.peakOpacity, 5);
        expect(flashPeakOpacity(0.5)).toBeCloseTo(JUICE_TIMING.flash.peakOpacity * 0.5, 5);
    });

    it('floors intensity at 0.1 so a zero-damage trigger is never invisible', () => {
        expect(flashPeakOpacity(0)).toBeCloseTo(JUICE_TIMING.flash.peakOpacity * 0.1, 5);
    });

    it('clamps to [0, 1] even for out-of-range intensity', () => {
        expect(flashPeakOpacity(-5)).toBeGreaterThanOrEqual(0);
        expect(flashPeakOpacity(50)).toBeLessThanOrEqual(1);
    });
});
