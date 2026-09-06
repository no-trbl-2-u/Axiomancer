/**
 * Hermetic component tests — DebugEnemyPicker.
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - The roster defaults to the current map; a map chip switches it
 *   - A foe chip jumps to WILDS and stages a combat prelude for that foe
 *   - A boss chip stages an isBoss prelude
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugEnemyPicker } from '@/components/DebugEnemyPicker';
import { listEnemies } from '@/state/dev/enemy-picker';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { selectHasActiveCombatPrelude } from '@/state/presenters/event.engine';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const mockPush = jest.fn();
jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => false }),
}));

afterEach(() => {
    mockPush.mockClear();
    jest.restoreAllMocks();
});

const makeStore = (): AppStore => createAppStore({ adapter: createMemoryAdapter() });
const withProvider = (store: AppStore, child: React.ReactNode) => <GameStoreProvider store={store}>{child}</GameStoreProvider>;

describe('DebugEnemyPicker: DEV gate', () => {
    it('renders the current map roster by default', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugEnemyPicker />));
        const first = listEnemies('fishing-village')[0];
        expect(tree.queryByTestId(`debug-enemy-${first.enemy.id}`)).not.toBeNull();
        expect(tree.queryByTestId('debug-enemy-map-aporia-proof')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        const g = global as unknown as { __DEV__: boolean };
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const tree = render(withProvider(makeStore(), <DebugEnemyPicker />));
            expect(tree.queryByTestId('debug-enemy-map-aporia-proof')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugEnemyPicker: staging', () => {
    it('a map chip switches the roster and a foe chip stages that foe', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugEnemyPicker />));
        fireEvent.press(tree.getByTestId('debug-enemy-map-aporia-proof'));
        const boss = listEnemies('aporia-proof').find((r) => r.isBoss)!;
        fireEvent.press(tree.getByTestId(`debug-enemy-${boss.enemy.id}`));
        expect(mockPush).toHaveBeenCalledWith('/(tabs)/exploration');
        expect(selectHasActiveCombatPrelude(store.getState())).toBe(true);
        const event = store.getState().event.pending!.event as { isBoss: boolean; encounter: { enemies: { id: string }[] } };
        expect(event.isBoss).toBe(true);
        expect(event.encounter.enemies[0].id).toBe(boss.enemy.id);
    });
});
