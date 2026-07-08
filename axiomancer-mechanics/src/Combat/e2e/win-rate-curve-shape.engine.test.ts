/**
 * Hermetic unit e2e — the deck-class-aware win-rate curve-shape witness.
 *
 * Proves `evaluateWinRateCurve` FAILS on the dominance anti-patterns a
 * per-stage-independent band would wave through (flat / inverted curves) and
 * PASSES on the doctrine-shaped curve — for BOTH deck classes (a starter must
 * decay; a late deck must rise). Pure math, no sim, no RNG; the
 * `restoreAllMocks` hook is convention hygiene.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import {
    evaluateWinRateCurve, CURVE_SHAPE_TOLERANCES,
    type WinRateCurvePoint,
} from '../combat.curve-shape';

afterEach(() => vi.restoreAllMocks());

const curve = (early: number, mid: number, late: number): WinRateCurvePoint[] => [
    { stage: 'early', winRate: early },
    { stage: 'mid', winRate: mid },
    { stage: 'late', winRate: late },
];

describe('evaluateWinRateCurve — starter class (must decay)', () => {
    it('PASSES the doctrine-shaped decreasing curve (~0.80 → ~0.50 → ~0.30)', () => {
        const r = evaluateWinRateCurve(curve(0.80, 0.50, 0.30), 'starter');
        expect(r.pass, r.violations.join('; ')).toBe(true);
        expect(r.violations).toHaveLength(0);
        expect(r.totalMove).toBeCloseTo(-0.50, 5);
    });

    it('FAILS a flat high curve (80/78/75) — insufficient decay (dominance)', () => {
        const r = evaluateWinRateCurve(curve(0.80, 0.78, 0.75), 'starter');
        expect(r.pass).toBe(false);
        expect(r.violations.some(v => v.includes('flat curve'))).toBe(true);
    });

    it('FAILS a perfectly flat dominance curve (100/100/100)', () => {
        const r = evaluateWinRateCurve(curve(1.0, 1.0, 1.0), 'starter');
        expect(r.pass).toBe(false);
        expect(r.violations.some(v => v.includes('flat curve'))).toBe(true);
    });

    it('FAILS an inverted curve (30/50/60) — non-monotone AND no decay', () => {
        const r = evaluateWinRateCurve(curve(0.30, 0.50, 0.60), 'starter');
        expect(r.pass).toBe(false);
        expect(r.violations.some(v => v.includes('non-monotone'))).toBe(true);
        expect(r.violations.some(v => v.includes('flat curve'))).toBe(true);
    });

    it('tolerates a small noise wobble within epsilon but still needs real decay', () => {
        // mid dips then late rises slightly (< ε): monotonicity OK, decay OK.
        const r = evaluateWinRateCurve(curve(0.85, 0.40, 0.45), 'starter');
        expect(r.violations.some(v => v.includes('non-monotone'))).toBe(false);
        expect(r.pass).toBe(true); // 0.85 → 0.45 decays 0.40 ≥ 0.30
    });

    it('flags a rise beyond epsilon as a real inversion', () => {
        const eps = CURVE_SHAPE_TOLERANCES.starter.monotoneEpsilon;
        const r = evaluateWinRateCurve(curve(0.90, 0.40, 0.40 + eps + 0.05), 'starter');
        expect(r.violations.some(v => v.includes('non-monotone'))).toBe(true);
    });
});

describe('evaluateWinRateCurve — late class (must rise, the mirror shape)', () => {
    it('PASSES a rising curve (30/50/65) — the late deck coming online', () => {
        const r = evaluateWinRateCurve(curve(0.30, 0.50, 0.65), 'late');
        expect(r.pass, r.violations.join('; ')).toBe(true);
    });

    it('FAILS a decreasing curve (80/50/30) under the late rule', () => {
        const r = evaluateWinRateCurve(curve(0.80, 0.50, 0.30), 'late');
        expect(r.pass).toBe(false);
        expect(r.violations.some(v => v.includes('non-monotone'))).toBe(true);
    });
});

describe('evaluateWinRateCurve — structure', () => {
    it('ignores the impossible stage (its hard wall is a separate check)', () => {
        const pts: WinRateCurvePoint[] = [
            ...curve(0.80, 0.50, 0.30),
            { stage: 'impossible', winRate: 0 },
        ];
        const r = evaluateWinRateCurve(pts, 'starter');
        expect(r.ordered.map(p => p.stage)).toEqual(['early', 'mid', 'late']);
        expect(r.pass).toBe(true);
    });

    it('sorts points into campaign order before grading', () => {
        const shuffled: WinRateCurvePoint[] = [
            { stage: 'late', winRate: 0.30 },
            { stage: 'early', winRate: 0.80 },
            { stage: 'mid', winRate: 0.50 },
        ];
        const r = evaluateWinRateCurve(shuffled, 'starter');
        expect(r.ordered.map(p => p.stage)).toEqual(['early', 'mid', 'late']);
        expect(r.pass).toBe(true);
    });

    it('fails when fewer than two curve points are given', () => {
        const r = evaluateWinRateCurve([{ stage: 'early', winRate: 0.8 }], 'starter');
        expect(r.pass).toBe(false);
        expect(r.violations[0]).toContain('≥2 curve points');
    });
});
