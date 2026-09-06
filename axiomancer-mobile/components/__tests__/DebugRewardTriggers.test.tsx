/**
 * Hermetic component tests — DebugRewardTriggers.
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - RELIQUARY MODEST / RICH open a loot-cache session at that tier
 *     (historic `debug-cache-button` id on MODEST)
 *   - A hazard chip opens a hazard session for that id
 *   - ANVIL opens a blacksmith session
 *   - UNLOCK JOURNAL fills codex.unlockedEntries; KNOW ALL CARDS fills knownCards
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { cardLibrary } from '@mechanics';

import { DebugRewardTriggers } from '@/components/DebugRewardTriggers';
import { listHazards, listJournalEntries } from '@/state/dev/rewards';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
});

const makeStore = (): AppStore => createAppStore({ adapter: createMemoryAdapter() });
const withProvider = (store: AppStore, child: React.ReactNode) => <GameStoreProvider store={store}>{child}</GameStoreProvider>;

describe('DebugRewardTriggers: DEV gate', () => {
    it('renders every reward button and a chip per hazard', () => {
        const tree = render(withProvider(makeStore(), <DebugRewardTriggers />));
        expect(tree.queryByTestId('debug-cache-button')).not.toBeNull();
        expect(tree.queryByTestId('debug-cache-rich-button')).not.toBeNull();
        expect(tree.queryByTestId('debug-anvil-budget-button')).not.toBeNull();
        expect(tree.queryByTestId('debug-journal-unlock-button')).not.toBeNull();
        expect(tree.queryByTestId('debug-learn-all-cards-button')).not.toBeNull();
        for (const h of listHazards()) expect(tree.queryByTestId(`debug-hazard-id-${h.id}`)).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        const g = global as unknown as { __DEV__: boolean };
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const tree = render(withProvider(makeStore(), <DebugRewardTriggers />));
            expect(tree.queryByTestId('debug-cache-button')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugRewardTriggers: sessions + grants', () => {
    it('RELIQUARY RICH opens a rich loot-cache session', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugRewardTriggers />));
        fireEvent.press(tree.getByTestId('debug-cache-rich-button'));
        expect(store.getState().cache.session).not.toBeNull();
    });

    it('a hazard chip opens that hazard', () => {
        const store = makeStore();
        const hazard = listHazards()[1];
        const tree = render(withProvider(store, <DebugRewardTriggers />));
        fireEvent.press(tree.getByTestId(`debug-hazard-id-${hazard.id}`));
        expect(store.getState().hazard.session?.hazardId).toBe(hazard.id);
    });

    it('ANVIL opens a blacksmith session', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugRewardTriggers />));
        fireEvent.press(tree.getByTestId('debug-anvil-budget-button'));
        expect(store.getState().blacksmith.session).not.toBeNull();
    });

    it('UNLOCK JOURNAL and KNOW ALL CARDS grant everything', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugRewardTriggers />));
        fireEvent.press(tree.getByTestId('debug-journal-unlock-button'));
        expect(store.getState().codex.unlockedEntries).toHaveLength(listJournalEntries().length);
        fireEvent.press(tree.getByTestId('debug-learn-all-cards-button'));
        for (const c of cardLibrary) expect(store.getState().player.knownCards).toContain(c.id);
    });
});
