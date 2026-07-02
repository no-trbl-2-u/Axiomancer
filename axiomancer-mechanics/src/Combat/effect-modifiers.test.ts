import { afterEach, describe, it, expect, vi } from 'vitest';

afterEach(() => {
    vi.restoreAllMocks();
});

import { createCharacter } from '../Character';
import { ActiveEffect } from '../Effects/types';
import {
    getActiveEffectModifiers,
    getEffectiveStats,
    canAct,
} from './effect-modifiers';
import {
    applyRegen, applyDrain,
    processDamageOverTime, processRoundStartEffects, processRoundEndEffects,
    applyCleanse, applyDispel,
} from './effects';
import { resolveEffectiveAdvantage } from './advantage';
import { getAttackStat, getDefenseStat } from './stats';

const fixture = (effects: ActiveEffect[]) =>
    ({ ...createCharacter({ name: 't', level: 1, baseStats: { heart: 5, body: 5, mind: 5 } }), effects });

const ae = (effectId: string, intensity = 1, remainingDuration = 3): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier: 2 });

describe('getActiveEffectModifiers', () => {
    it('aggregates flat statModifiers scaled by intensity (Q2)', () => {
        // buff_body_attack_up: +2 body, +3 physicalSkill, rollModifier +2
        const mods = getActiveEffectModifiers([ae('buff_body_attack_up', 2)]);
        expect(mods.statFlat.get('body')).toBe(4);
        expect(mods.statFlat.get('physicalSkill')).toBe(6);
    });

    it('composes multipliers additively (Q3)', () => {
        // buff_critical_damage_up has ×1.5 on body, mind, heart at intensity 1
        // buff_max_hp_up has ×1.25 on body
        // Combined on body: (1.5 - 1) + (1.25 - 1) = 0.75 (additive composition)
        const mods = getActiveEffectModifiers([
            ae('buff_critical_damage_up', 1, 3),
            ae('buff_max_hp_up',          1, 5),
        ]);
        expect(mods.statMultBonus.get('body')).toBeCloseTo(0.75, 4);
    });

    it('aggregates DoT damage by tick phase (Q4)', () => {
        // poison ticks at start (default), tartarus_rot ticks at end (data-driven).
        // Neither forms an amplify_damage combo with the other, so this isolates
        // the phase-split aggregation from Phase 156 live combo amplification
        // (combo amplification is covered in status-combo-amplification.engine.test.ts).
        const mods = getActiveEffectModifiers([
            ae('debuff_poison',        2),  // 4 × 2 = 8 at start
            ae('debuff_tartarus_rot',  2),  // 4 × 2 = 8 at end
        ]);
        expect(mods.dotStart).toBe(8);
        expect(mods.dotEnd).toBe(8);
    });

    it('amplifies DoT live when an amplify_damage combo is present (Phase 156)', () => {
        // poison (int 2) + bleed (int 1): combined intensity 3 ≥ 3 → Hemorrhage
        // fires, ×1.5 on poison's start DoT: floor(4 × 2 × 1.5) = 12. Bleed
        // (end phase, no combo target) stays at 3 × 1 = 3.
        const mods = getActiveEffectModifiers([
            ae('debuff_poison', 2),
            ae('debuff_bleed',  1),
        ]);
        expect(mods.dotStart).toBe(12);
        expect(mods.dotEnd).toBe(3);
    });

    it('separates regen from drain (Q6)', () => {
        const mods = getActiveEffectModifiers([
            ae('buff_regeneration', 2),  // healthPerRound 4 × 2 = 8 (Phase 124 buff)
            ae('debuff_disease',    1),  // healthPerRound -1 × 1 = drain 1
            ae('debuff_hp_decay',   1),  // healthPerRound -2 × 1 = drain 2
        ]);
        expect(mods.healthRegen).toBe(8);
        expect(mods.healthDrain).toBe(3);
    });

    it('collects advantage grants and denies as sets', () => {
        const mods = getActiveEffectModifiers([
            ae('buff_haste'),          // grantAdvantage [body, mind, heart]
            ae('debuff_confusion'),    // grantDisadvantage [body, mind, heart]
            ae('buff_advantage_body'), // grantAdvantage [body]
        ]);
        expect(mods.advantageGrants.has('body')).toBe(true);
        expect(mods.advantageGrants.has('mind')).toBe(true);
        expect(mods.advantageGrants.has('heart')).toBe(true);
        expect(mods.advantageDenies.size).toBe(3);
    });

    it('collects action restrictions', () => {
        const mods = getActiveEffectModifiers([
            ae('debuff_charm'),    // forcedStance: heart
            ae('debuff_silence'),  // blockedStances: [heart]
            ae('debuff_stun'),     // skipTurn: true
        ]);
        expect(mods.skipTurn).toBe(true);
        expect(mods.forcedStance).toBe('heart');
        expect(mods.blockedStances.has('heart')).toBe(true);
    });
});

describe('canAct (Q7 precedence)', () => {
    it('skipTurn wins over everything', () => {
        const result = canAct([ae('debuff_stun'), ae('debuff_charm')], 'body');
        expect(result.canAct).toBe(false);
        expect(result.reason).toBe('skipTurn');
    });

    it('forcedStance overrides requested stance', () => {
        const result = canAct([ae('debuff_charm')], 'body');
        expect(result.canAct).toBe(true);
        expect(result.resolvedStance).toBe('heart');
    });

    it('blockedStance prevents using a specific stance', () => {
        const result = canAct([ae('debuff_silence')], 'heart');
        expect(result.canAct).toBe(false);
        expect(result.reason).toBe('blockedStance');
    });

    it('blockedStance does not block other stances', () => {
        const result = canAct([ae('debuff_silence')], 'body');
        expect(result.canAct).toBe(true);
        expect(result.resolvedStance).toBe('body');
    });

    it('returns the requested stance when no restrictions apply', () => {
        const result = canAct([], 'mind');
        expect(result.canAct).toBe(true);
        expect(result.resolvedStance).toBe('mind');
    });
});

describe('getEffectiveStats', () => {
    it('flat stat modifier on a base stat re-derives derived stats', () => {
        // buff_body_attack_up: +2 body, +3 physicalSkill
        const t = fixture([ae('buff_body_attack_up')]);
        const eff = getEffectiveStats(t);
        // body 5 + 2 = 7; physicalAttack derives from body × 1
        expect(eff.baseStats.body).toBe(7);
        expect(eff.derivedStats.physicalAttack).toBe(7);
        // physicalSkill = body(7)*1 + 3 direct = 10
        expect(eff.derivedStats.physicalSkill).toBe(10);
    });

    it('multiplier on body scales every body-derived stat', () => {
        // buff_max_hp_up: ×1.25 on body
        const t = fixture([ae('buff_max_hp_up')]);
        const eff = getEffectiveStats(t);
        expect(eff.baseStats.body).toBe(5 * 1.25);
        // physicalDefense = body * 3 = 5 * 1.25 * 3 = 18.75
        expect(eff.derivedStats.physicalDefense).toBeCloseTo(18.75, 4);
    });

    it('exposes defenseDelta separately from stats', () => {
        // buff_barrier: defenseModifier +5
        const t = fixture([ae('buff_barrier')]);
        const eff = getEffectiveStats(t);
        expect(eff.defenseDelta).toBe(5);
    });

    it('intensity scales flat modifiers', () => {
        const t = fixture([ae('buff_body_attack_up', 3)]);
        const eff = getEffectiveStats(t);
        // +2 body × 3 intensity = +6 body, +3 phys skill × 3 = +9
        expect(eff.baseStats.body).toBe(11);
        expect(eff.derivedStats.physicalSkill).toBe(11 + 9);
    });
});

describe('stat lookup helpers honor effective stats and defenseDelta', () => {
    it('getDefenseStat folds defenseDelta into derived defense', () => {
        const t = fixture([ae('buff_barrier')]); // +5 defenseModifier
        // physicalDefense base = body(5) × 3 = 15; +5 delta = 20
        expect(getDefenseStat(t, 'body')).toBe(20);
    });

    it('getAttackStat reflects re-derived stat after base-stat mod', () => {
        const t = fixture([ae('buff_body_attack_up')]); // +2 body, +3 physicalSkill
        // physicalAttack = body(7) × 1 = 7
        expect(getAttackStat(t, 'body')).toBe(7);
    });

    it('getResistStat returns effective base stat', () => {
        const t = fixture([ae('buff_body_attack_up')]); // +2 body
        expect(getEffectiveStats(t).baseStats.body).toBe(7);
    });
});

describe('DoT and drain HP changes', () => {
    it('processDamageOverTime applies start-phase damage only', () => {
        const t = fixture([ae('debuff_poison', 2)]);
        const before = t.health;
        const r = processDamageOverTime(t, 'start');
        expect(r.damage).toBe(8); // 4 × 2 = 8 (strengthened in Phase 126)
        expect(r.target.health).toBe(before - 8);
    });

    it('processDamageOverTime separates start from end phases', () => {
        const t = fixture([ae('debuff_poison'), ae('debuff_bleed')]);
        // poison starts (4), bleed ends (3) - both strengthened in Phase 126
        const startTick = processDamageOverTime(t, 'start');
        expect(startTick.damage).toBe(4);
        const endTick = processDamageOverTime(startTick.target, 'end');
        expect(endTick.damage).toBe(3);
    });

    it('applyDrain damages bearer based on negative regen', () => {
        const t = fixture([ae('debuff_disease')]); // healthPerRound -1
        const before = t.health;
        const r = applyDrain(t);
        expect(r.drained).toBe(1);
        expect(r.target.health).toBe(before - 1);
    });

    it('applyRegen scales with intensity (Q2)', () => {
        const damaged = { ...fixture([ae('buff_regeneration', 2)]), health: 10 };
        // healthPerRound 4 × intensity 2 = 8 (Phase 124 buff)
        const r = applyRegen(damaged);
        expect(r.healed).toBe(8);
        expect(r.target.health).toBe(18);
    });

});

describe('processRoundStartEffects orchestrator', () => {
    it('applies regen, drain and start-DoT in one call', () => {
        // poison (DoT 4 start, strengthened in Phase 126) + disease (DoT 2 start, drain 1)
        const t = { ...fixture([ae('debuff_poison'), ae('debuff_disease')]), health: 30 };
        const r = processRoundStartEffects(t);
        // start-DoT total: 4 + 2 = 6; drain: 1
        expect(r.dotDamage).toBe(6);
        expect(r.drained).toBe(1);
        expect(r.target.health).toBe(30 - 6 - 1);
    });
});

describe('processRoundEndEffects orchestrator', () => {
    it('applies end-DoT then ticks duration', () => {
        const t = { ...fixture([ae('debuff_bleed', 1, 2)]), health: 20 };
        const r = processRoundEndEffects(t);
        expect(r.dotDamage).toBe(3); // strengthened from 2 to 3 in Phase 126
        expect(r.target.health).toBe(17); // 20 - 3 = 17
        // Duration ticked from 2 → 1
        expect(r.target.effects[0].remainingDuration).toBe(1);
    });
});

describe('applyCleanse / applyDispel (Q10)', () => {
    it('Tier 2 cleanse strips Tier 1 + 2 debuffs', () => {
        const t = fixture([
            { effectId: 'debuff_poison', intensity: 1, remainingDuration: 3, appliedAt: 1, tier: 2 },
            { effectId: 'debuff_petrify', intensity: 1, remainingDuration: 2, appliedAt: 1, tier: 3 },
        ]);
        const r = applyCleanse(t, 2);
        expect(r.removed.map(e => e.effectId)).toEqual(['debuff_poison']);
        // Tier 3 survives
        expect(r.target.effects.some(e => e.effectId === 'debuff_petrify')).toBe(true);
    });

    it('Tier 3 cleanse strips everything', () => {
        const t = fixture([
            { effectId: 'debuff_poison',  intensity: 1, remainingDuration: 3, appliedAt: 1, tier: 2 },
            { effectId: 'debuff_petrify', intensity: 1, remainingDuration: 2, appliedAt: 1, tier: 3 },
        ]);
        const r = applyCleanse(t, 3);
        expect(r.removed).toHaveLength(2);
    });

    it('Tier 2 dispel strips Tier 1 + 2 buffs but leaves Tier 3', () => {
        const t = fixture([
            { effectId: 'buff_regeneration', intensity: 1, remainingDuration: 3, appliedAt: 1, tier: 2 },
            { effectId: 'buff_haste',        intensity: 1, remainingDuration: 2, appliedAt: 1, tier: 3 },
        ]);
        const r = applyDispel(t, 2);
        expect(r.removed.map(e => e.effectId)).toEqual(['buff_regeneration']);
    });
});

describe('resolveEffectiveAdvantage (Q8)', () => {
    it('granted advantage on attacker stance overrides matchup', () => {
        // matchup is disadvantage but buff_advantage_body grants advantage on body
        const adv = resolveEffectiveAdvantage('disadvantage', [ae('buff_advantage_body')], 'body');
        expect(adv).toBe('advantage');
    });

    it('granted disadvantage overrides matchup advantage', () => {
        // grantDisadvantage on body via debuff_slow
        const adv = resolveEffectiveAdvantage('advantage', [ae('debuff_slow')], 'body');
        expect(adv).toBe('disadvantage');
    });

    it('falls back to matchup when no override applies', () => {
        const adv = resolveEffectiveAdvantage('neutral', [], 'body');
        expect(adv).toBe('neutral');
    });

    it('grant on a different stance does not affect this stance', () => {
        const adv = resolveEffectiveAdvantage('neutral', [ae('buff_advantage_body')], 'heart');
        expect(adv).toBe('neutral');
    });
});
