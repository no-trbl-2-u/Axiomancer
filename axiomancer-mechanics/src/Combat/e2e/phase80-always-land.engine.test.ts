/**
 * Hermetic E2E Tests — Phase 80 always-land contract (direction (a) pure split).
 *
 * Pins the new effect-application contract:
 *   - Tier 1: auto-applies (unchanged across Phase 80).
 *   - Tier 2 buff: caster d20 fumble/crit (KEPT per Phase 79 D8).
 *   - Tier 2 debuff: ALWAYS lands. Target-resist + Nat-20 rebound + Nat-1
 *     overwhelmed-double-duration all removed at Phase 80.
 *   - Tier 3: ALWAYS lands. Nat-20 miraculous escape removed at Phase 80.
 *
 * RNG convention: drive `mockFixedRng` to the legacy-Nat-1 and legacy-Nat-20
 * values; under Phase 80 those outcomes are no longer reachable on the
 * debuff / Tier 3 path. The buff path still exhibits fumble/crit per D2.
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

        // Drive the d20 to a value that would have triggered legacy crit-rebound.
        mockSequentialRng(0.99); // → d20 = 20

        const result = resolveEffectApplication(target, effect, 'debuff');

        expect(result.success).toBe(true);
        expect(result.activeEffect).toBe(effect);
        // `rebounded` was removed from EffectApplicationResult at the Phase 84/86
        // drain; assert the legacy field stays absent at runtime.
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
        const effect = buildActiveEffect('debuff_curse', 3, 1, 3);

        mockSequentialRng(0.99); // legacy d20 = 20 → would have been "miraculous escape"

        const result = resolveEffectApplication(target, effect, 'debuff');

        expect(result.success).toBe(true);
        expect(result.activeEffect).toBe(effect);
        expect(result.message).toMatch(/Inescapable/);
    });
});

describe('Phase 80 — Tier 2 buff caster fumble/crit KEPT (Phase 79 D8)', () => {
    it('fumbles on Nat 1 (buff fails)', () => {
        const target = minimalCombatant();
        const effect = buildActiveEffect('buff_haste', 2, 1, 3);

        mockSequentialRng(0.0); // d20 = 1

        const result = resolveEffectApplication(target, effect, 'buff');

        expect(result.success).toBe(false);
        expect(result.roll?.wasFumble).toBe(true);
        expect(result.message).toMatch(/Fumble/);
    });

    it('crits on Nat 20 (double intensity)', () => {
        const target = minimalCombatant();
        const effect = buildActiveEffect('buff_haste', 2, 2, 3);

        mockSequentialRng(0.99); // d20 = 20

        const result = resolveEffectApplication(target, effect, 'buff');

        expect(result.success).toBe(true);
        expect(result.activeEffect?.intensity).toBe(4); // 2 × 2
        expect(result.roll?.wasCrit).toBe(true);
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
