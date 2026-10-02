/**
 * Hermetic E2E Tests — the always-land effect-application contract.
 *
 *   - Tier 1: auto-applies.
 *   - Tier 2 buff: applies exactly as printed (no hidden d20).
 *   - Tier 2 debuff: ALWAYS lands — no target-resist, no Nat-20 rebound, no
 *     Nat-1 double duration.
 *   - Tier 3: ALWAYS lands — no Nat-20 escape.
 *
 * RNG convention: drive the RNG to the Nat-1 and Nat-20 values; no path
 * changes its outcome on them.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';

import { ActiveEffect } from '../../Effects/types';
import { Combatant } from '../types';
import { mockSequentialRng } from '../../test-utils/rng';
import { resolveEffectApplication } from '../resist';

afterEach(() => {
    vi.restoreAllMocks();
});

const minimalCombatant = (): Combatant => ({
    id: 'phase80-target',
    name: 'Phase 80 target',
    baseStats: { body: 5, mind: 5, heart: 5 },
    effects: [],
    maxHealth: 30,
    health: 30,
} as unknown as Combatant);

const buildActiveEffect = (
    effectId: string,
    tier: 1 | 2 | 3,
    intensity = 1,
    remainingDuration = 3,
): ActiveEffect => ({
    effectId,
    tier,
    intensity,
    remainingDuration,
    appliedAt: 1,
    resistedBy: 'mind',
    resistDR: 12,
});

describe('Phase 80 — Tier 2 debuff always lands (target-resist removed)', () => {
    it('lands at full intensity + duration even at a legacy-resist roll', () => {
        // Pre-Phase-80: roll=2 + resistStat → likely below DR 12 → effect lands anyway.
        // Pre-Phase-80: roll=20 → Nat-20 rebound. Post-Phase-80: lands.
        // Pre-Phase-80: roll=1 → Nat-1 overwhelmed (double duration). Post-Phase-80: lands at requested duration.
        const target = minimalCombatant();
        const effect = buildActiveEffect('debuff_poison', 2, 2, 4);

        // Drive the d20 to a natural 20.
        mockSequentialRng(0.99); // → d20 = 20

        const result = resolveEffectApplication(target, effect, 'debuff');

        expect(result.success).toBe(true);
        expect(result.activeEffect).toBe(effect);
        // EffectApplicationResult carries no `rebounded` field; assert it stays
        // absent at runtime.
        expect((result as { rebounded?: unknown }).rebounded).toBeUndefined();
        expect(result.message).toMatch(/Effect lands/);
    });

    it('lands at requested duration (no Nat-1 double-duration override)', () => {
        const target = minimalCombatant();
        const effect = buildActiveEffect('debuff_confusion', 2, 1, 2);

        mockSequentialRng(0.0); // legacy d20 = 1 → would have been "overwhelmed" double-duration

        const result = resolveEffectApplication(target, effect, 'debuff');

        expect(result.success).toBe(true);
        expect(result.activeEffect?.remainingDuration).toBe(2);
        expect(result.activeEffect?.intensity).toBe(1);
    });
});

describe('Phase 80 — Tier 3 always lands (Nat-20 escape removed)', () => {
    it('lands even at the legacy-miraculous-escape Nat-20 roll', () => {
        const target = minimalCombatant();
        const effect = buildActiveEffect('fixture_curse', 3, 1, 3);

        mockSequentialRng(0.99); // legacy d20 = 20 → would have been "miraculous escape"

        const result = resolveEffectApplication(target, effect, 'debuff');

        expect(result.success).toBe(true);
        expect(result.activeEffect).toBe(effect);
        expect(result.message).toMatch(/Inescapable/);
    });
});

/**
 * Tier 2 buffs roll no hidden caster-side d20: they apply exactly as printed,
 * whatever the RNG would have rolled.
 */
describe('D12 — Tier 2 buffs apply as printed (no hidden d20)', () => {
    it('lands where the old roll was a Nat 1 (no fizzle)', () => {
        const target = minimalCombatant();
        const effect = buildActiveEffect('fixture_roll_up', 2, 1, 3);

        mockSequentialRng(0.0); // old d20 = 1 → fumble

        const result = resolveEffectApplication(target, effect, 'buff');

        expect(result.success).toBe(true);
        expect(result.activeEffect).toBe(effect);
        expect(result.roll).toBeUndefined();
    });

    it('keeps printed intensity where the old roll was a Nat 20 (no doubling)', () => {
        const target = minimalCombatant();
        const effect = buildActiveEffect('fixture_roll_up', 2, 2, 3);

        mockSequentialRng(0.99); // old d20 = 20 → crit ×2

        const result = resolveEffectApplication(target, effect, 'buff');

        expect(result.success).toBe(true);
        expect(result.activeEffect?.intensity).toBe(2);
        expect(result.roll).toBeUndefined();
    });
});

describe('Phase 80 — Tier 1 unchanged (auto-applies)', () => {
    it('returns success without rolling for Tier 1 debuff', () => {
        const target = minimalCombatant();
        const effect = buildActiveEffect('tier1_mind_mark', 1, 2, 2);

        mockSequentialRng(0.99); // would-have-been Nat-20; irrelevant for Tier 1

        const result = resolveEffectApplication(target, effect, 'debuff');

        expect(result.success).toBe(true);
        expect(result.activeEffect).toBe(effect);
        expect(result.roll).toBeUndefined(); // Tier 1 doesn't surface a roll
    });
});
