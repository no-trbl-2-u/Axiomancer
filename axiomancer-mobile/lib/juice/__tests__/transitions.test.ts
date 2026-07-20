import { describe, expect, it } from '@jest/globals';

import { transitionDurationMs } from '../transitions';
import { JUICE_TIMING } from '../juice.timing';

describe('transitionDurationMs', () => {
    it('uses the enter duration when becoming visible', () => {
        expect(transitionDurationMs(true)).toBe(JUICE_TIMING.transitions.enterMs);
    });

    it('uses the (shorter) exit duration when hiding', () => {
        expect(transitionDurationMs(false)).toBe(JUICE_TIMING.transitions.exitMs);
        expect(JUICE_TIMING.transitions.exitMs).toBeLessThan(JUICE_TIMING.transitions.enterMs);
    });
});
