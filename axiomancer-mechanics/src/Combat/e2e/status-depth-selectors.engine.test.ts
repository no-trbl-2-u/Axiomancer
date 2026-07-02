/**
 * Hermetic unit tests — 0.34.0 status-depth selectors + skill-engine no-ops.
 *
 * Pure reads over hand-built `ActiveEffect[]`:
 *   - getDamageTakenMultiplier  (VULNERABLE; clamp at VULNERABLE_MAX_MULT)
 *   - getPendingDotTotal / consumeDotEffects   (RUPTURE fuel)
 *   - getDistinctDebuffCount    (COMPOUND scaler)
 *   - getDistinctControlCount   (DISRUPT meter pips)
 *   - getActiveDotTotal / getActiveDotAmplifications  (amplification surface)
 *
 * Plus: every NEW CardSpecialMechanic kind is a NO-OP through `executeSkill`
 * (the HP behavior lives in combat.engine, not the skill engine — same split as
 * `guard`). Self-contained, deterministic, no disk / RNG dependence.
 */

import { describe, it, expect } from 'vitest';

import type { ActiveEffect } from '../../Effects/types';
import type { Combatant } from '../types';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { Player } from '../../Character/characters.mock';
import { TidepoolCrab } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { getCardById } from '../../Cards/cards.library';
import { executeSkill } from '../../Cards/skill.engine';
import type { Card, CardSpecialMechanic } from '../../Cards/types';
import type { CombatState } from '../types';
import {
    getDamageTakenMultiplier, getPendingDotTotal, consumeDotEffects,
    getDistinctDebuffCount, getDistinctControlCount,
    VULNERABLE_MAX_MULT,
} from '../effects';
import { getActiveDotTotal, getActiveDotAmplifications } from '../effect-modifiers';

// debuff base values (the existing status-combo oracle pins these):
//   debuff_poison 4/round (start), debuff_bleed 3/round (end),
//   poison+bleed (combined intensity >= 3) → Hemorrhage ×1.5 on poison.
const ae = (effectId: string, intensity = 1, remainingDuration = 4, tier: 1 | 2 | 3 = 2): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier });

const combatant = (effects: ActiveEffect[]): Combatant => {
    const c = deepClone(Player);
    c.effects = effects;
    return c;
};

describe('getDamageTakenMultiplier (VULNERABLE)', () => {
    it('is EXACTLY 1 with no marker (byte-identical guard)', () => {
        expect(getDamageTakenMultiplier(combatant([]))).toBe(1);
        expect(getDamageTakenMultiplier(combatant([ae('debuff_poison', 3)]))).toBe(1);
    });

    it('reads a stance-agnostic vulnerable mark (1.5 at intensity 1)', () => {
        expect(getDamageTakenMultiplier(combatant([ae('debuff_vulnerable', 1)]))).toBe(1.5);
    });

    it('aggregates additively across markers and clamps at VULNERABLE_MAX_MULT', () => {
        // vulnerable(1) + vulnerability_body(1) = 1 + 0.5 + 0.5 = 2.0 (== cap).
        expect(getDamageTakenMultiplier(combatant([
            ae('debuff_vulnerable', 1), ae('debuff_vulnerability_body', 1),
        ]))).toBe(2.0);
        // intensity 3 → 1 + 0.5×3 = 2.5 → clamped to 2.0.
        expect(getDamageTakenMultiplier(combatant([ae('debuff_vulnerable', 3)]))).toBe(VULNERABLE_MAX_MULT);
        expect(VULNERABLE_MAX_MULT).toBe(2.0);
    });
});

describe('getPendingDotTotal / consumeDotEffects (RUPTURE)', () => {
    it('sums each DoT over its remaining lifetime (amplification-aware)', () => {
        // poison i2, 4 ticks left → floor(4×2)×4 = 32. No combo (poison alone).
        const only = getPendingDotTotal(combatant([ae('debuff_poison', 2, 4)]));
        expect(only.total).toBe(32);
        expect(only.perEffect).toHaveLength(1);

        // poison i2 + bleed i1 → Hemorrhage ×1.5 on poison:
        //   poison floor(4×2×1.5)=12 over 4 → 48; bleed floor(3×1)=3 over 4 → 12. total 60.
        const combo = getPendingDotTotal(combatant([ae('debuff_poison', 2, 4), ae('debuff_bleed', 1, 4)]));
        expect(combo.total).toBe(60);
    });

    it('ignores non-DoT effects and treats permanent DoT as one tick', () => {
        expect(getPendingDotTotal(combatant([ae('debuff_confusion', 1)])).total).toBe(0);
        // remainingDuration -1 (permanent) → max(1, -1) = 1 tick.
        expect(getPendingDotTotal(combatant([ae('debuff_poison', 1, -1)])).total).toBe(4);
    });

    it('consumeDotEffects strips ONLY DoT effects and reports the ids', () => {
        const c = combatant([ae('debuff_poison', 2), ae('debuff_confusion', 1), ae('debuff_bleed', 1)]);
        const { combatant: stripped, consumed } = consumeDotEffects(c);
        expect(consumed.sort()).toEqual(['debuff_bleed', 'debuff_poison']);
        expect(stripped.effects.map(e => e.effectId)).toEqual(['debuff_confusion']);
    });
});

describe('getDistinctDebuffCount (COMPOUND)', () => {
    it('counts DISTINCT debuff ids (duplicates collapse, buffs excluded)', () => {
        expect(getDistinctDebuffCount(combatant([
            ae('debuff_poison', 1), ae('debuff_poison', 2), ae('debuff_bleed', 1), ae('debuff_confusion', 1),
        ]))).toBe(3);
        // buffs do not count toward debuff variety.
        expect(getDistinctDebuffCount(combatant([ae('buff_brazen_thorns', 1)]))).toBe(0);
    });
});

describe('getDistinctControlCount (DISRUPT)', () => {
    it('counts action-restriction AND negative-roll controls; excludes pure DoT / vulnerable', () => {
        expect(getDistinctControlCount(combatant([
            ae('debuff_confusion', 1),       // roll -5
            ae('debuff_charm', 1),           // forcedStance
            ae('debuff_silence', 1),         // blockedStances
            ae('debuff_poison', 1),          // DoT — NOT control
            ae('debuff_vulnerable', 1),      // amp — NOT control
        ]))).toBe(3);
        expect(getDistinctControlCount(combatant([]))).toBe(0);
    });
});

describe('getActiveDotTotal / getActiveDotAmplifications (amplification surface)', () => {
    it('per-tick amplified amounts SUM to the real per-round DoT', () => {
        const t = getActiveDotTotal([ae('debuff_poison', 2), ae('debuff_bleed', 1)]);
        // poison floor(4×2×1.5)=12, bleed floor(3×1)=3 → 15 (matches the legacy oracle).
        expect(t.total).toBe(15);
        const poison = t.perEffect.find(e => e.effectId === 'debuff_poison')!;
        expect(poison.baseAmount).toBe(8);
        expect(poison.amount).toBe(12);
        expect(poison.multiplier).toBe(1.5);
    });

    it('reports the live triggered combos with their registry names', () => {
        const amps = getActiveDotAmplifications([ae('debuff_poison', 2), ae('debuff_bleed', 1)]);
        expect(amps).toHaveLength(1);
        expect(amps[0]).toMatchObject({
            targetEffectId: 'debuff_poison',
            multiplier: 1.5,
            interactionId: 'poison_bleed_hemorrhage',
            comboName: 'Hemorrhage',
        });
        // no combo when only one DoT is present.
        expect(getActiveDotAmplifications([ae('debuff_poison', 2)])).toEqual([]);
    });
});

// ── skill-engine no-op (the HP behavior lives in combat.engine) ──────────────

const NEW_KINDS: CardSpecialMechanic[] = [
    { kind: 'rupture' },
    { kind: 'compound', perDebuff: 6 },
    { kind: 'siphon', pct: 0.5 },
    { kind: 'barrier', amount: 10 },
    { kind: 'riposte', damage: 8, reduce: 6 },
    { kind: 'execute', hpPct: 0.3, dotStacks: 3 },
];

describe('skill engine — every new mechanic kind is a NO-OP through executeSkill', () => {
    for (const mech of NEW_KINDS) {
        it(`'${mech.kind}' leaves caster/target HP + effects unchanged`, () => {
            const skill: Card = {
                id: 'test-mech-skill', name: 'Test Mechanic', category: 'fallacy',
                philosophicalAspect: 'body', description: 'x', tier: 1,
                targetType: 'enemy',
                basePower: 0, scalingStat: 'body',
                specialMechanics: [mech],
            };
            const player = deepClone(Player) as Character;
            player.knownSkills = ['test-mech-skill'];
            player.effects = [];
            // Zero stats so the skill's own basePower/stat-scaling deals 0 — then
            // any HP/effect change could ONLY come from the mechanic (which no-ops).
            player.baseStats = { body: 0, mind: 0, heart: 0 };
            const enemy = deepClone(TidepoolCrab) as Enemy;
            enemy.health = 100; enemy.maxHealth = 100; enemy.effects = [ae('debuff_poison', 3)];

            const state: CombatState = {
                active: true, phase: 'resolving', round: 1, friendshipCounter: 0,
                player, enemy, playerChoice: {}, enemyChoice: {}, log: [],
                combatResources: { heart: 0, body: 5, mind: 0, fallacy: 0, paradox: 0 },
            };
            const res = executeSkill(state, 'test-mech-skill', id => id === 'test-mech-skill' ? skill : getCardById(id), 'player');

            // No damage/heal/effect events from the mechanic itself.
            expect(res.events.some(e => e.kind === 'damage' || e.kind === 'heal' || e.kind === 'effect-applied')).toBe(false);
            expect(res.state.enemy.health).toBe(100);
            expect(res.state.player.health).toBe(player.health);
            expect(res.state.enemy.effects.map(e => e.effectId)).toEqual(['debuff_poison']);
        });
    }
});
