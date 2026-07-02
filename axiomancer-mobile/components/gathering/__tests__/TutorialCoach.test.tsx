/**
 * Hermetic component tests — TutorialCoach surface (the guided first
 * gleaning's bottom-docked coach).
 *
 * The coach derives its current step statelessly from the live session
 * every render (the first step whose `done` predicate is unmet) and
 * renders nothing once the script is complete. These tests pin the
 * render-layer logic the engine test (gathering.tutorial.engine) does
 * not reach: the `index < 0` null-return gate, the `FIRST GLEANING ·
 * n / total` step counter, the current step's title/body/find copy,
 * and the SKIP press wiring. Step fixtures are minimal partial sessions
 * crafted so the first N predicates pass — only the fields the
 * predicates read are populated.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { TutorialCoach } from '@/components/gathering/TutorialCoach';
import { GATHERING_TUTORIAL_STEPS } from '@/components/gathering/tutorial-steps';
import type { GatheringViewModel } from '@/state/presenters/gathering.engine';
import type { GatheringSessionState } from 'axiomancer-mechanics';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOTAL = GATHERING_TUTORIAL_STEPS.length;

// The seven step predicates (in order) read only these session fields:
//   approach → phase !== 'approach-select'
//   take     → satchel.length >= 1
//   tend     → metrics.breathsTended >= 1
//   offer    → metrics.offeringsPaid >= 1
//   tool     → tools.some((t) => t.used)
//   descend  → depth >= 1
//   withdraw → phase ∈ {outcome, rewards, done}
// The view-model is unused by every predicate, so an empty cast suffices.
const vm = {} as GatheringViewModel;

/**
 * Build a session that satisfies the first `completed` step predicates,
 * leaving step index `completed` as the current (first-unmet) step.
 * `completed === TOTAL` yields a fully-complete script (coach hides).
 */
function sessionAtStep(completed: number): GatheringSessionState {
    const allWithdrawn = completed >= 7;
    return {
        // approach done once we leave the select phase; withdraw done at outcome.
        phase: allWithdrawn ? 'outcome' : completed >= 1 ? 'spread' : 'approach-select',
        satchel: completed >= 2 ? [{} as never] : [],
        metrics: {
            breathsTended: completed >= 3 ? 1 : 0,
            offeringsPaid: completed >= 4 ? 1 : 0,
        },
        tools: completed >= 5 ? [{ used: true } as never] : [{ used: false } as never],
        depth: completed >= 6 ? 1 : 0,
    } as unknown as GatheringSessionState;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TutorialCoach', () => {
    describe('null-return gate', () => {
        it('renders nothing once the tutorial script is complete', () => {
            const { queryByTestId } = render(
                <TutorialCoach session={sessionAtStep(TOTAL)} vm={vm} onSkip={() => {}} />,
            );
            expect(queryByTestId('gathering-tutorial')).toBeNull();
        });

        it('renders the coach banner while a step is still unmet', () => {
            const { getByTestId } = render(
                <TutorialCoach session={sessionAtStep(0)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByTestId('gathering-tutorial')).toBeTruthy();
        });
    });

    describe('step counter', () => {
        it('shows 1 / total on the first step', () => {
            const { getByText } = render(
                <TutorialCoach session={sessionAtStep(0)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByText(`FIRST GLEANING · 1 / ${TOTAL}`)).toBeTruthy();
        });

        it('advances the counter as predicates are met', () => {
            const { getByText } = render(
                <TutorialCoach session={sessionAtStep(3)} vm={vm} onSkip={() => {}} />,
            );
            // First three steps done → step index 3 is current (the 4th step).
            expect(getByText(`FIRST GLEANING · 4 / ${TOTAL}`)).toBeTruthy();
        });
    });

    describe('current-step copy', () => {
        it('renders the title, body, and find hint of the current step', () => {
            const step = GATHERING_TUTORIAL_STEPS[0];
            const { getByText } = render(
                <TutorialCoach session={sessionAtStep(0)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByText(step.title)).toBeTruthy();
            expect(getByText(step.body)).toBeTruthy();
            expect(getByText(`✦ find: ${step.lookFor}`)).toBeTruthy();
        });

        it('swaps to the next step copy when an earlier predicate is met', () => {
            const next = GATHERING_TUTORIAL_STEPS[1];
            const { getByText, queryByText } = render(
                <TutorialCoach session={sessionAtStep(1)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByText(next.title)).toBeTruthy();
            // The first step's title is no longer shown.
            expect(queryByText(GATHERING_TUTORIAL_STEPS[0].title)).toBeNull();
        });
    });

    describe('skip wiring', () => {
        it('fires onSkip when the SKIP control is pressed', () => {
            const onSkip = jest.fn();
            const { getByTestId } = render(
                <TutorialCoach session={sessionAtStep(0)} vm={vm} onSkip={onSkip} />,
            );
            fireEvent.press(getByTestId('gathering-tutorial-skip'));
            expect(onSkip).toHaveBeenCalledTimes(1);
        });
    });
});
