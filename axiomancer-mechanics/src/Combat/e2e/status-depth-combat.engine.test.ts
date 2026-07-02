/**
 * Hermetic E2E — 0.34.0 status-depth epic: the new card mechanics, LIVE through
 * the HP-model combat engine. Seeded / stubbed RNG only; no disk / network / TTY.
 *
 * Covers each behavior end to end (VULNERABLE multiplier, DoT-amplification
 * honesty, RUPTURE detonate, COMPOUND scaler, DISRUPT deny, THORNS / BARRIER /
 * RIPOSTE / EXECUTE), an INVARIANT guard that the shared hot path is byte-identical
 * when no new marker is present, and the card-projection / reward-pool contract.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { TidepoolCrab } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import { getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, draftStanceDie, playCombatCard,
    resolveThreatPhase, processBetweenPhases,
    projectRupture, projectExecute, isExecuteReady, projectSiphonHeal,
    getDisruptMeter, getEnemyIncomingDamageMultiplier,
} from '../combat.engine';
import { classifyVerbClass, toCombatCard } from '../combat.cards';
import { getActiveDotTotal, getActiveDotAmplifications } from '../effect-modifiers';
import { RUPTURE_BURST_CAP, COMPOUND_COUNT_CAP } from '../effects';
import { COMBAT_REWARD_POOL } from '../combat.rewards';
import type { CombatDieColor, CombatEncounterState, CombatEvent } from '../combat.encounter.types';

afterEach(() => { vi.restoreAllMocks(); });

const ae = (effectId: string, intensity = 1, remainingDuration = 4, tier: 1 | 2 | 3 = 2): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier });

function makePlayer(skills: string[], effects: ActiveEffect[] = []): Character {
    const p = deepClone(Player);
    p.knownSkills = skills.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = effects;
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind' = 'mind', effects: ActiveEffect[] = []): Enemy {
    const e = deepClone(TidepoolCrab);
    e.id = 'enemy-test-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = effects;
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

/** Forces this turn's draft pool to known colors (deterministic reads). */
function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c,
        state: c === 'x' ? ('locked' as const) : ('available' as const), temporary: false,
    }));
    return { ...state, dice, draftedDieId: null, turn };
}

/** Opens phase-play, forces the pool, and drafts die 0 (color `die`). */
function openAndDraft(player: Character, enemy: Enemy, deck: string[], die: CombatDieColor, seed = 7): CombatEncounterState {
    let state = initializeCombatEncounter(player, enemy, deck, seed);
    state = rollEncounterDice(state).state;
    state = setDice(state, [die, 'x']);
    state = draftStanceDie(state, state.dice[0].id).state;
    return state;
}

const enemyDotSum = (events: readonly CombatEvent[]): number =>
    events.filter(e => e.kind === 'dot-tick' && e.target === 'enemy')
        .reduce((s, e) => s + (e as { amount: number }).amount, 0);

// ── VULNERABLE — outgoing-damage multiplier (enemy side) ─────────────────────

describe('VULNERABLE — the foe takes more from every HP source', () => {
    it('the free TOP chip scales exactly ×1.5 with debuff_vulnerable present (×1 absent)', () => {
        const DMG = 'achilles-gambit'; // pure direct-damage card
        const deck = [DMG, DMG, DMG, DMG, DMG];

        mockSequentialRng(0.05);
        let a = initializeCombatEncounter(makePlayer([DMG]), makeEnemy(300, 'mind'), deck, 7);
        a = rollEncounterDice(a).state;
        const aEntry = a.hand.find(h => h.cardId === DMG)!;
        const aRes = playCombatCard(a, { uid: aEntry.uid }, false);
        const baseChip = 300 - aRes.state.enemy.health;
        expect(baseChip).toBeGreaterThan(0);

        mockSequentialRng(0.05);
        let b = initializeCombatEncounter(makePlayer([DMG]), makeEnemy(300, 'mind', [ae('debuff_vulnerable', 1)]), deck, 7);
        b = rollEncounterDice(b).state;
        const bEntry = b.hand.find(h => h.cardId === DMG)!;
        const bRes = playCombatCard(b, { uid: bEntry.uid }, false);
        const vulnChip = 300 - bRes.state.enemy.health;

        expect(vulnChip).toBe(Math.round(baseChip * 1.5));
        expect(getEnemyIncomingDamageMultiplier(b)).toBe(1.5);
    });

    it('the POWERED strike is strictly larger against a Vulnerable foe', () => {
        const DMG = 'achilles-gambit';
        const deck = [DMG, DMG, DMG];

        mockSequentialRng(0.05);
        let a = openAndDraft(makePlayer([DMG]), makeEnemy(300, 'mind'), deck, 'mind');
        const aRes = playCombatCard(a, { uid: a.hand.find(h => h.cardId === DMG)!.uid }, true);
        const baseStrike = 300 - aRes.state.enemy.health;

        mockSequentialRng(0.05);
        let b = openAndDraft(makePlayer([DMG]), makeEnemy(300, 'mind', [ae('debuff_vulnerable', 1)]), deck, 'mind');
        const bRes = playCombatCard(b, { uid: b.hand.find(h => h.cardId === DMG)!.uid }, true);
        const vulnStrike = 300 - bRes.state.enemy.health;

        expect(baseStrike).toBeGreaterThan(0);
        expect(vulnStrike).toBeGreaterThan(baseStrike);
    });

    it('DoT erosion takes a labeled VULNERABLE surcharge that reconciles to the HP lost', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        // poison i2 → 8/round (start). Without vulnerable: lose 8.
        const plain = processBetweenPhases({ ...base, enemy: { ...base.enemy, effects: [ae('debuff_poison', 2)] } });
        expect(300 - plain.state.enemy.health).toBe(8);
        expect(plain.events.some(e => e.kind === 'dot-tick' && e.effectId === 'vulnerable-surcharge')).toBe(false);

        // With vulnerable 1.5: 8 + round(8×0.5)=4 → 12; surcharge is a labeled tick.
        const vuln = processBetweenPhases({ ...base, enemy: { ...base.enemy, effects: [ae('debuff_poison', 2), ae('debuff_vulnerable', 1)] } });
        const lost = 300 - vuln.state.enemy.health;
        expect(lost).toBe(12);
        const surcharge = vuln.events.find(e => e.kind === 'dot-tick' && e.effectId === 'vulnerable-surcharge');
        expect(surcharge).toBeDefined();
        expect((surcharge as { amount: number }).amount).toBe(4);
        // Honesty: the emitted enemy dot-ticks SUM to the real HP lost.
        expect(enemyDotSum(vuln.events)).toBe(lost);
    });
});

// ── AMPLIFICATION surface (Hemorrhage) ───────────────────────────────────────

describe('AMPLIFICATION — the combo registry is surfaced honestly', () => {
    it('poison+bleed dot-ticks SUM to the real HP lost and report the Hemorrhage combo', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const enemyEffects = [ae('debuff_poison', 2), ae('debuff_bleed', 1)];
        const res = processBetweenPhases({ ...base, enemy: { ...base.enemy, effects: enemyEffects } });
        const lost = 300 - res.state.enemy.health;
        expect(lost).toBe(15);                       // poison floor(4×2×1.5)=12 + bleed 3
        expect(enemyDotSum(res.events)).toBe(lost);  // honesty: emitted == landed

        expect(getActiveDotTotal(enemyEffects).total).toBe(15);
        const amps = getActiveDotAmplifications(enemyEffects);
        expect(amps).toHaveLength(1);
        expect(amps[0].comboName).toBe('Hemorrhage');
        expect(amps[0].multiplier).toBe(1.5);
    });
});

// ── RUPTURE — consume DoT, deal the remaining total ──────────────────────────

describe('RUPTURE — detonate the foe DoT for the remaining total', () => {
    const RUP = 'resonance-rupture';

    it('strips the DoT and bursts for projectRupture (read + vulnerable scaled)', () => {
        mockSequentialRng(0.05);
        const enemyEffects = [ae('debuff_poison', 2, 4), ae('debuff_bleed', 1, 4)];
        const state = openAndDraft(makePlayer([RUP]), makeEnemy(300, 'heart', enemyEffects), [RUP, RUP, RUP], 'heart');
        const projected = projectRupture(state); // neutral read (heart die vs heart) → ×1
        expect(projected).toBe(60);              // poison 12×4 + bleed 3×4

        const hpBefore = state.enemy.health;
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === RUP)!.uid }, true);
        const det = res.events.find(e => e.kind === 'rupture-detonated') as { amount: number; consumed: string[] } | undefined;
        expect(det).toBeDefined();
        expect(det!.amount).toBe(projected);
        expect(det!.consumed.sort()).toEqual(['debuff_bleed', 'debuff_poison']);
        // DoT effects are gone; HP dropped by at least the burst.
        expect(res.state.enemy.effects.some(e => lookupEffect(e.effectId)?.payload.damageOverTime)).toBe(false);
        expect(hpBefore - res.state.enemy.health).toBeGreaterThanOrEqual(projected);
    });

    it('respects RUPTURE_BURST_CAP on a huge DoT stack', () => {
        mockSequentialRng(0.05);
        const enemyEffects = [ae('debuff_poison', 10, 10)]; // pending 40×10 = 400
        const state = openAndDraft(makePlayer([RUP]), makeEnemy(900, 'heart', enemyEffects), [RUP, RUP, RUP], 'heart');
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === RUP)!.uid }, true);
        const det = res.events.find(e => e.kind === 'rupture-detonated') as { amount: number } | undefined;
        expect(det!.amount).toBe(RUPTURE_BURST_CAP);
    });
});

// ── COMPOUND — damage per distinct debuff ────────────────────────────────────

describe('COMPOUND — HP per DISTINCT debuff on the foe', () => {
    const CMP = 'mounting-contradictions';

    it('deals perDebuff × distinct count (counted before this card, neutral read)', () => {
        mockSequentialRng(0.05);
        const enemyEffects = [ae('debuff_poison', 1), ae('debuff_bleed', 1), ae('debuff_confusion', 1)];
        const state = openAndDraft(makePlayer([CMP]), makeEnemy(300, 'mind', enemyEffects), [CMP, CMP, CMP], 'mind');
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === CMP)!.uid }, true);
        const hit = res.events.find(e => e.kind === 'compound-hit') as { amount: number; debuffs: number } | undefined;
        expect(hit).toBeDefined();
        expect(hit!.debuffs).toBe(3);
        expect(hit!.amount).toBe(6 * 3); // perDebuff 6 × 3, neutral read ×1, no vulnerable
    });

    it('caps the credited count at COMPOUND_COUNT_CAP', () => {
        mockSequentialRng(0.05);
        const ids = ['debuff_poison', 'debuff_bleed', 'debuff_burn', 'debuff_confusion', 'debuff_fear', 'debuff_slow', 'debuff_root'];
        const enemyEffects = ids.map(id => ae(id, 1));
        const state = openAndDraft(makePlayer([CMP]), makeEnemy(400, 'mind', enemyEffects), [CMP, CMP, CMP], 'mind');
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === CMP)!.uid }, true);
        const hit = res.events.find(e => e.kind === 'compound-hit') as { amount: number; debuffs: number } | undefined;
        expect(hit!.debuffs).toBe(COMPOUND_COUNT_CAP);
        expect(hit!.amount).toBe(6 * COMPOUND_COUNT_CAP);
    });
});

// ── DISRUPT — distinct-control deny meter ────────────────────────────────────

describe('DISRUPT — a variety of controls denies the telegraphed turn', () => {
    const twoControls = () => [ae('debuff_body_attack_down', 1), ae('debuff_mind_attack_down', 1)];
    const threeControls = () => [...twoControls(), ae('debuff_heart_attack_down', 1)];

    it('does NOT deny at 2 distinct controls (roll penalty 2 < 8)', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', twoControls()), undefined, 7);
        const state = rollEncounterDice(base).state;
        const meter = getDisruptMeter(state);
        expect(meter.pips).toBe(2);
        expect(meter.willDeny).toBe(false);
        const res = resolveThreatPhase(state);
        expect(res.events.some(e => e.kind === 'disrupt-denied')).toBe(false);
        expect(res.events.some(e => e.kind === 'threat-fired')).toBe(true);
    });

    it('DENIES at exactly 3 distinct controls (the additive path, roll penalty 3 < 8)', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', threeControls()), undefined, 7);
        const state = rollEncounterDice(base).state;
        const meter = getDisruptMeter(state);
        expect(meter.pips).toBe(3);
        expect(meter.rollPenalty).toBe(3); // < THREAT_DENY_AT(8): legacy path would NOT deny
        expect(meter.willDeny).toBe(true);
        const res = resolveThreatPhase(state);
        const denied = res.events.find(e => e.kind === 'disrupt-denied') as { pips: number } | undefined;
        expect(denied).toBeDefined();
        expect(denied!.pips).toBe(3);
        expect(res.events.some(e => e.kind === 'threat-fired')).toBe(false);
        const resolved = res.events.find(e => e.kind === 'phase-resolved') as { mark: string } | undefined;
        expect(resolved!.mark).toBe('clear');
    });
});

// ── THORNS — reflect a telegraphed hit ───────────────────────────────────────

describe('THORNS — the foe telegraphed hit rebounds onto it', () => {
    it('reflects reflectDamage back at the enemy when it attacks', () => {
        mockSequentialRng(0.05);
        const player = makePlayer([], [ae('buff_brazen_thorns', 1)]); // reflectDamage 2
        const base = initializeCombatEncounter(player, makeEnemy(300, 'mind'), undefined, 7);
        const state = rollEncounterDice(base).state;
        const hpBefore = state.enemy.health;
        const res = resolveThreatPhase(state);
        const reflected = res.events.find(e => e.kind === 'thorns-reflected') as { amount: number; target: string } | undefined;
        expect(reflected).toBeDefined();
        expect(reflected!.amount).toBe(2);
        expect(reflected!.target).toBe('enemy');
        expect(hpBefore - res.state.enemy.health).toBe(2); // enemy has no DoT — only the reflect
    });
});

// ── BARRIER — stacking, persistent soak (distinct from one-shot GUARD) ────────

describe('BARRIER — a persistent, stacking soak', () => {
    it('a powered Gabriel\'s Bulwark STACKS onto any existing barrier', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer(['gabriels-bulwark']), makeEnemy(300, 'mind'), ['gabriels-bulwark', 'gabriels-bulwark', 'gabriels-bulwark'], 'mind');
        const seeded = { ...state, barrier: 10 };
        const res = playCombatCard(seeded, { uid: seeded.hand.find(h => h.cardId === 'gabriels-bulwark')!.uid }, true);
        expect(res.state.barrier ?? 0).toBeGreaterThan(10); // stacked, not replaced
    });

    it('persists across a phase (only the absorbed amount is spent) while GUARD resets', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        // guard 1 (small one-shot) + a big persistent barrier; the hit exceeds the
        // guard so the barrier must absorb the remainder.
        const state = { ...rollEncounterDice(base).state, guard: 1, barrier: 50 };
        const res = resolveThreatPhase(state);
        expect(res.events.some(e => e.kind === 'barrier-absorbed')).toBe(true);
        expect(res.state.guard).toBe(0);                 // one-shot guard resets
        expect(res.state.barrier ?? 0).toBeGreaterThan(0); // barrier persists…
        expect(res.state.barrier ?? 0).toBeLessThan(50);   // …minus what it absorbed
        expect(res.state.player.health).toBe(200);         // the hit was fully soaked
    });
});

// ── RIPOSTE — parry + counter ────────────────────────────────────────────────

describe('RIPOSTE — reduce the incoming hit and counter', () => {
    it('reduces the telegraphed hit once and counters for HP, then clears', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const plain = resolveThreatPhase(rollEncounterDice(deepClone(base)).state);
        const plainLoss = 200 - plain.state.player.health;
        expect(plainLoss).toBeGreaterThanOrEqual(2); // need a hit to partially reduce
        const reduce = plainLoss - 1;                 // < the hit, so the delta is visible

        const armed = { ...rollEncounterDice(deepClone(base)).state, riposte: { damage: 8, reduce } };
        const hpBefore = armed.enemy.health;
        const res = resolveThreatPhase(armed);
        expect(200 - res.state.player.health).toBe(plainLoss - reduce); // incoming reduced
        const fired = res.events.find(e => e.kind === 'riposte-fired') as { amount: number } | undefined;
        expect(fired!.amount).toBe(8);                  // counter (×1 vulnerable)
        expect(hpBefore - res.state.enemy.health).toBe(8);
        expect(res.state.riposte).toBeUndefined();      // cleared each phase
    });

    it('a powered Briar Riposte arms the parry AND grants Guard', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer(['briar-riposte']), makeEnemy(300, 'mind'), ['briar-riposte', 'briar-riposte', 'briar-riposte'], 'mind');
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === 'briar-riposte')!.uid }, true);
        expect(res.state.riposte).toBeDefined();
        expect(res.state.guard ?? 0).toBeGreaterThan(0);
    });
});

// ── EXECUTE — the finisher (Pyrrhic Victory) ─────────────────────────────────

describe('EXECUTE — a finisher when the foe is low or heavily DoT-stacked', () => {
    const PYR = 'pyrrhic-victory';

    it('fires (typically lethal) when the foe is at/below the HP gate, with recoil', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([PYR]), makeEnemy(100, 'mind'), [PYR, PYR, PYR], 'mind');
        const lowHp = { ...state, enemy: { ...state.enemy, health: 25 } }; // 25% <= 30%
        expect(isExecuteReady(lowHp, 0.3, 3)).toBe(true);
        const proj = projectExecute(lowHp, toCombatCard(PYR, getCardById, lookupEffect)!);
        expect(proj.ready).toBe(true);
        const res = playCombatCard(lowHp, { uid: lowHp.hand.find(h => h.cardId === PYR)!.uid }, true);
        expect(res.events.some(e => e.kind === 'execute-fired')).toBe(true);
        expect(res.state.enemy.health).toBe(0);
        expect(res.state.finalOutcome).toBe('victory');
        expect(res.state.player.health).toBeLessThan(200); // self-recoil
    });

    it('is READY by DoT stacks even at full HP', () => {
        mockSequentialRng(0.05);
        const dots = [ae('debuff_poison', 1), ae('debuff_bleed', 1), ae('debuff_burn', 1)];
        const state = openAndDraft(makePlayer([PYR]), makeEnemy(400, 'mind', dots), [PYR, PYR, PYR], 'mind');
        expect(isExecuteReady(state, 0.3, 3)).toBe(true);
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === PYR)!.uid }, true);
        const fired = res.events.find(e => e.kind === 'execute-fired') as { amount: number } | undefined;
        expect(fired).toBeDefined();
        expect(fired!.amount).toBeGreaterThan(100); // ~ round(400 × 0.75)
    });

    it('falls back to the normal strike when NOT ready (no execute event)', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([PYR]), makeEnemy(400, 'mind'), [PYR, PYR, PYR], 'mind');
        expect(isExecuteReady(state, 0.3, 3)).toBe(false);
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === PYR)!.uid }, true);
        expect(res.events.some(e => e.kind === 'execute-fired')).toBe(false);
        expect(res.state.enemy.health).toBeGreaterThan(0); // survives — only the small strike + bleed
    });
});

// ── SIPHON — offense-scaled sustain ──────────────────────────────────────────

describe('SIPHON — heal for part of the HP eroded', () => {
    it('heals the player for a fraction of the strike (damage-dealt self event)', () => {
        mockSequentialRng(0.05);
        const SIP = 'leeching-syllogism';
        const player = makePlayer([SIP]);
        player.health = 100; // leave headroom to observe the heal
        const state = openAndDraft(player, makeEnemy(300, 'mind'), [SIP, SIP, SIP], 'mind');
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === SIP)!.uid }, true);
        const heal = res.events.find(e => e.kind === 'damage-dealt' && e.target === 'self') as { amount: number } | undefined;
        expect(heal).toBeDefined();
        expect(heal!.amount).toBeLessThan(0);           // negative amount == heal
        expect(res.state.player.health).toBeGreaterThan(100);
        expect(projectSiphonHeal(state, toCombatCard(SIP, getCardById, lookupEffect)!)).toBeGreaterThan(0);
    });
});

// ── INVARIANT — the shared hot path is untouched without the new markers ──────

describe('INVARIANT — no new behavior fires without its marker', () => {
    const NEW_KINDS = new Set([
        'rupture-detonated', 'compound-hit', 'disrupt-denied',
        'thorns-reflected', 'barrier-absorbed', 'riposte-fired', 'execute-fired',
    ]);

    it('a plain enemy + plain player emit ZERO new-kind events and un-amplified DoT', () => {
        mockSequentialRng(0.05);
        // One control (roll -1) → below every deny threshold; one poison DoT, no combo.
        const enemyEffects = [ae('debuff_body_attack_down', 1), ae('debuff_poison', 2)];
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', enemyEffects), undefined, 7);
        const state = rollEncounterDice(base).state;
        const res = resolveThreatPhase(state); // fires threat + processBetweenPhases

        for (const ev of res.events) expect(NEW_KINDS.has(ev.kind)).toBe(false);
        expect(res.events.some(e => e.kind === 'dot-tick' && e.effectId === 'vulnerable-surcharge')).toBe(false);
        // poison i2, no combo → floor(4×2×1)=8 exactly (byte-identical to pre-0.34.0).
        const tick = res.events.find(e => e.kind === 'dot-tick' && e.effectId === 'debuff_poison') as { amount: number } | undefined;
        expect(tick!.amount).toBe(8);
        expect(res.events.some(e => e.kind === 'threat-fired')).toBe(true); // enemy still acts
    });
});

// ── Projection / verbClass / reward-pool contract ────────────────────────────

describe('card projection — the new payoff cards classify + advertise sensibly', () => {
    const cases: Array<[string, string, string]> = [
        // [cardId, expected verbClass, expected effectKind/track]
        ['resonance-rupture', 'direct-damage', 'none'],
        ['mounting-contradictions', 'direct-damage', 'none'],
        ['breach', 'stat-debuff', 'control'],
        ['gabriels-bulwark', 'defend', 'none'],
        ['briar-riposte', 'defend', 'none'],
        ['brazen-rebuttal', 'buff-self', 'none'],
        ['leeching-syllogism', 'direct-damage', 'none'],
        ['pyrrhic-victory', 'direct-dot', 'dot'], // keeps its bleed class despite execute
    ];

    for (const [id, verbClass, track] of cases) {
        it(`${id} → ${verbClass}/${track} and is reachable via COMBAT_REWARD_POOL`, () => {
            const skill = getCardById(id);
            expect(skill, `${id} must be a real skill`).toBeDefined();
            const c = classifyVerbClass(skill!, lookupEffect);
            expect(c.verbClass, id).toBe(verbClass);
            expect(c.track, id).toBe(track);
            const card = toCombatCard(id, getCardById, lookupEffect)!;
            expect(card.bottomDamagePreview).toBeGreaterThanOrEqual(0);
            expect(COMBAT_REWARD_POOL, id).toContain(id);
        });
    }

    it('rupture/compound cards advertise a non-zero preview floor', () => {
        for (const id of ['resonance-rupture', 'mounting-contradictions']) {
            expect(toCombatCard(id, getCardById, lookupEffect)!.bottomDamagePreview).toBeGreaterThan(0);
        }
    });
});
