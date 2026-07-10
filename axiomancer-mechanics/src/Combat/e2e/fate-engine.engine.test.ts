/**
 * Hermetic E2E — Fate Engine P1 (spec 31 §1): the dice get a second read.
 *
 * Pins every new dice mechanic to exact engine behavior, in real units:
 *   R1 RESONANCE — every spent die tallies its color; card THRESHOLDS fire free riders
 *   R2 RESERVE — bank-or-burn at draft; banked dice RIPEN +1 pip per threat phase;
 *      pips cash as +1 intensity per pip (status) or +2 Guard per pip (defend)
 *   R4 FATE — an X die powers a `fate` card (printed rider + recoil) and the
 *      universal once-per-turn X TAP advances the strongest enemy DoT
 *   R5 OMEN — the undrafted die that beats the current stance scouts the NEXT phase
 *   R7 COLOR MATCH — a matched die extends the landed status +1 turn
 *   R8 dieId HONORED — a Reserve die id powers the play; a bogus id fizzles
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
    draftStanceDie, endTurn, tapFateDie, getCard,
    PIP_INTENSITY_BONUS, PIP_GUARD_BONUS, COLOR_MATCH_STATUS_DURATION_BONUS,
} from '../combat.engine';
import { RESERVE_MAX, RESERVE_PIP_CAP } from '../combat.dice';
import type { ActiveEffect } from '../../Effects/types';
import { lookupEffect } from '../../Effects';
import type { CombatDieColor, CombatEncounterState } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

// Sandbox fixtures isolate each mechanic (the curated library carries them all,
// but a fixture pins the RULE, not any one card's tuning).
registerSandboxCards([
    {
        id: 'qa-threshold-dot', name: 'QA Threshold DoT', category: 'fallacy',
        philosophicalAspect: 'body', description: 'threshold fixture', tier: 1,
        targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 2 }],
        threshold: { color: 'body', count: 1, rider: { conviction: 2, guard: 4 } },
    },
    {
        id: 'qa-fate-card', name: 'QA Fate Card', category: 'paradox',
        philosophicalAspect: 'mind', description: 'fate fixture', tier: 1,
        targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_confusion', appliedTo: 'opponent', duration: 2 }],
        fate: { rider: { bonusDuration: 2 }, recoilHp: 3 },
    },
    {
        id: 'qa-guard-card', name: 'QA Guard Card', category: 'fallacy',
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

function ae(effectId: string, intensity = 1, duration = 3): ActiveEffect {
    return { effectId, intensity, remainingDuration: duration, appliedAt: 1, tier: lookupEffect(effectId)!.tier };
}

function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c,
        state: c === 'x' ? ('locked' as const) : ('available' as const), temporary: false,
    }));
    return { ...state, dice, draftedDieId: null, turn };
}

function open(cards: string[], enemyStance: 'heart' | 'body' | 'mind' = 'body', enemyEffects: ActiveEffect[] = []): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(cards), makeEnemy(500, enemyStance, enemyEffects), cards, 7);
    s = rollEncounterDice(s).state;
    return s;
}

describe('R1 RESONANCE + thresholds', () => {
    it('spent dice tally their color and a met threshold fires its rider FREE, in real units', () => {
        let s = open(['qa-threshold-dot'], 'body');
        s = setDice(s, ['body', 'heart']);
        s = draftStanceDie(s, s.dice[0].id).state; // burns the heart die → heart resonance
        expect(s.resonance?.heart).toBe(1);
        const convBefore = s.conviction;
        const guardBefore = s.guard ?? 0;
        const entry = s.hand.find(h => h.cardId === 'qa-threshold-dot')!;
        const res = playCombatCard(s, { uid: entry.uid }, true);
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
    it('bankUnpicked banks the omen die instead of burning it for Conviction', () => {
        let s = open(['qa-threshold-dot'], 'body');
        s = setDice(s, ['body', 'heart']);
        const conv = s.conviction;
        s = draftStanceDie(s, s.dice[0].id, { bankUnpicked: true }).state;
        expect(s.reserve?.length).toBe(1);
        expect(s.reserve?.[0].color).toBe('heart');
        // banked → NO +1 Conviction (bank-or-burn is a real choice)
        expect(s.conviction).toBe(conv);
    });

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
        let s = open(['qa-threshold-dot'], 'heart'); // heart stance: body die = disadvantage? body vs heart → heart beats body = disadvantage; draft heart neutral
        s = setDice(s, ['heart', 'mind']);
        s = draftStanceDie(s, s.dice[0].id).state;   // neutral read (heart vs heart)
        // BODY reserve die — the color law (2026-07-09) demands the powering die
        // match the body card; the turn read stays neutral (heart draft vs heart).
        s = { ...s, reserve: [{ id: 'bank-2', color: 'body', state: 'available', temporary: false, pips: 2 }] };
        const entry = s.hand.find(h => h.cardId === 'qa-threshold-dot')!;
        const res = playCombatCard(s, { uid: entry.uid }, true, 'bank-2');
        const bleed = res.state.enemy.effects.find(e => e.effectId === 'debuff_bleed')!;
        // authored i1 + 2 pips × PIP_INTENSITY_BONUS (neutral turn read: no read bonus)
        expect(bleed.intensity).toBe(1 + 2 * PIP_INTENSITY_BONUS);
        expect(res.events.some(e => e.kind === 'pips-cashed')).toBe(true);
        // the fresh bleed fired the VARIETY CHAIN (R9) → the reserve die stays
        // banked, its pips cashed back to 0.
        expect(res.state.reserve?.length ?? 0).toBe(1);
        expect(res.state.reserve?.[0].pips).toBe(0);
    });

    it('pips cash as +PIP_GUARD_BONUS Guard per pip on a defend play', () => {
        let s = open(['qa-guard-card'], 'body');
        s = setDice(s, ['body', 'mind']);
        s = draftStanceDie(s, s.dice[0].id).state;
        s = { ...s, reserve: [{ id: 'bank-3', color: 'heart', state: 'available', temporary: false, pips: 2 }] };
        const entry = s.hand.find(h => h.cardId === 'qa-guard-card')!;
        const res = playCombatCard(s, { uid: entry.uid }, true, 'bank-3');
        // guard 10 (neutral read ×1, heart die MATCHES the heart card → +3) + 2 pips × 2
        expect(res.state.guard).toBe(10 + 3 + 2 * PIP_GUARD_BONUS);
    });

    it('an unspent drafted die banks at endTurn while the Reserve has room, else burns', () => {
        let s = open(['qa-threshold-dot'], 'body');
        s = { ...s, reserve: [
            { id: 'r1', color: 'body', state: 'available', temporary: false, pips: 0 },
            { id: 'r2', color: 'mind', state: 'available', temporary: false, pips: 0 },
        ] };
        expect(s.reserve!.length).toBe(RESERVE_MAX);
        s = setDice(s, ['heart', 'mind']);
        s = draftStanceDie(s, s.dice[0].id).state;
        const conv = s.conviction;
        s = endTurn(s).state;
        expect(s.reserve!.length).toBe(RESERVE_MAX);         // full → burned instead
        expect(s.conviction).toBe(Math.min(12, conv + 1));
    });
});

describe('R4 FATE — X dice are never dead', () => {
    it('an X die powers a `fate` card: printed rider + recoil, read = none', () => {
        let s = open(['qa-fate-card'], 'mind');
        s = setDice(s, ['mind', 'x']);
        s = draftStanceDie(s, s.dice[0].id).state;
        const xDie = s.dice.find(d => d.color === 'x')!;
        const entry = s.hand.find(h => h.cardId === 'qa-fate-card')!;
        const playerHp = s.player.health;
        const res = playCombatCard(s, { uid: entry.uid }, true, xDie.id);
        expect(res.events.some(e => e.kind === 'fate-powered')).toBe(true);
        const confusion = res.state.enemy.effects.find(e => e.effectId === 'debuff_confusion')!;
        // authored d2 + rider bonusDuration 2 (no read/match adjustments on a none-read X play)
        expect(confusion.remainingDuration).toBe(2 + 2);
        expect(playerHp - res.state.player.health).toBe(3);  // printed recoil, exact
    });

    it('a non-fate card refuses an X die with an explicit fizzle', () => {
        let s = open(['qa-threshold-dot'], 'body');
        s = setDice(s, ['body', 'x']);
        s = draftStanceDie(s, s.dice[0].id).state;
        const xDie = s.dice.find(d => d.color === 'x')!;
        const entry = s.hand.find(h => h.cardId === 'qa-threshold-dot')!;
        const res = playCombatCard(s, { uid: entry.uid }, true, xDie.id);
        expect(res.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(res.state.enemy.effects.length).toBe(0);
    });

    it('the universal FATE TAP advances the strongest enemy DoT once per turn', () => {
        let s = open(['qa-threshold-dot'], 'body', [ae('debuff_bleed', 2, 3)]);
        s = setDice(s, ['body', 'x']);
        s = draftStanceDie(s, s.dice[0].id).state;
        const xDie = s.dice.find(d => d.color === 'x')!;
        const hp = s.enemy.health;
        const tap = tapFateDie(s, xDie.id, 'dot-tick');
        expect(hp - tap.state.enemy.health).toBe(6); // floor(3 × 2) — one exact v3 bleed tick
        expect(tap.state.fateTappedTurn).toBe(tap.state.turn);
        // second tap the same turn is a no-op
        const again = tapFateDie(tap.state, xDie.id, 'conviction');
        expect(again.state).toBe(tap.state);
    });
});

describe('R5 OMEN — the undrafted die scouts forward', () => {
    it('an omen die that beats the current stance reveals the NEXT phase stance', () => {
        let s = open(['qa-threshold-dot'], 'mind'); // body beats mind
        // Ensure a next phase exists to scout.
        expect(s.threatPhases.length).toBeGreaterThan(1);
        s = setDice(s, ['heart', 'body']);          // drafting heart leaves BODY as the omen (body beats mind)
        const res = draftStanceDie(s, s.dice[0].id);
        expect(res.events.some(e => e.kind === 'omen-revealed')).toBe(true);
        expect(res.state.revealedStances).toContain(1); // next phase index scouted
    });

    it('a losing omen die reveals nothing', () => {
        let s = open(['qa-threshold-dot'], 'body'); // heart loses to nothing here: mind loses to body? body beats mind — omen mind vs body: body beats mind → mind does NOT beat body
        s = setDice(s, ['body', 'mind']);           // omen = mind, which loses to body
        const res = draftStanceDie(s, s.dice[0].id);
        expect(res.events.some(e => e.kind === 'omen-revealed')).toBe(false);
    });
});

describe('R7 COLOR MATCH — +1 turn on status plays', () => {
    it('a matched die extends the landed status by COLOR_MATCH_STATUS_DURATION_BONUS', () => {
        let s = open(['qa-threshold-dot'], 'body'); // body card, body die, body stance (neutral read)
        s = setDice(s, ['body', 'heart']);
        s = draftStanceDie(s, s.dice[0].id).state;
        const entry = s.hand.find(h => h.cardId === 'qa-threshold-dot')!;
        const res = playCombatCard(s, { uid: entry.uid }, true);
        const bleed = res.state.enemy.effects.find(e => e.effectId === 'debuff_bleed')!;
        expect(bleed.remainingDuration).toBe(2 + COLOR_MATCH_STATUS_DURATION_BONUS);
    });
});

describe('R8 — a bogus dieId is an explicit fizzle', () => {
    it('fizzles without touching state', () => {
        let s = open(['qa-threshold-dot'], 'body');
        s = setDice(s, ['body', 'heart']);
        s = draftStanceDie(s, s.dice[0].id).state;
        const entry = s.hand.find(h => h.cardId === 'qa-threshold-dot')!;
        const res = playCombatCard(s, { uid: entry.uid }, true, 'no-such-die');
        expect(res.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(res.state.enemy.effects.length).toBe(0);
    });
});

describe('the projected card prints its die lines (real units)', () => {
    it('threshold / dieBonus lines appear on v3 library cards', () => {
        // mounting-case: threshold heart×2 → +1 Premise
        expect(getCard('mounting-case')!.dieLines?.some(l => l.includes('HEART ×2'))).toBe(true);
        // straw-mans-jab: dieBonus on a BODY die → +1 intensity
        expect(getCard('straw-mans-jab')!.dieLines?.some(l => l.includes('BODY die'))).toBe(true);
        // bootstrap-loop: threshold mind×2 → +1 pip to every Reserve die
        expect(getCard('bootstrap-loop')!.dieLines?.some(l => l.includes('Reserve'))).toBe(true);
    });
});
