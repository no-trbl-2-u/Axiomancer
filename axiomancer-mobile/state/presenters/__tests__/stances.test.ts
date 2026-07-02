/**
 * Hermetic test pin — `STANCES` shared constant.
 *
 * Pin the ordering invariant: the array is consumed by multiple
 * presenter render paths + the LevelUpModal's stance-row map,
 * and they all assume `heart` → `body` → `mind`. A future
 * contributor reordering these would silently shuffle the UI.
 */

import { describe, expect, it } from '@jest/globals';

import { STANCES } from '@/state/presenters/stances';

describe('STANCES', () => {
    it('exports the three engine stances in heart/body/mind order', () => {
        expect(STANCES).toEqual(['heart', 'body', 'mind']);
    });

    it('is exactly three entries (engine Stance union has three members)', () => {
        expect(STANCES).toHaveLength(3);
    });

    it('contains each stance exactly once', () => {
        const set = new Set(STANCES);
        expect(set.size).toBe(STANCES.length);
        expect(set.has('heart')).toBe(true);
        expect(set.has('body')).toBe(true);
        expect(set.has('mind')).toBe(true);
    });
});
