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

// ─── debuff_daze — stat debuff (mind -2, mentalSkill -2, mentalDefense -1) ───

describe('Phase 88 — debuff_daze', () => {
    it('does NOT skip turn (no actionRestriction)', () => {
        const mods = getActiveEffectModifiers([ae('debuff_daze')]);
        expect(mods.skipTurn).toBe(false);
    });

    it('reduces mind-related stats', () => {
        const mods = getActiveEffectModifiers([ae('debuff_daze')]);
        expect(mods.statFlat.get('mind')).toBe(-2);
        expect(mods.statFlat.get('mentalSkill')).toBe(-2);
        expect(mods.statFlat.get('mentalDefense')).toBe(-1);
    });

    it('applies cleanly', () => {
        const effect = lookupEffect('debuff_daze')!;
        const { result } = applyEffect([], effect, 1);
        expect(result.success).toBe(true);
    });
});

// ─── debuff_fear — stat debuff (heart -3, emotionalSkill -2, emotionalDefense -2) ─

describe('Phase 88 — debuff_fear', () => {
    it('does NOT force a stance or skip turn', () => {
        const mods = getActiveEffectModifiers([ae('debuff_fear')]);
        expect(mods.skipTurn).toBe(false);
        expect(mods.forcedStance).toBeNull();
    });

    it('reduces heart-related stats', () => {
        const mods = getActiveEffectModifiers([ae('debuff_fear')]);
        expect(mods.statFlat.get('heart')).toBe(-4);
        expect(mods.statFlat.get('emotionalSkill')).toBe(-3);
        expect(mods.statFlat.get('emotionalDefense')).toBe(-3);
    });
});

// ─── debuff_blind — disadvantage on body + mind + rollModifier -5 ─────────────

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
});

// ─── debuff_berserk — stat distortion (body +3, mind -4, heart -2) + defense -3 ─

describe('Phase 88 — debuff_berserk', () => {
    it('boosts body but cripples mind and heart', () => {
        const mods = getActiveEffectModifiers([ae('debuff_berserk')]);
        expect(mods.statFlat.get('body')).toBe(3);
        expect(mods.statFlat.get('mind')).toBe(-4);
        expect(mods.statFlat.get('heart')).toBe(-2);
        expect(mods.statFlat.get('physicalSkill')).toBe(2);
        expect(mods.statFlat.get('mentalSkill')).toBe(-3);
        expect(mods.statFlat.get('mentalDefense')).toBe(-2);
    });

    it('reduces defense', () => {
        const mods = getActiveEffectModifiers([ae('debuff_berserk')]);
        expect(mods.defenseDelta).toBe(-3);
    });

    it('does not force a stance or skip turn in the aggregator', () => {
        // berserk has no actionRestriction — the forced-attack behaviour is
        // handled at a higher level (AI / reducer) not via the payload.
        const mods = getActiveEffectModifiers([ae('debuff_berserk')]);
        expect(mods.skipTurn).toBe(false);
        expect(mods.forcedStance).toBeNull();
    });
});

// ─── debuff_fatigue — mild stat reduction ─────────────────────────────────────

describe('Phase 88 — debuff_fatigue', () => {
    it('reduces body and mind related stats', () => {
        const mods = getActiveEffectModifiers([ae('debuff_fatigue')]);
        expect(mods.statFlat.get('body')).toBe(-1);
        expect(mods.statFlat.get('mind')).toBe(-1);
        expect(mods.statFlat.get('physicalSkill')).toBe(-1);
        expect(mods.statFlat.get('mentalSkill')).toBe(-1);
    });

    it('scales with intensity', () => {
        const mods = getActiveEffectModifiers([ae('debuff_fatigue', 2)]);
        expect(mods.statFlat.get('body')).toBe(-2);
        expect(mods.statFlat.get('mind')).toBe(-2);
    });
});

// ─── debuff_exhaustion — broader stat reduction ───────────────────────────────

describe('Phase 88 — debuff_exhaustion', () => {
    it('reduces all three base stats and all skill stats', () => {
        const mods = getActiveEffectModifiers([ae('debuff_exhaustion')]);
        expect(mods.statFlat.get('body')).toBe(-2);
        expect(mods.statFlat.get('mind')).toBe(-2);
        expect(mods.statFlat.get('heart')).toBe(-2);
        expect(mods.statFlat.get('physicalSkill')).toBe(-1);
        expect(mods.statFlat.get('mentalSkill')).toBe(-1);
        expect(mods.statFlat.get('emotionalSkill')).toBe(-1);
    });
});

// ─── debuff_root — defenseModifier -2, rollModifier -2 (no blockedStances in payload) ─

describe('Phase 88 — debuff_root', () => {
    it('reduces defense and has no action restriction in the library payload', () => {
        // Root's payload: { defenseModifier: -2, rollModifier: -2 }
        // The "blocks stance-change" semantics are handled at the reducer layer,
        // not via the effect payload's actionRestriction field.
        const mods = getActiveEffectModifiers([ae('debuff_root')]);
        expect(mods.defenseDelta).toBe(-2);
        expect(mods.skipTurn).toBe(false);
        expect(mods.forcedStance).toBeNull();
        expect(mods.blockedStances.size).toBe(0);
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

// ─── debuff_dispel — instant, empty payload ───────────────────────────────────

describe('Phase 88 — debuff_dispel', () => {
    it('applies without error (duration 0, empty payload)', () => {
        const effect = lookupEffect('debuff_dispel')!;
        const { result } = applyEffect([], effect, 1);
        expect(result.success).toBe(true);
    });

    it('does not alter any stats', () => {
        const mods = getActiveEffectModifiers([ae('debuff_dispel')]);
        expect(mods.statFlat.size).toBe(0);
        expect(mods.defenseDelta).toBe(0);
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
