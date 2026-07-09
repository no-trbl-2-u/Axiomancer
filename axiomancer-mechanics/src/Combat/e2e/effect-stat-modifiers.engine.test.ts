/**
 * Hermetic e2e — Phase 48: `getEffectiveStats` runtime aggregation
 * (KG Q8 / Q9 verification).
 *
 * Pins the existing aggregation behaviour of `src/Combat/effect-modifiers.ts`
 * + `src/Combat/stats.ts` through the public stat-accessor surface
 * (`getAttackStat` / `getDefenseStat` / `getResistStat` / `getBaseStat`).
 * The internal helpers are already covered by
 * `src/Combat/effect-modifiers.test.ts`; this file pins the consumer-facing
 * accessor path so a future stats.ts refactor can't silently regress.
 *
 * Math baseline (`STAT_MULTIPLIERS`): ATTACK=1, DEFENSE=3.
 * Reference effects (spec 32 v3 — support-tagged non-card entries):
 *   - buff_resistance_body: statModifiers [body +3, physicalDefense +4, physicalSave +3], flat
 *   - buff_max_hp_up: statModifiers [body ×1.25], multiplier
 *   - buff_barrier: defenseModifier 5
 *   - debuff_exhaustion: statModifiers [body -2, mind -2, heart -2, ...], flat
 */

import { describe, it, expect } from 'vitest';
import { createCharacter } from '../../Character';
import type { ActiveEffect } from '../../Effects/types';
import {
    getAttackStat,
    getDefenseStat,
    getBaseStat,
} from '../stats';
import { getEffectiveStats } from '../effect-modifiers';

function withEffects(effects: ActiveEffect[]) {
    return {
        ...createCharacter({
            name: 'tester',
            level: 1,
            baseStats: { body: 5, mind: 5, heart: 5 },
        }),
        effects,
    };
}

const ae = (effectId: string, intensity = 1): ActiveEffect => ({
    effectId,
    intensity,
    remainingDuration: 3,
    appliedAt: 1,
    tier: 2,
});

describe('Phase 48 — statModifiers runtime aggregation (KG Q8)', () => {
    it('a flat base-stat buff bumps the corresponding stat accessor', () => {
        // buff_resistance_body flat-bumps body by 3 (+4 physicalDefense direct).
        // Effective body: 5 + 3 = 8 → physicalAttack re-derives to 8.
        const c = withEffects([ae('buff_resistance_body', 1)]);
        expect(getAttackStat(c, 'body')).toBe(8);
        expect(getBaseStat(c, 'body')).toBe(8);
    });

    it('a flat base-stat debuff drops the matching defense accessor', () => {
        // debuff_exhaustion at intensity 1: body -2 → effective body 3.
        // physicalDefense = body × DEFENSE (3) = 3 × 3 = 9.
        const c = withEffects([ae('debuff_exhaustion', 1)]);
        expect(getBaseStat(c, 'body')).toBe(3);
        expect(getDefenseStat(c, 'body')).toBe(9);
    });

    it('base-stat changes re-derive every dependent derived stat', () => {
        // buff_resistance_body bumps body by 3 (5 → 8). Re-derive:
        //   physicalAttack = 8, physicalDefense = 8 × 3 + 4 (flat) = 28.
        const c = withEffects([ae('buff_resistance_body', 1)]);
        expect(getAttackStat(c, 'body')).toBe(8);
        expect(getDefenseStat(c, 'body')).toBe(28);
        // Resist stat reads the (effective) base stat for the named stance.
        expect(getEffectiveStats(c).baseStats.body).toBe(8);
    });
});

describe('Phase 48 — intensity scaling on statModifiers (KG Q9)', () => {
    it('intensity multiplies every flat statModifier (value × intensity)', () => {
        // buff_resistance_body at intensity 3 adds body 3 × 3 = 9 → effective body 14.
        // physicalAttack re-derives to 14.
        const c = withEffects([ae('buff_resistance_body', 3)]);
        expect(getBaseStat(c, 'body')).toBe(14);
        expect(getAttackStat(c, 'body')).toBe(14);
    });

    it('intensity scales debuffs the same way', () => {
        // debuff_exhaustion at intensity 2: body -4 → effective body 1.
        // physicalDefense = 1 × 3 = 3.
        const c = withEffects([ae('debuff_exhaustion', 2)]);
        expect(getBaseStat(c, 'body')).toBe(1);
        expect(getDefenseStat(c, 'body')).toBe(3);
    });
});

describe('Phase 48 — defenseModifier stacks with derived-stat changes', () => {
    it('defenseModifier (stance-agnostic) adds on top of effective derived defense', () => {
        // buff_barrier: defenseModifier 5 (stance-agnostic).
        // buff_resistance_body: body +3 → physicalDefense re-derives to 24 + 4 flat.
        // getDefenseStat folds both: 24 + 4 + 5 = 33.
        const c = withEffects([ae('buff_resistance_body', 1), ae('buff_barrier', 1)]);
        expect(getDefenseStat(c, 'body')).toBe(33);
    });

    it('defenseModifier alone doesn\'t shift base-stat-derived attack', () => {
        // buff_barrier touches only defenseDelta. Attack stays at base body × 1 = 5.
        const c = withEffects([ae('buff_barrier', 1)]);
        expect(getAttackStat(c, 'body')).toBe(5);
        expect(getDefenseStat(c, 'body')).toBe(20); // 15 + 5 from defenseModifier
    });
});

describe('Phase 48 — multiplier composition (additive per Q3)', () => {
    it('a single multiplier scales the effective base stat', () => {
        // buff_max_hp_up: body ×1.25 at intensity 1.
        // Effective body = 5 × (1 + (1.25 - 1) × 1) = 5 × 1.25 = 6.25.
        // physicalAttack re-derives to 6.25 (no rounding inside the helper).
        const c = withEffects([ae('buff_max_hp_up', 1)]);
        expect(getBaseStat(c, 'body')).toBeCloseTo(6.25, 4);
        expect(getAttackStat(c, 'body')).toBeCloseTo(6.25, 4);
    });
});
