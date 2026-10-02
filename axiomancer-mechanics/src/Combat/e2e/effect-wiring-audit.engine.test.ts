/**
 * Hermetic E2E — effect wiring. Each block pins a payload surface the live
 * Hazard-Pattern Combat engine must read (not leave INERT or mis-timed):
 *
 *   - POISON ramp reset on reapplication (`escalatesPerTurn` → `appliedAt`
 *     re-stamped in `applyEffect`).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { applyEffect, lookupEffect } from '../../Effects';

afterEach(() => { vi.restoreAllMocks(); });

// ── POISON ramp reset on reapplication ───────────────────────────────────────

describe('POISON — reapplication resets the escalation ramp', () => {
    it('re-stamps appliedAt (ramp back to turn 0) while intensity climbs', () => {
        const poison = lookupEffect('debuff_poison')!;
        // First application at round 0.
        const first = applyEffect([], poison, 0).activeEffects;
        expect(first[0].appliedAt).toBe(0);
        expect(first[0].intensity).toBe(1);
        // Reapplied four rounds later: the ramp clock resets to the new round…
        const again = applyEffect(first, poison, 4).activeEffects;
        expect(again).toHaveLength(1);
        expect(again[0].appliedAt).toBe(4);   // ramp restarts
        expect(again[0].intensity).toBe(2);   // …but intensity still stacks
    });

    it('a non-escalating DoT keeps its original appliedAt on reapply', () => {
        const bleed = lookupEffect('debuff_bleed')!; // decaysPerTick, not escalating
        const first = applyEffect([], bleed, 0).activeEffects;
        const again = applyEffect(first, bleed, 4).activeEffects;
        expect(again[0].appliedAt).toBe(0);   // age preserved — ramp is irrelevant
    });
});
