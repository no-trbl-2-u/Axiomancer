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
 * Math baseline (`STAT_MULTIPLIERS`): ATTACK=1, SKILL=1, DEFENSE=3.
 * Reference effects (live library):
 *   - buff_body_attack_up: statModifiers [body +2, physicalSkill +3], flat
 *   - buff_max_hp_up: statModifiers [body ×1.25], multiplier
 *   - buff_barrier: defenseModifier 5
 *   - debuff_all_stats_down: statModifiers [body -2, ...], flat
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
    it('a flat derived-stat buff bumps the corresponding stat accessor', () => {
        // buff_body_attack_up flat-bumps body by 2 and physicalSkill by 3.
        // Effective body: 5 + 2 = 7 → physicalAttack re-derives to 7.
        const c = withEffects([ae('buff_body_attack_up', 1)]);
        expect(getAttackStat(c, 'body')).toBe(7);
        expect(getBaseStat(c, 'body')).toBe(7);
    });

    it('a flat base-stat debuff drops the matching defense accessor', () => {
        // debuff_all_stats_down at intensity 1: body -3 → effective body 2 (strengthened in Phase 126).
        // physicalDefense = body × DEFENSE (3) = 2 × 3 = 6.
        const c = withEffects([ae('debuff_all_stats_down', 1)]);
        expect(getBaseStat(c, 'body')).toBe(2);
        expect(getDefenseStat(c, 'body')).toBe(6);
    });

    it('base-stat changes re-derive every dependent derived stat', () => {
        // buff_body_attack_up bumps body by 2 (5 → 7). Re-derive:
        //   physicalAttack = 7, physicalDefense = 21, physicalSkill = 7 + 3 (flat) = 10.
        const c = withEffects([ae('buff_body_attack_up', 1)]);
        expect(getAttackStat(c, 'body')).toBe(7);
        expect(getDefenseStat(c, 'body')).toBe(21);
        // Resist stat reads the (effective) base stat for the named stance.
        expect(getEffectiveStats(c).baseStats.body).toBe(7);
    });
});

describe('Phase 48 — intensity scaling on statModifiers (KG Q9)', () => {
    it('intensity multiplies every flat statModifier (value × intensity)', () => {
        // buff_body_attack_up at intensity 3 adds body × 3 = 6 → effective body 11.
        // physicalAttack re-derives to 11.
        const c = withEffects([ae('buff_body_attack_up', 3)]);
        expect(getBaseStat(c, 'body')).toBe(11);
        expect(getAttackStat(c, 'body')).toBe(11);
    });

    it('intensity scales debuffs the same way', () => {
        // debuff_all_stats_down at intensity 2: body -6 → effective body -1 (strengthened in Phase 126).
        // physicalDefense = -1 × 3 = -3.
        const c = withEffects([ae('debuff_all_stats_down', 2)]);
        expect(getBaseStat(c, 'body')).toBe(-1);
        expect(getDefenseStat(c, 'body')).toBe(-3);
    });
});

describe('Phase 48 — defenseModifier stacks with derived-stat changes', () => {
    it('defenseModifier (stance-agnostic) adds on top of effective derived defense', () => {
        // buff_barrier: defenseModifier 5 (stance-agnostic).
        // buff_body_attack_up: body +2 → physicalDefense re-derives to 21.
        // getDefenseStat folds both: 21 + 5 = 26.
        const c = withEffects([ae('buff_body_attack_up', 1), ae('buff_barrier', 1)]);
        expect(getDefenseStat(c, 'body')).toBe(26);
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
