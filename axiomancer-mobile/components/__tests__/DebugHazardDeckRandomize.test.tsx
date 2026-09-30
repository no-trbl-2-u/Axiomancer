/**
 * Hermetic component tests — DebugHazardDeckRandomize.
 *
 * Pins the Kid hazard-deck playtest preset controls. These are dev-only
 * strategy fixtures: starter baseline plus six deterministic acquired-card
 * decks for early/late straightforward, enchantment, and utility play.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import { decodeAcquiredCards } from '@mechanics';
import React from 'react';

import { DebugHazardDeckRandomize } from '@/components/DebugHazardDeckRandomize';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProviders(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

afterEach(() => {
    jest.restoreAllMocks();
});

describe('DebugHazardDeckRandomize: preset controls', () => {
    it('renders baseline plus the two core-deck preset buttons', () => {
        const tree = render(withProviders(makeStore(), <DebugHazardDeckRandomize />));

        for (const id of ['starter-baseline', 'straightforward', 'utility']) {
            expect(tree.queryByTestId(`debug-hazard-deck-preset-${id}`)).not.toBeNull();
        }
    });

    it('pressing a preset applies deterministic acquired hazard cards', () => {
        const store = makeStore();
        const tree = render(withProviders(store, <DebugHazardDeckRandomize />));

        fireEvent.press(tree.getByTestId('debug-hazard-deck-preset-utility'));

        const acquired = decodeAcquiredCards(store.getState().flags);
        expect(acquired.length).toBeGreaterThan(0);
        expect(tree.getByText(/Utility: \d+ acquired cards/i)).toBeTruthy();
    });

    it('baseline preset clears acquired hazard cards', () => {
        const store = makeStore();
        store.setState({ flags: ['hazard-card:grip:1'] } as never);
        const tree = render(withProviders(store, <DebugHazardDeckRandomize />));

        fireEvent.press(tree.getByTestId('debug-hazard-deck-preset-starter-baseline'));

        expect(decodeAcquiredCards(store.getState().flags)).toEqual([]);
    });
});
