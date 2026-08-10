import { describe, expect, it } from '@jest/globals';

import { idleBreathProfile } from '../idle';
import { JUICE_TIMING } from '../juice.timing';

describe('idleBreathProfile', () => {
    it('breathes shallow and quick at weight 0', () => {
        const p = idleBreathProfile(0);
        expect(p.swellScale).toBeCloseTo(JUICE_TIMING.idle.breathScale.light, 5);
        expect(p.breathMs).toBeCloseTo(JUICE_TIMING.idle.breathMs.light, 5);
        expect(p.floatPx).toBeCloseTo(JUICE_TIMING.idle.floatPx.light, 5);
        expect(p.floatMs).toBeCloseTo(JUICE_TIMING.idle.floatMs.light, 5);
    });

    it('breathes deep and slow at weight 1', () => {
        const p = idleBreathProfile(1);
        expect(p.swellScale).toBeCloseTo(JUICE_TIMING.idle.breathScale.heavy, 5);
        expect(p.breathMs).toBeCloseTo(JUICE_TIMING.idle.breathMs.heavy, 5);
        expect(p.floatPx).toBeCloseTo(JUICE_TIMING.idle.floatPx.heavy, 5);
        expect(p.floatMs).toBeCloseTo(JUICE_TIMING.idle.floatMs.heavy, 5);
    });

    it('interpolates linearly between the two', () => {
        const mid = idleBreathProfile(0.5);
        const { breathMs, breathScale } = JUICE_TIMING.idle;
        expect(mid.swellScale).toBeCloseTo((breathScale.light + breathScale.heavy) / 2, 5);
        expect(mid.breathMs).toBeCloseTo((breathMs.light + breathMs.heavy) / 2, 5);
    });

    it('clamps weight to [0, 1]', () => {
        expect(idleBreathProfile(9).swellScale).toBeCloseTo(JUICE_TIMING.idle.breathScale.heavy, 5);
        expect(idleBreathProfile(-9).swellScale).toBeCloseTo(JUICE_TIMING.idle.breathScale.light, 5);
    });

    it('keeps the swell subtle — an idle is never a pulse', () => {
        expect(idleBreathProfile(1).swellScale).toBeLessThan(JUICE_TIMING.pulse.peakScale);
    });

    it('floats slower than it breathes, so the loops drift out of phase', () => {
        for (const w of [0, 0.5, 1]) {
            const p = idleBreathProfile(w);
            expect(p.floatMs).toBeGreaterThan(p.breathMs);
        }
    });
});
