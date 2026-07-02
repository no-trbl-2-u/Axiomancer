/**
 * Hermetic unit tests — the guided first-fight step engine.
 *
 * combat-tutorial-steps.ts is the stateless predicate module the combat coach
 * derives its current step from. Each step gates on a MONOTONIC signal (one that
 * latches true), and `currentCombatTutorialStep` returns the index of the FIRST
 * unmet step, or `-1` once the script is complete. These tests pin the module's
 * contract directly: each predicate flipping false→true at its threshold, the
 * first-unmet scan, the `-1` completion sentinel, and — the load-bearing one —
 * that the script does NOT snap backwards when per-turn state (the drafted die)
 * resets on a new turn. Fixtures are minimal partial states populating only the
 * fields the predicates read.
 */

import { describe, expect, it } from '@jest/globals';

import {
    COMBAT_TUTORIAL_STEPS,
    currentCombatTutorialStep,
} from '@/components/combat/encounter/combat-tutorial-steps';
import type { CombatViewModel } from '@/state/presenters/combat-encounter.engine';
import type { CombatEncounterState } from 'axiomancer-mechanics';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOTAL = COMBAT_TUTORIAL_STEPS.length;

// No predicate reads the view-model, so an empty cast suffices.
const vm = {} as CombatViewModel;

type StateParts = Partial<{
    draftedDieId: string | null;
    conviction: number;
    discard: string[];
    turn: number;
    currentPhaseIndex: number;
    threatMarks: unknown[];
    finalOutcome: unknown;
    enemy: { health: number; maxHealth: number; effects: unknown[] };
}>;

/** A state with every predicate-relevant field at its initial (unmet) value: the
 *  board just after ENTER COMBAT — dice rolled, nothing drafted or played. NB:
 *  `threatMarks` is seeded full of `'pending'` by the engine at combat start, so
 *  the fixture mirrors that — a predicate must not read it as "advanced". */
function freshState(overrides: StateParts = {}): CombatEncounterState {
    return {
        draftedDieId: null,
        conviction: 0,
        discard: [],
        turn: 1,
        currentPhaseIndex: 0,
        threatMarks: ['pending', 'pending', 'pending'],
        finalOutcome: null,
        enemy: { health: 100, maxHealth: 100, effects: [] },
        ...overrides,
    } as unknown as CombatEncounterState;
}

/** Find a step by id (order-independent so the test survives a reorder). */
function step(id: string) {
    const s = COMBAT_TUTORIAL_STEPS.find((st) => st.id === id);
    if (!s) throw new Error(`no tutorial step with id ${id}`);
    return s;
}

// ---------------------------------------------------------------------------
// Per-predicate boundary tests
// ---------------------------------------------------------------------------

describe('combat tutorial-steps predicates', () => {
    it('draft: false on a fresh turn, true once a die is drafted', () => {
        const done = step('draft').done;
        expect(done(freshState(), vm)).toBe(false);
        expect(done(freshState({ draftedDieId: 'die-1' }), vm)).toBe(true);
        expect(done(freshState({ conviction: 1 }), vm)).toBe(true); // the banked die
    });

    it('spend: false until a card leaves the hand, true at the first discard', () => {
        const done = step('spend').done;
        expect(done(freshState(), vm)).toBe(false);
        expect(done(freshState({ discard: ['card-1'] }), vm)).toBe(true);
    });

    it('tracks: false until the enemy is damaged or a status lands', () => {
        const done = step('tracks').done;
        expect(done(freshState(), vm)).toBe(false);
        // damaged enemy HP → the status is working
        expect(done(freshState({ enemy: { health: 90, maxHealth: 100, effects: [] } }), vm)).toBe(true);
        // a status landed on the enemy → also counts
        expect(done(freshState({ enemy: { health: 100, maxHealth: 100, effects: [{ effectId: 'debuff_bleed' }] } }), vm)).toBe(true);
    });

    it('advance: false on turn one, true on a new turn / phase / outcome', () => {
        const done = step('advance').done;
        expect(done(freshState(), vm)).toBe(false);
        // Seeded 'pending' marks must NOT read as advanced — only resolved ones.
        expect(done(freshState({ threatMarks: ['pending', 'pending'] }), vm)).toBe(false);
        expect(done(freshState({ turn: 2 }), vm)).toBe(true);
        expect(done(freshState({ currentPhaseIndex: 1 }), vm)).toBe(true);
        expect(done(freshState({ threatMarks: ['clear', 'pending'] }), vm)).toBe(true);
        expect(done(freshState({ threatMarks: ['overwhelmed'] }), vm)).toBe(true);
        expect(done(freshState({ finalOutcome: 'victory' }), vm)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// currentCombatTutorialStep scan contract
// ---------------------------------------------------------------------------

describe('currentCombatTutorialStep', () => {
    it('returns 0 (the draft step) for a fresh board', () => {
        expect(currentCombatTutorialStep(freshState(), vm)).toBe(0);
    });

    it('advances to the next gap as the player drafts then plays', () => {
        // drafted but nothing played → step 1 (spend)
        expect(currentCombatTutorialStep(freshState({ draftedDieId: 'die-1' }), vm))
            .toBe(COMBAT_TUTORIAL_STEPS.findIndex((s) => s.id === 'spend'));
        // a card played but the enemy not yet damaged → step 2 (tracks)
        expect(currentCombatTutorialStep(freshState({ draftedDieId: 'die-1', discard: ['c'] }), vm))
            .toBe(COMBAT_TUTORIAL_STEPS.findIndex((s) => s.id === 'tracks'));
        // enemy damaged → step 3 (advance)
        expect(currentCombatTutorialStep(
            freshState({ draftedDieId: 'die-1', discard: ['c'], enemy: { health: 90, maxHealth: 100, effects: [] } }),
            vm,
        )).toBe(COMBAT_TUTORIAL_STEPS.findIndex((s) => s.id === 'advance'));
    });

    it('returns -1 once the player has taken a second turn', () => {
        expect(currentCombatTutorialStep(freshState({ turn: 2 }), vm)).toBe(-1);
    });

    it('does NOT snap back to step 0 when the drafted die resets on a new turn', () => {
        // After NEW TURN the engine clears draftedDieId, but turn has advanced.
        // Because every predicate latches on the monotonic `advance` signal, the
        // script must read complete (-1), never regress to the draft step.
        const newTurn = freshState({ turn: 2, draftedDieId: null, conviction: 0 });
        expect(currentCombatTutorialStep(newTurn, vm)).toBe(-1);
    });

    it('has exactly four turn-one steps in order', () => {
        expect(TOTAL).toBe(4);
        expect(COMBAT_TUTORIAL_STEPS.map((s) => s.id)).toEqual(['draft', 'spend', 'tracks', 'advance']);
    });
});
