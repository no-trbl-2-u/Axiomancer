/**
 * Phase PF4 — no exploration map under live combat.
 *
 * While the fight is on screen, the exploration screen unmounts the map
 * canvas (and the node grid, confirm panel, badge, toast and header with it);
 * the aftermath panel keeps the map behind it, and closing the encounter
 * brings the map back. The prelude case is pinned with a stub overlay in
 * `map-under-combat-modes.engine.test.tsx`: the real overlay auto-engages
 * inside the same commit, so its prelude frame is not observable here.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => false }),
}));

import { CombatModeProvider, useCombatMode } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, EMPTY_EVENT_SLICE, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import type { ResolveMapEventResult } from '@mechanics';
import { selectExplorationViewModel } from '@/state/presenters/exploration.engine';
import ExplorationScreen from '@/app/(tabs)/exploration';

/** The region title the screen's header shows. */
function regionOf(store: AppStore): string {
    return selectExplorationViewModel(store.getState()).region;
}

afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
});

const ENCOUNTER_EVENT: ResolveMapEventResult = {
    state: undefined as never,
    event: {
        kind: 'encounter',
        encounter: {
            enemies: [createMockEncounterEnemy()],
            origin: 'breakwater:bw-2',
        },
        isBoss: false,
    } as never,
};

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

/** Ends the live fight in victory, the way the combat panel does. */
function WinButton() {
    const { exitCombatWith } = useCombatMode();
    return (
        <Text
            testID="test-win"
            onPress={() => exitCombatWith('victory', {
                variant: 'victory',
                enemy: { name: 'Larch-Stalker', description: 'A figure long since gnawed.', level: 3 },
                finalBlow: { cardName: 'STRIKE', damage: 24, descriptor: 'cleaves the rib' },
                xpReward: 18,
            })}
        >
            win
        </Text>
    );
}

function mountExploration(store: AppStore) {
    return render(
        <CombatModeProvider>
            <GameStoreProvider store={store}>
                <ExplorationScreen />
                <WinButton />
            </GameStoreProvider>
        </CombatModeProvider>,
    );
}

describe('the exploration map under an encounter', () => {
    it('no encounter: the map is mounted', () => {
        const tree = mountExploration(makeStore());
        expect(tree.queryByTestId('map-canvas-wrapper')).not.toBeNull();
    });

    it('live combat: the map is not mounted, the fight is', () => {
        const store = makeStore();
        store.setState({ event: { ...EMPTY_EVENT_SLICE, pending: ENCOUNTER_EVENT } });
        const tree = mountExploration(store);

        expect(tree.queryByTestId('encounter-modal-hazard-combat')).not.toBeNull();
        expect(tree.queryByTestId('map-canvas-wrapper')).toBeNull();
        expect(tree.queryByText(regionOf(store))).toBeNull();
    });

    it('aftermath keeps the map behind it, and CARRY ON leaves the map up', () => {
        const store = makeStore();
        store.setState({ event: { ...EMPTY_EVENT_SLICE, pending: ENCOUNTER_EVENT } });
        const tree = mountExploration(store);
        expect(tree.queryByTestId('map-canvas-wrapper')).toBeNull();

        fireEvent.press(tree.getByTestId('test-win'));
        expect(tree.queryByTestId('combat-victory-panel')).not.toBeNull();
        expect(tree.queryByTestId('map-canvas-wrapper')).not.toBeNull();

        fireEvent.press(tree.getByTestId('combat-victory-panel-carry-on'));
        expect(tree.queryByTestId('encounter-modal-overlay')).toBeNull();
        expect(tree.queryByTestId('map-canvas-wrapper')).not.toBeNull();
    });

    it('WITHDRAW brings the map back', () => {
        const store = makeStore();
        store.setState({ event: { ...EMPTY_EVENT_SLICE, pending: ENCOUNTER_EVENT } });
        const tree = mountExploration(store);
        expect(tree.queryByTestId('map-canvas-wrapper')).toBeNull();

        fireEvent.press(tree.getByTestId('combat-withdraw'));
        expect(tree.queryByTestId('encounter-modal-overlay')).toBeNull();
        expect(tree.queryByTestId('map-canvas-wrapper')).not.toBeNull();
    });

    it('a fight resumed after a reload opens with the map unmounted', () => {
        jest.useFakeTimers();
        const store = makeStore();
        store.getState().startCombat(createMockEncounterEnemy());
        const tree = mountExploration(store);
        act(() => { jest.advanceTimersByTime(1); });

        expect(tree.queryByTestId('encounter-modal-hazard-combat')).not.toBeNull();
        expect(tree.queryByTestId('map-canvas-wrapper')).toBeNull();
    });
});
