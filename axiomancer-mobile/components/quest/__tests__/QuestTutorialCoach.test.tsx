/**
 * Hermetic component tests — QuestTutorialCoach surface (the guided
 * opening-loop bottom-docked coach).
 *
 * The coach derives its current step statelessly from the live session
 * every render (the first step whose `done` predicate is unmet), renders
 * nothing once the script is complete, and — like Hazard's coach, unlike
 * Rest/Gathering/Cache's — also renders nothing outside the `idle` phase
 * (every other Quest Board phase is already a full-screen `Scrim`
 * overlay). Two steps only (see `tutorial-steps.ts` header for why): the
 * `roll` step (before the first cast) and the `again` step (once
 * `metrics.rolls >= 2` or a terminal phase) — this file exercises both,
 * plus both null-return gates and the SKIP wiring.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { QuestTutorialCoach } from '@/components/quest/QuestTutorialCoach';
import { QUEST_TUTORIAL_STEPS } from '@/components/quest/tutorial-steps';
import type { QuestBoardVM } from '@/state/presenters/quest.engine';
import type { QuestBoardSession } from '@mechanics';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOTAL = QUEST_TUTORIAL_STEPS.length;

// No predicate reads the view-model, so an empty cast suffices.
const vm = {} as QuestBoardVM;

function sessionAt(phase: QuestBoardSession['phase'], rolls: number): QuestBoardSession {
    return {
        phase,
        metrics: { rolls },
    } as unknown as QuestBoardSession;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('QuestTutorialCoach', () => {
    describe('null-return gates', () => {
        it('renders nothing once the tutorial script is complete', () => {
            const { queryByTestId } = render(
                <QuestTutorialCoach session={sessionAt('idle', 2)} vm={vm} onSkip={() => {}} />,
            );
            expect(queryByTestId('quest-tutorial')).toBeNull();
        });

        it('renders the coach banner while the roll step is unmet', () => {
            const { getByTestId } = render(
                <QuestTutorialCoach session={sessionAt('idle', 0)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByTestId('quest-tutorial')).toBeTruthy();
        });

        it('renders nothing outside idle, even mid-script (space overlay covers the screen)', () => {
            const { queryByTestId } = render(
                <QuestTutorialCoach session={sessionAt('space', 1)} vm={vm} onSkip={() => {}} />,
            );
            expect(queryByTestId('quest-tutorial')).toBeNull();
        });

        it('renders nothing during intro, dusk, or outcome', () => {
            for (const phase of ['intro', 'dusk', 'outcome', 'done'] as const) {
                const { queryByTestId, unmount } = render(
                    <QuestTutorialCoach session={sessionAt(phase, 0)} vm={vm} onSkip={() => {}} />,
                );
                expect(queryByTestId('quest-tutorial')).toBeNull();
                unmount();
            }
        });
    });

    describe('step counter', () => {
        it('shows 1 / total on the roll step (a brand-new idle session)', () => {
            const { getByText } = render(
                <QuestTutorialCoach session={sessionAt('idle', 0)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByText(`THE FIRST SESSION · 1 / ${TOTAL}`)).toBeTruthy();
        });

        it('jumps to the final step once back at idle after the first roll', () => {
            const { getByText } = render(
                <QuestTutorialCoach session={sessionAt('idle', 1)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByText(`THE FIRST SESSION · ${TOTAL} / ${TOTAL}`)).toBeTruthy();
        });
    });

    describe('current-step copy', () => {
        it('renders the roll step title, body, and find hint on a brand-new session', () => {
            const step = QUEST_TUTORIAL_STEPS[0];
            const { getByText } = render(
                <QuestTutorialCoach session={sessionAt('idle', 0)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByText(step.title)).toBeTruthy();
            expect(getByText(step.body)).toBeTruthy();
            expect(getByText(`✦ find: ${step.lookFor}`)).toBeTruthy();
        });

        it('renders the "again" step copy once the loop returns to idle', () => {
            const again = QUEST_TUTORIAL_STEPS[TOTAL - 1];
            const { getByText, queryByText } = render(
                <QuestTutorialCoach session={sessionAt('idle', 1)} vm={vm} onSkip={() => {}} />,
            );
            expect(getByText(again.title)).toBeTruthy();
            expect(queryByText(QUEST_TUTORIAL_STEPS[0].title)).toBeNull();
        });
    });

    describe('skip wiring', () => {
        it('fires onSkip when the SKIP control is pressed', () => {
            const onSkip = jest.fn();
            const { getByTestId } = render(
                <QuestTutorialCoach session={sessionAt('idle', 0)} vm={vm} onSkip={onSkip} />,
            );
            fireEvent.press(getByTestId('quest-tutorial-skip'));
            expect(onSkip).toHaveBeenCalledTimes(1);
        });
    });
});
