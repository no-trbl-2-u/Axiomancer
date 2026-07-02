import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExplorationNode } from '../ExplorationNode';

const mockNode = {
    id: 'node-1',
    label: 'Test Node',
    kind: 'available' as const,
    type: 'encounter' as const,
    x: 100,
    y: 200,
    triggersCombat: true,
};

const mockOnNodePress = jest.fn();

describe('ExplorationNode', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        const { getByTestId } = render(
            <ExplorationNode
                node={mockNode}
                onNodePress={mockOnNodePress}
                isSelected={false}
            />
        );

        expect(getByTestId('node-node-1')).toBeDefined();
    });

    it('calls onNodePress when pressed', () => {
        const { getByTestId } = render(
            <ExplorationNode
                node={mockNode}
                onNodePress={mockOnNodePress}
                isSelected={false}
            />
        );

        fireEvent.press(getByTestId('node-node-1'));
        expect(mockOnNodePress).toHaveBeenCalledWith(mockNode);
    });

    it('shows the node label when selected', () => {
        const { getByText } = render(
            <ExplorationNode
                node={mockNode}
                onNodePress={mockOnNodePress}
                isSelected={true}
            />
        );

        expect(getByText('Test Node')).toBeDefined();
    });

    it('does not show the label when not selected', () => {
        const { queryByText } = render(
            <ExplorationNode
                node={mockNode}
                onNodePress={mockOnNodePress}
                isSelected={false}
            />
        );

        expect(queryByText('Test Node')).toBeNull();
    });
});