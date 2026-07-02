/**
 * Phase 88 — Stat-band effects coverage sweep.
 *
 * Drains the Phase 79 LOW "Stat-band buffs uncovered" CRITIQUE row by
 * asserting every uncovered stat-band buff's `statModifiers` aggregate
 * correctly through `getEffectiveStats`.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import { applyEffect } from '../../Effects';
import { lookupEffect } from '../../Effects/effects.library';
import { getEffectiveStats } from '../../Combat/effect-modifiers';
import { createCharacter } from '../../Character';
import type { Combatant } from '../../Combat/types';
import type { ActiveEffect } from '../../Effects/types';

afterEach(() => vi.restoreAllMocks());

/**
 * Builds a Character with base stats { body: 5, mind: 5, heart: 5 } and
 * the given effects already applied. The Character type satisfies
 * `isCharacter`, so `nonCombatStats` will be derived (needed for save-stat
 * assertions on resistance buffs).
 */
function combatantWithEffects(effects: ActiveEffect[]): Combatant {
    return {
        ...createCharacter({
            name: 'stat-band-tester',
            level: 1,
            baseStats: { body: 5, mind: 5, heart: 5 },
        }),
        effects,
    };
}

// ─── Parameterized stat-band buffs with statModifiers ─────────────────────────

/**
 * Each entry declares: effect ID, expected flat stat deltas at intensity 1,
 * and optionally expected defenseModifier. Multipliers are excluded since
 * they're tested in Phase 48 already — these are all flat-only bands.
 *
 * The math: base stats are all 5.
 *   - ATTACK multiplier = 1, so physicalAttack = body × 1 = 5.
 *   - SKILL multiplier = 1, so physicalSkill = body × 1 = 5.
 *   - DEFENSE multiplier = 3, so physicalDefense = body × 3 = 15.
 *   - SAVE multiplier = 2, so physicalSave = body × 2 = 10.
 *   - luck = average(body, mind, heart) = 5.
 *
 * When a base stat (body/mind/heart) is bumped by N, the effective base stat
 * is 5 + N and ALL derived stats for that stance re-derive.
 */
const statBandCases = [
    {
        effectId: 'buff_mind_attack_up',
        label: 'buff_mind_attack_up: mind +2, mentalSkill +3',
        assertions: (eff: ReturnType<typeof getEffectiveStats>) => {
            // mind base: 5 + 2 = 7
            expect(eff.baseStats.mind).toBe(7);
            // mentalSkill re-derives from mind (7×1=7) then flat +3 = 10
            expect(eff.derivedStats.mentalSkill).toBe(10);
            // mentalAttack re-derives from mind: 7
            expect(eff.derivedStats.mentalAttack).toBe(7);
        },
    },
    {
        effectId: 'buff_heart_attack_up',
        label: 'buff_heart_attack_up: heart +2, emotionalSkill +3',
        assertions: (eff: ReturnType<typeof getEffectiveStats>) => {
            expect(eff.baseStats.heart).toBe(7);
            // emotionalSkill re-derives from heart (7×1=7) then flat +3 = 10
            expect(eff.derivedStats.emotionalSkill).toBe(10);
            expect(eff.derivedStats.emotionalAttack).toBe(7);
        },
    },
    {
        effectId: 'buff_body_defense_up',
        label: 'buff_body_defense_up: body +2, physicalDefense +3, defenseModifier +2',
        assertions: (eff: ReturnType<typeof getEffectiveStats>) => {
            expect(eff.baseStats.body).toBe(7);
            // physicalDefense re-derives (7×3=21) then flat +3 = 24
            expect(eff.derivedStats.physicalDefense).toBe(24);
            expect(eff.defenseDelta).toBe(2);
        },
    },
    {
        effectId: 'buff_mind_defense_up',
        label: 'buff_mind_defense_up: mind +2, mentalDefense +3, defenseModifier +2',
        assertions: (eff: ReturnType<typeof getEffectiveStats>) => {
            expect(eff.baseStats.mind).toBe(7);
            // mentalDefense re-derives (7×3=21) then flat +3 = 24
            expect(eff.derivedStats.mentalDefense).toBe(24);
            expect(eff.defenseDelta).toBe(2);
        },
    },
    {
        effectId: 'buff_heart_defense_up',
        label: 'buff_heart_defense_up: heart +2, emotionalDefense +3, defenseModifier +2',
        assertions: (eff: ReturnType<typeof getEffectiveStats>) => {
            expect(eff.baseStats.heart).toBe(7);
            // emotionalDefense re-derives (7×3=21) then flat +3 = 24
            expect(eff.derivedStats.emotionalDefense).toBe(24);
            expect(eff.defenseDelta).toBe(2);
        },
    },
    {
        effectId: 'buff_resistance_body',
        label: 'buff_resistance_body: body +3, physicalDefense +4, physicalSave +3',
        assertions: (eff: ReturnType<typeof getEffectiveStats>) => {
            expect(eff.baseStats.body).toBe(8);
            // physicalDefense re-derives (8×3=24) then flat +4 = 28
            expect(eff.derivedStats.physicalDefense).toBe(28);
            // physicalSave: base (8×2=16) + flat 3 = 19
            expect(eff.nonCombatStats!.physicalSave).toBe(19);
        },
    },
    {
        effectId: 'buff_resistance_mind',
        label: 'buff_resistance_mind: mind +3, mentalDefense +4, mentalSave +3',
        assertions: (eff: ReturnType<typeof getEffectiveStats>) => {
            expect(eff.baseStats.mind).toBe(8);
            // mentalDefense re-derives (8×3=24) then flat +4 = 28
            expect(eff.derivedStats.mentalDefense).toBe(28);
            // mentalSave: base (8×2=16) + flat 3 = 19
            expect(eff.nonCombatStats!.mentalSave).toBe(19);
        },
    },
    {
        effectId: 'buff_resistance_heart',
        label: 'buff_resistance_heart: heart +3, emotionalDefense +4, emotionalSave +3',
        assertions: (eff: ReturnType<typeof getEffectiveStats>) => {
            expect(eff.baseStats.heart).toBe(8);
            // emotionalDefense re-derives (8×3=24) then flat +4 = 28
            expect(eff.derivedStats.emotionalDefense).toBe(28);
            // emotionalSave: base (8×2=16) + flat 3 = 19
            expect(eff.nonCombatStats!.emotionalSave).toBe(19);
        },
    },
    {
        effectId: 'buff_all_stats_up',
        label: 'buff_all_stats_up: body/mind/heart +2, skills +1, luck +1',
        assertions: (eff: ReturnType<typeof getEffectiveStats>) => {
            expect(eff.baseStats.body).toBe(7);
            expect(eff.baseStats.mind).toBe(7);
            expect(eff.baseStats.heart).toBe(7);
            // physicalSkill re-derives (7×1=7) then flat +1 = 8
            expect(eff.derivedStats.physicalSkill).toBe(8);
            expect(eff.derivedStats.mentalSkill).toBe(8);
            expect(eff.derivedStats.emotionalSkill).toBe(8);
            // luck re-derives as average(7,7,7) = 7 then flat +1 = 8
            expect(eff.derivedStats.luck).toBe(8);
        },
    },
];

describe('Phase 88 — Stat-band buffs: stat deltas via getEffectiveStats', () => {
    describe.each(statBandCases)('$label', ({ effectId, assertions }) => {
        it('applies cleanly and produces expected stat deltas at intensity 1', () => {
            const effect = lookupEffect(effectId);
            expect(effect, `${effectId} must exist in the effects library`).toBeDefined();

            const { activeEffects } = applyEffect([], effect!, 1);
            expect(activeEffects).toHaveLength(1);

            const combatant = combatantWithEffects(activeEffects);
            const eff = getEffectiveStats(combatant);
            assertions(eff);
        });
    });
});

// ─── No-stat-change effects (apply without error, don't alter stats) ──────────

const noStatCases = [
    { effectId: 'buff_cleanse', label: 'buff_cleanse (empty payload)' },
    { effectId: 'buff_buff_duration_up', label: 'buff_buff_duration_up (rollModifier only)' },
    { effectId: 'buff_status_chance_up', label: 'buff_status_chance_up (rollModifier only)' },
];

describe('Phase 88 — Stat-band buffs with no statModifiers', () => {
    it.each(noStatCases)('$label applies without error and does not change base stats', ({ effectId }) => {
        const effect = lookupEffect(effectId);
        expect(effect, `${effectId} must exist in the effects library`).toBeDefined();

        const { activeEffects, result } = applyEffect([], effect!, 1);
        expect(result.success).toBe(true);

        const combatant = combatantWithEffects(activeEffects);
        const eff = getEffectiveStats(combatant);
        expect(eff.baseStats).toEqual({ body: 5, mind: 5, heart: 5 });
    });
});
