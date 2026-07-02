/**
 * Hermetic unit tests — the guided first-gleaning step engine.
 *
 * tutorial-steps.ts is the stateless predicate module the coach derives
 * its current step from. Each of the seven steps gates on a single
 * session boundary; `currentTutorialStep` returns the index of the FIRST
 * unmet step, or `-1` once the whole script is complete. The render
 * layer (TutorialCoach.test.tsx) and the store e2e
 * (gathering.tutorial.engine) exercise this only indirectly — through a
 * rendered counter and real in-order store transitions respectively.
 * These tests pin the module's own contract directly: each predicate
 * flipping false→true at its exact threshold, the first-unmet scan when a
 * later predicate is satisfied out of order, and the `-1` completion
 * sentinel. Fixtures are minimal partial sessions populating only the
 * fields the predicates read.
 */

import { describe, expect, it } from '@jest/globals';

import {
    GATHERING_TUTORIAL_STEPS,
    currentTutorialStep,
} from '@/components/gathering/tutorial-steps';
import type { GatheringViewModel } from '@/state/presenters/gathering.engine';
import type { GatheringSessionState } from 'axiomancer-mechanics';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOTAL = GATHERING_TUTORIAL_STEPS.length;

// No predicate reads the view-model, so an empty cast suffices.
const vm = {} as GatheringViewModel;

type SessionParts = Partial<{
    phase: GatheringSessionState['phase'];
    satchel: unknown[];
    metrics: { breathsTended: number; offeringsPaid: number };
    tools: { used: boolean }[];
    depth: number;
}>;

/** A session with every predicate-relevant field at its initial (unmet) value. */
function freshSession(overrides: SessionParts = {}): GatheringSessionState {
    return {
        phase: 'approach-select',
        satchel: [],
        metrics: { breathsTended: 0, offeringsPaid: 0 },
        tools: [{ used: false }],
        depth: 0,
        ...overrides,
    } as unknown as GatheringSessionState;
}

/** Find a step by id (order-independent so the test survives a reorder). */
function step(id: string) {
    const s = GATHERING_TUTORIAL_STEPS.find((st) => st.id === id);
    if (!s) throw new Error(`no tutorial step with id ${id}`);
    return s;
}

// ---------------------------------------------------------------------------
// Per-predicate boundary tests
// ---------------------------------------------------------------------------

describe('tutorial-steps predicates', () => {
    it('approach: false while in approach-select, true once the phase moves on', () => {
        const done = step('approach').done;
        expect(done(freshSession({ phase: 'approach-select' }), vm)).toBe(false);
        expect(done(freshSession({ phase: 'foraging' }), vm)).toBe(true);
    });

    it('take: false with an empty satchel, true at the first item', () => {
        const done = step('take').done;
        expect(done(freshSession({ satchel: [] }), vm)).toBe(false);
        expect(done(freshSession({ satchel: [{}] }), vm)).toBe(true);
    });

    it('tend: false at zero breaths, true at the first breath tended', () => {
        const done = step('tend').done;
        expect(done(freshSession({ metrics: { breathsTended: 0, offeringsPaid: 0 } }), vm)).toBe(false);
        expect(done(freshSession({ metrics: { breathsTended: 1, offeringsPaid: 0 } }), vm)).toBe(true);
    });

    it('offer: false at zero offerings, true at the first offering paid', () => {
        const done = step('offer').done;
        expect(done(freshSession({ metrics: { breathsTended: 0, offeringsPaid: 0 } }), vm)).toBe(false);
        expect(done(freshSession({ metrics: { breathsTended: 0, offeringsPaid: 1 } }), vm)).toBe(true);
    });

    it('tool: false until a tool is used, true once any tool is used', () => {
        const done = step('tool').done;
        expect(done(freshSession({ tools: [{ used: false }] }), vm)).toBe(false);
        expect(done(freshSession({ tools: [{ used: false }, { used: true }] }), vm)).toBe(true);
    });

    it('descend: false at depth 0, true at the first descent', () => {
        const done = step('descend').done;
        expect(done(freshSession({ depth: 0 }), vm)).toBe(false);
        expect(done(freshSession({ depth: 1 }), vm)).toBe(true);
    });

    it('withdraw: false mid-run, true in each terminal phase', () => {
        const done = step('withdraw').done;
        expect(done(freshSession({ phase: 'foraging' }), vm)).toBe(false);
        for (const phase of ['outcome', 'rewards', 'done'] as const) {
            expect(done(freshSession({ phase }), vm)).toBe(true);
        }
    });
});

// ---------------------------------------------------------------------------
// currentTutorialStep scan contract
// ---------------------------------------------------------------------------

describe('currentTutorialStep', () => {
    it('returns 0 (the approach step) for a brand-new session', () => {
        expect(currentTutorialStep(freshSession(), vm)).toBe(0);
    });

    it('returns the FIRST unmet index even when a later predicate is satisfied out of order', () => {
        // approach + take still unmet (approach-select, empty satchel), but a
        // later predicate (descend) is already satisfied. The scan must still
        // point at index 0 (approach), not skip ahead to the later gap.
        const session = freshSession({ depth: 5 });
        expect(currentTutorialStep(session, vm)).toBe(0);
    });

    it('advances to the next gap once an earlier predicate is met', () => {
        // approach satisfied (phase moved on) but nothing taken yet → step 1 (take).
        const session = freshSession({ phase: 'foraging' });
        expect(currentTutorialStep(session, vm)).toBe(GATHERING_TUTORIAL_STEPS.findIndex((s) => s.id === 'take'));
    });

    it('returns -1 once every predicate is satisfied', () => {
        const complete = freshSession({
            phase: 'done',
            satchel: [{}],
            metrics: { breathsTended: 1, offeringsPaid: 1 },
            tools: [{ used: true }],
            depth: 1,
        });
        expect(currentTutorialStep(complete, vm)).toBe(-1);
    });

    it('points at the trailing withdraw step when only it remains unmet', () => {
        const nearlyDone = freshSession({
            phase: 'foraging', // not a terminal phase → withdraw still unmet
            satchel: [{}],
            metrics: { breathsTended: 1, offeringsPaid: 1 },
            tools: [{ used: true }],
            depth: 1,
        });
        expect(currentTutorialStep(nearlyDone, vm)).toBe(TOTAL - 1);
        expect(GATHERING_TUTORIAL_STEPS[TOTAL - 1].id).toBe('withdraw');
    });
});
