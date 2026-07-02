/**
 * Hermetic unit tests — levelUpFlavor (level-up chronicle flavour picker).
 *
 * Pins the determinism contract of `pickFlavor(toLevel)`:
 *   - same level transition always yields the same line (no RNG)
 *   - modular wraparound across the three-variant list
 *   - every variant is reachable
 *   - stable across repeated calls and large / boundary levels
 */

import { describe, expect, it } from '@jest/globals';

import { pickFlavor } from '@/components/levelup/levelUpFlavor';

const VARIANTS = [
    'the body that survives is not the body that arrived.',
    'something in the marrow learned its own name.',
    'the page turned itself.',
] as const;

describe('pickFlavor', () => {
    it('maps each level to its variant by modulo of the variant count', () => {
        expect(pickFlavor(0)).toBe(VARIANTS[0]);
        expect(pickFlavor(1)).toBe(VARIANTS[1]);
        expect(pickFlavor(2)).toBe(VARIANTS[2]);
    });

    it('wraps around the variant list as the level climbs', () => {
        expect(pickFlavor(3)).toBe(VARIANTS[0]);
        expect(pickFlavor(4)).toBe(VARIANTS[1]);
        expect(pickFlavor(5)).toBe(VARIANTS[2]);
        expect(pickFlavor(6)).toBe(VARIANTS[0]);
    });

    it('is deterministic — repeated calls for the same level never drift', () => {
        for (let level = 0; level < 30; level += 1) {
            const first = pickFlavor(level);
            for (let repeat = 0; repeat < 5; repeat += 1) {
                expect(pickFlavor(level)).toBe(first);
            }
        }
    });

    it('always returns one of the known variants', () => {
        for (let level = 0; level < 50; level += 1) {
            expect(VARIANTS).toContain(pickFlavor(level));
        }
    });

    it('reaches every variant across a run of consecutive levels', () => {
        const seen = new Set<string>();
        for (let level = 0; level < VARIANTS.length; level += 1) {
            seen.add(pickFlavor(level));
        }
        expect(seen.size).toBe(VARIANTS.length);
    });

    it('agrees with the modulo formula at large and boundary levels', () => {
        for (const level of [0, 99, 100, 999, 1000]) {
            expect(pickFlavor(level)).toBe(VARIANTS[level % VARIANTS.length]);
        }
    });
});
