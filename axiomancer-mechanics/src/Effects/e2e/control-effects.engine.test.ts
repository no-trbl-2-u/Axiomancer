/**
 * Phase 88 — Control-category effects coverage sweep.
 *
 * Drains the Phase 79 LOW "Control-category effects (10 of 17 uncovered)"
 * CRITIQUE row. Each effect has unique action-restriction semantics so these
 * are per-effect describe blocks, not parameterized.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import { applyEffect } from '../../Effects';
import { lookupEffect } from '../../Effects/effects.library';
import { getActiveEffectModifiers, canAct } from '../../Combat/effect-modifiers';
import type { ActiveEffect } from '../../Effects/types';

afterEach(() => vi.restoreAllMocks());

const ae = (effectId: string, intensity = 1): ActiveEffect => ({
    effectId,
    intensity,
    remainingDuration: 3,
    appliedAt: 1,
    tier: 2,
});

// ─── debuff_sleep — skipTurn + defenseModifier -3 ─────────────────────────────

describe('Phase 88 — debuff_sleep', () => {
    it('sets skipTurn = true', () => {
        const mods = getActiveEffectModifiers([ae('debuff_sleep')]);
        expect(mods.skipTurn).toBe(true);
    });

    it('lowers defense by 3', () => {
        const mods = getActiveEffectModifiers([ae('debuff_sleep')]);
        expect(mods.defenseDelta).toBe(-3);
    });

    it('canAct returns false with reason skipTurn', () => {
        const result = canAct([ae('debuff_sleep')]);
        expect(result.canAct).toBe(false);
        expect(result.reason).toBe('skipTurn');
    });
});

// debuff_daze folded into debuff_confusion (WS8.1 KW-2, 2026-07-11): both
// gripped the same stance-certainty surface. Its id is deleted from the
// library and banned by the deprecated-effects list; confusion's coverage
// (blursStanceHints) lives in the WS8.2 blocks below and in the status-depth
// suites.

// ─── debuff_fear — stat debuff (heart -4, emotionalDefense -3) ─

describe('Phase 88 — debuff_fear', () => {
    it('does NOT force a stance or skip turn', () => {
        const mods = getActiveEffectModifiers([ae('debuff_fear')]);
        expect(mods.skipTurn).toBe(false);
        expect(mods.forcedStance).toBeNull();
    });

    it('reduces heart-related stats', () => {
        const mods = getActiveEffectModifiers([ae('debuff_fear')]);
        expect(mods.statFlat.get('heart')).toBe(-4);
        expect(mods.statFlat.get('emotionalDefense')).toBe(-3);
    });
});

// ─── debuff_blind — disadvantage on body + mind + rider suppression (WS8.2) ──

describe('Phase 88 — debuff_blind', () => {
    it('grants disadvantage on body and mind', () => {
        const mods = getActiveEffectModifiers([ae('debuff_blind')]);
        expect(mods.advantageDenies.has('body')).toBe(true);
        expect(mods.advantageDenies.has('mind')).toBe(true);
        expect(mods.advantageDenies.has('heart')).toBe(false);
    });

    it('does not skip turn', () => {
        const mods = getActiveEffectModifiers([ae('debuff_blind')]);
        expect(mods.skipTurn).toBe(false);
    });

    it('WS8.2 — owns the RIDER surface: suppresses threat riders, no roll penalty', () => {
        const blind = lookupEffect('debuff_blind')!;
        expect(blind.payload.suppressesThreatRiders).toBe(true);
        expect(blind.payload.rollModifier).toBeUndefined();
    });
});

// debuff_berserk and debuff_dispel were retired outright by the spec 32 v3
// keyword reset (no support consumer resolves them); their coverage retires
// with them — the deprecated-effects ban list keeps the ids dead.

// debuff_fatigue folded into debuff_exhaustion (WS8.1 KW-2, 2026-07-11):
// duplicate mild stat drain on the same telegraph-damage surface. Its id is
// deleted from the library and banned by the deprecated-effects list.

// ─── debuff_exhaustion — broader stat reduction (fold SURVIVOR) ───────────────

describe('Phase 88 — debuff_exhaustion', () => {
    it('reduces all three base stats', () => {
        const mods = getActiveEffectModifiers([ae('debuff_exhaustion')]);
        expect(mods.statFlat.get('body')).toBe(-2);
        expect(mods.statFlat.get('mind')).toBe(-2);
        expect(mods.statFlat.get('heart')).toBe(-2);
    });

    it('scales with intensity', () => {
        const mods = getActiveEffectModifiers([ae('debuff_exhaustion', 2)]);
        expect(mods.statFlat.get('body')).toBe(-4);
        expect(mods.statFlat.get('mind')).toBe(-4);
    });

    it('WS8.2 — owns the telegraph-DAMAGE surface: weakened hits softer (-25%)', () => {
        const exhaustion = lookupEffect('debuff_exhaustion')!;
        expect(exhaustion.payload.outgoingThreatDamageMulPct).toBe(-25);
        expect(exhaustion.payload.rollModifier).toBeUndefined();
    });
});

// ─── debuff_root — defenseModifier -2 + stance LOCK (WS8.2, no blockedStances) ─

describe('Phase 88 — debuff_root', () => {
    it('reduces defense and has no action restriction in the library payload', () => {
        // Root's payload: { defenseModifier: -2, lockedStance: true }
        // The "blocks stance-change" semantics are the WS8.2 LOCK shape —
        // `lockedStance` is read where stances swap (`processBetweenPhases`),
        // not via the effect payload's actionRestriction field.
        const mods = getActiveEffectModifiers([ae('debuff_root')]);
        expect(mods.defenseDelta).toBe(-2);
        expect(mods.skipTurn).toBe(false);
        expect(mods.forcedStance).toBeNull();
        expect(mods.blockedStances.size).toBe(0);
    });

    it('WS8.2 — owns the STANCE surface: locks the bearer into its revealed stance', () => {
        const root = lookupEffect('debuff_root')!;
        expect(root.payload.lockedStance).toBe(true);
        expect(root.payload.rollModifier).toBeUndefined();
    });

    it('applies cleanly', () => {
        const effect = lookupEffect('debuff_root')!;
        const { result } = applyEffect([], effect, 1);
        expect(result.success).toBe(true);
    });
});

// ─── debuff_knockdown — defenseModifier -4, rollModifier -3 ───────────────────

describe('Phase 88 — debuff_knockdown', () => {
    it('heavily penalizes defense', () => {
        const mods = getActiveEffectModifiers([ae('debuff_knockdown')]);
        expect(mods.defenseDelta).toBe(-4);
    });

    it('does not skip turn (no actionRestriction)', () => {
        const mods = getActiveEffectModifiers([ae('debuff_knockdown')]);
        expect(mods.skipTurn).toBe(false);
    });
});

// ─── debuff_hex — DoT 2 damage per round (heart-typed) ───────────────────────

describe('Phase 88 — debuff_hex', () => {
    it('deals 2 damage per round at start-of-round', () => {
        const mods = getActiveEffectModifiers([ae('debuff_hex')]);
        expect(mods.dotStart).toBe(2);
        expect(mods.dotEnd).toBe(0);
    });

    it('scales with intensity', () => {
        const mods = getActiveEffectModifiers([ae('debuff_hex', 3)]);
        // hex stacking is 'none' in the library so intensity stays 1 normally,
        // but the aggregator multiplies by whatever intensity the ActiveEffect has.
        expect(mods.dotStart).toBe(6);
    });
});
