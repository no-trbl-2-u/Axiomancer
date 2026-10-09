import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { ROUTE_COLUMN_MAX_WIDTH, RouteSelect, routeFanOverlap } from '../RouteSelect';
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
            salvageLabel: null,
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
            salvageLabel: null,
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
    rewards: null,
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

    it('tapping a hand card calls onInspect with that card', () => {
        const onInspect = jest.fn();
        const { getByLabelText } = render(<RouteSelect {...mockProps} onInspect={onInspect} />);
        fireEvent.press(getByLabelText(/Strike, red card in hand/));
        expect(onInspect).toHaveBeenCalledWith(mockViewModel.hand[0]);
    });

    it('tapping a hand card without an onInspect handler does not throw', () => {
        const { getByLabelText } = render(<RouteSelect {...mockProps} />);
        expect(() => fireEvent.press(getByLabelText(/Strike, red card in hand/))).not.toThrow();
    });

    it('the top strip keeps its three segments apart and lets the middle one ellipsize', () => {
        const { getByText } = render(<RouteSelect {...mockProps} />);
        const mid = getByText('NO RETREAT — CHOOSE TO PROCEED');
        expect(mid.props.numberOfLines).toBe(1);
        expect(mid).toHaveStyle({ flexShrink: 1 });
        expect(mid.parent?.parent).toHaveStyle({ gap: 10 });
    });

    it('on a phone a card the next one overlaps wraps its name clear of the covered edge', () => {
        const phone = { width: 375, height: 812, scale: 2, fontScale: 1 };
        const spy = jest.spyOn(Dimensions, 'get').mockReturnValue(phone);
        const hand = [0, 1, 2, 3, 4].map((i) => ({ ...mockViewModel.hand[i % 2], uid: `h-${i}`, name: `Card ${i}` }));
        const { getByText } = render(<RouteSelect {...mockProps} vm={{ ...mockViewModel, hand }} />);
        expect(getByText('Card 0')).toHaveStyle({ paddingRight: 22 });
        expect(getByText('Card 3')).toHaveStyle({ paddingRight: 22 });
        expect(getByText('Card 4')).toHaveStyle({ paddingRight: 9 });
        spy.mockRestore();
    });

    // Critique pass 73: at 1280 the route cards ran edge to edge, a threshold
    // ~1170px from its label. The rest, village and menu screens hold the same cap.
    it('holds the header, hand and routes in one centred column, full width below the cap', () => {
        const { getByTestId } = render(<RouteSelect {...mockProps} />);
        const column = getByTestId('hazard-route-column');
        const style = StyleSheet.flatten(column.props.style);
        expect(style.maxWidth).toBe(ROUTE_COLUMN_MAX_WIDTH);
        expect(ROUTE_COLUMN_MAX_WIDTH).toBeGreaterThanOrEqual(480);
        expect(ROUTE_COLUMN_MAX_WIDTH).toBeLessThanOrEqual(560);
        expect(style.alignSelf).toBe('center');
        expect(style.width).toBe('100%');
        expect(column).toContainElement(getByTestId('hazard-opening-hand'));
    });
});

describe('routeFanOverlap', () => {
    it('opens the fan with a small gap when the row has room', () => {
        expect(routeFanOverlap(5, 1256)).toBe(-6);
    });

    it('overlaps just enough to fit, capped at 22 so the visible strip stays wide', () => {
        expect(routeFanOverlap(5, 430)).toBe(5);
        expect(routeFanOverlap(5, 351)).toBe(22);
    });

    it('a single card needs no overlap', () => {
        expect(routeFanOverlap(1, 100)).toBe(0);
    });
});
