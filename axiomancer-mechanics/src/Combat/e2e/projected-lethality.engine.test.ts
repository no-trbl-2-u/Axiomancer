/**
 * Hermetic E2E — `projectCombatOutcome`, the consolidated status kill-path
 * readout (pending DoT, "lethal in N rounds", and hand finisher readiness).
 * Re-pinned to spec 32 v3: the finisher vocabulary is RUPTURE and REAP
 * (amplify/execute are deleted); bleed decays 1 intensity per tick and the
 * projection models it. Seeded RNG only; no disk / network / TTY.
 *
 * Card purge (P1, 2026-09-27): no surviving card prints RUPTURE or REAP, so
 * the finisher-readiness cases left with their carriers; the no-finisher
 * case and the pending-DoT / heal-aware readouts stay.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, projectCombatOutcome,
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

    it('a hand with no finisher-mechanic cards reports no finishers', () => {
        const enemy = makeEnemy(300, [ae('debuff_bleed', 1, 2)]);
        const deck = ['grey-ward']; // a real, playable, non-finisher card
        const state = initializeCombatEncounter(makePlayer(['grey-ward']), enemy, deck, 7);
        const projection = projectCombatOutcome(state);
        expect(projection.finishers).toEqual([]);
    });
});

// Playtest fix 2026-09-04 — the projection was blind to healing: a RAVENOUS
// foe read "LETHAL IN 3" every round while its bar climbed.
describe('projectCombatOutcome — heal-aware lethality', () => {
    it('REGROW nets against each round of ticks before the lethal check', () => {
        // The exact walk is pinned on synthetic numbers in
        // dot-trigger-clocks.engine.test.ts; here the live POISON curve only
        // has to move the SAME way: a small REGROW pushes the kill later.
        const enemy = makeEnemy(25, [ae('debuff_poison', 2, 4)]);
        const plain = initializeCombatEncounter(makePlayer([]), enemy, undefined, 7);
        const plainProjection = projectCombatOutcome(plain);
        expect(plainProjection.healPerRound).toBe(0);
        expect(plainProjection.roundsToKill).not.toBeNull();
        const regrowing = { ...plain, enemy: { ...plain.enemy, keywords: [{ kind: 'regrow' as const, n: 4 }] } };
        const projection = projectCombatOutcome(regrowing);
        expect(projection.healPerRound).toBe(4);
        expect(projection.roundsToKill === null || projection.roundsToKill > plainProjection.roundsToKill!).toBe(true);
        // The lump-sum pending figure is heal-blind by design (it is RUPTURE's
        // fuel, not a forecast) and must not move.
        expect(projection.pendingDot).toBe(plainProjection.pendingDot);
    });

    it('a heal that outpaces the stack is not lethal at all', () => {
        const enemy = makeEnemy(25, [ae('debuff_poison', 2, 4)]);
        const base = initializeCombatEncounter(makePlayer([]), enemy, undefined, 7);
        const state = { ...base, enemy: { ...base.enemy, keywords: [{ kind: 'regrow' as const, n: 20 }] } };
        const projection = projectCombatOutcome(state);
        expect(projection.pendingDot).toBeGreaterThan(25); // the lump sum still says "enough fuel"
        expect(projection.roundsToKill).toBeNull();
        expect(projection.isLethalInFlight).toBe(false);
    });

    it('RAVENOUS is estimated as the current telegraph netted through GUARD', () => {
        const enemy = makeEnemy(300, [ae('debuff_poison', 2, 4)]);
        const base = initializeCombatEncounter(makePlayer([]), enemy, undefined, 7);
        const ravenous = { ...base, enemy: { ...base.enemy, keywords: [{ kind: 'ravenous' as const }] } };
        const open = projectCombatOutcome(ravenous);
        expect(open.healPerRound).toBeGreaterThan(0);
        // Enough GUARD to blank the telegraph blanks the projected drain too.
        const walled = { ...ravenous, guard: 10_000 };
        expect(projectCombatOutcome(walled).healPerRound).toBe(0);
    });
});
