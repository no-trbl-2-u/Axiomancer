/**
 * Hermetic component render test — inventory screen.
 *
 * Pins that the screen renders without throwing for both empty and
 * populated inventories, and that the modal confirmation routes
 * through the action layer (Spec 06 Q2 / Q5).
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import {
    createCharacter,
    type Consumable,
    type Equipment,
    type Item,
} from 'axiomancer-mechanics';

jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
        push: jest.fn(),
        back: jest.fn(),
    }),
}));

import { CombatModeProvider } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

import InventoryScreen from '@/app/(tabs)/inventory';

afterEach(() => {
    jest.restoreAllMocks();
});

function withProviders(store: AppStore) {
    return (
        <CombatModeProvider>
            <GameStoreProvider store={store}>
                <InventoryScreen />
            </GameStoreProvider>
        </CombatModeProvider>
    );
}

function makeStore(inventory: readonly (Consumable | Equipment)[] = []): AppStore {
    const base = createCharacter({
        name: 'Pilgrim',
        level: 1,
        baseStats: { heart: 4, body: 4, mind: 4 },
    });
    const player = { ...base, health: 5, inventory: [...inventory] };
    return createAppStore({ adapter: createMemoryAdapter(), overrides: { player } });
}

const potion: Consumable = {
    id: 'phial',
    name: 'Potion of Heart',
    description: 'A small phial of ruby liquor.',
    category: 'consumable',
    healAmount: 6,
    quantity: 1,
};

const sword: Equipment = {
    id: 'long-blade',
    name: 'Long Blade',
    description: 'Iron, notched.',
    category: 'equipment',
    slot: 'weapon',
    rarity: 'common',
    requiredLevel: 1,
};

describe('inventory screen: rendering', () => {
    it('renders the empty-state placeholder when the player carries nothing', () => {
        const store = makeStore([]);

        const tree = render(withProviders(store));

        expect(tree.getByTestId('inventory-empty')).toBeTruthy();
    });

    it('renders item cards for a populated inventory', () => {
        const store = makeStore([sword, potion]);

        const tree = render(withProviders(store));

        expect(tree.getByTestId('item-long-blade')).toBeTruthy();
        expect(tree.getByTestId('item-phial')).toBeTruthy();
    });
});

describe('inventory screen: use modal', () => {
    it('opens the modal and applies the heal on confirm', () => {
        const store = makeStore([potion]);

        const tree = render(withProviders(store));

        fireEvent.press(tree.getByTestId('item-phial'));
        fireEvent.press(tree.getByTestId('use-phial'));
        fireEvent.press(tree.getByTestId('modal-confirm'));

        // Potion consumed → no row, and HP increased.
        const after = store.getState().player;
        const inv = after.inventory as readonly Item[];
        expect(inv.find((i: Item) => i.id === 'phial')).toBeUndefined();
        expect(after.health).toBeGreaterThan(5);
    });
});

// Phase 80a — Tooltip overlay portal. The inventory item modal
// renders inside RN <Modal>, which mounts outside the React tree
// — so the root TooltipProvider's overlay can't paint above the
// modal chrome. The fix wraps the modal contents in a sibling
// <TooltipProvider> and adds <TooltipTarget kind="item-stat"
// id=<engine-stat-key>> around each delta row. These tests pin
// the wiring contract: the rows render with their testIDs, and
// the modal renders without throwing.
describe('inventory screen: item-modal stat tooltips (Phase 80a)', () => {
    it('renders TooltipTarget-wrapped stat rows for an equipment modal', () => {
        // `sword` is worn (first-in-slot, no stat mods). A stat-bearing
        // peer previews an equip-swap, so every stat it changes shows up
        // as a TooltipTarget-wrapped row. The modal shows *only* changed
        // stats, so the peer must move all four pinned keys.
        const statSword: Equipment = {
            id: 'rune-blade',
            name: 'Rune Blade',
            description: 'Etched with a humming sigil.',
            category: 'equipment',
            slot: 'weapon',
            rarity: 'uncommon',
            requiredLevel: 1,
            statModifiers: [
                { stat: 'physicalAttack', value: 5, isMultiplier: false },
                { stat: 'physicalDefense', value: 3, isMultiplier: false },
                { stat: 'mentalAttack', value: 2, isMultiplier: false },
                { stat: 'emotionalDefense', value: 4, isMultiplier: false },
            ],
        };
        const store = makeStore([sword, statSword]);

        const tree = render(withProviders(store));

        // Press the (non-worn) peer row to open its equip modal.
        fireEvent.press(tree.getByTestId('item-rune-blade'));

        // Each changed stat row carries a testID `inv-modal-stat-<key>`
        // driven by `StatDelta.id`.
        expect(tree.getByTestId('inv-modal-stat-physicalAttack')).toBeTruthy();
        expect(tree.getByTestId('inv-modal-stat-physicalDefense')).toBeTruthy();
        expect(tree.getByTestId('inv-modal-stat-mentalAttack')).toBeTruthy();
        expect(tree.getByTestId('inv-modal-stat-emotionalDefense')).toBeTruthy();
    });
});
