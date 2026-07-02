/**
 * Hermetic component tests — DebugMapResetButton (Phase 58).
 *
 * Pins the DEV gate + the action-routing contract: tapping
 * fires `actions.changeMap(currentMapName)` which re-seeds the
 * current map via the engine's
 * `createMapState(getMapDefinition(continent, name))` (Phase
 * 60a migration from the deprecated `getCoastalMap`).
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugMapResetButton } from '@/components/DebugMapResetButton';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore) {
    return (
        <GameStoreProvider store={store}>
            <DebugMapResetButton />
        </GameStoreProvider>
    );
}

describe('DebugMapResetButton: DEV gate', () => {
    it('renders the button when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProvider(store));
        expect(tree.queryByTestId('debug-map-reset-button')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
         
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store));
            expect(tree.queryByTestId('debug-map-reset-button')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugMapResetButton: press routing', () => {
    it('a tap resets currentMap.currentNode to the engine\'s startingNode for the same map', () => {
        const store = makeStore();
         
        const beforeWorld = (store.getState() as any).world;
        const mapName = beforeWorld.currentMap.name;
        const startingNodeId = beforeWorld.currentMap.currentNode;

        // Move the player off the starting node + dirty up discovered /
        // consumed so the reset is observable.
         
        store.setState({
            world: {
                ...beforeWorld,
                currentMap: {
                    ...beforeWorld.currentMap,
                    currentNode: 'fv-3',
                    discoveredNodes: ['fv-1', 'fv-2', 'fv-3'],
                    consumedNodes: ['fv-2'],
                },
            },
             
        } as any);

        const tree = render(withProvider(store));
        fireEvent.press(tree.getByTestId('debug-map-reset-button'));

         
        const afterWorld = (store.getState() as any).world;
        expect(afterWorld.currentMap.name).toBe(mapName);
        expect(afterWorld.currentMap.currentNode).toBe(startingNodeId);
        // discoveredNodes contains only the starting node post-reset
        // (engine's fresh-map seeds the current position as discovered).
        expect(afterWorld.currentMap.discoveredNodes ?? []).toEqual([startingNodeId]);
        expect(afterWorld.currentMap.consumedNodes ?? []).toHaveLength(0);
    });
});

describe('DebugMapResetButton: accessibility', () => {
    it('exposes accessibilityRole=button and a descriptive label', () => {
        const store = makeStore();
        const tree = render(withProvider(store));
        const btn = tree.getByTestId('debug-map-reset-button');
        expect(btn.props.accessibilityRole).toBe('button');
        expect(btn.props.accessibilityLabel).toMatch(/map/i);
    });
});
