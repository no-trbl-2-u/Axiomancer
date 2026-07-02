/**
 * Phase 124 - Stronger effects verification
 * Hermetic e2e ensuring strengthened effects produce expected greater impact
 */

import { describe, it, expect } from 'vitest';
import { lookupEffect } from '../effects.library';

describe('Phase 124 - Stronger skills/effects', () => {
    it('tier1_heart_defend provides stronger healing and longer duration', async () => {
        const healing = lookupEffect('tier1_heart_defend');
        expect(healing).toBeDefined();
        
        // Phase 124: increased from healthPerRound: 1 → 2, duration: 3 → 4
        expect(healing!.duration).toBe(4);
        expect(healing!.payload.regeneration?.healthPerRound).toBe(2);
    });

    it('tier1_body_attack has stronger stat bonus and longer duration', async () => {
        const bodyBuff = lookupEffect('tier1_body_attack');
        expect(bodyBuff).toBeDefined();
        
        // Phase 124: increased physicalAttack value: 1 → 2, duration: 2 → 3
        expect(bodyBuff!.duration).toBe(3);
        expect(bodyBuff!.payload.statModifiers?.[0].value).toBe(2);
        expect(bodyBuff!.payload.statModifiers?.[0].stat).toBe('physicalAttack');
    });

    it('debuff_confusion has stronger penalty and longer duration', async () => {
        const confusion = lookupEffect('debuff_confusion');
        expect(confusion).toBeDefined();
        
        // Phase 124: increased rollModifier: -4 → -5, duration: 3 → 4
        expect(confusion!.duration).toBe(4);
        expect(confusion!.payload.rollModifier).toBe(-5);
        
        // Should grant disadvantage to all three stance types
        expect(confusion!.payload.advantageModifier?.grantDisadvantage).toEqual(['body', 'mind', 'heart']);
    });

    it('debuff_fear has stronger penalty and longer duration', async () => {
        const fear = lookupEffect('debuff_fear');
        expect(fear).toBeDefined();
        
        // Phase 124: increased rollModifier: -3 → -4, duration: 2 → 3,
        // heart stat: -3 → -4, emotionalSkill: -2 → -3, emotionalDefense: -2 → -3
        expect(fear!.duration).toBe(3);
        expect(fear!.payload.rollModifier).toBe(-4);
        
        const statMods = fear!.payload.statModifiers || [];
        const heartMod = statMods.find(m => m.stat === 'heart');
        const skillMod = statMods.find(m => m.stat === 'emotionalSkill');
        const defenseMod = statMods.find(m => m.stat === 'emotionalDefense');
        
        expect(heartMod?.value).toBe(-4);
        expect(skillMod?.value).toBe(-3);
        expect(defenseMod?.value).toBe(-3);
    });

    it('buff_regeneration has stronger healing value', async () => {
        const regen = lookupEffect('buff_regeneration');
        expect(regen).toBeDefined();
        
        // Phase 124: increased healthPerRound: 3 → 4, duration: 5 → 6
        expect(regen!.duration).toBe(6);
        expect(regen!.payload.regeneration?.healthPerRound).toBe(4);
    });
});