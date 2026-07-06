/**
 * Hermetic E2E — Phase 2 (spec 30): `projectCombatOutcome`, the consolidated
 * status kill-path readout (pending DoT, "lethal in N rounds", and hand
 * finisher readiness). Seeded RNG only; no disk / network / TTY.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, projectCombatOutcome, projectRupture, projectAmplify, projectExecute, handCards,
} from '../combat.engine';
import { getPendingDotTotal } from '../effects';

const ae = (effectId: string, intensity = 1, remainingDuration = 4): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier: 2 });

function makePlayer(skills: string[]): Character {
    const p = deepClone(Player);
    p.knownSkills = skills.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    return p;
}

function makeEnemy(hp: number, effects: ActiveEffect[] = []): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-test-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = effects;
    e.baseStats = { heart: 2, body: 2, mind: 6 };
    return e;
}

const RUPTURE_CARD = 'resonance-detonation';
const AMPLIFY_CARD = 'the-inevitable';
const EXECUTE_CARD = 'achilles-overtake'; // hpPct 0.3, dotStacks 2

describe('projectCombatOutcome — the consolidated status kill-path readout', () => {
    it('no DoT on the foe — nothing pending, no foreseeable kill, no finishers', () => {
        const state = initializeCombatEncounter(makePlayer([]), makeEnemy(300), undefined, 7);
        const projection = projectCombatOutcome(state);
        expect(projection.pendingDot).toBe(0);
        expect(projection.roundsToKill).toBeNull();
        expect(projection.isLethalInFlight).toBe(false);
        expect(projection.finishers).toEqual([]);
    });

    it('a single flat DoT (no ramp, no combo) that outpaces a low-HP foe is lethal in N rounds', () => {
        // debuff_bleed: flat 4/round, no ramp/combo when alone. intensity 3 -> 12/tick.
        const enemy = makeEnemy(30, [ae('debuff_bleed', 3, 5)]);
        const state = initializeCombatEncounter(makePlayer([]), enemy, undefined, 7);
        const projection = projectCombatOutcome(state);

        expect(projection.pendingDot).toBe(getPendingDotTotal(state.enemy, state.round).total);
        expect(projection.pendingDot).toBe(60); // 5 ticks x 12
        // cumulative: 12, 24, 36 >= 30 -> lethal on round 3
        expect(projection.roundsToKill).toBe(3);
        expect(projection.isLethalInFlight).toBe(true);
    });

    it('a DoT that never outpaces a high-HP foe over its remaining duration is not lethal', () => {
        // debuff_bleed canonical (intensity 1, duration 2): 4/round x 2 ticks = 8 pending.
        const enemy = makeEnemy(300, [ae('debuff_bleed', 1, 2)]);
        const state = initializeCombatEncounter(makePlayer([]), enemy, undefined, 7);
        const projection = projectCombatOutcome(state);

        expect(projection.pendingDot).toBe(8);
        expect(projection.roundsToKill).toBeNull();
        expect(projection.isLethalInFlight).toBe(false);
    });

    it('combo\'d poison+bleed (ramp + Hemorrhage amplification) stays consistent with getPendingDotTotal and crosses a low-HP foe', () => {
        const enemyEffects = [ae('debuff_poison', 2, 4), ae('debuff_bleed', 1, 4)];
        const enemy = makeEnemy(25, enemyEffects);
        const state = initializeCombatEncounter(makePlayer([]), enemy, undefined, 7);
        const projection = projectCombatOutcome(state);

        // Same fixture as the RUPTURE e2e suite: pending totals 46 (poison 30 ramped+amplified, bleed 16).
        expect(projection.pendingDot).toBe(46);
        expect(projection.pendingDot).toBe(getPendingDotTotal(state.enemy, state.round).total);
        // cumulative per round: 10, 20, 33 >= 25 -> lethal on round 3
        expect(projection.roundsToKill).toBe(3);
        expect(projection.isLethalInFlight).toBe(true);
    });

    it('a hand with rupture / amplify / execute cards reports each as a ready finisher matching its own selector', () => {
        const enemyEffects = [ae('debuff_poison', 2, 4), ae('debuff_bleed', 1, 4)];
        const enemy = makeEnemy(300, enemyEffects);
        const deck = [RUPTURE_CARD, AMPLIFY_CARD, EXECUTE_CARD];
        const state = initializeCombatEncounter(makePlayer([RUPTURE_CARD, AMPLIFY_CARD, EXECUTE_CARD]), enemy, deck, 7);
        const projection = projectCombatOutcome(state);

        // Hand size (6) can exceed the 3-card deck, so a card may be redrawn —
        // assert each finisher mechanic is represented at least once rather than
        // an exact hand-size-dependent count.
        expect(projection.finishers.length).toBeGreaterThanOrEqual(3);
        expect(new Set(projection.finishers.map(f => f.mechanic))).toEqual(new Set(['rupture', 'amplify', 'execute']));

        const rupture = projection.finishers.find(f => f.mechanic === 'rupture')!;
        expect(rupture).toBeDefined();
        expect(rupture.cardId).toBe(RUPTURE_CARD);
        expect(rupture.ready).toBe(true);
        expect(rupture.amount).toBe(projectRupture(state));

        const amplifyCard = handCards(state).find(h => h.card.id === AMPLIFY_CARD)!.card;
        const amplify = projection.finishers.find(f => f.mechanic === 'amplify')!;
        expect(amplify).toBeDefined();
        expect(amplify.cardId).toBe(AMPLIFY_CARD);
        const expectedAmplify = projectAmplify(state, amplifyCard);
        expect(amplify.amount).toBeGreaterThan(0);
        expect(amplify.ready).toBe(expectedAmplify.ready);
        expect(amplify.amount).toBe(expectedAmplify.amount);

        const executeCard = handCards(state).find(h => h.card.id === EXECUTE_CARD)!.card;
        const execute = projection.finishers.find(f => f.mechanic === 'execute')!;
        expect(execute).toBeDefined();
        expect(execute.cardId).toBe(EXECUTE_CARD);
        const expectedExecute = projectExecute(state, executeCard);
        expect(execute.ready).toBe(true); // 2 distinct DoT stacks meets sorites-cascade's dotStacks: 2 gate
        expect(execute.ready).toBe(expectedExecute.ready);
        expect(execute.amount).toBe(expectedExecute.amount);
    });

    it('a hand with no finisher-mechanic cards reports no finishers', () => {
        const enemy = makeEnemy(300, [ae('debuff_bleed', 1, 2)]);
        const deck = ['card-retreat'];
        const state = initializeCombatEncounter(makePlayer([]), enemy, deck, 7);
        const projection = projectCombatOutcome(state);
        expect(projection.finishers).toEqual([]);
    });
});
