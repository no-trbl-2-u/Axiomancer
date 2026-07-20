import { describe, expect, it } from '@jest/globals';

import { shakeTimeline } from '../shake';
import { JUICE_TIMING } from '../juice.timing';

describe('shakeTimeline', () => {
    it('alternates sign and decays to the amplitude ceiling', () => {
        const steps = shakeTimeline('medium');
        const amp = JUICE_TIMING.shake.amplitudePx.medium;
        expect(steps[0].offsetPx).toBeCloseTo(-amp, 5);
        expect(Math.sign(steps[0].offsetPx)).not.toBe(Math.sign(steps[1].offsetPx));
        expect(Math.abs(steps[1].offsetPx)).toBeLessThan(Math.abs(steps[0].offsetPx));
    });

    it('always settles to exactly 0 on the final step', () => {
        const steps = shakeTimeline('high');
        expect(steps[steps.length - 1].offsetPx).toBe(0);
    });

    it('scales amplitude with intensity tier', () => {
        const low = shakeTimeline('low');
        const high = shakeTimeline('high');
        expect(Math.abs(high[0].offsetPx)).toBeGreaterThan(Math.abs(low[0].offsetPx));
    });

    it('every step carries a positive duration', () => {
        for (const step of shakeTimeline('low')) {
            expect(step.durationMs).toBeGreaterThan(0);
        }
    });
});
