import { describe, expect, it } from '@jest/globals';

import { numberPopTimeline } from '../numberPop';
import { JUICE_TIMING } from '../juice.timing';

describe('numberPopTimeline', () => {
    it('mirrors the shared JUICE_TIMING.numberPop constants', () => {
        expect(numberPopTimeline()).toEqual(JUICE_TIMING.numberPop);
    });

    it('rises before it finishes fading (delay + fade caps within the rise)', () => {
        const t = numberPopTimeline();
        expect(t.fadeDelayMs + t.fadeDurationMs).toBeLessThanOrEqual(t.riseDurationMs);
    });
});
