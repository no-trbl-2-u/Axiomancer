/**
 * Hermetic E2E — Fate Engine: the dice get a second read.
 *
 * Pins every new dice mechanic to exact engine behavior, in real units:
 *   R1 TOLL — every spent die tallies its color; card THRESHOLDS fire free riders
 *   R2 RESERVE — one unspent tray die banks at end of round; banked dice RIPEN
 *      +1 pip per threat phase; pips cash as +1 intensity per pip (status) or
 *      +2 Guard per pip (defend)
 *   R7 COLOR MATCH — a matched die extends the landed status +1 turn
 *   R8 dieId HONORED — a Reserve die id powers the play; a bogus id fizzles
 *
 * Every play names its powering die. Riders carry no chipHp; fixtures carry
 * rank/cardType.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { FloatEye } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, resolveThreatPhase,
    endTurn,
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
        id: 'qa-bleed-card', name: 'QA Bleed Card',
        color: 'body', description: 'status fixture', tier: 1,
        targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    },
    {
        id: 'qa-guard-card', name: 'QA Guard Card',
        color: 'heart', description: 'guard fixture', tier: 1,
        targetType: 'self', rank: 1, cardType: 'spell',
        specialMechanics: [{ kind: 'guard', amount: 10 }],
    },
]);

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    // Neutral stats (S3): printed numbers land as printed.
    p.baseStats = { heart: 5, body: 5, mind: 5 };
    p.health = 400; p.maxHealth = 400;
    return p;
}

function makeEnemy(hp: number, strong: 'heart' | 'body' | 'mind', effects: ActiveEffect[] = []): Enemy {
    const e = deepClone(FloatEye);
    e.id = 'enemy-fate-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = effects;
    e.baseStats = { heart: strong === 'heart' ? 6 : 2, body: strong === 'body' ? 6 : 2, mind: strong === 'mind' ? 6 : 2 };
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

function open(cards: string[], enemyStat: 'heart' | 'body' | 'mind' = 'body', enemyEffects: ActiveEffect[] = []): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(cards), makeEnemy(500, enemyStat, enemyEffects), cards, 7);
    s = rollEncounterDice(s).state;
    return s;
}

describe('R1 TOLL', () => {
    it('a spent die tallies its color', () => {
        let s = open(['qa-guard-card'], 'body');
        s = setDice(s, ['heart', 'body']);
        const entry = s.hand.find(h => h.cardId === 'qa-guard-card')!;
        const res = playCombatCard(s, { uid: entry.uid }, true, s.dice[0].id);
        expect(res.state.resonance?.heart).toBe(1);
    });
});

describe('R2 RESERVE — bank, ripen, cash', () => {
    it('a Reserve die ripens +1 pip per threat phase, capped at RESERVE_PIP_CAP', () => {
        let s = open(['qa-bleed-card'], 'body');
        s = { ...s, reserve: [{ id: 'bank-1', color: 'body', state: 'available', temporary: false, pips: 0 }] };
        for (let i = 0; i < RESERVE_PIP_CAP + 2; i++) {
            s = resolveThreatPhase(s).state;
            if (s.finalOutcome) break;
        }
        expect(s.reserve?.[0].pips).toBe(RESERVE_PIP_CAP);
    });

    it('pips cash as +PIP_INTENSITY_BONUS intensity per pip on a status play (R8: the dieId is honored)', () => {
        let s = open(['qa-bleed-card'], 'heart');
        s = setDice(s, ['heart', 'mind']);
        // BODY reserve die — the color law demands the powering die match the
        // body card; every play lands at read 'none'.
        s = { ...s, reserve: [{ id: 'bank-2', color: 'body', state: 'available', temporary: false, pips: 2 }] };
        const entry = s.hand.find(h => h.cardId === 'qa-bleed-card')!;
        const res = playCombatCard(s, { uid: entry.uid }, true, 'bank-2');
        const bleed = res.state.enemy.effects.find(e => e.effectId === 'debuff_bleed')!;
        // authored i1 + 2 pips × PIP_INTENSITY_BONUS (no read bonus)
        expect(bleed.intensity).toBe(1 + 2 * PIP_INTENSITY_BONUS);
        expect(res.events.some(e => e.kind === 'pips-cashed')).toBe(true);
        // The powering Reserve die is spent and leaves the Reserve with its
        // cashed pips.
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
        let s = open(['qa-bleed-card'], 'body');
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
        let s = open(['qa-bleed-card'], 'body'); // body card, body die, body-heavy foe
        s = setDice(s, ['body', 'heart']);
        const entry = s.hand.find(h => h.cardId === 'qa-bleed-card')!;
        const res = playCombatCard(s, { uid: entry.uid }, true, s.dice[0].id);
        const bleed = res.state.enemy.effects.find(e => e.effectId === 'debuff_bleed')!;
        expect(bleed.remainingDuration).toBe(2 + COLOR_MATCH_STATUS_DURATION_BONUS);
    });
});

describe('R8 — a bogus dieId is an explicit fizzle', () => {
    it('fizzles without touching state', () => {
        let s = open(['qa-bleed-card'], 'body');
        s = setDice(s, ['body', 'heart']);
        const entry = s.hand.find(h => h.cardId === 'qa-bleed-card')!;
        const res = playCombatCard(s, { uid: entry.uid }, true, 'no-such-die');
        expect(res.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(res.state.enemy.effects.length).toBe(0);
    });
});
