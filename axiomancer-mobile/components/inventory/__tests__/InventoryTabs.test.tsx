/**
 * Hermetic component tests — InventoryTabs.
 *
 * Pins the render contract for the inventory category tab row:
 * tab rendering, active-state accessibility, count-badge
 * visibility, dimmed (disabled) state, and press delegation.
 *
 * The component is pure presentation over the presenter's
 * InventoryTabRow[] — no store reads, no engine calls. Props drive
 * every rendering branch.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

import { InventoryTabs } from '@/components/inventory/InventoryTabs';
import { withAllProviders } from '@/test-utils/withAllProviders';
import type { InventoryTabRow } from '@/state/presenters/inventory.engine';

const mockTabs: readonly InventoryTabRow[] = [
    { key: 'all', label: 'All', count: 5 },
    { key: 'equipment', label: 'Equipment', count: 2 },
    { key: 'consumable', label: 'Consumable', count: 0 },
];

describe('InventoryTabs', () => {
    it('renders one button per tab row', () => {
        const { tree } = withAllProviders(
            <InventoryTabs tabs={mockTabs} activeTab="all" onTabPress={jest.fn()} />
        );
        const rendered = render(tree);

        expect(rendered.getByTestId('tab-all')).toBeTruthy();
        expect(rendered.getByTestId('tab-equipment')).toBeTruthy();
        expect(rendered.getByTestId('tab-consumable')).toBeTruthy();
    });

    it('renders each tab label', () => {
        const { tree } = withAllProviders(
            <InventoryTabs tabs={mockTabs} activeTab="all" onTabPress={jest.fn()} />
        );
        const rendered = render(tree);

        expect(rendered.getByText('All')).toBeTruthy();
        expect(rendered.getByText('Equipment')).toBeTruthy();
        expect(rendered.getByText('Consumable')).toBeTruthy();
    });

    it('calls onTabPress with the tab key when a tab is pressed', () => {
        const onTabPress = jest.fn();
        const { tree } = withAllProviders(
            <InventoryTabs tabs={mockTabs} activeTab="all" onTabPress={onTabPress} />
        );
        const rendered = render(tree);

        fireEvent.press(rendered.getByTestId('tab-equipment'));

        expect(onTabPress).toHaveBeenCalledTimes(1);
        expect(onTabPress).toHaveBeenCalledWith('equipment');
    });

    it('marks the active tab as selected for accessibility', () => {
        const { tree } = withAllProviders(
            <InventoryTabs tabs={mockTabs} activeTab="equipment" onTabPress={jest.fn()} />
        );
        const rendered = render(tree);

        expect(rendered.getByTestId('tab-equipment').props.accessibilityState).toEqual({
            selected: true,
        });
        expect(rendered.getByTestId('tab-all').props.accessibilityState).toEqual({
            selected: false,
        });
    });

    it('exposes count in the accessibility label using pluralized item wording', () => {
        const singleTabs: readonly InventoryTabRow[] = [
            { key: 'all', label: 'All', count: 1 },
            { key: 'equipment', label: 'Equipment', count: 2 },
        ];

        const { tree } = withAllProviders(
            <InventoryTabs tabs={singleTabs} activeTab="all" onTabPress={jest.fn()} />
        );
        const rendered = render(tree);

        expect(rendered.getByTestId('tab-all').props.accessibilityLabel).toBe('All, 1 item');
        expect(rendered.getByTestId('tab-equipment').props.accessibilityLabel).toBe(
            'Equipment, 2 items'
        );
    });

    it('omits the count from the accessibility label when count is zero', () => {
        const { tree } = withAllProviders(
            <InventoryTabs tabs={mockTabs} activeTab="all" onTabPress={jest.fn()} />
        );
        const rendered = render(tree);

        expect(rendered.getByTestId('tab-consumable').props.accessibilityLabel).toBe(
            'Consumable'
        );
    });

    it('renders a count badge only for tabs with a positive count', () => {
        const { tree } = withAllProviders(
            <InventoryTabs tabs={mockTabs} activeTab="all" onTabPress={jest.fn()} />
        );
        const rendered = render(tree);

        expect(rendered.getByText('5')).toBeTruthy();
        expect(rendered.getByText('2')).toBeTruthy();
        expect(rendered.queryAllByText('0')).toHaveLength(0);
    });

    it('still renders the tabs when dimmed', () => {
        const { tree } = withAllProviders(
            <InventoryTabs tabs={mockTabs} activeTab="all" onTabPress={jest.fn()} dimmed />
        );
        const rendered = render(tree);

        expect(rendered.getByTestId('tab-all')).toBeTruthy();
        expect(rendered.getByTestId('tab-equipment')).toBeTruthy();
    });

    it('blocks press interaction when dimmed via pointerEvents none', () => {
        const onTabPress = jest.fn();
        const { tree } = withAllProviders(
            <InventoryTabs tabs={mockTabs} activeTab="all" onTabPress={onTabPress} dimmed />
        );
        const rendered = render(tree);

        fireEvent.press(rendered.getByTestId('tab-equipment'));

        expect(onTabPress).not.toHaveBeenCalled();
    });

    it('renders without breaking for an empty tab list', () => {
        const { tree } = withAllProviders(
            <InventoryTabs tabs={[]} activeTab="all" onTabPress={jest.fn()} />
        );
        const rendered = render(tree);

        expect(rendered.queryByTestId('tab-all')).toBeNull();
    });
});
