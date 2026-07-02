/**
 * Hermetic component tests — DevAutoSeed (CRITIQUE jot 39695a5:
 * starting-character item seed).
 *
 * Pins the boot-time auto-seed contract: DEV mounts with an
 * empty inventory fire `actions.debugSeed()` exactly once;
 * already-seeded states are left alone; production never fires.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { DevAutoSeed } from '@/components/DevAutoSeed';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore) {
    return (
        <GameStoreProvider store={store}>
            <DevAutoSeed />
        </GameStoreProvider>
    );
}

describe('DevAutoSeed: DEV behaviour', () => {
    it('seeds the player inventory on first mount when inventory is empty', () => {
        const store = makeStore();
        expect(store.getState().player.inventory ?? []).toHaveLength(0);

        render(withProvider(store));

        expect((store.getState().player.inventory ?? []).length).toBeGreaterThan(0);
        // Skills + map are part of the same seed action; their presence
        // confirms `actions.debugSeed()` fired (rather than some other path
        // populating items).
        expect((store.getState().player.knownSkills ?? []).length).toBeGreaterThan(0);
    });

    it('renders nothing visible (side-effect-only component)', () => {
        const store = makeStore();
        const tree = render(withProvider(store));
        expect(tree.toJSON()).toBeNull();
    });

    it('does not re-seed when the inventory is already populated', () => {
        const store = makeStore();
        // Pre-populate the inventory with a single fixture item.
        const player = store.getState().player;
         
        store.setState({
            player: {
                ...player,
                inventory: [
                    {
                        id: 'fixture-cap',
                        name: 'Test Cap',
                        description: 'fixture',
                        category: 'equipment',
                        slot: 'head',
                        stackable: false,
                        quantity: 1,
                        rarity: 'common',
                        modifiers: [],
                        baseStatModifiers: [],
                        requiredLevel: 1,
                         
                    } as any,
                ],
            },
             
        } as any);

        const inventoryLengthBefore = (store.getState().player.inventory ?? []).length;
        render(withProvider(store));
        const inventoryLengthAfter = (store.getState().player.inventory ?? []).length;

        // No re-seed — inventory stays at the pre-mount length.
        expect(inventoryLengthAfter).toBe(inventoryLengthBefore);
    });
});

describe('DevAutoSeed: production gate', () => {
    it('does NOT seed when __DEV__ is false', () => {
         
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            render(withProvider(store));
            expect((store.getState().player.inventory ?? []).length).toBe(0);
        } finally {
            g.__DEV__ = original;
        }
    });
});
