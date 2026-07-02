/**
 * Unit tests — Hazard out-of-combat death tombstone flag (Phase 130).
 *
 * `hazardDeathCount` reads the durable `hazard-death:` flags the lethal
 * Hazard claim stamps, ignoring every other flag family (scar, token,
 * card). Pure flag math — no store, no engine.
 */

import { describe, expect, it } from '@jest/globals';

import { HAZARD_DEATH_FLAG_PREFIX, hazardDeathCount } from '@/state/hazard/store-actions';

describe('hazardDeathCount', () => {
    it('is 0 for no flags', () => {
        expect(hazardDeathCount([])).toBe(0);
    });

    it('counts each distinct tombstone flag', () => {
        const flags = [
            `${HAZARD_DEATH_FLAG_PREFIX}1700000000000`,
            `${HAZARD_DEATH_FLAG_PREFIX}1700000000001`,
        ];
        expect(hazardDeathCount(flags)).toBe(2);
    });

    it('ignores unrelated flag families', () => {
        const flags = [
            'hazard-scar:6',
            'hazard-token-banked:abc',
            'hazard-hexed',
            `${HAZARD_DEATH_FLAG_PREFIX}1700000000000`,
            'hazard-card:some-card',
        ];
        expect(hazardDeathCount(flags)).toBe(1);
    });

    it('uses the documented prefix', () => {
        expect(HAZARD_DEATH_FLAG_PREFIX).toBe('hazard-death:');
    });
});
