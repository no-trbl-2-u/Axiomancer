import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OptionRow } from '../OptionRow';

const mockOption = {
    nodeId: 'node-1',
    label: 'Test Location',
    description: 'A mysterious place',
    leagues: 'III' as const,
    type: 'treasure' as const,
};

const mockOnPress = jest.fn();

describe('OptionRow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        const { getByText, getByTestId } = render(
            <OptionRow
                option={mockOption}
                onPress={mockOnPress}
                leaguesLabel="LEAGUES"
            />
        );

        expect(getByText('Test Location')).toBeDefined();
        expect(getByText('A MYSTERIOUS PLACE')).toBeDefined();
        expect(getByText('III')).toBeDefined();
        expect(getByText('LEAGUES')).toBeDefined();
        expect(getByTestId('option-node-1')).toBeDefined();
    });

    it('calls onPress when pressed', () => {
        const { getByTestId } = render(
            <OptionRow
                option={mockOption}
                onPress={mockOnPress}
                leaguesLabel="LEAGUES"
            />
        );

        fireEvent.press(getByTestId('option-node-1'));
        expect(mockOnPress).toHaveBeenCalledWith(mockOption);
    });

    it('has correct accessibility properties', () => {
        const { getByTestId } = render(
            <OptionRow
                option={mockOption}
                onPress={mockOnPress}
                leaguesLabel="LEAGUES"
            />
        );

        const button = getByTestId('option-node-1');
        expect(button.props.accessibilityRole).toBe('button');
        expect(button.props.accessibilityLabel).toBe('Travel to Test Location, III leagues away');
    });
});