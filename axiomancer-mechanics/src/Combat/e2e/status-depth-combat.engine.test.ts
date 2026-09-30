/**
 * Hermetic E2E — status-depth mechanics, LIVE through the HP-model combat
 * engine, re-pinned to spec 32 v3 (THE STRIKE IS DEAD: no basePower, no chip;
 * compound/amplify/execute are deleted; RUPTURE consumes ALL afflictions and
 * feeds Souls; RIPOSTE fires only on a FULL block).
 *
 * Covers each surviving behavior end to end (DoT-amplification honesty,
 * DISRUPT deny, THORNS / BARRIER / RIPOSTE), an INVARIANT guard that the
 * shared hot path stays quiet without its marker, and the card-projection /
 * reward-pool contract for the library.
 *
 * Card purge (P1, 2026-09-27): RUPTURE and SIPHON lost every carrier (their
 * sandbox fixtures went with them — the verbs leave the engine next), and the
 * card-play cases for BARRIER (Adamant Wall) and RIPOSTE (Reprisal Bell) left
 * with their cards; the state-driven BARRIER / RIPOSTE laws stay.
 */

import { describe, it, expect, afterEach, afterAll, beforeAll, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { FloatEye } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import { getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import { effectsLibrary } from '../../Effects/effects.library';
import type { ActiveEffect, Effect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice,
    resolveThreatPhase, processBetweenPhases,
    getDisruptMeter, getEnemyIncomingDamageMultiplier,
} from '../combat.engine';
import { classifyVerbClass, toCombatCard } from '../combat.cards';
import { getActiveDotTotal, getActiveDotAmplifications } from '../effect-modifiers';
import { COMBAT_REWARD_POOL } from '../combat.rewards';
import type { CombatEvent } from '../combat.encounter.types';

import { registerFixtureEffects } from '../../test-utils/fixture-effects';

// The keyword audit (2026-09-27) deleted buff_thorns / debuff_backfire /
// the round-clock DoT species from the library; their engine channels are
// exercised through the `fixture_*` effects instead.
registerFixtureEffects();

afterEach(() => { vi.restoreAllMocks(); });

const ae = (effectId: string, intensity = 1, remainingDuration = 4, tier: 1 | 2 | 3 = 2): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier });

// The spec 32 v3 keyword reset deleted the negative-rollModifier control debuffs
// (Daze -3, Slow -2, Root -2). No surviving library effect carries a roll
// penalty, so the DISRUPT distinct-control machinery is driven by test-only
// control fixtures registered into the shared registry (the same lookup the
// engine's roll-penalty / distinct-control readers consult). Never touches the
// library JSON.
// Post-Phase-30 merge 2026-07-12: the zero-producer sweep deleted the legacy
// control vocabulary (knockdown/root/blind/slow/straw-man-echo), so the WS8
// surface shapes live on as test-only fixtures — one per DISRUPT surface
// (roll / stance-lock / rider-suppress) plus the roll-shred fillers.
const CONTROL_FIXTURES: Effect[] = [
    { id: 'test_ctrl_daze', name: 'test daze', description: 'control -3', type: 'debuff', category: 'control', duration: 4, stacking: 'intensity', tier: 2, payload: { rollModifier: -3 } },
    { id: 'test_ctrl_knockdown', name: 'test knockdown', description: 'control roll -3', type: 'debuff', category: 'control', duration: 4, stacking: 'intensity', tier: 2, payload: { rollModifier: -3 } },
    { id: 'test_ctrl_slow', name: 'test slow', description: 'control -2', type: 'debuff', category: 'control', duration: 4, stacking: 'intensity', tier: 2, payload: { rollModifier: -2 } },
    { id: 'test_ctrl_echo', name: 'test echo shred', description: 'control -1', type: 'debuff', category: 'control', duration: 4, stacking: 'intensity', tier: 2, payload: { rollModifier: -1 } },
    { id: 'test_ctrl_root', name: 'test root', description: 'control stance-lock', type: 'debuff', category: 'control', duration: 4, stacking: 'intensity', tier: 2, payload: { defenseModifier: -2, lockedStance: true } },
    { id: 'test_ctrl_blind', name: 'test blind', description: 'control rider-suppress', type: 'debuff', category: 'control', duration: 4, stacking: 'intensity', tier: 2, payload: { suppressesThreatRiders: true } },
];
beforeAll(() => { for (const e of CONTROL_FIXTURES) effectsLibrary.registry.set(e.id, e); });
afterAll(() => { for (const e of CONTROL_FIXTURES) effectsLibrary.registry.delete(e.id); });

function makePlayer(cards: string[], effects: ActiveEffect[] = []): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = effects;
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind' = 'mind', effects: ActiveEffect[] = []): Enemy {
    const e = deepClone(FloatEye);
    e.id = 'enemy-test-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = effects;
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

const enemyDotSum = (events: readonly CombatEvent[]): number =>
    events.filter(e => e.kind === 'dot-tick' && e.target === 'enemy')
        .reduce((s, e) => s + (e as { amount: number }).amount, 0);

// ── AMPLIFICATION surface (Hemorrhage) ───────────────────────────────────────

describe('AMPLIFICATION — the combo registry is surfaced honestly', () => {
    it('poison+bleed surface the Hemorrhage combo; event clocks never round-tick', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const enemyEffects = [ae('debuff_poison', 2), ae('debuff_bleed', 1)];
        const res = processBetweenPhases({ ...base, enemy: { ...base.enemy, effects: enemyEffects } });
        const lost = 300 - res.state.enemy.health;
        // WS3.3: poison (card-played clock) and bleed (damage-instance clock)
        // no longer tick at the round boundary — the boundary leaves them
        // untouched, honestly (emitted == landed == 0).
        expect(lost).toBe(0);
        expect(enemyDotSum(res.events)).toBe(0);

        // The per-tick amplification surface is clock-agnostic:
        // poison floor(2×2×1.5)=6 (Hemorrhage) + bleed floor(3×1)=3.
        expect(getActiveDotTotal(enemyEffects).total).toBe(9);
        const amps = getActiveDotAmplifications(enemyEffects);
        expect(amps).toHaveLength(1);
        expect(amps[0].comboName).toBe('Hemorrhage');
        expect(amps[0].multiplier).toBe(1.5);
    });

    it('an unmarked foe has an incoming-damage multiplier of exactly 1', () => {
        const state = initializeCombatEncounter(
            makePlayer([]), makeEnemy(300, 'mind', [ae('debuff_poison', 2)]), undefined, 7);
        expect(getEnemyIncomingDamageMultiplier(state)).toBe(1);
    });
});

// ── DISRUPT — distinct-control deny meter ────────────────────────────────────

describe('DISRUPT — a variety of control SURFACES denies the telegraphed turn (WS8.3)', () => {
    // Support-tagged (non-card) controls carried by enemy threats / legacy
    // sources — each on a DIFFERENT surface (spec 32 §12 #6):
    //   knockdown → roll (-3), root → stance (lockedStance),
    //   blind → rider-suppress (suppressesThreatRiders).
    // (daze folded into confusion, WS8.1 KW-2 — knockdown is the -3 roll
    // carrier now; all shapes are test-only fixtures post the zero-producer
    // sweep.)
    const twoSurfaces = () => [ae('test_ctrl_knockdown', 1), ae('test_ctrl_root', 1)];
    const threeSurfaces = () => [...twoSurfaces(), ae('test_ctrl_blind', 1)];

    it('does NOT deny at 2 distinct surfaces (roll penalty 3 < 8)', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', twoSurfaces()), undefined, 7);
        const state = rollEncounterDice(base).state;
        const meter = getDisruptMeter(state);
        expect(meter.pips).toBe(2);
        expect(meter.willDeny).toBe(false);
        const res = resolveThreatPhase(state);
        expect(res.events.some(e => e.kind === 'disrupt-denied')).toBe(false);
        expect(res.events.some(e => e.kind === 'threat-fired')).toBe(true);
    });

    it('does NOT deny at 3 controls of the SAME grip (three roll shreds = 1 pip)', () => {
        mockSequentialRng(0.05);
        // knockdown -3 + slow -2 + echo shred -1 = penalty 6 < 8, all 'roll'.
        const sameGrip = [ae('test_ctrl_knockdown', 1), ae('test_ctrl_slow', 1), ae('test_ctrl_echo', 1)];
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', sameGrip), undefined, 7);
        const state = rollEncounterDice(base).state;
        const meter = getDisruptMeter(state);
        expect(meter.pips).toBe(1);
        expect(meter.willDeny).toBe(false);
        const res = resolveThreatPhase(state);
        expect(res.events.some(e => e.kind === 'disrupt-denied')).toBe(false);
        expect(res.events.some(e => e.kind === 'threat-fired')).toBe(true);
    });

    it('DENIES at exactly 3 distinct surfaces (the additive path, roll penalty 3 < 8)', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', threeSurfaces()), undefined, 7);
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
        const player = makePlayer([], [ae('fixture_thorns', 1)]); // reflectDamage 1
        const base = initializeCombatEncounter(player, makeEnemy(300, 'mind'), undefined, 7);
        const state = rollEncounterDice(base).state;
        const hpBefore = state.enemy.health;
        const res = resolveThreatPhase(state);
        const reflected = res.events.find(e => e.kind === 'thorns-reflected') as { amount: number; target: string } | undefined;
        expect(reflected).toBeDefined();
        expect(reflected!.amount).toBe(1);
        expect(reflected!.target).toBe('enemy');
        expect(hpBefore - res.state.enemy.health).toBe(1); // enemy has no DoT — only the reflect
    });

    it('the THORNS reflect channel (fixture_thorns) reflects 1 per intensity', () => {
        mockSequentialRng(0.05);
        const player = makePlayer([], [ae('fixture_thorns', 3, 2)]);
        const base = initializeCombatEncounter(player, makeEnemy(300, 'mind'), undefined, 7);
        const res = resolveThreatPhase(rollEncounterDice(base).state);
        const reflected = res.events.find(e => e.kind === 'thorns-reflected') as { amount: number } | undefined;
        expect(reflected!.amount).toBe(3);
    });
});

// ── BARRIER — stacking, persistent soak (distinct from one-shot GUARD) ────────

describe('BARRIER — a persistent, stacking soak', () => {

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

// ── RIPOSTE — spec 32 v3: fires ONLY on a FULL block ─────────────────────────

describe('RIPOSTE — counters only when Guard/Barrier fully blocked the attack', () => {
    it('fires the counter when the hit is FULLY blocked, then clears', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const armed = {
            ...rollEncounterDice(deepClone(base)).state,
            guard: 100,                             // over-guards the telegraphed hit
            riposte: { damage: 8, reduce: 0 },
        };
        const hpBefore = armed.enemy.health;
        const res = resolveThreatPhase(armed);
        const fired = res.events.find(e => e.kind === 'riposte-fired') as { amount: number } | undefined;
        expect(fired).toBeDefined();
        expect(fired!.amount).toBe(8);
        expect(hpBefore - res.state.enemy.health).toBe(8);
        expect(res.state.player.health).toBe(200);      // the block held
        expect(res.state.riposte).toBeUndefined();      // cleared each phase
    });

    it('phase 32 part 2: scales the counter to the prevented blow when it exceeds the printed floor', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const armed = {
            ...rollEncounterDice(deepClone(base)).state,
            guard: 100,                              // over-guards the telegraphed hit
            riposte: { damage: 1, reduce: 0 },        // floor far below the real blow
        };
        const hpBefore = armed.enemy.health;
        const res = resolveThreatPhase(armed);
        const fired = res.events.find(e => e.kind === 'riposte-fired') as { amount: number } | undefined;
        expect(fired).toBeDefined();
        expect(fired!.amount).toBeGreaterThan(1);       // scaled past the printed floor
        expect(hpBefore - res.state.enemy.health).toBe(fired!.amount);
    });

    it('phase 32 part 2: floors at the printed damage when the prevented blow is smaller', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const armed = {
            ...rollEncounterDice(deepClone(base)).state,
            guard: 100,
            riposte: { damage: 500, reduce: 0 },       // floor far above the real blow
        };
        const res = resolveThreatPhase(armed);
        const fired = res.events.find(e => e.kind === 'riposte-fired') as { amount: number } | undefined;
        expect(fired!.amount).toBe(500);
    });

    it('does NOT fire when the hit lands (no full block)', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const armed = { ...rollEncounterDice(deepClone(base)).state, riposte: { damage: 8, reduce: 0 } };
        const res = resolveThreatPhase(armed);
        expect(res.state.player.health).toBeLessThan(200);          // the hit landed
        expect(res.events.some(e => e.kind === 'riposte-fired')).toBe(false);
        expect(res.state.riposte).toBeUndefined();                  // still clears
    });
});

// ── INVARIANT — the shared hot path is untouched without the new markers ──────

describe('INVARIANT — no new behavior fires without its marker', () => {
    const NEW_KINDS = new Set([
        'rupture-detonated', 'disrupt-denied', 'thorns-reflected',
        'barrier-absorbed', 'riposte-fired', 'reaped', 'staggered',
        'soul-gained',
    ]);

    it('a plain enemy + plain player emit ZERO new-kind events and un-amplified DoT', () => {
        mockSequentialRng(0.05);
        // One control (roll -3) → below every deny threshold; one ROUND-CLOCKED
        // DoT, no combo. (WS3.3: poison moved to the card-played clock — it no
        // longer ticks at the round boundary, so the round-tick witness here is
        // the nettle-sting fixture (`fixture_nettle`): dpr 2, round-end.)
        const enemyEffects = [ae('test_ctrl_knockdown', 1), ae('fixture_nettle', 2)];
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', enemyEffects), undefined, 7);
        const state = rollEncounterDice(base).state;
        const res = resolveThreatPhase(state); // fires threat + processBetweenPhases

        for (const ev of res.events) expect(NEW_KINDS.has(ev.kind), ev.kind).toBe(false);
        expect(res.events.some(e => e.kind === 'dot-tick' && e.effectId === 'vulnerable-surcharge')).toBe(false);
        // fixture_nettle i2, round 1, no combo → floor(2×2)=4 exactly.
        const tick = res.events.find(e => e.kind === 'dot-tick' && e.effectId === 'fixture_nettle') as { amount: number } | undefined;
        expect(tick!.amount).toBe(4);
        expect(res.events.some(e => e.kind === 'threat-fired')).toBe(true); // enemy still acts
    });
});

// ── Projection / verbClass / reward-pool contract ────────────────────────────

describe('card projection — the grey office classifies + advertises sensibly', () => {
    // Card purge (P1, 2026-09-27): the library is the grey office. The
    // purged cases (RUPTURE/REAP finishers, DoT seeds, STAGGER/PLEA control,
    // oath/hex frames) left with their cards. A Plain Blow is deliberately
    // NOT pinned here: `classifyVerbClass` has no branch for a plain `deal`,
    // so it reads 'buff-self' — a classification gap reported for a source
    // fix rather than frozen into this contract.
    const cases: Array<[string, string, string]> = [
        // [cardId, expected verbClass, expected effectKind/track]
        ['grey-ward', 'defend', 'none'],            // GUARD
        ['grey-word', 'stat-debuff', 'control'],    // VULNERABLE
    ];

    for (const [id, verbClass, track] of cases) {
        it(`${id} → ${verbClass}/${track} and is reachable via COMBAT_REWARD_POOL`, () => {
            const sourceCard = getCardById(id);
            expect(sourceCard, `${id} must be a real card`).toBeDefined();
            const c = classifyVerbClass(sourceCard!, lookupEffect);
            expect(c.verbClass, id).toBe(verbClass);
            expect(c.track, id).toBe(track);
            const card = toCombatCard(id, getCardById, lookupEffect)!;
            expect(card.bottomDamagePreview).toBeGreaterThanOrEqual(0);
            expect(COMBAT_REWARD_POOL, id).toContain(id);
        });
    }

    it('A Plain Blow previews its printed DEAL and is reachable via COMBAT_REWARD_POOL', () => {
        const card = toCombatCard('grey-strike', getCardById, lookupEffect)!;
        expect(card.bottomDamagePreview).toBe(5);
        expect(COMBAT_REWARD_POOL).toContain('grey-strike');
    });
});
