import { afterEach, describe, it, expect, vi } from 'vitest';

import { Combatant } from '../types';
import { ActiveEffect } from '../../Effects/types';
import { mockSequentialRng } from '../../test-utils/rng';
import { resolveEffectApplication } from '../resist';

afterEach(() => vi.restoreAllMocks());

const minimalCombatant = (): Combatant => ({
    id: 'p83-target',
    name: 'Phase 83 target',
    baseStats: { body: 5, mind: 5, heart: 5 },
    derivedStats: {
        maxHealth: 30, health: 30,
        physicalAttack: 5, physicalSkill: 5, physicalDefense: 5, physicalSave: 5, physicalTest: 5,
        mentalAttack: 5, mentalSkill: 5, mentalDefense: 5, mentalSave: 5, mentalTest: 5,
        emotionalAttack: 5, emotionalSkill: 5, emotionalDefense: 5, emotionalSave: 5, emotionalTest: 5,
        luck: 0,
    },
    nonCombatStats: { wisdom: 0, charisma: 0, perception: 0, willpower: 0 },
    effects: [],
    maxHealth: 30,
    health: 30,
} as unknown as Combatant);

const buildEffect = (
    effectId: string,
    resistedBy: 'body' | 'mind' | 'heart',
): ActiveEffect => ({
    effectId,
    tier: 2,
    intensity: 1,
    remainingDuration: 3,
    appliedAt: 1,
    resistedBy,
    resistDR: 13,
});

const categories: Array<{
    label: string;
    effectId: string;
    resistedBy: 'body' | 'mind' | 'heart';
}> = [
    { label: 'stat (debuff_body_attack_down)',    effectId: 'debuff_body_attack_down', resistedBy: 'mind' },
    { label: 'defense (debuff_defense_down)',     effectId: 'debuff_defense_down',     resistedBy: 'heart' },
    { label: 'advantage (debuff_evasion_down)',   effectId: 'debuff_evasion_down',     resistedBy: 'heart' },
    { label: 'control (debuff_sleep)',            effectId: 'debuff_sleep',            resistedBy: 'heart' },
    { label: 'damage (debuff_burn)',              effectId: 'debuff_burn',             resistedBy: 'body' },
];

describe.each(categories)(
    'Phase 83 — Tier 2 debuff always-land: $label',
    ({ effectId, resistedBy }) => {
        it.each([
            { name: 'Nat 1 (legacy overwhelmed)', rngValue: 0.0 },
            { name: 'Nat 20 (legacy rebound)',    rngValue: 0.99 },
            { name: 'mid-roll (d20 = 10)',        rngValue: 0.45 },
        ])('lands under $name', ({ rngValue }) => {
            mockSequentialRng(rngValue);
            const target = minimalCombatant();
            const effect = buildEffect(effectId, resistedBy);

            const result = resolveEffectApplication(target, effect, 'debuff');

            expect(result.success).toBe(true);
            expect(result.activeEffect).toBe(effect);
            expect(result.message).toBe('Effect lands.');
            // `rebounded` was removed from EffectApplicationResult at the Phase 84/86
            // drain; assert the legacy field stays absent at runtime.
            expect((result as { rebounded?: unknown }).rebounded).toBeUndefined();
            expect(result.roll).toBeUndefined();
        });
    },
);
