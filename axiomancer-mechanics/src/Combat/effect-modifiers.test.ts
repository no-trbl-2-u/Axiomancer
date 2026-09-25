import { afterAll, afterEach, beforeAll, describe, it, expect, vi } from 'vitest';

afterEach(() => {
    vi.restoreAllMocks();
});

import { createCharacter } from '../Character';
import { ActiveEffect, Effect } from '../Effects/types';
import { effectsLibrary } from '../Effects/effects.library';
import {
    getActiveEffectModifiers,
    getActiveDotTotal,
    canAct,
} from './effect-modifiers';
import {
    applyRegen, applyDrain,
    processDamageOverTime, processRoundStartEffects, processRoundEndEffects,
    applyCleanse, applyDispel,
} from './effects';

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
    // ×1.5 on body/mind/heart — the retired crit-damage shape, kept synthetic
    // so the additive-composition assertion no longer depends on a library
    // effect's payload (buff_critical_damage_up was re-themed to advantage).
    mk('test_mult15', 'buff', {
        statModifiers: [
            { stat: 'body', value: 1.5, isMultiplier: true },
            { stat: 'mind', value: 1.5, isMultiplier: true },
            { stat: 'heart', value: 1.5, isMultiplier: true },
        ],
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
        // test_mult15 has ×1.5 on body, mind, heart at intensity 1
        // test_mult125 has ×1.25 on body
        // Combined on body: (1.5 - 1) + (1.25 - 1) = 0.75 (additive composition)
        const mods = getActiveEffectModifiers([
            ae('test_mult15',  1, 3),
            ae('test_mult125', 1, 5),
        ]);
        expect(mods.statMultBonus.get('body')).toBeCloseTo(0.75, 4);
    });

    it('aggregates ROUND-CLOCK DoT damage by tick phase (Q4) — event clocks stay off the boundary', () => {
        // WS3.3: poison/bleed moved to event clocks — the round aggregator
        // must carry ZERO for them. The round-clocked card-local species
        // (kindling ember: start; nettle sting: end) keep the phase split.
        const mods = getActiveEffectModifiers([
            ae('debuff_kindling_ember', 2),  // 1 × 2 = 2 at start
            ae('debuff_nettle_sting',   1),  // 2 × 1 = 2 at end
            ae('debuff_poison', 1),          // card-played clock → 0 here
            ae('debuff_bleed',  1),          // damage-instance clock → 0 here
        ]);
        expect(mods.dotStart).toBe(2);
        expect(mods.dotEnd).toBe(2);
    });

    it('amplifies DoT live when an amplify_damage combo is present (Phase 156)', () => {
        // poison (int 2) + bleed (int 1): combined intensity 3 ≥ 3 → Hemorrhage
        // fires, ×1.5 on poison. WS3.3: both ride EVENT clocks now, so the
        // amplified figure surfaces via `getActiveDotTotal` (the per-tick
        // surface) — the round-boundary aggregate stays 0 for both phases.
        const effects = [
            ae('debuff_poison', 2),
            ae('debuff_bleed',  1),
        ];
        const mods = getActiveEffectModifiers(effects);
        expect(mods.dotStart).toBe(0);
        expect(mods.dotEnd).toBe(0);
        // floor(2 × 2 × 1.5) = 6 (poison, Hemorrhage) + 3 × 1 = 3 (bleed).
        expect(getActiveDotTotal(effects).total).toBe(9);
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

describe('DoT and drain HP changes', () => {
    it('processDamageOverTime applies start-phase damage only', () => {
        // WS3.3: poison left the round clocks — the round-clocked witness is
        // kindling ember (dpr 1, start phase).
        const t = fixture([ae('debuff_kindling_ember', 2)]);
        const before = t.health;
        const r = processDamageOverTime(t, 'start');
        expect(r.damage).toBe(2); // ember: 1 × 2 = 2
        expect(r.target.health).toBe(before - 2);
    });

    it('processDamageOverTime separates start from end phases (event clocks excluded)', () => {
        // Round-clocked species: ember starts (1), nettle ends (2). The
        // event-clocked poison/bleed never tick at either boundary (WS3.3).
        const t = fixture([
            ae('debuff_kindling_ember'), ae('debuff_nettle_sting'),
            ae('debuff_poison'), ae('debuff_bleed'),
        ]);
        const startTick = processDamageOverTime(t, 'start');
        expect(startTick.damage).toBe(1);
        const endTick = processDamageOverTime(startTick.target, 'end');
        expect(endTick.damage).toBe(2);
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
        // kindling ember (DoT 1 start, ×2) + test_disease (DoT 2 start,
        // drain 1 — the retired disease shape as a fixture). WS3.3: poison is
        // event-clocked and would carry 0 at the round boundary.
        const t = { ...fixture([ae('debuff_kindling_ember', 2), ae('test_disease')]), health: 30 };
        const r = processRoundStartEffects(t);
        // start-DoT total: 2 + 2 = 4; drain: 1
        expect(r.dotDamage).toBe(4);
        expect(r.drained).toBe(1);
        expect(r.target.health).toBe(30 - 4 - 1);
    });
});

describe('processRoundEndEffects orchestrator', () => {
    it('applies end-DoT then ticks duration; event-clocked BLEED stays off the boundary (WS3.3)', () => {
        // nettle sting is the round-end witness (dpr 2). BLEED rides the
        // damage-instance clock now: it neither ticks nor decays at round end
        // (its per-tick decay is exercised via `fireDotTrigger`); its
        // CALENDAR still counts down.
        const t = { ...fixture([ae('debuff_nettle_sting', 2, 2), ae('debuff_bleed', 2, 2)]), health: 20 };
        const r = processRoundEndEffects(t);
        expect(r.dotDamage).toBe(4); // nettle: floor(2 × 2) = 4; bleed: 0
        expect(r.target.health).toBe(16); // 20 - 4
        const nettle = r.target.effects.find(e => e.effectId === 'debuff_nettle_sting')!;
        expect(nettle.intensity).toBe(2); // decaysPerTick: false
        expect(nettle.remainingDuration).toBe(1);
        const bleed = r.target.effects.find(e => e.effectId === 'debuff_bleed')!;
        expect(bleed.intensity).toBe(2); // no round-end tick → no decay
        expect(bleed.remainingDuration).toBe(1); // calendar unchanged by WS3.3
    });
});

describe('applyCleanse / applyDispel (Q10)', () => {
    it('Tier 2 cleanse strips Tier 1 + 2 debuffs', () => {
        const t = fixture([
            { effectId: 'debuff_poison', intensity: 1, remainingDuration: 3, appliedAt: 1, tier: 2 },
            { effectId: 'debuff_backfire', intensity: 1, remainingDuration: 2, appliedAt: 1, tier: 3 },
        ]);
        const r = applyCleanse(t, 2);
        expect(r.removed.map(e => e.effectId)).toEqual(['debuff_poison']);
        // Tier 3 survives
        expect(r.target.effects.some(e => e.effectId === 'debuff_backfire')).toBe(true);
    });

    it('Tier 3 cleanse strips everything', () => {
        const t = fixture([
            { effectId: 'debuff_poison',  intensity: 1, remainingDuration: 3, appliedAt: 1, tier: 2 },
            { effectId: 'debuff_backfire', intensity: 1, remainingDuration: 2, appliedAt: 1, tier: 3 },
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

