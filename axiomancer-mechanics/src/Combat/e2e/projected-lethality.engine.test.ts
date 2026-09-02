/**
 * Hermetic E2E — `projectCombatOutcome`, the consolidated status kill-path
 * readout (pending DoT, "lethal in N rounds", and hand finisher readiness).
 * Re-pinned to spec 32 v3: the finisher vocabulary is RUPTURE and REAP
 * (amplify/execute are deleted); bleed decays 1 intensity per tick and the
 * projection models it. Seeded RNG only; no disk / network / TTY.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, projectCombatOutcome, projectRupture, projectReapAll, handCards,
} from '../combat.engine';
import { getPendingDotTotal } from '../effects';

const ae = (effectId: string, intensity = 1, remainingDuration = 4): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier: 2 });

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
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

// Profane Canon (2026-08-08): the finisher carriers are now
// communion-of-the-worm (RUPTURE ALL + SIPHON 50%) and miserere
// (REAP ALL — 3 per Soul + SIPHON 50%).
const RUPTURE_CARD = 'communion-of-the-worm';
const REAP_CARD = 'miserere';

describe('projectCombatOutcome — the consolidated status kill-path readout', () => {
    it('no DoT on the foe — nothing pending, no foreseeable kill, no finishers', () => {
        const state = initializeCombatEncounter(makePlayer([]), makeEnemy(300), undefined, 7);
        const projection = projectCombatOutcome(state);
        expect(projection.pendingDot).toBe(0);
        expect(projection.roundsToKill).toBeNull();
        expect(projection.isLethalInFlight).toBe(false);
        expect(projection.finishers).toEqual([]);
    });

    it('a decaying bleed that outpaces a low-HP foe is lethal in N rounds', () => {
        // v3 bleed: 3/stack, decays 1 intensity per tick; WS3.3 puts it on
        // the damage-instance clock (2 expected ticks/round). i3 → ticks
        // 9, 6, 3 — all pending, decay-aware (NOT 9 × ticks).
        const enemy = makeEnemy(15, [ae('debuff_bleed', 3, 5)]);
        const state = initializeCombatEncounter(makePlayer([]), enemy, undefined, 7);
        const projection = projectCombatOutcome(state);

        expect(projection.pendingDot).toBe(getPendingDotTotal(state.enemy, state.round).total);
        expect(projection.pendingDot).toBe(18); // 9 + 6 + 3
        // 2 expected ticks in round 1: 9 + 6 = 15 >= 15 -> lethal on round 1.
        expect(projection.roundsToKill).toBe(1);
        expect(projection.isLethalInFlight).toBe(true);
    });

    it('a DoT that never outpaces a high-HP foe over its remaining duration is not lethal', () => {
        // v3 bleed i1 d2: decays out after ONE tick of 3.
        const enemy = makeEnemy(300, [ae('debuff_bleed', 1, 2)]);
        const state = initializeCombatEncounter(makePlayer([]), enemy, undefined, 7);
        const projection = projectCombatOutcome(state);

        expect(projection.pendingDot).toBe(3);
        expect(projection.roundsToKill).toBeNull();
        expect(projection.isLethalInFlight).toBe(false);
    });

    it('combo\'d poison+bleed (ramp + Hemorrhage amplification) stays consistent with getPendingDotTotal and crosses a low-HP foe', () => {
        const enemyEffects = [ae('debuff_poison', 2, 4), ae('debuff_bleed', 1, 4)];
        const enemy = makeEnemy(25, enemyEffects);
        const state = initializeCombatEncounter(makePlayer([]), enemy, undefined, 7);
        const projection = projectCombatOutcome(state);

        // Same fixture as the RUPTURE e2e suite (WS3.3 clock fuel): poison
        // ramps + Hemorrhage on the card-played clock — per-round dprs
        // 6,6,9,9 × 2 expected ticks = 60; bleed i1 decays after one tick of
        // 3. pending = 63.
        expect(projection.pendingDot).toBe(63);
        expect(projection.pendingDot).toBe(getPendingDotTotal(state.enemy, state.round).total);
        // cumulative per round: 15, 27, ... — crosses 25 on round 2.
        expect(projection.roundsToKill).toBe(2);
        expect(projection.isLethalInFlight).toBe(true);
    });

    it('a hand with rupture / reap cards reports each as a finisher matching its own selector', () => {
        const enemyEffects = [ae('debuff_poison', 2, 4), ae('debuff_bleed', 1, 4)];
        const enemy = makeEnemy(300, enemyEffects);
        const deck = [RUPTURE_CARD, REAP_CARD];
        const base = initializeCombatEncounter(makePlayer([RUPTURE_CARD, REAP_CARD]), enemy, deck, 7);
        // Fund the Soul bank so the REAP-all projection is live.
        const state = { ...base, souls: 3 };
        const projection = projectCombatOutcome(state);

        // The 2-card deck reshuffles into a 5-card hand, so each finisher
        // mechanic is represented at least once (counts are hand-order noise).
        expect(projection.finishers.length).toBeGreaterThanOrEqual(2);
        expect(new Set(projection.finishers.map(f => f.mechanic))).toEqual(new Set(['rupture', 'reap']));

        const rupture = projection.finishers.find(f => f.mechanic === 'rupture')!;
        expect(rupture.cardId).toBe(RUPTURE_CARD);
        expect(rupture.ready).toBe(true);
        expect(rupture.amount).toBe(projectRupture(state));
        expect(rupture.amount).toBe(63); // WS3.3 clock fuel — see the RUPTURE e2e pin

        const reapCard = handCards(state).find(h => h.card.id === REAP_CARD)!.card;
        const reap = projection.finishers.find(f => f.mechanic === 'reap')!;
        expect(reap.cardId).toBe(REAP_CARD);
        const expectedReap = projectReapAll(state, reapCard);
        expect(reap.ready).toBe(true);
        expect(reap.ready).toBe(expectedReap.ready);
        expect(reap.amount).toBe(expectedReap.amount);
        // BIG NUMBERS (2026-09-02): miserere prints `reap_all` at burstPerSoul
        // 14 (was 3). 14 × 3 Souls on a neutral read.
        expect(reap.amount).toBe(42);
    });

    it('an empty Soul bank leaves the reap finisher present but NOT ready', () => {
        const state = initializeCombatEncounter(makePlayer([REAP_CARD]), makeEnemy(300), [REAP_CARD], 7);
        const projection = projectCombatOutcome(state);
        const reap = projection.finishers.find(f => f.mechanic === 'reap')!;
        expect(reap).toBeDefined();
        expect(reap.ready).toBe(false);
        expect(reap.amount).toBe(0);
    });

    it('a hand with no finisher-mechanic cards reports no finishers', () => {
        const enemy = makeEnemy(300, [ae('debuff_bleed', 1, 2)]);
        const deck = ['chilblain-watch']; // a real, playable, non-finisher card
        const state = initializeCombatEncounter(makePlayer(['chilblain-watch']), enemy, deck, 7);
        const projection = projectCombatOutcome(state);
        expect(projection.finishers).toEqual([]);
    });
});
