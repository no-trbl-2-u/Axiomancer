import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OptionsList } from '../OptionsList';
import type { ExplorationOption } from '@/state/presenters/exploration.engine';

const mockOptions: ExplorationOption[] = [
    {
        nodeId: 'node-1',
        label: 'Fishing Dock',
        description: 'A weathered pier where nets hang to dry',
        leagues: 'I' as const,
        type: 'encounter' as const,
    },
    {
        nodeId: 'node-2',
        label: 'Merchant Quarter',
        description: 'Narrow streets lined with shops and stalls',
        leagues: 'II' as const,
        type: 'treasure' as const,
    },
    {
        nodeId: 'node-3',
        label: 'Temple Ruins',
        description: 'Ancient stones overgrown with moss',
        leagues: 'III' as const,
        type: 'quest' as const,
    },
    {
        nodeId: 'node-4',
        label: 'Distant Mountain',
        description: 'A peak shrouded in mist',
        leagues: 'III' as const,
        type: 'boss' as const,
    },
];

const mockDrawerCopy = {
    title: 'AVAILABLE PATHS',
    emptyMessage: 'No paths forward yet — explore to unlock.',
    leaguesLabel: 'LEAGUES',
};

const mockOnOptionPress = jest.fn();

describe('OptionsList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with options', () => {
        const { getByText, getByTestId } = render(
            <OptionsList
                options={mockOptions}
                onOptionPress={mockOnOptionPress}
                drawerCopy={mockDrawerCopy}
            />
        );

        // Check header
        expect(getByText('AVAILABLE PATHS')).toBeDefined();
        
        // Check that OptionRow components are rendered
        expect(getByTestId('option-node-1')).toBeDefined();
        expect(getByTestId('option-node-2')).toBeDefined();
        expect(getByTestId('option-node-3')).toBeDefined();
        expect(getByTestId('option-node-4')).toBeDefined();
    });

    it('renders empty state when no options', () => {
        const { getByText, getByTestId, queryByTestId } = render(
            <OptionsList
                options={[]}
                onOptionPress={mockOnOptionPress}
                drawerCopy={mockDrawerCopy}
            />
        );

        // Check header still shows
        expect(getByText('AVAILABLE PATHS')).toBeDefined();
        
        // Check empty message
        expect(getByTestId('options-empty')).toBeDefined();
        expect(getByText('No paths forward yet — explore to unlock.')).toBeDefined();
        
        // Ensure no option rows are rendered
        expect(queryByTestId('option-node-1')).toBeNull();
    });

    it('limits to first 4 options when more than 4 provided', () => {
        const extraOptions: ExplorationOption[] = [
            ...mockOptions,
            {
                nodeId: 'node-5',
                label: 'Fifth Location',
                description: 'This should not render',
                leagues: 'I' as const,
                type: 'rest' as const,
            },
        ];

        const { getByTestId, queryByTestId } = render(
            <OptionsList
                options={extraOptions}
                onOptionPress={mockOnOptionPress}
                drawerCopy={mockDrawerCopy}
            />
        );

        // Check first 4 options are rendered
        expect(getByTestId('option-node-1')).toBeDefined();
        expect(getByTestId('option-node-2')).toBeDefined();
        expect(getByTestId('option-node-3')).toBeDefined();
        expect(getByTestId('option-node-4')).toBeDefined();
        
        // Check 5th option is not rendered
        expect(queryByTestId('option-node-5')).toBeNull();
    });

    it('forwards option press events to callback', () => {
        const { getByTestId } = render(
            <OptionsList
                options={mockOptions}
                onOptionPress={mockOnOptionPress}
                drawerCopy={mockDrawerCopy}
            />
        );

        fireEvent.press(getByTestId('option-node-1'));
        expect(mockOnOptionPress).toHaveBeenCalledWith(mockOptions[0]);

        fireEvent.press(getByTestId('option-node-2'));
        expect(mockOnOptionPress).toHaveBeenCalledWith(mockOptions[1]);
    });

    it('renders custom drawer copy correctly', () => {
        const customCopy = {
            title: 'CUSTOM TITLE',
            emptyMessage: 'Custom empty message',
            leaguesLabel: 'DISTANCE',
        };

        const { getByText, rerender } = render(
            <OptionsList
                options={[]}
                onOptionPress={mockOnOptionPress}
                drawerCopy={customCopy}
            />
        );

        expect(getByText('CUSTOM TITLE')).toBeDefined();
        expect(getByText('Custom empty message')).toBeDefined();

        // Test with options to check leagues label forwarding
        rerender(
            <OptionsList
                options={[mockOptions[0]]}
                onOptionPress={mockOnOptionPress}
                drawerCopy={customCopy}
            />
        );

        expect(getByText('DISTANCE')).toBeDefined();
    });

    it('maintains key stability for options', () => {
        const { getByTestId } = render(
            <OptionsList
                options={mockOptions}
                onOptionPress={mockOnOptionPress}
                drawerCopy={mockDrawerCopy}
            />
        );

        // Each option should have a stable testID based on nodeId
        const option1 = getByTestId('option-node-1');
        const option2 = getByTestId('option-node-2');
        
        expect(option1).toBeDefined();
        expect(option2).toBeDefined();
    });

    it('renders with single option', () => {
        const { getByText, getByTestId, queryByTestId } = render(
            <OptionsList
                options={[mockOptions[0]]}
                onOptionPress={mockOnOptionPress}
                drawerCopy={mockDrawerCopy}
            />
        );

        expect(getByText('AVAILABLE PATHS')).toBeDefined();
        expect(getByTestId('option-node-1')).toBeDefined();
        expect(queryByTestId('option-node-2')).toBeNull();
        expect(queryByTestId('options-empty')).toBeNull();
    });
});