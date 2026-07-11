/**
 * Phase 124 - Stronger effects verification
 * Hermetic e2e ensuring strengthened effects produce expected greater impact
 */

import { describe, it, expect } from 'vitest';
import { lookupEffect } from '../effects.library';

describe('Phase 124 - Stronger cards/effects', () => {
    // The tier1_heart_defend / tier1_body_attack cases retired with the
    // spec 32 v3 keyword reset (the tier1_* stance layer is gone from the
    // library). The surviving Phase 124 tuning below lives on support-tagged
    // non-card effects.

    it('buff_regeneration has stronger healing value', async () => {
        const regen = lookupEffect('buff_regeneration');
        expect(regen).toBeDefined();
        
        // Phase 124: increased healthPerRound: 3 → 4, duration: 5 → 6
        expect(regen!.duration).toBe(6);
        expect(regen!.payload.regeneration?.healthPerRound).toBe(4);
    });
});