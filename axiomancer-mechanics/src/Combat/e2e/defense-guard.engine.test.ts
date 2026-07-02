/**
 * Hermetic E2E — Spec 26b Hazard-Pattern Combat: DEFENSE cards / GUARD.
 *
 * Defense cards (basePower 0, a `guard` specialMechanic) grant the player GUARD —
 * a transient shield that absorbs the enemy's NEXT telegraphed threat in
 * `resolveThreatPhase`, then resets each phase. This suite pins the contract:
 *
 *   - the card adapter classifies a `guard` skill as the `defend` verb class
 *     (0 pressure — it's a tempo/survival tool, not a pressure source);
 *   - playing one (POWER) grants read-scaled GUARD onto the state;
 *   - GUARD absorbs the next threat — a defending player takes strictly LESS HP
 *     than the same player who played an offensive card instead;
 *   - the three authored defense cards are real + reachable via COMBAT_REWARD_POOL.
 *
 * Doctrine: defense never out-damages STATUS. It deals no HP and spends the turn's
 * die, so DoT erosion stays the efficient path to the enemy's only bar (HP).
 *
 * Pure math + a fixed RNG only; no disk / network / TTY.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { TidepoolCrab } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import { getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import {
    initializeCombatEncounter, resolveCombatPhase, rollEncounterDice,
    draftStanceDie, playCombatCard,
} from '../combat.engine';
import { classifyVerbClass, toCombatCard } from '../combat.cards';
import { COMBAT_REWARD_POOL } from '../combat.rewards';
import type { CombatDieColor, CombatEncounterState } from '../combat.encounter.types';

afterEach(() => {
    vi.restoreAllMocks();
});

const BRACE = 'brace-for-impact';   // BODY defense (GUARD 12)
const WARD = 'suspend-judgment';    // MIND defense (GUARD 12)
const AEGIS = 'stoic-reserve';      // HEART defense (GUARD 18)
const DOT_BODY = 'slippery-slope';  // body, DoT — the offensive control case
const DEFENSE_IDS = [BRACE, WARD, AEGIS] as const;

function makePlayer(skills: string[]): Character {
    const p = deepClone(Player);
    p.knownSkills = skills.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200;
    p.maxHealth = 200;
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind' = 'mind'): Enemy {
    const e = deepClone(TidepoolCrab);
    e.id = 'enemy-test-dummy';
    e.health = hp;
    e.maxHealth = hp;
    e.effects = [];
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

/** Forces this turn's draft pool to known colors (deterministic reads). */
function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c,
        state: c === 'x' ? ('locked' as const) : ('available' as const), temporary: false,
    }));
    return { ...state, dice, draftedDieId: null, turn };
}

// ── Card adapter (§6) ────────────────────────────────────────────────────────

describe('Spec 26b — defense cards classify as `defend`', () => {
    it('a `guard` skill is the defend verb class on the NO-pressure track', () => {
        for (const id of DEFENSE_IDS) {
            const skill = getCardById(id);
            expect(skill, `${id} must be a real skill`).toBeDefined();
            const { verbClass, track } = classifyVerbClass(skill!, lookupEffect);
            expect(verbClass, id).toBe('defend');
            expect(track, id).toBe('none');
        }
    });

    it('the projected card advertises GUARD in its action text + 0 pressure', () => {
        const card = toCombatCard(BRACE, getCardById, lookupEffect);
        expect(card).not.toBeNull();
        expect(card!.verbClass).toBe('defend');
        expect(card!.bottomDamagePreview).toBe(0);
        expect(card!.bottomActionText).toMatch(/Guard/i);
    });

    it('all three defense cards are reachable via COMBAT_REWARD_POOL', () => {
        for (const id of DEFENSE_IDS) {
            expect(COMBAT_REWARD_POOL, id).toContain(id);
        }
    });
});

// ── Granting GUARD (§4) ──────────────────────────────────────────────────────

describe('Spec 26b — playing a defense card grants GUARD', () => {
    it('a POWERED brace scales the shield by the stance read + color match', () => {
        mockSequentialRng(0.05);
        // BODY die vs a MIND-stance enemy = advantage read (1.5×) + color match (+3).
        // GUARD 12 → round(12 × 1.5) + 3 = 21.
        let state = initializeCombatEncounter(makePlayer([BRACE]), makeEnemy(80, 'mind'), [BRACE, BRACE, BRACE, BRACE, BRACE], 7);
        state = rollEncounterDice(state).state;   // open phase-play (draw hand + roll pool)
        state = setDice(state, ['body', 'mind']);
        state = draftStanceDie(state, state.dice[0].id).state;

        const entry = state.hand.find(h => h.cardId === BRACE);
        expect(entry, 'brace should be in hand').toBeDefined();
        const res = playCombatCard(state, { uid: entry!.uid }, true);

        expect(res.state.guard).toBe(21);
        // Defense deals no HP to the enemy (status stays the win path).
        expect(res.state.enemy.health).toBe(80);
    });
});

// ── Absorbing the threat (§4.4) ──────────────────────────────────────────────

describe('Spec 26b — GUARD absorbs the next enemy threat', () => {
    it('a defending player takes strictly less HP than an attacking one', () => {
        // Same enemy + same seed → identical phase-0 threat for both runs.
        const enemyHp = 120;
        const seed = 11;

        mockSequentialRng(0.05);
        const control = resolveCombatPhase(
            initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(enemyHp, 'mind'), [DOT_BODY, DOT_BODY, DOT_BODY], seed),
            [{ cardId: DOT_BODY, useBottom: true }],
        );
        const controlLoss = 200 - control.state.player.health;

        mockSequentialRng(0.05);
        const defended = resolveCombatPhase(
            initializeCombatEncounter(makePlayer([BRACE]), makeEnemy(enemyHp, 'mind'), [BRACE, BRACE, BRACE], seed),
            [{ cardId: BRACE, useBottom: true }],
        );
        const defendedLoss = 200 - defended.state.player.health;

        expect(controlLoss, 'the enemy must actually threaten HP').toBeGreaterThan(0);
        expect(defendedLoss, 'GUARD must absorb part of the hit').toBeLessThan(controlLoss);
        // GUARD is spent on the phase it covers — it resets, never banks across phases.
        expect(defended.state.guard ?? 0).toBe(0);
    });
});
