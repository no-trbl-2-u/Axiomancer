/**
 * Hermetic e2e for the Phase 44 fallacies-as-spells payloads.
 *
 * Asserts:
 *   - Each of the 4 new Tier 3 fallacy skills is resolvable via
 *     `getCardById` and carries a `sourcedFromCell` that round-trips
 *     through `philosophicalAlignmentLibrary`.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCardById } from '../cards.library';
import { philosophicalAlignmentLibrary } from '../../Philosophy';
import { lookupEffect, applyEffect } from '../../Effects';

afterEach(() => vi.restoreAllMocks());

const NEW_FALLACY_SKILL_IDS = [
    'appeal-to-consequences',
    'nirvana-fallacy',
    'pascals-wager',
    'appeal-to-fear',
] as const;

describe('Phase 44 — fallacies-as-spells (skills)', () => {
    it('all 4 new skills resolve via getCardById as Tier 3 with the level floor', () => {
        for (const id of NEW_FALLACY_SKILL_IDS) {
            const skill = getCardById(id);
            expect(skill, `skill ${id} missing from library`).toBeDefined();
            expect(skill!.tier).toBe(3);
            // Phase 44 set { level: 10 }; Phase 46 added requiresAlignment to
            // nirvana-fallacy + appeal-to-fear. Assert the level floor stays.
            expect(skill!.learningRequirement?.level).toBe(10);
        }
    });

});

const NEW_FALLACY_EFFECT_IDS = [
    'debuff_no_true_scotsman',
    'buff_special_pleading',
    'debuff_category_error',
] as const;

describe('Phase 44 — fallacies-as-spells (effects)', () => {
    it('all 3 new effects resolve via lookupEffect with the expected sourcedFromCell', () => {
        const expected: Record<string, string> = {
            'debuff_no_true_scotsman': 'logic-pessimistic-transcendent',
            'buff_special_pleading':   'faith-optimistic-individual',
            'debuff_category_error':   'mid-pessimistic-transcendent',
        };
        for (const id of NEW_FALLACY_EFFECT_IDS) {
            const effect = lookupEffect(id);
            expect(effect, `effect ${id} missing from library`).toBeDefined();
            expect(effect!.sourcedFromCell).toBe(expected[id]);
        }
    });

    it('every sourcedFromCell id round-trips through philosophicalAlignmentLibrary', () => {
        for (const id of NEW_FALLACY_EFFECT_IDS) {
            const effect = lookupEffect(id)!;
            const cell = philosophicalAlignmentLibrary.find(c => c.id === effect.sourcedFromCell);
            expect(cell, `cell ${effect.sourcedFromCell} missing for effect ${id}`).toBeDefined();
        }
    });

    it('applyEffect on debuff_no_true_scotsman produces a tier-2 ActiveEffect with the right resist data', () => {
        const effect = lookupEffect('debuff_no_true_scotsman')!;
        const result = applyEffect([], effect, 1);
        const active = result.activeEffects.find(a => a.effectId === 'debuff_no_true_scotsman');
        expect(active, 'active effect missing after applyEffect').toBeDefined();
        expect(active!.tier).toBe(2);
        expect(active!.resistedBy).toBe('mind');
        expect(active!.resistDR).toBe(12);
    });
});

// ─── Phase 88 — Fallacy-thread effect pins ────────────────────────────────────
// These 8 effects are referenced by the combat-effects.library.json (proc-on-hit
// and fumble effects) but had zero direct test coverage. Each is tested via
// applyEffect + payload assertion.

describe('Phase 88 — Fallacy-thread effect pins', () => {
    describe('buff_petitio_pulse', () => {
        it('applies cleanly and grants heart +1', () => {
            const effect = lookupEffect('buff_petitio_pulse');
            expect(effect).toBeDefined();
            const { result, activeEffects } = applyEffect([], effect!, 1);
            expect(result.success).toBe(true);
            expect(activeEffects[0].tier).toBe(1);
            expect(effect!.payload.statModifiers).toEqual([
                { stat: 'heart', value: 1, isMultiplier: false },
            ]);
        });
    });

    describe('buff_gettiters_flicker', () => {
        it('applies cleanly and grants luck +1', () => {
            const effect = lookupEffect('buff_gettiters_flicker');
            expect(effect).toBeDefined();
            const { result } = applyEffect([], effect!, 1);
            expect(result.success).toBe(true);
            expect(effect!.payload.statModifiers).toEqual([
                { stat: 'luck', value: 1, isMultiplier: false },
            ]);
        });
    });

    describe('buff_ad_hoc_patch', () => {
        it('applies cleanly and grants physicalSkill +1', () => {
            const effect = lookupEffect('buff_ad_hoc_patch');
            expect(effect).toBeDefined();
            const { result } = applyEffect([], effect!, 1);
            expect(result.success).toBe(true);
            expect(effect!.payload.statModifiers).toEqual([
                { stat: 'physicalSkill', value: 1, isMultiplier: false },
            ]);
        });
    });

    describe('debuff_moral_learning', () => {
        it('applies cleanly and debuffs heart/mind + skills', () => {
            const effect = lookupEffect('debuff_moral_learning');
            expect(effect).toBeDefined();
            const { result } = applyEffect([], effect!, 1);
            expect(result.success).toBe(true);
            expect(effect!.type).toBe('debuff');
            expect(effect!.category).toBe('control');
            expect(effect!.payload.statModifiers!.find(m => m.stat === 'heart')!.value).toBe(-2);
            expect(effect!.payload.statModifiers!.find(m => m.stat === 'mind')!.value).toBe(-1);
        });
    });

    describe('debuff_transformative', () => {
        it('applies cleanly and debuffs mind/heart + rollModifier -2', () => {
            const effect = lookupEffect('debuff_transformative');
            expect(effect).toBeDefined();
            const { result } = applyEffect([], effect!, 1);
            expect(result.success).toBe(true);
            expect(effect!.payload.rollModifier).toBe(-2);
            expect(effect!.payload.statModifiers!.find(m => m.stat === 'mind')!.value).toBe(-2);
            expect(effect!.payload.statModifiers!.find(m => m.stat === 'heart')!.value).toBe(-1);
        });
    });

    describe('debuff_rational_disagreement', () => {
        it('applies cleanly and debuffs mind -3 + mentalSkill -2 + mentalDefense -1', () => {
            const effect = lookupEffect('debuff_rational_disagreement');
            expect(effect).toBeDefined();
            const { result } = applyEffect([], effect!, 1);
            expect(result.success).toBe(true);
            expect(effect!.payload.rollModifier).toBe(-2);
            expect(effect!.payload.statModifiers!.find(m => m.stat === 'mind')!.value).toBe(-3);
            expect(effect!.payload.statModifiers!.find(m => m.stat === 'mentalSkill')!.value).toBe(-2);
            expect(effect!.payload.statModifiers!.find(m => m.stat === 'mentalDefense')!.value).toBe(-1);
        });
    });

    describe('debuff_affirming_consequent', () => {
        it('applies cleanly and debuffs physicalSkill -1', () => {
            const effect = lookupEffect('debuff_affirming_consequent');
            expect(effect).toBeDefined();
            const { result } = applyEffect([], effect!, 1);
            expect(result.success).toBe(true);
            expect(effect!.tier).toBe(1);
            expect(effect!.payload.statModifiers).toEqual([
                { stat: 'physicalSkill', value: -1, isMultiplier: false },
            ]);
        });
    });

    describe('debuff_causal_emergence', () => {
        it('applies cleanly and grants disadvantage on mind + stat debuffs', () => {
            const effect = lookupEffect('debuff_causal_emergence');
            expect(effect).toBeDefined();
            const { result } = applyEffect([], effect!, 1);
            expect(result.success).toBe(true);
            expect(effect!.payload.advantageModifier!.grantDisadvantage).toEqual(['mind']);
            expect(effect!.payload.rollModifier).toBe(-2);
            expect(effect!.payload.statModifiers!.find(m => m.stat === 'mind')!.value).toBe(-2);
            expect(effect!.payload.statModifiers!.find(m => m.stat === 'mentalSkill')!.value).toBe(-2);
            expect(effect!.payload.statModifiers!.find(m => m.stat === 'physicalSkill')!.value).toBe(-1);
        });
    });
});
