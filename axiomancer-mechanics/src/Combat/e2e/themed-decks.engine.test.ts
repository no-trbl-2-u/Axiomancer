/**
 * Hermetic E2E — spec 32 v3 themed-deck mechanics, LIVE through the engine.
 *
 * One describe per new mechanic:
 *   GHOST DICE (forge → tray now → next turn → spent forever → cap 3 →
 *   reroll/draft-exempt → save-back), PREMISES / SENTENCE (+ CONDEMN),
 *   STAGGER rungs (deny + partial weaken) + BACKFIRE drip, OMEN
 *   declare/hit/miss, SOULS (expiry + REAP fizzle/spend + REAP-all cap),
 *   PLEA (gain / decay / capitulate), ECHO (doubles statuses +
 *   echo-next-spell charge), REPRISE (highest rank back + fireFree),
 *   ENCHANT/DISENCHANT zone play (FREE timed instance / PAID permanent,
 *   unique-in-play, leaves the deck cycle) + persistent hooks
 *   (the-red-ledger, the-sextons-count RECALL/REPLAY/TWIN,
 *   caltrops-under-the-snow), BLEED per-tick decay, MARK tick
 *   amplification — plus a per-preset theme-engine ignition smoke.
 *
 * Seeded / stubbed RNG only (src/test-utils/rng.ts); no disk / network / TTY.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';

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
    getFloatingDiceColors, getDraftedDie, selectCapitulationChoice,
} from '../combat.engine';
import { FLOATING_DICE_CAP } from '../combat.dice';
import { runHazardCombatAutoEncounter } from '../../test-utils/combat-autoplay';
import { THREAT_RUNGS } from '../effects';
import { buildPresetDeck, COMBAT_DECK_PRESET_ORDER } from '../combat.starter-deck-presets';
import { registerSandboxCards, clearSandboxCards } from '../../Cards/cards.sandbox';
import type { Card } from '../../Cards/types';
import type {
    CombatDieColor, CombatEncounterState, CombatEvent, CombatManaDie, CombatThreatPhase,
} from '../combat.encounter.types';

afterEach(() => { vi.restoreAllMocks(); clearSandboxCards(); });

/**
 * Carrier-less verb fixtures. FORGE-a-floating-die and OMEN survived the
 * Profane-Canon rework as ENGINE verbs but lost their library carriers
 * (`ex-nihilo`, `signs-and-portents`) with the spec-32 library. The mechanics
 * are still under test here; only the printed card moved into the fixture.
 */
const FIXTURE_FORGE: Card = {
    id: 'fx-ex-nihilo',
    theme: 'grave',
    name: 'Ex Nihilo (fixture)',
    philosophicalAspect: 'mind',
    description: 'Test carrier for FORGE — a WILD floating die out of nothing.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'FORGE a WILD floating die.',
    free: { pips: 1 },
    specialMechanics: [{ kind: 'forge_floating_die', color: 'wild' }],
    addedIn: '2026-08-08',
    tags: ['grave', 'dice', 'floating'],
};

const FIXTURE_OMEN: Card = {
    id: 'fx-signs-and-portents',
    theme: 'trial',
    name: 'Signs and Portents (fixture)',
    philosophicalAspect: 'heart',
    description: 'Test carrier for OMEN — stake a claim on the next stance.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'OMEN — stake a claim in window 1-2, ante 2 Conviction. On a hit, DRAW 2.',
    free: { foretell: 1 },
    specialMechanics: [{ kind: 'omen', maxWindow: 2, anteConviction: 2, rider: { drawCards: 2 } }],
    addedIn: '2026-08-08',
    tags: ['trial'],
};

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

// ── GHOST DICE — the live tray (spec 32 v3 §5) ────────────────────────────

describe('GHOST DICE — forge, spend-forever, cap, exemptions', () => {
    const FORGE = FIXTURE_FORGE.id; // mind spell: FORGE a WILD floating die
    beforeEach(() => { registerSandboxCards([FIXTURE_FORGE]); });

    it('FORGE joins the tray NOW, persists into the next turn, and is draft-exempt', () => {
        mockSequentialRng(0.05);
        let state = openAndDraft(makePlayer([FORGE]), makeEnemy(300, 'mind'), [FORGE, FORGE, FORGE], 'mind');
        const res = playFromHand(state, FORGE);
        const floated = res.events.find(e => e.kind === 'die-floated') as { dieId: string; color: string } | undefined;
        expect(floated).toBeDefined();
        expect(floated!.color).toBe('wild'); // the fixture forges a WILD die
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
        const DOT = 'spoiled-poultice';
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
        const player = makePlayer(['spoiled-poultice']);
        (player as Character & { floatingDice?: string[] }).floatingDice = ['wild', 'heart'];
        let state = initializeCombatEncounter(player, makeEnemy(100, 'mind'), ['spoiled-poultice'], 7);
        expect(state.floatingDice?.map(d => d.color)).toEqual(['wild', 'heart']);
        state = rollEncounterDice(state).state;
        // The floating pool is merged into the first turn's tray.
        expect(state.dice.filter(d => d.floating).length).toBe(2);
    });
});

// ── PREMISES + SENTENCE (T2) ───────────────────────────────────────────────

describe('PREMISES / SENTENCE — the declared conclusion and the CONDEMN alt-win', () => {
    // THE BIG NUMBERS REWRITE rescaled both: SENTENCE at 12 / CONDEMN at 14,
    // rider RUPTURE-every-MARK for 8 apiece; the opener's FREE line banks 2.
    const CLOSER = 'the-black-cap';      // SENTENCE at 12 (CONDEMN at 14); rider: marks×8, stagger 2, draw 2
    const OPENER = 'petty-indictment';   // FREE: +2 Charges

    function declared(enemyEffects: ActiveEffect[] = []): CombatEncounterState {
        mockSequentialRng(0.05);
        const state = openAndDraft(
            makePlayer([CLOSER, OPENER]), makeEnemy(300, 'heart', enemyEffects),
            [CLOSER, OPENER, OPENER, OPENER, OPENER], 'heart');
        const res = playFromHand(state, CLOSER);
        expect(res.events.some(e => e.kind === 'peroration-declared')).toBe(true);
        expect(res.state.peroration).toMatchObject({ cardId: CLOSER, at: 12, concedeAt: 14 });
        return res.state;
    }

    it('reaching the printed count fires the conclusion FREE and resets the tally', () => {
        let state = declared([ae('debuff_mark', 2, 3)]);
        state = { ...state, premises: 10 };
        const hpBefore = state.enemy.health;
        const convBefore = state.conviction;
        const res = playFromHand(state, OPENER, false); // FREE: +2 Charges → 12
        expect(res.events.some(e => e.kind === 'peroration-fired')).toBe(true);
        expect(res.state.premises).toBe(0);                       // tally resets
        expect(res.state.peroration).toMatchObject({ cardId: CLOSER }); // stays declared
        // ruptureMarks 8 × 2 consumed stacks = 16 burst; the rider draws 2.
        expect(hpBefore - res.state.enemy.health).toBe(16);
        expect(res.state.enemy.effects.some(e => e.effectId === 'debuff_mark')).toBe(false);
        expect(res.state.conviction).toBe(convBefore); // the canon rider antes no Conviction
        expect(res.events.some(e => e.kind === 'hand-drawn')).toBe(true);
    });

    it('reaching the printed CONDEMN count first wins the argument outright', () => {
        let state = declared();
        state = { ...state, premises: 12 };
        const res = playFromHand(state, OPENER, false); // +2 → 14 ≥ concedeAt
        expect(res.state.finalOutcome).toBe('concede');
        expect(res.state.phase).toBe('complete');
        expect(res.events.some(e => e.kind === 'combat-ended' && e.outcome === 'concede')).toBe(true);
    });
});

// ── STAGGER + BACKFIRE (T5) ──────────────────────────────────────────────────

describe('STAGGER rungs — full removal denies the turn; BACKFIRE drips per rung', () => {
    const ZENO = 'scolds-bridle'; // STAGGER 1 + BACKFIRE 1

    it('stripping every rung DENIES the telegraph and BACKFIRE drips per denied rung', () => {
        // 0.2 rolls BODY dice — Scold's Bridle is a body spell and the color
        // law (2026-07-09) demands a matching (or wild) powering die. No seed:
        // a seed installs its own rng stream and the mock would never apply.
        mockSequentialRng(0.2);
        const enemy = makeEnemy(300, 'mind', [ae('debuff_backfire', 1, 3)]);
        let opened = rollEncounterDice(
            initializeCombatEncounter(makePlayer([ZENO]), enemy, [ZENO, ZENO, ZENO, ZENO, ZENO]),
        ).state;
        // Gate 0 (round-turn law): the second ZENO can no longer ride a free
        // tray re-roll — arm a GHOST body die so both plays are legal
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
        // BACKFIRE drips intensity × denied rungs. Scold's Bridle carries its
        // own BACKFIRE on BOTH faces, and `resolveCombatPhase` drains the FREE
        // tops too, so the standing stack by resolution is the seeded 1 plus
        // 2 plays × (PAID 1 + FREE 1) = 5 — read it off the last landing
        // rather than pinning a literal that the card text owns.
        const landed = res.events.filter(
            (e): e is Extract<CombatEvent, { kind: 'effect-landed' }> =>
                e.kind === 'effect-landed' && e.effectId === 'debuff_backfire',
        );
        const stack = landed[landed.length - 1]!.intensity;
        const backfired = res.events.find(e => e.kind === 'backfired') as { amount: number; rungs: number } | undefined;
        expect(backfired).toBeDefined();
        expect(backfired!.rungs).toBe(THREAT_RUNGS);
        expect(backfired!.amount).toBe(THREAT_RUNGS * stack);
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
    const OMEN_CARD = FIXTURE_OMEN.id; // OMEN: on hit, draw 2
    beforeEach(() => { registerSandboxCards([FIXTURE_OMEN]); });

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
        // the OMEN fixture is a HEART spell: the color law demands a heart
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

describe('SOULS — expiry yields, REAP spends, REAP-all bursts uncapped', () => {
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

    it('REAP fizzles underfunded; funded, it spends the Souls and fires (PLEA + QUARTER + KINDLE)', () => {
        mockSequentialRng(0.05);
        const PLATE = 'the-offertory-plate'; // REAP cost 3: PLEA 18 + QUARTER 3 + KINDLE(heart)
        const DOT = 'spoiled-poultice';
        const deck = [PLATE, PLATE, PLATE, PLATE, PLATE, DOT, DOT, DOT, DOT];
        const broke = openAndDraft(makePlayer([PLATE, DOT]), makeEnemy(300, 'heart'), deck, 'heart');
        const fizzled = playFromHand(broke, PLATE);
        expect(fizzled.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(fizzled.state.souls ?? 0).toBe(0);
        expect(fizzled.state.sway ?? 0).toBe(0); // the underfunded REAP applies NOTHING

        let funded = openAndDraft(makePlayer([PLATE, DOT]), makeEnemy(300, 'heart'), deck, 'heart');
        funded = { ...funded, souls: 5 };
        const res = playFromHand(funded, PLATE);
        expect(res.state.souls).toBe(2); // 5 − cost 3
        expect(res.events.some(e => e.kind === 'reaped')).toBe(true);
        expect(res.events.some(e => e.kind === 'die-forged')).toBe(true); // KINDLE joins the Reserve
        expect(res.state.reserve?.some(d => d.color === 'heart' && d.temporary)).toBe(true);
        expect(res.state.sway ?? 0).toBe(18); // the card's printed PLEA 18
        expect(res.state.enemy.effects.some(e => e.effectId === 'debuff_quarter')).toBe(true);
    });

    it('REAP-all spends EVERY Soul and the burst is UNCAPPED', () => {
        // The exact 3-per-Soul multiplier and the old flat 200 cap it used to
        // butt against are both repealed (big-numbers overhaul §3 L12, §10) —
        // this only proves the ALL-spender still empties the whole bank and
        // that no cap swallows the payoff: a heavily-fed REAP-all clears a
        // large fraction of the foe's max VITAE, not a pinned flat ceiling.
        mockSequentialRng(0.05);
        const REAP = 'miserere'; // REAP all (profane canon)
        // The foe is deliberately far larger than the burst so the whole
        // payoff is observable in VITAE rather than clipped at 0.
        let state = openAndDraft(makePlayer([REAP]), makeEnemy(2000, 'heart'), [REAP, REAP, REAP], 'heart');
        state = { ...state, souls: 60 };
        const hpBefore = state.enemy.health;
        const maxHealth = state.enemy.maxHealth;
        const res = playFromHand(state, REAP);
        const reaped = res.events.find(e => e.kind === 'reaped') as { soulsSpent: number; amount: number };
        expect(reaped.soulsSpent).toBe(60); // the ALL-spender empties the whole bank
        // Uncapped: fed 60 Souls, the burst clears a large share of the foe's
        // max VITAE — proof there is no flat ceiling swallowing the payoff.
        expect(reaped.amount).toBeGreaterThan(maxHealth * 0.2);
        expect(res.state.souls).toBe(0);
        expect(hpBefore - res.state.enemy.health).toBe(reaped.amount);
    });
});

// ── PLEA (T8) ────────────────────────────────────────────────────────────────

describe('PLEA — gain, per-turn decay, RELENT', () => {
    const SOFT = 'thin-hymn'; // PAID: PLEA 8 (FREE: PLEA 3)

    it('gains stack and decays 1 at the turn boundary', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([SOFT]), makeEnemy(300, 'heart'), [SOFT, SOFT, SOFT, SOFT, SOFT], 'heart');
        const res = playFromHand(state, SOFT);
        expect(res.state.sway).toBe(8); // the PAID line's printed PLEA 8
        const after = resolveThreatPhase(res.state);
        expect(after.state.sway).toBe(7); // decayed 1
        expect(after.events.some(e => e.kind === 'sway-decayed')).toBe(true);
    });

    it('PLEA >= enemy current HP opens a player-authored capitulation choice', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([SOFT]), makeEnemy(4, 'heart'), [SOFT, SOFT, SOFT, SOFT, SOFT], 'heart');
        const res = playFromHand(state, SOFT); // PLEA 3 meets the 4-HP foe's capitulate threshold
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

    it('a DEFEATED enemy cannot capitulate — HP 0 resolves as victory even with PLEA up', () => {
        // Engine-truth pin for the capitulate/victory tie: sway 3 vs a foe about
        // to die to the burst must record VICTORY.
        mockSequentialRng(0.05);
        const REAP = 'miserere';
        let state = openAndDraft(makePlayer([REAP]), makeEnemy(6, 'heart'), [REAP, REAP, REAP], 'heart');
        state = { ...state, souls: 10, sway: 3 };
        const res = playFromHand(state, REAP); // burst 30 → HP 0
        expect(res.state.finalOutcome).toBe('victory');
    });
});

// ── ECHO + REPRISE (T10) ─────────────────────────────────────────────────────

describe('ECHO — the PAID payload fires twice', () => {
    // THE BIG NUMBERS REWRITE rewrote the ECHO carriers. `the-keening` is the
    // one that still lands a STATUS (DOOM 3 for 3) alongside its hit, so it is
    // the witness for "the PAID status payload fires twice".
    const REFRAIN = 'the-keening'; // Deal 8 + DOOM i3 d3, ECHO (heart)

    it('an ECHO card lands its status twice (intensity stacks)', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([REFRAIN]), makeEnemy(300, 'heart'), [REFRAIN, REFRAIN, REFRAIN], 'heart');
        const res = playFromHand(state, REFRAIN);
        expect(res.events.some(e => e.kind === 'echoed')).toBe(true);
        const doom = res.state.enemy.effects.find(e => e.effectId === 'debuff_creeping_doom');
        expect(doom?.intensity).toBe(6); // authored i3, applied twice
    });

    it('a pending echo_next_spell charge echoes the NEXT spell, then is consumed', () => {
        mockSequentialRng(0.05);
        // The library has carried no echo_next_spell CARRIER since D8; the
        // engine mechanic itself is still live, so the charge is seeded
        // directly on the state and a canon DOOM carrier witnesses the
        // doubled payload + charge consumption.
        const TOLLER = 'the-sextons-bell'; // Deal 10 + DOOM i4 (heart)
        // Enemy stance HEART: the wild die re-reads as the card's heart
        // stance, so the read stays NEUTRAL and no read-intensity bonus
        // muddies the echo.
        let state = openAndDraft(
            makePlayer([TOLLER]), makeEnemy(300, 'heart'),
            [TOLLER, TOLLER, TOLLER, TOLLER], 'mind');
        // A banked Reserve die powers the spell (WILD — the color law demands
        // a matching die for the heart spell, and wild is the exception).
        state = {
            ...state,
            reserve: [{ id: 'bank-echo', color: 'wild', state: 'available', temporary: false, pips: 0 }],
            echoNextSpell: true, // the pending charge under test
        };
        const res = playFromHand(state, TOLLER, true, 'bank-echo');
        expect(res.events.some(e => e.kind === 'echoed')).toBe(true);
        const doom = res.state.enemy.effects.find(e => e.effectId === 'debuff_creeping_doom');
        expect(doom?.intensity).toBe(8); // authored i4, applied twice
        expect(res.state.echoNextSpell).toBe(false); // the charge is consumed
    });
});

describe('REPRISE — returns the highest-rank discard; fireFree fires its FREE line', () => {
    it('reprise picks the HIGHEST-RANK card out of the discard pile', () => {
        mockSequentialRng(0.05);
        const SECOND = 'shallow-grave'; // RECALL 1 (heart)
        let state = openAndDraft(makePlayer([SECOND]), makeEnemy(300, 'heart'), [SECOND, SECOND, SECOND], 'heart');
        // ranks 1, 5, 1 — the pile's highest rank is the one that comes back.
        state = { ...state, discard: ['spoiled-poultice', 'open-every-grave', 'petty-indictment'] };
        const res = playFromHand(state, SECOND);
        const reprised = res.events.find(e => e.kind === 'reprised') as { returned: string[] } | undefined;
        expect(reprised).toBeDefined();
        expect(reprised!.returned).toEqual(['open-every-grave']);
        expect(res.state.hand.some(h => h.cardId === 'open-every-grave')).toBe(true);
        expect(res.state.discard).not.toContain('open-every-grave');
    });

    it('a fireFree RECALL also fires the reprised FREE line', () => {
        // PROFANE CANON (2026-08-08): no library card prints `fireFree` any
        // more (circular-reasoning died with the spec-32 library), so the verb
        // is exercised through a synthetic carrier — the ENGINE branch, not the
        // retired card, is what this pins.
        mockSequentialRng(0.05);
        const CIRC: Card = {
            id: 'fx-circular-reasoning',
            theme: 'grave',
            name: 'Circular Reasoning (fixture)',
            philosophicalAspect: 'mind',
            description: 'Test carrier for RECALL + fireFree.',
            tier: 1, rank: 2, cardType: 'spell',
            targetType: 'self',
            paidSummary: 'RECALL 1 card and fire its FREE line.',
            free: { foretell: 1 },
            specialMechanics: [{ kind: 'reprise', count: 1, fireFree: true }],
            addedIn: '2026-08-08',
            tags: ['grave'],
        };
        registerSandboxCards([CIRC]);
        let state = openAndDraft(makePlayer([CIRC.id]), makeEnemy(300, 'mind'), [CIRC.id, CIRC.id, CIRC.id], 'mind');
        state = { ...state, discard: ['petty-indictment'] }; // FREE: +2 Charges
        const res = playFromHand(state, CIRC.id);
        expect(res.state.hand.some(h => h.cardId === 'petty-indictment')).toBe(true);
        expect(res.state.premises).toBe(2); // the reprised FREE line fired
    });
});

// ── the-sextons-count — RECALL / REPLAY / TWIN (phase 86 wire) ───────────────

function tollEvents(events: CombatEvent[]): CombatEvent[] {
    return events.filter(e => e.kind === 'damage-dealt' && (e as { cardId?: string }).cardId === 'the-sextons-count');
}

describe('the-sextons-count — RECALL, REPLAY, and TWIN each toll 8 VITAE + MILL 1', () => {
    it('RECALL (reprise) tolls the bell once', () => {
        mockSequentialRng(0.05);
        const RECALL_CARD = 'shallow-grave'; // Deal 11, RECALL 1 (heart) — no replay/twin of its own
        let state = openAndDraft(makePlayer([RECALL_CARD]), makeEnemy(300, 'heart'), [RECALL_CARD, RECALL_CARD, RECALL_CARD], 'heart');
        state = { ...state, persistentZone: ['the-sextons-count'], discard: ['spoiled-poultice'] };
        const res = playFromHand(state, RECALL_CARD);
        expect(res.events.some(e => e.kind === 'reprised')).toBe(true);
        expect(tollEvents(res.events)).toHaveLength(1);
        expect(res.events.some(e => e.kind === 'cards-milled')).toBe(true);
    });

    it('REPLAY (with no reprise of its own) tolls the bell once', () => {
        // A synthetic carrier isolates REPLAY from RECALL — every REAL
        // replay_last card in the library (open-every-grave,
        // nothing-stays-buried) also prints reprise on the SAME card, and
        // REPLAY's own toll mills a card into the discard as a side effect,
        // which would let a same-card reprise succeed off that milled card
        // and muddy this test's count.
        mockSequentialRng(0.05);
        const REPLAY_ONLY: Card = {
            id: 'fx-replay-only', theme: 'grave', name: 'Replay Only (fixture)',
            philosophicalAspect: 'heart', description: 'Test carrier for REPLAY with no reprise.',
            tier: 1, rank: 2, cardType: 'spell', targetType: 'enemy',
            paidSummary: 'REPLAY your last spell 1 time.',
            free: { damage: 1 },
            specialMechanics: [{ kind: 'replay_last', times: 1 }],
            addedIn: '2026-09-16', tags: ['grave'],
        };
        registerSandboxCards([REPLAY_ONLY]);
        let state = openAndDraft(makePlayer([REPLAY_ONLY.id]), makeEnemy(300, 'heart'), [REPLAY_ONLY.id, REPLAY_ONLY.id, REPLAY_ONLY.id], 'heart');
        state = {
            ...state,
            persistentZone: ['the-sextons-count'],
            discard: [],
            lastSpellCardId: 'spoiled-poultice',
            lastSpellRound: state.round,
        };
        const res = playFromHand(state, REPLAY_ONLY.id);
        expect(res.events.some(e => e.kind === 'echoed')).toBe(true); // REPLAY fired
        expect(tollEvents(res.events)).toHaveLength(1);
    });

    it('TWIN (a card with no reprise/replay of its own, resolving under an armed charge) tolls the bell once', () => {
        mockSequentialRng(0.05);
        const PLAIN = 'spoiled-poultice'; // Deal 7 + POISON, no reprise/replay/echo (body)
        let state = openAndDraft(makePlayer([PLAIN]), makeEnemy(300, 'body'), [PLAIN, PLAIN, PLAIN], 'body');
        state = { ...state, persistentZone: ['the-sextons-count'], twinArmed: true };
        const res = playFromHand(state, PLAIN);
        expect(res.events.some(e => e.kind === 'twin-fired')).toBe(true);
        expect(tollEvents(res.events)).toHaveLength(1);
    });

    it('a REPLAY/RECALL carrier resolving under an armed TWIN charge tolls once PER real trigger, not a third time for the doubling itself', () => {
        // The loop-call this guards against (AUDIT.md, 2026-09-04): a naive
        // TWIN-charge-based toll fires unconditionally alongside RECALL/
        // REPLAY's own sites, double- (here triple-) counting a single
        // doubled resolution. `sextonsTolled` (set by the RECALL/REPLAY
        // sites) suppresses the generic TWIN site for exactly this case.
        mockSequentialRng(0.05);
        const BOTH = 'open-every-grave'; // REPLAY x2 + RECALL 1 (heart)
        let state = openAndDraft(makePlayer([BOTH]), makeEnemy(300, 'heart'), [BOTH, BOTH, BOTH], 'heart');
        state = {
            ...state,
            persistentZone: ['the-sextons-count'],
            discard: ['spoiled-poultice'],
            lastSpellCardId: 'spoiled-poultice',
            lastSpellRound: state.round,
            twinArmed: true,
        };
        const res = playFromHand(state, BOTH);
        expect(res.events.some(e => e.kind === 'twin-fired')).toBe(true);
        expect(res.events.some(e => e.kind === 'echoed')).toBe(true);
        expect(res.events.some(e => e.kind === 'reprised')).toBe(true);
        expect(tollEvents(res.events)).toHaveLength(2); // REPLAY + RECALL, not a 3rd from the TWIN site
    });
});

// ── ENCHANT / DISENCHANT — FREE timed instance vs PAID permanent (spec 32 v4 §2) ─

describe('ENCHANT / DISENCHANT — FREE timed line, PAID permanent, unique-in-play', () => {
    // PROFANE CANON carriers (both mind): the enchantment bills BLEED on every
    // RECOIL paid; the disenchant drips off the discard pile at end of round.
    const ENCH = 'the-red-ledger';            // rot/debt enchantment
    const CURSE = 'the-congregation-below';   // grave disenchant

    it('FREE (dieless): drops a TIMED enchant into tempZone for 3 rounds and RECYCLES the card', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([ENCH]), makeEnemy(300, 'mind'), [ENCH, ENCH, ENCH], 'mind');
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

    it('a TEMP enchant fires the exact same hook as the permanent one (the ledger bills a RECOIL)', () => {
        mockSequentialRng(0.05);
        const DEBT = 'the-vig'; // mind spell, RECOIL 2 — color law needs a mind die
        let state = openAndDraft(makePlayer([DEBT]), makeEnemy(300, 'mind'), [DEBT, DEBT, DEBT], 'mind');
        state = { ...state, tempZone: [{ cardId: ENCH, roundsLeft: 3 }] };
        const res = playFromHand(state, DEBT);
        // The billed WRATH+damage comes from the TIMED instance, not a permanent one.
        expect(res.events.some(e => e.kind === 'wrath-gained'
            && (e as { cardId?: string }).cardId === ENCH)).toBe(true);
        expect(res.events.some(e => e.kind === 'damage-dealt'
            && (e as { cardId?: string }).cardId === ENCH)).toBe(true);
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
        const state = openAndDraft(makePlayer([ENCH]), makeEnemy(300, 'mind'), [ENCH, ENCH, ENCH], 'mind');
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
        let state = openAndDraft(makePlayer([ENCH]), makeEnemy(300, 'mind'), [ENCH, ENCH, ENCH], 'mind');
        state = { ...state, tempZone: [{ cardId: ENCH, roundsLeft: 2 }] };
        const res = playFromHand(state, ENCH);
        expect(res.state.persistentZone).toEqual([ENCH]);
        expect(res.state.tempZone).toEqual([]);                     // promoted, not double-counted
    });

    it('FREE fizzles when the PERMANENT version is already standing', () => {
        mockSequentialRng(0.05);
        let state = openAndDraft(makePlayer([ENCH]), makeEnemy(300, 'mind'), [ENCH, ENCH, ENCH], 'mind');
        state = { ...state, persistentZone: [ENCH] };
        const res = playFromHand(state, ENCH, false);
        expect(res.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(res.state.tempZone ?? []).toEqual([]);
    });

    it('unique-in-play: a second PAID copy fizzles', () => {
        mockSequentialRng(0.05);
        let state = openAndDraft(makePlayer([ENCH]), makeEnemy(300, 'mind'), [ENCH, ENCH, ENCH], 'mind');
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

describe('persistent hooks — the-red-ledger, caltrops-under-the-snow', () => {
    it('the-red-ledger (E): every RECOIL paid is billed again — WRATH 1 and 6 to the foe', () => {
        // Card face (THE BIG NUMBERS REWRITE, 2026-09-02): "Whenever you pay
        // RECOIL, gain WRATH 1 and deal 6 to the foe." Pinned to the printed
        // numbers as of the 2026-09-04 /adjust-cards card-face-honesty fix
        // (this test used to pin the pre-rewrite BLEED-billing hook, which
        // no longer matched the card's own text).
        mockSequentialRng(0.05);
        const DEBT = 'the-vig'; // mind spell, RECOIL 2 — color law needs a mind die
        let state = openAndDraft(makePlayer([DEBT]), makeEnemy(300, 'mind'), [DEBT, DEBT, DEBT], 'mind');
        state = { ...state, persistentZone: ['the-red-ledger'] };
        const res = playFromHand(state, DEBT);
        expect(res.state.wrath).toBe(1);
        const dealt = res.events.find(e => e.kind === 'damage-dealt'
            && (e as { cardId?: string }).cardId === 'the-red-ledger') as { amount: number } | undefined;
        expect(dealt?.amount).toBe(6);
    });

    // (An enemy-inflicted debuff must never reflect back onto the enemy —
    // owner ruling 2026-07-12, Bucket B #16: "every self-debuff YOUR OWN
    // cards land" is the contract, so a hex the enemy inflicts on you is not
    // eligible. The hook this guarded against — a since-deleted dead-card
    // mirror keyed to `mirror-of-guilt`, retired phase 86 (2026-09-16) — is
    // gone from `combat.engine.ts` entirely now; this test keeps using the
    // same attachment id as an arbitrary probe value, since the invariant
    // it's pinning is `resolveThreatPhase` never reflecting ANY enemy-borne
    // debuff, regardless of what's attached.)
    it('an ENEMY-inflicted debuff does NOT reflect onto the enemy (owner ruling 2026-07-12, Bucket B #16)', () => {
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

    it('caltrops-under-the-snow (D): an unguarded enemy hit seeds BLEED 8', () => {
        // Card face (THE BIG NUMBERS REWRITE, 2026-09-02): "Whenever the foe
        // deals you damage it gains BLEED 8." Added 2026-09-04 /adjust-cards —
        // this hook had no e2e coverage before the pass fixed its magnitude
        // (BLEED 2 -> 8).
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        state = rollEncounterDice(state).state;
        state = {
            ...state,
            guard: 0,
            enemyAttachments: ['caltrops-under-the-snow'],
            threatPhases: [{
                index: 1, enemyStance: 'mind' as const, isFinalPhase: true,
                threatAction: { description: 'a cold blow', effects: [{ damage: 10 }] },
            }],
        };
        const res = resolveThreatPhase(state);
        const bleed = res.state.enemy.effects.find(e => e.effectId === 'debuff_bleed');
        expect(bleed?.intensity).toBe(8);
    });

    it('caltrops-under-the-snow (D): a fully blocked enemy hit costs it 15', () => {
        // Card face: "Whenever your GUARD fully blocks its attack it takes
        // 15 damage." Added 2026-09-04 /adjust-cards — this clause had NO
        // engine hook at all before the pass.
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        state = rollEncounterDice(state).state;
        state = {
            ...state,
            guard: 100,
            enemyAttachments: ['caltrops-under-the-snow'],
            threatPhases: [{
                index: 1, enemyStance: 'mind' as const, isFinalPhase: true,
                threatAction: { description: 'a cold blow', effects: [{ damage: 10 }] },
            }],
        };
        const res = resolveThreatPhase(state);
        expect(300 - res.state.enemy.health).toBe(15);
    });

    it('the-assize-bell (E): every rung STAGGER/BACKFIRE denies grants 2 CHARGES and 4 direct damage', () => {
        // Card face: "Whenever STAGGER or BACKFIRE denies the foe a rung of
        // its telegraph, gain 2 CHARGES and deal 4 to the foe." Added
        // 2026-09-04 /adjust-cards — this hook had no e2e coverage before
        // the pass fixed its magnitude (1 CHARGE, no damage -> 2 CHARGES + 4
        // damage).
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        state = rollEncounterDice(state).state;
        state = {
            ...state,
            staggerRungs: 1,
            enemyAttachments: ['the-assize-bell'],
            threatPhases: [{
                index: 1, enemyStance: 'mind' as const, isFinalPhase: true,
                threatAction: { description: 'an objection', effects: [{ damage: 10 }] },
            }],
        };
        const res = resolveThreatPhase(state);
        expect(res.state.premises).toBe(2);
        expect(300 - res.state.enemy.health).toBe(4);
    });

    it('writ-of-attainder (D): a fresh DOOM 3 and 2 CHARGES land at each round\'s end', () => {
        // Card face: "inflict DOOM 3 on the foe and gain 2 CHARGES." Added
        // 2026-09-04 /adjust-cards — this hook had no e2e coverage before
        // the pass fixed the DOOM magnitude (1 -> 3) and added the missing
        // CHARGES grant.
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const seeded: CombatEncounterState = { ...base, enemyAttachments: ['writ-of-attainder'] };
        const res = processBetweenPhases(seeded);
        const doom = res.state.enemy.effects.find(e => e.effectId === 'debuff_creeping_doom');
        expect(doom?.intensity).toBe(3);
        expect(res.state.premises).toBe(2);
    });

    it('every-stone-an-oath (E): a bloodless round grants BARRIER 12 and THORNS 4', () => {
        // Card face: "gain BARRIER 12 and THORNS 4 for 2 turns." Added
        // 2026-09-04 /adjust-cards — this hook had no e2e coverage before the
        // pass fixed the BARRIER magnitude (3 -> 12) and added the missing
        // THORNS grant.
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const seeded: CombatEncounterState = {
            ...base, persistentZone: ['every-stone-an-oath'], enemyDamageThisTurn: 0,
        };
        const res = processBetweenPhases(seeded);
        expect(res.state.barrier).toBe(12);
        const thorns = res.state.player.effects.find(e => e.effectId === 'buff_thorns');
        expect(thorns?.intensity).toBe(4);
    });
});

// ── The round-end persistent battery — the canon disenchant clock ───────────

describe('the-congregation-below (D) — the discard pile IS the kill clock', () => {
    const CURSE = 'the-congregation-below';

    it('drips 1 VITAE per 2 cards in the discard pile at the close of the round', () => {
        // Card face (THE BIG NUMBERS REWRITE, 2026-09-02): "the foe loses 1
        // VITAE for every 2 cards in your discard pile." Pinned to the
        // printed divisor as of the 2026-09-04 /adjust-cards card-face-honesty
        // fix (this test used to pin the pre-rewrite divisor of 3, which no
        // longer matched the card's own text).
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const seeded: CombatEncounterState = {
            ...base,
            enemyAttachments: [CURSE],
            discard: Array.from({ length: 10 }, () => 'spoiled-poultice'), // floor(10 / 2) = 5
        };
        const res = processBetweenPhases(seeded);
        const drip = res.events.find(e => e.kind === 'dot-tick'
            && (e as { effectId: string }).effectId === CURSE) as { amount: number } | undefined;
        expect(drip?.amount).toBe(5);
        expect(300 - res.state.enemy.health).toBe(5); // only the testimony hit HP
    });

    it('is inert below the first rung (a one-card pile reads out nothing)', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const seeded: CombatEncounterState = {
            ...base,
            enemyAttachments: [CURSE],
            discard: ['spoiled-poultice'],
        };
        const res = processBetweenPhases(seeded);
        expect(res.events.some(e => e.kind === 'dot-tick'
            && (e as { effectId: string }).effectId === CURSE)).toBe(false);
        expect(300 - res.state.enemy.health).toBe(0);
    });

    it('LIVE: the pile the player actually built is the number that lands', () => {
        mockSequentialRng(0.05);
        const enemy = makeEnemy(300, 'heart', [ae('debuff_poison', 2, 4)]);
        const OPENER = 'thin-hymn'; // heart spell — the color law needs a heart die
        let state = openAndDraft(makePlayer([OPENER]), enemy, [OPENER, OPENER, OPENER], 'heart');
        state = {
            ...state,
            enemyAttachments: [CURSE],
            discard: Array.from({ length: 5 }, () => 'spoiled-poultice'),
        };
        const afterPlay = playFromHand(state, OPENER).state;
        const expected = Math.floor(afterPlay.discard.length / 2);
        expect(expected).toBeGreaterThan(0); // the played card joined the pile

        const btw = processBetweenPhases(afterPlay);
        const drip = btw.events.find(e => e.kind === 'dot-tick'
            && (e as { effectId: string }).effectId === CURSE) as { amount: number } | undefined;
        expect(drip?.amount).toBe(expected);
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
    /** The theme-engine signal each campaign snapshot must show in its log.
     *  PROFANE CANON (2026-08-08): the ten theme presets became three
     *  snapshots of ONE evolving deck, so the signal is the stage's spine —
     *  rot's DoT clock throughout, joined by debt's RECOIL at the pilgrim
     *  trimming and vigil's reflect wall at the apostate one. */
    const SIGNALS: Record<string, (e: CombatEvent) => boolean> = {
        threadbare: e => e.kind === 'dot-tick' && e.target === 'enemy',
        pilgrim: e => (e.kind === 'dot-tick' && e.target === 'enemy')
            || e.kind === 'recoil-paid',
        apostate: e => (e.kind === 'dot-tick' && e.target === 'enemy')
            || e.kind === 'recoil-paid'
            || (e.kind === 'effect-landed' && e.effectId === 'buff_thorns'),
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
