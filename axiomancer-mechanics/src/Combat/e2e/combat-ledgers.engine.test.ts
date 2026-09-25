/**
 * Hermetic E2E — spec 32 §12 item 4 (Ratified 2026-07-11): the COMBAT LEDGERS.
 *
 * Four `CombatEncounterState` fields feed the WS5 sequencing conditions and the
 * WS9 threat-branch condition, in real units:
 *
 *   - `recoilPaidThisTurn` — every blood price this turn (the `recoil` mech
 *     case) accumulates; resets with `spellsPlayedThisTurn` at `startTurn`.
 *   - `enemyDamageThisTurn` — post-soak HP the enemy's threat landed on the
 *     player, written in `resolveThreatPhase`.
 *   - `enemyDamageLastRound` — the rollover in `processBetweenPhases`
 *     (this-turn value moves to last-round, then this-turn resets), so a card
 *     played THIS turn reads the hit that landed between turns.
 *   - `lastThreatFullyBlocked` — true only when every budgeted hit of the
 *     prior threat was soaked to 0 (riposte/guard/barrier); persists across
 *     the turn boundary (WS9 `prior-threat-fully-blocked` branch fuel).
 *
 * Pure math + a fixed RNG only; no disk / network / TTY.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    startTurn, resolveThreatPhase, processBetweenPhases,
    THREAT_DAMAGE_SCALE,
} from '../combat.engine';
import type {
    CombatDieColor, CombatEncounterState, CombatThreatPhase,
} from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

// A sandbox fixture isolates the recoil WRITE site (the curated library's
// recoil cards carry extra payoff mechanics; a fixture pins the LEDGER rule).
registerSandboxCards([
    {
        id: 'qa-ledger-recoil', name: 'QA Ledger Recoil',
        philosophicalAspect: 'body', description: 'recoil-mech ledger fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 2 }],
        specialMechanics: [{ kind: 'recoil', hp: 4 }],
    },
]);

const rng = (): number => 0.5;

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    p.effects = [];
    return p;
}

function makeEnemy(stance: 'heart' | 'body' | 'mind' = 'body'): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-ledger-dummy';
    e.health = 500; e.maxHealth = 500; e.effects = [];
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c,
        state: c === 'x' ? ('locked' as const) : ('available' as const), temporary: false,
        face: c === 'x' ? ('miss' as const) : ('mana' as const),
    }));
    return { ...state, dice, turn };
}

/** A single authored damage-only threat phase (loops as the final phase). */
function damagePhase(damage: number): CombatThreatPhase {
    return {
        index: 1,
        enemyStance: 'body',
        threatAction: { description: 'qa swing', effects: [{ damage }] },
        isFinalPhase: true,
    };
}

function open(cards: string[]): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(cards), makeEnemy(), cards, 7);
    s = rollEncounterDice(s, rng).state;
    return s;
}

/** Same encounter, but the enemy's telegraph is a known raw hit. */
function openWithThreat(damage: number, guard: number): CombatEncounterState {
    const deck = ['qa-ledger-recoil', 'qa-ledger-recoil', 'qa-ledger-recoil'];
    let s = open(deck);
    s = {
        ...s,
        threatPhases: [damagePhase(damage)],
        threatMarks: ['pending'],
        currentPhaseIndex: 0,
        guard,
    };
    return s;
}

// Round 1 is inside the escalation grace window and the fixture enemy carries
// no controls/rungs, so the landed budget is exactly the raw scale.
const scaled = (damage: number): number => Math.round(damage * THREAT_DAMAGE_SCALE);

// ── recoilPaidThisTurn ───────────────────────────────────────────────────────

describe('combat ledgers — recoilPaidThisTurn', () => {
    it('accumulates across every blood price this turn, then resets at startTurn', () => {
        let s = open(['qa-ledger-recoil', 'qa-ledger-recoil']);
        s = setDice(s, ['body', 'body']);
        expect(s.recoilPaidThisTurn ?? 0).toBe(0);

        // First pay — the `recoil` mech case (printed blood price 4).
        const [first, second] = s.hand.filter(h => h.cardId === 'qa-ledger-recoil');
        let hpBefore = s.player.health;
        s = playCombatCard(s, { uid: first.uid }, true, s.dice[0].id).state;
        expect(hpBefore - s.player.health).toBe(4);
        expect(s.recoilPaidThisTurn).toBe(4);

        // Second pay, same turn — the ledger accumulates.
        hpBefore = s.player.health;
        s = playCombatCard(s, { uid: second.uid }, true, s.dice[1].id).state;
        expect(hpBefore - s.player.health).toBe(4);
        expect(s.recoilPaidThisTurn).toBe(4 + 4);

        // The ledger resets with the turn — same lifecycle hook as
        // `spellsPlayedThisTurn` (startTurn after the phase boundary).
        s = resolveThreatPhase(s, rng).state;
        s = startTurn(s, rng).state;
        expect(s.spellsPlayedThisTurn).toBe(0);
        expect(s.recoilPaidThisTurn).toBe(0);
    });
});

// ── enemyDamageThisTurn / enemyDamageLastRound ──────────────────────────────

describe('combat ledgers — enemy damage this-turn / last-round rollover', () => {
    it('the landed threat budget rolls into enemyDamageLastRound at the boundary', () => {
        const s = openWithThreat(10, 0);
        const hpBefore = s.player.health;
        const res = resolveThreatPhase(s, rng).state;

        // The unsoaked hit landed in full…
        expect(hpBefore - res.player.health).toBe(scaled(10));
        // …and `resolveThreatPhase` chains straight into `processBetweenPhases`,
        // so by the time the next turn opens the value has ALREADY rolled over.
        expect(res.enemyDamageLastRound).toBe(scaled(10));
        expect(res.enemyDamageThisTurn).toBe(0);
        expect(res.lastThreatFullyBlocked).toBe(false);
    });

    it('a partial block ledgers only the post-soak remainder', () => {
        const s = openWithThreat(10, scaled(10) - 5);
        const res = resolveThreatPhase(s, rng).state;
        expect(res.enemyDamageLastRound).toBe(5);
        expect(res.enemyDamageThisTurn).toBe(0);
    });

    it('processBetweenPhases performs the pure rollover (this-turn → last-round → 0)', () => {
        const s = { ...openWithThreat(10, 0), enemyDamageThisTurn: 9, enemyDamageLastRound: 2 };
        const rolled = processBetweenPhases(s, rng).state;
        expect(rolled.enemyDamageLastRound).toBe(9);
        expect(rolled.enemyDamageThisTurn).toBe(0);
    });
});

// ── lastThreatFullyBlocked ───────────────────────────────────────────────────

describe('combat ledgers — lastThreatFullyBlocked', () => {
    it('true when guard covers the whole budgeted hit, and persists into the next turn', () => {
        const s = openWithThreat(10, scaled(10));
        const hpBefore = s.player.health;
        let res = resolveThreatPhase(s, rng).state;

        expect(res.player.health).toBe(hpBefore); // fully prevented
        expect(res.lastThreatFullyBlocked).toBe(true);
        expect(res.enemyDamageLastRound).toBe(0);

        // Persisted for the NEXT phase — the turn boundary must not clear it.
        res = startTurn(res, rng).state;
        expect(res.lastThreatFullyBlocked).toBe(true);
    });

    it('false when even one point of the budget lands (partial block)', () => {
        const s = openWithThreat(10, scaled(10) - 1);
        const res = resolveThreatPhase(s, rng).state;
        expect(res.lastThreatFullyBlocked).toBe(false);
        expect(res.enemyDamageLastRound).toBe(1);
    });
});
