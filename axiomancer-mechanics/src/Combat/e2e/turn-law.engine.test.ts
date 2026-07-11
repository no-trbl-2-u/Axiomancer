/**
 * Hermetic E2E — Gate 0 §1 (plan/tuning/2026-07-10-turn-law-and-honest-baseline.md):
 * the ROUND-TURN LAW as an engine invariant.
 *
 *   - `startTurn` refuses a SECOND tray roll inside one threat phase: the
 *     tray/draft/turn are untouched and a `turn-law-blocked` event records
 *     the attempt (the pre-law engine re-rolled a fresh tray any time the
 *     draft slot was empty — the Conviction farm).
 *   - `resolveThreatPhase` re-arms the law at the phase boundary: the next
 *     phase gets exactly one fresh tray.
 *   - THE WATCH RULE: the law caps TRAY ROLLS, not card plays — a multi-float
 *     turn (ALL floating dice spent in one round) still resolves every float.
 *   - The sim policies play legally: a seeded run produces ZERO
 *     `turn-law-blocked` events (the law never binds on legal play).
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
    draftStanceDie, startTurn, endTurn, resolveThreatPhase,
} from '../combat.engine';
import { runOneEncounter } from '../combat.encounter.sim';
import { COMBAT_SIM_POLICY_ORDER } from '../combat.sim-policies';
import type { CombatEncounterState } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

// One simple DoT card per stance color so a multi-float turn always has a
// color-legal paid play for every float in the tray.
registerSandboxCards([
    {
        id: 'qa-law-heart', name: 'QA Law Heart', category: 'fallacy',
        philosophicalAspect: 'heart', description: 'turn-law heart fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    },
    {
        id: 'qa-law-body', name: 'QA Law Body', category: 'fallacy',
        philosophicalAspect: 'body', description: 'turn-law body fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    },
    {
        id: 'qa-law-mind', name: 'QA Law Mind', category: 'paradox',
        philosophicalAspect: 'mind', description: 'turn-law mind fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_confusion', appliedTo: 'opponent', duration: 2 }],
    },
]);

const rng = (): number => 0.5;

function makePlayer(cards: string[], floating: ('heart' | 'body' | 'mind' | 'wild')[] = []): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    p.effects = [];
    p.floatingDice = floating.slice();
    return p;
}

function makeEnemy(): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-turn-law-dummy';
    e.health = 500; e.maxHealth = 500; e.effects = [];
    return e;
}

const LAW_DECK = ['qa-law-heart', 'qa-law-heart', 'qa-law-body', 'qa-law-body', 'qa-law-mind', 'qa-law-mind'];

function open(floating: ('heart' | 'body' | 'mind' | 'wild')[] = []): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(LAW_DECK, floating), makeEnemy(), LAW_DECK, 7);
    s = rollEncounterDice(s, rng).state;
    return s;
}

describe('Gate 0 — the round-turn law (one tray roll per threat phase)', () => {
    it('refuses a second startTurn inside one phase: tray untouched + turn-law-blocked', () => {
        const s = open();
        expect(s.turnTakenThisPhase).toBe(true); // the opening roll IS the phase's turn

        const second = startTurn(s, rng);
        expect(second.events).toEqual([
            { kind: 'turn-law-blocked', turn: s.turn, phaseIndex: s.currentPhaseIndex },
        ]);
        // The refusal is a no-op on the game state: same tray, same turn, no draft.
        expect(second.state.dice).toEqual(s.dice);
        expect(second.state.turn).toBe(s.turn);
        expect(second.state.draftedDieId).toBe(s.draftedDieId);
    });

    it('kills the Conviction farm: endTurn → startTurn is blocked mid-phase', () => {
        let s = open();
        const die = s.dice.find(d => d.state === 'available' && !d.floating);
        expect(die).toBeDefined();
        s = draftStanceDie(s, die!.id).state;
        const convictionAfterDraft = s.conviction;
        s = endTurn(s).state; // banks/burns the drafted die — legal, once
        expect(s.dice).toHaveLength(0);

        const farmed = startTurn(s, rng);
        expect(farmed.events.map(e => e.kind)).toEqual(['turn-law-blocked']);
        expect(farmed.state.dice).toHaveLength(0); // no fresh tray
        expect(farmed.state.turn).toBe(s.turn);
        // No new dice ⇒ no new unpicked-die Conviction income.
        expect(farmed.state.conviction).toBeLessThanOrEqual(convictionAfterDraft + 1);
    });

    it('resolveThreatPhase re-arms the law: the next phase rolls exactly one fresh tray', () => {
        let s = open();
        const blockedBefore = startTurn(s, rng);
        expect(blockedBefore.events.some(e => e.kind === 'turn-law-blocked')).toBe(true);

        const resolved = resolveThreatPhase(s, rng);
        s = resolved.state;
        expect(s.phase).toBe('phase-play');
        expect(s.turnTakenThisPhase).toBe(false); // re-armed
        expect(s.dice).toHaveLength(0);

        const turnBefore = s.turn;
        const first = startTurn(s, rng);
        expect(first.events.some(e => e.kind === 'turn-dice-rolled')).toBe(true);
        expect(first.state.turn).toBe(turnBefore + 1);
        expect(first.state.turnTakenThisPhase).toBe(true);

        const second = startTurn(first.state, rng);
        expect(second.events.map(e => e.kind)).toEqual(['turn-law-blocked']);
    });

    it('THE WATCH RULE: a multi-float turn still resolves ALL floats in one round', () => {
        let s = open(['heart', 'body', 'mind']);
        expect((s.floatingDice ?? []).map(d => d.color).sort()).toEqual(['body', 'heart', 'mind']);

        // Play one color-matched paid card per FLOATING die — all inside the
        // one legal turn (no startTurn between plays; the law is never touched).
        let floatsSpent = 0;
        for (const color of ['heart', 'body', 'mind'] as const) {
            const float = s.dice.find(d => d.floating && d.state === 'available' && d.color === color);
            expect(float).toBeDefined();
            const cardInHand = s.hand
                .map(h => ({ uid: h.uid, cardId: h.cardId }))
                .find(h => h.cardId === `qa-law-${color}`);
            expect(cardInHand).toBeDefined();
            const res = playCombatCard(s, { uid: cardInHand!.uid }, true, float!.id, rng);
            expect(res.events.some(e => e.kind === 'effect-fizzled')).toBe(false);
            expect(res.events.some(e => e.kind === 'floating-die-spent')).toBe(true);
            s = res.state;
            floatsSpent++;
        }
        expect(floatsSpent).toBe(3);
        expect(s.floatingDice ?? []).toHaveLength(0); // the whole pool spent
        expect(s.round).toBe(1);                      // still the same round
        expect(s.log.some(e => e.kind === 'turn-law-blocked')).toBe(false);
    });

    it('sim policies play legally: zero turn-law-blocked events across seeded runs', () => {
        for (const policy of COMBAT_SIM_POLICY_ORDER) {
            for (const seed of [1, 2, 3, 11]) {
                const p = deepClone(Player);
                const e = deepClone(GraveLarva);
                const run = runOneEncounter(p, e, seed, policy);
                expect(run.outcome).toBeDefined();
                // The law never binds on legal play — the guards exist, the
                // policies just never hit them.
                expect({ policy, seed, blocked: run.turnLawBlocked })
                    .toEqual({ policy, seed, blocked: 0 });
            }
        }
    });
});
