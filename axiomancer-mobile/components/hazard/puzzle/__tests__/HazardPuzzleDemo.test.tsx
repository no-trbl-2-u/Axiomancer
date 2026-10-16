/**
 * Hermetic component tests — the HAZARD PUZZLES flow (A14, A15): list,
 * route pick before the clock, the board, clock expiry confirming the board
 * as it stands, a manual confirm, and the outcome reaching the player.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { HazardPuzzleDemo } from '@/components/hazard/puzzle/HazardPuzzleDemo';
import { HAZARD_PUZZLE_TICK_MS } from '@/components/hazard/puzzle/useHazardPuzzleClock';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { withAllProviders } from '@/test-utils/withAllProviders';
import type { BaseStats } from '@mechanics';

beforeEach(() => {
    jest.useFakeTimers();
    globalThis.__AXM_HAZARD_SEED__ = 11;
});

afterEach(() => {
    jest.useRealTimers();
    delete (globalThis as { __AXM_HAZARD_SEED__?: number }).__AXM_HAZARD_SEED__;
});

function openHardRisk(stats: BaseStats = { heart: 1, body: 1, mind: 1 }) {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    store.setState({ player: { ...store.getState().player, baseStats: stats } } as never);
    const { tree } = withAllProviders(<HazardPuzzleDemo />, { store });
    const screen = render(tree);
    fireEvent.press(screen.getByTestId('hazard-puzzle-pick-demo-undercroft-hard'));
    expect(screen.getByTestId('hazard-puzzle-routes')).toBeTruthy();
    fireEvent.press(screen.getByTestId('hazard-puzzle-route-risk'));
    return { screen, store };
}

describe('HazardPuzzleDemo', () => {
    it('lists the three demos', () => {
        const { tree } = withAllProviders(<HazardPuzzleDemo />);
        const screen = render(tree);
        expect(screen.getByTestId('hazard-puzzle-list')).toBeTruthy();
        expect(screen.getByTestId('hazard-puzzle-pick-demo-cliff-easy')).toBeTruthy();
        expect(screen.getByTestId('hazard-puzzle-pick-demo-ashfall-medium')).toBeTruthy();
        expect(screen.getByTestId('hazard-puzzle-pick-demo-undercroft-hard')).toBeTruthy();
    });

    it('the clock does not run until a route is picked', () => {
        const { tree } = withAllProviders(<HazardPuzzleDemo />);
        const screen = render(tree);
        fireEvent.press(screen.getByTestId('hazard-puzzle-pick-demo-undercroft-hard'));
        act(() => {
            jest.advanceTimersByTime(120 * HAZARD_PUZZLE_TICK_MS);
        });
        expect(screen.getByTestId('hazard-puzzle-routes')).toBeTruthy();
        expect(screen.queryByTestId('hazard-puzzle-outcome')).toBeNull();
    });

    it('starts the board with the hard risk clock, hand and reserve', () => {
        const { screen } = openHardRisk();
        expect(screen.getByTestId('hazard-puzzle-board')).toBeTruthy();
        expect(screen.getByTestId('hazard-puzzle-clock').props.children).toBe('1:00');
        expect(screen.getByTestId('hazard-puzzle-reserve').props.children).toBe('2 CARDS IN RESERVE');
        expect(screen.getByTestId('hazard-puzzle-unlocks').props.children).toBe('Your stats unlock nothing here.');
        expect(screen.getAllByTestId(/^hazard-puzzle-hand-c\d+$/)).toHaveLength(3);
    });

    it('a Mind of 3 unlocks CLIFFRUNNER into the hand, and the board names it', () => {
        const { screen } = openHardRisk({ heart: 1, body: 1, mind: 3 });
        expect(screen.getByTestId('hazard-puzzle-unlocks').props.children).toBe(
            'Your stats unlock: CLIFFRUNNER joins the hand (MIND 3).',
        );
        expect(screen.getAllByTestId(/^hazard-puzzle-hand-c\d+$/)).toHaveLength(4);
    });

    it('when the clock runs out, confirms the board as it stands and pays the outcome', () => {
        const { screen, store } = openHardRisk();
        const before = store.getState().player;
        fireEvent.press(screen.getByTestId('hazard-puzzle-hand-c1-play'));
        act(() => {
            jest.advanceTimersByTime(59 * HAZARD_PUZZLE_TICK_MS);
        });
        expect(screen.queryByTestId('hazard-puzzle-outcome')).toBeNull();
        expect(screen.getByTestId('hazard-puzzle-clock').props.children).toBe('0:01');
        act(() => {
            jest.advanceTimersByTime(HAZARD_PUZZLE_TICK_MS);
        });
        expect(screen.getByTestId('hazard-puzzle-outcome-headline').props.children).toBe('TIME RAN OUT');
        const after = store.getState().player;
        expect(after.experience).toBeGreaterThan(before.experience);
        expect(after.health).toBeLessThan(before.health);
        // The board is locked: no more clock and no second claim.
        act(() => {
            jest.advanceTimersByTime(30 * HAZARD_PUZZLE_TICK_MS);
        });
        expect(store.getState().player.experience).toBe(after.experience);
    });

    it('after a timed-out board and DONE, the next board still times out', () => {
        const { screen, store } = openHardRisk();
        act(() => {
            jest.advanceTimersByTime(60 * HAZARD_PUZZLE_TICK_MS);
        });
        expect(screen.getByTestId('hazard-puzzle-outcome-headline').props.children).toBe('TIME RAN OUT');
        fireEvent.press(screen.getByTestId('hazard-puzzle-done'));
        fireEvent.press(screen.getByTestId('hazard-puzzle-pick-demo-undercroft-hard'));
        fireEvent.press(screen.getByTestId('hazard-puzzle-route-risk'));
        expect(screen.getByTestId('hazard-puzzle-clock').props.children).toBe('1:00');
        const xp = store.getState().player.experience;
        act(() => {
            jest.advanceTimersByTime(60 * HAZARD_PUZZLE_TICK_MS);
        });
        expect(screen.getByTestId('hazard-puzzle-outcome-headline').props.children).toBe('TIME RAN OUT');
        expect(store.getState().player.experience).toBeGreaterThan(xp);
    });

    it('a manual confirm resolves at once, without waiting for the clock', () => {
        const { screen } = openHardRisk();
        fireEvent.press(screen.getByTestId('hazard-puzzle-confirm'));
        expect(screen.getByTestId('hazard-puzzle-outcome-headline').props.children).toBe('FELL SHORT');
        fireEvent.press(screen.getByTestId('hazard-puzzle-done'));
        expect(screen.getByTestId('hazard-puzzle-list')).toBeTruthy();
    });

    it('opens straight on a demo and route from the deep link, and auto-confirm shows the outcome', () => {
        const { tree } = withAllProviders(
            <HazardPuzzleDemo initialId="demo-cliff-easy" initialRoute="safe" autoConfirm />,
        );
        const screen = render(tree);
        expect(screen.getByTestId('hazard-puzzle-board')).toBeTruthy();
        expect(screen.getByTestId('hazard-puzzle-outcome')).toBeTruthy();
    });
});
