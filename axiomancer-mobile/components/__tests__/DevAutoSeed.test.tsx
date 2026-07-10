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
    it('seeds the player inventory on first mount when it holds only the signet relics', () => {
        const store = makeStore();
        // A fresh game seeds the 8 signet relics (Phase 19) but no test gear /
        // consumables yet — still a fresh, un-seeded dev character.
        const nonRelic = (store.getState().player.inventory ?? []).filter((i) => !i.id.startsWith('relic-'));
        expect(nonRelic).toHaveLength(0);

        render(withProvider(store));

        // debugSeed adds non-relic items (consumables/gear) + cards + map.
        expect((store.getState().player.inventory ?? []).filter((i) => !i.id.startsWith('relic-')).length)
            .toBeGreaterThan(0);
        expect((store.getState().player.knownCards ?? []).length).toBeGreaterThan(0);
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
                        slot: 'accessory',
                        accessoryKind: 'head',
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
            // The seed never fires in production: no non-relic items are added
            // (the 8 signet relics come from the engine's fresh-game seed, not
            // DevAutoSeed), and no cards are learned.
            expect((store.getState().player.inventory ?? []).filter((i) => !i.id.startsWith('relic-')).length).toBe(0);
            expect((store.getState().player.knownCards ?? []).length).toBe(0);
        } finally {
            g.__DEV__ = original;
        }
    });
});
