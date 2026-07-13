/**
 * Momentum wheel UI-only helpers (2026-07-02, owner-specified; Phase 31/EA-6
 * moved the advance/reset/grant rules engine-native — see
 * `axiomancer-mechanics/src/Combat/e2e/momentum-wheel.engine.test.ts` for
 * that truth table). This file pins only what `CombatBoard`'s
 * `MomentumWheel` chip still derives client-side: the wheel-successor
 * function and the next-node a11y hint.
 */

import { describe, expect, it } from '@jest/globals';

import { isWheelStance, nextWheelStance, wheelNext, WHEEL_ORDER } from '@/state/combat/momentum';

describe('momentum wheel — UI helpers', () => {
    it('advances on the next wheel stance (heart → body → mind → heart)', () => {
        expect(nextWheelStance('heart')).toBe('body');
        expect(nextWheelStance('body')).toBe('mind');
        expect(nextWheelStance('mind')).toBe('heart');
    });

    it('wheelNext names the stance that would light the next node', () => {
        expect(wheelNext([])).toBeNull();
        expect(wheelNext(['heart'])).toBe('body');
        expect(wheelNext(['mind', 'heart'])).toBe('body');
    });

    // WI-4 (2026-07-12 playtest) — the wheel aria reported the WRONG next stance
    // and a stale lit count. The hint MUST be the deterministic successor of the
    // last lit node for every wheel state.
    it('the next-hint is exactly the wheel successor of the last lit node (every state)', () => {
        for (const s of WHEEL_ORDER) {
            expect(wheelNext([s])).toBe(nextWheelStance(s));           // ♥→body, body→mind, mind→heart
        }
        for (const start of WHEEL_ORDER) {
            const nxt = nextWheelStance(start);
            expect(wheelNext([start, nxt])).toBe(nextWheelStance(nxt)); // the hint keeps advancing
        }
    });

    it('rejects non-wheel stances', () => {
        expect(isWheelStance('wild')).toBe(false);
        expect(isWheelStance('heart')).toBe(true);
    });
});
