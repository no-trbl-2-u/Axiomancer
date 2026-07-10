/**
 * Hermetic component tests — DebugPopulateAllItems.
 *
 * Sibling to `DebugSeedButton.test.tsx`. Pins the DEV-mount gate,
 * the action-routing contract (taps actually push items into the
 * engine inventory), and the "every engine registry" intent —
 * after one tap the inventory holds at least one equipment, one
 * unique, and one consumable.
 *
 * The action mutation is also covered structurally by
 * `state/e2e/debug-seed.engine.test.ts` patterns; this test
 * focuses on the component contract.
 */

import { describe, expect, it } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import {
    consumableLibrary,
    isConsumable,
    isEquipment,
    relicLibrary,
} from '@mechanics';
import React from 'react';

import { DebugPopulateAllItems } from '@/components/DebugPopulateAllItems';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

describe('DebugPopulateAllItems: DEV gate', () => {
    it('renders the button when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugPopulateAllItems />));
        expect(tree.queryByTestId('debug-populate-all-items')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        const g = global as { __DEV__?: boolean };
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugPopulateAllItems />));
            expect(tree.queryByTestId('debug-populate-all-items')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugPopulateAllItems: press routing', () => {
    it('a tap pushes one of every engine-registry item into the inventory', () => {
        const store = makeStore();
        const inventoryBefore = (store.getState().player.inventory ?? []).length;

        const tree = render(withProvider(store, <DebugPopulateAllItems />));
        fireEvent.press(tree.getByTestId('debug-populate-all-items'));

        const inventoryAfter = store.getState().player.inventory ?? [];
        // Phase 21 — "every item" is the 8 signet relics + every consumable.
        const expected = relicLibrary.length + consumableLibrary.length;
        expect(inventoryAfter.length - inventoryBefore).toBe(expected);

        // Inventory contains at least one of each surviving category.
        expect(inventoryAfter.some(isEquipment)).toBe(true);
        expect(inventoryAfter.some(isConsumable)).toBe(true);
        // Every equipment item is a signet relic (no more uniques/procedural gear).
        const equipmentItems = inventoryAfter.filter(isEquipment);
        expect(equipmentItems.every(e => e.id.startsWith('relic-'))).toBe(true);
    });

    it('updates the visible result line with a populated · breakdown summary', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugPopulateAllItems />));

        fireEvent.press(tree.getByTestId('debug-populate-all-items'));

        const text = JSON.stringify(tree.toJSON());
        expect(text).toMatch(/populated · \d+ total · \d+ relics \/ \d+ cons/);
    });

    it('static copy is honest: the signet relics + consumables (no procedural gear)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugPopulateAllItems />));
        const sub = tree.getByTestId('debug-populate-sub').props.children as string;
        expect(sub).not.toMatch(/every item in the game/i);
        expect(sub).toMatch(/relic/i);
        expect(sub).toMatch(/consumable/i);
    });

    it('a second tap is non-destructive — never throws', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugPopulateAllItems />));
        fireEvent.press(tree.getByTestId('debug-populate-all-items'));
        expect(() =>
            fireEvent.press(tree.getByTestId('debug-populate-all-items')),
        ).not.toThrow();
    });
});

describe('DebugPopulateAllItems: accessibility', () => {
    it('exposes accessibilityRole=button and a descriptive label', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugPopulateAllItems />));
        const btn = tree.getByTestId('debug-populate-all-items');
        expect(btn.props.accessibilityRole).toBe('button');
        expect(btn.props.accessibilityLabel).toMatch(/populate/i);
    });
});
