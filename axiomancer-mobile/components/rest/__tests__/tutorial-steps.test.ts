/**
 * Hermetic unit tests — the guided first-night step engine.
 *
 * tutorial-steps.ts is the stateless predicate module the coach derives
 * its current step from. Each of the five steps gates on `watch` /
 * `phase` only; `currentTutorialStep` returns the index of the FIRST
 * unmet step, or `-1` once the whole script is complete. The render
 * layer (TutorialCoach.test.tsx) and the store e2e (rest.tutorial.engine)
 * exercise this only indirectly — through a rendered counter and real
 * in-order store transitions respectively. These tests pin the module's
 * own contract directly. Fixtures are minimal partial sessions
 * populating only the fields the predicates read.
 */

import { describe, expect, it } from '@jest/globals';

import {
    REST_TUTORIAL_STEPS,
    currentTutorialStep,
} from '@/components/rest/tutorial-steps';
import type { RestVM } from '@/state/presenters/rest.engine';
import type { RestSession } from '@mechanics';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOTAL = REST_TUTORIAL_STEPS.length;

// No predicate reads the view-model, so an empty cast suffices.
const vm = {} as RestVM;

type SessionParts = Partial<{
    phase: RestSession['phase'];
    watch: number;
}>;

/** A session with every predicate-relevant field at its initial (unmet) value. */
function freshSession(overrides: SessionParts = {}): RestSession {
    return {
        phase: 'posture',
        watch: 0,
        ...overrides,
    } as unknown as RestSession;
}

/** Find a step by id (order-independent so the test survives a reorder). */
function step(id: string) {
    const s = REST_TUTORIAL_STEPS.find((st) => st.id === id);
    if (!s) throw new Error(`no tutorial step with id ${id}`);
    return s;
}

// ---------------------------------------------------------------------------
// Per-predicate boundary tests
// ---------------------------------------------------------------------------

describe('tutorial-steps predicates', () => {
    it('posture: false while choosing, true once the phase moves on', () => {
        const done = step('posture').done;
        expect(done(freshSession({ phase: 'posture' }), vm)).toBe(false);
        expect(done(freshSession({ phase: 'watch' }), vm)).toBe(true);
    });

    it('embers: false on watch 1, true once watch advances past it', () => {
        const done = step('embers').done;
        expect(done(freshSession({ watch: 1 }), vm)).toBe(false);
        expect(done(freshSession({ watch: 2 }), vm)).toBe(true);
    });

    it('dream: false on watch 2, true once watch advances past it', () => {
        const done = step('dream').done;
        expect(done(freshSession({ watch: 2 }), vm)).toBe(false);
        expect(done(freshSession({ watch: 3 }), vm)).toBe(true);
    });

    it('stir: false mid-watch, true once dawn breaks', () => {
        const done = step('stir').done;
        expect(done(freshSession({ phase: 'watch', watch: 3 }), vm)).toBe(false);
        expect(done(freshSession({ phase: 'outcome', watch: 3 }), vm)).toBe(true);
        expect(done(freshSession({ phase: 'done', watch: 3 }), vm)).toBe(true);
    });

    it('dawn: false until claimed, true once done', () => {
        const done = step('dawn').done;
        expect(done(freshSession({ phase: 'outcome' }), vm)).toBe(false);
        expect(done(freshSession({ phase: 'done' }), vm)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// currentTutorialStep scan contract
// ---------------------------------------------------------------------------

describe('currentTutorialStep', () => {
    it('returns 0 (the posture step) for a brand-new session', () => {
        expect(currentTutorialStep(freshSession(), vm)).toBe(0);
    });

    it('returns the FIRST unmet index even when a later predicate is satisfied out of order', () => {
        // posture still unmet, but watch is already past 2 — the scan must
        // still point at index 0 (posture), not skip ahead to the later gap.
        const session = freshSession({ phase: 'posture', watch: 3 });
        expect(currentTutorialStep(session, vm)).toBe(0);
    });

    it('advances to the next gap once an earlier predicate is met', () => {
        // posture satisfied (phase moved on), watch still at 1 → step 1 (embers).
        const session = freshSession({ phase: 'watch', watch: 1 });
        expect(currentTutorialStep(session, vm)).toBe(REST_TUTORIAL_STEPS.findIndex((s) => s.id === 'embers'));
    });

    it('returns -1 once every predicate is satisfied', () => {
        const complete = freshSession({ phase: 'done', watch: 3 });
        expect(currentTutorialStep(complete, vm)).toBe(-1);
    });

    it('points at the trailing dawn step when only it remains unmet', () => {
        const nearlyDone = freshSession({ phase: 'outcome', watch: 3 });
        expect(currentTutorialStep(nearlyDone, vm)).toBe(TOTAL - 1);
        expect(REST_TUTORIAL_STEPS[TOTAL - 1].id).toBe('dawn');
    });
});
