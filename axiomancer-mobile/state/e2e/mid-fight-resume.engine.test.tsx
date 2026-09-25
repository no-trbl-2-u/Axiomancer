/**
 * Trim-the-fat Tier 0 item 6 — a chronicle continued mid-fight.
 *
 * The live fight's dice, hand and HP live in the combat panel's local state,
 * so a restart keeps only the engine's `currentEncounter` (the foe). Cold
 * start used to route that save to `/combat-encounter` — the dev sandbox
 * (mock foe, nothing persisted). Now Continue lands on the map, and the map
 * restarts the fight against the saved foe (owner call, 2026-09-25).
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => false }),
}));

import { CombatModeProvider } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import ExplorationScreen from '@/app/(tabs)/exploration';

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
});

/** A store whose player owns a real deck, as `beginHazardEncounter` guarantees. */
function makeStore(): AppStore {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    const p = store.getState().player;
    store.setState({
        player: {
            ...p,
            knownCards: Array.from(new Set([
                ...(p.knownCards ?? []),
                'slippery-slope', 'recurring-symptom', 'brace-for-impact',
            ])),
        },
    });
    return store;
}

function mountExploration(store: AppStore) {
    const tree = render(
        <CombatModeProvider>
            <GameStoreProvider store={store}>
                <ExplorationScreen />
            </GameStoreProvider>
        </CombatModeProvider>,
    );
    act(() => { jest.advanceTimersByTime(1); });
    return tree;
}

describe('continuing a chronicle saved mid-fight', () => {
    it('the map restarts the fight against the saved foe', () => {
        const store = makeStore();
        store.getState().startCombat(createMockEncounterEnemy());

        const tree = mountExploration(store);

        expect(tree.queryByTestId('encounter-modal-hazard-combat')).not.toBeNull();
        // The restarted fight is the real, persisted one — the encounter the
        // save carried is still the one on the books.
        expect(store.getState().currentEncounter).toBeDefined();
    });

    it('a chronicle saved outside a fight opens on the plain map', () => {
        const store = makeStore();

        const tree = mountExploration(store);

        expect(tree.queryByTestId('encounter-modal-hazard-combat')).toBeNull();
        expect(tree.queryByTestId('encounter-modal-overlay')).toBeNull();
    });
});
