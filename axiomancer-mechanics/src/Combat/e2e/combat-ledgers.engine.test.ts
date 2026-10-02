/**
 * Hermetic E2E — spec 32 §12 item 4 (Ratified 2026-07-11): the COMBAT LEDGERS.
 *
 * Three `CombatEncounterState` fields feed the WS5 sequencing conditions and
 * the WS9 threat-branch condition, in real units:
 *
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
import { FloatEye } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import {
    initializeCombatEncounter, rollEncounterDice,
    startTurn, resolveThreatPhase, processBetweenPhases,
    THREAT_DAMAGE_SCALE,
} from '../combat.engine';
import type {
    CombatEncounterState, CombatThreatPhase,
} from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

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
    const e = deepClone(FloatEye);
    e.id = 'enemy-ledger-dummy';
    e.health = 500; e.maxHealth = 500; e.effects = [];
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

/** A single authored damage-only threat phase (loops as the final phase). */
function damagePhase(damage: number): CombatThreatPhase {
    return {
        index: 1,
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
