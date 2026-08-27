/**
 * Phase 65 — village goodwill reward tiers. Pure-function coverage for the
 * discount curve and the Tier 3 flag-id formatter; the actual grant wiring
 * (Ally into `knownCards`, currency into `player.currency`) is covered at
 * the mobile action layer (`cache.flow.engine.test.ts`), which is where the
 * idempotency guards actually live.
 */
import { describe, expect, it } from 'vitest';

import {
    GOODWILL_BONUS_FLAG_PREFIX,
    GOODWILL_DISCOUNT_THRESHOLD,
    applyGoodwillDiscount,
    goodwillBonusFlag,
} from '../village-goodwill';

describe('applyGoodwillDiscount', () => {
    it('returns the price unchanged below the discount threshold', () => {
        expect(applyGoodwillDiscount(100, 0)).toBe(100);
        expect(GOODWILL_DISCOUNT_THRESHOLD).toBe(1);
    });

    it('floors a 10% discount at and above the threshold', () => {
        expect(applyGoodwillDiscount(100, 1)).toBe(90);
        expect(applyGoodwillDiscount(12, 1)).toBe(10);
        expect(applyGoodwillDiscount(100, 5)).toBe(90);
    });

    it('never returns a negative price for a zero or tiny base price', () => {
        expect(applyGoodwillDiscount(0, 1)).toBe(0);
        expect(applyGoodwillDiscount(1, 1)).toBe(0);
    });
});

describe('goodwillBonusFlag', () => {
    it('formats a per-map flag id under the shared prefix', () => {
        expect(goodwillBonusFlag('northern-forest')).toBe(`${GOODWILL_BONUS_FLAG_PREFIX}northern-forest`);
        expect(goodwillBonusFlag('fishing-village')).toBe(`${GOODWILL_BONUS_FLAG_PREFIX}fishing-village`);
    });

    it('distinguishes maps', () => {
        expect(goodwillBonusFlag('a')).not.toBe(goodwillBonusFlag('b'));
    });
});
