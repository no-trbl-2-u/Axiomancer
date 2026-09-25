/**
 * Hermetic E2E — RECOIL X, the first chosen X-cost (WS7.2, spec 32 §12
 * item 5), LIVE through the HP-model combat engine via `blank-indenture`
 * (Blank Indenture: RECOIL X of your choosing, min 6 → POISON 1 per VITAE
 * paid). Profane-canon rework (2026-08-08): the mechanic's carrier moved from
 * the `chooseX-vein` sandbox set (the-open-vein) into the LIBRARY itself.
 * THE BIG NUMBERS REWRITE (2026-09-02) rescaled the card: min 3 → 6 and
 * poisonPerX 0.5 → 1. The landed stack is still subject to the engine-global
 * `MAX_EFFECT_INTENSITY` ceiling, which bites above X = 10.
 *
 * Pins the engine clamp (X ∈ [min, affordable], affordable = live HP − 1,
 * floored at min), the POISON payoff scaling with the paid X, and the WS7.2
 * non-degeneracy gate: across sim policies the chosen-X distribution must
 * vary (at least two policies' MODAL X differ) — if every temperament maxes
 * X, the picker is dead weight and the ratified fallback is an ALL-spender.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    handCards, recoilXRange,
} from '../combat.engine';
import { COMBAT_SIM_POLICIES } from '../combat.sim-policies';
import { MAX_EFFECT_INTENSITY } from '../../Game/game-mechanics.constants';
import type { CombatDieColor, CombatEncounterState, CombatTransition } from '../combat.encounter.types';

afterEach(() => { vi.restoreAllMocks(); });

const VEIN = 'blank-indenture';
const MIN_X = 6;        // the card's printed minimum (`recoil_x.min`)
const POISON_PER_X = 1; // the card's printed payoff rate (`recoil_x.poisonPerX`)

function makePlayer(cards: string[], effects: ActiveEffect[] = []): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = effects;
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind' = 'heart', effects: ActiveEffect[] = []): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-test-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = effects;
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
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

/** Opens phase-play and forces a single HEART mana die into the tray — the
 *  die every PAID play names (spec 33: a paid line must choose its die; the
 *  color law admits heart for this heart card). */
function openWithHeartDie(player: Character, enemy: Enemy, seed = 7): CombatEncounterState {
    const deck = [VEIN, VEIN, VEIN, VEIN, VEIN];
    let state = initializeCombatEncounter(player, enemy, deck, seed);
    state = rollEncounterDice(state).state;
    return setDice(state, ['heart']);
}

function playVein(state: CombatEncounterState, chosenX?: number): CombatTransition {
    const uid = state.hand.find(h => h.cardId === VEIN)!.uid;
    return playCombatCard(
        state, { uid }, true, state.dice[0].id, undefined,
        chosenX !== undefined ? { chosenX } : undefined,
    );
}

const recoilPaid = (t: CombatTransition): number =>
    (t.events.find(e => e.kind === 'recoil-paid') as { amount: number } | undefined)?.amount ?? 0;

const poisonIntensity = (t: CombatTransition): number =>
    t.state.enemy.effects.find(e => e.effectId === 'debuff_poison')?.intensity ?? 0;

/** Deterministic per-test LCG (never the engine's global stream). */
function lcg(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 2 ** 32;
    };
}

// ── Engine clamp + payoff scaling ────────────────────────────────────────────

describe('RECOIL X — the engine clamps X and scales the POISON payoff', () => {
    it('absent chosenX plays the printed minimum (RECOIL 6 → POISON i6)', () => {
        mockSequentialRng(0.05);
        const state = openWithHeartDie(makePlayer([VEIN]), makeEnemy(400));
        const hpBefore = state.player.health;
        const res = playVein(state);
        expect(recoilPaid(res)).toBe(MIN_X);
        expect(hpBefore - res.state.player.health).toBe(MIN_X);
        expect(poisonIntensity(res)).toBe(Math.ceil(MIN_X * POISON_PER_X)); // 6
    });

    it('clamps a chosenX below the printed minimum up to it', () => {
        mockSequentialRng(0.05);
        const state = openWithHeartDie(makePlayer([VEIN]), makeEnemy(400));
        const res = playVein(state, 1);
        expect(recoilPaid(res)).toBe(MIN_X);
        expect(poisonIntensity(res)).toBe(Math.ceil(MIN_X * POISON_PER_X)); // 6
    });

    it('clamps a greedy chosenX to affordability (live HP − 1) — the play never self-kills', () => {
        mockSequentialRng(0.05);
        let state = openWithHeartDie(makePlayer([VEIN]), makeEnemy(400));
        state = { ...state, player: { ...state.player, health: 10 } };
        expect(recoilXRange(state, { id: VEIN })).toEqual({ min: MIN_X, max: 9 });
        const res = playVein(state, 50);
        expect(recoilPaid(res)).toBe(9);
        expect(res.state.player.health).toBe(1);
        expect(poisonIntensity(res)).toBe(Math.ceil(9 * POISON_PER_X)); // 9
    });

    it('POISON scales with the paid X: ceil(X × poisonPerX) intensity', () => {
        mockSequentialRng(0.05);
        const state = openWithHeartDie(makePlayer([VEIN]), makeEnemy(400));
        const hpBefore = state.player.health;
        const res = playVein(state, 9);
        expect(recoilPaid(res)).toBe(9);
        expect(hpBefore - res.state.player.health).toBe(9);
        expect(poisonIntensity(res)).toBe(Math.ceil(9 * POISON_PER_X));
        // The blood price feeds the spec 32 §12 #4 RECOIL ledger too.
        expect(res.state.recoilPaidThisTurn).toBe(9);
    });

    it('the landed stack still obeys the engine-global intensity ceiling', () => {
        mockSequentialRng(0.05);
        const state = openWithHeartDie(makePlayer([VEIN]), makeEnemy(400));
        const hpBefore = state.player.health;
        // Chosen above the ceiling on purpose, so this exercises the clamp
        // rather than a value that happens to sit under it. (It was 20 when
        // MAX_EFFECT_INTENSITY was 10; the cap rose to 30 in THE BIG NUMBERS
        // REWRITE so that six cards printing THORNS 12-20 stopped lying.)
        const paid = MAX_EFFECT_INTENSITY + 10;
        const res = playVein(state, paid);
        // The blood price is NOT capped — you pay every point you chose …
        expect(recoilPaid(res)).toBe(paid);
        expect(hpBefore - res.state.player.health).toBe(paid);
        // … but a single affliction never stacks past MAX_EFFECT_INTENSITY.
        expect(poisonIntensity(res)).toBe(MAX_EFFECT_INTENSITY);
    });
});

// ── WS7.2 non-degeneracy gate — the chosen-X distribution must vary ─────────

describe('chosen-X non-degeneracy across sim policies (the WS7.2 gate)', () => {
    it('at least two policies have a different MODAL X on the same encounters', () => {
        const probes = ['greedy', 'turtle', 'chaos'] as const;
        const modal: Record<string, number> = {};
        for (const pid of probes) {
            const policy = COMBAT_SIM_POLICIES[pid];
            const paid: number[] = [];
            for (let seed = 1; seed <= 5; seed++) {
                mockSequentialRng(0.05);
                const state = openWithHeartDie(makePlayer([VEIN]), makeEnemy(400), seed);
                const entry = handCards(state).find(h => h.card.id === VEIN)!;
                const range = recoilXRange(state, entry.card)!;
                const x = policy.chooseX
                    ? policy.chooseX(state, entry.card, range, lcg(seed))
                    : range.min;
                paid.push(recoilPaid(playVein(state, x)));
                vi.restoreAllMocks();
            }
            // Modal X = the most frequent ENGINE-PAID amount (post-clamp).
            const counts = new Map<number, number>();
            for (const x of paid) counts.set(x, (counts.get(x) ?? 0) + 1);
            modal[pid] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
        }
        // The gate: if every temperament converged on one X the picker is
        // degenerate (kill it, keep ALL-spenders). Greedy hunts the useful
        // max, turtle the printed min — their modes must differ.
        const distinctModes = new Set(Object.values(modal));
        expect(distinctModes.size).toBeGreaterThanOrEqual(2);
        expect(modal['greedy']).toBeGreaterThan(modal['turtle']);
        expect(modal['turtle']).toBe(MIN_X);
    });
});
