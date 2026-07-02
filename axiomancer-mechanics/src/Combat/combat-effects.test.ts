/**
 * Spec 03 — Tier 2 / Tier 3 effect proc unit tests.
 *
 * Covers:
 *   • Every Stance × action cell has at least one eligible T1 trigger.
 *   • Final proc chance scales with stance stat and `buff_status_chance_up`.
 *   • Crit guarantees procs and bumps intensity / duration.
 *   • Fumble produces a self-debuff and skips other procs.
 *   • `procUnlocks` gates higher-tier entries.
 *   • Enemy `procOverrides` swap the cell's table wholesale.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Stance } from './types';
import {
    rollForCombatEffects,
    getEligibleTriggers,
    calculateProcChance,
    combatEffectsLibrary,
    CombatEffectTrigger,
} from './combat-effects';
import { lookupEffect } from '../Effects/effects.library';
import { Player } from '../Character/characters.mock';
import { Disatree_01 } from '../Enemy/enemy.library';

const STANCES: Stance[] = ['body', 'mind', 'heart'];
const ACTIONS: Array<'attack' | 'defend'> = ['attack', 'defend'];

afterEach(() => {
    vi.restoreAllMocks();
});

describe('proc table coverage', () => {
    for (const stance of STANCES) {
        for (const action of ACTIONS) {
            it(`${stance}/${action} has at least one tier-1 entry`, () => {
                const entries = combatEffectsLibrary.filter(
                    t => t.stance === stance && t.action === action && t.tier === 1,
                );
                expect(entries.length).toBeGreaterThan(0);
            });
        }
    }

    it('every entry references a valid effect in the library', () => {
        for (const t of combatEffectsLibrary) {
            expect(lookupEffect(t.effectId), `effect id missing: ${t.effectId}`).toBeDefined();
        }
    });
});

describe('getEligibleTriggers', () => {
    it('defaults to tier 1 only for an actor with no unlocks', () => {
        const eligible = getEligibleTriggers('body', 'attack');
        expect(eligible.every(t => t.tier <= 1)).toBe(true);
        expect(eligible.length).toBeGreaterThan(0);
    });

    it('returns T1 + T2 entries when the cell is unlocked to T2', () => {
        const eligible = getEligibleTriggers('body', 'attack', { body: { attack: 2 } });
        expect(eligible.map(t => t.tier).sort()).toEqual([1, 2]);
    });

    it('returns T1 + T2 + T3 entries when the cell is unlocked to T3', () => {
        const eligible = getEligibleTriggers('body', 'attack', { body: { attack: 3 } });
        expect(eligible.map(t => t.tier).sort()).toEqual([1, 2, 3]);
    });

    it('returns only the override entries for that cell when procOverrides is set', () => {
        const override: CombatEffectTrigger[] = [
            { stance: 'body', action: 'attack', tier: 1, effectId: 'debuff_post_hoc_tremor', target: 'opponent', baseChance: 1 },
        ];
        const eligible = getEligibleTriggers('body', 'attack', undefined, { body: { attack: override } });
        expect(eligible).toEqual(override);
    });
});

describe('calculateProcChance', () => {
    it('scales with the actor\'s stance base stat', () => {
        const trigger = combatEffectsLibrary.find(t => t.stance === 'heart' && t.action === 'attack' && t.tier === 1)!;
        // Player starts with heart 4 → 4 × 0.02 = +0.08 above baseChance 0.10 = 0.18
        expect(calculateProcChance(trigger, Player)).toBeCloseTo(0.18, 5);
    });

    it('clamps the chance to the [0, 1] range', () => {
        const trigger: CombatEffectTrigger = { ...combatEffectsLibrary[0], baseChance: 5 };
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
            stance: 'heart',
            action: 'attack',
            rawAttackRoll: 1,
            rng: () => 0.0,
        });
        expect(procs).toEqual([]);
        expect(fumble).not.toBeNull();
        expect(fumble!.effectId).toBe('debuff_straw_man_echo');
    });

    it('fires the tier-1 proc on a normal hit when the rng passes', () => {
        const { procs, fumble } = rollForCombatEffects({
            actor: Player,
            stance: 'body',
            action: 'attack',
            rawAttackRoll: 10,
            rng: () => 0.0,
        });
        expect(fumble).toBeNull();
        expect(procs.length).toBe(1);
        expect(procs[0].trigger.tier).toBe(1);
        expect(procs[0].decision).toBe('normal');
    });

    it('skips higher-tier entries when the unlock cap is at tier 1', () => {
        const { procs } = rollForCombatEffects({
            actor: Player,
            stance: 'body',
            action: 'attack',
            rawAttackRoll: 10,
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
            actor: Disatree_01,
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
