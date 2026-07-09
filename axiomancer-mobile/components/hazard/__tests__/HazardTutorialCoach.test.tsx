/**
 * Hermetic component tests — HazardTutorialCoach surface (the guided
 * first-crossing bottom-docked coach).
 *
 * The coach derives its current step statelessly from the live session
 * every render (the first step whose `done` predicate is unmet), renders
 * nothing once the script is complete, and — unlike the rest/gathering
 * coaches — also renders nothing outside the `route-select` / `playing`
 * phases (every other Hazard phase is already a full-screen overlay).
 * These tests pin the render-layer logic the engine test
 * (hazard.tutorial.engine) does not reach: both null-return gates, the
 * `THE FIRST CROSSING · n / total` step counter, the current step's
 * title/body/find copy, and the SKIP press wiring. Step fixtures are
 * minimal partial sessions crafted so the first N predicates pass — only
 * the fields the predicates read are populated.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { HazardTutorialCoach } from '@/components/hazard/HazardTutorialCoach';
import { HAZARD_TUTORIAL_STEPS } from '@/components/hazard/tutorial-steps';
import type { HazardViewModel } from '@/state/presenters/hazard.engine';
import type { HazardSessionState } from '@mechanics';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOTAL = HAZARD_TUTORIAL_STEPS.length;

// The six step predicates (in order) read only these session fields:
//   route    → route !== null
//   stage    → play.length >= 1 (or round > 1)
//   power    → dice.some(spent) (or round > 1)
//   apply    → play.some(applied) (or round > 1)
//   resolve  → round > 1 (or a terminal phase)
//   outcome  → phase === 'done'
// The view-model is unused by every predicate, so an empty cast suffices.
const vm = {} as HazardViewModel;

/**
 * Build a session that satisfies the first `completed` step predicates,
 * leaving step index `completed` as the current (first-unmet) step, with
 * `phase` held at `'playing'` throughout (except the terminal `outcome`
 * step) so the render gate stays open. `completed === TOTAL` yields a
 * fully-complete script (coach hides).
 */
function sessionAtStep(completed: number): HazardSessionState {
    return {
        phase: completed >= TOTAL ? 'done' : completed >= 1 ? 'playing' : 'route-select',
        route: completed >= 1 ? 'safe' : null,
        play: completed >= 4 ? [{ applied: true }] : completed >= 2 ? [{ applied: false }] : [],
        dice: completed >= 3 ? [{ state: 'spent' }] : [{ state: 'available' }],
        round: completed >= 5 ? 2 : 1,
    } as unknown as HazardSessionState;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HazardTutorialCoach', () => {
    describe('null-return gates', () => {
        it('renders nothing once the tutorial script is complete', () => {
            const { queryByTestId } = render(
                <HazardTutorialCoach session={sessionAtStep(TOTAL)} vm={vm} onSkip={() => {}} />,
            );
            expect(queryByTestId('hazard-tutorial')).toBeNull();
        });

        it('renders the coach banner while a step is still unmet', () => {
            const { getByTestId } = render(
                <HazardTutorialCoach session={sessionAtStep(0)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByTestId('hazard-tutorial')).toBeTruthy();
        });

        it('renders nothing outside route-select/playing, even mid-script', () => {
            const midScript = { ...sessionAtStep(2), phase: 'rolling' } as HazardSessionState;
            const { queryByTestId } = render(
                <HazardTutorialCoach session={midScript} vm={vm} onSkip={() => {}} />,
            );
            expect(queryByTestId('hazard-tutorial')).toBeNull();
        });
    });

    describe('step counter', () => {
        it('shows 1 / total on the first step', () => {
            const { getByText } = render(
                <HazardTutorialCoach session={sessionAtStep(0)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByText(`THE FIRST CROSSING · 1 / ${TOTAL}`)).toBeTruthy();
        });

        it('advances the counter as predicates are met', () => {
            const { getByText } = render(
                <HazardTutorialCoach session={sessionAtStep(3)} vm={vm} onSkip={() => {}} />,
            );
            // First three steps done → step index 3 is current (the 4th step).
            expect(getByText(`THE FIRST CROSSING · 4 / ${TOTAL}`)).toBeTruthy();
        });
    });

    describe('current-step copy', () => {
        it('renders the title, body, and find hint of the current step', () => {
            const step = HAZARD_TUTORIAL_STEPS[0];
            const { getByText } = render(
                <HazardTutorialCoach session={sessionAtStep(0)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByText(step.title)).toBeTruthy();
            expect(getByText(step.body)).toBeTruthy();
            expect(getByText(`✦ find: ${step.lookFor}`)).toBeTruthy();
        });

        it('swaps to the next step copy when an earlier predicate is met', () => {
            const next = HAZARD_TUTORIAL_STEPS[1];
            const { getByText, queryByText } = render(
                <HazardTutorialCoach session={sessionAtStep(1)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByText(next.title)).toBeTruthy();
            // The first step's title is no longer shown.
            expect(queryByText(HAZARD_TUTORIAL_STEPS[0].title)).toBeNull();
        });
    });

    describe('skip wiring', () => {
        it('fires onSkip when the SKIP control is pressed', () => {
            const onSkip = jest.fn();
            const { getByTestId } = render(
                <HazardTutorialCoach session={sessionAtStep(0)} vm={vm} onSkip={onSkip} />,
            );
            fireEvent.press(getByTestId('hazard-tutorial-skip'));
            expect(onSkip).toHaveBeenCalledTimes(1);
        });
    });
});
