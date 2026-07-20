import { afterEach, describe, expect, it } from '@jest/globals';

import { resolveJuiceMode, shouldInstantSettleJuice } from '../instant';

type GlobalWithFlag = typeof globalThis & { __AXM_JUICE_INSTANT__?: unknown };

afterEach(() => {
    delete (globalThis as GlobalWithFlag).__AXM_JUICE_INSTANT__;
});

describe('shouldInstantSettleJuice', () => {
    it('is false when the global flag is unset', () => {
        expect(shouldInstantSettleJuice()).toBe(false);
    });

    it.each([true, 1, '1'])('is true when the global flag is %p', (value) => {
        (globalThis as GlobalWithFlag).__AXM_JUICE_INSTANT__ = value;
        expect(shouldInstantSettleJuice()).toBe(true);
    });

    it('is false for other truthy-but-unrecognized values', () => {
        (globalThis as GlobalWithFlag).__AXM_JUICE_INSTANT__ = 'yes';
        expect(shouldInstantSettleJuice()).toBe(false);
    });
});

describe('resolveJuiceMode', () => {
    it('animates when nothing forces instant', () => {
        expect(resolveJuiceMode({ reducedMotion: false })).toBe('animate');
    });

    it('is instant when reduced motion is on', () => {
        expect(resolveJuiceMode({ reducedMotion: true })).toBe('instant');
    });

    it('is instant when the per-call override is set', () => {
        expect(resolveJuiceMode({ reducedMotion: false, instant: true })).toBe('instant');
    });

    it('is instant when the global e2e escape hatch is set', () => {
        (globalThis as GlobalWithFlag).__AXM_JUICE_INSTANT__ = true;
        expect(resolveJuiceMode({ reducedMotion: false })).toBe('instant');
    });
});
