/**
 * Phase 88 — Advantage-category effects coverage sweep.
 *
 * Drains the Phase 79 LOW "Advantage-category effects (13 of 14 uncovered)"
 * CRITIQUE row. For each effect, asserts it applies cleanly and that
 * `getActiveEffectModifiers` reflects the expected advantageGrants/Denies +
 * any stat deltas or defenseModifier.
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

// ─── Buff effects with advantageModifier ──────────────────────────────────────

describe('Phase 88 — Advantage buffs: advantageGrants via getActiveEffectModifiers', () => {
    it('buff_advantage_mind grants advantage on mind', () => {
        const mods = getActiveEffectModifiers([ae('buff_advantage_mind')]);
        expect(mods.advantageGrants.has('mind')).toBe(true);
        // Also has stat bumps: mind +1, mentalSkill +2
        expect(mods.statFlat.get('mind')).toBe(1);
        expect(mods.statFlat.get('mentalSkill')).toBe(2);
    });

    it('buff_advantage_heart grants advantage on heart', () => {
        const mods = getActiveEffectModifiers([ae('buff_advantage_heart')]);
        expect(mods.advantageGrants.has('heart')).toBe(true);
        expect(mods.statFlat.get('heart')).toBe(1);
        expect(mods.statFlat.get('emotionalSkill')).toBe(2);
    });

    it('buff_evasion_up grants disadvantage on all stances (to attackers) + defense', () => {
        const mods = getActiveEffectModifiers([ae('buff_evasion_up')]);
        expect(mods.advantageDenies.has('body')).toBe(true);
        expect(mods.advantageDenies.has('mind')).toBe(true);
        expect(mods.advantageDenies.has('heart')).toBe(true);
        expect(mods.defenseDelta).toBe(3);
        // stat bumps: physicalDefense +2, mentalDefense +2, emotionalDefense +2
        expect(mods.statFlat.get('physicalDefense')).toBe(2);
        expect(mods.statFlat.get('mentalDefense')).toBe(2);
        expect(mods.statFlat.get('emotionalDefense')).toBe(2);
    });

    it('buff_accuracy_up has rollModifier and skill bumps (no advantageModifier)', () => {
        const effect = lookupEffect('buff_accuracy_up');
        expect(effect).toBeDefined();
        const { activeEffects } = applyEffect([], effect!, 1);
        const mods = getActiveEffectModifiers(activeEffects);
        // No advantageModifier in the payload — just stat + roll
        expect(mods.advantageGrants.size).toBe(0);
        expect(mods.statFlat.get('physicalSkill')).toBe(2);
        expect(mods.statFlat.get('mentalSkill')).toBe(2);
        expect(mods.statFlat.get('emotionalSkill')).toBe(2);
    });

    it('buff_damage_reduction has defenseModifier 5', () => {
        const mods = getActiveEffectModifiers([ae('buff_damage_reduction')]);
        expect(mods.defenseDelta).toBe(5);
    });

    it('buff_invincibility has defenseModifier 99', () => {
        const mods = getActiveEffectModifiers([ae('buff_invincibility')]);
        expect(mods.defenseDelta).toBe(99);
    });

    it('buff_taunt has defenseModifier 2 + body +1', () => {
        const mods = getActiveEffectModifiers([ae('buff_taunt')]);
        expect(mods.defenseDelta).toBe(2);
        expect(mods.statFlat.get('body')).toBe(1);
    });

    it('buff_stealth grants advantage on all stances + defenseModifier 6', () => {
        const mods = getActiveEffectModifiers([ae('buff_stealth')]);
        expect(mods.advantageGrants.has('body')).toBe(true);
        expect(mods.advantageGrants.has('mind')).toBe(true);
        expect(mods.advantageGrants.has('heart')).toBe(true);
        expect(mods.defenseDelta).toBe(6);
    });

    it('buff_counter grants advantage on body + rollModifier', () => {
        const mods = getActiveEffectModifiers([ae('buff_counter')]);
        expect(mods.advantageGrants.has('body')).toBe(true);
        expect(mods.advantageGrants.has('mind')).toBe(false);
    });

    it('buff_life_steal has regen healthPerRound 2', () => {
        const mods = getActiveEffectModifiers([ae('buff_life_steal')]);
        expect(mods.healthRegen).toBe(2);
    });
});

// ─── Debuff effects in the advantage category ─────────────────────────────────

describe('Phase 88 — Advantage debuffs: disadvantage + stat/defense reduction', () => {
    it('debuff_evasion_down reduces defense and all defense stats', () => {
        const mods = getActiveEffectModifiers([ae('debuff_evasion_down')]);
        expect(mods.defenseDelta).toBe(-3);
        expect(mods.statFlat.get('physicalDefense')).toBe(-2);
        expect(mods.statFlat.get('mentalDefense')).toBe(-2);
        expect(mods.statFlat.get('emotionalDefense')).toBe(-2);
    });

    it('debuff_accuracy_down reduces all skill stats', () => {
        const mods = getActiveEffectModifiers([ae('debuff_accuracy_down')]);
        expect(mods.statFlat.get('physicalSkill')).toBe(-2);
        expect(mods.statFlat.get('mentalSkill')).toBe(-2);
        expect(mods.statFlat.get('emotionalSkill')).toBe(-2);
    });

    it('debuff_defense_down reduces defense and body + physicalDefense', () => {
        const mods = getActiveEffectModifiers([ae('debuff_defense_down')]);
        expect(mods.defenseDelta).toBe(-3);
        expect(mods.statFlat.get('body')).toBe(-1);
        expect(mods.statFlat.get('physicalDefense')).toBe(-2);
    });
});

// ─── Application sanity ───────────────────────────────────────────────────────

describe('Phase 88 — Advantage effects: all apply without error', () => {
    const allIds = [
        'buff_advantage_mind', 'buff_advantage_heart', 'buff_evasion_up',
        'buff_accuracy_up', 'buff_damage_reduction', 'buff_invincibility',
        'buff_taunt', 'buff_stealth', 'buff_counter', 'buff_life_steal',
        'debuff_evasion_down', 'debuff_accuracy_down', 'debuff_defense_down',
    ];

    it.each(allIds)('%s applies cleanly via applyEffect', (effectId) => {
        const effect = lookupEffect(effectId);
        expect(effect, `${effectId} must exist in the effects library`).toBeDefined();
        const { activeEffects, result } = applyEffect([], effect!, 1);
        expect(result.success).toBe(true);
        expect(activeEffects).toHaveLength(1);
    });
});
