import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { HazardRemoveGrid } from '../HazardRemoveGrid';
import type { HazardDeckEntryVM } from '@/state/presenters/hazard-deck.engine';
import type { HazardCardVM } from '@/state/presenters/hazard.engine';

function cardVM(overrides: Partial<HazardCardVM> = {}): HazardCardVM {
    return {
        uid: 'uid-1',
        cardId: 'r_grip',
        name: 'Reaver Grip',
        kind: 'red',
        rarity: 'common',
        dead: false,
        utility: false,
        free: { force: 3, escape: 1 },
        powered: { force: 5, escape: 2 },
        freeEffectLabel: '',
        poweredEffectLabel: '',
        flavor: 'A grip of iron.',
        keywords: [],
        dieAvailable: true,
        poweredByDieId: null,
        applied: false,
        salvageLabel: null,
        powerColors: ['red'],
        choose: false,
        chosenKey: null,
        vowBonus: null,
        ...overrides,
    };
}

function entry(overrides: Partial<HazardDeckEntryVM> = {}): HazardDeckEntryVM {
    return {
        cardId: 'r_grip',
        card: cardVM(),
        count: 1,
        starterCount: 0,
        acquiredCount: 1,
        removable: true,
        scar: false,
        ...overrides,
    };
}

describe('HazardRemoveGrid', () => {
    const baseProps = {
        entries: [entry()],
        blocked: false,
        blockedReason: 'Card removal is not yet available.',
        onClose: jest.fn(),
        onConfirm: jest.fn(),
    };

    it('renders the heading and prompt when removable cards exist', () => {
        const { getByText } = render(<HazardRemoveGrid {...baseProps} onClose={jest.fn()} onConfirm={jest.fn()} />);
        expect(getByText('THIN THE DECK')).toBeTruthy();
        expect(getByText('Choose one acquired card to cut.')).toBeTruthy();
    });

    it('renders one tile per entry', () => {
        const { getByTestId } = render(
            <HazardRemoveGrid
                {...baseProps}
                entries={[entry(), entry({ cardId: 'b_ward', card: cardVM({ cardId: 'b_ward', name: 'Blue Ward', kind: 'blue' }) })]}
                onClose={jest.fn()}
                onConfirm={jest.fn()}
            />,
        );
        expect(getByTestId('hazard-remove-tile-r_grip')).toBeTruthy();
        expect(getByTestId('hazard-remove-tile-b_ward')).toBeTruthy();
    });

    it('fires onClose when the close button is pressed', () => {
        const onClose = jest.fn();
        const { getByTestId } = render(<HazardRemoveGrid {...baseProps} onClose={onClose} onConfirm={jest.fn()} />);
        fireEvent.press(getByTestId('hazard-remove-close'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('disables confirm and shows the prompt label until a card is selected', () => {
        const { getByTestId, getByText } = render(<HazardRemoveGrid {...baseProps} onClose={jest.fn()} onConfirm={jest.fn()} />);
        const confirm = getByTestId('hazard-remove-confirm');
        expect(confirm.props.accessibilityState).toEqual({ disabled: true });
        expect(getByText('PICK A CARD')).toBeTruthy();
    });

    it('selecting a card enables confirm and swaps the label', () => {
        const { getByTestId, getByText } = render(<HazardRemoveGrid {...baseProps} onClose={jest.fn()} onConfirm={jest.fn()} />);
        fireEvent.press(getByTestId('hazard-remove-tile-r_grip'));
        const confirm = getByTestId('hazard-remove-confirm');
        expect(confirm.props.accessibilityState).toEqual({ disabled: false });
        expect(getByText('CUT THIS CARD')).toBeTruthy();
    });

    it('marks the selected tile via accessibilityState and a CUT badge', () => {
        const { getByTestId, getByText } = render(<HazardRemoveGrid {...baseProps} onClose={jest.fn()} onConfirm={jest.fn()} />);
        const tile = getByTestId('hazard-remove-tile-r_grip');
        fireEvent.press(tile);
        expect(tile.props.accessibilityState).toEqual({ selected: true });
        expect(getByText('CUT')).toBeTruthy();
    });

    it('tapping a selected tile again deselects it', () => {
        const { getByTestId, queryByText } = render(<HazardRemoveGrid {...baseProps} onClose={jest.fn()} onConfirm={jest.fn()} />);
        const tile = getByTestId('hazard-remove-tile-r_grip');
        fireEvent.press(tile);
        fireEvent.press(tile);
        expect(tile.props.accessibilityState).toEqual({ selected: false });
        expect(queryByText('CUT')).toBeNull();
    });

    it('confirms with the selected card id when not blocked', () => {
        const onConfirm = jest.fn();
        const { getByTestId } = render(<HazardRemoveGrid {...baseProps} onClose={jest.fn()} onConfirm={onConfirm} />);
        fireEvent.press(getByTestId('hazard-remove-tile-r_grip'));
        fireEvent.press(getByTestId('hazard-remove-confirm'));
        expect(onConfirm).toHaveBeenCalledWith('r_grip');
    });

    it('does not confirm when no card is selected', () => {
        const onConfirm = jest.fn();
        const { getByTestId } = render(<HazardRemoveGrid {...baseProps} onClose={jest.fn()} onConfirm={onConfirm} />);
        fireEvent.press(getByTestId('hazard-remove-confirm'));
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('surfaces the blocked banner instead of confirming while blocked', () => {
        const onConfirm = jest.fn();
        const { getByTestId, getByText, queryByTestId } = render(
            <HazardRemoveGrid {...baseProps} blocked onConfirm={onConfirm} onClose={jest.fn()} />,
        );
        expect(queryByTestId('hazard-remove-blocked')).toBeNull();
        fireEvent.press(getByTestId('hazard-remove-tile-r_grip'));
        fireEvent.press(getByTestId('hazard-remove-confirm'));
        expect(onConfirm).not.toHaveBeenCalled();
        expect(getByTestId('hazard-remove-blocked')).toBeTruthy();
        expect(getByText('Card removal is not yet available.')).toBeTruthy();
    });

    it('dismisses the blocked banner when UNDERSTOOD is pressed', () => {
        const { getByTestId, queryByTestId } = render(
            <HazardRemoveGrid {...baseProps} blocked onConfirm={jest.fn()} onClose={jest.fn()} />,
        );
        fireEvent.press(getByTestId('hazard-remove-tile-r_grip'));
        fireEvent.press(getByTestId('hazard-remove-confirm'));
        expect(getByTestId('hazard-remove-blocked')).toBeTruthy();
        fireEvent.press(getByTestId('hazard-remove-blocked-dismiss'));
        expect(queryByTestId('hazard-remove-blocked')).toBeNull();
    });

    it('renders a copy-count pip for entries with multiple acquired copies', () => {
        const { getByText } = render(
            <HazardRemoveGrid
                {...baseProps}
                entries={[entry({ acquiredCount: 3, count: 3 })]}
                onClose={jest.fn()}
                onConfirm={jest.fn()}
            />,
        );
        expect(getByText('×3')).toBeTruthy();
    });

    it('annotates the copy count in the tile accessibility label', () => {
        const { getByLabelText } = render(
            <HazardRemoveGrid
                {...baseProps}
                entries={[entry({ acquiredCount: 2, count: 2 })]}
                onClose={jest.fn()}
                onConfirm={jest.fn()}
            />,
        );
        expect(getByLabelText('Reaver Grip, 2 copies')).toBeTruthy();
    });

    it('shows the empty state and hides the confirm footer when no cards are removable', () => {
        const { getByText, queryByTestId } = render(
            <HazardRemoveGrid {...baseProps} entries={[]} onClose={jest.fn()} onConfirm={jest.fn()} />,
        );
        expect(getByText('No acquired cards to remove yet.')).toBeTruthy();
        expect(getByText(/The starter bag is fixed/)).toBeTruthy();
        expect(queryByTestId('hazard-remove-confirm')).toBeNull();
    });
});
