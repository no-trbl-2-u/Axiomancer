/**
 * Hermetic E2E — spec 32 v3 themed-deck mechanics, LIVE through the engine.
 *
 * One describe per new mechanic:
 *   FLOATING DICE (forge → tray now → next turn → spent forever → cap 3 →
 *   reroll/draft-exempt → save-back), PREMISES / PERORATION (+ CONCEDE at 8),
 *   STAGGER rungs (deny + partial weaken) + BACKFIRE drip, OMEN
 *   declare/hit/miss, SOULS (expiry + REAP fizzle/spend + REAP-all cap),
 *   SWAY (gain / decay / capitulate / irresistible-grace), ECHO (doubles
 *   statuses + stuck-in-their-head drip + echo-next-spell charge), REPRISE
 *   (highest rank back + fireFree), ENCHANT/DISENCHANT zone play (FREE timed
 *   instance / PAID permanent, unique-in-play, leaves the deck cycle) +
 *   persistent hooks (venom-and-vein,
 *   mirror-of-guilt, crumbling-resolve), BLEED per-tick decay, MARK tick
 *   amplification — plus a per-preset theme-engine ignition smoke.
 *
 * Seeded / stubbed RNG only (src/test-utils/rng.ts); no disk / network / TTY.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva, LittleBelle } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, resolveCombatPhase,
    resolveThreatPhase, processBetweenPhases, draftStanceDie, startTurn, endTurn,
    discardCombatCard, getFloatingDiceColors, getDraftedDie, selectCapitulationChoice,
} from '../combat.engine';
import { FLOATING_DICE_CAP } from '../combat.dice';
import { runHazardCombatAutoEncounter } from '../combat.autoplay';
import { THREAT_RUNGS } from '../effects';
import { buildPresetDeck, COMBAT_DECK_PRESET_ORDER } from '../combat.starter-deck-presets';
import type {
    CombatDieColor, CombatEncounterState, CombatEvent, CombatManaDie, CombatThreatPhase,
} from '../combat.encounter.types';

afterEach(() => { vi.restoreAllMocks(); });

const ae = (effectId: string, intensity = 1, remainingDuration = 3, tier: 1 | 2 | 3 = 2): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier });

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind' = 'mind', effects: ActiveEffect[] = []): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-themed-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = effects;
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
    // Floating dice already in the tray survive the forced pool.
    const floating = state.dice.filter(d => d.floating);
    return { ...state, dice: [...dice, ...floating], draftedDieId: null, turn };
}

/** Opens phase-play, forces the pool, and drafts die 0 (color `die`). */
function openAndDraft(player: Character, enemy: Enemy, deck: string[], die: CombatDieColor, seed = 7): CombatEncounterState {
    let state = initializeCombatEncounter(player, enemy, deck, seed);
    state = rollEncounterDice(state).state;
    state = setDice(state, [die, 'x']);
    state = draftStanceDie(state, state.dice[0].id).state;
    return state;
}

function playFromHand(state: CombatEncounterState, cardId: string, useBottom = true, dieId?: string) {
    const entry = state.hand.find(h => h.cardId === cardId);
    expect(entry, `${cardId} should be in hand`).toBeDefined();
    return playCombatCard(state, { uid: entry!.uid }, useBottom, dieId);
}

/** One-shot custom threat phases (controlled stances/damage). */
function customPhases(stances: ('heart' | 'body' | 'mind')[], damage = 6): CombatThreatPhase[] {
    return stances.map((s, i) => ({
        index: i + 1, enemyStance: s, isFinalPhase: i === stances.length - 1,
        threatAction: { description: 'themed probe', effects: [{ damage }] },
    }));
}

// ── FLOATING DICE — the live tray (spec 32 v3 §5) ────────────────────────────

describe('FLOATING DICE — forge, spend-forever, cap, exemptions', () => {
    const FORGE = 'ex-nihilo'; // mind spell: FORGE a WILD floating die (v3 rework)

    it('FORGE joins the tray NOW, persists into the next turn, and is draft-exempt', () => {
        mockSequentialRng(0.05);
        let state = openAndDraft(makePlayer([FORGE]), makeEnemy(300, 'mind'), [FORGE, FORGE, FORGE], 'mind');
        const res = playFromHand(state, FORGE);
        const floated = res.events.find(e => e.kind === 'die-floated') as { dieId: string; color: string } | undefined;
        expect(floated).toBeDefined();
        expect(floated!.color).toBe('wild'); // ex-nihilo forges a WILD die (v3 rework)
        // In the tray NOW (spendable this turn) and in the persistent pool.
        expect(res.state.dice.some(d => d.id === floated!.dieId && d.floating)).toBe(true);
        expect(res.state.floatingDice?.map(d => d.id)).toEqual([floated!.dieId]);

        // It survives the turn boundary with a STABLE id (never rerolled).
        // Gate 0 (round-turn law): the next legal tray arrives only after the
        // threat phase resolves, so cross the boundary the legal way.
        state = endTurn(res.state).state;
        state = resolveThreatPhase(state).state;
        state = startTurn(state).state;
        expect(state.dice.some(d => d.id === floated!.dieId && d.floating && d.state === 'available')).toBe(true);

        // A floating die cannot be DRAFTED as the stance (it is extra power).
        const draft = draftStanceDie(state, floated!.dieId);
        expect(draft.state.draftedDieId).toBeNull();

        // Save-back surface for the character record.
        expect(getFloatingDiceColors(state)).toEqual(['wild']);
    });

    it('spending a floating die removes it FOREVER (refresh effects cannot save it)', () => {
        mockSequentialRng(0.05);
        const DOT = 'slippery-slope';
        let state = openAndDraft(makePlayer([FORGE, DOT]), makeEnemy(300, 'mind'), [FORGE, DOT, DOT], 'mind');
        const forged = playFromHand(state, FORGE);
        const floatId = (forged.events.find(e => e.kind === 'die-floated') as { dieId: string }).dieId;
        state = forged.state;
        // Power the DoT with the floating die THIS turn (the bigger-turn intent).
        const res = playFromHand(state, DOT, true, floatId);
        expect(res.events.some(e => e.kind === 'floating-die-spent')).toBe(true);
        // The DoT landed (a NEW status would refresh a normal die) — but the
        // floating die is GONE FOREVER anyway.
        expect(res.state.enemy.effects.some(e => e.effectId === 'debuff_poison')).toBe(true);
        expect(res.state.floatingDice).toEqual([]);
        expect(res.state.dice.some(d => d.id === floatId)).toBe(false);
    });

    it('forging at the cap (3) converts to +1 Conviction instead', () => {
        mockSequentialRng(0.05);
        let state = openAndDraft(makePlayer([FORGE]), makeEnemy(300, 'mind'), [FORGE, FORGE, FORGE], 'mind');
        const full: CombatManaDie[] = ['heart', 'body', 'mind'].map((c, i) => ({
            id: `float-old-${i}`, color: c as 'heart' | 'body' | 'mind',
            state: 'available', temporary: false, floating: true,
        }));
        state = { ...state, floatingDice: full, dice: [...state.dice, ...full] };
        const convBefore = state.conviction;
        const res = playFromHand(state, FORGE);
        expect(res.events.some(e => e.kind === 'die-floated')).toBe(false);
        expect(res.state.floatingDice?.length).toBe(FLOATING_DICE_CAP);
        expect(res.state.conviction).toBe(Math.min(12, convBefore + 1));
    });

    it('the opening tray materializes the character save-file pool', () => {
        mockSequentialRng(0.05);
        const player = makePlayer(['slippery-slope']);
        (player as Character & { floatingDice?: string[] }).floatingDice = ['wild', 'heart'];
        let state = initializeCombatEncounter(player, makeEnemy(100, 'mind'), ['slippery-slope'], 7);
        expect(state.floatingDice?.map(d => d.color)).toEqual(['wild', 'heart']);
        state = rollEncounterDice(state).state;
        // The floating pool is merged into the first turn's tray.
        expect(state.dice.filter(d => d.floating).length).toBe(2);
    });
});

// ── PREMISES + PERORATION (T2) ───────────────────────────────────────────────

describe('PREMISES / PERORATION — the declared conclusion and the CONCEDE alt-win', () => {
    const CLOSER = 'the-closing-word'; // PERORATION at 6 (CONCEDE at 8); rider: marks×3, draw 2, +2◆
    const OPENER = 'exordium';         // FREE: +1 Premise

    function declared(enemyEffects: ActiveEffect[] = []): CombatEncounterState {
        mockSequentialRng(0.05);
        const state = openAndDraft(
            makePlayer([CLOSER, OPENER]), makeEnemy(300, 'heart', enemyEffects),
            [CLOSER, OPENER, OPENER, OPENER, OPENER], 'heart');
        const res = playFromHand(state, CLOSER);
        expect(res.events.some(e => e.kind === 'peroration-declared')).toBe(true);
        expect(res.state.peroration).toMatchObject({ cardId: CLOSER, at: 6, concedeAt: 8 });
        return res.state;
    }

    it('reaching the printed count fires the conclusion FREE and resets the tally', () => {
        let state = declared([ae('debuff_mark', 2, 3)]);
        state = { ...state, premises: 5 };
        const hpBefore = state.enemy.health;
        const convBefore = state.conviction;
        const res = playFromHand(state, OPENER, false); // FREE: +1 Premise → 6
        expect(res.events.some(e => e.kind === 'peroration-fired')).toBe(true);
        expect(res.state.premises).toBe(0);                       // tally resets
        expect(res.state.peroration).toMatchObject({ cardId: CLOSER }); // stays declared
        // ruptureMarks 3 × 2 consumed stacks = 6 burst; +2 Conviction.
        expect(hpBefore - res.state.enemy.health).toBe(6);
        expect(res.state.enemy.effects.some(e => e.effectId === 'debuff_mark')).toBe(false);
        expect(res.state.conviction).toBe(Math.min(12, convBefore + 2));
    });

    it('reaching 8 Premises first wins the argument outright — CONCEDE (spec §9)', () => {
        let state = declared();
        state = { ...state, premises: 7 };
        const res = playFromHand(state, OPENER, false); // +1 → 8 ≥ concedeAt
        expect(res.state.finalOutcome).toBe('concede');
        expect(res.state.phase).toBe('complete');
        expect(res.events.some(e => e.kind === 'combat-ended' && e.outcome === 'concede')).toBe(true);
    });
});

// ── STAGGER + BACKFIRE (T5) ──────────────────────────────────────────────────

describe('STAGGER rungs — full removal denies the turn; BACKFIRE drips per rung', () => {
    const ZENO = 'zenos-half-step'; // STAGGER 1

    it('stripping every rung DENIES the telegraph and BACKFIRE drips per denied rung', () => {
        // 0.2 rolls BODY dice — zeno's-half-step is a body spell and the color
        // law (2026-07-09) demands a matching (or wild) powering die. No seed:
        // a seed installs its own rng stream and the mock would never apply.
        mockSequentialRng(0.2);
        const enemy = makeEnemy(300, 'mind', [ae('debuff_backfire', 1, 3)]);
        let opened = rollEncounterDice(
            initializeCombatEncounter(makePlayer([ZENO]), enemy, [ZENO, ZENO, ZENO, ZENO, ZENO]),
        ).state;
        // Gate 0 (round-turn law): the second ZENO can no longer ride a free
        // tray re-roll — arm a FLOATING body die so both plays are legal
        // inside the phase's ONE turn (the multi-source turn is the intent).
        const float: CombatManaDie = { id: 'float-qa-stagger', color: 'body', state: 'available', temporary: false, floating: true };
        opened = { ...opened, dice: [...opened.dice, float], floatingDice: [...(opened.floatingDice ?? []), float] };
        // Two STAGGER 1 plays = THREAT_RUNGS (2) → the action is denied.
        const res = resolveCombatPhase(opened, [
            { cardId: ZENO, useBottom: true },
            { cardId: ZENO, useBottom: true },
        ]);
        const staggers = res.events.filter(e => e.kind === 'staggered');
        expect(staggers.length).toBe(2);
        expect(res.events.some(e => e.kind === 'threat-fired')).toBe(false);
        const resolved = res.events.find(e => e.kind === 'phase-resolved') as { mark: string };
        expect(resolved.mark).toBe('clear');
        expect(res.state.player.health).toBe(200); // the denied blow never landed
        // BACKFIRE i1 × THREAT_RUNGS(2) denied rungs = 2 HP inward.
        const backfired = res.events.find(e => e.kind === 'backfired') as { amount: number; rungs: number } | undefined;
        expect(backfired).toBeDefined();
        expect(backfired!.rungs).toBe(THREAT_RUNGS);
        expect(backfired!.amount).toBe(THREAT_RUNGS);
    });

    it('partial rung loss WEAKENS the hit proportionally and still drips', () => {
        mockSequentialRng(0.05);
        const phases = customPhases(['mind'], 10);
        const base = () => {
            const s = initializeCombatEncounter(
                makePlayer([]), makeEnemy(300, 'mind', [ae('debuff_backfire', 1, 3)]), undefined, 7);
            const opened = rollEncounterDice(s).state;
            return { ...opened, threatPhases: phases, threatMarks: ['pending' as const], currentPhaseIndex: 0 };
        };
        const clean = resolveThreatPhase(base());
        const cleanLoss = 200 - clean.state.player.health;
        const partial = resolveThreatPhase({ ...base(), staggerRungs: 1 });
        const partialLoss = 200 - partial.state.player.health;
        expect(cleanLoss).toBeGreaterThan(0);
        expect(partialLoss).toBeGreaterThan(0);              // 1 of 2 rungs → weakened, not denied
        expect(partialLoss).toBeLessThan(cleanLoss);
        const drip = partial.events.find(e => e.kind === 'backfired') as { amount: number; rungs: number } | undefined;
        expect(drip).toBeDefined();
        expect(drip!.rungs).toBe(1);
        expect(drip!.amount).toBe(1);
        // Rungs are consumed by the phase they bent.
        expect(partial.state.staggerRungs ?? 0).toBe(0);
    });
});

// ── OMEN (T6) ────────────────────────────────────────────────────────────────

describe('OMEN — declare with the powering die; resolve at the phase boundary', () => {
    const OMEN_CARD = 'signs-and-portents'; // OMEN: on hit, draw 2

    function withPhases(state: CombatEncounterState, stances: ('heart' | 'body' | 'mind')[]): CombatEncounterState {
        return {
            ...state,
            threatPhases: customPhases(stances, 4),
            threatMarks: stances.map(() => 'pending' as const),
            currentPhaseIndex: 0,
        };
    }

    it('a HIT fires the rider free (+2 cards ride the boundary refill) and counts an omen hit', () => {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(
            makePlayer([OMEN_CARD]), makeEnemy(300, 'mind'),
            [OMEN_CARD, OMEN_CARD, OMEN_CARD, OMEN_CARD, OMEN_CARD], 7);
        state = rollEncounterDice(state).state;
        state = withPhases(state, ['mind', 'heart']); // next phase stance: HEART
        state = setDice(state, ['heart', 'x']);
        state = draftStanceDie(state, state.dice[0].id).state;
        const played = playFromHand(state, OMEN_CARD); // heart die → predicts HEART
        const declared = played.events.find(e => e.kind === 'omen-declared') as
            { stance: string; phaseIndex: number } | undefined;
        expect(declared).toBeDefined();
        expect(declared!.stance).toBe('heart');
        expect(declared!.phaseIndex).toBe(1);

        const res = resolveThreatPhase(played.state);
        expect(res.events.some(e => e.kind === 'omen-hit')).toBe(true);
        expect(res.state.omenHits).toBe(1);
        expect(res.state.pendingOmens).toEqual([]);
        // The drawn 2 raise the boundary refill target: 4 kept + refill to 5+2.
        expect(res.state.hand.length).toBe(7);
    });

    it('a MISS fires no rider and counts nothing', () => {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(
            makePlayer([OMEN_CARD]), makeEnemy(300, 'mind'),
            [OMEN_CARD, OMEN_CARD, OMEN_CARD, OMEN_CARD, OMEN_CARD], 7);
        state = rollEncounterDice(state).state;
        // signs-and-portents is a HEART spell: the color law demands a heart
        // (or wild) powering die, so the MISS comes from the phases instead —
        // the heart die predicts HEART, but the next phase stays MIND.
        state = withPhases(state, ['mind', 'mind']);
        state = setDice(state, ['heart', 'x']);       // heart die → predicts HEART
        state = draftStanceDie(state, state.dice[0].id).state;
        const played = playFromHand(state, OMEN_CARD);
        const res = resolveThreatPhase(played.state);
        expect(res.events.some(e => e.kind === 'omen-missed')).toBe(true);
        expect(res.events.some(e => e.kind === 'omen-hit')).toBe(false);
        expect(res.state.omenHits).toBe(0);
        expect(res.state.hand.length).toBe(5); // just the plain refill to COMBAT_HAND_SIZE
    });
});

// ── SOULS + REAP (T7) ────────────────────────────────────────────────────────

describe('SOULS — expiry yields, REAP spends, REAP-all bursts under the cap', () => {
    it('an enemy affliction instance EXPIRING yields exactly 1 Soul', () => {
        // WS3.3: MARK is battle-long now (`calendarExpiry: false`) — the
        // calendar-expiry witness is BLEED, whose calendar still counts down
        // (only its TICK moved to the damage-instance clock).
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const seeded = { ...base, enemy: { ...base.enemy, effects: [ae('debuff_bleed', 2, 1)] } };
        const res = processBetweenPhases(seeded);
        const gained = res.events.find(e => e.kind === 'soul-gained') as
            { amount: number; total: number; reason: string } | undefined;
        expect(gained).toBeDefined();
        expect(gained!.reason).toBe('expiry');
        expect(gained!.amount).toBe(1); // per INSTANCE, not per stack
        expect(res.state.souls).toBe(1);
    });

    it('a battle-long MARK never expires at the boundary — no calendar Soul from it (WS3.3)', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const seeded = { ...base, enemy: { ...base.enemy, effects: [ae('debuff_mark', 2, 1)] } };
        const res = processBetweenPhases(seeded);
        expect(res.events.some(e => e.kind === 'soul-gained')).toBe(false);
        const mark = res.state.enemy.effects.find(e => e.effectId === 'debuff_mark');
        expect(mark).toMatchObject({ intensity: 2, remainingDuration: 1 }); // held, not counted down
    });

    it('REAP fizzles underfunded; funded, it spends the Souls and fires (draw + KINDLE)', () => {
        mockSequentialRng(0.05);
        const GLEAN = 'the-gleaners-due'; // REAP cost 2: KINDLE(mind) + draw 2 + 1 Soul back
        const DOT = 'slippery-slope';
        const deck = [GLEAN, GLEAN, GLEAN, GLEAN, GLEAN, DOT, DOT, DOT, DOT];
        const broke = openAndDraft(makePlayer([GLEAN, DOT]), makeEnemy(300, 'mind'), deck, 'mind');
        const fizzled = playFromHand(broke, GLEAN);
        expect(fizzled.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(fizzled.state.souls ?? 0).toBe(0);

        let funded = openAndDraft(makePlayer([GLEAN, DOT]), makeEnemy(300, 'mind'), deck, 'mind');
        funded = { ...funded, souls: 3 };
        funded = discardCombatCard(funded, funded.hand[1].uid).state; // room for the draws
        const res = playFromHand(funded, GLEAN);
        expect(res.state.souls).toBe(2); // 3 − cost 2 + 1 Soul back ("a coin pressed back")
        expect(res.events.some(e => e.kind === 'reaped')).toBe(true);
        expect(res.events.some(e => e.kind === 'die-forged')).toBe(true); // KINDLE joins the Reserve
        expect(res.state.reserve?.some(d => d.color === 'mind' && d.temporary)).toBe(true);
        const drawn = res.events.find(e => e.kind === 'hand-drawn') as { cards: string[] } | undefined;
        expect(drawn).toBeDefined();
        expect(drawn!.cards.length).toBe(2);
    });

    it('REAP-all spends EVERY Soul and the burst is UNCAPPED (WS7.1, spec 32 §12 item 5)', () => {
        mockSequentialRng(0.05);
        const REAP = 'the-reaping'; // REAP all: 4 per Soul (v3 rework)
        let state = openAndDraft(makePlayer([REAP]), makeEnemy(600, 'body'), [REAP, REAP, REAP], 'body');
        state = { ...state, souls: 60 };
        const hpBefore = state.enemy.health;
        const res = playFromHand(state, REAP);
        const reaped = res.events.find(e => e.kind === 'reaped') as { soulsSpent: number; amount: number };
        expect(reaped.soulsSpent).toBe(60);
        // 4 × 60 = 240 lands whole (neutral read: body die vs body foe) — the
        // ALL-spender's price is the emptied bank, not a cap (the old 200 flat
        // cap would have swallowed 40 of it).
        expect(reaped.amount).toBe(240);
        expect(res.state.souls).toBe(0);
        expect(hpBefore - res.state.enemy.health).toBe(240);
    });
});

// ── SWAY (T8) ────────────────────────────────────────────────────────────────

describe('SWAY — gain, per-turn decay, CAPITULATE, irresistible-grace', () => {
    const SOFT = 'soft-word'; // SWAY 3

    it('gains stack and decays 1 at the turn boundary', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([SOFT]), makeEnemy(300, 'heart'), [SOFT, SOFT, SOFT, SOFT, SOFT], 'heart');
        const res = playFromHand(state, SOFT);
        expect(res.state.sway).toBe(3); // SWAY 3
        const after = resolveThreatPhase(res.state);
        expect(after.state.sway).toBe(2); // decayed 1 (ratified A2)
        expect(after.events.some(e => e.kind === 'sway-decayed')).toBe(true);
    });

    it('SWAY >= enemy current HP opens a player-authored capitulation choice', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([SOFT]), makeEnemy(4, 'heart'), [SOFT, SOFT, SOFT, SOFT, SOFT], 'heart');
        const res = playFromHand(state, SOFT); // SWAY 3 meets the 4-HP foe's capitulate threshold
        expect(res.state.finalOutcome).toBeNull();
        expect(res.state.phase).toBe('mercy-choice');
        expect(res.state.capitulationChoiceActive).toBe(true);
        expect(res.state.enemy.health).toBe(4);

        const accepted = selectCapitulationChoice(res.state, 'accept');
        expect(accepted.state.finalOutcome).toBe('capitulate');
        expect(accepted.state.phase).toBe('complete');
        expect(accepted.state.enemy.health).toBe(4); // won without touching VITAE
    });

    it('the player may reject capitulation and continue without a repeated forced offer', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([SOFT]), makeEnemy(4, 'heart'), [SOFT, SOFT, SOFT, SOFT, SOFT], 'heart');
        const offered = playFromHand(state, SOFT);
        const continued = selectCapitulationChoice(offered.state, 'continue');
        expect(continued.state.finalOutcome).toBeNull();
        expect(continued.state.phase).toBe('phase-play');
        expect(continued.state.capitulationChoiceActive).toBe(false);
        expect(continued.state.capitulationDeclined).toBe(true);
        expect(continued.events).toContainEqual({ kind: 'capitulation-declined' });
    });

    it('a DEFEATED enemy cannot capitulate — HP 0 resolves as victory even with SWAY up', () => {
        // Engine-truth pin for the capitulate/victory tie: sway 3 vs a foe about
        // to die to the burst must record VICTORY.
        mockSequentialRng(0.05);
        const REAP = 'the-reaping';
        let state = openAndDraft(makePlayer([REAP]), makeEnemy(6, 'body'), [REAP, REAP, REAP], 'body');
        state = { ...state, souls: 10, sway: 3 };
        const res = playFromHand(state, REAP); // burst 20 → HP 0
        expect(res.state.finalOutcome).toBe('victory');
    });

    it('irresistible-grace (E) holds the SWAY — no decay at the boundary', () => {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        state = rollEncounterDice(state).state;
        state = { ...state, sway: 3, persistentZone: ['irresistible-grace'] };
        const res = resolveThreatPhase(state);
        expect(res.state.sway).toBe(3);
        expect(res.events.some(e => e.kind === 'sway-decayed')).toBe(false);
    });
});

// ── ECHO + REPRISE (T10) ─────────────────────────────────────────────────────

describe('ECHO — the PAID payload fires twice; stuck-in-their-head drips per echo', () => {
    const REFRAIN = 'refrain'; // mark d2, ECHO

    it('an ECHO card lands its status twice (intensity stacks)', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([REFRAIN]), makeEnemy(300, 'mind'), [REFRAIN, REFRAIN, REFRAIN], 'mind');
        const res = playFromHand(state, REFRAIN);
        expect(res.events.some(e => e.kind === 'echoed')).toBe(true);
        const mark = res.state.enemy.effects.find(e => e.effectId === 'debuff_mark');
        expect(mark?.intensity).toBe(2); // applied twice
    });

    it('stuck-in-their-head (D) drips 2 on every echo', () => {
        mockSequentialRng(0.05);
        let state = openAndDraft(makePlayer([REFRAIN]), makeEnemy(300, 'mind'), [REFRAIN, REFRAIN, REFRAIN], 'mind');
        state = { ...state, enemyAttachments: ['stuck-in-their-head'] };
        const hpBefore = state.enemy.health;
        const res = playFromHand(state, REFRAIN);
        const drip = res.events.find(e => e.kind === 'damage-dealt' && (e as { cardId: string }).cardId === 'stuck-in-their-head') as
            { amount: number } | undefined;
        expect(drip).toBeDefined();
        expect(drip!.amount).toBe(2);
        expect(hpBefore - res.state.enemy.health).toBe(2); // marks deal nothing directly
    });

    it('echo_next_spell charges the NEXT spell this turn, then is consumed', () => {
        mockSequentialRng(0.05);
        const CHARGE = 'ad-nauseam';
        const BLEEDER = 'straw-mans-jab';
        // Enemy stance BODY: the wild die re-reads as the bleeder's body stance,
        // so the read stays NEUTRAL and no read-intensity bonus muddies the echo.
        let state = openAndDraft(
            makePlayer([CHARGE, BLEEDER]), makeEnemy(300, 'body'),
            [CHARGE, BLEEDER, BLEEDER, BLEEDER, BLEEDER], 'mind');
        // A banked Reserve die powers the second spell in the SAME turn.
        // (WILD — the color law demands a matching die for the body spell, and
        // wild is the exception; it does NOT trigger straw-mans-jab's body
        // dieBonus (+1 intensity), so the echo stays isolated.)
        state = { ...state, reserve: [{ id: 'bank-echo', color: 'wild', state: 'available', temporary: false, pips: 0 }] };
        const charged = playFromHand(state, CHARGE);
        expect(charged.state.echoNextSpell).toBe(true);
        const res = playFromHand(charged.state, BLEEDER, true, 'bank-echo');
        expect(res.events.some(e => e.kind === 'echoed')).toBe(true);
        const bleed = res.state.enemy.effects.find(e => e.effectId === 'debuff_bleed');
        expect(bleed?.intensity).toBe(4); // authored i2, applied twice
        expect(res.state.echoNextSpell).toBe(false); // the charge is consumed
    });
});

describe('REPRISE — returns the highest-rank discard; fireFree fires its FREE line', () => {
    it('reprise picks the HIGHEST-RANK card out of the discard pile', () => {
        mockSequentialRng(0.05);
        const SECOND = 'second-thoughts'; // REPRISE 1
        let state = openAndDraft(makePlayer([SECOND]), makeEnemy(300, 'mind'), [SECOND, SECOND, SECOND], 'mind');
        state = { ...state, discard: ['slippery-slope', 'ouroboros', 'exordium'] }; // ranks 1, 5, 1
        const res = playFromHand(state, SECOND);
        const reprised = res.events.find(e => e.kind === 'reprised') as { returned: string[] } | undefined;
        expect(reprised).toBeDefined();
        expect(reprised!.returned).toEqual(['ouroboros']);
        expect(res.state.hand.some(h => h.cardId === 'ouroboros')).toBe(true);
        expect(res.state.discard).not.toContain('ouroboros');
    });

    it('circular-reasoning also fires the reprised card\'s FREE line now', () => {
        mockSequentialRng(0.05);
        const CIRC = 'circular-reasoning'; // REPRISE 1 + fireFree
        let state = openAndDraft(makePlayer([CIRC]), makeEnemy(300, 'mind'), [CIRC, CIRC, CIRC], 'mind');
        state = { ...state, discard: ['exordium'] }; // FREE: +1 Premise
        const res = playFromHand(state, CIRC);
        expect(res.state.hand.some(h => h.cardId === 'exordium')).toBe(true);
        expect(res.state.premises).toBe(1); // the reprised FREE line fired
    });
});

// ── ENCHANT / DISENCHANT — FREE timed instance vs PAID permanent (spec 32 v4 §2) ─

describe('ENCHANT / DISENCHANT — FREE timed line, PAID permanent, unique-in-play', () => {
    const ENCH = 'venom-and-vein';       // T1 enchantment
    const CURSE = 'suppurating-curse';   // T1 disenchant

    it('FREE (dieless): drops a TIMED enchant into tempZone for 3 rounds and RECYCLES the card', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([ENCH]), makeEnemy(300, 'body'), [ENCH, ENCH, ENCH], 'body');
        const res = playFromHand(state, ENCH, false);
        expect(res.events.some(e => e.kind === 'enchant-played'
            && (e as { temporary?: boolean }).temporary === true)).toBe(true);
        expect(res.state.tempZone).toEqual([{ cardId: ENCH, roundsLeft: 3 }]);
        expect(res.state.persistentZone).toEqual([]);              // NOT permanent
        expect(getDraftedDie(res.state)?.state).toBe('available'); // dieless — the die is untouched
        expect(res.state.deck).toContain(ENCH);                    // stays in the deck cycle
    });

    it('FREE disenchant: drops a TIMED curse into enemyTempAttachments for 3 rounds', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([CURSE]), makeEnemy(300, 'mind'), [CURSE, CURSE, CURSE], 'mind');
        const res = playFromHand(state, CURSE, false);
        expect(res.events.some(e => e.kind === 'disenchant-attached'
            && (e as { temporary?: boolean }).temporary === true)).toBe(true);
        expect(res.state.enemyTempAttachments).toEqual([{ cardId: CURSE, roundsLeft: 3 }]);
        expect(res.state.enemyAttachments).toEqual([]);            // NOT permanent
    });

    it('a TEMP enchant fires the exact same hook as the permanent one (venom blesses a DoT)', () => {
        mockSequentialRng(0.05);
        const DOT = 'slippery-slope'; // body spell — color law needs a body die (neutral read vs body foe)
        let state = openAndDraft(makePlayer([DOT]), makeEnemy(300, 'body'), [DOT, DOT, DOT], 'body');
        state = { ...state, tempZone: [{ cardId: 'venom-and-vein', roundsLeft: 3 }] };
        const res = playFromHand(state, DOT);
        const poison = res.state.enemy.effects.find(e => e.effectId === 'debuff_poison');
        expect(poison?.intensity).toBe(2); // authored i1 + venom blessing, from the TIMED instance
    });

    it('a TEMP enchant ticks out after 3 rounds (enchant-expired), no longer in the zone', () => {
        let state = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        state = { ...state, tempZone: [{ cardId: ENCH, roundsLeft: 3 }] };
        // Round 1 → 2 → 3 processing decrements 3 → 2 → 1 → 0.
        state = processBetweenPhases(state).state;   // 3 → 2
        expect(state.tempZone).toEqual([{ cardId: ENCH, roundsLeft: 2 }]);
        state = processBetweenPhases(state).state;   // 2 → 1
        expect(state.tempZone).toEqual([{ cardId: ENCH, roundsLeft: 1 }]);
        const final = processBetweenPhases(state);   // 1 → 0 → expire
        expect(final.state.tempZone).toEqual([]);
        expect(final.events.some(e => e.kind === 'enchant-expired'
            && (e as { cardId: string }).cardId === ENCH)).toBe(true);
    });

    it('PAID: enters the PERMANENT zone, consumes the die, and leaves the deck cycle (no reshuffle back)', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([ENCH]), makeEnemy(300, 'body'), [ENCH, ENCH, ENCH], 'body');
        const res = playFromHand(state, ENCH);
        expect(res.events.some(e => e.kind === 'enchant-played'
            && !(e as { temporary?: boolean }).temporary)).toBe(true);
        expect(res.state.persistentZone).toEqual([ENCH]);
        expect(res.state.discard).not.toContain(ENCH);              // NOT discarded
        expect(res.state.deck).not.toContain(ENCH);                 // out of the cycle
        expect(getDraftedDie(res.state)?.state).toBe('spent');      // the die is gone
    });

    it('PAID promotes a live FREE instance: drops it from tempZone into the permanent zone', () => {
        mockSequentialRng(0.05);
        let state = openAndDraft(makePlayer([ENCH]), makeEnemy(300, 'body'), [ENCH, ENCH, ENCH], 'body');
        state = { ...state, tempZone: [{ cardId: ENCH, roundsLeft: 2 }] };
        const res = playFromHand(state, ENCH);
        expect(res.state.persistentZone).toEqual([ENCH]);
        expect(res.state.tempZone).toEqual([]);                     // promoted, not double-counted
    });

    it('FREE fizzles when the PERMANENT version is already standing', () => {
        mockSequentialRng(0.05);
        let state = openAndDraft(makePlayer([ENCH]), makeEnemy(300, 'body'), [ENCH, ENCH, ENCH], 'body');
        state = { ...state, persistentZone: [ENCH] };
        const res = playFromHand(state, ENCH, false);
        expect(res.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(res.state.tempZone ?? []).toEqual([]);
    });

    it('unique-in-play: a second PAID copy fizzles', () => {
        mockSequentialRng(0.05);
        let state = openAndDraft(makePlayer([ENCH]), makeEnemy(300, 'body'), [ENCH, ENCH, ENCH], 'body');
        state = { ...state, persistentZone: [ENCH] };
        const res = playFromHand(state, ENCH);
        expect(res.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(res.state.persistentZone).toEqual([ENCH]);
    });

    it('a PAID disenchant attaches to the ENEMY as a standing curse', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([CURSE]), makeEnemy(300, 'mind'), [CURSE, CURSE, CURSE], 'mind');
        const res = playFromHand(state, CURSE);
        expect(res.events.some(e => e.kind === 'disenchant-attached')).toBe(true);
        expect(res.state.enemyAttachments).toEqual([CURSE]);
        expect(res.state.persistentZone).toEqual([]);
    });
});

describe('persistent hooks — venom-and-vein, mirror-of-guilt, crumbling-resolve', () => {
    it('venom-and-vein (E): bleed/poison land +1 intensity', () => {
        mockSequentialRng(0.05);
        const DOT = 'slippery-slope'; // body spell — color law needs a body die (neutral read vs body foe)
        let state = openAndDraft(makePlayer([DOT]), makeEnemy(300, 'body'), [DOT, DOT, DOT], 'body');
        state = { ...state, persistentZone: ['venom-and-vein'] };
        const res = playFromHand(state, DOT);
        const poison = res.state.enemy.effects.find(e => e.effectId === 'debuff_poison');
        expect(poison?.intensity).toBe(2); // authored i1 + venom blessing
    });

    it('mirror-of-guilt (D): a self-debuff lands 1 stack of itself on the enemy too', () => {
        mockSequentialRng(0.05);
        const AMJ = 'against-my-judgment'; // PAID: draw 2 + self-mark d2
        let state = openAndDraft(makePlayer([AMJ]), makeEnemy(300, 'heart'), [AMJ, AMJ, AMJ], 'heart');
        state = { ...state, enemyAttachments: ['mirror-of-guilt'] };
        const res = playFromHand(state, AMJ);
        expect(res.state.player.effects.some(e => e.effectId === 'debuff_mark')).toBe(true);
        const mirrored = res.state.enemy.effects.find(e => e.effectId === 'debuff_mark');
        expect(mirrored).toBeDefined();
        expect(mirrored!.intensity).toBe(1);
    });

    it('mirror-of-guilt (D): an ENEMY-inflicted debuff does NOT reflect (owner ruling 2026-07-12, Bucket B #16)', () => {
        // The face is the contract: "every self-debuff your OWN cards land".
        // The old resolveThreatPhase hook mirrored enemy-inflicted debuffs
        // back at the enemy with no target-validity check — removed.
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        state = rollEncounterDice(state).state;
        state = {
            ...state,
            enemyAttachments: ['mirror-of-guilt'],
            threatPhases: [{
                index: 1, enemyStance: 'mind' as const, isFinalPhase: true,
                threatAction: { description: 'hex probe', effects: [{ effectId: 'debuff_poison', intensity: 1, duration: 2 }] },
            }],
        };
        const res = resolveThreatPhase(state);
        expect(res.state.player.effects.some(e => e.effectId === 'debuff_poison')).toBe(true);  // the hex landed on YOU
        expect(res.state.enemy.effects.some(e => e.effectId === 'debuff_poison')).toBe(false);  // and did NOT reflect
    });

    it('crumbling-resolve (D): a fully blocked attack costs the enemy a rung on the NEXT telegraph', () => {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        state = rollEncounterDice(state).state;
        state = { ...state, guard: 100, enemyAttachments: ['crumbling-resolve'] };
        const res = resolveThreatPhase(state);
        expect(res.state.player.health).toBe(200);       // the wall held
        expect(res.state.staggerRungs).toBe(1);          // the next telegraph starts a rung down
    });
});

// ── WI-1 — suppurating-curse rides the EVENT ticks, not the empty round-clock ─

describe('WI-1 — suppurating-curse doubles the round\'s REAL DoT total', () => {
    const CURSE = 'suppurating-curse';

    it('drips the event-tick total accumulated this round (POISON/BLEED never touch the round-clock)', () => {
        // Simulate a turn that ticked the enemy for 10 via event clocks
        // (card-played poison / damage-instance bleed) — the accumulator the
        // engine folds in `withLog`. The enemy carries NO round-clock DoT, so
        // the OLD gate (`enemyDotTicks.length > 0`) would have dripped zero.
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const seeded: CombatEncounterState = {
            ...base,
            enemy: { ...base.enemy, effects: [ae('debuff_poison', 2, 4)] }, // card-played → round-clock empty
            enemyAttachments: [CURSE],
            enemyDotDamageThisRound: 10,
        };
        const res = processBetweenPhases(seeded);
        const supp = res.events.find(e => e.kind === 'dot-tick'
            && (e as { effectId: string }).effectId === CURSE) as { amount: number } | undefined;
        expect(supp?.amount).toBe(10);                         // doubles the round's real DoT
        expect(300 - res.state.enemy.health).toBe(10);         // only the suppuration drip hit HP
        expect(res.state.enemyDotDamageThisRound).toBe(0);     // accumulator reset for next round
    });

    it('is inert with no real ticks this round (no phantom drip off a standing poison)', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const seeded: CombatEncounterState = {
            ...base,
            enemy: { ...base.enemy, effects: [ae('debuff_poison', 2, 4)] },
            enemyAttachments: [CURSE],
            enemyDotDamageThisRound: 0,
        };
        const res = processBetweenPhases(seeded);
        expect(res.events.some(e => e.kind === 'dot-tick'
            && (e as { effectId: string }).effectId === CURSE)).toBe(false);
        expect(300 - res.state.enemy.health).toBe(0);
    });

    it('LIVE: an EROSION opener ticks poison per card played, then the curse exacts it again', () => {
        mockSequentialRng(0.05);
        // Enemy already bears poison i2 (a prior turn's application); this turn's
        // card play advances the card-played clock on those pre-existing stacks.
        const enemy = makeEnemy(300, 'heart', [ae('debuff_poison', 2, 4)]);
        let state = openAndDraft(makePlayer(['exordium']), enemy, ['exordium', 'exordium', 'exordium'], 'heart');
        state = { ...state, enemyAttachments: [CURSE] };
        const afterPlay = playFromHand(state, 'exordium').state;
        const ticked = afterPlay.enemyDotDamageThisRound ?? 0;
        expect(ticked).toBeGreaterThan(0); // the card-played poison clock really fired

        const hpBeforeBetween = afterPlay.enemy.health;
        const btw = processBetweenPhases(afterPlay);
        const supp = btw.events.find(e => e.kind === 'dot-tick'
            && (e as { effectId: string }).effectId === CURSE) as { amount: number } | undefined;
        expect(supp?.amount).toBe(ticked);                              // drip == the round's real DoT
        // Poison is card-played (never round-clock), so the ONLY HP loss in
        // between-phases is the suppuration drip.
        expect(hpBeforeBetween - btw.state.enemy.health).toBe(ticked);
    });
});

// ── BLEED decay + MARK amplification (T1 / A3) ───────────────────────────────

describe('BLEED — damage-instance clocked (WS3.3), decays 1 intensity per tick', () => {
    it('the round boundary leaves it alone: no tick, no decay, only the calendar counts', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const seeded = { ...base, enemy: { ...base.enemy, effects: [ae('debuff_bleed', 2, 3)] } };
        const res = processBetweenPhases(seeded);
        expect(300 - res.state.enemy.health).toBe(0); // event clock — no boundary tick
        const bleed = res.state.enemy.effects.find(e => e.effectId === 'debuff_bleed');
        expect(bleed?.intensity).toBe(2);             // no tick → no decay
        expect(bleed?.remainingDuration).toBe(2);     // the calendar still counts down
    });

    it('a real damage instance (THORNS reflect) ticks it, then the intensity falls', () => {
        mockSequentialRng(0.5);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const seeded = {
            ...base,
            enemy: { ...base.enemy, effects: [ae('debuff_bleed', 2, 3)] },
            player: { ...base.player, effects: [ae('buff_thorns', 2, 3)] }, // reflect 1 × 2
        };
        const res = resolveThreatPhase(seeded);
        const tick = res.events.find(e => e.kind === 'dot-tick' && e.effectId === 'debuff_bleed') as { amount: number } | undefined;
        expect(tick?.amount).toBe(6); // floor(3 × 2), the front-loaded tick
        const bleed = res.state.enemy.effects.find(e => e.effectId === 'debuff_bleed');
        expect(bleed?.intensity).toBe(1); // decayed 1 per tick
    });
});

describe('MARK — +1 per stack on EVERY DoT tick on the bearer (ratified A3)', () => {
    it('a marked foe bleeds harder from the same round-clocked DoT', () => {
        // WS3.3: poison left the round clocks — kindling ember (round-start,
        // dpr 1) is the boundary witness; MARK amplifies its tick the same.
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const plain = processBetweenPhases({ ...base, enemy: { ...base.enemy, effects: [ae('debuff_kindling_ember', 1, 4)] } });
        expect(300 - plain.state.enemy.health).toBe(1); // ember i1 → 1

        const marked = processBetweenPhases({
            ...base,
            enemy: { ...base.enemy, effects: [ae('debuff_kindling_ember', 1, 4), ae('debuff_mark', 2, 3)] },
        });
        expect(300 - marked.state.enemy.health).toBe(3); // 1 + 2 mark stacks
        const tick = marked.events.find(e => e.kind === 'dot-tick' && e.effectId === 'debuff_kindling_ember') as { amount: number };
        expect(tick.amount).toBe(3); // the emitted tick is the real amplified number
    });
});

// ── Per-preset theme-engine ignition smoke (spec §8 gate, loose) ─────────────

describe('preset ignition — every themed deck reaches its engine within a few rounds', () => {
    /** The theme-engine signal each preset must show in its event log. */
    const SIGNALS: Record<string, (e: CombatEvent) => boolean> = {
        erosion: e => e.kind === 'dot-tick' && e.target === 'enemy',
        oratory: e => e.kind === 'premise-gained',
        foundry: e => e.kind === 'die-forged' || e.kind === 'die-floated',
        penitent: e => e.kind === 'recoil-paid'
            || (e.kind === 'effect-landed' && e.target === 'self' && e.effectId.startsWith('debuff_')),
        standstill: e => e.kind === 'staggered' || e.kind === 'backfired',
        augury: e => e.kind === 'foretold' || e.kind === 'omen-declared',
        tithe: e => e.kind === 'soul-gained',
        grace: e => e.kind === 'sway-gained',
        bastion: e => e.kind === 'effect-landed' && e.effectId === 'buff_thorns',
        refrain: e => e.kind === 'echoed' || e.kind === 'reprised',
    };

    // Gate 0 (2026-07-11 round-turn law) — the old harness fed every hand card
    // to `resolveCombatPhase`, which quietly re-rolled a tray per card (an
    // illegal farm). The smoke now drives the LEGAL auto player (one tray per
    // phase, paid plays + FREE-top drain) over an 8-phase window.
    // pre-Phase-27 interim — re-derived in the honest re-baseline.
    it.each(COMBAT_DECK_PRESET_ORDER.map(id => [id] as const))(
        "preset '%s' ignites its theme engine in a seeded auto-encounter",
        (presetId) => {
            const deck = buildPresetDeck(presetId);
            const player = makePlayer(deck.filter(id => id !== 'card-retreat'));
            const enemy = deepClone(LittleBelle);
            // Enough HP that slower engines (Souls-from-expiry) get their runway.
            enemy.health = 150; enemy.maxHealth = 150;
            const r = runHazardCombatAutoEncounter(player, enemy, {
                seed: 21, policy: 'status', maxTurns: 8,
            });

            const signal = SIGNALS[presetId];
            expect(signal, `no signal registered for preset '${presetId}'`).toBeDefined();
            expect(
                r.state.log.some(signal),
                `preset '${presetId}' never ignited its theme engine within ${r.phaseCount} phases`,
            ).toBe(true);
            // And the encounter stayed healthy (no stalemate runaway).
            expect(r.state.round).toBeLessThanOrEqual(10);
        },
        30_000,
    );
});
