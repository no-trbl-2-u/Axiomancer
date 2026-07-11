/**
 * Phase 88 — Damage-variant effects coverage sweep.
 *
 * Drains the Phase 79 LOW "Damage-category variants uncovered (5 of 10)"
 * CRITIQUE row. Each DoT variant is applied and its per-round damage is
 * asserted via `getActiveEffectModifiers`.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import { applyEffect } from '../../Effects';
import { lookupEffect } from '../../Effects/effects.library';
import { getActiveEffectModifiers } from '../../Combat/effect-modifiers';
import type { ActiveEffect } from '../../Effects/types';

afterEach(() => vi.restoreAllMocks());

const ae = (effectId: string, intensity = 1): ActiveEffect => ({
    effectId,
    intensity,
    remainingDuration: 3,
    appliedAt: 1,
    tier: 2,
});

// ─── debuff_strong_poison: 5 dmg/round (start), body -1 ──────────────────────

describe('Phase 88 — debuff_strong_poison', () => {
    it('rides the card-played clock (WS3.3 — POISON tier-3): no round-boundary tick', () => {
        // The clock sweep put strong poison on POISON's card-played clock:
        // the round-boundary aggregator carries 0 and `fireDotTrigger` owns
        // its 5-per-stack tick instead.
        const def = lookupEffect('debuff_strong_poison')!;
        expect(def.payload.damageOverTime?.trigger).toBe('card-played');
        const mods = getActiveEffectModifiers([ae('debuff_strong_poison')]);
        expect(mods.dotStart).toBe(0);
        expect(mods.dotEnd).toBe(0);
    });

    it('also reduces body by 1', () => {
        const mods = getActiveEffectModifiers([ae('debuff_strong_poison')]);
        expect(mods.statFlat.get('body')).toBe(-1);
    });

    it('scales its stat drain with intensity', () => {
        const mods = getActiveEffectModifiers([ae('debuff_strong_poison', 2)]);
        expect(mods.statFlat.get('body')).toBe(-2);
    });

    it('applies cleanly', () => {
        const effect = lookupEffect('debuff_strong_poison')!;
        const { result } = applyEffect([], effect, 1);
        expect(result.success).toBe(true);
    });
});

// ─── debuff_burn: 4 dmg/round (start), heart -1 ──────────────────────────────

describe('canonical debuff_burn (Fate Engine P1 trim — the FUEL DoT)', () => {
    it('deals 3 damage per round at start-of-round', () => {
        const mods = getActiveEffectModifiers([ae('debuff_burn')]);
        expect(mods.dotStart).toBe(3);
        expect(mods.dotEnd).toBe(0);
    });

    it('carries no legacy stat rider — the identity is the tick + the fuel tag', () => {
        const mods = getActiveEffectModifiers([ae('debuff_burn')]);
        expect(mods.statFlat.get('heart')).toBeUndefined();
    });

    it('scales DoT with intensity', () => {
        const mods = getActiveEffectModifiers([ae('debuff_burn', 3)]);
        expect(mods.dotStart).toBe(9);
    });
});

// ─── debuff_frostbite: 3 dmg/round (start), rollModifier -2 (strengthened in Phase 126) ──────

describe('Phase 88 — debuff_frostbite', () => {
    it('deals 3 damage per round at start-of-round', () => {
        const mods = getActiveEffectModifiers([ae('debuff_frostbite')]);
        expect(mods.dotStart).toBe(3); // strengthened from 2 to 3 in Phase 126
        expect(mods.dotEnd).toBe(0);
    });

    it('does not alter stat flat values (only has rollModifier)', () => {
        const mods = getActiveEffectModifiers([ae('debuff_frostbite')]);
        expect(mods.statFlat.size).toBe(0);
    });

    it('applies cleanly', () => {
        const effect = lookupEffect('debuff_frostbite')!;
        const { result } = applyEffect([], effect, 1);
        expect(result.success).toBe(true);
    });
});

// ─── debuff_shock: 3 dmg/round (start), rollModifier -1 ──────────────────────

describe('Phase 88 — debuff_shock', () => {
    it('deals 3 damage per round at start-of-round', () => {
        const mods = getActiveEffectModifiers([ae('debuff_shock')]);
        expect(mods.dotStart).toBe(3);
    });

    it('scales DoT with intensity', () => {
        const mods = getActiveEffectModifiers([ae('debuff_shock', 2)]);
        expect(mods.dotStart).toBe(6);
    });
});

// ─── debuff_wound: body -2, defenseModifier -2 (stat category, no DoT) ───────

describe('Phase 88 — debuff_wound', () => {
    it('does NOT deal DoT damage (wound is stat category)', () => {
        const mods = getActiveEffectModifiers([ae('debuff_wound')]);
        expect(mods.dotStart).toBe(0);
        expect(mods.dotEnd).toBe(0);
    });

    it('reduces body by 2 and defense by 2', () => {
        const mods = getActiveEffectModifiers([ae('debuff_wound')]);
        expect(mods.statFlat.get('body')).toBe(-2);
        expect(mods.defenseDelta).toBe(-2);
    });

    it('scales stat reduction with intensity', () => {
        const mods = getActiveEffectModifiers([ae('debuff_wound', 3)]);
        expect(mods.statFlat.get('body')).toBe(-6);
        expect(mods.defenseDelta).toBe(-6);
    });

    it('applies cleanly', () => {
        const effect = lookupEffect('debuff_wound')!;
        const { result } = applyEffect([], effect, 1);
        expect(result.success).toBe(true);
    });
});
