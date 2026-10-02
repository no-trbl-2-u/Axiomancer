/**
 * Hermetic unit tests — status-depth selectors + card-engine no-ops (poison
 * ramps, bleed decays, MARK is the universal glue affliction).
 *
 * Pure reads over hand-built `ActiveEffect[]`:
 *   - getDamageTakenMultiplier   (exactly 1 without a marker — no library effect
 *     carries a plain damageTakenMult; the machinery is kept for enemies/tests)
 *   - getPendingDotTotal (RUPTURE fuel)
 *   - getDistinctDebuffCount
 *   - getActiveDotTotal / getActiveDotAmplifications  (amplification surface)
 *   - getTickAmplifyFlat         (MARK)
 *
 * Plus: every combat-engine-owned CardSpecialMechanic kind is a NO-OP through
 * `executeCard` (the HP behavior lives in combat.engine, not the card engine
 * — same split as `guard`). Self-contained, deterministic, no disk / RNG.
 */

import { describe, it, expect } from 'vitest';

import type { ActiveEffect } from '../../Effects/types';
import type { Combatant } from '../types';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { Player } from '../../Character/characters.mock';
import { FloatEye } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { getCardById } from '../../Cards/cards.library';
import { executeCard } from '../../Cards/card.engine';
import type { Card, CardSpecialMechanic } from '../../Cards/types';
import type { CombatState } from '../types';
import {
    getDamageTakenMultiplier, getPendingDotTotal,
    getDistinctDebuffCount,
} from '../effects';
import { getActiveDotTotal, getActiveDotAmplifications, getTickAmplifyFlat } from '../effect-modifiers';

// v3 debuff base values:
//   debuff_poison 2/round (start, ramps +floor(0.5×turnsActive) when a round is
//   threaded), debuff_bleed 3/round (end, decays 1 intensity per tick),
//   poison+bleed (combined intensity >= 3) → Hemorrhage ×1.5 on poison.
const ae = (effectId: string, intensity = 1, remainingDuration = 4, tier: 1 | 2 | 3 = 2): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier });

const combatant = (effects: ActiveEffect[]): Combatant => {
    const c = deepClone(Player);
    c.effects = effects;
    return c;
};

describe('getDamageTakenMultiplier — exactly 1 without a marker', () => {
    it('is EXACTLY 1 with no marker (byte-identical guard)', () => {
        expect(getDamageTakenMultiplier(combatant([]))).toBe(1);
        expect(getDamageTakenMultiplier(combatant([ae('debuff_poison', 3)]))).toBe(1);
        // MARK amplifies TICKS, not the plain incoming-damage multiplier.
        expect(getDamageTakenMultiplier(combatant([ae('debuff_mark', 3)]))).toBe(1);
    });
});

describe('getPendingDotTotal (RUPTURE fuel)', () => {
    it('sums each DoT over its remaining lifetime (amplification- and decay-aware)', () => {
        // Poison rides the card-played clock — 2 expected ticks/round.
        // i2, 4 rounds, NO round threaded → flat floor(2×2) × 8 ticks = 32.
        const only = getPendingDotTotal(combatant([ae('debuff_poison', 2, 4)]));
        expect(only.total).toBe(32);
        expect(only.perEffect).toHaveLength(1);

        // poison i2 + bleed i1 → Hemorrhage ×1.5 on poison:
        //   poison floor(2×2×1.5)=6 × 8 ticks → 48; bleed decays per tick —
        //   i1 lasts exactly ONE tick: floor(3×1)=3. total 51.
        const combo = getPendingDotTotal(combatant([ae('debuff_poison', 2, 4), ae('debuff_bleed', 1, 4)]));
        expect(combo.total).toBe(51);
    });

    it('bleed pending fuel models the per-tick intensity decay (spec 32 v3)', () => {
        // Bleed rides the damage-instance clock (2 expected/round) but
        // stays decay-LIMITED: i3 ticks 9, 6, 3, then washes out → 18 on any
        // clock (NOT 9 × ticks).
        expect(getPendingDotTotal(combatant([ae('debuff_bleed', 3, 4)])).total).toBe(18);
        // i3 d2: 2 ticks/round fit all three ticks inside the window → 18 too.
        expect(getPendingDotTotal(combatant([ae('debuff_bleed', 3, 2)])).total).toBe(18);
    });

    it('poison ramps its future ticks when a round is threaded', () => {
        // appliedAt 1, currentRound 1 → future dprs 2,2,3,3 × i2 × 2 ticks/round
        // = (4+4+6+6) × 2 = 40.
        expect(getPendingDotTotal(combatant([ae('debuff_poison', 2, 4)]), 1).total).toBe(40);
    });

    it('ignores non-DoT effects and treats permanent DoT as one round of expected ticks', () => {
        expect(getPendingDotTotal(combatant([ae('test_charm', 1)])).total).toBe(0);
        // remainingDuration -1 (permanent) → max(1, -1) = 1 round → 2 expected
        // card-played ticks × floor(2×1) = 4.
        expect(getPendingDotTotal(combatant([ae('debuff_poison', 1, -1)])).total).toBe(4);
    });

});

describe('getDistinctDebuffCount (FALLEN / variety payoffs)', () => {
    it('counts DISTINCT debuff ids (duplicates collapse, buffs excluded)', () => {
        expect(getDistinctDebuffCount(combatant([
            ae('debuff_poison', 1), ae('debuff_poison', 2), ae('debuff_bleed', 1), ae('debuff_mark', 1),
        ]))).toBe(3);
        expect(getDistinctDebuffCount(combatant([]))).toBe(0);
    });
});

describe('getActiveDotTotal / getActiveDotAmplifications (amplification surface)', () => {
    it('per-tick amplified amounts SUM to the real per-round DoT', () => {
        const t = getActiveDotTotal([ae('debuff_poison', 2), ae('debuff_bleed', 1)]);
        // poison floor(2×2×1.5)=6, bleed floor(3×1)=3 → 9.
        expect(t.total).toBe(9);
        const poison = t.perEffect.find(e => e.effectId === 'debuff_poison')!;
        expect(poison.baseAmount).toBe(4);
        expect(poison.amount).toBe(6);
        expect(poison.multiplier).toBe(1.5);
    });

    it('MARK adds +1 per stack to EVERY DoT tick on the bearer (ratified A3)', () => {
        expect(getTickAmplifyFlat([ae('debuff_mark', 2)])).toBe(2);
        const t = getActiveDotTotal([ae('debuff_poison', 1), ae('debuff_bleed', 1), ae('debuff_mark', 2)]);
        // poison 2+2=4; bleed+mark trigger Opened Veins (×1.5 on bleed):
        // floor(3×1×1.5)=4, +2 mark = 6 → total 10. (No Hemorrhage at combined
        // poison+bleed intensity 2.)
        expect(t.total).toBe(10);
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

// ── card-engine no-op (the HP behavior lives in combat.engine) ──────────────

const ENGINE_OWNED_KINDS: CardSpecialMechanic[] = [
    { kind: 'deal', amount: 5 },
    { kind: 'guard', amount: 5 },
];

describe('card engine — every combat-engine-owned mechanic kind is a NO-OP through executeCard', () => {
    for (const mech of ENGINE_OWNED_KINDS) {
        it(`'${mech.kind}' leaves caster/target HP + effects unchanged`, () => {
            const card: Card = {
                id: 'test-mech-card', name: 'Test Mechanic',
                color: 'body', description: 'x', tier: 1,
                targetType: 'enemy', rank: 1, cardType: 'spell',
                specialMechanics: [mech],
            };
            const player = deepClone(Player) as Character;
            player.knownCards = ['test-mech-card'];
            player.effects = [];
            player.baseStats = { body: 0, mind: 0, heart: 0 };
            const enemy = deepClone(FloatEye) as Enemy;
            enemy.health = 100; enemy.maxHealth = 100; enemy.effects = [ae('debuff_poison', 3)];

            const state: CombatState = { round: 1, player, enemy };
            const res = executeCard(state, 'test-mech-card', id => id === 'test-mech-card' ? card : getCardById(id));

            // No effect events from the mechanic itself.
            expect(res.events.some(e => e.kind === 'effect-applied')).toBe(false);
            expect(res.state.enemy.health).toBe(100);
            expect(res.state.player.health).toBe(player.health);
            expect(res.state.enemy.effects.map(e => e.effectId)).toEqual(['debuff_poison']);
        });
    }
});
