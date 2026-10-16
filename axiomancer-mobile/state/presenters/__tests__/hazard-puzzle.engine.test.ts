/**
 * Hazard puzzle board presenter (A14, A15): the demo list, routes with their
 * goals and clocks, the stat-unlock line, the board view model, the clock
 * arithmetic and the outcome panel.
 */

import { describe, expect, it } from '@jest/globals';

import {
    confirmHazardPuzzle,
    createHazardPuzzleSession,
    getHazardPuzzleLayout,
    HAZARD_PUZZLE_CLOCK_SECONDS,
    hazardPuzzleOutcome,
    stageHazardPuzzleCard,
    type HazardPuzzleUnlock,
} from '@mechanics';

import {
    formatHazardPuzzleClock,
    hazardPuzzleClockExpired,
    hazardPuzzleClockFor,
    selectHazardPuzzleBoardVM,
    selectHazardPuzzleListVM,
    selectHazardPuzzleOutcomeVM,
    selectHazardPuzzleRoutes,
    selectHazardPuzzleUnlockLine,
    tickHazardPuzzleClock,
} from '../hazard-puzzle.engine';

const HARD = getHazardPuzzleLayout('demo-undercroft-hard');

describe('the demo list', () => {
    it('lists the three demos with their risk band', () => {
        expect(selectHazardPuzzleListVM().map((i) => [i.id, i.title, i.bandChip])).toEqual([
            ['demo-cliff-easy', 'CRACKED CLIFF PATH', 'EASY ON THE RISK ROUTE'],
            ['demo-ashfall-medium', 'ASHFALL CROSSING', 'MEDIUM ON THE RISK ROUTE'],
            ['demo-undercroft-hard', 'FLOODED UNDERCROFT', 'HARD ON THE RISK ROUTE'],
        ]);
    });
});

describe('routes and the clock (A15)', () => {
    it('names both routes from the live hazard, with goal, band and clock', () => {
        expect(selectHazardPuzzleRoutes(HARD)).toEqual([
            {
                key: 'safe',
                name: 'THE LONG GALLERY',
                goalLabel: 'REACH 26 FORCE + ESCAPE',
                bandLabel: 'MEDIUM',
                clockLabel: '75 S ON THE CLOCK',
                testID: 'hazard-puzzle-route-safe',
            },
            {
                key: 'risk',
                name: 'THE DROWNED DOOR',
                goalLabel: 'REACH 13 FORCE AND 14 ESCAPE',
                bandLabel: 'HARD',
                clockLabel: '60 S ON THE CLOCK',
                testID: 'hazard-puzzle-route-risk',
            },
        ]);
    });

    it('takes the clock from the band of the route played', () => {
        expect(HAZARD_PUZZLE_CLOCK_SECONDS).toEqual({ easy: 90, medium: 75, hard: 60 });
        expect(hazardPuzzleClockFor(HARD, 'risk')).toBe(60);
        expect(hazardPuzzleClockFor(HARD, 'safe')).toBe(75);
    });

    it('ticks a second at a time, stops at zero, and expires there', () => {
        expect(tickHazardPuzzleClock(60)).toBe(59);
        expect(tickHazardPuzzleClock(0)).toBe(0);
        expect(hazardPuzzleClockExpired(1)).toBe(false);
        expect(hazardPuzzleClockExpired(0)).toBe(true);
        expect(formatHazardPuzzleClock(75)).toBe('1:15');
        expect(formatHazardPuzzleClock(9)).toBe('0:09');
    });
});

describe('the stat-unlock line', () => {
    it('names each unlock the stats met, or says none', () => {
        const unlocks: HazardPuzzleUnlock[] = [
            { stat: 'heart', min: 3, kind: 'extraDie' },
            { stat: 'mind', min: 3, kind: 'extraCard', cardId: 'runner' },
            { stat: 'mind', min: 2, kind: 'blankReroll', face: 'gold' },
        ];
        expect(selectHazardPuzzleUnlockLine(unlocks)).toBe(
            'Your stats unlock: +1 PURPLE die (HEART 3); CLIFFRUNNER joins the hand (MIND 3); blank dice turn YELLOW (MIND 2).',
        );
        expect(selectHazardPuzzleUnlockLine([])).toBe('Your stats unlock nothing here.');
    });
});

describe('the board', () => {
    it('shows the hand, dice, reserve count, goal, progress and clock', () => {
        const session = createHazardPuzzleSession(HARD, 'risk');
        const vm = selectHazardPuzzleBoardVM(HARD, session, 60);
        expect(vm.title).toBe('FLOODED UNDERCROFT');
        expect(vm.routeName).toBe('THE DROWNED DOOR');
        expect(vm.hand.map((h) => h.card.cardId)).toEqual(['footing', 'haul', 'scram']);
        expect(vm.dice.map((d) => d.kind)).toEqual(['purple', 'red', 'blue']);
        expect(vm.reserveLabel).toBe('2 CARDS IN RESERVE');
        expect(vm.progressLabel).toBe('FORCE 0 · ESCAPE 0');
        expect(vm.clockLabel).toBe('1:00');
        expect(vm.clockUrgent).toBe(false);
        expect(vm.canConfirm).toBe(true);
    });

    it('offers each die that can power a staged card, and APPLY for a utility card', () => {
        const session = stageHazardPuzzleCard(createHazardPuzzleSession(HARD, 'risk'), 'c1');
        const vm = selectHazardPuzzleBoardVM(HARD, session, 9);
        expect(vm.staged).toHaveLength(1);
        expect(vm.staged[0].powerOptions.map((o) => o.label)).toEqual(['POWER: PURPLE']);
        expect(vm.staged[0].canApply).toBe(true);
        expect(vm.progressLabel).toBe('FORCE 2 · ESCAPE 2');
        expect(vm.clockUrgent).toBe(true);
    });

    it('locks the board once resolved', () => {
        const vm = selectHazardPuzzleBoardVM(HARD, confirmHazardPuzzle(createHazardPuzzleSession(HARD, 'risk')), 30);
        expect(vm.canConfirm).toBe(false);
    });
});

describe('the outcome panel', () => {
    it('lists the rewards and the penalty of a short resolve', () => {
        const result = { force: 0, escape: 0, goal: [13, 14] as [number, number], p: 0, cleared: false };
        const outcome = hazardPuzzleOutcome({ route: 'risk', result, playerLevel: 2, region: 'lantern-deep', seed: 3 });
        const vm = selectHazardPuzzleOutcomeVM(result, outcome, true);
        expect(vm.headline).toBe('TIME RAN OUT');
        expect(vm.reachedLabel).toBe('0% OF THE GOAL');
        expect(vm.rewards[0]).toBe('+20 XP');
        expect(vm.penalties).toEqual(['-12 VITAE', 'SCARRED: -5 MAX VITAE UNTIL YOU REST']);
    });

    it('a clear pays the purse and loses nothing', () => {
        const result = { force: 13, escape: 14, goal: [13, 14] as [number, number], p: 1, cleared: true };
        const outcome = hazardPuzzleOutcome({ route: 'risk', result, playerLevel: 2, region: 'lantern-deep', seed: 3 });
        const vm = selectHazardPuzzleOutcomeVM(result, outcome, false);
        expect(vm.headline).toBe('CLEARED');
        expect(vm.rewards).toContain('+32 SHILLINGS');
        expect(vm.penalties).toEqual(['Nothing lost.']);
    });
});
