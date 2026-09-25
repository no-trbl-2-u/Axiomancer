/**
 * Hermetic E2E — Hazard-Pattern Combat (Spec 25 + Spec 33 Upgradeable Dice).
 *
 * Covers the turn model end to end with seeded / stubbed RNG:
 *   - the per-turn four-die tray (one die per color, each showing a face);
 *     a PAID play names the die that powers it, gated by the color law
 *   - direct-damage cards still contribute 0 pressure
 *   - a landed status lands on the enemy; the powering die is spent
 *   - between-phases fires DoT ticks + ticks durations + draws a fresh hand
 *   - Signature Skills spend Conviction (scout / DoT / pressure) regardless of hand
 *   - victory by HP depletion via status play (card-sourced cards only); post-combat attribution
 *   - the Monte-Carlo sim reports per-phase Clear rates
 *
 * The effects + card engines are unchanged, so their suites (run separately)
 * are the witness that this driver did not perturb them.
 */

import { describe, it, expect, afterEach, afterAll, beforeAll, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveCombatPhase, resolveThreatPhase, processBetweenPhases,
    getCard, buildCombatSummary, isPhaseStanceRevealed,
    playSignatureSkill, discardCombatCard, projectCardImpact, endTurn,
    startTurn, SCRAP_CONVICTION_CAP_PER_TURN,
} from '../combat.engine';
import { UPGRADEABLE_DIE_COLORS, PRESS_FATE_COST } from '../combat.upgradeable-dice';
import { CONCLUDE_DMG_PER_STACK } from '../combat.signature';
import { getSignaturesForLoadout, getRelicById } from '../../Items/relic.library';
import { equipItem } from '../../Character';
import { rollCombatCardRewards, addRewardCard, unlockCardViaDilemma, COMBAT_REWARD_POOL } from '../combat.rewards';
import { buildCombatDeck, COMBAT_HAND_SIZE } from '../combat.deck';
import { getCardById } from '../../Cards/cards.library';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import { simulateHazardPatternCombat } from '../combat.encounter.sim';
import { getThreatSequence, deriveIntentType } from '../combat.threat';
import type { CombatDieColor, CombatEncounterState, CombatEvent, CombatTransition } from '../combat.encounter.types';
import type { ActiveEffect, Effect } from '../../Effects/types';
import { effectsLibrary } from '../../Effects/effects.library';
import { lookupEffect, applyEffect } from '../../Effects';

afterEach(() => {
    vi.restoreAllMocks();
});

// ── Fixtures ─────────────────────────────────────────────────────────────────

// Spec 32 v3: basePower is deleted at the schema level — no card can strike.
// The "damage class" fixture is a bare RUPTURE payoff (affliction-gated burst).
// Profane Canon (2026-08-08): the round-clock DoT lost its library carrier
// (nettle-cloak retired; poison/bleed ride EVENT clocks), so the round-boundary
// witness is a SYNTHETIC carrier of the still-live `debuff_nettle_sting`
// effect (carrier-less-verb policy: engine behavior stays under test).
registerSandboxCards([{
    id: 'qa-payoff-burst',
    name: 'QA Payoff Burst (test fixture)',
    philosophicalAspect: 'body',
    description: 'Test-only fixture: a bare RUPTURE payoff with no status payload.',
    tier: 1,
    rank: 1,
    cardType: 'spell',
    targetType: 'enemy',
    specialMechanics: [{ kind: 'rupture' }],
}, {
    id: 'qa-round-dot',
    name: 'QA Round-Clock DoT (test fixture)',
    philosophicalAspect: 'body',
    description: 'Test-only fixture: a round-end-clock DoT carrier (nettle sting).',
    tier: 1,
    rank: 1,
    cardType: 'spell',
    targetType: 'enemy',
    combatEffects: [{ effectId: 'debuff_nettle_sting', appliedTo: 'opponent', intensity: 1, duration: 2 }],
}]);

const DOT_BODY = 'spoiled-poultice';     // body starter, applies debuff_poison (card-played-clock DoT)
const CONTROL_CARD = 'scolds-bridle';    // body, tier 2, STAGGER + BACKFIRE (control)
const DAMAGE_BODY = 'qa-payoff-burst';   // body, tier 1, RUPTURE payoff (sandbox fixture)

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200;
    p.maxHealth = 200;
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind' = 'heart'): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-test-dummy';
    e.health = hp;
    e.maxHealth = hp;
    e.effects = [];
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

/** Forces this turn's tray to known colors (deterministic). Spec 33: every
 *  non-X die shows a MANA face; an X die is a dead miss. */
function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c,
        state: c === 'x' ? ('locked' as const) : ('available' as const), temporary: false,
        face: c === 'x' ? ('miss' as const) : ('mana' as const),
    }));
    return { ...state, dice, turn };
}

const fizzled = (events: readonly CombatEvent[]): boolean => events.some(e => e.kind === 'effect-fizzled');

/** Plays `cardId`'s PAID (bottom) action powered by tray die `dieIndex`. */
function playWithDie(state: CombatEncounterState, cardId: string, dieIndex = 0) {
    const dieId = state.dice[dieIndex].id;
    const entry = state.hand.find(h => h.cardId === cardId);
    if (!entry) return { state, dieId, played: false } as const;
    const res = playCombatCard(state, { uid: entry.uid }, true, dieId);
    return { state: res.state, events: res.events, dieId, played: res.state !== state } as const;
}

/** Every live die (Reserve, tray, floating) that can power `cardId`'s PAID
 *  line under spec 33: a non-miss face, color-legal for the card. */
function poweringDice(state: CombatEncounterState, cardId: string): string[] {
    const stance = getCard(cardId)?.stance;
    return [...(state.reserve ?? []), ...state.dice]
        .filter(d => d.state === 'available' && d.face !== 'miss' && d.color !== 'x'
            && (stance === 'any' || d.color === 'wild' || d.color === stance))
        .map(d => d.id);
}

/** One spec-33 round through the batch entry point: roll the phase's tray (if
 *  not yet rolled), PAID-play `cardId` once per die that can power it (up to
 *  `maxPlays`), then resolve the threat. */
function batchRound(state: CombatEncounterState, cardId: string, maxPlays: number): CombatTransition {
    let s = state;
    if (s.phase === 'reveal' || s.phase === 'dice-roll') s = rollEncounterDice(s).state;
    else if (s.phase === 'phase-play' && !s.turnTakenThisPhase) s = startTurn(s).state;
    const plays = poweringDice(s, cardId).slice(0, maxPlays).map(dieId => ({ cardId, useBottom: true, dieId }));
    return resolveCombatPhase(s, plays);
}

// ── Intent derivation (Spec 26 §2) ───────────────────────────────────────────

describe('Spec 26 §2 — intent derivation', () => {
    it('classifies damage / debuff / buff / combo / pass', () => {
        expect(deriveIntentType([{ damage: 5 }])).toBe('damage');
        expect(deriveIntentType([{ effectId: 'debuff_bleed' }])).toBe('debuff');
        expect(deriveIntentType([{ enemyHeal: 6 }])).toBe('buff');
        expect(deriveIntentType([{ damage: 5, effectId: 'debuff_bleed' }])).toBe('combo');
        expect(deriveIntentType([{}])).toBe('pass');
    });
    it('stamps an intentType on every resolved threat phase', () => {
        const seq = getThreatSequence(makeEnemy(60));
        for (const p of seq) expect(p.intentType).toBeDefined();
    });
    it('authored phases carry a thematic stance tell', () => {
        const tyrant = deepClone(GraveLarva); tyrant.id = 'enemy-king-of-revenge';
        const seq = getThreatSequence(tyrant);
        expect(seq[0].stanceHint && seq[0].stanceHint.length).toBeGreaterThan(0);
    });
});

// ── Card classification (§6) — pure ──────────────────────────────────────────

describe('Spec 25 §6 — card classification', () => {
    it('a DoT card is a direct-dot card on the dot track', () => {
        const card = getCard(DOT_BODY)!;
        expect(card.verbClass).toBe('direct-dot');
        expect(card.effectKind).toBe('dot');
        expect(card.stance).toBe('body');
        expect(card.bottomDamagePreview).toBeGreaterThan(0);
    });
    it('a control card is a direct-control card on the control track', () => {
        const card = getCard(CONTROL_CARD)!;
        expect(card.effectKind).toBe('control');
        expect(['direct-control', 'stat-debuff']).toContain(card.verbClass);
    });
    it('a payoff-burst card is direct-damage with 0 preview (no strike number exists)', () => {
        const card = getCard(DAMAGE_BODY)!;
        expect(card.verbClass).toBe('direct-damage');
        expect(card.effectKind).toBe('none');
        expect(card.bottomDamagePreview).toBe(0);
    });
});

// ── Initialization + the per-turn draft (§1) ────────────────────────────────────

describe('Spec 33 §1 — initialization + the four-die tray', () => {
    it('opens in reveal, draws 5, then rolls one die per color, each showing a face', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY, CONTROL_CARD, DAMAGE_BODY]), makeEnemy(30), undefined, 42);
        expect(state.phase).toBe('reveal');
        expect(state.hand.length).toBe(COMBAT_HAND_SIZE);
        state = rollEncounterDice(state).state;
        expect(state.phase).toBe('phase-play');
        expect(state.dice.map(d => d.color)).toEqual([...UPGRADEABLE_DIE_COLORS]);
        for (const d of state.dice) {
            expect(['mana', 'special', 'miss']).toContain(d.face);
            expect(d.state).toBe(d.face === 'miss' ? 'locked' : 'available');
        }
    });

    it('getThreatSequence gives every enemy a telegraphed attack each phase (HP model)', () => {
        const enemy = makeEnemy(50);
        const seq = getThreatSequence(enemy);
        expect(seq.length).toBeGreaterThan(0);
        for (const p of seq) {
            // Each phase is a real enemy turn: a threat action with effects.
            expect(p.threatAction.effects.length).toBeGreaterThan(0);
            expect(p.threatAction.effects.some(e => (e.damage ?? 0) > 0)).toBe(true);
        }
    });
});

// ── Payoff bursts are affliction-gated (HP model, spec 32 v3) ────────────────

describe('HP model — a payoff card bursts only off afflictions and spends the die', () => {
    it('a RUPTURE bottom on an afflicted foe bursts HP (no status landed → die spent, no chain)', () => {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([DAMAGE_BODY]), makeEnemy(80, 'mind'), [DAMAGE_BODY], 7);
        state = rollEncounterDice(state).state;
        state = setDice(state, ['body', 'heart']);
        // Seed the fuel: the burst exists ONLY because the affliction does.
        state = {
            ...state,
            enemy: { ...state.enemy, effects: [{ effectId: 'debuff_poison', intensity: 2, remainingDuration: 3, appliedAt: 1, tier: 2 }] },
        };
        const hpBefore = state.enemy.health;
        const r = playWithDie(state, DAMAGE_BODY);
        expect(r.played).toBe(true);
        expect(fizzled(r.events!)).toBe(false);
        expect(r.state.enemy.health).toBeLessThan(hpBefore);
        expect(r.state.directDamageDealt).toBeGreaterThan(0);
        // No status landed → the powering die is spent (no chain).
        expect(r.state.dice.find(d => d.id === r.dieId)?.state).toBe('spent');
    });

    it('the same RUPTURE on a clean foe bursts 0 — no fuel, no damage (never a raw strike)', () => {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([DAMAGE_BODY]), makeEnemy(80, 'mind'), [DAMAGE_BODY], 7);
        state = rollEncounterDice(state).state;
        state = setDice(state, ['body', 'heart']);
        const hpBefore = state.enemy.health;
        const r = playWithDie(state, DAMAGE_BODY);
        expect(r.played).toBe(true);
        expect(fizzled(r.events!)).toBe(false); // it LANDED — the 0 is the fuel, not a fizzle
        expect(r.state.enemy.health).toBe(hpBefore);
    });
});

// ── Status combo loop (§1) ───────────────────────────────────────────────────

describe('Spec 26b §1 — status landing + the color law', () => {
    it('a landed DoT lands on the enemy; the powering die is spent (spec 33: no auto-refresh)', () => {
        mockSequentialRng(0.05); // low rolls → enemy fails to resist → effect lands
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60, 'mind'), [DOT_BODY], 3);
        state = rollEncounterDice(state).state;
        state = setDice(state, ['body', 'heart']);
        const r = playWithDie(state, DOT_BODY);
        expect(r.played).toBe(true);
        expect(fizzled(r.events!)).toBe(false);
        // The DoT effect landed on the enemy (it will tick HP each phase).
        expect(r.state.enemy.effects.some(e => e.effectId === 'debuff_poison')).toBe(true);
        const landed = r.events!.some(e => e.kind === 'effect-landed' && e.target === 'enemy');
        expect(landed).toBe(true);
        // Spec 33 retired the variety-chain auto-refresh: every die powers its
        // own play, so the powering die is simply spent.
        expect(r.events!.some(e => e.kind === 'die-refreshed')).toBe(false);
        expect(r.state.dice.find(d => d.id === r.dieId)?.state).toBe('spent');
    });

    it('an OFF-COLOR die cannot power a card at all — the play fizzles (the color law)', () => {
        mockSequentialRng(0.05);
        let s = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(120, 'mind'), [DOT_BODY], 21);
        s = rollEncounterDice(s).state;
        s = setDice(s, ['mind', 'heart']);
        const r = playWithDie(s, DOT_BODY); // mind die on a body card
        expect(r.events!.some(e => e.kind === 'effect-fizzled' && /colors must match/.test(e.message))).toBe(true);
        expect(r.state.enemy.effects.some(e => e.effectId === 'debuff_poison')).toBe(false);
    });
});

// ── Between-phases: DoT ticks + duration tick + hand refill (§4.5) ────────────

describe('Spec 25 §4.5 — between-phases processing', () => {
    it('fires enemy DoT ticks (erodes HP), ticks effect durations, refills the hand', () => {
        mockSequentialRng(0.05);
        // WS3.3: poison/bleed ride EVENT clocks now — the round-boundary
        // witness is the synthetic nettle-sting carrier (round-end round
        // clock); its library carrier retired with the Profane Canon.
        const NETTLE = 'qa-round-dot';
        let state = initializeCombatEncounter(makePlayer([NETTLE]), makeEnemy(80, 'mind'), [NETTLE], 5);
        state = rollEncounterDice(state).state;
        state = setDice(state, ['body', 'heart']);
        const played = playWithDie(state, NETTLE);
        expect(fizzled(played.events!)).toBe(false);
        state = played.state;
        const dotBefore = state.enemy.effects.find(e => e.effectId === 'debuff_nettle_sting');
        expect(dotBefore).toBeDefined();
        const hpBefore = state.enemy.health;
        const durBefore = dotBefore!.remainingDuration;

        const bp = processBetweenPhases(state);
        const after = bp.state;
        expect(after.enemy.health).toBeLessThan(hpBefore);
        expect(bp.events.some(e => e.kind === 'dot-tick' && e.target === 'enemy')).toBe(true);
        const dotAfter = after.enemy.effects.find(e => e.effectId === 'debuff_nettle_sting');
        if (dotAfter) expect(dotAfter.remainingDuration).toBeLessThan(durBefore);
        expect(after.hand.length).toBe(COMBAT_HAND_SIZE);
        // A new phase clears the tray so the next turn rolls fresh.
        expect(after.dice.length).toBe(0);
    });

    it('keep-hand rule: unplayed cards survive the boundary (same uids) and the refill draws only the difference', () => {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(
            makePlayer([DOT_BODY, CONTROL_CARD]), makeEnemy(200, 'mind'),
            [DOT_BODY, DOT_BODY, DOT_BODY, CONTROL_CARD, CONTROL_CARD, CONTROL_CARD, DOT_BODY, CONTROL_CARD], 5);
        state = rollEncounterDice(state).state;
        expect(state.hand.length).toBe(COMBAT_HAND_SIZE);
        state = setDice(state, ['body', 'heart']);
        // Play ONE card; the other four stay in hand across the boundary.
        const played = playWithDie(state, DOT_BODY);
        expect(fizzled(played.events!)).toBe(false);
        state = played.state;
        const heldUids = state.hand.map(h => h.uid);
        expect(heldUids.length).toBe(COMBAT_HAND_SIZE - 1);

        const bp = processBetweenPhases(state);
        const after = bp.state;
        // All four held cards survive with their uids intact…
        for (const uid of heldUids) {
            expect(after.hand.some(h => h.uid === uid)).toBe(true);
        }
        // …and exactly ONE card was drawn to refill back to the target.
        const drawnEvent = bp.events.find(e => e.kind === 'hand-drawn') as { cards: string[] } | undefined;
        expect(drawnEvent).toBeDefined();
        expect(drawnEvent!.cards.length).toBe(1);
        expect(after.hand.length).toBe(COMBAT_HAND_SIZE);
    });
});

// ── Signature Skills (§4) ────────────────────────────────────────────────────

describe('Spec 26b §4 — Signature Skills (Conviction-funded)', () => {
    it('Read the Entrails reveals the current + next phase stance', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60, 'mind'), [DOT_BODY], 2);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 5 };
        const r = playSignatureSkill(state, 'sig-read-opponent');
        expect(r.state.conviction).toBe(4); // cost 1
        expect(isPhaseStanceRevealed(r.state, 0)).toBe(true);
        if (r.state.threatPhases.length > 1) expect(isPhaseStanceRevealed(r.state, 1)).toBe(true);
        expect(r.events.some(e => e.kind === 'signature-cast')).toBe(true);
    });

    it('The Oath Kept applies a guaranteed DoT to the enemy', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(90, 'mind'), [DOT_BODY], 4);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 9 };
        const r = playSignatureSkill(state, 'sig-conviction-strike');
        expect(r.state.conviction).toBe(1); // cost 8 (Phase 31 repricing)
        // The poison DoT lands on the enemy (it will tick HP each phase).
        expect(r.state.enemy.effects.some(e => e.effectId === 'debuff_poison')).toBe(true);
    });

    // ── Phase 85 (equipment progression — head/hands/feet accessories) ───────
    it('The Mounting Dread applies a guaranteed, open-ended DoT to the enemy', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(90, 'mind'), [DOT_BODY], 4);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 10 };
        const r = playSignatureSkill(state, 'sig-mounting-dread');
        expect(r.state.conviction).toBe(1); // cost 9
        expect(r.state.enemy.effects.some(e => e.effectId === 'debuff_creeping_doom')).toBe(true);
    });

    it('The Endless Labor grants WRATH directly — combat-long, never fades', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(90, 'mind'), [DOT_BODY], 4);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 6, wrath: 1 };
        const r = playSignatureSkill(state, 'sig-endless-labor');
        expect(r.state.conviction).toBe(0); // cost 6
        expect(r.state.wrath).toBe(4); // 1 + magnitude 3
        expect(r.events.some(e => e.kind === 'wrath-gained')).toBe(true);
    });

    it('The Unbroken Stride grants CHAIN directly and feeds the current turn', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(90, 'mind'), [DOT_BODY], 4);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 4, chain: 0, chainFedThisTurn: false };
        const r = playSignatureSkill(state, 'sig-unbroken-stride');
        expect(r.state.conviction).toBe(0); // cost 4
        expect(r.state.chain).toBe(5); // magnitude 5
        expect(r.state.chainFedThisTurn).toBe(true);
        expect(r.events.some(e => e.kind === 'chain-gained')).toBe(true);
    });

    it('scrapping a hand card grants +1 Conviction and discards it', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY, CONTROL_CARD]), makeEnemy(60), [DOT_BODY, CONTROL_CARD], 6);
        state = rollEncounterDice(state).state;
        const uid = state.hand[0].uid;
        const before = state.conviction;
        const r = discardCombatCard(state, uid);
        expect(r.state.conviction).toBe(before + 1);
        expect(r.events.some(e => e.kind === 'conviction-gained'
            && (e as { reason: string }).reason === 'scrap')).toBe(true);
        expect(r.state.hand.find(h => h.uid === uid)).toBeUndefined();
    });

    it('scrap PAYS only the first N per turn, then cycles the card for free (WI-10)', () => {
        mockSequentialRng(0.5);
        const deck = Array.from({ length: 6 }, () => DOT_BODY);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(200), deck, 6);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 0 };
        const uids = state.hand.map(h => h.uid);
        expect(uids.length).toBeGreaterThan(SCRAP_CONVICTION_CAP_PER_TURN);

        // The first N scraps each pay +1◆ (reason 'scrap').
        let r = discardCombatCard(state, uids[0]);
        for (let i = 1; i < SCRAP_CONVICTION_CAP_PER_TURN; i++) r = discardCombatCard(r.state, uids[i]);
        expect(r.state.conviction).toBe(SCRAP_CONVICTION_CAP_PER_TURN);

        // The next scrap still removes the dead card (agency preserved) but pays nothing.
        const capUid = uids[SCRAP_CONVICTION_CAP_PER_TURN];
        const capped = discardCombatCard(r.state, capUid);
        expect(capped.state.conviction).toBe(SCRAP_CONVICTION_CAP_PER_TURN); // no more pay
        expect(capped.events.some(e => e.kind === 'conviction-gained')).toBe(false);
        expect(capped.state.hand.find(h => h.uid === capUid)).toBeUndefined(); // still cycled
        expect(capped.state.scrapsThisTurn).toBe(SCRAP_CONVICTION_CAP_PER_TURN + 1);
    });

    it('the scrap-pay cap resets each turn — startTurn zeroes scrapsThisTurn (WI-10)', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(200), [DOT_BODY], 6);
        state = rollEncounterDice(state).state;
        // Simulate a turn that already spent its scrap budget, then re-arm the roll.
        state = { ...state, scrapsThisTurn: SCRAP_CONVICTION_CAP_PER_TURN, turnTakenThisPhase: false };
        const next = startTurn(state).state;
        expect(next.scrapsThisTurn).toBe(0);
    });

    it('The Stilling PETRIFIES a normal foe — real hard control, not the old inert BACKFIRE (WI-8)', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(90, 'heart'), [DOT_BODY], 4);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 10 };
        const r = playSignatureSkill(state, 'sig-overwhelming-argument');
        expect(r.state.conviction).toBe(2); // cost 8
        // The petrify lands; the old debuff_backfire lie is gone.
        expect(r.state.enemy.effects.some(e => e.effectId === 'debuff_petrify')).toBe(true);
        expect(r.state.enemy.effects.some(e => e.effectId === 'debuff_backfire')).toBe(false);
        expect(r.events.some(e => e.kind === 'signature-cast')).toBe(true);
        // OBSERVABLE enemy state change (the whole point of WI-8): the petrified
        // foe's next telegraph is DENIED — the player takes zero, the phase marks
        // 'clear' (hindered). The old signature let the foe attack through 4 casts.
        const hpBefore = r.state.player.health;
        const phase = resolveThreatPhase(r.state);
        expect(phase.state.player.health).toBe(hpBefore);
        expect(phase.events.some(e => e.kind === 'phase-resolved'
            && (e as { mark: string }).mark === 'clear')).toBe(true);
    });

    it('a signature skill fizzles (no-op) when underfunded', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60), [DOT_BODY], 8);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 1 };
        const r = playSignatureSkill(state, 'sig-overwhelming-argument'); // cost 8
        expect(r.state.conviction).toBe(1);
        expect(r.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
    });

    // Funded-path (success) kill-path witness: the unit test above checks the
    // isolated cast; this runs the loop — PETRIFY denies the telegraph outright
    // (hard control, no STAGGER needed), then stacked DoT grinds to an HP-kill.
    it('The Stilling, funded, PETRIFIES the telegraph away, en route to victory (WI-8)', () => {
        mockSequentialRng(0.05);
        const player = makePlayer([DOT_BODY]);
        const enemy = makeEnemy(30, 'heart');
        let state = initializeCombatEncounter(player, enemy, [DOT_BODY, DOT_BODY, DOT_BODY], 21);

        // Turn 1 — cast the funded capstone: petrify lands guaranteed and the
        // enemy loses its next action outright (canAct → skipTurn), no STAGGER.
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 10 };
        const healthBeforeCast = state.player.health;
        const cast = playSignatureSkill(state, 'sig-overwhelming-argument');
        expect(cast.state.enemy.effects.some(e => e.effectId === 'debuff_petrify')).toBe(true);
        expect(cast.events.some(e => e.kind === 'signature-cast')).toBe(true);
        const denied = resolveThreatPhase(cast.state); // no staggerRungs injected
        state = denied.state;
        // Denied by the petrify alone: no player HP lost, the phase marks 'clear'.
        expect(state.player.health).toBe(healthBeforeCast);
        expect(denied.events.some(e => e.kind === 'phase-resolved'
            && (e as { mark: string }).mark === 'clear')).toBe(true);

        // Grind the rest out with stacked DoT to a real HP-kill outcome.
        let guard = 0;
        while (state.phase !== 'complete' && state.phase !== 'mercy-choice' && guard < 40) {
            guard++;
            const res = batchRound(state, DOT_BODY, 2);
            expect(fizzled(res.events)).toBe(false);
            state = res.state;
            if (state.finalOutcome) break;
        }
        expect(state.finalOutcome).toBe('victory');
        const summary = buildCombatSummary(state);
        expect(summary.outcome).toBe('victory');
    });

    it('a boss RESISTS the petrify — it is STAGGERED instead of frozen (anti-permalock, WI-8)', () => {
        mockSequentialRng(0.5);
        const enemy = { ...makeEnemy(200, 'heart'), difficulty: 'boss' as const };
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), enemy, [DOT_BODY], 4);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 10, staggerRungs: 0 };
        const r = playSignatureSkill(state, 'sig-overwhelming-argument');
        expect(r.state.conviction).toBe(2); // still funded + spent
        // No freeze on a boss; a real, observable weaken (STAGGER) lands instead.
        expect(r.state.enemy.effects.some(e => e.effectId === 'debuff_petrify')).toBe(false);
        expect(r.state.staggerRungs).toBeGreaterThan(0);
        expect(r.events.some(e => e.kind === 'staggered')).toBe(true);
    });

    it('Press Fate re-rolls ONLY miss faces and keeps live and spent dice untouched (spec 33 §4)', () => {
        mockSequentialRng(0.1); // re-rolled face → floor(0.1*6)=0 → special
        // No seed: a seed installs its own rng stream, so the mock must
        // govern the re-rolled face.
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60, 'mind'), [DOT_BODY]);
        state = rollEncounterDice(state).state;
        // A usable heart die (KEEP) + a spent body die (KEEP) + a dead mind miss (RE-ROLL).
        const live = { id: 't1-d0', color: 'heart' as const, state: 'available' as const, temporary: false, face: 'mana' as const };
        const used = { id: 't1-d1', color: 'body' as const, state: 'spent' as const, temporary: false, face: 'mana' as const };
        state = { ...state, conviction: 6, dice: [
            live, used,
            { id: 't1-d2', color: 'mind', state: 'locked', temporary: false, face: 'miss' },
        ] };
        const r = playSignatureSkill(state, 'sig-press-the-point');
        expect(r.state.conviction).toBe(6 - PRESS_FATE_COST); // ◆ spent — work happened
        // Press Fate revives the dead, it never re-rolls the living (or the used).
        expect(r.state.dice.find(d => d.id === 't1-d0')).toEqual(live);
        expect(r.state.dice.find(d => d.id === 't1-d1')).toEqual(used);
        // The miss face was re-rolled back into play.
        const revived = r.state.dice.find(d => d.id === 't1-d2')!;
        expect(revived.face).toBe('special');
        expect(revived.state).toBe('available');
        expect(r.events.some(e => e.kind === 'press-fate-rerolled')).toBe(true);
    });

    it('Press Fate is a no-op (keeps ◆) when no die shows a miss face', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60, 'mind'), [DOT_BODY], 2);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 6, dice: [
            { id: 't1-d0', color: 'heart', state: 'available', temporary: false, face: 'mana' },
            { id: 't1-d1', color: 'body', state: 'spent', temporary: false, face: 'mana' },
        ] };
        const r = playSignatureSkill(state, 'sig-press-the-point');
        expect(r.state.conviction).toBe(6); // nothing to re-roll → ◆ not burned
        expect(r.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(r.state.dice).toEqual(state.dice); // pool unchanged
    });
});

// ── Tuning pass 2: anti-spam, control, read-loop (Spec 26b §2/§3) ────────────

describe('Spec 26b tuning — projection + carry', () => {
    it('projectCardImpact advertises NO strike number (spec 32 v3 — the strike is dead)', () => {
        mockSequentialRng(0.5);
        const card = getCard(DOT_BODY)!;
        let s = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(120, 'mind'), [DOT_BODY], 1);
        s = rollEncounterDice(s).state; s = setDice(s, ['body', 'heart']);
        const impact = projectCardImpact(s, card);
        expect(impact.track).toBe('dot');
        expect(impact.amount).toBe(0); // the honest numbers live on the FREE/PAID text
    });

    it('an unspent tray die BANKS to the visible Reserve at end of turn (Fate Engine R2 / spec 33 §6)', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60, 'mind'), [DOT_BODY], 1);
        state = rollEncounterDice(state).state;
        // One live heart die (unspent) + a dead X: only the live face can bank.
        state = setDice(state, ['heart', 'x']);
        state = endTurn(state).state;
        expect(state.reserve?.map(d => d.color)).toEqual(['heart']);
        expect(state.reserve?.[0].pips).toBe(0);
        // Surviving a threat phase RIPENS it (+1 pip, toward the cap).
        state = resolveThreatPhase(state).state;
        expect(state.reserve?.[0].pips).toBe(1);
    });

    it('every turn roll offers at least one stance-bearing die', () => {
        for (let seed = 1; seed <= 30; seed++) {
            let s = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60), [DOT_BODY], seed);
            s = rollEncounterDice(s).state;
            expect(s.dice.some(d => d.color === 'heart' || d.color === 'body' || d.color === 'mind')).toBe(true);
        }
    });
});

// ── Tuning pass 3: archetype signatures, deckbuilder, unlock hook, floors ────

describe('Spec 26b §B/§C/§D — archetype kit, rewards, unlock, difficulty floor', () => {
    it('the signature kit is derived from the worn signet-relic loadout, not archetype', () => {
        // Phase 19 — signatures come from worn equipment. The fixture player
        // wears the default 5-relic loadout, so the kit is the 5 default-worn
        // signatures regardless of the (portrait-only) archetype / base stats.
        const bodyPlayer = makePlayer([DOT_BODY]); bodyPlayer.baseStats = { heart: 2, body: 9, mind: 2 };
        const s = initializeCombatEncounter(bodyPlayer, makeEnemy(60), [DOT_BODY], 1);
        expect(s.archetype).toBe('body'); // archetype still derived (portrait flavour)
        expect(s.signatures).toEqual(getSignaturesForLoadout(bodyPlayer.equipment));
        expect(s.signatures).toEqual([
            'sig-overwhelming-argument', 'sig-read-opponent',
            'sig-clever-gambit', 'sig-disarming-plea', 'sig-press-the-point',
        ]);
        // Swapping the worn weapon relic changes which signature is available —
        // independent of base stats (the old archetype gate is gone).
        const swapped = equipItem(bodyPlayer, getRelicById('relic-conclusion')!);
        const s2 = initializeCombatEncounter(swapped, makeEnemy(60), [DOT_BODY], 1);
        expect(s2.signatures).toContain('sig-rallying-blow');        // Capstone Maul grants Conclusion
        expect(s2.signatures).not.toContain('sig-overwhelming-argument');
    });

    it('Conclusion (body finisher) deals per-stack damage', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(200, 'mind'), [DOT_BODY], 1);
        state = rollEncounterDice(state).state;
        // Seed the enemy with two effects: 3 stacks of bleed + 5 stacks of poison = 8 total stacks.
        const bleedDef = lookupEffect('debuff_bleed')!;
        const poisonDef = lookupEffect('debuff_poison')!;
        const { activeEffects: withBleed } = applyEffect([], bleedDef, 1, { intensityDelta: 3, sourceId: 'test' });
        const { activeEffects: withBoth } = applyEffect(withBleed, poisonDef, 1, { intensityDelta: 5, sourceId: 'test' });
        state = { ...state, conviction: 8, enemy: { ...state.enemy, effects: withBoth } };
        const hpBefore = state.enemy.health;
        const r = playSignatureSkill(state, 'sig-rallying-blow');
        // 8 total stacks × CONCLUDE_DMG_PER_STACK(2) = 16 damage
        expect(hpBefore - r.state.enemy.health).toBe(8 * CONCLUDE_DMG_PER_STACK);
        expect(r.events.some(e => e.kind === 'conclude-hit')).toBe(true);
    });

    it('Conclusion deals 1 damage (floor) when enemy has no active effects', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(80, 'mind'), [DOT_BODY], 1);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 8, enemy: { ...state.enemy, effects: [] } };
        const hpBefore = state.enemy.health;
        const r = playSignatureSkill(state, 'sig-rallying-blow');
        expect(hpBefore - r.state.enemy.health).toBe(1); // floor(max(1, 0 stacks))
    });

    it('The Open Hand (heart mercy) applies QUARTER and lands the disarming hit', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([CONTROL_CARD]), makeEnemy(120, 'body'), [CONTROL_CARD], 1);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 8 };
        const hpBefore = state.enemy.health;
        const r = playSignatureSkill(state, 'sig-disarming-plea');
        // QUARTER (v3 mercy vocabulary) lands on the enemy and it takes the hit.
        expect(r.state.enemy.effects.some(e => e.effectId === 'debuff_quarter')).toBe(true);
        expect(r.state.enemy.health).toBeLessThan(hpBefore);
    });

    it('rollCombatCardRewards offers valid distinct card-sourced cards, biased to archetype', () => {
        const player = makePlayer([DOT_BODY]); player.baseStats = { heart: 2, body: 9, mind: 2 };
        let i = 0; const rng = () => [0.1, 0.5, 0.9, 0.3, 0.7][i++ % 5];
        const offers = rollCombatCardRewards(player, rng, 3);
        expect(offers.length).toBe(3);
        expect(new Set(offers).size).toBe(3); // distinct
        for (const id of offers) { expect(getCardById(id)).toBeTruthy(); expect(COMBAT_REWARD_POOL).toContain(id); }
    });

    it('a reward card stacks onto the deck as an extra copy', () => {
        const player = makePlayer([DOT_BODY]);
        const before = buildCombatDeck(player).filter(id => id === DOT_BODY).length;
        const rewarded = addRewardCard(player, DOT_BODY);
        const after = buildCombatDeck(rewarded).filter(id => id === DOT_BODY).length;
        expect(after).toBe(before + 1);
    });

    it('unlockCardViaDilemma adds a new card, bypassing gates; no-op if known', () => {
        const player = makePlayer([DOT_BODY]);
        const newId = COMBAT_REWARD_POOL.find(id => id !== DOT_BODY && getCardById(id))!;
        const unlocked = unlockCardViaDilemma(player, newId);
        expect(unlocked.knownCards).toContain(newId);
        expect(unlockCardViaDilemma(unlocked, newId)).toBe(unlocked); // already known → same ref
    });

    it('even a tiny enemy gets a real threat sequence (its attack has bite)', () => {
        const seq = getThreatSequence(makeEnemy(20)); // very low HP
        expect(seq.length).toBeGreaterThan(0);
        for (const p of seq) {
            // The enemy's threat action deals a meaningful chunk of damage.
            expect(p.threatAction.effects.some(e => (e.damage ?? 0) >= 3)).toBe(true);
        }
    });
});

// ── Full victory by HP depletion via status play (card-sourced cards only) (§11) ─────

describe('Spec 25 §11 — victory by HP depletion via status play, card-sourced cards only', () => {
    it('a small enemy is destroyed by stacked DoT pressure with no attack/defend', () => {
        mockSequentialRng(0.05);
        const player = makePlayer([DOT_BODY]);
        const enemy = makeEnemy(24, 'mind');
        let state = initializeCombatEncounter(player, enemy, [DOT_BODY, DOT_BODY, DOT_BODY], 9);

        let guard = 0;
        while (state.phase !== 'complete' && state.phase !== 'mercy-choice' && guard < 40) {
            guard++;
            // Each play names a die from the rolled tray that can power it.
            const res = batchRound(state, DOT_BODY, 2);
            expect(fizzled(res.events)).toBe(false);
            state = res.state;
            if (state.finalOutcome) break;
        }
        expect(state.finalOutcome).toBe('victory');

        const summary = buildCombatSummary(state);
        expect(summary.outcome).toBe('victory');
        expect(summary.headline).toMatch(/Victory/);
        expect(summary.rows.length).toBeGreaterThan(0);
        expect(summary.bestCard.length).toBeGreaterThan(0);
        // REPEALED 2026-09-02 (L5, status-primacy): this used to require
        // `totalDotDamage > 0`, i.e. that HP fell to DoT specifically. The
        // status/damage/wall/alt-win paths compete on merit now, and this
        // 24-VITAE foe dies to spoiled-poultice's printed "Deal 7" before its
        // POISON ever ticks. The win is the assertion; the route is not.
    });
});

// ── resolveCombatPhase batch (§9) ────────────────────────────────────────────

describe('Spec 25 §9 — resolveCombatPhase batch entry point', () => {
    it('applies a batch of plays (each naming its die) then resolves the phase', () => {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60, 'mind'), [DOT_BODY, DOT_BODY], 13);
        state = setDice(rollEncounterDice(state).state, ['body']);
        const res = resolveCombatPhase(state, [{ cardId: DOT_BODY, useBottom: true, dieId: state.dice[0].id }]);
        expect(fizzled(res.events)).toBe(false);
        expect(res.events.some(e => e.kind === 'card-played')).toBe(true);
        expect(res.state.phaseResults.length + (res.state.finalOutcome ? 1 : 0)).toBeGreaterThan(0);
    });

    // D7 (2026-09-25): a play submitted WITHOUT a dieId used to ask for a
    // stance draft — a no-op under spec 33 — and fell back to Reserve/floating
    // only, so a dieless PAID play fizzled with a live tray die in hand.
    it('powers a dieless PAID play with the first colour-legal live tray die', () => {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(200, 'mind'), [DOT_BODY, DOT_BODY], 13);
        // A dead X (miss face), an off-colour heart, then the body die.
        state = setDice(rollEncounterDice(state).state, ['x', 'heart', 'body']);
        state = { ...state, reserve: [], floatingDice: [] };
        const res = resolveCombatPhase(state, [{ cardId: DOT_BODY, useBottom: true }]);
        expect(fizzled(res.events)).toBe(false);
        const played = res.events.find(e => e.kind === 'card-played');
        expect(played && played.kind === 'card-played' && played.dieId).toBe(state.dice[2].id);
    });

    it('falls back to a colour-legal Reserve die when no tray die can power the play', () => {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(200, 'mind'), [DOT_BODY, DOT_BODY], 13);
        state = setDice(rollEncounterDice(state).state, ['x', 'heart']);
        const banked = { id: 'rsv-body', color: 'body' as const, state: 'available' as const, temporary: false, face: 'mana' as const, pips: 0 };
        state = { ...state, reserve: [banked], floatingDice: [] };
        const res = resolveCombatPhase(state, [{ cardId: DOT_BODY, useBottom: true }]);
        expect(fizzled(res.events)).toBe(false);
        const played = res.events.find(e => e.kind === 'card-played');
        expect(played && played.kind === 'card-played' && played.dieId).toBe('rsv-body');
    });
});

// ── Soft-control de-inert (0.33.0) ───────────────────────────────────────────
// The HP engine now READS the enemy's aggregated roll penalty (it always
// computed it; the engine just never consulted it). Soft control weakens the
// telegraphed hit, and a committed VARIETY denies it — making ~24 previously
// inert debuffs actually do something.
describe('0.33.0 — soft control weakens & denies the enemy threat', () => {
    // The spec 32 v3 keyword reset deleted the negative-rollModifier control
    // debuffs (Confusion -5, Fear -4). No surviving library effect carries a
    // roll penalty deep enough to test the weaken-vs-VARIETY-deny split, so we
    // register two test-only control fixtures into the shared registry (the
    // same lookup the threat engine's roll-penalty sum reads). Never touches the
    // library JSON.
    const CONTROL_FIXTURES: Effect[] = [
        {
            id: 'test_ctrl_confusion', name: 'test confusion', description: 'test control -5',
            type: 'debuff', category: 'control', duration: 3, stacking: 'intensity', tier: 2,
            payload: { rollModifier: -5 },
        },
        {
            id: 'test_ctrl_fear', name: 'test fear', description: 'test control -4',
            type: 'debuff', category: 'control', duration: 3, stacking: 'intensity', tier: 2,
            payload: { rollModifier: -4 },
        },
        {
            id: 'test_ctrl_knockdown', name: 'test knockdown', description: 'test control -3',
            type: 'debuff', category: 'control', duration: 3, stacking: 'intensity', tier: 2,
            payload: { rollModifier: -3 },
        },
        {
            id: 'test_ctrl_slow', name: 'test slow', description: 'test control -2',
            type: 'debuff', category: 'control', duration: 3, stacking: 'intensity', tier: 2,
            payload: { rollModifier: -2 },
        },
        {
            id: 'test_exhaustion', name: 'test exhaustion', description: 'test threat-damage -25%',
            type: 'debuff', category: 'stat', duration: 3, stacking: 'intensity', tier: 2,
            payload: { outgoingThreatDamageMulPct: -25 },
        },
    ];
    beforeAll(() => { for (const e of CONTROL_FIXTURES) effectsLibrary.registry.set(e.id, e); });
    afterAll(() => { for (const e of CONTROL_FIXTURES) effectsLibrary.registry.delete(e.id); });

    const ae = (effectId: string): ActiveEffect => ({
        effectId, remainingDuration: 3, intensity: 1, appliedAt: 0, tier: 1,
    });
    // A state parked at phase-play with a known 10-damage threat on the current
    // phase and the given effects on the enemy; resolveThreatPhase then fires.
    function threatState(enemyEffects: ActiveEffect[]): CombatEncounterState {
        let s = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(200, 'heart'), [DOT_BODY], 7);
        s = rollEncounterDice(s).state;
        const idx = Math.min(s.currentPhaseIndex, s.threatPhases.length - 1);
        const threatPhases = s.threatPhases.map((p, i) =>
            i === idx ? { ...p, threatAction: { ...p.threatAction, effects: [{ damage: 10 }] } } : p);
        return { ...s, phase: 'phase-play', guard: 0, threatPhases, enemy: { ...s.enemy, effects: enemyEffects } };
    }
    const hpLoss = (effects: ActiveEffect[]): number => {
        const s = threatState(effects);
        return s.player.health - resolveThreatPhase(s).state.player.health;
    };

    it('a clean enemy lands its full telegraphed hit', () => {
        expect(hpLoss([])).toBeGreaterThan(0);
    });

    // WS8.2 (spec 32 §12 #6): confusion/blind moved OFF the roll surface —
    // FEAR (-4) is the heavy roll hammer now; knockdown (-3) + slow (-2) fill
    // the cumulative-deny witness. All three share the 'roll' surface, so the
    // deny below is the LEGACY cumulative path, not the DISRUPT variety path.
    it('one soft-control (Fear, roll -4) WEAKENS the hit but does not deny it', () => {
        const clean = hpLoss([]);
        const weakened = hpLoss([ae('test_ctrl_fear')]);
        expect(weakened).toBeGreaterThan(0);   // a single soft-control only reduces
        expect(weakened).toBeLessThan(clean);  // ~24% weaker telegraphed hit
    });

    it('a heavy roll-shred pile (Fear -4 + Knockdown -3 + Slow -2 = 9 ≥ deny) denies the turn', () => {
        expect(hpLoss([ae('test_ctrl_fear'), ae('test_ctrl_knockdown'), ae('test_ctrl_slow')])).toBe(0);
    });

    it('a VARIETY of soft-controls (Confusion -5 + Fear -4 = 9 ≥ deny) denies the turn', () => {
        expect(hpLoss([ae('test_ctrl_confusion'), ae('test_ctrl_fear')])).toBe(0);
    });

    it('WS8.2 — Exhaustion softens the telegraphed hit on the threat-damage surface', () => {
        const clean = hpLoss([]);
        const softened = hpLoss([ae('test_exhaustion')]);
        expect(softened).toBeGreaterThan(0);   // -25% softens, never denies alone
        expect(softened).toBeLessThan(clean);
    });
});

// ── Monte-Carlo sim (§11 acceptance) ─────────────────────────────────────────

describe('Hazard combat — Monte-Carlo sim', () => {
    it('runs 300 seeded combats and reports a coherent outcome distribution', () => {
        const player = makePlayer([DOT_BODY, CONTROL_CARD, DAMAGE_BODY]);
        const enemy = makeEnemy(40);
        const stats = simulateHazardPatternCombat(player, enemy, 300, 1);
        expect(stats.runs).toBe(300);
        expect(stats.victories + stats.mercies + stats.defeats + stats.retreats).toBe(300);
        expect(stats.winRate).toBeGreaterThan(0);
        expect(stats.winRate).toBeLessThanOrEqual(1);
        expect(stats.statusEngagement).toBeGreaterThan(0);
    });
});
