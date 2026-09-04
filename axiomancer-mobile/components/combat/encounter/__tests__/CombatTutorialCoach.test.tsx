/**
 * Hermetic component tests — CombatTutorialCoach + CombatTutorialPrimer surface.
 *
 * The coach derives its current step statelessly from the live encounter plus
 * the board's staged-card count every render, renders nothing once the script
 * is complete, and hangs UNDER the enemy HUD rather than over the dice tray
 * (the 2026-09-04 playtest found the old bottom anchor covering the dice it
 * pointed at). These tests pin the render-layer logic the step-engine test
 * does not reach: the null-return gate, the `stagedCount` prop reaching the
 * predicates, the `FIRST FIGHT · n / total` counter, the current step's copy,
 * the top anchor (inset-safe without a provider), and the SKIP wiring. The
 * primer's panels are also swept for the retired three-dice draft copy.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { CombatTutorialCoach } from '@/components/combat/encounter/CombatTutorialCoach';
import { CombatTutorialPrimer } from '@/components/combat/encounter/CombatTutorialPrimer';
import { COMBAT_HUD_HEIGHT } from '@/components/combat/encounter/CombatCombatantPane';
import { COMBAT_TUTORIAL_STEPS } from '@/components/combat/encounter/combat-tutorial-steps';
import type { CombatViewModel } from '@/state/presenters/combat-encounter.engine';
import type { CombatEncounterState } from '@mechanics';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOTAL = COMBAT_TUTORIAL_STEPS.length;
const vm = {} as CombatViewModel;

/** A turn-one board: nothing played, enemy untouched. */
function turnOne(overrides: Partial<{ discard: string[]; turn: number }> = {}): CombatEncounterState {
    return {
        discard: [],
        turn: 1,
        currentPhaseIndex: 0,
        threatMarks: ['pending', 'pending'],
        finalOutcome: null,
        enemy: { health: 100, maxHealth: 100, effects: [] },
        ...overrides,
    } as unknown as CombatEncounterState;
}

// ---------------------------------------------------------------------------
// Coach
// ---------------------------------------------------------------------------

describe('CombatTutorialCoach', () => {
    it('renders nothing once the script is complete', () => {
        const { queryByTestId } = render(
            <CombatTutorialCoach state={turnOne({ turn: 2 })} vm={vm} stagedCount={0} onSkip={() => {}} />,
        );
        expect(queryByTestId('combat-tutorial')).toBeNull();
    });

    it('shows the stage step at 1 / total on a fresh board', () => {
        const { getByText } = render(
            <CombatTutorialCoach state={turnOne()} vm={vm} stagedCount={0} onSkip={() => {}} />,
        );
        const step = COMBAT_TUTORIAL_STEPS[0];
        expect(getByText(`⚔ FIRST FIGHT · 1 / ${TOTAL}`)).toBeTruthy();
        expect(getByText(step.title)).toBeTruthy();
        expect(getByText(step.body)).toBeTruthy();
        expect(getByText(`✦ find: ${step.lookFor}`)).toBeTruthy();
    });

    it('moves to the power step when the board reports a staged card', () => {
        const { getByText, queryByText } = render(
            <CombatTutorialCoach state={turnOne()} vm={vm} stagedCount={1} onSkip={() => {}} />,
        );
        expect(getByText(`⚔ FIRST FIGHT · 2 / ${TOTAL}`)).toBeTruthy();
        expect(getByText(COMBAT_TUTORIAL_STEPS[1].title)).toBeTruthy();
        expect(queryByText(COMBAT_TUTORIAL_STEPS[0].title)).toBeNull();
    });

    it('anchors under the enemy HUD, never to the bottom dock', () => {
        const { getByTestId } = render(
            <CombatTutorialCoach state={turnOne()} vm={vm} stagedCount={0} onSkip={() => {}} />,
        );
        const style = StyleSheet.flatten(getByTestId('combat-tutorial').props.style) as Record<string, unknown>;
        // No SafeAreaProvider in tests → inset 0 → top = HUD height + gap.
        expect(style.top).toBe(COMBAT_HUD_HEIGHT + 4);
        expect(style.bottom).toBeUndefined();
    });

    it('fires onSkip when SKIP is pressed', () => {
        const onSkip = jest.fn();
        const { getByTestId } = render(
            <CombatTutorialCoach state={turnOne()} vm={vm} stagedCount={0} onSkip={onSkip} />,
        );
        fireEvent.press(getByTestId('combat-tutorial-skip'));
        expect(onSkip).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// Primer — copy guard
// ---------------------------------------------------------------------------

describe('CombatTutorialPrimer', () => {
    const RETIRED = [/three dice/i, /keep one/i, /draft/i, /tap it/i, /REFRESHES/];

    it('walks every panel without teaching the retired three-dice draft', () => {
        const { getByTestId, queryByTestId, toJSON } = render(
            <CombatTutorialPrimer onBegin={() => {}} onSkip={() => {}} />,
        );
        // Page through NEXT until BEGIN appears, sweeping each panel's text.
        for (let guard = 0; guard < 10; guard++) {
            const text = JSON.stringify(toJSON());
            for (const re of RETIRED) expect(text).not.toMatch(re);
            const next = queryByTestId('combat-primer-next');
            if (!next) break;
            fireEvent.press(next);
        }
        expect(getByTestId('combat-primer-begin')).toBeTruthy();
    });

    it('teaches the four-dice model on the dice panel', () => {
        const { getByTestId, getByText } = render(
            <CombatTutorialPrimer onBegin={() => {}} onSkip={() => {}} />,
        );
        fireEvent.press(getByTestId('combat-primer-next'));
        fireEvent.press(getByTestId('combat-primer-next'));
        expect(getByText('STAGE, THEN POWER')).toBeTruthy();
        expect(getByText(/FOUR dice/)).toBeTruthy();
    });
});
