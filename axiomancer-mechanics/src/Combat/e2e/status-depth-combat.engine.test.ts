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

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import { getCardById } from '../../Cards/cards.library';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import { lookupEffect } from '../../Effects';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, draftStanceDie, playCombatCard,
    resolveThreatPhase, processBetweenPhases,
    projectRupture, projectSiphonHeal,
    getDisruptMeter, getEnemyIncomingDamageMultiplier,
} from '../combat.engine';
import { classifyVerbClass, toCombatCard } from '../combat.cards';
import { getActiveDotTotal, getActiveDotAmplifications } from '../effect-modifiers';
import { RUPTURE_CAP_FRACTION, ruptureBurstCap } from '../effects';
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
        category: 'fallacy',
        philosophicalAspect: 'heart',
        description: 'Test-only fixture: RUPTURE paired with siphon 50%.',
        tier: 2,
        rank: 3,
        cardType: 'spell',
        targetType: 'enemy',
        specialMechanics: [{ kind: 'rupture' }, { kind: 'siphon', pct: 0.5 }],
    },
]);

const ae = (effectId: string, intensity = 1, remainingDuration = 4, tier: 1 | 2 | 3 = 2): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier });

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

// ── AMPLIFICATION surface (Hemorrhage) ───────────────────────────────────────

describe('AMPLIFICATION — the combo registry is surfaced honestly', () => {
    it('poison+bleed dot-ticks SUM to the real HP lost and report the Hemorrhage combo', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const enemyEffects = [ae('debuff_poison', 2), ae('debuff_bleed', 1)];
        const res = processBetweenPhases({ ...base, enemy: { ...base.enemy, effects: enemyEffects } });
        const lost = 300 - res.state.enemy.health;
        // v3: poison start floor(2×2×1.5)=6 (Hemorrhage) + bleed end floor(3×1)=3.
        expect(lost).toBe(9);
        expect(enemyDotSum(res.events)).toBe(lost);  // honesty: emitted == landed

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
    // A PLAIN rupture card (no bonusPct) so `burst === projectRupture` — the
    // projection-honesty invariant. (resonance-detonation/the-overtake carry a
    // deliberate bonusPct amplifier and would burst ABOVE the pending total.)
    const RUP = 'peroratio-interrupta';

    it('strips ALL afflictions, bursts for projectRupture, and yields Souls per instance', () => {
        mockSequentialRng(0.05);
        const enemyEffects = [ae('debuff_poison', 2, 4), ae('debuff_bleed', 1, 4)];
        // MIND die on the mind card (color law) vs a mind foe → neutral read ×1.
        const state = openAndDraft(makePlayer([RUP]), makeEnemy(300, 'mind', enemyEffects), [RUP, RUP, RUP], 'mind');
        const projected = projectRupture(state); // neutral read (mind die vs mind) → ×1
        // v3 poison RAMPS + Hemorrhage: ticks 6,6,9,9 = 30; bleed i1 DECAYS —
        // exactly one tick of 3. pending = 33.
        expect(projected).toBe(33);

        const hpBefore = state.enemy.health;
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === RUP)!.uid }, true);
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
        const state = openAndDraft(makePlayer([RUP]), makeEnemy(300, 'mind', enemyEffects), [RUP, RUP, RUP], 'mind');
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === RUP)!.uid }, true);
        const det = res.events.find(e => e.kind === 'rupture-detonated') as { amount: number } | undefined;
        // No DoT fuel; RUPTURE_PER_AFFLICTION_STACK (3) × 3 mark stacks = 9.
        expect(det!.amount).toBe(9);
    });

    it('respects the PURE-FRACTION burst cap on a huge DoT stack (big enemy → cap grows)', () => {
        // WS7.1 (spec 32 §12 item 5): the cap is a pure fraction of enemy max
        // HP — round(F × maxHp), no flat floor.
        mockSequentialRng(0.05);
        const enemyEffects = [ae('debuff_poison', 10, 10)];
        const state = openAndDraft(makePlayer([RUP]), makeEnemy(900, 'mind', enemyEffects), [RUP, RUP, RUP], 'mind');
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === RUP)!.uid }, true);
        const det = res.events.find(e => e.kind === 'rupture-detonated') as { amount: number } | undefined;
        expect(ruptureBurstCap(900)).toBe(Math.round(RUPTURE_CAP_FRACTION * 900));
        expect(det!.amount).toBe(ruptureBurstCap(900));
    });

    it('the cap is a pure fraction on a small enemy too — the flat floor is retired (WS7.1)', () => {
        mockSequentialRng(0.05);
        const enemyEffects = [ae('debuff_poison', 10, 10)];
        const state = openAndDraft(makePlayer([RUP]), makeEnemy(300, 'mind', enemyEffects), [RUP, RUP, RUP], 'mind');
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === RUP)!.uid }, true);
        const det = res.events.find(e => e.kind === 'rupture-detonated') as { amount: number } | undefined;
        // No floor term: round(F × 300), full stop. Against truly small pools
        // (~100 HP) the fraction lands BELOW the retired 80-HP floor — that
        // early-cap drop is the ratified trade; the sweep raises F, never
        // re-adds a floor.
        expect(ruptureBurstCap(300)).toBe(Math.round(RUPTURE_CAP_FRACTION * 300));
        expect(ruptureBurstCap(100)).toBeLessThan(80); // the retired floor no longer props tiny pools
        expect(det!.amount).toBe(ruptureBurstCap(300));
    });
});

// ── DISRUPT — distinct-control deny meter ────────────────────────────────────

describe('DISRUPT — a variety of control SURFACES denies the telegraphed turn (WS8.3)', () => {
    // Support-tagged (non-card) controls carried by enemy threats / legacy
    // sources — each on a DIFFERENT surface (spec 32 §12 #6):
    //   daze → roll (-3), root → stance (lockedStance),
    //   blind → rider-suppress (suppressesThreatRiders).
    const twoSurfaces = () => [ae('debuff_daze', 1), ae('debuff_root', 1)];
    const threeSurfaces = () => [...twoSurfaces(), ae('debuff_blind', 1)];

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
        // daze -3 + slow -2 + straw_man_echo -1 = penalty 6 < 8, all 'roll'.
        const sameGrip = [ae('debuff_daze', 1), ae('debuff_slow', 1), ae('debuff_straw_man_echo', 1)];
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
        const WALL = 'the-adamant-wall';
        const state = openAndDraft(makePlayer([WALL]), makeEnemy(300, 'body'), [WALL, WALL, WALL], 'body');
        const seeded = { ...state, barrier: 10 };
        const res = playCombatCard(seeded, { uid: seeded.hand.find(h => h.cardId === WALL)!.uid }, true);
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

    it('does NOT fire when the hit lands (no full block)', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const armed = { ...rollEncounterDice(deepClone(base)).state, riposte: { damage: 8, reduce: 0 } };
        const res = resolveThreatPhase(armed);
        expect(res.state.player.health).toBeLessThan(200);          // the hit landed
        expect(res.events.some(e => e.kind === 'riposte-fired')).toBe(false);
        expect(res.state.riposte).toBeUndefined();                  // still clears
    });

    it('a powered Measured Answer arms the parry AND grants Guard', () => {
        mockSequentialRng(0.05);
        const MA = 'measured-answer';
        const state = openAndDraft(makePlayer([MA]), makeEnemy(300, 'body'), [MA, MA, MA], 'body');
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === MA)!.uid }, true);
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
        const state = openAndDraft(player, makeEnemy(300, 'heart', enemyEffects), [SIP, SIP, SIP], 'heart');
        expect(projectSiphonHeal(state, toCombatCard(SIP, getCardById, lookupEffect)!)).toBeGreaterThan(0);
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === SIP)!.uid }, true);
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
        // One control (roll -3) → below every deny threshold; one poison DoT, no combo.
        const enemyEffects = [ae('debuff_daze', 1), ae('debuff_poison', 2)];
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', enemyEffects), undefined, 7);
        const state = rollEncounterDice(base).state;
        const res = resolveThreatPhase(state); // fires threat + processBetweenPhases

        for (const ev of res.events) expect(NEW_KINDS.has(ev.kind), ev.kind).toBe(false);
        expect(res.events.some(e => e.kind === 'dot-tick' && e.effectId === 'vulnerable-surcharge')).toBe(false);
        // v3 poison i2, round 1, no combo → floor(2×2)=4 exactly.
        const tick = res.events.find(e => e.kind === 'dot-tick' && e.effectId === 'debuff_poison') as { amount: number } | undefined;
        expect(tick!.amount).toBe(4);
        expect(res.events.some(e => e.kind === 'threat-fired')).toBe(true); // enemy still acts
    });
});

// ── Projection / verbClass / reward-pool contract ────────────────────────────

describe('card projection — the v3 library classifies + advertises sensibly', () => {
    const cases: Array<[string, string, string]> = [
        // [cardId, expected verbClass, expected effectKind/track]
        ['resonance-detonation', 'direct-damage', 'none'],   // RUPTURE finisher
        ['the-reaping', 'direct-damage', 'none'],            // REAP-all finisher
        ['slippery-slope', 'direct-dot', 'dot'],
        ['sweet-poison', 'direct-dot', 'dot'],
        ['zenos-half-step', 'direct-control', 'control'],    // STAGGER
        ['paralysis-of-analysis', 'direct-control', 'control'],
        ['soft-word', 'direct-control', 'control'],          // SWAY
        ['brace-for-impact', 'defend', 'none'],
        ['the-adamant-wall', 'defend', 'none'],
        ['venom-and-vein', 'enchant', 'none'],
        ['suppurating-curse', 'disenchant', 'control'],
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

    it('DoT cards preview their REAL lifetime HP (slippery-slope prints "2,2,3,3 = 10")', () => {
        expect(toCombatCard('slippery-slope', getCardById, lookupEffect)!.bottomDamagePreview).toBe(10);
        expect(toCombatCard('sweet-poison', getCardById, lookupEffect)!.bottomDamagePreview).toBeGreaterThan(0);
    });
});
