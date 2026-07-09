/**
 * Hermetic unit tests — the guided first-crossing step engine.
 *
 * tutorial-steps.ts is the stateless predicate module the coach derives
 * its current step from. Each of the six steps gates on a single session
 * boundary; `currentTutorialStep` returns the index of the FIRST unmet
 * step, or `-1` once the whole script is complete. The render layer
 * (HazardTutorialCoach.test.tsx) and the store e2e
 * (hazard.tutorial.engine) exercise this only indirectly — through a
 * rendered counter and real in-order store transitions respectively.
 * These tests pin the module's own contract directly: each predicate
 * flipping false→true at its exact threshold, the first-unmet scan when a
 * later predicate is satisfied out of order, the `round > 1` fallback
 * that lets a player who skips a taught move still advance, and the `-1`
 * completion sentinel. Fixtures are minimal partial sessions populating
 * only the fields the predicates read.
 */

import { describe, expect, it } from '@jest/globals';

import {
    HAZARD_TUTORIAL_STEPS,
    currentTutorialStep,
} from '@/components/hazard/tutorial-steps';
import type { HazardViewModel } from '@/state/presenters/hazard.engine';
import type { HazardSessionState } from '@mechanics';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOTAL = HAZARD_TUTORIAL_STEPS.length;

// No predicate reads the view-model, so an empty cast suffices.
const vm = {} as HazardViewModel;

type SessionParts = Partial<{
    phase: HazardSessionState['phase'];
    route: HazardSessionState['route'];
    play: { applied?: boolean }[];
    dice: { state: 'available' | 'spent' }[];
    round: number;
}>;

/** A session with every predicate-relevant field at its initial (unmet) value. */
function freshSession(overrides: SessionParts = {}): HazardSessionState {
    return {
        phase: 'route-select',
        route: null,
        play: [],
        dice: [{ state: 'available' }],
        round: 1,
        ...overrides,
    } as unknown as HazardSessionState;
}

/** Find a step by id (order-independent so the test survives a reorder). */
function step(id: string) {
    const s = HAZARD_TUTORIAL_STEPS.find((st) => st.id === id);
    if (!s) throw new Error(`no tutorial step with id ${id}`);
    return s;
}

// ---------------------------------------------------------------------------
// Per-predicate boundary tests
// ---------------------------------------------------------------------------

describe('tutorial-steps predicates', () => {
    it('route: false before a route is chosen, true once one is', () => {
        const done = step('route').done;
        expect(done(freshSession({ route: null }), vm)).toBe(false);
        expect(done(freshSession({ route: 'safe' }), vm)).toBe(true);
        expect(done(freshSession({ route: 'risk' }), vm)).toBe(true);
    });

    it('stage: false with an empty play area, true at the first staged card', () => {
        const done = step('stage').done;
        expect(done(freshSession({ play: [] }), vm)).toBe(false);
        expect(done(freshSession({ play: [{}] }), vm)).toBe(true);
    });

    it('stage: also true once the round has advanced (a player who skipped it)', () => {
        const done = step('stage').done;
        expect(done(freshSession({ play: [], round: 2 }), vm)).toBe(true);
    });

    it('power: false while every die is available, true once one is spent', () => {
        const done = step('power').done;
        expect(done(freshSession({ dice: [{ state: 'available' }] }), vm)).toBe(false);
        expect(done(freshSession({ dice: [{ state: 'available' }, { state: 'spent' }] }), vm)).toBe(true);
    });

    it('apply: false until a staged card is applied, true once one is', () => {
        const done = step('apply').done;
        expect(done(freshSession({ play: [{ applied: false }] }), vm)).toBe(false);
        expect(done(freshSession({ play: [{ applied: false }, { applied: true }] }), vm)).toBe(true);
    });

    it('resolve: false in round 1 mid-play, true once the round advances or a terminal phase is reached', () => {
        const done = step('resolve').done;
        expect(done(freshSession({ round: 1, phase: 'playing' }), vm)).toBe(false);
        expect(done(freshSession({ round: 2, phase: 'playing' }), vm)).toBe(true);
        for (const phase of ['resolve-flash', 'outcome', 'rewards', 'done'] as const) {
            expect(done(freshSession({ round: 1, phase }), vm)).toBe(true);
        }
    });

    it('outcome: false before the rewards screen, true once it (or done) is reached', () => {
        const done = step('outcome').done;
        expect(done(freshSession({ phase: 'outcome' }), vm)).toBe(false);
        expect(done(freshSession({ phase: 'rewards' }), vm)).toBe(true);
        expect(done(freshSession({ phase: 'done' }), vm)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// currentTutorialStep scan contract
// ---------------------------------------------------------------------------

describe('currentTutorialStep', () => {
    it('returns 0 (the route step) for a brand-new session', () => {
        expect(currentTutorialStep(freshSession(), vm)).toBe(0);
    });

    it('returns the FIRST unmet index even when a later predicate is satisfied out of order', () => {
        // route + stage still unmet, but a later predicate (apply) is already
        // satisfied. The scan must still point at index 0 (route), not skip
        // ahead to the later gap.
        const session = freshSession({ play: [{ applied: true }] });
        expect(currentTutorialStep(session, vm)).toBe(0);
    });

    it('advances to the next gap once an earlier predicate is met', () => {
        // route satisfied but nothing staged yet → step 1 (stage).
        const session = freshSession({ route: 'safe' });
        expect(currentTutorialStep(session, vm)).toBe(HAZARD_TUTORIAL_STEPS.findIndex((s) => s.id === 'stage'));
    });

    it('returns -1 once every predicate is satisfied', () => {
        const complete = freshSession({
            phase: 'done',
            route: 'safe',
            play: [{ applied: true }],
            dice: [{ state: 'spent' }],
            round: 3,
        });
        expect(currentTutorialStep(complete, vm)).toBe(-1);
    });

    it('points at the trailing outcome step when only it remains unmet', () => {
        const nearlyDone = freshSession({
            phase: 'outcome', // not yet acknowledged into 'rewards' → outcome still unmet
            route: 'safe',
            play: [{ applied: true }],
            dice: [{ state: 'spent' }],
            round: 2,
        });
        expect(currentTutorialStep(nearlyDone, vm)).toBe(TOTAL - 1);
        expect(HAZARD_TUTORIAL_STEPS[TOTAL - 1].id).toBe('outcome');
    });

    it('a player who runs ahead (round already advanced) skips proven steps', () => {
        // Round advanced past 1 satisfies stage/power/apply/resolve at once,
        // even though nothing was ever explicitly staged/powered/applied in
        // this fixture — mirrors a player who cleared the round some other
        // way. Only route (never chosen here) remains unmet.
        const session = freshSession({ round: 2 });
        expect(currentTutorialStep(session, vm)).toBe(0);
        expect(HAZARD_TUTORIAL_STEPS[0].id).toBe('route');
    });
});
