/**
 * Hermetic unit tests — status-depth selectors + card-engine no-ops,
 * re-pinned to the spec 32 v3 library (poison ramps, bleed decays, MARK is the
 * universal glue affliction; the old vulnerable/compound/execute vocabulary is
 * retired).
 *
 * Pure reads over hand-built `ActiveEffect[]`:
 *   - getDamageTakenMultiplier   (exactly 1 without a marker — no v3 effect
 *     carries a plain damageTakenMult; the machinery is kept for enemies/tests)
 *   - getStanceVulnMult          (stance-keyed vulnerability, clamped)
 *   - getPendingDotTotal / consumeDotEffects / consumeAfflictions (RUPTURE fuel)
 *   - getDistinctDebuffCount / getDistinctControlCount
 *   - getActiveDotTotal / getActiveDotAmplifications  (amplification surface)
 *   - getTickAmplifyFlat         (MARK)
 *
 * Plus: every combat-engine-owned CardSpecialMechanic kind is a NO-OP through
 * `executeCard` (the HP behavior lives in combat.engine, not the card engine
 * — same split as `guard`). Self-contained, deterministic, no disk / RNG.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { effectsLibrary } from '../../Effects/effects.library';
import type { ActiveEffect, Effect } from '../../Effects/types';
import type { Combatant } from '../types';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { Player } from '../../Character/characters.mock';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { getCardById } from '../../Cards/cards.library';
import { executeCard } from '../../Cards/card.engine';
import type { Card, CardSpecialMechanic } from '../../Cards/types';
import type { CombatState } from '../types';
import {
    getDamageTakenMultiplier, getStanceVulnMult, getPendingDotTotal,
    consumeDotEffects, consumeAfflictions, consumeMarks,
    getDistinctDebuffCount, getDistinctControlCount,
    VULNERABLE_MAX_MULT,
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

// The spec 32 v3 keyword reset deleted the stance-keyed VULNERABLE debuff and
// the negative-roll / action-restriction control debuffs. No surviving library
// effect carries those shapes, so the stance-vuln and distinct-control machinery
// is driven by test-only fixtures registered into the shared registry (the same
// lookup the selectors read). Never touches the library JSON.
const SELECTOR_FIXTURES: Effect[] = [
    { id: 'test_vuln_body', name: 'test vuln body', description: 'stance-keyed vulnerable body ×1.5', type: 'debuff', category: 'stat', duration: 4, stacking: 'intensity', tier: 2, payload: { damageTakenMultForStance: { stance: 'body', mult: 1.5 } } },
    { id: 'test_ctrl_confusion', name: 'test confusion', description: 'control -5', type: 'debuff', category: 'control', duration: 4, stacking: 'intensity', tier: 2, payload: { rollModifier: -5 } },
    { id: 'test_charm', name: 'test charm', description: 'forcedStance heart', type: 'debuff', category: 'control', duration: 4, stacking: 'none', tier: 2, payload: { actionRestriction: { forcedStance: 'heart' } } },
    { id: 'test_silence', name: 'test silence', description: 'blockedStances heart', type: 'debuff', category: 'control', duration: 4, stacking: 'none', tier: 2, payload: { actionRestriction: { blockedStances: ['heart'] } } },
    // Post-Phase-30 merge 2026-07-12: the zero-producer sweep deleted the
    // legacy control vocabulary — the WS8.2 surface shapes live on as
    // test-only fixtures, one per DISRUPT surface.
    { id: 'test_ctrl_fear', name: 'test fear', description: 'control roll -4', type: 'debuff', category: 'control', duration: 4, stacking: 'intensity', tier: 2, payload: { rollModifier: -4 } },
    { id: 'test_ctrl_knockdown', name: 'test knockdown', description: 'control roll -3', type: 'debuff', category: 'control', duration: 4, stacking: 'intensity', tier: 2, payload: { rollModifier: -3 } },
    { id: 'test_ctrl_slow', name: 'test slow', description: 'control roll -2', type: 'debuff', category: 'control', duration: 4, stacking: 'intensity', tier: 2, payload: { rollModifier: -2 } },
    { id: 'test_root', name: 'test root', description: 'stance lock', type: 'debuff', category: 'control', duration: 4, stacking: 'none', tier: 2, payload: { defenseModifier: -2, lockedStance: true } },
    { id: 'test_blind', name: 'test blind', description: 'rider suppress', type: 'debuff', category: 'control', duration: 4, stacking: 'none', tier: 2, payload: { suppressesThreatRiders: true } },
    { id: 'test_confusion_blur', name: 'test stance blur', description: 'blursStanceHints', type: 'debuff', category: 'control', duration: 4, stacking: 'none', tier: 2, payload: { blursStanceHints: true } },
    { id: 'test_exhaustion', name: 'test exhaustion', description: 'threat-damage -25%', type: 'debuff', category: 'stat', duration: 4, stacking: 'intensity', tier: 2, payload: { outgoingThreatDamageMulPct: -25 } },
];
beforeAll(() => { for (const e of SELECTOR_FIXTURES) effectsLibrary.registry.set(e.id, e); });
afterAll(() => { for (const e of SELECTOR_FIXTURES) effectsLibrary.registry.delete(e.id); });

describe('getDamageTakenMultiplier — exactly 1 without a marker', () => {
    it('is EXACTLY 1 with no marker (byte-identical guard)', () => {
        expect(getDamageTakenMultiplier(combatant([]))).toBe(1);
        expect(getDamageTakenMultiplier(combatant([ae('debuff_poison', 3)]))).toBe(1);
        // MARK amplifies TICKS, not the plain incoming-damage multiplier.
        expect(getDamageTakenMultiplier(combatant([ae('debuff_mark', 3)]))).toBe(1);
    });
});

describe('getStanceVulnMult — stance-keyed vulnerability (Fate Engine P1 #17)', () => {
    it('reads the keyed mult for a matching die color (and wild)', () => {
        const c = combatant([ae('test_vuln_body', 1)]);
        expect(getStanceVulnMult(c, 'body')).toBe(1.5);
        expect(getStanceVulnMult(c, 'wild')).toBe(1.5);
        expect(getStanceVulnMult(c, 'mind')).toBe(1);
        expect(getStanceVulnMult(c, 'x')).toBe(1);
    });

    it('scales with intensity and clamps at VULNERABLE_MAX_MULT', () => {
        expect(getStanceVulnMult(combatant([ae('test_vuln_body', 2)]), 'body')).toBe(2.0);
        expect(getStanceVulnMult(combatant([ae('test_vuln_body', 3)]), 'body')).toBe(VULNERABLE_MAX_MULT);
        expect(VULNERABLE_MAX_MULT).toBe(2.0);
    });
});

describe('getPendingDotTotal / consumeDotEffects (RUPTURE fuel)', () => {
    it('sums each DoT over its remaining lifetime (amplification- and decay-aware)', () => {
        // WS3.3: poison rides the card-played clock — 2 expected ticks/round.
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
        // WS3.3: bleed rides the damage-instance clock (2 expected/round) but
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
        expect(getPendingDotTotal(combatant([ae('test_ctrl_confusion', 1)])).total).toBe(0);
        // remainingDuration -1 (permanent) → max(1, -1) = 1 round → 2 expected
        // card-played ticks × floor(2×1) = 4.
        expect(getPendingDotTotal(combatant([ae('debuff_poison', 1, -1)])).total).toBe(4);
    });

    it('consumeDotEffects strips ONLY DoT effects and reports the ids', () => {
        const c = combatant([ae('debuff_poison', 2), ae('debuff_curse', 1), ae('debuff_bleed', 1)]);
        const { combatant: stripped, consumed } = consumeDotEffects(c);
        expect(consumed.sort()).toEqual(['debuff_bleed', 'debuff_poison']);
        expect(stripped.effects.map(e => e.effectId)).toEqual(['debuff_curse']);
    });

    it('consumeAfflictions strips EVERY debuff and counts non-DoT stacks (v3 RUPTURE)', () => {
        const c = combatant([
            ae('debuff_poison', 2), ae('debuff_mark', 3), ae('debuff_quarter', 1),
            ae('buff_thorns', 2),
        ]);
        const { combatant: stripped, consumed, nonDotStacks } = consumeAfflictions(c);
        expect(consumed.sort()).toEqual(['debuff_mark', 'debuff_poison', 'debuff_quarter']);
        expect(nonDotStacks).toBe(4); // mark 3 + rapport 1 (poison is DoT)
        expect(stripped.effects.map(e => e.effectId)).toEqual(['buff_thorns']);
    });

    it('consumeMarks removes only MARK-class stacks (the conclusion fuel)', () => {
        const c = combatant([ae('debuff_mark', 3), ae('debuff_poison', 2)]);
        const { combatant: stripped, stacks } = consumeMarks(c);
        expect(stacks).toBe(3);
        expect(stripped.effects.map(e => e.effectId)).toEqual(['debuff_poison']);
    });
});

describe('getDistinctDebuffCount (FALLEN / variety payoffs)', () => {
    it('counts DISTINCT debuff ids (duplicates collapse, buffs excluded)', () => {
        expect(getDistinctDebuffCount(combatant([
            ae('debuff_poison', 1), ae('debuff_poison', 2), ae('debuff_bleed', 1), ae('debuff_mark', 1),
        ]))).toBe(3);
        // buffs do not count toward debuff variety.
        expect(getDistinctDebuffCount(combatant([ae('buff_thorns', 1)]))).toBe(0);
    });
});

describe('getDistinctControlCount (DISRUPT meter — WS8.3 counts SURFACES, not ids)', () => {
    it('counts distinct control SURFACES; same-surface ids collapse to one pip', () => {
        // Five control ids on THREE surfaces: charm + silence share 'action',
        // knockdown + slow share 'roll', root owns 'stance' (WS8.2
        // lockedStance). (daze folded into confusion, WS8.1 KW-2.)
        expect(getDistinctControlCount(combatant([
            ae('test_charm', 1),                  // forcedStance    → action
            ae('test_silence', 1),                // blockedStances  → action
            ae('test_ctrl_knockdown', 1),         // roll -3         → roll
            ae('test_ctrl_slow', 1),              // roll -2         → roll
            ae('test_root', 1),                   // lockedStance    → stance
            ae('debuff_poison', 1),               // DoT — NOT control
            ae('debuff_mark', 1),                 // exposure — NOT control
        ]))).toBe(3);
        // Three ids of the SAME grip are ONE pip (the WS8.3 design intent).
        expect(getDistinctControlCount(combatant([
            ae('test_ctrl_fear', 1), ae('test_ctrl_slow', 1), ae('test_ctrl_knockdown', 1),
        ]))).toBe(1);
        expect(getDistinctControlCount(combatant([]))).toBe(0);
    });

    it('classifies the WS8.2 re-payloaded surfaces (threat-damage / rider-suppress / stance)', () => {
        expect(getDistinctControlCount(combatant([
            ae('test_exhaustion', 1),             // outgoingThreatDamageMulPct → threat-damage
            ae('test_blind', 1),                  // suppressesThreatRiders     → rider-suppress
            ae('test_confusion_blur', 1),         // blursStanceHints           → stance
        ]))).toBe(3);
        // ROOT (lock) and CONFUSION (blur) are the same stance surface.
        expect(getDistinctControlCount(combatant([
            ae('test_root', 1), ae('test_confusion_blur', 1),
        ]))).toBe(1);
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
    { kind: 'rupture' },
    { kind: 'siphon', pct: 0.5 },
    { kind: 'barrier', amount: 10 },
    { kind: 'riposte', damage: 8, reduce: 6 },
    { kind: 'reap_all', burstPerSoul: 2 },
    { kind: 'sway', amount: 3 },
    { kind: 'stagger', rungs: 1 },
    { kind: 'recoil', hp: 4 },
    { kind: 'soul_gain', count: 1 },
    { kind: 'premise', count: 2 },
    { kind: 'echo' },
    { kind: 'reprise', count: 1 },
];

describe('card engine — every combat-engine-owned mechanic kind is a NO-OP through executeCard', () => {
    for (const mech of ENGINE_OWNED_KINDS) {
        it(`'${mech.kind}' leaves caster/target HP + effects unchanged`, () => {
            const card: Card = {
                id: 'test-mech-card', name: 'Test Mechanic',
                philosophicalAspect: 'body', description: 'x', tier: 1,
                targetType: 'enemy', rank: 1, cardType: 'spell',
                specialMechanics: [mech],
            };
            const player = deepClone(Player) as Character;
            player.knownCards = ['test-mech-card'];
            player.effects = [];
            player.baseStats = { body: 0, mind: 0, heart: 0 };
            const enemy = deepClone(GraveLarva) as Enemy;
            enemy.health = 100; enemy.maxHealth = 100; enemy.effects = [ae('debuff_poison', 3)];

            const state: CombatState = {
                active: true, phase: 'resolving', round: 1, friendshipCounter: 0,
                player, enemy, playerChoice: {}, enemyChoice: {},
            };
            const res = executeCard(state, 'test-mech-card', id => id === 'test-mech-card' ? card : getCardById(id), 'player');

            // No effect events from the mechanic itself.
            expect(res.events.some(e => e.kind === 'effect-applied')).toBe(false);
            expect(res.state.enemy.health).toBe(100);
            expect(res.state.player.health).toBe(player.health);
            expect(res.state.enemy.effects.map(e => e.effectId)).toEqual(['debuff_poison']);
        });
    }
});
