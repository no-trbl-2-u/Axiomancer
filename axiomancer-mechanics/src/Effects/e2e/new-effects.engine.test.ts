/**
 * The spec 32 v3 card-vocabulary effect sweep (re-pinned 2026-07-08).
 *
 * The pre-v3 "since April" content sweep this file used to cover was retired
 * wholesale with the keyword reset. What remains under coverage is the
 * rebuilt CARD vocabulary — exactly six effects — plus the schema contract
 * every entry must honour. Asserts that:
 *   - every card-vocabulary id resolves via the effects library lookup,
 *   - each has a valid tier (1-3) and a non-empty payload,
 *   - tier 2/3 entries declare `resistedBy` (+ a `resistDR`),
 *   - each carries provenance (`addedIn` ISO date + the `v3` tag),
 *   - each applies cleanly via the engine,
 *   - the v3-specific payload numbers (spec 32 §3) are pinned.
 */

import { describe, it, expect } from 'vitest';
import { applyEffect } from '../../Effects';
import { lookupEffect } from '../effects.library';
import type { Effect, EffectPayload } from '../types';

const V3_BUFF_IDS = ['buff_thorns'];

const V3_DEBUFF_IDS = [
    'debuff_poison',
    'debuff_bleed',
    'debuff_mark',
    'debuff_backfire',
    'debuff_quarter',
];

const ALL_V3_IDS = [...V3_BUFF_IDS, ...V3_DEBUFF_IDS];

const payloadIsNonEmpty = (payload: EffectPayload): boolean =>
    Object.keys(payload).length > 0;

describe('v3 card vocabulary — library lookup + schema', () => {
    it('every v3 id resolves via lookupEffect', () => {
        for (const id of ALL_V3_IDS) {
            expect(lookupEffect(id), `${id} must exist in the effects library`).toBeDefined();
        }
    });

    it.each(V3_BUFF_IDS)('%s is typed as a buff', (id) => {
        expect(lookupEffect(id)!.type).toBe('buff');
    });

    it.each(V3_DEBUFF_IDS)('%s is typed as a debuff', (id) => {
        expect(lookupEffect(id)!.type).toBe('debuff');
    });

    it.each(ALL_V3_IDS)('%s has a valid tier (1-3) and non-empty payload', (id) => {
        const effect = lookupEffect(id) as Effect;
        expect([1, 2, 3]).toContain(effect.tier);
        expect(payloadIsNonEmpty(effect.payload)).toBe(true);
    });

    it.each(ALL_V3_IDS)('%s tier 2/3 declares resistedBy + resistDR', (id) => {
        const effect = lookupEffect(id) as Effect;
        if (effect.tier >= 2) {
            expect(effect.resistedBy, `${id} (tier ${effect.tier}) must declare resistedBy`).toBeDefined();
            expect(['body', 'mind', 'heart']).toContain(effect.resistedBy);
            expect(typeof effect.resistDR).toBe('number');
        }
    });

    it.each(ALL_V3_IDS)('%s stacks by intensity (the v3 stacking law)', (id) => {
        expect(lookupEffect(id)!.stacking).toBe('intensity');
    });
});

describe('v3 card vocabulary — provenance metadata', () => {
    it.each(ALL_V3_IDS)('%s carries the v3 reset addedIn date', (id) => {
        const effect = lookupEffect(id) as Effect;
        expect(effect.addedIn).toBe('2026-07-08');
    });

    it.each(ALL_V3_IDS)('%s carries non-empty tags including v3', (id) => {
        const effect = lookupEffect(id) as Effect;
        expect(Array.isArray(effect.tags)).toBe(true);
        expect(effect.tags!.length).toBeGreaterThan(0);
        expect(effect.tags).toContain('v3');
    });
});

describe('v3 card vocabulary — pinned payload numbers (spec 32 §3)', () => {
    it('debuff_poison is the ramping DoT (dpr 2, dur 4, rampFactor 0.5)', () => {
        const poison = lookupEffect('debuff_poison')!;
        expect(poison.duration).toBe(4);
        expect(poison.payload.damageOverTime?.damagePerRound).toBe(2);
        expect(poison.payload.dotModifiers?.escalatesPerTurn).toBe(true);
        expect(poison.payload.dotModifiers?.rampFactor).toBe(0.5);
    });

    it('debuff_bleed is the front-loaded DoT (dpr 3, dur 3, decays per tick)', () => {
        const bleed = lookupEffect('debuff_bleed')!;
        expect(bleed.duration).toBe(3);
        expect(bleed.payload.damageOverTime?.damagePerRound).toBe(3);
        expect(bleed.payload.dotModifiers?.decaysPerTick).toBe(true);
    });

    it('debuff_mark amplifies every DoT tick by +1 per stack', () => {
        const mark = lookupEffect('debuff_mark')!;
        expect((mark.payload as { tickAmplifyFlat?: number }).tickAmplifyFlat).toBe(1);
    });

    it('debuff_backfire bills the enemy per denied rung', () => {
        const backfire = lookupEffect('debuff_backfire')!;
        expect((backfire.payload as { backfirePerRung?: number }).backfirePerRung).toBe(1);
    });

    it('debuff_quarter softens outgoing enemy damage by 10% per stack', () => {
        const rapport = lookupEffect('debuff_quarter')!;
        expect(rapport.payload.outgoingDamageMulPct).toBe(-10);
    });

    it('buff_thorns reflects 1 per stack', () => {
        const thorns = lookupEffect('buff_thorns')!;
        expect(thorns.payload.reflectDamage).toBe(1);
    });
});

describe('v3 card vocabulary — apply cleanly via the engine', () => {
    it.each(ALL_V3_IDS)('%s applies without error', (id) => {
        const effect = lookupEffect(id)!;
        const { activeEffects, result } = applyEffect([], effect, 1);
        expect(result.success).toBe(true);
        expect(activeEffects).toHaveLength(1);
    });
});
