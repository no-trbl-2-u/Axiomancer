/**
 * Momentum wheel rules (2026-07-02) — owner-specified behavior locked as tests:
 * start on any node, right stance advances, wrong stance resets (and the wrong
 * card starts the new cycle), the third node completes + empties the wheel.
 */

import { describe, expect, it } from '@jest/globals';

import {
    advanceWheel, isMomentumDieId, isWheelStance, momentumDieId, nextWheelStance, wheelNext,
} from '@/state/combat/momentum';

describe('momentum wheel', () => {
    it('starts a cycle on ANY node', () => {
        expect(advanceWheel([], 'heart')).toEqual({ lit: ['heart'], completed: false });
        expect(advanceWheel([], 'body')).toEqual({ lit: ['body'], completed: false });
        expect(advanceWheel([], 'mind')).toEqual({ lit: ['mind'], completed: false });
    });

    it('advances on the next wheel stance (heart → body → mind → heart)', () => {
        expect(nextWheelStance('heart')).toBe('body');
        expect(nextWheelStance('body')).toBe('mind');
        expect(nextWheelStance('mind')).toBe('heart');
        expect(advanceWheel(['heart'], 'body')).toEqual({ lit: ['heart', 'body'], completed: false });
        // wraps: a mind-start cycle runs mind → heart → body
        expect(advanceWheel(['mind'], 'heart')).toEqual({ lit: ['mind', 'heart'], completed: false });
    });

    it('the third node COMPLETES the cycle and empties the wheel', () => {
        expect(advanceWheel(['heart', 'body'], 'mind')).toEqual({ lit: [], completed: true });
        expect(advanceWheel(['mind', 'heart'], 'body')).toEqual({ lit: [], completed: true });
    });

    it('a wrong stance on the 2nd/3rd card RESETS — the wrong card starts fresh', () => {
        expect(advanceWheel(['heart'], 'mind')).toEqual({ lit: ['mind'], completed: false });
        expect(advanceWheel(['heart', 'body'], 'heart')).toEqual({ lit: ['heart'], completed: false });
        // repeating the same stance is also a reset (it is never the next node)
        expect(advanceWheel(['body'], 'body')).toEqual({ lit: ['body'], completed: false });
    });

    it('wheelNext names the stance that would light the next node', () => {
        expect(wheelNext([])).toBeNull();
        expect(wheelNext(['heart'])).toBe('body');
        expect(wheelNext(['mind', 'heart'])).toBe('body');
    });

    it('momentum die ids round-trip and non-wheel stances are rejected', () => {
        expect(isMomentumDieId(momentumDieId(3))).toBe(true);
        expect(isMomentumDieId('t1-d0')).toBe(false);
        expect(isWheelStance('wild')).toBe(false);
        expect(isWheelStance('heart')).toBe(true);
    });
});
