/**
 * Hermetic unit tests — the guided first-fight step engine.
 *
 * combat-tutorial-steps.ts is the stateless predicate module the combat coach
 * derives its current step from. Each step latches on a MONOTONIC engine signal
 * (plus, for the `stage` step, the board's live staged-card count), and
 * `currentCombatTutorialStep` returns the index of the FIRST unmet step, or `-1`
 * once the script is complete. These tests pin the module's contract directly:
 * each predicate flipping false→true at its threshold, the `ctx` argument, the
 * first-unmet scan, the `-1` completion sentinel, the default context for
 * callers without a board, and — the load-bearing one — that the script does
 * NOT snap backwards when per-turn state (the staging area) resets on a new
 * turn. A copy guard also pins that no step still teaches the retired
 * three-dice draft (spec 33 replaced it with four dice and no draft). Fixtures
 * are minimal partial states populating only the fields the predicates read.
 */

import { describe, expect, it } from '@jest/globals';

import {
    COMBAT_TUTORIAL_STEPS,
    currentCombatTutorialStep,
} from '@/components/combat/encounter/combat-tutorial-steps';
import type { CombatViewModel } from '@/state/presenters/combat-encounter.engine';
import type { CombatEncounterState } from '@mechanics';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOTAL = COMBAT_TUTORIAL_STEPS.length;

// No predicate reads the view-model, so an empty cast suffices.
const vm = {} as CombatViewModel;

/** Nothing in the PLAY AREA — the board just after ENTER COMBAT. */
const nothingStaged = { stagedCount: 0 };
/** One card dragged into the PLAY AREA, not yet applied. */
const oneStaged = { stagedCount: 1 };

type StateParts = Partial<{
    discard: string[];
    turn: number;
    currentPhaseIndex: number;
    threatMarks: unknown[];
    finalOutcome: unknown;
    enemy: { health: number; maxHealth: number; effects: unknown[] };
}>;

/** A state with every predicate-relevant field at its initial (unmet) value: the
 *  board just after ENTER COMBAT — dice rolled, nothing staged or played. NB:
 *  `threatMarks` is seeded full of `'pending'` by the engine at combat start, so
 *  the fixture mirrors that — a predicate must not read it as "advanced". */
function freshState(overrides: StateParts = {}): CombatEncounterState {
    return {
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

function indexOf(id: string): number {
    return COMBAT_TUTORIAL_STEPS.findIndex((s) => s.id === id);
}

// ---------------------------------------------------------------------------
// Per-predicate boundary tests
// ---------------------------------------------------------------------------

describe('combat tutorial-steps predicates', () => {
    it('stage: false on a fresh board, true once a card is in the PLAY AREA', () => {
        const done = step('stage').done;
        expect(done(freshState(), vm, nothingStaged)).toBe(false);
        expect(done(freshState(), vm, oneStaged)).toBe(true);
        expect(done(freshState(), vm, { stagedCount: 3 })).toBe(true);
    });

    it('stage: also latches once a card has reached the discard (staged, applied, gone)', () => {
        const done = step('stage').done;
        expect(done(freshState({ discard: ['card-1'] }), vm, nothingStaged)).toBe(true);
    });

    it('power: false until a card leaves the hand, true at the first discard', () => {
        const done = step('power').done;
        expect(done(freshState(), vm, nothingStaged)).toBe(false);
        // Staging alone is not powering — the card must resolve.
        expect(done(freshState(), vm, oneStaged)).toBe(false);
        expect(done(freshState({ discard: ['card-1'] }), vm, nothingStaged)).toBe(true);
    });

    it('tracks: false until the enemy is damaged or a status lands', () => {
        const done = step('tracks').done;
        expect(done(freshState(), vm, nothingStaged)).toBe(false);
        // damaged enemy VITAE → the pressure is working
        expect(done(freshState({ enemy: { health: 90, maxHealth: 100, effects: [] } }), vm, nothingStaged)).toBe(true);
        // a status landed on the enemy → also counts
        expect(done(freshState({ enemy: { health: 100, maxHealth: 100, effects: [{ effectId: 'debuff_bleed' }] } }), vm, nothingStaged)).toBe(true);
    });

    it('advance: false on turn one, true on a new turn / phase / outcome', () => {
        const done = step('advance').done;
        expect(done(freshState(), vm, nothingStaged)).toBe(false);
        // Seeded 'pending' marks must NOT read as advanced — only resolved ones.
        expect(done(freshState({ threatMarks: ['pending', 'pending'] }), vm, nothingStaged)).toBe(false);
        expect(done(freshState({ turn: 2 }), vm, nothingStaged)).toBe(true);
        expect(done(freshState({ currentPhaseIndex: 1 }), vm, nothingStaged)).toBe(true);
        expect(done(freshState({ threatMarks: ['clear', 'pending'] }), vm, nothingStaged)).toBe(true);
        expect(done(freshState({ threatMarks: ['overwhelmed'] }), vm, nothingStaged)).toBe(true);
        expect(done(freshState({ finalOutcome: 'victory' }), vm, nothingStaged)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// currentCombatTutorialStep scan contract
// ---------------------------------------------------------------------------

describe('currentCombatTutorialStep', () => {
    it('returns 0 (the stage step) for a fresh board', () => {
        expect(currentCombatTutorialStep(freshState(), vm, nothingStaged)).toBe(0);
        expect(indexOf('stage')).toBe(0);
    });

    it('advances to the next gap as the player stages, then powers a card', () => {
        // staged but nothing applied → power
        expect(currentCombatTutorialStep(freshState(), vm, oneStaged)).toBe(indexOf('power'));
        // a card applied (staging area empties) but the enemy not yet damaged → tracks
        expect(currentCombatTutorialStep(freshState({ discard: ['c'] }), vm, nothingStaged)).toBe(indexOf('tracks'));
        // enemy damaged → advance
        expect(currentCombatTutorialStep(
            freshState({ discard: ['c'], enemy: { health: 90, maxHealth: 100, effects: [] } }),
            vm,
            nothingStaged,
        )).toBe(indexOf('advance'));
    });

    it('completes (-1) on turn 2, on phase index 1, and on a resolved threat mark', () => {
        expect(currentCombatTutorialStep(freshState({ turn: 2 }), vm, nothingStaged)).toBe(-1);
        expect(currentCombatTutorialStep(freshState({ currentPhaseIndex: 1 }), vm, nothingStaged)).toBe(-1);
        expect(currentCombatTutorialStep(freshState({ threatMarks: ['clear', 'pending'] }), vm, nothingStaged)).toBe(-1);
    });

    it('does NOT snap back to step 0 when the staging area empties on a new turn', () => {
        // After NEW TURN the board's play area is empty again, but turn has
        // advanced. Because every predicate latches on the monotonic `advance`
        // signal, the script must read complete (-1), never regress to `stage`.
        expect(currentCombatTutorialStep(freshState({ turn: 2 }), vm, nothingStaged)).toBe(-1);
    });

    it('defaults the context for callers without a board (the panel completion check)', () => {
        // No ctx: the stage step cannot be satisfied by staging, but the scan
        // still returns the same completion answer as with an explicit context.
        expect(currentCombatTutorialStep(freshState(), vm)).toBe(0);
        expect(currentCombatTutorialStep(freshState({ turn: 2 }), vm)).toBe(-1);
    });

    it('has exactly four turn-one steps in order', () => {
        expect(TOTAL).toBe(4);
        expect(COMBAT_TUTORIAL_STEPS.map((s) => s.id)).toEqual(['stage', 'power', 'tracks', 'advance']);
    });
});

// ---------------------------------------------------------------------------
// Copy guard — the retired three-dice draft must not leak back in
// ---------------------------------------------------------------------------

describe('combat tutorial copy', () => {
    const RETIRED = [/three dice/i, /keep one/i, /draft/i, /tap it/i];

    it('never teaches the retired three-dice draft', () => {
        for (const s of COMBAT_TUTORIAL_STEPS) {
            const text = `${s.title} ${s.body} ${s.lookFor}`;
            for (const re of RETIRED) {
                expect(text).not.toMatch(re);
            }
        }
    });

    it('points the player at real controls', () => {
        expect(step('stage').lookFor).toMatch(/PLAY AREA/);
        expect(step('power').lookFor).toMatch(/APPLY/);
        expect(step('tracks').lookFor).toMatch(/VITAE/);
        expect(step('advance').lookFor).toMatch(/END PHASE/);
    });
});
