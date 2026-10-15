/**
 * Phase PF4 — the exploration screen gates its map on the encounter modal's
 * reported mode. The overlay is stubbed so each mode can be held on screen:
 * the real one auto-engages on mount, which hides its prelude frame (the
 * real flow is pinned in `map-under-combat.engine.test.tsx`).
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => false }),
}));

jest.mock('@/components/event/EncounterModalOverlay', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ReactMock = require('react');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text, View } = require('react-native');
    function StubOverlay({ onModeChange }: { onModeChange?: (mode: string) => void }) {
        const [mode, setMode] = ReactMock.useState('prelude');
        ReactMock.useEffect(() => { onModeChange?.(mode); }, [mode, onModeChange]);
        // createElement, not JSX: a mock factory may not reach the JSX runtime.
        return ReactMock.createElement(
            View,
            { testID: 'stub-overlay' },
            ['prelude', 'combat', 'aftermath'].map((m: string) => ReactMock.createElement(
                Text,
                { key: m, testID: `stub-mode-${m}`, onPress: () => setMode(m) },
                m,
            )),
        );
    }
    return { EncounterModalOverlay: StubOverlay };
});

import { CombatModeProvider } from '@/state/combat-mode';
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
    jest.clearAllMocks();
});

const ENCOUNTER_EVENT: ResolveMapEventResult = {
    state: undefined as never,
    event: {
        kind: 'encounter',
        encounter: { enemies: [createMockEncounterEnemy()], origin: 'breakwater:bw-2' },
        isBoss: false,
    } as never,
};

function mountWithEncounter() {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    store.setState({ event: { ...EMPTY_EVENT_SLICE, pending: ENCOUNTER_EVENT } });
    const tree = render(
        <CombatModeProvider>
            <GameStoreProvider store={store}>
                <ExplorationScreen />
            </GameStoreProvider>
        </CombatModeProvider>,
    );
    return { tree, store };
}

describe('the exploration map follows the encounter modal mode', () => {
    it('prelude: the map stays mounted behind the modal', () => {
        const { tree, store } = mountWithEncounter();
        expect(tree.queryByTestId('stub-overlay')).not.toBeNull();
        expect(tree.queryByTestId('map-canvas-wrapper')).not.toBeNull();
        expect(tree.queryByText(regionOf(store))).not.toBeNull();
    });

    it('combat: the map and region header are unmounted', () => {
        const { tree, store } = mountWithEncounter();
        fireEvent.press(tree.getByTestId('stub-mode-combat'));
        expect(tree.queryByTestId('map-canvas-wrapper')).toBeNull();
        expect(tree.queryByText(regionOf(store))).toBeNull();
        expect(tree.queryByTestId('stub-overlay')).not.toBeNull();
    });

    it('aftermath: the map comes back behind the modal', () => {
        const { tree, store } = mountWithEncounter();
        fireEvent.press(tree.getByTestId('stub-mode-combat'));
        fireEvent.press(tree.getByTestId('stub-mode-aftermath'));
        expect(tree.queryByTestId('map-canvas-wrapper')).not.toBeNull();
        expect(tree.queryByText(regionOf(store))).not.toBeNull();
    });
});
