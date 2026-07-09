/**
 * Hermetic component tests — DebugCombatDeck.
 *
 * Pins the dev combat-deck controls: a per-preset "swap your deck" button for
 * each strategy deck plus a "random deck" button that deals from the full card
 * pool. Both replace the player's `knownCards` and clear earned reward cards.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugCombatDeck } from '@/components/DebugCombatDeck';
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

describe('DebugCombatDeck: deck controls', () => {
    it('renders a button for every strategy deck preset plus the randomizer', () => {
        const tree = render(withProviders(makeStore(), <DebugCombatDeck />));

        for (const id of [
            'starter-baseline',
            'erosion',
            'oratory',
            'foundry',
            'penitent',
            'standstill',
            'augury',
            'tithe',
            'grace',
            'bastion',
            'refrain',
        ]) {
            expect(tree.queryByTestId(`debug-combat-deck-preset-${id}`)).not.toBeNull();
        }
        expect(tree.queryByTestId('debug-combat-deck-randomize')).not.toBeNull();
    });

    it('pressing a preset swaps the player deck (knownCards) for that preset', () => {
        const store = makeStore();
        const tree = render(withProviders(store, <DebugCombatDeck />));

        fireEvent.press(tree.getByTestId('debug-combat-deck-preset-erosion'));

        expect(store.getState().player.knownCards.length).toBeGreaterThan(0);
        expect(store.getState().player.combatRewardCards).toEqual([]);
        expect(tree.getByText(/Erosion: \d+-card deck/i)).toBeTruthy();
    });

    it('pressing random deck deals a random hand into knownCards', () => {
        const store = makeStore();
        const tree = render(withProviders(store, <DebugCombatDeck />));

        fireEvent.press(tree.getByTestId('debug-combat-deck-randomize'));

        expect(store.getState().player.knownCards.length).toBeGreaterThan(0);
        expect(tree.getByText(/random deck:/i)).toBeTruthy();
    });
});
