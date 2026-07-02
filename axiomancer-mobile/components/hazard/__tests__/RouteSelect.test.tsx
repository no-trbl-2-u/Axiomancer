import React from 'react';
import { render } from '@testing-library/react-native';

import { RouteSelect } from '../RouteSelect';
import type { HazardViewModel } from '@/state/presenters/hazard.engine';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => {};
    return Reanimated;
});

const mockViewModel: HazardViewModel = {
    active: true,
    phase: 'playing',
    title: 'Forest Ambush',
    scenario: 'Bandits block your path',
    intro: 'They were waiting. They were always waiting. Unless…',
    hazardId: 'bandit-hunt',
    sessionSeed: 7,
    boardHeadline: 'Round 1',
    boardNote: 'Cast your dice',
    roundLabel: 'Round 1',
    roundRoman: 'I',
    totalRounds: 3,
    marks: [],
    routeKey: 'risk',
    routeLabel: 'Risky Route',
    routeChoices: [],
    hand: [
        {
            uid: 'hand-1',
            cardId: 'strike',
            name: 'Strike',
            kind: 'red',
            rarity: 'common',
            dead: false,
            utility: false,
            free: { force: 2, escape: 0 },
            powered: { force: 4, escape: 0 },
            freeEffectLabel: '',
            poweredEffectLabel: '',
            flavor: 'Basic attack',
            keywords: [],
            dieAvailable: true,
            poweredByDieId: null,
            applied: false,
            salvageLabel: null, powerColors: ['red'], choose: false, chosenKey: null, vowBonus: null,
        },
        {
            uid: 'hand-2',
            cardId: 'dodge',
            name: 'Dodge',
            kind: 'blue',
            rarity: 'common',
            dead: false,
            utility: false,
            free: { force: 0, escape: 3 },
            powered: { force: 0, escape: 5 },
            freeEffectLabel: '',
            poweredEffectLabel: '',
            flavor: 'Basic evasion',
            keywords: [],
            dieAvailable: true,
            poweredByDieId: null,
            applied: false,
            salvageLabel: null, powerColors: ['red'], choose: false, chosenKey: null, vowBonus: null,
        },
    ],
    play: [],
    deckCount: 10,
    discardCount: 0,
    thresholdLadder: [],
    resolveEnabled: false,
    resolveLabel: '',
    resolveSubLabel: '',
    resolveFlash: null,
    outcome: null,
    dice: [],
    diceReady: 0,
    hexCount: 0,
    bothRequired: false,
    meters: [],
    meterDetail: null,
    momentumNote: null,
    enchantments: [],
    subquests: [],
    goldVowNote: null,
    rewards: null,
    foretellPending: null,
};

describe('RouteSelect', () => {
    const mockProps = {
        vm: mockViewModel,
        onPick: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders route selection screen', () => {
        const { getByText } = render(<RouteSelect {...mockProps} />);
        expect(getByText('Forest Ambush')).toBeTruthy();
    });

    it('renders hand cards preview', () => {
        const { getByText } = render(<RouteSelect {...mockProps} />);
        expect(getByText('Strike')).toBeTruthy();
        expect(getByText('Dodge')).toBeTruthy();
    });

    it('renders scenario text', () => {
        const { getByText } = render(<RouteSelect {...mockProps} />);
        expect(getByText('Bandits block your path')).toBeTruthy();
    });

    it('handles empty hand gracefully', () => {
        const vmEmptyHand = { ...mockViewModel, hand: [] };
        const { getByText } = render(<RouteSelect {...mockProps} vm={vmEmptyHand} />);
        expect(getByText('Forest Ambush')).toBeTruthy();
    });

    it('renders without error', () => {
        const { root } = render(<RouteSelect {...mockProps} />);
        expect(root).toBeTruthy();
    });
});