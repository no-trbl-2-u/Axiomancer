/**
 * Hermetic E2E — the Profane Canon's NEW mechanics (2026-08-08 rework), LIVE
 * through the HP-model combat engine:
 *
 *   1. IMMOLATE — burn the lowest-rank other cards in hand as a printed cost
 *      (they leave the combat entirely — hand, discard, AND deck cycle), then
 *      the rider fires; with nothing to burn, the rider fizzles.
 *   2. PURGE — a curse card exiles itself from the combat when played (never
 *      enters the discard; its deck-cycle instance is struck).
 *   3. REQUIEM — the discard-size state predicate gates a free rider.
 *   4. CURSE INJECTION — an enemy threat action shuffles a curse card into
 *      the player's combat deck cycle (deck + draw pile; collection untouched).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase,
} from '../combat.engine';
import type {
    CombatDieColor, CombatEncounterState, CombatThreatPhase, CombatTransition,
} from '../combat.encounter.types';

afterEach(() => { vi.restoreAllMocks(); });

const DISTRAINT = 'distraint';            // IMMOLATE 2 → Deal 26 + GUARD 24 (body)
const IMMOLATE_COUNT = 2;                 // distraint's printed pyre size
const POULTICE = 'spoiled-poultice';      // rank 1 — the expected pyre fuel
const CURSE = 'mouthful-of-brine';        // PURGE carrier (body)
const DIRGE = 'dirge-for-the-disinterred'; // REQUIEM 14 carrier (mind)
const REQUIEM_GATE = 14;                  // dirge's printed discard gate

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = [...new Set(cards)];
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    return p;
}

function makeEnemy(hp: number): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-test-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = [];
    return e;
}

/** Forces this turn's tray to known colors, every die on its mana face. */
function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c, state: 'available' as const, temporary: false, face: 'mana' as const,
    }));
    return { ...state, dice, turn };
}

/** Opens phase-play with a single mana die of `dieColor` in the tray — the
 *  die `play` names to power the PAID line (spec 33: no implicit default). */
function openWithDie(deck: string[], dieColor: CombatDieColor, seed = 7): CombatEncounterState {
    let state = initializeCombatEncounter(makePlayer(deck), makeEnemy(400), deck, seed);
    state = rollEncounterDice(state).state;
    return setDice(state, [dieColor]);
}

function play(state: CombatEncounterState, cardId: string): CombatTransition {
    const uid = state.hand.find(h => h.cardId === cardId)!.uid;
    return playCombatCard(state, { uid }, true, state.dice[0].id);
}

const countIn = (ids: readonly string[], id: string): number =>
    ids.filter(x => x === id).length;

describe('IMMOLATE — the pyre must be fed', () => {
    it('burns the lowest-rank other cards from hand and the deck cycle, then fires the rider', () => {
        mockSequentialRng(0.05);
        const deck = [DISTRAINT, POULTICE, POULTICE, POULTICE, POULTICE];
        const state = openWithDie(deck, 'body');
        const handPoultices = countIn(state.hand.map(h => h.cardId), POULTICE);
        expect(handPoultices).toBeGreaterThanOrEqual(IMMOLATE_COUNT);
        const deckPoultices = countIn(state.deck, POULTICE);
        const enemyHpBefore = state.enemy.health;

        const res = play(state, DISTRAINT);
        // The rider's damage half lands here too (see the regression guard
        // below for why that is worth stating twice).
        expect(res.state.enemy.health).toBeLessThan(enemyHpBefore);
        const burned = res.events.find(e => e.kind === 'immolated');
        expect(burned).toBeDefined();
        // BIG NUMBERS (2026-09-02): distraint prints IMMOLATE 2, so the pyre
        // takes two — the printed count is the applied count.
        expect((burned as { burned: string[] }).burned)
            .toEqual(Array.from({ length: IMMOLATE_COUNT }, () => POULTICE));
        // The burned cards left the combat entirely: fewer in hand than a plain
        // discard would leave, never in the discard pile, and their deck-cycle
        // instances are struck (no reshuffle resurrection).
        expect(countIn(res.state.hand.map(h => h.cardId), POULTICE)).toBe(handPoultices - IMMOLATE_COUNT);
        expect(res.state.discard).not.toContain(POULTICE);
        expect(countIn(res.state.deck, POULTICE)).toBe(deckPoultices - IMMOLATE_COUNT);
        // The rider fired: GUARD 24 rose.
        expect(res.state.guard ?? 0).toBeGreaterThan(0);
    });

    /**
     * REGRESSION GUARD — the two-rider-executor bug (found and fixed 2026-09-02).
     *
     * `distraint` prints "IMMOLATE 2: burn the 2 lowest cards in your hand,
     * then deal 26 and gain GUARD 24". The GUARD landed; the 26 did not.
     *
     * Cause: `combat.engine.ts` has TWO rider executors. `applyRiderToState`
     * (the FREE-line / state-rider path) was taught THE BIG NUMBERS damage
     * family — it reads `r.damage` / `r.pierce` / `r.wrath` / `r.chain` /
     * `r.flay`. The PAID-line executor — `for (const r of firedRiders)` inside
     * `playBottomAction` — was not: it handles guard / conviction / applyEffect
     * / healHp / drawCards / premises / … and silently drops the whole damage
     * family. Every PAID-line rider that carries `damage` (immolate, fallen,
     * fate, dieBonus, synergy/REQUIEM, overflow — 20 cards across debt, grave,
     * trial and vigil) prints a number the engine never applies.
     *
     * FIXED 2026-09-02 — the PAID executor now reads the damage family too.
     * This stands as the regression guard: any new rider verb must be added to
     * BOTH executors, and this is what catches forgetting the second one.
     */
    it('IMMOLATE\'s rider deals its printed damage on the PAID line too', () => {
        mockSequentialRng(0.05);
        const deck = [DISTRAINT, POULTICE, POULTICE, POULTICE, POULTICE];
        const state = openWithDie(deck, 'body');
        const hpBefore = state.enemy.health;
        const res = play(state, DISTRAINT);
        expect(res.events.some(e => e.kind === 'immolated')).toBe(true);
        expect(res.state.enemy.health).toBeLessThan(hpBefore);
    });

    it('fizzles the rider when nothing else is in hand to burn', () => {
        mockSequentialRng(0.05);
        const deck = [DISTRAINT];
        let state = openWithDie(deck, 'body');
        // The engine pads a short deck with copies — strip the hand down to
        // the single played card so the pyre genuinely has no fuel.
        state = { ...state, hand: [state.hand.find(h => h.cardId === DISTRAINT)!] };
        const hpBefore = state.enemy.health;
        const res = play(state, DISTRAINT);
        expect(res.events.some(e => e.kind === 'immolated')).toBe(false);
        expect(res.events.some(e => e.kind === 'effect-fizzled'
            && (e as { message?: string }).message === 'nothing in hand to burn')).toBe(true);
        // No rider: the pyre was never fed, so neither the damage nor the guard lands.
        expect(res.state.enemy.health).toBe(hpBefore);
        expect(res.state.guard ?? 0).toBe(0);
    });
});

describe('PURGE — the curse buys itself out', () => {
    it('playing a curse exiles it from hand, discard, and the deck cycle', () => {
        mockSequentialRng(0.05);
        const deck = [CURSE, POULTICE, POULTICE, POULTICE, POULTICE];
        const state = openWithDie(deck, 'body');
        const res = play(state, CURSE);
        expect(res.events.some(e => e.kind === 'purged')).toBe(true);
        expect(res.state.hand.map(h => h.cardId)).not.toContain(CURSE);
        expect(res.state.discard).not.toContain(CURSE);
        expect(res.state.deck).not.toContain(CURSE);
    });
});

describe('REQUIEM — the dead remember', () => {
    it('fires the gated rider only while the discard pile holds n+ cards', () => {
        mockSequentialRng(0.05);
        const deck = [DIRGE, POULTICE, POULTICE, POULTICE, POULTICE];

        // Below the gate: no requiem rider.
        const cold = play(openWithDie(deck, 'mind'), DIRGE);
        expect(cold.events.some(e => e.kind === 'die-bonus-fired'
            && (e as { riderText?: string }).riderText?.includes('REQUIEM'))).toBe(false);

        // At the gate (REQUIEM_GATE in the discard): the rider fires free.
        let state = openWithDie(deck, 'mind');
        state = { ...state, discard: Array.from({ length: REQUIEM_GATE }, () => POULTICE) };
        const warm = play(state, DIRGE);
        expect(warm.events.some(e => e.kind === 'die-bonus-fired'
            && (e as { riderText?: string }).riderText?.includes('REQUIEM'))).toBe(true);
    });
});

describe('CURSE INJECTION — the enemy hexes your deck', () => {
    it('a landed threat shuffles the curse into deck and draw pile (combat-scoped)', () => {
        mockSequentialRng(0.05);
        const deck = [POULTICE, POULTICE, POULTICE, POULTICE, POULTICE, POULTICE, POULTICE];
        let state = openWithDie(deck, 'body');
        const phase: CombatThreatPhase = {
            ...state.threatPhases[state.currentPhaseIndex],
            threatAction: {
                description: 'The tide files a claim (hexes a curse into your deck).',
                effects: [{ damage: 3 }, { curseCardId: CURSE }],
            },
        };
        state = {
            ...state,
            threatPhases: state.threatPhases.map((p, i) =>
                i === state.currentPhaseIndex ? phase : p),
        };
        const before = countIn(state.deck, CURSE);
        expect(before).toBe(0);

        const res = resolveThreatPhase(state);
        expect(res.events.some(e => e.kind === 'curse-injected')).toBe(true);
        expect(countIn(res.state.deck, CURSE)).toBe(1);
        // The curse is somewhere in the live cycle (draw pile, or the hand
        // after the boundary refill) — never silently dropped.
        const inCycle = countIn(res.state.drawPile, CURSE)
            + countIn(res.state.hand.map(h => h.cardId), CURSE)
            + countIn(res.state.discard, CURSE);
        expect(inCycle).toBe(1);
        // The persistent collection is untouched.
        expect(res.state.player.knownCards).not.toContain(CURSE);
    });
});
