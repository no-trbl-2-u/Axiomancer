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
} from '@mechanics';

jest.mock('@/lib/platform/router', () => ({
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

// Phase 80a — the inventory item modal renders an equip-swap's changed
// stats as before → after rows. (Those rows used to be TooltipTarget-wrapped
// with an `inv-modal-stat-<key>` testID for the derived stats; the derived
// stats and their tooltips were deleted in TRIM THE FAT T2a, and the only
// diffable stat left, max health, carries no tooltip.) This pins that the
// equip modal still renders its stat row without throwing.
describe('inventory screen: item-modal stat rows (Phase 80a)', () => {
    it('renders the changed stat row for an equipment modal', () => {
        // `sword` is worn (first-in-slot, no stat mods). A stat-bearing
        // peer previews an equip-swap, so the stat it changes shows up
        // as a row. The modal shows *only* changed stats.
        const statSword: Equipment = {
            id: 'rune-blade',
            name: 'Rune Blade',
            description: 'Etched with a humming sigil.',
            category: 'equipment',
            slot: 'weapon',
            statModifiers: [{ stat: 'maxHp', value: 5 }],
        };
        const store = makeStore([sword, statSword]);

        const tree = render(withProviders(store));

        // Press the (non-worn) peer row to open its equip modal.
        fireEvent.press(tree.getByTestId('item-rune-blade'));

        // The changed stat renders as a labelled before → after row.
        const maxHealth = store.getState().player.maxHealth;
        expect(tree.getByText('MAX HP')).toBeTruthy();
        expect(tree.getByText(`${maxHealth} → ${maxHealth + 5} (+5)`)).toBeTruthy();
    });
});
