/**
 * Hermetic test pin — `toRomanLower` consolidated helper.
 *
 * Consolidates 5 pre-existing implementations across the
 * presenter / panel surfaces. The pin covers boundary values,
 * the fallback parameter, and the non-array-bounded extension
 * (the prior array-lookup variants stopped at `'x'`; this helper
 * returns proper Roman for any positive finite integer).
 */

import { describe, expect, it } from '@jest/globals';

import { toRomanLower } from '@/state/presenters/roman';

describe('toRomanLower', () => {
    it('returns the lowercase Roman numeral for typical small values', () => {
        expect(toRomanLower(1)).toBe('i');
        expect(toRomanLower(2)).toBe('ii');
        expect(toRomanLower(3)).toBe('iii');
        expect(toRomanLower(4)).toBe('iv');
        expect(toRomanLower(5)).toBe('v');
        expect(toRomanLower(9)).toBe('ix');
        expect(toRomanLower(10)).toBe('x');
    });

    it('extends beyond x (closes the prior `String(n)` fallback at n >= 11)', () => {
        expect(toRomanLower(11)).toBe('xi');
        expect(toRomanLower(14)).toBe('xiv');
        expect(toRomanLower(40)).toBe('xl');
        expect(toRomanLower(50)).toBe('l');
        expect(toRomanLower(90)).toBe('xc');
        expect(toRomanLower(99)).toBe('xcix');
        expect(toRomanLower(400)).toBe('cd');
        expect(toRomanLower(900)).toBe('cm');
        expect(toRomanLower(1994)).toBe('mcmxciv');
    });

    it('returns the default fallback "i" for zero and negatives', () => {
        expect(toRomanLower(0)).toBe('i');
        expect(toRomanLower(-1)).toBe('i');
        expect(toRomanLower(-100)).toBe('i');
    });

    it('returns the default fallback "i" for non-finite inputs', () => {
        expect(toRomanLower(Number.NaN)).toBe('i');
        expect(toRomanLower(Number.POSITIVE_INFINITY)).toBe('i');
        expect(toRomanLower(Number.NEGATIVE_INFINITY)).toBe('i');
    });

    it('honors a caller-supplied fallback (e.g. the "·" sentinel used by the seal chrome)', () => {
        expect(toRomanLower(0, '·')).toBe('·');
        expect(toRomanLower(-1, '·')).toBe('·');
        expect(toRomanLower(Number.NaN, '·')).toBe('·');
    });

    it('floors non-integer positives (defensive — engine should never send fractional rounds)', () => {
        expect(toRomanLower(3.7)).toBe('iii');
        expect(toRomanLower(10.99)).toBe('x');
    });
});
