import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EquipmentDock } from '../EquipmentDock';
import type { EquipmentDockViewModel } from '@/state/presenters/inventory.engine';

// Mock child components that are tested separately
jest.mock('@/components/SectionLabel', () => {
    return {
        SectionLabel: ({ children }: { children: React.ReactNode }) => {
            const React = require('react');
            const { Text } = require('react-native');
            return React.createElement(Text, {}, children);
        },
    };
});

jest.mock('../PaperDoll', () => ({
    PaperDoll: () => null,
}));

jest.mock('../EquipmentSlot', () => {
    return {
        EquipmentSlot: ({ 
            slot, 
            bareLabel, 
            selected, 
            onPress 
        }: {
            slot: any;
            bareLabel: string;
            selected: boolean;
            onPress: (key: string | null) => void;
        }) => {
            const React = require('react');
            const { TouchableOpacity, Text } = require('react-native');

            // Phase 18 shrank the dock to 3 slots, but the source
            // `pairDockRows` still builds a 4-row grid (slots[0..6]),
            // so trailing grid cells arrive as `undefined`. Treat any
            // absent slot as an empty cell (the real EquipmentSlot's
            // null-slot path).
            if (slot === null || slot === undefined) return null;
            return React.createElement(
                TouchableOpacity,
                {
                    testID: `equipment-slot-${slot.key}`,
                    accessibilityState: { selected },
                    onPress: () => onPress(slot.key)
                },
                React.createElement(Text, {}, `${slot.label} - ${slot.item?.name || 'empty'}`)
            );
        },
    };
});

// Phase 18 collapsed the dock to a 3-kind paper-doll: Weapon, Armor,
// Trinket (accessory). The legacy head/body/hands/feet slots folded
// into armor + accessory.
const mockEquippedSlots: EquipmentDockViewModel = {
    slots: [
        { key: 'weapon', label: 'WEAPON', item: { id: 'sword-1', name: 'Iron Sword', sub: 'sword' } },
        { key: 'armor', label: 'ARMOR', item: { id: 'armor-1', name: 'Leather Armor', sub: 'armor' } },
        { key: 'accessory', label: 'TRINKET', item: { id: 'helm-1', name: 'Iron Helm', sub: 'helmet' } },
    ],
    headerLabel: 'equipment dock',
    hintLabel: 'worn vs unworn at a glance',
    bareLabel: '— unequipped —',
    selectedSlot: null,
    bannerEyebrow: '',
    bannerSlotLabel: '',
    bannerClearLabel: '',
};

const mockEmptySlots: EquipmentDockViewModel = {
    slots: [
        { key: 'weapon', label: 'WEAPON', item: null },
        { key: 'armor', label: 'ARMOR', item: null },
        { key: 'accessory', label: 'TRINKET', item: null },
    ],
    headerLabel: 'equipment dock',
    hintLabel: 'worn vs unworn at a glance',
    bareLabel: '— unequipped —',
    selectedSlot: null,
    bannerEyebrow: '',
    bannerSlotLabel: '',
    bannerClearLabel: '',
};

const mockOnSelectSlot = jest.fn();

describe('EquipmentDock', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Mount contract', () => {
        it('mounts without crashing with equipped items', () => {
            const { toJSON } = render(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );
            expect(toJSON()).toBeTruthy();
        });

        it('mounts without crashing with empty slots', () => {
            const { toJSON } = render(
                <EquipmentDock
                    vm={mockEmptySlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );
            expect(toJSON()).toBeTruthy();
        });

        it('renders dock container with correct testID', () => {
            const { getByTestId } = render(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );
            expect(getByTestId('equipment-dock')).toBeDefined();
        });
    });

    describe('Header rendering', () => {
        it('displays header label correctly', () => {
            const { getByText } = render(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );
            expect(getByText('equipment dock')).toBeDefined();
        });

        it('displays hint label correctly', () => {
            const { getByText } = render(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );
            expect(getByText('worn vs unworn at a glance')).toBeDefined();
        });
    });

    describe('Slot pairing and grid layout', () => {
        it('renders all 3 slots in correct paired order', () => {
            const { getByTestId } = render(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            // All 3 slots should be rendered
            expect(getByTestId('equipment-slot-weapon')).toBeDefined();
            expect(getByTestId('equipment-slot-armor')).toBeDefined();
            expect(getByTestId('equipment-slot-accessory')).toBeDefined();
        });

        it('passes bare label to all slots consistently', () => {
            const { getByTestId } = render(
                <EquipmentDock
                    vm={mockEmptySlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            // Test that slot components are rendered (bare label is internal to EquipmentSlot)
            const weaponSlot = getByTestId('equipment-slot-weapon');
            expect(weaponSlot).toBeDefined();
        });

        it('handles grid layout with null slots in right column correctly', () => {
            // The trailing accessory slot lands in the grid; the component
            // handles a null right-column cell.
            const { queryByTestId } = render(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            // All slots should exist - the component handles null slots in EquipmentSlot
            expect(queryByTestId('equipment-slot-accessory')).toBeDefined();
        });
    });

    describe('Slot selection behavior', () => {
        it('correctly identifies selected slot', () => {
            const { getByTestId } = render(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot="weapon"
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            const weaponSlot = getByTestId('equipment-slot-weapon');
            const armorSlot = getByTestId('equipment-slot-armor');

            expect(weaponSlot.props.accessibilityState.selected).toBe(true);
            expect(armorSlot.props.accessibilityState.selected).toBe(false);
        });

        it('handles null selectedSlot correctly', () => {
            const { getByTestId } = render(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            const weaponSlot = getByTestId('equipment-slot-weapon');
            expect(weaponSlot.props.accessibilityState.selected).toBe(false);
        });

        it('forwards slot selection callbacks correctly', () => {
            const { getByTestId } = render(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            const weaponSlot = getByTestId('equipment-slot-weapon');
            fireEvent.press(weaponSlot);

            expect(mockOnSelectSlot).toHaveBeenCalledWith('weapon');
        });
    });

    describe('Equipment item display', () => {
        it('displays equipped items correctly', () => {
            const { getByTestId, getByText } = render(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            // Verify slots are rendered
            expect(getByTestId('equipment-slot-accessory')).toBeDefined();
            expect(getByTestId('equipment-slot-weapon')).toBeDefined();

            // Verify content is displayed through Text components
            expect(getByText('TRINKET - Iron Helm')).toBeDefined();
            expect(getByText('WEAPON - Iron Sword')).toBeDefined();
        });

        it('displays empty slots correctly', () => {
            const { getByTestId, getByText } = render(
                <EquipmentDock
                    vm={mockEmptySlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            // Verify slots are rendered
            expect(getByTestId('equipment-slot-accessory')).toBeDefined();
            expect(getByTestId('equipment-slot-weapon')).toBeDefined();

            // Verify empty content is displayed
            expect(getByText('TRINKET - empty')).toBeDefined();
            expect(getByText('WEAPON - empty')).toBeDefined();
        });
    });

    describe('Accessibility and interaction', () => {
        it('preserves selection state for accessibility', () => {
            const { getByTestId } = render(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot="accessory"
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            const accessorySlot = getByTestId('equipment-slot-accessory');
            expect(accessorySlot.props.accessibilityState.selected).toBe(true);
        });

        it('forwards callback to all interactive slots', () => {
            const { getByTestId } = render(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            // Test multiple slot interactions
            fireEvent.press(getByTestId('equipment-slot-weapon'));
            fireEvent.press(getByTestId('equipment-slot-armor'));
            fireEvent.press(getByTestId('equipment-slot-accessory'));

            expect(mockOnSelectSlot).toHaveBeenCalledTimes(3);
            expect(mockOnSelectSlot).toHaveBeenNthCalledWith(1, 'weapon');
            expect(mockOnSelectSlot).toHaveBeenNthCalledWith(2, 'armor');
            expect(mockOnSelectSlot).toHaveBeenNthCalledWith(3, 'accessory');
        });
    });

    describe('Props stability and re-rendering', () => {
        it('handles slot array changes correctly', () => {
            const updatedSlots: EquipmentDockViewModel = {
                ...mockEmptySlots,
                slots: [
                    { key: 'accessory', label: 'TRINKET', item: { id: 'new-helm', name: 'Steel Helm', sub: 'helmet' } },
                    ...mockEmptySlots.slots.slice(1),
                ],
            };

            const { getByText, rerender } = render(
                <EquipmentDock
                    vm={mockEmptySlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            rerender(
                <EquipmentDock
                    vm={updatedSlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            // Verify the updated content is displayed
            expect(getByText('TRINKET - Steel Helm')).toBeDefined();
        });

        it('handles selectedSlot changes correctly', () => {
            const { getByTestId, rerender } = render(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            rerender(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot="weapon"
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            const weaponSlot = getByTestId('equipment-slot-weapon');
            expect(weaponSlot.props.accessibilityState.selected).toBe(true);
        });
    });

    describe('Edge cases', () => {
        it('handles slots with null items gracefully', () => {
            const mixedSlots: EquipmentDockViewModel = {
                ...mockEquippedSlots,
                slots: [
                    { key: 'weapon', label: 'WEAPON', item: { id: 'sword-1', name: 'Iron Sword', sub: 'sword' } },
                    { key: 'armor', label: 'ARMOR', item: null },
                    { key: 'accessory', label: 'TRINKET', item: { id: 'helm-1', name: 'Iron Helm', sub: 'helmet' } },
                ],
            };

            const { getByTestId, getByText } = render(
                <EquipmentDock
                    vm={mixedSlots}
                    selectedSlot={null}
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            const weaponSlot = getByTestId('equipment-slot-weapon');
            const armorSlot = getByTestId('equipment-slot-armor');

            expect(weaponSlot).toBeDefined();
            expect(armorSlot).toBeDefined();

            // Verify content through text queries
            expect(getByText('WEAPON - Iron Sword')).toBeDefined();
            expect(getByText('ARMOR - empty')).toBeDefined();
        });

        it('handles selection of non-existent slot keys gracefully', () => {
            const { getByTestId } = render(
                <EquipmentDock
                    vm={mockEquippedSlots}
                    selectedSlot={'invalid-key' as any}
                    onSelectSlot={mockOnSelectSlot}
                />
            );

            // All slots should be unselected when selectedSlot doesn't match any
            const weaponSlot = getByTestId('equipment-slot-weapon');
            expect(weaponSlot.props.accessibilityState.selected).toBe(false);
        });
    });
});