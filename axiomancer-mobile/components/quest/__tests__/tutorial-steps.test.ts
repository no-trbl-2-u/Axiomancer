/**
 * Hermetic unit tests — the guided opening-loop step engine.
 *
 * tutorial-steps.ts is the stateless predicate module the coach derives
 * its current step from. Both of this script's two steps key on
 * `metrics.rolls` alone (see the module header for why: `phase` cycles
 * `idle ⇄ space` every loop, so it isn't a safe monotonic gate here the
 * way it is for Hazard's single-pass `playing` phase). These tests pin
 * the module's own contract: each predicate flipping false→true at its
 * exact threshold, the first-unmet scan, the terminal-phase fallback that
 * lets a player who finishes the loop fast still advance, and the `-1`
 * completion sentinel. Fixtures are minimal partial sessions populating
 * only the fields the predicates read.
 */

import { describe, expect, it } from '@jest/globals';

import {
    QUEST_TUTORIAL_STEPS,
    currentTutorialStep,
} from '@/components/quest/tutorial-steps';
import type { QuestBoardVM } from '@/state/presenters/quest.engine';
import type { QuestBoardSession } from '@mechanics';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOTAL = QUEST_TUTORIAL_STEPS.length;

// No predicate reads the view-model, so an empty cast suffices.
const vm = {} as QuestBoardVM;

type SessionParts = Partial<{
    phase: QuestBoardSession['phase'];
    metrics: { rolls: number };
}>;

/** A session with every predicate-relevant field at its initial (unmet) value. */
function freshSession(overrides: SessionParts = {}): QuestBoardSession {
    return {
        phase: 'idle',
        metrics: { rolls: 0 },
        ...overrides,
    } as unknown as QuestBoardSession;
}

/** Find a step by id (order-independent so the test survives a reorder). */
function step(id: string) {
    const s = QUEST_TUTORIAL_STEPS.find((st) => st.id === id);
    if (!s) throw new Error(`no tutorial step with id ${id}`);
    return s;
}

// ---------------------------------------------------------------------------
// Per-predicate boundary tests
// ---------------------------------------------------------------------------

describe('tutorial-steps predicates', () => {
    it('roll: false before any roll, true once metrics.rolls >= 1', () => {
        const done = step('roll').done;
        expect(done(freshSession({ metrics: { rolls: 0 } }), vm)).toBe(false);
        expect(done(freshSession({ metrics: { rolls: 1 } }), vm)).toBe(true);
    });

    it('roll: stays true on a later loop (monotonic — never un-flips)', () => {
        const done = step('roll').done;
        expect(done(freshSession({ phase: 'space', metrics: { rolls: 2 } }), vm)).toBe(true);
    });

    it('again: false after only one roll, true at the second roll or a terminal phase', () => {
        const done = step('again').done;
        expect(done(freshSession({ metrics: { rolls: 1 } }), vm)).toBe(false);
        expect(done(freshSession({ metrics: { rolls: 2 } }), vm)).toBe(true);
        for (const phase of ['dusk', 'outcome', 'done'] as const) {
            expect(done(freshSession({ phase, metrics: { rolls: 1 } }), vm)).toBe(true);
        }
    });

    it('again: still false while mid-space on the first loop', () => {
        const done = step('again').done;
        expect(done(freshSession({ phase: 'space', metrics: { rolls: 1 } }), vm)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// currentTutorialStep scan contract
// ---------------------------------------------------------------------------

describe('currentTutorialStep', () => {
    it('returns 0 (the roll step) for a brand-new session', () => {
        expect(currentTutorialStep(freshSession(), vm)).toBe(0);
    });

    it('jumps straight to "again" once the first roll fires — rolling opens the space atomically', () => {
        const session = freshSession({ phase: 'space', metrics: { rolls: 1 } });
        expect(currentTutorialStep(session, vm)).toBe(TOTAL - 1);
        expect(QUEST_TUTORIAL_STEPS[TOTAL - 1].id).toBe('again');
    });

    it('stays on "again" whether the loop is back at idle or already mid the next space', () => {
        expect(currentTutorialStep(freshSession({ phase: 'idle', metrics: { rolls: 1 } }), vm)).toBe(TOTAL - 1);
        expect(currentTutorialStep(freshSession({ phase: 'space', metrics: { rolls: 1 } }), vm)).toBe(TOTAL - 1);
    });

    it('returns -1 once every predicate is satisfied', () => {
        const complete = freshSession({ phase: 'idle', metrics: { rolls: 2 } });
        expect(currentTutorialStep(complete, vm)).toBe(-1);
    });

    it('a player who reaches a terminal phase on the first roll still completes the script', () => {
        const session = freshSession({ phase: 'outcome', metrics: { rolls: 1 } });
        expect(currentTutorialStep(session, vm)).toBe(-1);
    });
});
