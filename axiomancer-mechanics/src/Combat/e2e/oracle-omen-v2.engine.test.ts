/**
 * Hermetic E2E — Phase 32 part 4d (Oracle — OMEN v2,
 * plan/phases/phase_32_theme_deep_work.md §Part 4d).
 *
 * OMEN v2 turns the pre-existing OMEN mechanic (spec 32 v3 T6) from a
 * silent lookup — the prediction fell out of whichever die powered the
 * card, defaulting to HEART — into a real bet: the player STAKES a stance
 * and a window (how many phase boundaries the claim gets re-checked
 * before it expires). A narrower claim (window 1, the boldest, single-
 * boundary bet) pays the FULL printed rider; a wider hedge (up to the
 * card's printed `maxWindow`) gets more tries but both its Conviction
 * ante and its rider payoff scale down by 1/window. The ante is paid UP
 * FRONT at cast (clamped to what the player can afford) and is NEVER
 * refunded on a miss — the felt cost a lookup never had.
 *
 * Covers:
 *   1. Cast-time CLAIM: absent `omenClaim` falls back to window 1 and the
 *      pre-v2 die-derived stance (byte-compatible default); an explicit
 *      claim overrides BOTH the stance (even one that matches neither the
 *      powering die nor the card's own stance) and the window (clamped to
 *      the card's printed `maxWindow`).
 *   2. Ante: paid up front, clamped to available Conviction (never
 *      negative), scales down 1/window, never refunded on a miss.
 *   3. HIT scaling: window 1 fires the full printed rider; window 2 fires
 *      exactly half.
 *   4. MISS: a wider claim that misses a boundary stays pending (not yet
 *      expired) and gets re-checked at the NEXT boundary; only exhausting
 *      the window is a final miss (`expired: true`).
 *   5. Edge case: a claim outstanding past the encounter's last distinct
 *      phase (the terminal phase loops) resolves without crashing.
 *   6. `fated-course` still forces a guaranteed hit (binds the first
 *      pending claim) and `the-oracles-eye`'s ×1.5 compounds on top of the
 *      claim's own scale.
 *   7. A full `COMBAT_SIM_POLICY_ORDER` × seed sweep on the `augury`
 *      preset deck runs without crashing.
 *
 * Fixture/RNG conventions follow `themed-decks.engine.test.ts`'s OMEN
 * describe block (`makePlayer`/`makeEnemy`/`setDice`/`customPhases`,
 * `mockSequentialRng`, `vi.restoreAllMocks()` in `afterEach`).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, draftStanceDie,
    resolveThreatPhase,
} from '../combat.engine';
import { runOneEncounter } from '../combat.encounter.sim';
import { COMBAT_SIM_POLICY_ORDER } from '../combat.sim-policies';
import { buildPresetDeck } from '../combat.starter-deck-presets';
import type { Stance } from '../types';
import type {
    CombatDieColor, CombatEncounterState, CombatEvent, CombatThreatPhase,
} from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

function findEvent<K extends CombatEvent['kind']>(events: CombatEvent[], kind: K): Extract<CombatEvent, { kind: K }> | undefined {
    return events.find((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}
function findEvents<K extends CombatEvent['kind']>(events: CombatEvent[], kind: K): Extract<CombatEvent, { kind: K }>[] {
    return events.filter((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    return p;
}

function makeEnemy(hp: number, stance: Stance = 'mind'): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-omen-v2-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = [];
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
    const floating = state.dice.filter(d => d.floating);
    return { ...state, dice: [...dice, ...floating], draftedDieId: null, turn };
}

/** One-shot custom threat phases (controlled stances). */
function customPhases(stances: Stance[], damage = 6): CombatThreatPhase[] {
    return stances.map((s, i) => ({
        index: i + 1, enemyStance: s, isFinalPhase: i === stances.length - 1,
        threatAction: { description: 'omen probe', effects: [{ damage }] },
    }));
}

function withPhases(state: CombatEncounterState, stances: Stance[]): CombatEncounterState {
    return {
        ...state,
        threatPhases: customPhases(stances),
        threatMarks: stances.map(() => 'pending' as const),
        currentPhaseIndex: 0,
    };
}

/** Builds a fresh combat with `cardId` in hand, powered by a die of `dieColor`. */
function build(cardId: string, dieColor: CombatDieColor, conviction = 0): CombatEncounterState {
    let state = initializeCombatEncounter(
        makePlayer([cardId]), makeEnemy(300, 'mind'),
        [cardId, cardId, cardId, cardId, cardId], 7);
    state = rollEncounterDice(state).state;
    state = setDice(state, [dieColor, 'x']);
    state = draftStanceDie(state, state.dice[0].id).state;
    return { ...state, conviction };
}

type OmenClaim = { chosenX?: number; reprisalCardId?: string; omenClaim?: { stance: Stance; window: number } };

function playFromHand(state: CombatEncounterState, cardId: string, play?: OmenClaim) {
    const entry = state.hand.find(h => h.cardId === cardId);
    expect(entry, `${cardId} should be in hand`).toBeDefined();
    return playCombatCard(state, { uid: entry!.uid }, true, undefined, undefined, play);
}

const SOP = 'signs-and-portents'; // OMEN: window ≤2, ante 2, rider draw 2 (heart)
const CB = 'cassandras-burden';   // OMEN: window ≤2, ante 2, rider guard 4 (heart)

describe('OMEN v2 — cast-time claim', () => {
    it('absent omenClaim falls back to window 1 and the pre-v2 die-derived stance', () => {
        mockSequentialRng(0.5);
        const state = build(SOP, 'heart', 5);
        const played = playFromHand(state, SOP); // no omenClaim
        const declared = findEvent(played.events, 'omen-declared');
        expect(declared).toBeDefined();
        expect(declared!.stance).toBe('heart'); // the heart powering die
        expect(declared!.window).toBe(1);
        expect(declared!.ante).toBe(2); // full printed ante at window 1
        expect(played.state.conviction).toBe(3); // 5 - 2
    });

    it('an explicit claim overrides the stance even against BOTH the die color and the card\'s own stance', () => {
        mockSequentialRng(0.5);
        const state = build(SOP, 'heart', 5); // heart die powers a heart card
        const played = playFromHand(state, SOP, { omenClaim: { stance: 'mind', window: 1 } });
        const declared = findEvent(played.events, 'omen-declared');
        expect(declared!.stance).toBe('mind'); // neither the die's nor the card's own color
    });

    it('a requested window beyond the printed maxWindow clamps down', () => {
        mockSequentialRng(0.5);
        const state = build(SOP, 'heart', 10);
        const played = playFromHand(state, SOP, { omenClaim: { stance: 'heart', window: 99 } });
        const declared = findEvent(played.events, 'omen-declared');
        expect(declared!.window).toBe(2); // signs-and-portents' printed maxWindow
    });

    it('the ante clamps to available Conviction — never negative, never blocks the play', () => {
        mockSequentialRng(0.5);
        const state = build(SOP, 'heart', 0); // broke
        const played = playFromHand(state, SOP);
        expect(played.events.some(e => e.kind === 'effect-fizzled')).toBe(false);
        const declared = findEvent(played.events, 'omen-declared');
        expect(declared!.ante).toBe(0);
        expect(played.state.conviction).toBe(0);
    });

    it('a wider claim halves the ante (1/window, rounded up)', () => {
        mockSequentialRng(0.5);
        const state = build(SOP, 'heart', 5);
        const played = playFromHand(state, SOP, { omenClaim: { stance: 'heart', window: 2 } });
        const declared = findEvent(played.events, 'omen-declared');
        expect(declared!.ante).toBe(1); // ceil(2 * 0.5)
        expect(played.state.conviction).toBe(4);
    });
});

describe('OMEN v2 — HIT scaling by claim size (cassandras-burden, Guard rider)', () => {
    it('window 1 (the boldest claim) fires the FULL printed Guard 4', () => {
        mockSequentialRng(0.5);
        let state = build(CB, 'heart', 5);
        state = withPhases(state, ['mind', 'heart']); // next phase: HEART
        const played = playFromHand(state, CB, { omenClaim: { stance: 'heart', window: 1 } });
        const res = resolveThreatPhase(played.state);
        expect(res.events.some(e => e.kind === 'omen-hit')).toBe(true);
        expect(res.state.guard ?? 0).toBe(4);
        expect(res.state.omenHits).toBe(1);
        expect(res.state.pendingOmens).toEqual([]);
    });

    it('window 2 (a hedge) fires exactly HALF the printed Guard', () => {
        mockSequentialRng(0.5);
        let state = build(CB, 'heart', 5);
        state = withPhases(state, ['mind', 'heart']); // hits on the very first check
        const played = playFromHand(state, CB, { omenClaim: { stance: 'heart', window: 2 } });
        const res = resolveThreatPhase(played.state);
        expect(res.events.some(e => e.kind === 'omen-hit')).toBe(true);
        expect(res.state.guard ?? 0).toBe(2); // ceil(4 * 0.5)
        expect(res.state.omenHits).toBe(1);
    });
});

describe('OMEN v2 — MISS: a wider claim stays pending until the window expires', () => {
    it('a window-2 claim that misses the first boundary stays pending (expired: false) and re-checks the next', () => {
        mockSequentialRng(0.5);
        let state = build(CB, 'heart', 5);
        // Two DISTINCT non-heart phases: the claim (HEART) misses at both.
        state = withPhases(state, ['body', 'body', 'mind']);
        const played = playFromHand(state, CB, { omenClaim: { stance: 'heart', window: 2 } });
        expect(played.state.conviction).toBe(4); // ante already spent at cast — ceil(2*0.5)=1

        const first = resolveThreatPhase(played.state);
        const firstMiss = findEvent(first.events, 'omen-missed');
        expect(firstMiss).toBeDefined();
        expect(firstMiss!.expired).toBe(false);
        expect(first.state.pendingOmens).toHaveLength(1); // still alive, one try left
        expect(first.state.guard ?? 0).toBe(0); // no payoff yet

        const second = resolveThreatPhase(first.state);
        const secondMiss = findEvent(second.events, 'omen-missed');
        expect(secondMiss).toBeDefined();
        expect(secondMiss!.expired).toBe(true); // window exhausted — final miss
        expect(second.state.pendingOmens).toEqual([]);
        expect(second.state.guard ?? 0).toBe(0);
        expect(second.state.omenHits).toBe(0);
        // The ante is gone for good — never refunded on a miss.
        expect(second.state.conviction).toBe(4);
    });

    it('a window-2 claim that misses boundary 1 but hits boundary 2 still pays the scaled reward', () => {
        mockSequentialRng(0.5);
        let state = build(CB, 'heart', 5);
        state = withPhases(state, ['mind', 'body', 'heart']); // miss, then HIT
        const played = playFromHand(state, CB, { omenClaim: { stance: 'heart', window: 2 } });

        const first = resolveThreatPhase(played.state);
        expect(findEvents(first.events, 'omen-hit')).toHaveLength(0);
        expect(first.state.pendingOmens).toHaveLength(1);

        const second = resolveThreatPhase(first.state);
        expect(second.events.some(e => e.kind === 'omen-hit')).toBe(true);
        expect(second.state.guard ?? 0).toBe(2); // the scaled (window-2) payoff, not the full 4
        expect(second.state.omenHits).toBe(1);
        expect(second.state.pendingOmens).toEqual([]);
    });
});

describe('OMEN v2 — edge cases', () => {
    it('a claim outstanding past the encounter\'s last distinct phase resolves without crashing (the terminal phase loops)', () => {
        mockSequentialRng(0.5);
        let state = build(CB, 'heart', 5);
        // Only ONE real future phase exists; currentPhaseIndex clamps to it
        // and stays there (the "final phase loops" behavior) for every
        // further resolveThreatPhase call.
        state = withPhases(state, ['mind', 'body']); // next phase stays BODY forever
        const played = playFromHand(state, CB, { omenClaim: { stance: 'heart', window: 2 } });

        let s = played.state;
        for (let i = 0; i < 4; i++) {
            expect(() => { s = resolveThreatPhase(s).state; }).not.toThrow();
        }
        // The claim (HEART) never matches BODY — it expires after exactly 2
        // tries (not 4), and the fight keeps going without error.
        expect(s.pendingOmens).toEqual([]);
        expect(s.omenHits).toBe(0);
    });
});

describe('OMEN v2 — fated-course + the-oracles-eye synergy', () => {
    it('fated-course forces the telegraph to match the pending claim (guaranteed hit) and still MARKs the foe', () => {
        mockSequentialRng(0.5);
        let state = build(CB, 'heart', 5);
        state = withPhases(state, ['mind', 'body']); // next phase would be BODY — a claimed miss...
        state = { ...state, enemyAttachments: ['fated-course'] };
        const played = playFromHand(state, CB, { omenClaim: { stance: 'heart', window: 1 } });
        const res = resolveThreatPhase(played.state);
        // ...but fated-course forces it to HEART, so the "impossible" claim hits.
        expect(res.events.some(e => e.kind === 'omen-hit')).toBe(true);
        const markStack = res.state.enemy.effects.find(e => e.effectId === 'debuff_mark');
        expect(markStack).toBeDefined();
    });

    it("the-oracles-eye's ×1.5 compounds on top of the claim's own 1/window scale", () => {
        mockSequentialRng(0.5);
        let state = build(CB, 'heart', 5);
        state = withPhases(state, ['mind', 'heart']);
        state = { ...state, persistentZone: ['the-oracles-eye'] };
        const played = playFromHand(state, CB, { omenClaim: { stance: 'heart', window: 2 } });
        const res = resolveThreatPhase(played.state);
        // base 4 × claimScale 0.5 × eye 1.5 = 3 (ceil).
        expect(res.state.guard ?? 0).toBe(3);
    });
});

describe('OMEN v2 — per-combat / sim sweep', () => {
    it('sim policies never crash across every policy and seed (Augury deck, OMEN v2 live)', () => {
        const auguryDeck = buildPresetDeck('augury');
        expect(auguryDeck.length).toBeGreaterThan(0);
        expect(auguryDeck).toContain(SOP);

        function makeSimPlayer(): Character {
            const p = deepClone(Player);
            p.knownCards = auguryDeck.slice();
            return p;
        }

        for (const policy of COMBAT_SIM_POLICY_ORDER) {
            for (const seed of [1, 2, 3, 11]) {
                const p = makeSimPlayer();
                const e = deepClone(GraveLarva);
                const run = runOneEncounter(p, e, seed, policy, { deck: auguryDeck });
                expect(run.outcome).toBeDefined();
            }
        }
    });
});
