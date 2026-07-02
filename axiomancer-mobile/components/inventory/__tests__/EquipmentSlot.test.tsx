import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EquipmentSlot } from '../EquipmentSlot';

const mockSlot = {
    key: 'head' as const,
    label: 'Head',
    item: {
        id: 'item-1',
        name: 'Iron Helm',
        sub: 'helmet' as const,
    },
};

const mockEmptySlot = {
    key: 'weapon' as const,
    label: 'Weapon',
    item: null,
};

const mockOnPress = jest.fn();

describe('EquipmentSlot', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders filled slot correctly', () => {
        const { getByText, getByTestId } = render(
            <EquipmentSlot
                slot={mockSlot}
                bareLabel="empty"
                selected={false}
                onPress={mockOnPress}
            />
        );

        expect(getByText('Head')).toBeDefined();
        expect(getByText('Iron Helm')).toBeDefined();
        expect(getByTestId('dock-slot-head')).toBeDefined();
    });

    it('renders empty slot correctly', () => {
        const { getByText, getByTestId } = render(
            <EquipmentSlot
                slot={mockEmptySlot}
                bareLabel="empty"
                selected={false}
                onPress={mockOnPress}
            />
        );

        expect(getByText('Weapon')).toBeDefined();
        expect(getByText('empty')).toBeDefined();
        expect(getByText('∅')).toBeDefined();
        expect(getByTestId('dock-slot-weapon')).toBeDefined();
    });

    it('renders empty view for null slot', () => {
        const { toJSON } = render(
            <EquipmentSlot
                slot={null}
                bareLabel="empty"
                selected={false}
                onPress={mockOnPress}
            />
        );

        expect(toJSON()).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
        const { getByTestId } = render(
            <EquipmentSlot
                slot={mockSlot}
                bareLabel="empty"
                selected={false}
                onPress={mockOnPress}
            />
        );

        fireEvent.press(getByTestId('dock-slot-head'));
        expect(mockOnPress).toHaveBeenCalledWith('head');
    });

    it('shows selected state correctly', () => {
        const { getByTestId } = render(
            <EquipmentSlot
                slot={mockSlot}
                bareLabel="empty"
                selected={true}
                onPress={mockOnPress}
            />
        );

        const button = getByTestId('dock-slot-head');
        expect(button.props.accessibilityState).toEqual({ selected: true });
    });
});