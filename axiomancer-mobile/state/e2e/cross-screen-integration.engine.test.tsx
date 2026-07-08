/**
 * Cross-screen integration harness (Phase 10).
 *
 * `smoke-render.engine.test.tsx` mounts each primary surface one at a
 * time; `EncounterModalOverlay.test.tsx` pins the encounter-modal
 * mount lifecycle in isolation (a manually-flipped `vm` prop). Neither
 * catches the actual regression class from commit `a18ee12b`
 * ("modal-contained encounter session — fix mid-encounter unmount +
 * lock tab bar"): `ExplorationScreen`'s modal-mount gate and
 * `(tabs)/_layout.tsx`'s tab-bar-lock gate each derived visibility
 * from overlapping-but-not-identical state, so a transition correct
 * for one screen silently broke the other. The fix unified both
 * gates on one flag — `useCombatMode().inEncounterModal` — but
 * nothing mounts the two screens *together* to prove they stay in
 * lockstep as new consumers get added.
 *
 * This file does exactly that: real `ExplorationScreen` +
 * `TabLayout`, one store, driving the actual FIGHT / FLEE state
 * transitions and reading the real props each screen would hand
 * `expo-router`.
 *
 * Hermetic = self-contained + deterministic + isolated. See
 * `docs/testing.md`. Pattern **P6** per `docs/E2E_INVENTORY.md`.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// Jest's hoist-safety babel plugin only allows a `jest.mock` factory
// to reference identifiers named `mock*` (case-insensitive) — these
// two are defined inline in the factory rather than imported, so the
// naming just has to satisfy that check.
jest.mock('expo-router', () => {
    const ReactLib = require('react');
    const { View } = require('react-native');

    const mockTabsScreenComponent = jest.fn(
        (props: { name: string; options?: { href?: unknown; title?: string } }) =>
            ReactLib.createElement(View, { testID: `mock-tab-screen-${props.name}` }),
    );
    const mockTabsComponent = Object.assign(
        jest.fn((props: { children?: unknown; screenOptions?: { tabBarStyle?: unknown } }) =>
            ReactLib.createElement(View, { testID: 'mock-tabs' }, props.children as React.ReactNode),
        ),
        { Screen: mockTabsScreenComponent },
    );

    return {
        useRouter: () => ({
            replace: jest.fn(),
            push: jest.fn(),
            back: jest.fn(),
            canGoBack: () => false,
        }),
        Tabs: mockTabsComponent,
    };
});

import { Tabs } from 'expo-router';
import { AestheticModeProvider } from '@/state/aesthetic-mode';
import { CombatModeProvider } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, EMPTY_EVENT_SLICE, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import type { ResolveMapEventResult } from '@mechanics';

import ExplorationScreen from '@/app/(tabs)/exploration';
import TabLayout from '@/app/(tabs)/_layout';

afterEach(() => {
    jest.clearAllMocks();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

// Restated from `smoke-render.engine.test.tsx`'s `ENCOUNTER_EVENT` /
// `seedActiveEvent` — that file already proved this exact fixture
// composes to VM kind `'combat-prelude'` and renders `ExplorationScreen`
// without throwing. Kept file-local rather than shared: one reused
// literal doesn't earn a shared fixture module.
function seedActiveEvent(store: AppStore, result: ResolveMapEventResult): void {
    store.setState({ event: { ...EMPTY_EVENT_SLICE, pending: result } });
}

// A real `createEnemy(...)`-built Enemy (not a hand-rolled literal) —
// `beginHazardEncounter` hands this straight to `CombatEncounterPanel`
// on FIGHT, which reads engine-shape fields (`effects`, etc.) the
// smoke-render fixture never needed because it never pressed FIGHT.
const ENCOUNTER_EVENT: ResolveMapEventResult = {
    state: undefined as never,
    event: {
        kind: 'encounter',
        encounter: {
            enemies: [createMockEncounterEnemy()],
            origin: 'fishing-village:fv-3',
        },
        isBoss: false,
    } as never,
};

function withProviders(store: AppStore, tree: React.ReactNode) {
    return (
        <AestheticModeProvider skipHydration>
            <CombatModeProvider>
                <GameStoreProvider store={store}>{tree}</GameStoreProvider>
            </CombatModeProvider>
        </AestheticModeProvider>
    );
}

function mountBothScreens(store: AppStore) {
    return render(
        withProviders(
            store,
            <>
                <ExplorationScreen />
                <TabLayout />
            </>,
        ),
    );
}

type TabsMockProps = { screenOptions?: { tabBarStyle?: { display?: string } } };
type TabsScreenMockProps = { name: string; options?: { href?: unknown } };

/** The last `screenOptions` the real `TabLayout` handed the (mocked) `<Tabs>`. */
function latestTabsScreenOptions(): TabsMockProps['screenOptions'] {
    const mockTabs = Tabs as unknown as { mock: { calls: [TabsMockProps][] } };
    const calls = mockTabs.mock.calls;
    return calls[calls.length - 1]?.[0]?.screenOptions;
}

/** The last `options` the real `TabLayout` handed a named `<Tabs.Screen>`. */
function latestScreenOptions(name: string): TabsScreenMockProps['options'] {
    const mockTabsScreen = (Tabs as unknown as { Screen: { mock: { calls: [TabsScreenMockProps][] } } }).Screen;
    const calls = mockTabsScreen.mock.calls;
    for (let i = calls.length - 1; i >= 0; i -= 1) {
        if (calls[i][0].name === name) return calls[i][0].options;
    }
    return undefined;
}

describe('integration: exploration + tab-bar lock survive the encounter-modal lifecycle', () => {
    it('baseline: no active event — modal absent, tab bar unlocked', () => {
        const store = makeStore();
        const tree = mountBothScreens(store);

        expect(tree.queryByTestId('encounter-modal-fight')).toBeNull();
        expect(latestTabsScreenOptions()?.tabBarStyle?.display).not.toBe('none');
        expect(latestScreenOptions('character/index')?.href).toBeUndefined();
    });

    it('a combat-prelude arms the modal AND locks the tab bar together', () => {
        const store = makeStore();
        seedActiveEvent(store, ENCOUNTER_EVENT);
        const tree = mountBothScreens(store);

        expect(tree.queryByTestId('encounter-modal-fight')).not.toBeNull();
        expect(latestTabsScreenOptions()?.tabBarStyle?.display).toBe('none');
        expect(latestScreenOptions('character/index')?.href).toBeNull();
    });

    it('regression pin: FIGHT clears the event slice, but the modal AND the tab lock both survive into combat', () => {
        const store = makeStore();
        seedActiveEvent(store, ENCOUNTER_EVENT);
        const tree = mountBothScreens(store);

        fireEvent.press(tree.getByTestId('encounter-modal-fight'));

        // The moment the historical bug fired: `beginHazardEncounter`
        // clears the event slice the instant FIGHT resolves, so
        // `hasEvent`/`preludeReady` both flip false. Pre-fix, that
        // flip alone unmounted the modal; a same-shaped drift on the
        // tab-bar gate would re-show the tab bar mid-encounter. Both
        // must stay locked together, driven by `inEncounterModal` +
        // `inCombat` — not by the (now-false) `hasEvent`.
        expect(store.getState().event.pending).toBeNull();
        expect(tree.queryByTestId('encounter-modal-overlay')).not.toBeNull();
        expect(latestTabsScreenOptions()?.tabBarStyle?.display).toBe('none');
        expect(latestScreenOptions('character/index')?.href).toBeNull();
    });

    it('round-trip: FLEE closes the modal AND unlocks the tab bar together', () => {
        const store = makeStore();
        seedActiveEvent(store, ENCOUNTER_EVENT);
        const tree = mountBothScreens(store);

        fireEvent.press(tree.getByTestId('encounter-modal-flee'));

        expect(tree.queryByTestId('encounter-modal-fight')).toBeNull();
        expect(tree.queryByTestId('encounter-modal-overlay')).toBeNull();
        expect(latestTabsScreenOptions()?.tabBarStyle?.display).not.toBe('none');
        expect(latestScreenOptions('character/index')?.href).toBeUndefined();
    });
});
