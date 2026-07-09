/**
 * Hermetic component tests — CacheTutorialCoach surface (the guided
 * first delve's bottom-docked coach).
 *
 * The coach derives its current step statelessly from the live session
 * every render (the first step whose `done` predicate is unmet) and
 * renders nothing once the script is complete. These tests pin the
 * render-layer logic the engine test (cache.tutorial.engine) does not
 * reach: the `index < 0` null-return gate, the `THE FIRST DELVE ·
 * n / total` step counter, the current step's title/body/find copy,
 * and the SKIP press wiring. Step fixtures are minimal partial sessions
 * crafted so the first N predicates pass — only the fields the
 * predicates read are populated.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { CacheTutorialCoach } from '@/components/cache/CacheTutorialCoach';
import { CACHE_TUTORIAL_STEPS } from '@/components/cache/tutorial-steps';
import type { CacheVM } from '@/state/presenters/cache.engine';
import type { LootCacheSession } from '@mechanics';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOTAL = CACHE_TUTORIAL_STEPS.length;

// The five step predicates (in order) read only these session fields:
//   begin   → phase !== 'intro'
//   delve   → pick !== null || depth > 0
//   push    → (pick !== null && pick.lastRoll !== null) || depth > 0
//   card    → phase ∈ {delving, outcome, done}
//   outcome → phase ∈ {outcome, done}
// The view-model is unused by every predicate, so an empty cast suffices.
const vm = {} as CacheVM;

/**
 * One fixture per `completed` count (0..TOTAL): the state right before
 * step `completed` becomes current (the first `completed` predicates
 * satisfied, the rest not). `FIXTURES[TOTAL]` yields a fully-complete
 * script (coach hides).
 */
const FIXTURES: ReadonlyArray<{
    phase: LootCacheSession['phase'];
    pick: { lastRoll: unknown } | null;
    depth: number;
}> = [
    { phase: 'intro', pick: null, depth: 0 },                  // 0: begin unmet
    { phase: 'delving', pick: null, depth: 0 },                // 1: delve unmet
    { phase: 'picking', pick: { lastRoll: null }, depth: 0 },  // 2: push unmet
    { phase: 'card', pick: null, depth: 1 },                   // 3: card unmet
    { phase: 'delving', pick: null, depth: 1 },                // 4: outcome unmet
    { phase: 'outcome', pick: null, depth: 1 },                // 5: complete
];

/**
 * Build a session that satisfies the first `completed` step predicates,
 * leaving step index `completed` as the current (first-unmet) step.
 * `completed === TOTAL` yields a fully-complete script (coach hides).
 */
function sessionAtStep(completed: number): LootCacheSession {
    return FIXTURES[completed] as unknown as LootCacheSession;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CacheTutorialCoach', () => {
    describe('null-return gate', () => {
        it('renders nothing once the tutorial script is complete', () => {
            const { queryByTestId } = render(
                <CacheTutorialCoach session={sessionAtStep(TOTAL)} vm={vm} onSkip={() => {}} />,
            );
            expect(queryByTestId('cache-tutorial')).toBeNull();
        });

        it('renders the coach banner while a step is still unmet', () => {
            const { getByTestId } = render(
                <CacheTutorialCoach session={sessionAtStep(0)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByTestId('cache-tutorial')).toBeTruthy();
        });
    });

    describe('step counter', () => {
        it('shows 1 / total on the first step', () => {
            const { getByText } = render(
                <CacheTutorialCoach session={sessionAtStep(0)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByText(`THE FIRST DELVE · 1 / ${TOTAL}`)).toBeTruthy();
        });

        it('advances the counter as predicates are met', () => {
            const { getByText } = render(
                <CacheTutorialCoach session={sessionAtStep(2)} vm={vm} onSkip={() => {}} />,
            );
            // First two steps done → step index 2 is current (the 3rd step).
            expect(getByText(`THE FIRST DELVE · 3 / ${TOTAL}`)).toBeTruthy();
        });
    });

    describe('current-step copy', () => {
        it('renders the title, body, and find hint of the current step', () => {
            const step = CACHE_TUTORIAL_STEPS[0];
            const { getByText } = render(
                <CacheTutorialCoach session={sessionAtStep(0)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByText(step.title)).toBeTruthy();
            expect(getByText(step.body)).toBeTruthy();
            expect(getByText(`✦ find: ${step.lookFor}`)).toBeTruthy();
        });

        it('swaps to the next step copy when an earlier predicate is met', () => {
            const next = CACHE_TUTORIAL_STEPS[1];
            const { getByText, queryByText } = render(
                <CacheTutorialCoach session={sessionAtStep(1)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByText(next.title)).toBeTruthy();
            // The first step's title is no longer shown.
            expect(queryByText(CACHE_TUTORIAL_STEPS[0].title)).toBeNull();
        });
    });

    describe('skip wiring', () => {
        it('fires onSkip when the SKIP control is pressed', () => {
            const onSkip = jest.fn();
            const { getByTestId } = render(
                <CacheTutorialCoach session={sessionAtStep(0)} vm={vm} onSkip={onSkip} />,
            );
            fireEvent.press(getByTestId('cache-tutorial-skip'));
            expect(onSkip).toHaveBeenCalledTimes(1);
        });
    });
});
