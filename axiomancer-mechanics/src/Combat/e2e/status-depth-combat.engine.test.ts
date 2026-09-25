/**
 * Hermetic E2E — status-depth mechanics, LIVE through the HP-model combat
 * engine, re-pinned to spec 32 v3 (THE STRIKE IS DEAD: no basePower, no chip;
 * compound/amplify/execute are deleted; RUPTURE consumes ALL afflictions and
 * feeds Souls; RIPOSTE fires only on a FULL block).
 *
 * Covers each surviving behavior end to end (DoT-amplification honesty,
 * RUPTURE detonate + cap, DISRUPT deny, THORNS / BARRIER / RIPOSTE / SIPHON),
 * an INVARIANT guard that the shared hot path stays quiet without its marker,
 * and the card-projection / reward-pool contract for the v3 library.
 */

import { describe, it, expect, afterEach, afterAll, beforeAll, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import { getCardById } from '../../Cards/cards.library';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import { lookupEffect } from '../../Effects';
import { effectsLibrary } from '../../Effects/effects.library';
import type { ActiveEffect, Effect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase, processBetweenPhases,
    projectRupture, projectSiphonHeal,
    getDisruptMeter, getEnemyIncomingDamageMultiplier,
} from '../combat.engine';
import { classifyVerbClass, toCombatCard } from '../combat.cards';
import { getActiveDotTotal, getActiveDotAmplifications } from '../effect-modifiers';
import { ruptureBurstCap } from '../effects';
import { COMBAT_REWARD_POOL } from '../combat.rewards';
import type { CombatDieColor, CombatEncounterState, CombatEvent } from '../combat.encounter.types';

afterEach(() => { vi.restoreAllMocks(); });

// Spec 32 v3: no library card carries `siphon` (leeching-syllogism retired), so
// the SIPHON isolation test pairs it with a RUPTURE on a sandbox fixture —
// siphon heals a fraction of the HP the play's PAYOFFS eroded (never a strike;
// basePower no longer exists at the schema level).
registerSandboxCards([
    {
        id: 'qa-siphon-rupture',
        name: 'QA Siphon Rupture (test fixture)',
        philosophicalAspect: 'heart',
        description: 'Test-only fixture: RUPTURE paired with siphon 50%.',
        tier: 2,
        rank: 3,
        cardType: 'spell',
        targetType: 'enemy',
        specialMechanics: [{ kind: 'rupture' }, { kind: 'siphon', pct: 0.5 }],
    },
    {
        // THE BIG NUMBERS REWRITE (2026-09-02): `communion-of-the-worm` is no
        // longer a plain detonator — it prints "Deal 30. PIERCE." AHEAD of its
        // RUPTURE, and that hit fires the damage-instance clock, so part of the
        // fuel is spent (and must not be re-paid) before the burst is priced.
        // The RUPTURE arithmetic itself still needs a card that does nothing
        // else, so here is one.
        id: 'qa-plain-rupture',
        name: 'QA Plain Rupture (test fixture)',
        philosophicalAspect: 'heart',
        description: 'Test-only fixture: RUPTURE and nothing else.',
        tier: 2,
        rank: 3,
        cardType: 'spell',
        targetType: 'enemy',
        specialMechanics: [{ kind: 'rupture' }],
    },
]);

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
    const e = deepClone(GraveLarva);
    e.id = 'enemy-test-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = effects;
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

/** Forces this turn's tray to known colors (deterministic). Spec 33: every
 *  non-X die shows a MANA face; an X die is a dead miss. */
function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c,
        state: c === 'x' ? ('locked' as const) : ('available' as const), temporary: false,
        face: c === 'x' ? ('miss' as const) : ('mana' as const),
    }));
    return { ...state, dice, draftedDieId: null, turn };
}

/** Opens phase-play and forces the tray: die 0 (color `die`) powers paid plays. */
function openWithDie(player: Character, enemy: Enemy, deck: string[], die: CombatDieColor, seed = 7): CombatEncounterState {
    let state = initializeCombatEncounter(player, enemy, deck, seed);
    state = rollEncounterDice(state).state;
    state = setDice(state, [die, 'x']);
    return state;
}

/** PAID play of `cardId` from hand, powered by tray die 0. */
function playPaid(state: CombatEncounterState, cardId: string) {
    return playCombatCard(state, { uid: state.hand.find(h => h.cardId === cardId)!.uid }, true, state.dice[0].id);
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

// ── RUPTURE — consume ALL afflictions, deal the pending total ────────────────

describe('RUPTURE — detonate the foe afflictions for the pending total', () => {
    // A PLAIN rupture card (no bonusPct, no other verb) so
    // `burst === projectRupture` — the projection-honesty invariant. The
    // library's detonator, `communion-of-the-worm`, now spends fuel with its
    // own printed "Deal 30. PIERCE." before it detonates, so it can no longer
    // carry this arithmetic (see the divergence case at the bottom).
    const RUP = 'qa-plain-rupture';
    const LIBRARY_RUP = 'communion-of-the-worm';

    it('strips ALL afflictions, bursts for projectRupture, and yields Souls per instance', () => {
        mockSequentialRng(0.05);
        const enemyEffects = [ae('debuff_poison', 2, 4), ae('debuff_bleed', 1, 4)];
        // HEART die on the heart card (color law); spec 33 lands it printed (×1).
        const state = openWithDie(makePlayer([RUP]), makeEnemy(300, 'heart', enemyEffects), [RUP, RUP, RUP], 'heart');
        const projected = projectRupture(state); // no read under spec 33 → ×1
        // WS3.3 clock fuel: poison RAMPS + Hemorrhage on the card-played
        // clock (2 expected ticks/round): per-round dprs 6,6,9,9 × 2 = 60;
        // bleed i1 DECAYS — exactly one tick of 3. pending = 63.
        expect(projected).toBe(63);

        const hpBefore = state.enemy.health;
        const res = playPaid(state, RUP);
        const det = res.events.find(e => e.kind === 'rupture-detonated') as { amount: number; consumed: string[] } | undefined;
        expect(det).toBeDefined();
        expect(det!.amount).toBe(projected);
        expect(det!.consumed.sort()).toEqual(['debuff_bleed', 'debuff_poison']);
        // ALL afflictions are gone; HP dropped by at least the burst.
        expect(res.state.enemy.effects.some(e => lookupEffect(e.effectId)?.type === 'debuff')).toBe(false);
        expect(hpBefore - res.state.enemy.health).toBeGreaterThanOrEqual(projected);
        // Consumed instances feed the SOUL bank (spec 32 v3 T7).
        expect(res.state.souls ?? 0).toBe(2);
    });

    it('adds a flat burst per NON-DoT affliction stack consumed (marks)', () => {
        mockSequentialRng(0.05);
        const enemyEffects = [ae('debuff_mark', 3, 2)];
        const state = openWithDie(makePlayer([RUP]), makeEnemy(300, 'heart', enemyEffects), [RUP, RUP, RUP], 'heart');
        const res = playPaid(state, RUP);
        const det = res.events.find(e => e.kind === 'rupture-detonated') as { amount: number } | undefined;
        // No DoT fuel; RUPTURE_PER_AFFLICTION_STACK (3) × 3 mark stacks = 9.
        expect(det!.amount).toBe(9);
    });

    // REPEALED 2026-09-02 (L12): the 0.60 × maxHP RUPTURE cap and its
    // pure-fraction/flat-floor arithmetic are gone — payoffs are uncapped and
    // are meant to reach 100-300 in a fed deck. The two cap tests that pinned
    // `round(RUPTURE_CAP_FRACTION × maxHp)` are deleted; what replaces them is
    // the property the repeal asserts.
    it('is UNCAPPED — a huge affliction bank detonates for its whole fuel', () => {
        mockSequentialRng(0.05);
        const enemyEffects = [ae('debuff_poison', 10, 10)];
        const state = openWithDie(makePlayer([RUP]), makeEnemy(900, 'heart', enemyEffects), [RUP, RUP, RUP], 'heart');
        const projected = projectRupture(state);
        const res = playPaid(state, RUP);
        const det = res.events.find(e => e.kind === 'rupture-detonated') as { amount: number } | undefined;
        expect(ruptureBurstCap(900)).toBe(Number.POSITIVE_INFINITY);
        expect(det!.amount).toBe(projected);
        // Well past the retired 0.60 × 900 = 540 ceiling's small-pool sibling:
        // the burst is the fuel, not a fraction of the foe.
        expect(det!.amount).toBeGreaterThan(300);
    });

    /**
     * SUSPECTED PROJECTION BUG (found 2026-09-02, deliberately NOT papered over).
     *
     * `projectRupture` / `projectRuptureBurst` price the burst off the enemy's
     * pre-play affliction bank. `communion-of-the-worm` now prints
     * "Deal 30. PIERCE." BEFORE its RUPTURE, and that hit fires the
     * damage-instance clock, so BLEED ticks out and washes away before the
     * burst is priced. On the standard poison-2/bleed-1 board the card
     * previews 63 and detonates for 40 — a 57% overstatement on the one
     * detonator in the library. The projection selectors are not aware of the
     * card's own pre-payoff verbs.
     *
     * `it.fails` keeps the claim in the suite without a red build: it turns RED
     * the moment the projection is taught about composition, and must be
     * deleted then.
     */
    it.fails('the library detonator\'s preview equals its burst (PROJECTION BUG: its own DEAL spends the fuel first)', () => {
        mockSequentialRng(0.05);
        const enemyEffects = [ae('debuff_poison', 2, 4), ae('debuff_bleed', 1, 4)];
        const state = openWithDie(
            makePlayer([LIBRARY_RUP]), makeEnemy(300, 'heart', enemyEffects),
            [LIBRARY_RUP, LIBRARY_RUP, LIBRARY_RUP], 'heart');
        const projected = projectRupture(state);
        const res = playPaid(state, LIBRARY_RUP);
        const det = res.events.find(e => e.kind === 'rupture-detonated') as { amount: number } | undefined;
        expect(det!.amount).toBe(projected);
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
        const player = makePlayer([], [ae('buff_thorns', 1)]); // reflectDamage 1
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

    it('the v3 buff_thorns card effect reflects 1 per intensity', () => {
        mockSequentialRng(0.05);
        const player = makePlayer([], [ae('buff_thorns', 3, 2)]);
        const base = initializeCombatEncounter(player, makeEnemy(300, 'mind'), undefined, 7);
        const res = resolveThreatPhase(rollEncounterDice(base).state);
        const reflected = res.events.find(e => e.kind === 'thorns-reflected') as { amount: number } | undefined;
        expect(reflected!.amount).toBe(3);
    });
});

// ── BARRIER — stacking, persistent soak (distinct from one-shot GUARD) ────────

describe('BARRIER — a persistent, stacking soak', () => {
    it('a powered Adamant Wall STACKS onto any existing barrier', () => {
        mockSequentialRng(0.05);
        const WALL = 'nothing-crossed-the-ice';
        const state = openWithDie(makePlayer([WALL]), makeEnemy(300, 'mind'), [WALL, WALL, WALL], 'mind');
        const seeded = { ...state, barrier: 10 };
        const res = playPaid(seeded, WALL);
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

    it('a powered Reprisal Bell arms the parry AND grants Guard', () => {
        mockSequentialRng(0.05);
        const MA = 'the-reprisal-bell';
        const state = openWithDie(makePlayer([MA]), makeEnemy(300, 'heart'), [MA, MA, MA], 'heart');
        const res = playPaid(state, MA);
        expect(res.state.riposte).toBeDefined();
        expect(res.state.guard ?? 0).toBeGreaterThan(0);
    });
});

// ── SIPHON — payoff-scaled sustain (no strike exists to skim) ────────────────

describe('SIPHON — heal for part of the HP the payoff eroded', () => {
    it('heals the player for a fraction of the rupture burst', () => {
        mockSequentialRng(0.05);
        const SIP = 'qa-siphon-rupture';
        const player = makePlayer([SIP]);
        player.health = 100; // leave headroom to observe the heal
        const enemyEffects = [ae('debuff_poison', 2, 4)];
        const state = openWithDie(player, makeEnemy(300, 'heart', enemyEffects), [SIP, SIP, SIP], 'heart');
        expect(projectSiphonHeal(state, toCombatCard(SIP, getCardById, lookupEffect)!)).toBeGreaterThan(0);
        const res = playPaid(state, SIP);
        const heal = res.events.find(e => e.kind === 'damage-dealt' && e.target === 'self') as { amount: number } | undefined;
        expect(heal).toBeDefined();
        expect(heal!.amount).toBeLessThan(0);           // negative amount == heal
        expect(res.state.player.health).toBeGreaterThan(100);
    });
});

// ── INVARIANT — the shared hot path is untouched without the new markers ──────

describe('INVARIANT — no new behavior fires without its marker', () => {
    const NEW_KINDS = new Set([
        'rupture-detonated', 'disrupt-denied', 'thorns-reflected',
        'barrier-absorbed', 'riposte-fired', 'backfired', 'reaped', 'staggered',
        'sway-gained', 'soul-gained', 'premise-gained',
    ]);

    it('a plain enemy + plain player emit ZERO new-kind events and un-amplified DoT', () => {
        mockSequentialRng(0.05);
        // One control (roll -3) → below every deny threshold; one ROUND-CLOCKED
        // DoT, no combo. (WS3.3: poison moved to the card-played clock — it no
        // longer ticks at the round boundary, so the round-tick witness here is
        // nettle_sting, the bulwark card-local species: dpr 2, round-end.)
        const enemyEffects = [ae('test_ctrl_knockdown', 1), ae('debuff_nettle_sting', 2)];
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', enemyEffects), undefined, 7);
        const state = rollEncounterDice(base).state;
        const res = resolveThreatPhase(state); // fires threat + processBetweenPhases

        for (const ev of res.events) expect(NEW_KINDS.has(ev.kind), ev.kind).toBe(false);
        expect(res.events.some(e => e.kind === 'dot-tick' && e.effectId === 'vulnerable-surcharge')).toBe(false);
        // nettle_sting i2, round 1, no combo → floor(2×2)=4 exactly.
        const tick = res.events.find(e => e.kind === 'dot-tick' && e.effectId === 'debuff_nettle_sting') as { amount: number } | undefined;
        expect(tick!.amount).toBe(4);
        expect(res.events.some(e => e.kind === 'threat-fired')).toBe(true); // enemy still acts
    });
});

// ── Projection / verbClass / reward-pool contract ────────────────────────────

describe('card projection — the v3 library classifies + advertises sensibly', () => {
    const cases: Array<[string, string, string]> = [
        // [cardId, expected verbClass, expected effectKind/track]
        ['communion-of-the-worm', 'direct-damage', 'none'],   // RUPTURE finisher
        ['miserere', 'direct-damage', 'none'],               // REAP-all finisher
        ['spoiled-poultice', 'direct-dot', 'dot'],
        ['unction-of-boils', 'direct-dot', 'dot'],
        ['scolds-bridle', 'direct-control', 'control'],      // STAGGER
        ['thin-hymn', 'direct-control', 'control'],          // PLEA
        ['chilblain-watch', 'defend', 'none'],
        ['nothing-crossed-the-ice', 'defend', 'none'],
        ['the-untended-garden', 'oath', 'none'],
        ['the-congregation-below', 'hex', 'control'],
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

    it('DoT cards preview their REAL lifetime HP (a longer calendar previews more)', () => {
        const short = toCombatCard('spoiled-poultice', getCardById, lookupEffect)!.bottomDamagePreview;
        const long = toCombatCard('unction-of-boils', getCardById, lookupEffect)!.bottomDamagePreview;
        expect(short).toBeGreaterThan(0);
        // Same POISON i1, twice the calendar (d2 vs d4) — the preview is the
        // real ramped lifetime, so the longer one previews strictly more.
        expect(long).toBeGreaterThan(short);
    });
});
