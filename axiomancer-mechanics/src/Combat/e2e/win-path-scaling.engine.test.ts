/**
 * Hermetic E2E — plan/tuning/2026-07-08-win-path-scaling.md item 1: alt-win
 * paths scale with the stage curve instead of the flat pre-fix checks that
 * let Oratory/Standstill sit at 100% win rate on EVERY stage while Grace's
 * RELENT was unreachable late (Battle Lab round 2).
 *
 *   (A) CONDEMN — The Black Cap's Premise requirement floors at the
 *       enemy's own `difficulty` classification (CONCEDE_PREMISES_BASE/
 *       _ELITE/_BOSS), not a flat 8 everywhere.
 *   (B) RELENT — PLEA >= capitulateThreshold(enemy), a Dawncaster
 *       Charmed-style `resolve` well below max HP, clamped to never exceed
 *       CURRENT health (so a nearly-dead enemy still yields at the old bar).
 *   (C) Boss/unique rung REGROWTH — an anti-permalock: a boss/unique whose
 *       telegraph loses rungs regrows resilience for future phases, capped
 *       at doubling its natural rung count. Normal/elite enemies unaffected.
 *
 * Seeded / stubbed RNG only (src/test-utils/rng.ts); no disk / network / TTY.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy, EnemyDifficulty } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase, selectCapitulationChoice,
} from '../combat.engine';
import {
    CONCEDE_PREMISES_BASE, CONCEDE_PREMISES_ELITE, CONCEDE_PREMISES_BOSS,
    CONCEDE_PREMISES_UNIQUE, concedeFloorFor,
    CAPITULATE_RESOLVE_FRACTION, CAPITULATE_MIN, capitulateThreshold,
    THREAT_RUNGS, THREAT_RUNGS_BOSS, BOSS_RUNG_REGROWTH, bossRungGrowthCap,
} from '../effects';
import type {
    CombatDieColor, CombatEncounterState, CombatThreatPhase,
} from '../combat.encounter.types';

afterEach(() => { vi.restoreAllMocks(); });

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    return p;
}

function makeEnemy(
    hp: number,
    stance: 'heart' | 'body' | 'mind' = 'mind',
    difficulty?: EnemyDifficulty,
    currentHp?: number,
): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-wps-dummy';
    e.maxHealth = hp;
    e.health = currentHp ?? hp;
    e.effects = [];
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    if (difficulty) e.difficulty = difficulty;
    return e;
}

/** Spec 33 tray: every non-X die shows a MANA face (can power a paid line). */
function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c,
        state: c === 'x' ? ('locked' as const) : ('available' as const), temporary: false,
        face: c === 'x' ? ('miss' as const) : ('mana' as const),
    }));
    const floating = state.dice.filter(d => d.floating);
    return { ...state, dice: [...dice, ...floating], draftedDieId: null, turn };
}

/** Opens the encounter with a known tray: `die` (powers paid plays) + a dead X. */
function openWithDie(player: Character, enemy: Enemy, deck: string[], die: CombatDieColor, seed = 7): CombatEncounterState {
    let state = initializeCombatEncounter(player, enemy, deck, seed);
    state = rollEncounterDice(state).state;
    state = setDice(state, [die, 'x']);
    return state;
}

function playFromHand(state: CombatEncounterState, cardId: string, useBottom = true, dieId?: string) {
    const entry = state.hand.find(h => h.cardId === cardId);
    expect(entry, `${cardId} should be in hand`).toBeDefined();
    return playCombatCard(state, { uid: entry!.uid }, useBottom, dieId);
}

function customPhases(stances: ('heart' | 'body' | 'mind')[], damage = 6): CombatThreatPhase[] {
    return stances.map((s, i) => ({
        index: i + 1, enemyStance: s, isFinalPhase: i === stances.length - 1,
        threatAction: { description: 'wps probe', effects: [{ damage }] },
    }));
}

// ── (A) CONDEMN scales with enemy difficulty ─────────────────────────────────

describe('CONDEMN Premises scale with enemy difficulty (item 1a)', () => {
    const CLOSER = 'the-black-cap';    // SENTENCE at 12; concedeAt (printed) 14
    const OPENER = 'petty-indictment'; // FREE: +2 Premises

    function declared(enemy: Enemy): CombatEncounterState {
        mockSequentialRng(0.05);
        const state = openWithDie(
            makePlayer([CLOSER, OPENER]), enemy,
            [CLOSER, OPENER, OPENER, OPENER, OPENER], 'heart');
        const res = playFromHand(state, CLOSER, true, state.dice[0].id);
        expect(res.events.some(e => e.kind === 'peroration-declared')).toBe(true);
        return res.state;
    }

    /**
     * THE BIG NUMBERS REWRITE (2026-09-02) moved The Black Cap's printed
     * `concedeAt` from 8 to 14, i.e. ABOVE every difficulty floor, so the live
     * card can no longer exercise `concedeFloorFor`. These cases re-declare
     * the peroration with a printed number BELOW the floors so the floor rule
     * is what is actually under test; `at: 99` keeps the SENTENCE rider from
     * firing and resetting the tally before the concede check.
     */
    function declaredAt(enemy: Enemy, concedeAt: number): CombatEncounterState {
        return { ...declared(enemy), peroration: { cardId: CLOSER, at: 99, concedeAt } };
    }

    it('the printed CONDEMN number is the number the engine applies (14 on a simple foe)', () => {
        let state = declared(makeEnemy(300, 'heart')); // GraveLarva difficulty: 'simple'
        state = { ...state, premises: 12 };
        const res = playFromHand(state, OPENER, false); // +2 -> 14 == printed concedeAt
        expect(res.state.finalOutcome).toBe('concede');
    });

    it('one Premise short of the printed CONDEMN number does not win', () => {
        let state = declared(makeEnemy(300, 'heart'));
        state = { ...state, premises: 11 };
        const res = playFromHand(state, OPENER, false); // +2 -> 13, under 14
        expect(res.state.finalOutcome).not.toBe('concede');
    });

    // ── The concede ladder, asserted as a LADDER ────────────────────────────
    // Rescaled 2026-09-02 to 12/24/40/60 (base/elite/boss/unique). CONDEMN is
    // an alt-win: reaching the tally ends the fight whatever the foe's VITAE,
    // so the floor is the only cost. These cases derive their fixtures from
    // `concedeFloorFor` so a future rescale moves them with it — what is being
    // tested is that each tier's floor BINDS and the tier below it does not.
    const CONDEMN_TIERS: readonly { difficulty: 'simple' | 'elite' | 'boss' | 'unique'; below?: number }[] = [
        { difficulty: 'simple' },
        { difficulty: 'elite', below: CONCEDE_PREMISES_BASE },
        { difficulty: 'boss', below: CONCEDE_PREMISES_ELITE },
        { difficulty: 'unique', below: CONCEDE_PREMISES_BOSS },
    ];

    it('the ladder is strictly increasing across the difficulty bands', () => {
        expect(CONCEDE_PREMISES_ELITE).toBeGreaterThan(CONCEDE_PREMISES_BASE);
        expect(CONCEDE_PREMISES_BOSS).toBeGreaterThan(CONCEDE_PREMISES_ELITE);
        expect(CONCEDE_PREMISES_UNIQUE).toBeGreaterThan(CONCEDE_PREMISES_BOSS);
    });

    for (const { difficulty, below } of CONDEMN_TIERS) {
        it(`${difficulty} enemy: reaching its own floor concedes`, () => {
            const floor = concedeFloorFor(difficulty);
            let state = declaredAt(makeEnemy(300, 'heart', difficulty), 8);
            state = { ...state, premises: floor - 2 };
            const res = playFromHand(state, OPENER, false); // +2 -> the floor
            expect(res.state.finalOutcome).toBe('concede');
        });

        if (below !== undefined) {
            it(`${difficulty} enemy: the tier BELOW its floor does not concede`, () => {
                let state = declaredAt(makeEnemy(300, 'heart', difficulty), 8);
                state = { ...state, premises: below - 2 };
                const res = playFromHand(state, OPENER, false); // +2 -> the lower tier's floor
                expect(res.state.finalOutcome).not.toBe('concede');
                expect(res.state.peroration).not.toBeNull(); // the argument is still live
            });
        }
    }
});

// ── (B) RELENT resolve threshold (Dawncaster Charmed-style) ─────────────

describe('RELENT resolve threshold (item 1a) — capitulateThreshold formula', () => {
    it('floors at CAPITULATE_MIN for a small enemy, never above current HP', () => {
        expect(CAPITULATE_RESOLVE_FRACTION).toBe(0.35);
        expect(CAPITULATE_MIN).toBe(10);
        // maxHealth 20: 0.35 * 20 = 7 -> floored to CAPITULATE_MIN (10),
        // clamped to current health (20) -> 10.
        expect(capitulateThreshold({ health: 20, maxHealth: 20 })).toBe(10);
    });

    it('pins the old flat-check contract for a tiny enemy (regression pin)', () => {
        // The existing themed-decks.engine.test.ts pin: makeEnemy(4, 'heart'),
        // PLEA 4 capitulates. 0.35*4=1.4->1, floored to 10, clamped to current
        // health 4 -> byte-identical to the old `PLEA >= 4` check.
        expect(capitulateThreshold({ health: 4, maxHealth: 4 })).toBe(4);
    });

    it('a real fraction applies against a large-HP boss (reachable, not the whole bar)', () => {
        // maxHealth 1000: 0.35*1000=350, well below the old "match the whole
        // bar" requirement (1000) — the headline fix for Grace late-game.
        expect(capitulateThreshold({ health: 1000, maxHealth: 1000 })).toBe(350);
    });

    it('never exceeds the enemy CURRENT health — a nearly-dead boss still yields low', () => {
        // A 1000-maxHealth boss beaten down to 50 current HP: resolve (350)
        // clamps to the current health (50), matching the OLD PLEA>=currentHP
        // contract for a nearly-dead target.
        expect(capitulateThreshold({ health: 50, maxHealth: 1000 })).toBe(50);
    });

    it('engine: PLEA below the computed threshold does not capitulate; at it, does', () => {
        mockSequentialRng(0.05);
        const boss = makeEnemy(1000, 'mind', 'boss');
        let state = initializeCombatEncounter(makePlayer([]), boss, undefined, 7);
        state = rollEncounterDice(state).state;

        const below = resolveThreatPhase({ ...state, sway: 349 });
        expect(below.state.finalOutcome).not.toBe('capitulate');

        const at = resolveThreatPhase({ ...state, sway: 350 });
        expect(at.state.finalOutcome).toBeNull();
        expect(at.state.capitulationChoiceActive).toBe(true);
        const accepted = selectCapitulationChoice(at.state, 'accept');
        expect(accepted.state.finalOutcome).toBe('capitulate');
        expect(at.state.enemy.health).toBe(1000); // won without touching HP
    });

    it('engine: a nearly-dead boss still capitulates at the low current-HP clamp', () => {
        mockSequentialRng(0.05);
        const woundedBoss = makeEnemy(1000, 'mind', 'boss', 50); // current HP 50
        let state = initializeCombatEncounter(makePlayer([]), woundedBoss, undefined, 7);
        state = rollEncounterDice(state).state;

        const below = resolveThreatPhase({ ...state, sway: 49 });
        expect(below.state.finalOutcome).not.toBe('capitulate');

        const at = resolveThreatPhase({ ...state, sway: 50 });
        expect(at.state.finalOutcome).toBeNull();
        expect(at.state.capitulationChoiceActive).toBe(true);
        expect(selectCapitulationChoice(at.state, 'accept').state.finalOutcome).toBe('capitulate');
    });
});

// ── (C) Boss/unique rung REGROWTH (anti-permalock) ───────────────────────────

describe('boss/unique rung REGROWTH (item 1c, anti-permalock)', () => {
    function baseState(enemy: Enemy, phases: CombatThreatPhase[]): CombatEncounterState {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([]), enemy, undefined, 7);
        state = rollEncounterDice(state).state;
        return { ...state, threatPhases: phases, threatMarks: phases.map(() => 'pending' as const), currentPhaseIndex: 0 };
    }

    it('a boss regrows a rung of resilience after a phase where rungs were removed', () => {
        expect(BOSS_RUNG_REGROWTH).toBe(1);
        const boss = makeEnemy(500, 'mind', 'boss');
        const phases = customPhases(['mind', 'mind', 'mind', 'mind']);
        const state = baseState(boss, phases);

        // Round 1: staggerRungs === THREAT_RUNGS_BOSS (3) fully denies the
        // telegraph — the pre-fix flat behavior.
        const r1 = resolveThreatPhase({ ...state, staggerRungs: THREAT_RUNGS_BOSS });
        expect(r1.events.some(e => e.kind === 'threat-fired')).toBe(false); // denied
        expect(r1.events.some(e => e.kind === 'rung-regrown')).toBe(true);
        expect(r1.state.bossRungGrowth).toBe(1);

        // Round 2: the SAME staggerRungs output no longer fully denies —
        // the boss's effective rung total grew to 4.
        const r2 = resolveThreatPhase({ ...r1.state, staggerRungs: THREAT_RUNGS_BOSS });
        expect(r2.events.some(e => e.kind === 'threat-fired')).toBe(true); // acted (weakened)
        expect(r2.state.bossRungGrowth).toBe(2); // still grew (rungs were still removed)
    });

    it('regrowth caps at doubling the boss natural rung count', () => {
        expect(bossRungGrowthCap(THREAT_RUNGS_BOSS)).toBe(THREAT_RUNGS_BOSS);
        const boss = makeEnemy(500, 'mind', 'boss');
        const phases = customPhases(['mind', 'mind', 'mind', 'mind', 'mind']);
        let state = baseState(boss, phases);
        // Grind 6 rounds of partial rung loss (staggerRungs=1 every round,
        // always > 0, so growth keeps trying to climb) — it must never
        // exceed THREAT_RUNGS_BOSS (a doubled total of 6).
        for (let i = 0; i < 6; i++) {
            const r = resolveThreatPhase({ ...state, staggerRungs: 1 });
            state = r.state;
            expect(state.bossRungGrowth ?? 0).toBeLessThanOrEqual(THREAT_RUNGS_BOSS);
        }
        expect(state.bossRungGrowth).toBe(THREAT_RUNGS_BOSS); // saturated at the cap
    });

    it('a normal (non-boss/unique) enemy never accrues rung growth', () => {
        const normal = makeEnemy(500, 'mind'); // GraveLarva difficulty: 'simple'
        const phases = customPhases(['mind', 'mind', 'mind']);
        let state = baseState(normal, phases);
        for (let i = 0; i < 3; i++) {
            const r = resolveThreatPhase({ ...state, staggerRungs: THREAT_RUNGS });
            state = r.state;
            expect(r.events.some(e => e.kind === 'threat-fired')).toBe(false); // still fully denied every round
            expect(state.bossRungGrowth ?? 0).toBe(0);
            expect(r.events.some(e => e.kind === 'rung-regrown')).toBe(false);
        }
    });

    it('an elite enemy (non-boss/unique) also never accrues rung growth', () => {
        const elite = makeEnemy(500, 'mind', 'elite');
        const phases = customPhases(['mind', 'mind']);
        const state = baseState(elite, phases);
        const r = resolveThreatPhase({ ...state, staggerRungs: THREAT_RUNGS });
        expect(r.events.some(e => e.kind === 'threat-fired')).toBe(false);
        expect(r.state.bossRungGrowth ?? 0).toBe(0);
    });
});
