/**
 * Hermetic unit tests — the guided first-delve step engine.
 *
 * tutorial-steps.ts is the stateless predicate module the coach derives
 * its current step from. Each of the five steps gates on a single
 * session boundary; `currentTutorialStep` returns the index of the FIRST
 * unmet step, or `-1` once the whole script is complete. The render
 * layer (CacheTutorialCoach.test.tsx) and the store e2e
 * (cache.tutorial.engine) exercise this only indirectly — through a
 * rendered counter and real in-order store transitions respectively.
 * These tests pin the module's own contract directly: each predicate
 * flipping false→true at its exact threshold, the first-unmet scan when a
 * later predicate is satisfied out of order, and the `-1` completion
 * sentinel. Fixtures are minimal partial sessions populating only the
 * fields the predicates read.
 */

import { describe, expect, it } from '@jest/globals';

import {
    CACHE_TUTORIAL_STEPS,
    currentTutorialStep,
} from '@/components/cache/tutorial-steps';
import type { CacheVM } from '@/state/presenters/cache.engine';
import type { LootCacheSession } from '@mechanics';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOTAL = CACHE_TUTORIAL_STEPS.length;

// No predicate reads the view-model, so an empty cast suffices.
const vm = {} as CacheVM;

type SessionParts = Partial<{
    phase: LootCacheSession['phase'];
    pick: { lastRoll: unknown } | null;
    depth: number;
}>;

/** A session with every predicate-relevant field at its initial (unmet) value. */
function freshSession(overrides: SessionParts = {}): LootCacheSession {
    return {
        phase: 'intro',
        pick: null,
        depth: 0,
        ...overrides,
    } as unknown as LootCacheSession;
}

/** Find a step by id (order-independent so the test survives a reorder). */
function step(id: string) {
    const s = CACHE_TUTORIAL_STEPS.find((st) => st.id === id);
    if (!s) throw new Error(`no tutorial step with id ${id}`);
    return s;
}

// ---------------------------------------------------------------------------
// Per-predicate boundary tests
// ---------------------------------------------------------------------------

describe('tutorial-steps predicates', () => {
    it('begin: false while in intro, true once the phase moves on', () => {
        const done = step('begin').done;
        expect(done(freshSession({ phase: 'intro' }), vm)).toBe(false);
        expect(done(freshSession({ phase: 'delving' }), vm)).toBe(true);
    });

    it('delve: false with no pick and depth 0, true once a pick opens or depth advances', () => {
        const done = step('delve').done;
        expect(done(freshSession({ pick: null, depth: 0 }), vm)).toBe(false);
        expect(done(freshSession({ pick: { lastRoll: null }, depth: 0 }), vm)).toBe(true);
        expect(done(freshSession({ pick: null, depth: 1 }), vm)).toBe(true);
    });

    it('push: false with an unrolled pick, true once a roll lands or depth advances', () => {
        const done = step('push').done;
        expect(done(freshSession({ pick: { lastRoll: null }, depth: 0 }), vm)).toBe(false);
        expect(done(freshSession({ pick: { lastRoll: {} }, depth: 0 }), vm)).toBe(true);
        expect(done(freshSession({ pick: null, depth: 1 }), vm)).toBe(true);
    });

    it('card: false mid-run, true once back at delving or reaching a terminal phase', () => {
        const done = step('card').done;
        expect(done(freshSession({ phase: 'card' }), vm)).toBe(false);
        expect(done(freshSession({ phase: 'picking' }), vm)).toBe(false);
        for (const phase of ['delving', 'outcome', 'done'] as const) {
            expect(done(freshSession({ phase }), vm)).toBe(true);
        }
    });

    it('outcome: false mid-run, true in each terminal phase', () => {
        const done = step('outcome').done;
        expect(done(freshSession({ phase: 'delving' }), vm)).toBe(false);
        expect(done(freshSession({ phase: 'picking' }), vm)).toBe(false);
        expect(done(freshSession({ phase: 'card' }), vm)).toBe(false);
        for (const phase of ['outcome', 'done'] as const) {
            expect(done(freshSession({ phase }), vm)).toBe(true);
        }
    });
});

// ---------------------------------------------------------------------------
// currentTutorialStep scan contract
// ---------------------------------------------------------------------------

describe('currentTutorialStep', () => {
    it('returns 0 (the begin step) for a brand-new session', () => {
        expect(currentTutorialStep(freshSession(), vm)).toBe(0);
    });

    it('returns the FIRST unmet index even when a later predicate is satisfied out of order', () => {
        // begin still unmet (phase intro), but a later predicate (outcome) is
        // already satisfied. The scan must still point at index 0 (begin),
        // not skip ahead to the later gap.
        const session = freshSession({ phase: 'intro', depth: 3 });
        expect(currentTutorialStep(session, vm)).toBe(0);
    });

    it('advances to the next gap once an earlier predicate is met', () => {
        // begin satisfied (phase moved on) but nothing delved yet → step 1 (delve).
        const session = freshSession({ phase: 'delving' });
        expect(currentTutorialStep(session, vm)).toBe(CACHE_TUTORIAL_STEPS.findIndex((s) => s.id === 'delve'));
    });

    it('returns -1 once every predicate is satisfied', () => {
        const complete = freshSession({
            phase: 'done',
            pick: null,
            depth: 3,
        });
        expect(currentTutorialStep(complete, vm)).toBe(-1);
    });

    it('points at the trailing outcome step when only it remains unmet', () => {
        const nearlyDone = freshSession({
            phase: 'delving', // not a terminal phase → outcome still unmet
            pick: null,
            depth: 1,
        });
        expect(currentTutorialStep(nearlyDone, vm)).toBe(TOTAL - 1);
        expect(CACHE_TUTORIAL_STEPS[TOTAL - 1].id).toBe('outcome');
    });
});
