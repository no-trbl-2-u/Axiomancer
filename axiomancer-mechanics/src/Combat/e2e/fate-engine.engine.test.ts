/**
 * Hermetic E2E — Fate Engine P1 (spec 31 §1): the dice get a second read.
 *
 * Pins every new dice mechanic to exact engine behavior, in real units:
 *   R1 TOLL — every spent die tallies its color; card THRESHOLDS fire free riders
 *   R2 RESERVE — one unspent tray die banks at end of round; banked dice RIPEN
 *      +1 pip per threat phase; pips cash as +1 intensity per pip (status) or
 *      +2 Guard per pip (defend)
 *   R7 COLOR MATCH — a matched die extends the landed status +1 turn
 *   R8 dieId HONORED — a Reserve die id powers the play; a bogus id fizzles
 *
 * D7 (the OFF dice path deleted): every play names its powering die under the
 * shipped spec-33 model. R2's bank-or-burn AT DRAFT, R4 (X dice + the FATE
 * TAP — the rolled tray has no X dice) and R5 (the undrafted omen die) were
 * draft-model mechanics and left with it.
 *
 * spec 32 v3 re-pin: REACT is deleted (REAP/RUPTURE absorb the payoff role);
 * riders carry no chipHp (the strike is dead); fixtures carry rank/cardType.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, resolveThreatPhase,
    endTurn, getCard,
    PIP_INTENSITY_BONUS, PIP_GUARD_BONUS, COLOR_MATCH_STATUS_DURATION_BONUS,
} from '../combat.engine';
import { RESERVE_MAX, RESERVE_PIP_CAP } from '../combat.dice';
import type { ActiveEffect } from '../../Effects/types';
import type { CombatDieColor, CombatEncounterState } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

// Sandbox fixtures isolate each mechanic (the curated library carries them all,
// but a fixture pins the RULE, not any one card's tuning).
registerSandboxCards([
    {
        id: 'qa-threshold-dot', name: 'QA Threshold DoT',
        philosophicalAspect: 'body', description: 'threshold fixture', tier: 1,
        targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 2 }],
        threshold: { color: 'body', count: 1, rider: { conviction: 2, guard: 4 } },
    },
    {
        id: 'qa-guard-card', name: 'QA Guard Card',
        philosophicalAspect: 'heart', description: 'guard fixture', tier: 1,
        targetType: 'self', rank: 1, cardType: 'spell',
        specialMechanics: [{ kind: 'guard', amount: 10 }],
    },
]);

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind', effects: ActiveEffect[] = []): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-fate-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = effects;
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

/** Pins this turn's tray to known-color MANA faces (each may power a paid
 *  line of its color). */
function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c, face: 'mana' as const,
        state: 'available' as const, temporary: false,
    }));
    return { ...state, dice, turn };
}

function open(cards: string[], enemyStance: 'heart' | 'body' | 'mind' = 'body', enemyEffects: ActiveEffect[] = []): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(cards), makeEnemy(500, enemyStance, enemyEffects), cards, 7);
    s = rollEncounterDice(s).state;
    return s;
}

describe('R1 TOLL + thresholds', () => {
    it('spent dice tally their color and a met threshold fires its rider FREE, in real units', () => {
        let s = open(['qa-threshold-dot'], 'body');
        s = setDice(s, ['body', 'heart']);
        const convBefore = s.conviction;
        const guardBefore = s.guard ?? 0;
        const entry = s.hand.find(h => h.cardId === 'qa-threshold-dot')!;
        const res = playCombatCard(s, { uid: entry.uid }, true, s.dice[0].id);
        // The powering body die tallies body 1 ≥ count 1 → rider fires:
        // +2 Conviction, +4 Guard (real units — no chip exists in v3).
        expect(res.state.resonance?.body).toBe(1);
        expect(res.events.some(e => e.kind === 'threshold-fired')).toBe(true);
        expect(res.state.conviction).toBe(Math.min(12, convBefore + 2));
        expect((res.state.guard ?? 0) - guardBefore).toBe(4);
        // The strike is dead: only the bleed will erode HP, later.
        expect(res.state.enemy.health).toBe(500);
    });
});

describe('R2 RESERVE — bank, ripen, cash', () => {
    it('a Reserve die ripens +1 pip per threat phase, capped at RESERVE_PIP_CAP', () => {
        let s = open(['qa-threshold-dot'], 'body');
        s = { ...s, reserve: [{ id: 'bank-1', color: 'body', state: 'available', temporary: false, pips: 0 }] };
        for (let i = 0; i < RESERVE_PIP_CAP + 2; i++) {
            s = resolveThreatPhase(s).state;
            if (s.finalOutcome) break;
        }
        expect(s.reserve?.[0].pips).toBe(RESERVE_PIP_CAP);
    });

    it('pips cash as +PIP_INTENSITY_BONUS intensity per pip on a status play (R8: the dieId is honored)', () => {
        let s = open(['qa-threshold-dot'], 'heart');
        s = setDice(s, ['heart', 'mind']);
        // BODY reserve die — the color law (2026-07-09) demands the powering die
        // match the body card; every spec-33 play lands at read 'none'.
        s = { ...s, reserve: [{ id: 'bank-2', color: 'body', state: 'available', temporary: false, pips: 2 }] };
        const entry = s.hand.find(h => h.cardId === 'qa-threshold-dot')!;
        const res = playCombatCard(s, { uid: entry.uid }, true, 'bank-2');
        const bleed = res.state.enemy.effects.find(e => e.effectId === 'debuff_bleed')!;
        // authored i1 + 2 pips × PIP_INTENSITY_BONUS (no read bonus)
        expect(bleed.intensity).toBe(1 + 2 * PIP_INTENSITY_BONUS);
        expect(res.events.some(e => e.kind === 'pips-cashed')).toBe(true);
        // Spec 33 retired the VARIETY-CHAIN auto-refresh (R9), so the powering
        // Reserve die is spent and leaves the Reserve with its cashed pips.
        expect(res.state.reserve ?? []).toEqual([]);
    });

    it('pips cash as +PIP_GUARD_BONUS Guard per pip on a defend play', () => {
        let s = open(['qa-guard-card'], 'body');
        s = setDice(s, ['body', 'mind']);
        s = { ...s, reserve: [{ id: 'bank-3', color: 'heart', state: 'available', temporary: false, pips: 2 }] };
        const entry = s.hand.find(h => h.cardId === 'qa-guard-card')!;
        const res = playCombatCard(s, { uid: entry.uid }, true, 'bank-3');
        // guard 10 (neutral read ×1, heart die MATCHES the heart card → +3) + 2 pips × 2
        expect(res.state.guard).toBe(10 + 3 + 2 * PIP_GUARD_BONUS);
    });

    it('ONE unspent tray die banks at endTurn while the Reserve has room, else it simply expires', () => {
        let s = open(['qa-threshold-dot'], 'body');
        s = setDice(s, ['heart', 'mind']);
        const banked = endTurn(s).state;
        expect(banked.reserve!.map(d => d.id)).toEqual([s.dice[0].id]); // one die, not both
        expect(banked.reserve![0].pips).toBe(0);

        s = { ...s, reserve: [
            { id: 'r1', color: 'body', state: 'available', temporary: false, pips: 0 },
            { id: 'r2', color: 'mind', state: 'available', temporary: false, pips: 0 },
        ] };
        expect(s.reserve!.length).toBe(RESERVE_MAX);
        const conv = s.conviction;
        s = endTurn(s).state;
        expect(s.reserve!.map(d => d.id)).toEqual(['r1', 'r2']); // full → nothing banks
        expect(s.conviction).toBe(conv);                          // and leftovers earn no ◆
    });
});

describe('R7 COLOR MATCH — +1 turn on status plays', () => {
    it('a matched die extends the landed status by COLOR_MATCH_STATUS_DURATION_BONUS', () => {
        let s = open(['qa-threshold-dot'], 'body'); // body card, body die, body stance (neutral read)
        s = setDice(s, ['body', 'heart']);
        const entry = s.hand.find(h => h.cardId === 'qa-threshold-dot')!;
        const res = playCombatCard(s, { uid: entry.uid }, true, s.dice[0].id);
        const bleed = res.state.enemy.effects.find(e => e.effectId === 'debuff_bleed')!;
        expect(bleed.remainingDuration).toBe(2 + COLOR_MATCH_STATUS_DURATION_BONUS);
    });
});

describe('R8 — a bogus dieId is an explicit fizzle', () => {
    it('fizzles without touching state', () => {
        let s = open(['qa-threshold-dot'], 'body');
        s = setDice(s, ['body', 'heart']);
        const entry = s.hand.find(h => h.cardId === 'qa-threshold-dot')!;
        const res = playCombatCard(s, { uid: entry.uid }, true, 'no-such-die');
        expect(res.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(res.state.enemy.effects.length).toBe(0);
    });
});

describe('the projected card prints its die lines (real units)', () => {
    it('threshold lines appear on profane-canon library cards', () => {
        // the-long-lent: threshold mind×3 → tick every DoT now
        expect(getCard('the-long-lent')!.dieLines?.some(l => l.includes('MIND ×3'))).toBe(true);
        // the-offertory-plate: threshold heart×3 → +2 Souls
        expect(getCard('the-offertory-plate')!.dieLines?.some(l => l.includes('HEART ×3'))).toBe(true);
        expect(getCard('the-offertory-plate')!.dieLines?.some(l => l.includes('Souls'))).toBe(true);
    });
});
