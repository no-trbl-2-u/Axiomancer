import { afterAll, afterEach, beforeAll, describe, it, expect, vi } from 'vitest';

afterEach(() => {
    vi.restoreAllMocks();
});

import { createCharacter } from '../Character';
import { ActiveEffect, Effect } from '../Effects/types';
import { effectsLibrary } from '../Effects/effects.library';
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

/**
 * The spec 32 v3 keyword reset deleted the library effects that used to carry
 * derived-stat / save flat bands, negative-regen drain, grant-disadvantage, and
 * action-restriction payloads. No surviving library effect carries those
 * shapes, so — rather than weaken the machinery coverage those shapes exercise —
 * we register test-only `Effect` fixtures into the shared registry (the same
 * lookup `getActiveEffectModifiers` / `canAct` / the effect helpers resolve
 * through). These ids never touch the library JSON. Payloads that a surviving
 * effect DOES cover (defenseModifier, regeneration, advantage-grant,
 * multipliers, DoT, flat base-stat mods) are repointed to those real survivors.
 */
const mk = (id: string, type: 'buff' | 'debuff', payload: Effect['payload']): Effect => ({
    id,
    name: id,
    description: `test fixture ${id}`,
    type,
    category: 'stat',
    duration: 3,
    stacking: 'intensity',
    tier: 2,
    payload,
});

const TEST_EFFECTS: Effect[] = [
    // body +3, physicalDefense +4, physicalSave +3 — the retired stat-band shape.
    mk('test_band', 'buff', {
        statModifiers: [
            { stat: 'body', value: 3, isMultiplier: false },
            { stat: 'physicalDefense', value: 4, isMultiplier: false },
            { stat: 'physicalSave', value: 3, isMultiplier: false },
        ],
    }),
    // ×1.25 on body — a second body multiplier for additive composition.
    mk('test_mult125', 'buff', {
        statModifiers: [{ stat: 'body', value: 1.25, isMultiplier: true }],
    }),
    // Negative-regen drain shapes.
    mk('test_drain1', 'debuff', { regeneration: { healthPerRound: -1 } }),
    mk('test_drain2', 'debuff', { regeneration: { healthPerRound: -2 } }),
    // DoT (2 @ start) + drain (1) — the retired disease shape.
    mk('test_disease', 'debuff', {
        damageOverTime: { damagePerRound: 2, damageType: 'body', tickPhase: 'start' },
        regeneration: { healthPerRound: -1 },
    }),
    // grant-disadvantage on all three stances.
    mk('test_disadv_all', 'debuff', {
        advantageModifier: { grantDisadvantage: ['body', 'mind', 'heart'] },
    }),
    // grant-advantage on body only.
    mk('test_adv_body', 'buff', {
        advantageModifier: { grantAdvantage: ['body'] },
    }),
    // action-restriction shapes.
    mk('test_charm', 'debuff', { actionRestriction: { forcedStance: 'heart' } }),
    mk('test_silence', 'debuff', { actionRestriction: { blockedStances: ['heart'] } }),
    mk('test_stun', 'debuff', { actionRestriction: { skipTurn: true } }),
];

beforeAll(() => {
    for (const e of TEST_EFFECTS) effectsLibrary.registry.set(e.id, e);
});
afterAll(() => {
    for (const e of TEST_EFFECTS) effectsLibrary.registry.delete(e.id);
});

const fixture = (effects: ActiveEffect[]) =>
    ({ ...createCharacter({ name: 't', level: 1, baseStats: { heart: 5, body: 5, mind: 5 } }), effects });

const ae = (effectId: string, intensity = 1, remainingDuration = 3): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier: 2 });

describe('getActiveEffectModifiers', () => {
    it('aggregates flat statModifiers scaled by intensity (Q2)', () => {
        // test_band — +3 body, +4 physicalDefense (retired stat-band shape).
        const mods = getActiveEffectModifiers([ae('test_band', 2)]);
        expect(mods.statFlat.get('body')).toBe(6);
        expect(mods.statFlat.get('physicalDefense')).toBe(8);
    });

    it('composes multipliers additively (Q3)', () => {
        // buff_critical_damage_up has ×1.5 on body, mind, heart at intensity 1
        // test_mult125 has ×1.25 on body
        // Combined on body: (1.5 - 1) + (1.25 - 1) = 0.75 (additive composition)
        const mods = getActiveEffectModifiers([
            ae('buff_critical_damage_up', 1, 3),
            ae('test_mult125',            1, 5),
        ]);
        expect(mods.statMultBonus.get('body')).toBeCloseTo(0.75, 4);
    });

    it('aggregates DoT damage by tick phase (Q4)', () => {
        // spec 32 v3: poison ticks at start, bleed ticks at end. Intensity 1 each
        // keeps combined intensity (2) below the Hemorrhage combo's gate (3), so
        // this isolates the phase-split aggregation from live combo amplification.
        const mods = getActiveEffectModifiers([
            ae('debuff_poison', 1),  // v3 poison: 2 × 1 = 2 at start
            ae('debuff_bleed',  1),  // v3 bleed: 3 × 1 = 3 at end
        ]);
        expect(mods.dotStart).toBe(2);
        expect(mods.dotEnd).toBe(3);
    });

    it('amplifies DoT live when an amplify_damage combo is present (Phase 156)', () => {
        // poison (int 2) + bleed (int 1): combined intensity 3 ≥ 3 → Hemorrhage
        // fires, ×1.5 on poison's start DoT: floor(2 × 2 × 1.5) = 6. Bleed
        // (end phase, no combo target) stays at v3's 3 × 1 = 3.
        const mods = getActiveEffectModifiers([
            ae('debuff_poison', 2),
            ae('debuff_bleed',  1),
        ]);
        expect(mods.dotStart).toBe(6);
        expect(mods.dotEnd).toBe(3);
    });

    it('separates regen from drain (Q6)', () => {
        const mods = getActiveEffectModifiers([
            ae('buff_regeneration', 2),  // healthPerRound 4 × 2 = 8 (Phase 124 buff)
            ae('test_drain1',       1),  // healthPerRound -1 × 1 = drain 1
            ae('test_drain2',       1),  // healthPerRound -2 × 1 = drain 2
        ]);
        expect(mods.healthRegen).toBe(8);
        expect(mods.healthDrain).toBe(3);
    });

    it('collects advantage grants and denies as sets', () => {
        const mods = getActiveEffectModifiers([
            ae('buff_haste'),          // grantAdvantage [body, mind, heart]
            ae('test_disadv_all'),     // grantDisadvantage [body, mind, heart]
        ]);
        expect(mods.advantageGrants.has('body')).toBe(true);
        expect(mods.advantageGrants.has('mind')).toBe(true);
        expect(mods.advantageGrants.has('heart')).toBe(true);
        expect(mods.advantageDenies.size).toBe(3);
    });

    it('collects action restrictions', () => {
        const mods = getActiveEffectModifiers([
            ae('test_charm'),    // forcedStance: heart
            ae('test_silence'),  // blockedStances: [heart]
            ae('test_stun'),     // skipTurn: true
        ]);
        expect(mods.skipTurn).toBe(true);
        expect(mods.forcedStance).toBe('heart');
        expect(mods.blockedStances.has('heart')).toBe(true);
    });
});

describe('canAct (Q7 precedence)', () => {
    it('skipTurn wins over everything', () => {
        const result = canAct([ae('test_stun'), ae('test_charm')], 'body');
        expect(result.canAct).toBe(false);
        expect(result.reason).toBe('skipTurn');
    });

    it('forcedStance overrides requested stance', () => {
        const result = canAct([ae('test_charm')], 'body');
        expect(result.canAct).toBe(true);
        expect(result.resolvedStance).toBe('heart');
    });

    it('blockedStance prevents using a specific stance', () => {
        const result = canAct([ae('test_silence')], 'heart');
        expect(result.canAct).toBe(false);
        expect(result.reason).toBe('blockedStance');
    });

    it('blockedStance does not block other stances', () => {
        const result = canAct([ae('test_silence')], 'body');
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
        // test_band — +3 body, +4 physicalDefense (retired stat-band shape).
        const t = fixture([ae('test_band')]);
        const eff = getEffectiveStats(t);
        // body 5 + 3 = 8; physicalAttack derives from body × 1
        expect(eff.baseStats.body).toBe(8);
        expect(eff.derivedStats.physicalAttack).toBe(8);
        // physicalDefense = body(8) × 3 + 4 direct = 28
        expect(eff.derivedStats.physicalDefense).toBe(28);
    });

    it('multiplier on body scales every body-derived stat', () => {
        // test_mult125: ×1.25 on body
        const t = fixture([ae('test_mult125')]);
        const eff = getEffectiveStats(t);
        expect(eff.baseStats.body).toBe(5 * 1.25);
        // physicalDefense = body * 3 = 5 * 1.25 * 3 = 18.75
        expect(eff.derivedStats.physicalDefense).toBeCloseTo(18.75, 4);
    });

    it('exposes defenseDelta separately from stats', () => {
        // buff_damage_reduction: defenseModifier +5
        const t = fixture([ae('buff_damage_reduction')]);
        const eff = getEffectiveStats(t);
        expect(eff.defenseDelta).toBe(5);
    });

    it('intensity scales flat modifiers', () => {
        const t = fixture([ae('test_band', 3)]);
        const eff = getEffectiveStats(t);
        // +3 body × 3 intensity = +9 body; physicalDefense +4 × 3 = +12 direct
        expect(eff.baseStats.body).toBe(14);
        expect(eff.derivedStats.physicalDefense).toBe(14 * 3 + 12);
    });
});

describe('stat lookup helpers honor effective stats and defenseDelta', () => {
    it('getDefenseStat folds defenseDelta into derived defense', () => {
        const t = fixture([ae('buff_damage_reduction')]); // +5 defenseModifier
        // physicalDefense base = body(5) × 3 = 15; +5 delta = 20
        expect(getDefenseStat(t, 'body')).toBe(20);
    });

    it('getAttackStat reflects re-derived stat after base-stat mod', () => {
        const t = fixture([ae('test_band')]); // +3 body
        // physicalAttack = body(8) × 1 = 8
        expect(getAttackStat(t, 'body')).toBe(8);
    });

    it('getResistStat returns effective base stat', () => {
        const t = fixture([ae('test_band')]); // +3 body
        expect(getEffectiveStats(t).baseStats.body).toBe(8);
    });
});

describe('DoT and drain HP changes', () => {
    it('processDamageOverTime applies start-phase damage only', () => {
        const t = fixture([ae('debuff_poison', 2)]);
        const before = t.health;
        const r = processDamageOverTime(t, 'start');
        expect(r.damage).toBe(4); // canonical poison: 2 × 2 = 4 (patient ramp identity)
        expect(r.target.health).toBe(before - 4);
    });

    it('processDamageOverTime separates start from end phases', () => {
        const t = fixture([ae('debuff_poison'), ae('debuff_bleed')]);
        // v3 canonical set: poison starts (2), bleed ends (3 — the burst window)
        const startTick = processDamageOverTime(t, 'start');
        expect(startTick.damage).toBe(2);
        const endTick = processDamageOverTime(startTick.target, 'end');
        expect(endTick.damage).toBe(3);
    });

    it('applyDrain damages bearer based on negative regen', () => {
        const t = fixture([ae('test_drain1')]); // healthPerRound -1
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
        // canonical poison (DoT 2 start) + test_disease (DoT 2 start, drain 1)
        const t = { ...fixture([ae('debuff_poison'), ae('test_disease')]), health: 30 };
        const r = processRoundStartEffects(t);
        // start-DoT total: 2 + 2 = 4; drain: 1
        expect(r.dotDamage).toBe(4);
        expect(r.drained).toBe(1);
        expect(r.target.health).toBe(30 - 4 - 1);
    });
});

describe('processRoundEndEffects orchestrator', () => {
    it('applies end-DoT then ticks duration (v3 bleed decays 1 intensity per tick)', () => {
        const t = { ...fixture([ae('debuff_bleed', 2, 2)]), health: 20 };
        const r = processRoundEndEffects(t);
        expect(r.dotDamage).toBe(6); // v3 bleed: floor(3 × 2) = 6 front-loaded
        expect(r.target.health).toBe(14); // 20 - 6
        // Intensity decayed 2 → 1 (spec 32 v3 BLEED), duration ticked 2 → 1
        expect(r.target.effects[0].intensity).toBe(1);
        expect(r.target.effects[0].remainingDuration).toBe(1);
    });
});

describe('applyCleanse / applyDispel (Q10)', () => {
    it('Tier 2 cleanse strips Tier 1 + 2 debuffs', () => {
        const t = fixture([
            { effectId: 'debuff_poison', intensity: 1, remainingDuration: 3, appliedAt: 1, tier: 2 },
            { effectId: 'debuff_backfire_acute', intensity: 1, remainingDuration: 2, appliedAt: 1, tier: 3 },
        ]);
        const r = applyCleanse(t, 2);
        expect(r.removed.map(e => e.effectId)).toEqual(['debuff_poison']);
        // Tier 3 survives
        expect(r.target.effects.some(e => e.effectId === 'debuff_backfire_acute')).toBe(true);
    });

    it('Tier 3 cleanse strips everything', () => {
        const t = fixture([
            { effectId: 'debuff_poison',  intensity: 1, remainingDuration: 3, appliedAt: 1, tier: 2 },
            { effectId: 'debuff_backfire_acute', intensity: 1, remainingDuration: 2, appliedAt: 1, tier: 3 },
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
        // matchup is disadvantage but test_adv_body grants advantage on body
        const adv = resolveEffectiveAdvantage('disadvantage', [ae('test_adv_body')], 'body');
        expect(adv).toBe('advantage');
    });

    it('granted disadvantage overrides matchup advantage', () => {
        // grantDisadvantage on body via test_disadv_all
        const adv = resolveEffectiveAdvantage('advantage', [ae('test_disadv_all')], 'body');
        expect(adv).toBe('disadvantage');
    });

    it('falls back to matchup when no override applies', () => {
        const adv = resolveEffectiveAdvantage('neutral', [], 'body');
        expect(adv).toBe('neutral');
    });

    it('grant on a different stance does not affect this stance', () => {
        const adv = resolveEffectiveAdvantage('neutral', [ae('test_adv_body')], 'heart');
        expect(adv).toBe('neutral');
    });
});
