import { afterEach, describe, it, expect, vi } from 'vitest';
import { applyEffect, clearTier1EffectsForStance, removeEffect, removeEffectsByType } from '../index';

afterEach(() => {
    vi.restoreAllMocks();
});
import { ActiveEffect, Effect } from '../types';
import { lookupEffect } from '../effects.library';

const makeEffect = (overrides: Partial<Effect> = {}): Effect => ({
    id: 'test_effect',
    name: 'Test',
    description: '',
    type: 'buff',
    category: 'stat',
    duration: 3,
    stacking: 'intensity',
    tier: 1,
    payload: {},
    ...overrides,
});

describe('applyEffect', () => {
    it('applies fresh effect', () => {
        const { activeEffects, result } = applyEffect([], makeEffect(), 1);
        expect(result.success).toBe(true);
        expect(activeEffects).toHaveLength(1);
        expect(activeEffects[0].effectId).toBe('test_effect');
        expect(activeEffects[0].remainingDuration).toBe(3);
        expect(activeEffects[0].intensity).toBe(1);
    });

    it('stacks intensity', () => {
        const effect = makeEffect();
        const { activeEffects: first } = applyEffect([], effect, 1);
        const { activeEffects: second, result } = applyEffect(first, effect, 2);
        expect(second).toHaveLength(1);
        expect(second[0].intensity).toBe(2);
        expect(result.stackedWith?.previousIntensity).toBe(1);
    });

    it('extends duration with stacking=duration', () => {
        const effect = makeEffect({ stacking: 'duration' });
        const { activeEffects: first } = applyEffect([], effect, 1);
        const { activeEffects: second } = applyEffect(first, effect, 2);
        expect(second[0].remainingDuration).toBe(6);
    });

    it('blocks duplicate with stacking=none', () => {
        const effect = makeEffect({ stacking: 'none' });
        const { activeEffects: first } = applyEffect([], effect, 1);
        const { activeEffects: second, result } = applyEffect(first, effect, 2);
        expect(result.success).toBe(false);
        expect(second).toHaveLength(1);
    });

    it('additive duration mode', () => {
        const effect = makeEffect();
        const { activeEffects: first } = applyEffect([], effect, 1, { intensityDelta: 1, durationMode: 'additive', durationDelta: 2 });
        expect(first[0].remainingDuration).toBe(2);
        const { activeEffects: second } = applyEffect(first, effect, 2, { intensityDelta: 1, durationMode: 'additive', durationDelta: 2 });
        expect(second[0].remainingDuration).toBe(4);
        expect(second[0].intensity).toBe(2);
    });

    // Phase 38 — sourceId attribution.
    describe('sourceId (Phase 38)', () => {
        it('stamps sourceId on a fresh application', () => {
            const { activeEffects } = applyEffect([], makeEffect(), 1, { sourceId: 'char-player' });
            expect(activeEffects[0].sourceId).toBe('char-player');
        });

        it('leaves sourceId undefined when the option is omitted', () => {
            const { activeEffects } = applyEffect([], makeEffect(), 1);
            expect(activeEffects[0].sourceId).toBeUndefined();
        });

        it('overrides the existing sourceId on intensity-stack (last writer wins)', () => {
            const effect = makeEffect();
            const { activeEffects: first } = applyEffect([], effect, 1, { sourceId: 'enemy-a' });
            const { activeEffects: second } = applyEffect(first, effect, 2, { sourceId: 'enemy-b' });
            expect(second[0].sourceId).toBe('enemy-b');
        });

        it('preserves the existing sourceId when no new one is supplied on stack', () => {
            const effect = makeEffect();
            const { activeEffects: first } = applyEffect([], effect, 1, { sourceId: 'enemy-a' });
            const { activeEffects: second } = applyEffect(first, effect, 2);
            expect(second[0].sourceId).toBe('enemy-a');
        });

        it('overrides the existing sourceId on duration-stack', () => {
            const effect = makeEffect({ stacking: 'duration' });
            const { activeEffects: first } = applyEffect([], effect, 1, { sourceId: 'enemy-a' });
            const { activeEffects: second } = applyEffect(first, effect, 2, { sourceId: 'enemy-b' });
            expect(second[0].sourceId).toBe('enemy-b');
        });
    });
});

describe('clearTier1EffectsForStance', () => {
    it('clears buffs from other stances', () => {
        const effects: ActiveEffect[] = [
            { effectId: 'tier1_body_attack', remainingDuration: 2, intensity: 1, appliedAt: 1, tier: 1 },
            { effectId: 'tier1_heart_defend', remainingDuration: 3, intensity: 1, appliedAt: 1, tier: 1 },
        ];
        const { activeEffects, cleared } = clearTier1EffectsForStance(effects, 'body');
        expect(activeEffects).toHaveLength(1);
        expect(activeEffects[0].effectId).toBe('tier1_body_attack');
        expect(cleared).toHaveLength(1);
    });

    it('keeps debuffs (opponent-applied)', () => {
        const effects: ActiveEffect[] = [
            { effectId: 'tier1_mind_mark', remainingDuration: 3, intensity: 2, appliedAt: 1, tier: 1 },
        ];
        const { activeEffects, cleared } = clearTier1EffectsForStance(effects, 'body');
        expect(activeEffects).toHaveLength(1);
        expect(cleared).toHaveLength(0);
    });
});

describe('removeEffect', () => {
    it('removes the first effect matching the id', () => {
        const effects: ActiveEffect[] = [
            { effectId: 'buff_a', remainingDuration: 2, intensity: 1, appliedAt: 1, tier: 1 },
            { effectId: 'buff_b', remainingDuration: 2, intensity: 1, appliedAt: 1, tier: 1 },
        ];
        const { activeEffects, removed } = removeEffect(effects, 'buff_a');
        expect(removed?.effectId).toBe('buff_a');
        expect(activeEffects).toHaveLength(1);
        expect(activeEffects[0].effectId).toBe('buff_b');
    });

    it('returns null removed and original list when id missing', () => {
        const effects: ActiveEffect[] = [
            { effectId: 'buff_a', remainingDuration: 2, intensity: 1, appliedAt: 1, tier: 1 },
        ];
        const { activeEffects, removed } = removeEffect(effects, 'nope');
        expect(removed).toBeNull();
        expect(activeEffects).toHaveLength(1);
    });
});

describe('removeEffectsByType', () => {
    const effects: ActiveEffect[] = [
        // a Tier 2 buff
        { effectId: 'buff_regeneration',  remainingDuration: 4, intensity: 1, appliedAt: 1, tier: 2 },
        // a Tier 2 debuff
        { effectId: 'debuff_poison',      remainingDuration: 3, intensity: 1, appliedAt: 1, tier: 2 },
        // a Tier 1 self-buff (Ad Baculum)
        { effectId: 'tier1_body_attack',  remainingDuration: 2, intensity: 1, appliedAt: 1, tier: 1 },
        // a Tier 3 buff (haste)
        { effectId: 'buff_haste',         remainingDuration: 2, intensity: 1, appliedAt: 1, tier: 3 },
    ];

    it('strips all buffs when no tier cap', () => {
        const { activeEffects, removed } = removeEffectsByType(effects, 'buff');
        expect(removed.map(r => r.effectId).sort()).toEqual(['buff_haste', 'buff_regeneration', 'tier1_body_attack']);
        expect(activeEffects).toHaveLength(1);
        expect(activeEffects[0].effectId).toBe('debuff_poison');
    });

    it('respects maxTier — Tier 2 dispel does not touch Tier 3', () => {
        const { activeEffects, removed } = removeEffectsByType(effects, 'buff', 2);
        expect(removed.map(r => r.effectId).sort()).toEqual(['buff_regeneration', 'tier1_body_attack']);
        expect(activeEffects.find(e => e.effectId === 'buff_haste')).toBeDefined();
    });

    it('strips debuffs without touching buffs', () => {
        const { activeEffects, removed } = removeEffectsByType(effects, 'debuff', 2);
        expect(removed).toHaveLength(1);
        expect(removed[0].effectId).toBe('debuff_poison');
        expect(activeEffects).toHaveLength(3);
    });
});

describe('effectsLibrary', () => {
    it('lookupEffect finds buffs', () => {
        const effect = lookupEffect('tier1_body_attack');
        expect(effect).toBeDefined();
        expect(effect?.name).toBe('Ad Baculum');
    });

    it('lookupEffect finds debuffs', () => {
        const effect = lookupEffect('tier1_mind_mark');
        expect(effect).toBeDefined();
        expect(effect?.name).toBe('Exposed Reasoning');
    });

    it('returns undefined for unknown ID', () => {
        expect(lookupEffect('nonexistent')).toBeUndefined();
    });
});
