/**
 * Hermetic E2E — Spec 26b Hazard-Pattern Combat: DEFENSE cards / GUARD.
 *
 * Defense cards (a `guard` specialMechanic) grant the player GUARD —
 * a transient shield that absorbs the enemy's NEXT telegraphed threat in
 * `resolveThreatPhase`, then resets each phase. This suite pins the contract:
 *
 *   - the card adapter classifies a `guard` card as the `defend` verb class
 *     (0 pressure — it's a tempo/survival tool, not a pressure source);
 *   - playing one (POWER) grants its printed GUARD (+ colour match) onto the state;
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
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import { getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import {
    initializeCombatEncounter, resolveCombatPhase, rollEncounterDice,
    playCombatCard,
} from '../combat.engine';
import { classifyVerbClass, toCombatCard } from '../combat.cards';
import { COMBAT_REWARD_POOL } from '../combat.rewards';
import type { CombatDieColor, CombatEncounterState } from '../combat.encounter.types';

afterEach(() => {
    vi.restoreAllMocks();
});

const BRACE = 'frostbitten-palisade';  // BODY defense (GUARD 10 + RIPOSTE) — vigil Ash
const HALF_STEP = 'chilblain-watch';   // BODY defense (GUARD 12 + THORNS) — vigil starter
const ANSWER = 'hoarfrost-teeth';      // BODY defense (GUARD 14 + THORNS) — vigil Tooth
const DOT_BODY = 'spoiled-poultice';   // body, DoT — the offensive control case
const DEFENSE_IDS = [BRACE, HALF_STEP, ANSWER] as const;

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200;
    p.maxHealth = 200;
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind' = 'mind'): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-test-dummy';
    e.health = hp;
    e.maxHealth = hp;
    e.effects = [];
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

/** Forces this turn's tray to known colors, every die showing a mana face
 *  (spec 33 — a PAID play names its powering die; no draft). */
function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c,
        state: c === 'x' ? ('locked' as const) : ('available' as const), temporary: false,
        face: 'mana' as const,
    }));
    return { ...state, dice, draftedDieId: null, turn };
}

/** Opens phase-play on a known BODY + MIND tray. */
function openPhase(state: CombatEncounterState): CombatEncounterState {
    return setDice(rollEncounterDice(state).state, ['body', 'mind']);
}

// ── Card adapter (§6) ────────────────────────────────────────────────────────

describe('Spec 26b — defense cards classify as `defend`', () => {
    it('a `guard` card is the defend verb class on the NO-pressure track', () => {
        for (const id of DEFENSE_IDS) {
            const card = getCardById(id);
            expect(card, `${id} must be a real card`).toBeDefined();
            const { verbClass, track } = classifyVerbClass(card!, lookupEffect);
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
    it('a POWERED brace grants its printed GUARD plus the color match', () => {
        mockSequentialRng(0.05);
        // Spec 33 retired the hidden stance read — every play lands printed
        // (1.0×); a BODY die powering a BODY card still pays the colour match
        // (+25%, min +2). GUARD 10 (frostbitten-palisade) + round(10 × 0.25) = +3 → 13.
        const state = openPhase(initializeCombatEncounter(makePlayer([BRACE]), makeEnemy(80, 'mind'), [BRACE, BRACE, BRACE, BRACE, BRACE], 7));

        const entry = state.hand.find(h => h.cardId === BRACE);
        expect(entry, 'brace should be in hand').toBeDefined();
        const res = playCombatCard(state, { uid: entry!.uid }, true, state.dice[0].id);

        expect(res.state.guard).toBe(13);
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

        // Both cards are BODY — each names the tray's BODY die (spec 33).
        mockSequentialRng(0.05);
        const control = resolveCombatPhase(
            openPhase(initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(enemyHp, 'mind'), [DOT_BODY, DOT_BODY, DOT_BODY], seed)),
            [{ cardId: DOT_BODY, useBottom: true, dieId: 't1-d0' }],
        );
        const controlLoss = 200 - control.state.player.health;

        mockSequentialRng(0.05);
        const defended = resolveCombatPhase(
            openPhase(initializeCombatEncounter(makePlayer([BRACE]), makeEnemy(enemyHp, 'mind'), [BRACE, BRACE, BRACE], seed)),
            [{ cardId: BRACE, useBottom: true, dieId: 't1-d0' }],
        );
        const defendedLoss = 200 - defended.state.player.health;

        expect(controlLoss, 'the enemy must actually threaten HP').toBeGreaterThan(0);
        expect(defendedLoss, 'GUARD must absorb part of the hit').toBeLessThan(controlLoss);
        // GUARD is spent on the phase it covers — it resets, never banks across phases.
        expect(defended.state.guard ?? 0).toBe(0);
    });
});
