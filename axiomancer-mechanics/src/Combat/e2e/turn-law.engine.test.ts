/**
 * Hermetic E2E — Phase 26, the Turn Law: "one dice-turn per threat phase" is
 * an engine invariant, not a UI-only convention.
 *
 * Source: `plan/tuning/2026-07-10-turn-law-and-honest-baseline.md` §1.
 * Before this phase, `startTurn` had no guard against being called a second
 * time within the same phase — sim policies and the auto CLI exploited this
 * to farm extra Conviction off unpicked dice. `turnTakenThisPhase` closes
 * that gap; `processBetweenPhases` resets it when a new phase opens.
 *
 * Floating dice and Reserve dice remain a separate, legal power source
 * within the one drafted turn (protected by
 * `floating-die-persistence.engine.test.ts`) — the law caps TRAY ROLLS
 * (`startTurn` calls) per phase, not card plays.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import {
    initializeCombatEncounter, rollEncounterDice, startTurn, endTurn,
    processBetweenPhases,
} from '../combat.engine';
import { runHazardCombatAutoEncounter } from '../combat.autoplay';

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    return p;
}

function makeEnemy(hp: number): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-turn-law-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = [];
    return e;
}

describe('THE TURN LAW — one dice-turn per threat phase (phase 26)', () => {
    it('a fresh phase-play state takes its turn once; startTurn is live', () => {
        let state = initializeCombatEncounter(makePlayer([]), makeEnemy(80), undefined, 3);
        const opened = rollEncounterDice(state);
        state = opened.state;
        expect(state.turnTakenThisPhase).toBe(true);
        expect(opened.events.some(e => e.kind === 'turn-dice-rolled')).toBe(true);
    });

    it('a second startTurn within the same phase is refused (no-op + turn-law-blocked)', () => {
        let state = initializeCombatEncounter(makePlayer([]), makeEnemy(80), undefined, 3);
        state = rollEncounterDice(state).state;
        const before = state;

        const second = startTurn(state);
        expect(second.events).toEqual([{ kind: 'turn-law-blocked', phaseIndex: before.currentPhaseIndex }]);
        expect(second.state.dice).toEqual(before.dice);
        expect(second.state.turn).toBe(before.turn);
        expect(second.state.draftedDieId).toBe(before.draftedDieId);
    });

    it('a third, fourth, ... startTurn call is equally refused (no farm, however long)', () => {
        let state = initializeCombatEncounter(makePlayer([]), makeEnemy(80), undefined, 3);
        state = rollEncounterDice(state).state;
        const trayAfterFirstTurn = state.dice;

        for (let i = 0; i < 10; i++) {
            const attempt = startTurn(state);
            expect(attempt.events.every(e => e.kind === 'turn-law-blocked')).toBe(true);
            state = attempt.state;
        }
        expect(state.dice).toEqual(trayAfterFirstTurn);
    });

    it('processBetweenPhases resets the flag: startTurn succeeds again in the new phase', () => {
        let state = initializeCombatEncounter(makePlayer([]), makeEnemy(300), undefined, 3);
        state = rollEncounterDice(state).state;
        expect(state.turnTakenThisPhase).toBe(true);

        // Skip straight to the between-phases transition (no cards needed —
        // the invariant under test is the phase-open reset, not scoring).
        state = endTurn(state).state;
        const advanced = processBetweenPhases(state);
        expect(advanced.state.phase).toBe('phase-play');
        expect(advanced.state.turnTakenThisPhase).toBe(false);

        const reopened = startTurn(advanced.state);
        expect(reopened.events.some(e => e.kind === 'turn-dice-rolled')).toBe(true);
        expect(reopened.state.turnTakenThisPhase).toBe(true);
    });

    it('the live mobile map auto-runner never rolls more than one tray per resolved phase', () => {
        // A cross-theme starter mix (ramping poison, decaying bleed, control,
        // guard) — same fixture as `combat-sim-policies.engine.test.ts`.
        const player = makePlayer(['slippery-slope', 'straw-mans-jab', 'red-herring', 'brace-for-impact']);
        const result = runHazardCombatAutoEncounter(player, makeEnemy(400), { seed: 11, policy: 'status', maxTurns: 20 });
        expect(result.phaseCount).toBeGreaterThan(1); // a multi-phase fight, not a one-shot

        const trayRolls = result.state.log.filter(e => e.kind === 'turn-dice-rolled').length;
        const resolvedPhases = result.state.phaseResults.length;
        // At most one tray per resolved phase, plus (at most) one for whatever
        // phase was still in progress when the encounter ended.
        expect(trayRolls).toBeLessThanOrEqual(resolvedPhases + 1);
    });
});
