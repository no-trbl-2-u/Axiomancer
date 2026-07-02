import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NodeGrid } from '../NodeGrid';

const mockNodes = [
    {
        id: 'node-1',
        label: 'First Node',
        kind: 'available' as const,
        type: 'encounter' as const,
        x: 100,
        y: 200,
        triggersCombat: true,
    },
    {
        id: 'node-2',
        label: 'Second Node',
        kind: 'available' as const,
        type: 'treasure' as const,
        x: 300,
        y: 400,
        triggersCombat: false,
    },
    {
        id: 'node-3',
        label: 'Third Node',
        kind: 'locked' as const,
        type: 'boss' as const,
        x: 500,
        y: 600,
        triggersCombat: true,
    },
];

const mockOnNodePress = jest.fn();

describe('NodeGrid', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all nodes correctly', () => {
        const { getByTestId } = render(
            <NodeGrid nodes={mockNodes} onNodePress={mockOnNodePress} selectedNodeId={null} />
        );

        expect(getByTestId('node-node-1')).toBeDefined();
        expect(getByTestId('node-node-2')).toBeDefined();
        expect(getByTestId('node-node-3')).toBeDefined();
    });

    it('renders empty grid correctly', () => {
        const { toJSON } = render(
            <NodeGrid nodes={[]} onNodePress={mockOnNodePress} selectedNodeId={null} />
        );

        expect(toJSON()).toEqual(null);
    });

    it('passes onNodePress handler to available nodes only', () => {
        const { getByTestId } = render(
            <NodeGrid nodes={mockNodes} onNodePress={mockOnNodePress} selectedNodeId={null} />
        );

        fireEvent.press(getByTestId('node-node-1'));
        expect(mockOnNodePress).toHaveBeenCalledWith(mockNodes[0]);

        fireEvent.press(getByTestId('node-node-2'));
        expect(mockOnNodePress).toHaveBeenCalledWith(mockNodes[1]);

        // Locked nodes don't trigger onPress due to accessibility disabled state
        fireEvent.press(getByTestId('node-node-3'));
        expect(mockOnNodePress).toHaveBeenCalledTimes(2); // Only 2 calls, not 3
        expect(mockOnNodePress).not.toHaveBeenCalledWith(mockNodes[2]);
    });

    it('shows a label only on the selected node', () => {
        const { getByText, queryByText } = render(
            <NodeGrid nodes={mockNodes} onNodePress={mockOnNodePress} selectedNodeId="node-1" />
        );

        // The selected node shows its label.
        expect(getByText('First Node')).toBeDefined();
        // Unselected nodes do not.
        expect(queryByText('Second Node')).toBeNull();
        expect(queryByText('Third Node')).toBeNull();
    });

    it('shows no labels when nothing is selected', () => {
        const { queryByText } = render(
            <NodeGrid nodes={mockNodes} onNodePress={mockOnNodePress} selectedNodeId={null} />
        );

        expect(queryByText('First Node')).toBeNull();
        expect(queryByText('Second Node')).toBeNull();
    });

    it('moves the label when the selection changes', () => {
        const { getByText, queryByText, rerender } = render(
            <NodeGrid nodes={mockNodes} onNodePress={mockOnNodePress} selectedNodeId="node-1" />
        );
        expect(getByText('First Node')).toBeDefined();
        expect(queryByText('Second Node')).toBeNull();

        rerender(
            <NodeGrid nodes={mockNodes} onNodePress={mockOnNodePress} selectedNodeId="node-2" />
        );
        expect(queryByText('First Node')).toBeNull();
        expect(getByText('Second Node')).toBeDefined();
    });

    it('handles a single node correctly', () => {
        const singleNode = [mockNodes[0]];
        const { getByTestId, getByText } = render(
            <NodeGrid nodes={singleNode} onNodePress={mockOnNodePress} selectedNodeId="node-1" />
        );

        expect(getByTestId('node-node-1')).toBeDefined();
        expect(getByText('First Node')).toBeDefined();

        fireEvent.press(getByTestId('node-node-1'));
        expect(mockOnNodePress).toHaveBeenCalledWith(singleNode[0]);
    });
});
