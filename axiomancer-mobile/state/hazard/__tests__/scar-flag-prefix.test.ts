/**
 * The hazard puzzle's engine claim writes its scar under the same flag
 * prefix the live hazard claim writes and a rest reads, so a puzzle scar
 * mends at the next rest like any other.
 */

import { describe, expect, it } from '@jest/globals';

import { HAZARD_SCAR_FLAG_PREFIX as ENGINE_PREFIX } from '@mechanics';
import { bankedScarMagnitude, HAZARD_SCAR_FLAG_PREFIX } from '@/state/hazard/store-actions';

describe('hazard scar flag prefix', () => {
    it('is the same in the engine and in mobile', () => {
        expect(ENGINE_PREFIX).toBe(HAZARD_SCAR_FLAG_PREFIX);
    });

    it("a puzzle scar counts toward the banked scar a rest mends", () => {
        expect(bankedScarMagnitude([`${ENGINE_PREFIX}5`])).toBe(5);
    });
});
