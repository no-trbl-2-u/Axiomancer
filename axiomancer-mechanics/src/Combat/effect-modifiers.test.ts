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
    processDamageOverTime, processRoundStartEffects, processRoundEndEffects,
    applyCleanse,
} from './effects';

/**
 * The skip-turn restriction is a test-only `Effect` fixture registered
 * into the shared registry (the same lookup `getActiveEffectModifiers` /
 * `canAct` resolve through). These ids never touch the library JSON. The
 * round-clock DoT runs through the live Creeping Doom (1 per stack, round
 * start).
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
    it('aggregates ROUND-CLOCK DoT damage — event clocks stay off the boundary', () => {
        // WS3.3: poison/bleed ride event clocks — the round aggregator must
        // carry ZERO for them. Creeping Doom names no trigger: round start.
        const mods = getActiveEffectModifiers([
            ae('debuff_creeping_doom', 2),  // 1 × 2 = 2 at start
            ae('debuff_poison', 1),         // card-played clock → 0 here
            ae('debuff_bleed',  1),         // damage-instance clock → 0 here
        ]);
        expect(mods.dotStart).toBe(2);
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
        // floor(2 × 2 × 1.5) = 6 (poison, Hemorrhage) + 3 × 1 = 3 (bleed).
        expect(getActiveDotTotal(effects).total).toBe(9);
    });

    it('collects the skip-turn restriction', () => {
        expect(getActiveEffectModifiers([ae('test_stun')]).skipTurn).toBe(true);
        expect(getActiveEffectModifiers([]).skipTurn).toBe(false);
    });
});

describe('canAct', () => {
    it('a skip-turn restriction loses the action', () => {
        const result = canAct([ae('test_stun')]);
        expect(result.canAct).toBe(false);
        expect(result.reason).toBe('skipTurn');
    });

    it('acts when no restriction applies', () => {
        expect(canAct([])).toEqual({ canAct: true, reason: null });
    });
});

describe('round-clock DoT HP changes', () => {
    it('processDamageOverTime ticks the round-clock DoT (event clocks excluded)', () => {
        // Creeping Doom (dpr 1) rides the round clock; the event-clocked
        // poison/bleed never tick at the boundary (WS3.3).
        const t = fixture([
            ae('debuff_creeping_doom', 2),
            ae('debuff_poison'), ae('debuff_bleed'),
        ]);
        const before = t.health;
        const r = processDamageOverTime(t);
        expect(r.damage).toBe(2); // doom: 1 × 2 = 2
        expect(r.target.health).toBe(before - 2);
    });
});

describe('processRoundStartEffects orchestrator', () => {
    it('applies the round-clock DoT', () => {
        const t = { ...fixture([ae('debuff_creeping_doom', 3)]), health: 30 };
        const r = processRoundStartEffects(t);
        expect(r.dotDamage).toBe(3);
        expect(r.target.health).toBe(27);
    });
});

describe('processRoundEndEffects orchestrator', () => {
    it('ticks duration only; event-clocked BLEED stays off the boundary (WS3.3)', () => {
        // BLEED rides the damage-instance clock: it neither ticks nor decays
        // at round end (its per-tick decay is exercised via `fireDotTrigger`);
        // its CALENDAR still counts down.
        const t = { ...fixture([ae('debuff_bleed', 2, 2)]), health: 20 };
        const r = processRoundEndEffects(t);
        expect(r.target.health).toBe(20);
        const bleed = r.target.effects.find(e => e.effectId === 'debuff_bleed')!;
        expect(bleed.intensity).toBe(2); // no round-end tick → no decay
        expect(bleed.remainingDuration).toBe(1);
    });
});

describe('applyCleanse (Q10)', () => {
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
});

