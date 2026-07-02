/**
 * Hermetic E2E — Spec 25 Hazard-Pattern Combat: helper-export coverage.
 *
 * The §11 acceptance suite (`hazard-pattern-combat.engine.test.ts`) drives the
 * engine end-to-end but pins many of the smaller public exports only indirectly.
 * This sibling suite gives each of those exports a direct contract test, with a
 * deliberate focus on the doctrine-critical surface:
 *
 *   - the self-reinforcing status-loop dice primitives (`combatDieCanPower` /
 *     `refreshOneDie` / `rollCombatDice`) — HP is the sole win condition
 *     (2026-06-22); DoT/control skills deplete HP far faster than the weak
 *     basic strike; `dotErosionReached` / `controlSaturationReached` were
 *     removed with the old Pressure-Track model;
 *   - the Befriend mercy entry (`selectEncounterMercyChoice`);
 *   - the deck / threat / card-adapter / UI-preview helpers.
 *
 * Pure math + an explicit fixed RNG only; no disk / network / TTY.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { TidepoolCrab } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { getCardById } from '../../Cards/cards.library';
import { lookupEffect, applyEffect } from '../../Effects';

import {
    initializeCombatEncounter, rollEncounterDice,
    resolveCardDieCost, cardDieCostPreview, availableDice,
    selectMercyChoice as selectEncounterMercyChoice, getCard,
    handCards, resolveThreatPhase,
    THREAT_WEAKEN_PER_ROLL, THREAT_DENY_AT, THREAT_WEAKEN_FLOOR,
} from '../combat.engine';
import { recordAttribution, buildCombatSummary } from '../combat.attribution';
import type { CombatAttributionRow } from '../combat.encounter.types';
import {
    rollCombatDice, combatDieCanPower, refreshOneDie, COMBAT_DICE_COUNT,
    dieIsRerollable, hasRerollableDice, rerollSpentDice,
} from '../combat.dice';
import { buildCombatDeck, COMBAT_HAND_SIZE } from '../combat.deck';
import { classifyVerbClass, toCombatCard, projectDeck, isGoldCard, GOLD_CARD_IDS } from '../combat.cards';
import { generateDefaultThreatSequence, AUTHORED_THREAT_ENEMY_IDS } from '../combat.threat';
import { ENEMY_REGISTRY } from '../../Enemy/enemy.library';
import type { CombatManaDie, CombatEvent } from '../combat.encounter.types';

const DOT_BODY = 'slippery-slope';       // body, tier 2, DoT
const CONTROL_HEART = 'eternal-regress'; // heart, tier 2, control
const DAMAGE_BODY = 'achilles-gambit';   // body, tier 1, no status effect

const SEED = 12345;

function makePlayer(skills: string[]): Character {
    const p = deepClone(Player);
    p.knownSkills = skills.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200;
    p.maxHealth = 200;
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind' = 'heart'): Enemy {
    const e = deepClone(TidepoolCrab);
    e.id = 'enemy-helper-dummy';
    e.health = hp;
    e.maxHealth = hp;
    e.effects = [];
    e.baseStats = {
        heart: stance === 'heart' ? 6 : 2,
        body: stance === 'body' ? 6 : 2,
        mind: stance === 'mind' ? 6 : 2,
    };
    return e;
}

function die(id: string, color: CombatManaDie['color'], state: CombatManaDie['state']): CombatManaDie {
    return { id, color, state, temporary: false };
}

/** A fixed-value RNG for the dice bag (deterministic, no Math.random spy). */
const fixed = (v: number) => (): number => v;

// ── Dice primitives (§4.2 / §4.7) — the self-reinforcing status loop ─────────

describe('Spec 25 §4.2 — rollCombatDice', () => {
    it('rolls COMBAT_DICE_COUNT dice with unique ids and bag-legal colors', () => {
        // The 6-face bag is [heart, body, mind, wild, x, x]; index 3 → wild.
        const dice = rollCombatDice(COMBAT_DICE_COUNT, fixed(3 / 6));
        expect(dice).toHaveLength(COMBAT_DICE_COUNT);
        expect(new Set(dice.map(d => d.id)).size).toBe(COMBAT_DICE_COUNT);
        for (const d of dice) {
            expect(d.color).toBe('wild');
            expect(d.state).toBe('available');
            expect(d.temporary).toBe(false);
        }
    });

    it('rolls X faces as locked (the 2/6 blocked outcome)', () => {
        const dice = rollCombatDice(2, fixed(5 / 6)); // index 5 → x
        expect(dice.every(d => d.color === 'x' && d.state === 'locked')).toBe(true);
    });
});

describe('Spec 25 §4.2 — combatDieCanPower', () => {
    it('a matching available colored die powers its card', () => {
        expect(combatDieCanPower(die('d', 'body', 'available'), 'body')).toBe(true);
    });

    it('a wild die powers any color; a colored die does not power a mismatch', () => {
        expect(combatDieCanPower(die('d', 'wild', 'available'), 'mind')).toBe(true);
        expect(combatDieCanPower(die('d', 'heart', 'available'), 'mind')).toBe(false);
    });

    it('spent / locked dice and X faces never power a card', () => {
        expect(combatDieCanPower(die('d', 'body', 'spent'), 'body')).toBe(false);
        expect(combatDieCanPower(die('d', 'x', 'available'), 'body')).toBe(false);
        expect(combatDieCanPower(die('d', 'body', 'locked'), 'body')).toBe(false);
    });
});

describe('Spec 25 §4.7 — refreshOneDie (status-loop reclaim)', () => {
    it('prefers an exact-color spent die', () => {
        const pool = [die('a', 'heart', 'spent'), die('b', 'wild', 'spent'), die('c', 'body', 'available')];
        const { dice, refreshedId } = refreshOneDie(pool, 'heart');
        expect(refreshedId).toBe('a');
        expect(dice.find(d => d.id === 'a')!.state).toBe('available');
        expect(dice.find(d => d.id === 'b')!.state).toBe('spent'); // wild untouched
    });

    it('falls back to a spent wild die when no exact color is spent', () => {
        const pool = [die('a', 'wild', 'spent'), die('b', 'body', 'available')];
        const { refreshedId, dice } = refreshOneDie(pool, 'heart');
        expect(refreshedId).toBe('a');
        expect(dice.find(d => d.id === 'a')!.state).toBe('available');
    });

    it('refreshes nothing (null) when no spent die matches', () => {
        const pool = [die('a', 'body', 'available'), die('b', 'mind', 'available')];
        const { dice, refreshedId } = refreshOneDie(pool, 'heart');
        expect(refreshedId).toBeNull();
        expect(dice.map(d => d.state)).toEqual(['available', 'available']);
    });
});

// ── Deck building (§4.3) ─────────────────────────────────────────────────────

describe('Spec 25 §4.3 — buildCombatDeck', () => {
    it('builds the deck from known skills + the synthetic Retreat baseline', () => {
        const deck = buildCombatDeck(makePlayer([DOT_BODY, CONTROL_HEART]));
        expect(deck).toContain(DOT_BODY);
        expect(deck).toContain(CONTROL_HEART);
        expect(deck).toContain('card-retreat'); // always-present escape baseline
    });

    it('de-dups known skills and preserves learn order', () => {
        const deck = buildCombatDeck(makePlayer([DOT_BODY, DOT_BODY, CONTROL_HEART]));
        expect(deck.filter(id => id === DOT_BODY)).toHaveLength(1);
        expect(deck.indexOf(DOT_BODY)).toBeLessThan(deck.indexOf(CONTROL_HEART));
    });

    it('still yields a playable deck (Retreat) for a player with no skills', () => {
        expect(buildCombatDeck(makePlayer([]))).toEqual(['card-retreat']);
    });
});

// ── Card adapters (§6) ───────────────────────────────────────────────────────

describe('Spec 25 §6 — card adapters', () => {
    it('classifyVerbClass routes a DoT skill to the dot track', () => {
        const { verbClass, track } = classifyVerbClass(getCardById(DOT_BODY)!, lookupEffect);
        expect(verbClass).toBe('direct-dot');
        expect(track).toBe('dot');
    });

    it('classifyVerbClass routes a control skill to the control track', () => {
        const { verbClass, track } = classifyVerbClass(getCardById(CONTROL_HEART)!, lookupEffect);
        expect(['direct-control', 'stat-debuff']).toContain(verbClass);
        expect(track).toBe('control');
    });

    it('classifyVerbClass marks a pure-damage skill as direct-damage / no track', () => {
        const { verbClass, track } = classifyVerbClass(getCardById(DAMAGE_BODY)!, lookupEffect);
        expect(verbClass).toBe('direct-damage');
        expect(track).toBe('none');
    });

    it('toCombatCard projects a synthetic Retreat card without a skill lookup', () => {
        const card = toCombatCard('card-retreat', getCardById, lookupEffect);
        expect(card).not.toBeNull();
        expect(card!.id).toBe('card-retreat');
    });

    it('toCombatCard returns null for an unknown card id', () => {
        expect(toCombatCard('not-a-real-skill', getCardById, lookupEffect)).toBeNull();
    });

    it('projectDeck maps known ids and drops unknown ones', () => {
        const cards = projectDeck([DOT_BODY, 'not-a-real-skill', CONTROL_HEART], getCardById, lookupEffect);
        expect(cards.map(c => c.id)).toEqual([DOT_BODY, CONTROL_HEART]);
    });
});

// ── Threat helpers (§10) ─────────────────────────────────────────────────────

describe('Spec 25 §10 — threat sequence helpers', () => {
    it('generateDefaultThreatSequence builds a multi-phase sequence of enemy attacks', () => {
        const seq = generateDefaultThreatSequence(makeEnemy(100, 'body'));
        expect(seq.length).toBeGreaterThanOrEqual(2);
        for (let i = 0; i < seq.length; i++) {
            expect(seq[i].index).toBe(i + 1);
            // Each phase is a real enemy turn: a telegraphed threat action.
            expect(seq[i].threatAction.effects.length).toBeGreaterThan(0);
        }
        expect(seq[seq.length - 1].isFinalPhase).toBe(true);
    });
});

// ── UI previews (§7) ─────────────────────────────────────────────────────────

describe('Spec 25 §7 — presenter previews', () => {
    it('availableDice counts only spendable (non-X, available) dice', () => {
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(80, 'mind'), undefined, SEED);
        state = rollEncounterDice(state).state;
        const expected = state.dice.filter(d => d.state === 'available' && d.color !== 'x').length;
        expect(availableDice(state)).toBe(expected);
    });

    it('cardDieCostPreview matches resolveCardDieCost against the current phase stance', () => {
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(80, 'body'), undefined, SEED);
        state = rollEncounterDice(state).state;
        const cardId = state.hand[0]?.cardId ?? 'card-retreat';
        const card = getCard(cardId)!;
        const phaseStance = state.threatPhases[state.currentPhaseIndex].enemyStance;
        expect(cardDieCostPreview(state, card)).toEqual(resolveCardDieCost(card.stance, phaseStance));
    });
});

// ── Mercy choice (§7.6) — Befriend opening ──────────────────────────────────

describe('Spec 25 §7.6 — selectEncounterMercyChoice', () => {
    it('is a no-op when no mercy choice is active', () => {
        const state = initializeCombatEncounter(makePlayer([CONTROL_HEART]), makeEnemy(80), undefined, SEED);
        expect(state.mercyChoiceActive).toBeFalsy();
        const res = selectEncounterMercyChoice(state, 'spare');
        expect(res.state).toBe(state);
        expect(res.events).toEqual([]);
    });

    it('spare resolves the encounter to a mercy outcome when the choice is open', () => {
        const base = initializeCombatEncounter(makePlayer([CONTROL_HEART]), makeEnemy(80), undefined, SEED);
        const open = { ...base, mercyChoiceActive: true };
        const res = selectEncounterMercyChoice(open, 'spare');
        expect(res.state.finalOutcome).toBe('mercy');
        expect(res.state.phase).toBe('complete');
        expect(res.state.mercyChoiceActive).toBe(false);
        expect(res.events.some((e: CombatEvent) => e.kind === 'combat-ended')).toBe(true);
    });

    it('exploit deals a heavy strike and can resolve to victory on a kill', () => {
        const base = initializeCombatEncounter(makePlayer([CONTROL_HEART]), makeEnemy(1), undefined, SEED);
        const open = { ...base, mercyChoiceActive: true };
        const res = selectEncounterMercyChoice(open, 'exploit');
        expect(res.state.mercyChoiceActive).toBe(false);
        expect(res.events.some((e: CombatEvent) => e.kind === 'damage-dealt')).toBe(true);
        expect(res.state.finalOutcome).toBe('victory');
    });
});

// ── Press Fate partial re-roll (PR #190 / Spec 26b §4) ─────────────────────

describe('Spec 26b §4 — dieIsRerollable', () => {
    it('spent and exhausted dice are rerollable', () => {
        expect(dieIsRerollable(die('a', 'body', 'spent'))).toBe(true);
        expect(dieIsRerollable(die('b', 'heart', 'exhausted'))).toBe(true);
    });

    it('x-color dice are rerollable regardless of state', () => {
        expect(dieIsRerollable(die('c', 'x', 'locked'))).toBe(true);
        expect(dieIsRerollable(die('d', 'x', 'available'))).toBe(true);
    });

    it('available non-x dice are NOT rerollable (left alone by Press Fate)', () => {
        expect(dieIsRerollable(die('e', 'body', 'available'))).toBe(false);
        expect(dieIsRerollable(die('f', 'wild', 'available'))).toBe(false);
        expect(dieIsRerollable(die('g', 'mind', 'available'))).toBe(false);
    });
});

describe('Spec 26b §4 — hasRerollableDice', () => {
    it('returns false when every die is available and non-x', () => {
        const pool = [
            die('a', 'body', 'available'),
            die('b', 'heart', 'available'),
            die('c', 'wild', 'available'),
        ];
        expect(hasRerollableDice(pool)).toBe(false);
    });

    it('returns true when at least one die is spent', () => {
        const pool = [die('a', 'body', 'available'), die('b', 'mind', 'spent')];
        expect(hasRerollableDice(pool)).toBe(true);
    });

    it('returns true when at least one die is x-color (locked)', () => {
        const pool = [die('a', 'heart', 'available'), die('b', 'x', 'locked')];
        expect(hasRerollableDice(pool)).toBe(true);
    });

    it('returns false for an empty pool', () => {
        expect(hasRerollableDice([])).toBe(false);
    });
});

describe('Spec 26b §4 — rerollSpentDice', () => {
    it('only re-rolls spent/exhausted/x dice; available non-x dice are preserved', () => {
        const pool = [
            die('a', 'heart', 'available'),
            die('b', 'body', 'spent'),
            die('c', 'x', 'locked'),
        ];
        // fixed(0) → always rolls index 0 of the bag → 'heart'
        const { dice, rerolledIds } = rerollSpentDice(pool, fixed(0));
        expect(rerolledIds).toEqual(['b', 'c']);
        const preserved = dice.find(d => d.id === 'a')!;
        expect(preserved.color).toBe('heart');
        expect(preserved.state).toBe('available');
    });

    it('rerolled die ids are preserved (same object identity key)', () => {
        const pool = [die('x1', 'body', 'spent'), die('x2', 'mind', 'exhausted')];
        const { dice, rerolledIds } = rerollSpentDice(pool, fixed(0));
        expect(rerolledIds).toHaveLength(2);
        expect(dice.map(d => d.id)).toEqual(['x1', 'x2']);
    });

    it('an x re-roll result stays locked; a stance/wild result becomes available', () => {
        // fixed(5/6) → always rolls index 5 → 'x'
        // Include a preserved stance die so the at-least-one-stance guard does NOT fire.
        const poolX = [die('a', 'body', 'spent'), die('b', 'heart', 'available')];
        const { dice: diceX } = rerollSpentDice(poolX, fixed(5 / 6));
        expect(diceX[0].color).toBe('x');
        expect(diceX[0].state).toBe('locked');
        expect(diceX[1].color).toBe('heart'); // preserved

        // fixed(0) → always rolls index 0 → 'heart'
        const poolH = [die('c', 'body', 'spent')];
        const { dice: diceH } = rerollSpentDice(poolH, fixed(0));
        expect(diceH[0].color).toBe('heart');
        expect(diceH[0].state).toBe('available');
    });

    it('guarantees at least one stance-bearing die when all re-rolled results are x', () => {
        // All three dice are rerollable; fixed(5/6) → every roll → 'x'.
        // The guard must convert the last re-rolled die to a stance color.
        const pool = [
            die('a', 'body', 'spent'),
            die('b', 'mind', 'spent'),
            die('c', 'x', 'locked'),
        ];
        const { dice } = rerollSpentDice(pool, fixed(5 / 6));
        const stanceDice = dice.filter(d => d.color === 'heart' || d.color === 'body' || d.color === 'mind');
        expect(stanceDice.length).toBeGreaterThanOrEqual(1);
    });

    it('returns empty rerolledIds and unchanged dice when nothing is rerollable', () => {
        const pool = [die('a', 'body', 'available'), die('b', 'heart', 'available')];
        const { dice, rerolledIds } = rerollSpentDice(pool, fixed(0));
        expect(rerolledIds).toEqual([]);
        expect(dice.map(d => d.state)).toEqual(['available', 'available']);
        expect(dice.map(d => d.color)).toEqual(['body', 'heart']);
    });
});

// ── Constants ────────────────────────────────────────────────────────────────

describe('Spec 25 — constants', () => {
    it('COMBAT_HAND_SIZE is the draw cap', () => {
        expect(COMBAT_HAND_SIZE).toBeGreaterThan(0);
    });
});

// ── AUTHORED_THREAT_ENEMY_IDS ─────────────────────────────────────────────────

describe('Spec 25 — AUTHORED_THREAT_ENEMY_IDS', () => {
    it('contains exactly 62 authored-threat enemy slugs', () => {
        expect(AUTHORED_THREAT_ENEMY_IDS.length).toBe(62);
    });

    it('every entry follows the "enemy-<slug>" naming convention', () => {
        for (const id of AUTHORED_THREAT_ENEMY_IDS) {
            expect(id).toMatch(/^enemy-/);
        }
    });

    it('every authored-threat enemy slug exists in the enemy registry', () => {
        const registryKeys = Object.keys(ENEMY_REGISTRY);
        for (const id of AUTHORED_THREAT_ENEMY_IDS) {
            const slug = id.replace(/^enemy-/, '');
            expect(registryKeys).toContain(slug);
        }
    });

    it('is frozen (immutable array)', () => {
        expect(Object.isFrozen(AUTHORED_THREAT_ENEMY_IDS)).toBe(true);
    });
});

// ── Hand presenter (§7) — `handCards` ────────────────────────────────────────

describe('Spec 25 §7 — handCards', () => {
    it('returns { uid, card } pairs for the opening hand (dealt by initializeCombatEncounter)', () => {
        const state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(80), undefined, SEED);
        const hand = handCards(state);
        expect(hand.length).toBe(state.hand.length);
        expect(hand.length).toBeGreaterThan(0);
        for (const entry of hand) {
            expect(typeof entry.uid).toBe('string');
            expect(entry.card).not.toBeNull();
            expect(typeof entry.card.id).toBe('string');
        }
    });

    it('uid values match state.hand slot uids (order preserved)', () => {
        const state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(80), undefined, SEED);
        const hand = handCards(state);
        expect(hand.map(h => h.uid)).toEqual(state.hand.map(h => h.uid));
    });

    it('returns empty when state.hand is empty (e.g. all cards played)', () => {
        const state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(80), undefined, SEED);
        const emptyHand = { ...state, hand: [] };
        expect(handCards(emptyHand)).toEqual([]);
    });
});

// ── Enemy threat resolver (§4.5) — `resolveThreatPhase` ─────────────────────

describe('Spec 25 §4.5 — resolveThreatPhase', () => {
    it('fires the threat (mark=overwhelmed) when enemy can act', () => {
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(100, 'heart'), undefined, SEED);
        state = rollEncounterDice(state).state;
        const result = resolveThreatPhase(state);
        const phaseEvent = result.events.find(e => e.kind === 'phase-resolved') as
            { kind: 'phase-resolved'; phaseIndex: number; mark: string } | undefined;
        expect(phaseEvent).toBeDefined();
        expect(phaseEvent!.mark).toBe('overwhelmed');
    });

    it('hinders the enemy (mark=clear) when a skipTurn effect is active on it', () => {
        const sleepEffect = lookupEffect('debuff_sleep')!;
        const player = makePlayer([DOT_BODY]);
        const enemy = makeEnemy(100, 'heart');
        const { activeEffects: enemyEffects } = applyEffect(enemy.effects, sleepEffect, 1);
        let state = initializeCombatEncounter(player, { ...enemy, effects: enemyEffects }, undefined, SEED);
        state = rollEncounterDice(state).state;
        const result = resolveThreatPhase(state);
        const phaseEvent = result.events.find(e => e.kind === 'phase-resolved') as
            { kind: 'phase-resolved'; phaseIndex: number; mark: string } | undefined;
        expect(phaseEvent!.mark).toBe('clear');
    });

    it('is a no-op (returns same state) when combat is already complete', () => {
        const state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(100), undefined, SEED);
        const complete = { ...state, phase: 'complete' as const, finalOutcome: 'victory' as const };
        const result = resolveThreatPhase(complete);
        expect(result.state).toBe(complete);
        expect(result.events).toEqual([]);
    });

    it('weakens (but does not deny) the threat when rollPenalty < THREAT_DENY_AT', () => {
        const confusionEffect = lookupEffect('debuff_confusion')!;
        const player = makePlayer([DOT_BODY]);
        const enemy = makeEnemy(100, 'heart');
        const { activeEffects: enemyEffects } = applyEffect(enemy.effects, confusionEffect, 1);

        let baseState = initializeCombatEncounter(player, makeEnemy(100, 'heart'), undefined, SEED);
        baseState = rollEncounterDice(baseState).state;
        const baseResult = resolveThreatPhase(baseState);

        let weakenState = initializeCombatEncounter(player, { ...enemy, effects: enemyEffects }, undefined, SEED);
        weakenState = rollEncounterDice(weakenState).state;
        const weakenResult = resolveThreatPhase(weakenState);

        const weakenPhaseEvent = weakenResult.events.find(e => e.kind === 'phase-resolved') as
            { kind: 'phase-resolved'; phaseIndex: number; mark: string } | undefined;
        expect(weakenPhaseEvent!.mark).toBe('overwhelmed');
        expect(weakenResult.state.player.health).toBeLessThan(player.health);
        expect(weakenResult.state.player.health).toBeGreaterThan(baseResult.state.player.health);
    });

    it('denies the threat via soft-control when rollPenalty >= THREAT_DENY_AT', () => {
        const confusionEffect = lookupEffect('debuff_confusion')!;
        const fearEffect = lookupEffect('debuff_fear')!;
        const player = makePlayer([DOT_BODY]);
        const enemy = makeEnemy(100, 'heart');
        const { activeEffects: withConfusion } = applyEffect(enemy.effects, confusionEffect, 1);
        const { activeEffects: enemyEffects } = applyEffect(withConfusion, fearEffect, 1);

        let state = initializeCombatEncounter(player, { ...enemy, effects: enemyEffects }, undefined, SEED);
        state = rollEncounterDice(state).state;
        const result = resolveThreatPhase(state);

        const phaseEvent = result.events.find(e => e.kind === 'phase-resolved') as
            { kind: 'phase-resolved'; phaseIndex: number; mark: string } | undefined;
        expect(phaseEvent!.mark).toBe('clear');
        expect(result.state.player.health).toBe(player.health);
    });
});

// ── Soft-control threat tunable contracts ────────────────────────────────────

describe('Soft-control threat tunables — contract values', () => {
    it('THREAT_WEAKEN_PER_ROLL is 0.06', () => {
        expect(THREAT_WEAKEN_PER_ROLL).toBe(0.06);
    });

    it('THREAT_DENY_AT is 8', () => {
        expect(THREAT_DENY_AT).toBe(8);
    });

    it('THREAT_WEAKEN_FLOOR is 0.4', () => {
        expect(THREAT_WEAKEN_FLOOR).toBe(0.4);
    });

    it('floor never binds at current tunables: 1 - THREAT_DENY_AT * THREAT_WEAKEN_PER_ROLL > THREAT_WEAKEN_FLOOR', () => {
        const weakenAtDenyThreshold = 1 - THREAT_DENY_AT * THREAT_WEAKEN_PER_ROLL;
        expect(weakenAtDenyThreshold).toBeGreaterThan(THREAT_WEAKEN_FLOOR);
    });
});

// ── Attribution ledger (§7.7) — `recordAttribution` ─────────────────────────

describe('Spec 25 §7.7 — recordAttribution field shape', () => {
    it('creates a new CombatAttributionRow with all required fields', () => {
        const ledger = recordAttribution({}, 'slippery-slope', 'Slippery Slope', null, 10);
        const row: CombatAttributionRow = ledger['slippery-slope'];
        expect(row.cardId).toBe('slippery-slope');
        expect(row.name).toBe('Slippery Slope');
        expect(row.dotDamage).toBe(0);
        expect(row.damageDealt).toBe(10);
        expect(row.phases).toBe(1);
    });

    it('accumulates damageDealt and phases across multiple calls for the same card', () => {
        let ledger = recordAttribution({}, 'slippery-slope', 'Slippery Slope', null, 5);
        ledger = recordAttribution(ledger, 'slippery-slope', 'Slippery Slope', null, 8);
        const row = ledger['slippery-slope'];
        expect(row.damageDealt).toBe(13);
        expect(row.phases).toBe(2);
    });

    it('tracks separate rows for different cards in the same ledger', () => {
        let ledger = recordAttribution({}, 'slippery-slope', 'Slippery Slope', null, 5);
        ledger = recordAttribution(ledger, 'achilles-gambit', 'Achilles Gambit', null, 12);
        expect(Object.keys(ledger)).toHaveLength(2);
        expect(ledger['slippery-slope'].damageDealt).toBe(5);
        expect(ledger['achilles-gambit'].damageDealt).toBe(12);
    });
});

// ── Post-combat summary (§7.7) — `buildCombatSummary` ───────────────────────

describe('Spec 25 §7.7 — buildCombatSummary field shape', () => {
    it('returns a CombatSummary with correct outcome, headline, and directDamage', () => {
        const state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(100), undefined, SEED);
        const complete = {
            ...state,
            phase: 'complete' as const,
            finalOutcome: 'victory' as const,
            directDamageDealt: 30,
            attribution: recordAttribution({}, DOT_BODY, 'Slippery Slope', null, 20),
        };
        const summary = buildCombatSummary(complete);
        expect(summary.outcome).toBe('victory');
        expect(summary.headline).toMatch(/Victory/);
        expect(summary.directDamage).toBe(30);
    });

    it('rows carry all CombatAttributionRow fields (cardId, name, dotDamage, damageDealt, phases)', () => {
        const ledger = recordAttribution({}, DOT_BODY, 'Slippery Slope', null, 15);
        const state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(100), undefined, SEED);
        const complete = {
            ...state,
            phase: 'complete' as const,
            finalOutcome: 'victory' as const,
            directDamageDealt: 0,
            attribution: ledger,
        };
        const summary = buildCombatSummary(complete);
        expect(summary.rows).toHaveLength(1);
        const row = summary.rows[0];
        expect(row.cardId).toBe(DOT_BODY);
        expect(row.name).toBe('Slippery Slope');
        expect(typeof row.dotDamage).toBe('number');
        expect(row.damageDealt).toBe(15);
        expect(row.phases).toBe(1);
    });

    it('rows are sorted descending by damageDealt and bestCard names the top contributor', () => {
        let ledger = recordAttribution({}, DOT_BODY, 'Slippery Slope', null, 5);
        ledger = recordAttribution(ledger, DAMAGE_BODY, 'Achilles Gambit', null, 20);
        const state = initializeCombatEncounter(makePlayer([DOT_BODY, DAMAGE_BODY]), makeEnemy(100), undefined, SEED);
        const complete = {
            ...state,
            phase: 'complete' as const,
            finalOutcome: 'victory' as const,
            directDamageDealt: 0,
            attribution: ledger,
        };
        const summary = buildCombatSummary(complete);
        expect(summary.rows[0].cardId).toBe(DAMAGE_BODY);
        expect(summary.rows[1].cardId).toBe(DOT_BODY);
        expect(summary.bestCard).toBe('Achilles Gambit');
    });

    it('returns an empty rows array and empty bestCard when attribution ledger is empty', () => {
        const state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(100), undefined, SEED);
        const complete = {
            ...state,
            phase: 'complete' as const,
            finalOutcome: 'defeat' as const,
            directDamageDealt: 0,
            attribution: {},
        };
        const summary = buildCombatSummary(complete);
        expect(summary.rows).toEqual([]);
        expect(summary.bestCard).toBe('');
        expect(summary.outcome).toBe('defeat');
    });
});

describe('isGoldCard / GOLD_CARD_IDS', () => {
    it('GOLD_CARD_IDS contains exactly 3 members', () => {
        expect(GOLD_CARD_IDS.size).toBe(3);
    });

    it('returns true for each of the 3 gold card ids', () => {
        for (const id of GOLD_CARD_IDS) {
            expect(isGoldCard(id)).toBe(true);
        }
    });

    it('returns false for a non-gold card id', () => {
        expect(isGoldCard('slippery-slope')).toBe(false);
    });

    it('returns false for an empty string', () => {
        expect(isGoldCard('')).toBe(false);
    });
});
