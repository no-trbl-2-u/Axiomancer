/**
 * Spec 03 — Tier 2 / Tier 3 effect proc unit tests.
 *
 * The v3 keyword reset (spec 32) retired most of the authored proc table —
 * the surviving library entries are the handful whose effect ids still
 * resolve (debuff_bleed, buff_invincibility, buff_haste). The proc ENGINE
 * (eligibility, chance scaling, crit / normal / fumble paths, overrides) is
 * still fully live, so this suite drives it with inline `procOverrides`
 * fixtures built from surviving effect ids wherever a specific tier layout is
 * needed, and against the real library table where the surviving entries
 * suffice.
 *
 * Covers:
 *   • Every surviving library entry references a valid effect.
 *   • Eligibility respects the per-cell tier cap.
 *   • Final proc chance scales with stance stat and `buff_status_chance_up`.
 *   • Crit guarantees procs and bumps intensity / duration.
 *   • Fumble produces a self-debuff and skips other procs.
 *   • Enemy `procOverrides` swap the cell's table wholesale.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import {
    rollForCombatEffects,
    getEligibleTriggers,
    calculateProcChance,
    combatEffectsLibrary,
    CombatEffectTrigger,
} from './combat-effects';
import { lookupEffect } from '../Effects/effects.library';
import { Player } from '../Character/characters.mock';
import { FloatEye } from '../Enemy/enemy.library';

afterEach(() => {
    vi.restoreAllMocks();
});

/**
 * A three-tier inline proc table for a single cell, built from surviving
 * effect ids. Used to exercise the tier-cap / crit / normal machinery without
 * depending on the retired library entries.
 */
const bodyAttackOverride: CombatEffectTrigger[] = [
    { stance: 'body', action: 'attack', tier: 1, effectId: 'debuff_mark', target: 'opponent', baseChance: 0.10, fumbleEffectId: 'debuff_curse' },
    { stance: 'body', action: 'attack', tier: 2, effectId: 'debuff_bleed', target: 'opponent', baseChance: 0.18 },
    { stance: 'body', action: 'attack', tier: 3, effectId: 'debuff_backfire_acute', target: 'opponent', baseChance: 0.06 },
];

describe('proc table coverage', () => {
    it('has at least one surviving trigger', () => {
        expect(combatEffectsLibrary.length).toBeGreaterThan(0);
    });

    it('every entry references a valid effect in the library', () => {
        for (const t of combatEffectsLibrary) {
            expect(lookupEffect(t.effectId), `effect id missing: ${t.effectId}`).toBeDefined();
            if (t.fumbleEffectId) {
                expect(lookupEffect(t.fumbleEffectId), `fumble id missing: ${t.fumbleEffectId}`).toBeDefined();
            }
        }
    });
});

describe('getEligibleTriggers', () => {
    it('defaults to tier 1 only for an actor with no unlocks', () => {
        const eligible = getEligibleTriggers('body', 'attack', undefined, { body: { attack: bodyAttackOverride } });
        expect(eligible.every(t => t.tier <= 1)).toBe(true);
        expect(eligible.length).toBe(1);
    });

    it('returns T1 + T2 entries when the cell is unlocked to T2', () => {
        const eligible = getEligibleTriggers('body', 'attack', { body: { attack: 2 } }, { body: { attack: bodyAttackOverride } });
        expect(eligible.map(t => t.tier).sort()).toEqual([1, 2]);
    });

    it('returns T1 + T2 + T3 entries when the cell is unlocked to T3', () => {
        const eligible = getEligibleTriggers('body', 'attack', { body: { attack: 3 } }, { body: { attack: bodyAttackOverride } });
        expect(eligible.map(t => t.tier).sort()).toEqual([1, 2, 3]);
    });

    it('filters the real library table by the per-cell unlock cap', () => {
        // body/attack in the live library holds a single tier-2 entry
        // (debuff_bleed); it is gated out at the default tier-1 cap.
        expect(getEligibleTriggers('body', 'attack')).toEqual([]);
        const unlocked = getEligibleTriggers('body', 'attack', { body: { attack: 2 } });
        expect(unlocked.map(t => t.effectId)).toEqual(['debuff_bleed']);
    });

    it('returns only the override entries for that cell when procOverrides is set', () => {
        const override: CombatEffectTrigger[] = [
            { stance: 'body', action: 'attack', tier: 1, effectId: 'debuff_mark', target: 'opponent', baseChance: 1 },
        ];
        const eligible = getEligibleTriggers('body', 'attack', undefined, { body: { attack: override } });
        expect(eligible).toEqual(override);
    });
});

describe('calculateProcChance', () => {
    it('scales with the actor\'s stance base stat', () => {
        const trigger: CombatEffectTrigger = { stance: 'heart', action: 'attack', tier: 1, effectId: 'debuff_curse', target: 'opponent', baseChance: 0.10 };
        // Player starts with heart 4 → 4 × 0.02 = +0.08 above baseChance 0.10 = 0.18
        expect(calculateProcChance(trigger, Player)).toBeCloseTo(0.18, 5);
    });

    it('clamps the chance to the [0, 1] range', () => {
        const trigger: CombatEffectTrigger = { ...bodyAttackOverride[0], baseChance: 5 };
        expect(calculateProcChance(trigger, Player)).toBe(1);
    });
});

describe('rollForCombatEffects', () => {
    it('returns no procs when every chance fails', () => {
        const { procs, fumble } = rollForCombatEffects({
            actor: Player,
            stance: 'body',
            action: 'attack',
            rawAttackRoll: 10,
            unlocks: { body: { attack: 3 } },
            overrides: { body: { attack: bodyAttackOverride } },
            rng: () => 0.99,
        });
        expect(procs).toEqual([]);
        expect(fumble).toBeNull();
    });

    it('fires every eligible proc on a crit (nat 20)', () => {
        const { procs, fumble } = rollForCombatEffects({
            actor: Player,
            stance: 'body',
            action: 'attack',
            rawAttackRoll: 20,
            unlocks: { body: { attack: 3 } },
            overrides: { body: { attack: bodyAttackOverride } },
            rng: () => 0.99,
        });
        expect(fumble).toBeNull();
        expect(procs.length).toBe(3); // T1 + T2 + T3
        for (const p of procs) {
            expect(p.decision).toBe('crit');
            expect(p.intensityBonus).toBeGreaterThan(0);
            expect(p.durationBonus).toBeGreaterThan(0);
        }
    });

    it('returns a fumble self-debuff on nat 1 and skips other procs', () => {
        const { procs, fumble } = rollForCombatEffects({
            actor: Player,
            stance: 'body',
            action: 'attack',
            rawAttackRoll: 1,
            overrides: { body: { attack: bodyAttackOverride } },
            rng: () => 0.0,
        });
        expect(procs).toEqual([]);
        expect(fumble).not.toBeNull();
        expect(fumble!.effectId).toBe('debuff_curse');
    });

    it('fires the tier-1 proc on a normal hit when the rng passes', () => {
        const { procs, fumble } = rollForCombatEffects({
            actor: Player,
            stance: 'body',
            action: 'attack',
            rawAttackRoll: 10,
            overrides: { body: { attack: bodyAttackOverride } },
            rng: () => 0.0,
        });
        expect(fumble).toBeNull();
        expect(procs.length).toBe(1);
        expect(procs[0].trigger.tier).toBe(1);
        expect(procs[0].decision).toBe('normal');
    });

    it('fires the tier-2 proc from the real library table when unlocked', () => {
        const { procs } = rollForCombatEffects({
            actor: Player,
            stance: 'body',
            action: 'attack',
            rawAttackRoll: 10,
            unlocks: { body: { attack: 2 } },
            rng: () => 0.0,
        });
        expect(procs.length).toBe(1);
        expect(procs[0].trigger.effectId).toBe('debuff_bleed');
        expect(procs[0].trigger.tier).toBe(2);
    });

    it('skips higher-tier entries when the unlock cap is at tier 1', () => {
        const { procs } = rollForCombatEffects({
            actor: Player,
            stance: 'body',
            action: 'attack',
            rawAttackRoll: 10,
            overrides: { body: { attack: bodyAttackOverride } },
            rng: () => 0.0,
        });
        for (const p of procs) {
            expect(p.trigger.tier).toBe(1);
        }
    });

    it('procOverrides replace the global cell entirely', () => {
        const override: CombatEffectTrigger[] = [
            { stance: 'body', action: 'attack', tier: 1, effectId: 'debuff_curse', target: 'opponent', baseChance: 1 },
        ];
        const { procs } = rollForCombatEffects({
            actor: FloatEye,
            stance: 'body',
            action: 'attack',
            rawAttackRoll: 10,
            overrides: { body: { attack: override } },
            rng: () => 0.0,
        });
        expect(procs.length).toBe(1);
        expect(procs[0].trigger.effectId).toBe('debuff_curse');
    });
});
