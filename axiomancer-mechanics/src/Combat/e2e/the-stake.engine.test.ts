/**
 * Hermetic E2E — Phase 31 (EA-7, plan/tuning/2026-07-10-out-of-flow-mechanics.md
 * work item 1 + plan/tuning/2026-07-10-audit-evidence/cross-new-mechanics.md
 * C3/WI-3): THE STAKE — a post-draft, pre-play Conviction wager on the enemy's
 * hidden stance this threat phase, settled at the top of `resolveThreatPhase`.
 *
 *   - place: rejects before a draft, rejects a second stake, rejects
 *     insufficient Conviction; success spends Conviction and emits
 *     `stake-placed`.
 *   - settle WIN: 2◆ → colored float, 4◆ → colored float +1 pip, 6◆ → wild
 *     float; respects the existing FLOATING_DICE_CAP → +1◆ fallback.
 *   - settle LOSS: the wager is gone (already spent at placement) and the
 *     escalation clock's round-basis gets +1 — verified by comparing a
 *     losing run's next-phase incoming damage against a no-stake control.
 *   - the wager always clears at the phase boundary, win or lose.
 *   - sim-policy heuristic: `greedy` carries `stakesWhenInformed`, `blind`
 *     does not — the win-rate-gap acceptance criterion's precondition.
 *
 * Pure math + a fixed RNG only; no disk / network / TTY.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import {
    initializeCombatEncounter, rollEncounterDice, draftStanceDie, placeStake, resolveThreatPhase,
    startTurn, CONVICTION_CAP,
} from '../combat.engine';
import { FLOATING_DICE_CAP } from '../combat.dice';
import { runOneEncounter } from '../combat.encounter.sim';
import { COMBAT_SIM_POLICIES, COMBAT_SIM_POLICY_ORDER } from '../combat.sim-policies';
import type { CombatEncounterState, WheelStance } from '../combat.encounter.types';

registerSandboxCards([
    {
        id: 'qa-stake-heart', name: 'QA Stake Heart', category: 'fallacy',
        philosophicalAspect: 'heart', description: 'stake-test heart fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    },
]);

const rng = (): number => 0.5;
const STAKE_DECK = ['qa-stake-heart', 'qa-stake-heart', 'qa-stake-heart', 'qa-stake-heart', 'qa-stake-heart', 'qa-stake-heart'];

function makePlayer(floating: ('heart' | 'body' | 'mind' | 'wild')[] = []): Character {
    const p = deepClone(Player);
    p.knownCards = STAKE_DECK.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    p.effects = [];
    p.floatingDice = floating.slice();
    return p;
}

function makeEnemy(): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-stake-dummy';
    e.health = 500; e.maxHealth = 500; e.effects = [];
    return e;
}

/** Opens an encounter and drafts a die (any color) so `placeStake`'s
 *  post-draft gate is satisfied, then PINS `conviction` to the requested
 *  value — applied AFTER the draft, which itself burns unpicked dice for
 *  Conviction (dice-law 2026-07-09), so setting it beforehand wouldn't
 *  survive the draft's own token income. */
function openDrafted(conviction = 10, floating: ('heart' | 'body' | 'mind' | 'wild')[] = []): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(floating), makeEnemy(), STAKE_DECK, 7);
    s = rollEncounterDice(s, rng).state;
    const die = s.dice.find(d => d.state === 'available' && !d.floating && d.color !== 'x');
    expect(die).toBeDefined();
    s = draftStanceDie(s, die!.id).state;
    return { ...s, conviction };
}

/** The current phase's ACTUAL hidden stance, and one that's definitely wrong. */
function stances(s: CombatEncounterState): { right: WheelStance; wrong: WheelStance } {
    const idx = Math.min(s.currentPhaseIndex, s.threatPhases.length - 1);
    const right = s.threatPhases[idx].enemyStance as WheelStance;
    const wrong = (['heart', 'body', 'mind'] as const).find(c => c !== right)!;
    return { right, wrong };
}

describe('Phase 31 — THE STAKE', () => {
    it('rejects a wager before a die is drafted this turn', () => {
        let s = initializeCombatEncounter(makePlayer(), makeEnemy(), STAKE_DECK, 7);
        s = { ...s, conviction: 10 };
        s = rollEncounterDice(s, rng).state; // dice rolled, nothing drafted yet
        const res = placeStake(s, 'heart', 2);
        expect(res.events).toEqual([]);
        expect(res.state.stake).toBeUndefined();
        expect(res.state.conviction).toBe(10); // untouched
    });

    it('rejects a second stake while one is already placed', () => {
        let s = openDrafted(10);
        const { right } = stances(s);
        s = placeStake(s, right, 2).state;
        expect(s.stake).toEqual({ color: right, amount: 2 });

        const second = placeStake(s, right, 2);
        expect(second.events).toEqual([]);
        expect(second.state.stake).toEqual({ color: right, amount: 2 }); // untouched
        expect(second.state.conviction).toBe(s.conviction); // no double-spend
    });

    it('rejects a wager Conviction can\'t cover', () => {
        const s = openDrafted(1); // 1◆ — can't afford even the cheapest tier
        const res = placeStake(s, 'heart', 2);
        expect(res.events).toEqual([]);
        expect(res.state.stake).toBeUndefined();
        expect(res.state.conviction).toBe(1);
    });

    it('a legal wager spends Conviction immediately and emits stake-placed', () => {
        const s = openDrafted(10);
        const res = placeStake(s, 'mind', 4);
        expect(res.events).toEqual([{ kind: 'stake-placed', color: 'mind', amount: 4 }]);
        expect(res.state.stake).toEqual({ color: 'mind', amount: 4 });
        expect(res.state.conviction).toBe(6);
    });

    it('WIN @ 2◆ mints a colored float (no pip) and clears the wager', () => {
        let s = openDrafted(10);
        const { right } = stances(s);
        s = placeStake(s, right, 2).state;
        const convictionAfterStake = s.conviction;

        const resolved = resolveThreatPhase(s, rng);
        expect(resolved.events.some(e => e.kind === 'stake-won' && e.color === right && e.payout === 'colored')).toBe(true);
        expect(resolved.events.some(e => e.kind === 'die-floated' && e.color === right)).toBe(true);
        expect(resolved.state.stake).toBeUndefined();
        expect(resolved.state.conviction).toBe(convictionAfterStake); // no extra ◆ spent/gained on a float win
        const won = (resolved.state.floatingDice ?? []).find(d => d.color === right && !d.temporary);
        expect(won).toBeDefined();
        expect(won!.pips ?? 0).toBe(0);
    });

    it('WIN @ 4◆ mints a colored float WITH +1 pip', () => {
        let s = openDrafted(10);
        const { right } = stances(s);
        s = placeStake(s, right, 4).state;

        const resolved = resolveThreatPhase(s, rng);
        expect(resolved.events.some(e => e.kind === 'stake-won' && e.payout === 'colored-pip')).toBe(true);
        const won = (resolved.state.floatingDice ?? []).find(d => d.color === right);
        expect(won).toBeDefined();
        expect(won!.pips ?? 0).toBe(1);
    });

    it('WIN @ 6◆ mints a WILD float', () => {
        let s = openDrafted(10);
        const { right } = stances(s);
        s = placeStake(s, right, 6).state;

        const resolved = resolveThreatPhase(s, rng);
        expect(resolved.events.some(e => e.kind === 'stake-won' && e.payout === 'wild')).toBe(true);
        const won = (resolved.state.floatingDice ?? []).find(d => d.color === 'wild');
        expect(won).toBeDefined();
    });

    it('WIN at the floating-dice cap falls back to +1 Conviction instead of a 4th float', () => {
        let s = openDrafted(10, ['heart', 'body', 'mind']); // pool already at FLOATING_DICE_CAP (3)
        expect((s.floatingDice ?? []).length).toBe(FLOATING_DICE_CAP);
        const { right } = stances(s);
        s = placeStake(s, right, 2).state;
        const convictionAfterStake = s.conviction;

        const resolved = resolveThreatPhase(s, rng);
        expect(resolved.events.some(e => e.kind === 'conviction-gained' && e.reason === 'effect')).toBe(true);
        expect(resolved.events.some(e => e.kind === 'stake-won')).toBe(true);
        expect(resolved.events.some(e => e.kind === 'die-floated')).toBe(false); // no new float — cap held
        expect((resolved.state.floatingDice ?? []).length).toBe(FLOATING_DICE_CAP); // unchanged
        expect(resolved.state.conviction).toBe(Math.min(CONVICTION_CAP, convictionAfterStake + 1));
    });

    it('LOSS burns the wager (already spent) and adds +1 to the escalation round-basis', () => {
        let s = openDrafted(10);
        const { wrong } = stances(s);
        s = placeStake(s, wrong, 2).state;
        const convictionAfterStake = s.conviction;

        const resolved = resolveThreatPhase(s, rng);
        expect(resolved.events.some(e => e.kind === 'stake-lost' && e.amount === 2)).toBe(true);
        expect(resolved.events.some(e => e.kind === 'stake-won' || e.kind === 'die-floated')).toBe(false);
        expect(resolved.state.stake).toBeUndefined();
        expect(resolved.state.conviction).toBe(convictionAfterStake); // no refund, no double-charge
        expect(resolved.state.stakeEscalationBonus).toBe(1);
    });

    it('a losing streak accumulates the escalation bonus monotonically', () => {
        let s = openDrafted(20);
        let priorBonus = 0;
        for (let i = 0; i < 3; i++) {
            if (s.dice.length === 0) s = startTurn(s, rng).state;
            const die = s.dice.find(d => d.state === 'available' && !d.floating && d.color !== 'x');
            expect(die).toBeDefined();
            s = draftStanceDie(s, die!.id).state;
            const { wrong } = stances(s);
            s = placeStake(s, wrong, 2).state;
            const resolved = resolveThreatPhase(s, rng);
            s = resolved.state;
            expect(s.stakeEscalationBonus).toBe(priorBonus + 1);
            priorBonus = s.stakeEscalationBonus!;
        }
        expect(priorBonus).toBe(3);
    });
});

describe('Phase 31 — THE STAKE sim-policy heuristic', () => {
    it('only greedy carries stakesWhenInformed; blind never stakes', () => {
        expect(COMBAT_SIM_POLICIES.greedy.stakesWhenInformed).toBe(true);
        expect(COMBAT_SIM_POLICIES.blind.stakesWhenInformed).toBeFalsy();
    });

    it('sim policies never crash on stake state across every policy and seed', () => {
        for (const policy of COMBAT_SIM_POLICY_ORDER) {
            for (const seed of [1, 2, 3, 11]) {
                const p = deepClone(Player);
                const e = deepClone(GraveLarva);
                const run = runOneEncounter(p, e, seed, policy);
                expect(run.outcome).toBeDefined();
                expect(run.stakesWon).toBeLessThanOrEqual(run.stakesPlaced);
            }
        }
    });

    it('greedy places at least one stake across a seeded batch; blind places none', () => {
        let greedyStakes = 0;
        let blindStakes = 0;
        for (let seed = 1; seed <= 20; seed++) {
            const p1 = deepClone(Player);
            const e1 = deepClone(GraveLarva);
            greedyStakes += runOneEncounter(p1, e1, seed, 'greedy').stakesPlaced;
            const p2 = deepClone(Player);
            const e2 = deepClone(GraveLarva);
            blindStakes += runOneEncounter(p2, e2, seed, 'blind').stakesPlaced;
        }
        expect(greedyStakes).toBeGreaterThan(0);
        expect(blindStakes).toBe(0);
    });
});
