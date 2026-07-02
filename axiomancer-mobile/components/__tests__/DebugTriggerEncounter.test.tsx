/**
 * Hermetic component tests — DebugTriggerEncounter.
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - One button per encounter kind mounts
 *   - COMBAT seeds a combat-prelude encounter event with the
 *     lowest-level standard foe on the current map (level 1 on
 *     fishing-village) and navigates to the WILDS tab
 *   - BOSS seeds an isBoss encounter with a boss-tier foe
 *   - HAZARD / REST / GATHER / TREASURE / QUEST launch their REAL
 *     minigame session (and crucially leave NO paced /event route, so
 *     they can never dead-end at the "NO EVENT" card)
 *   - VILLAGE / CUTSCENE seed their paced events for the dedicated
 *     /village + /cutscene routes
 *
 * Regression guard (2026-06-14): the previous version of this test
 * asserted that rest/gather/treasure/quest "seed a narrative event"
 * with `selectHasActiveEvent === true`. That pinned the BROKEN
 * behavior — those kinds route through `<EventGate>` to /event, where
 * `composeNarrative` returns the empty VM ("NO EVENT IN PROGRESS").
 * The contract a player cares about is "the minigame opens", so these
 * tests now assert the session selectors + absence of a paced route.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugTriggerEncounter } from '@/components/DebugTriggerEncounter';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import {
    selectHasActiveEvent,
    selectPacedEventRoute,
} from '@/state/presenters/event.engine';
import { selectHasActiveHazard } from '@/state/presenters/hazard.engine';
import { selectHasActiveRest } from '@/state/presenters/rest.engine';
import { selectHasActiveGathering } from '@/state/presenters/gathering.engine';
import { selectHasActiveCache } from '@/state/presenters/cache.engine';
import { selectHasActiveQuestBoard } from '@/state/presenters/quest.engine';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
        canGoBack: () => false,
    }),
}));

afterEach(() => {
    mockPush.mockClear();
    jest.restoreAllMocks();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

describe('DebugTriggerEncounter: DEV gate', () => {
    it('renders a button for every encounter kind when __DEV__ is true', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugTriggerEncounter />));
        for (const kind of ['encounter', 'boss', 'hazard', 'rest', 'gather', 'treasure', 'quest']) {
            expect(tree.queryByTestId(`debug-trigger-encounter-${kind}`)).not.toBeNull();
        }
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {

        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugTriggerEncounter />));
            expect(tree.queryByTestId('debug-trigger-encounter-encounter')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugTriggerEncounter: combat triggers', () => {
    it('COMBAT seeds a non-boss encounter with the lowest-level foe and navigates to WILDS', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugTriggerEncounter />));
        fireEvent.press(tree.getByTestId('debug-trigger-encounter-encounter'));

        expect(mockPush).toHaveBeenCalledWith('/(tabs)/exploration');
        const slice = store.getState().event;
        expect(slice.pending).not.toBeNull();
        const event = slice.pending!.event as { kind: string; isBoss: boolean; encounter: { enemies: { level: number }[] } };
        expect(event.kind).toBe('encounter');
        expect(event.isBoss).toBe(false);
        // Fishing-village's gentlest foes are level 1.
        expect(event.encounter.enemies[0].level).toBe(1);
        expect(selectHasActiveEvent(store.getState())).toBe(true);
    });

    it('BOSS seeds an isBoss encounter with a boss-tier foe', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugTriggerEncounter />));
        fireEvent.press(tree.getByTestId('debug-trigger-encounter-boss'));

        const event = store.getState().event.pending!.event as {
            kind: string;
            isBoss: boolean;
            encounter: { enemies: { difficulty: string }[] };
        };
        expect(event.kind).toBe('encounter');
        expect(event.isBoss).toBe(true);
        expect(event.encounter.enemies[0].difficulty).toBe('boss');
    });
});

describe('DebugTriggerEncounter: minigame triggers', () => {
    // Each minigame button must (a) start its session and (b) leave NO
    // paced /event route — otherwise <EventGate> would push /event and
    // the player would see "NO EVENT IN PROGRESS" instead of the game.
    const MINIGAMES: readonly {
        button: string;
        hasSession: (s: ReturnType<AppStore['getState']>) => boolean;
    }[] = [
        { button: 'hazard', hasSession: (s) => selectHasActiveHazard(s) },
        { button: 'rest', hasSession: (s) => selectHasActiveRest(s) },
        { button: 'gather', hasSession: (s) => selectHasActiveGathering(s) },
        { button: 'treasure', hasSession: (s) => selectHasActiveCache(s) },
        { button: 'quest', hasSession: (s) => selectHasActiveQuestBoard(s) },
    ];

    it.each(MINIGAMES.map((m) => [m.button, m] as const))(
        '%s launches its minigame session and never dead-ends at /event',
        (_button, mg) => {
            const store = makeStore();
            expect(mg.hasSession(store.getState())).toBe(false);

            const tree = render(withProvider(store, <DebugTriggerEncounter />));
            fireEvent.press(tree.getByTestId(`debug-trigger-encounter-${mg.button}`));

            expect(mockPush).toHaveBeenCalledWith('/(tabs)/exploration');
            // The session is live → the gate routes to the minigame.
            expect(mg.hasSession(store.getState())).toBe(true);
            // And there is NO paced event waiting — the bug was that these
            // seeded a loot-cache/interaction/etc onto the event slice,
            // which <EventGate> pushed to /event → "NO EVENT".
            expect(selectHasActiveEvent(store.getState())).toBe(false);
            expect(selectPacedEventRoute(store.getState())).toBeNull();
        },
    );

    it('TREASURE opens the loot-cache ("The Reliquary"), not a NO EVENT card', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugTriggerEncounter />));
        fireEvent.press(tree.getByTestId('debug-trigger-encounter-treasure'));

        expect(selectHasActiveCache(store.getState())).toBe(true);
        // The cache carries the seeded coin so the claim ledger isn't empty.
        expect(store.getState().cache.session).not.toBeNull();
    });

    it('QUEST opens the build-the-boat board, not a generic interaction', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugTriggerEncounter />));
        fireEvent.press(tree.getByTestId('debug-trigger-encounter-quest'));

        expect(selectHasActiveQuestBoard(store.getState())).toBe(true);
        expect(store.getState().quest.session?.boardId).toBe('build-the-boat');
    });
});

describe('DebugTriggerEncounter: paced dedicated-route triggers', () => {
    // VILLAGE + CUTSCENE genuinely DO render through the event slice —
    // <EventGate> (root-mounted) routes them to /village and /cutscene.
    //
    // Regression guard (2026-06-15): these must NOT jump to the WILDS
    // tab first. The dedicated route pushes from wherever the dev
    // triggered it, so jumping made the event's dismiss tap dead-end on
    // the exploration map instead of returning to the dev menu. EventGate
    // fires from any tab, so the jump was both unnecessary and wrong.
    it.each([
        ['village', 'village', '/village'],
        ['cutscene', 'cutscene', '/cutscene'],
    ])('%s seeds a %s event, routes to %s, and does NOT jump to WILDS', (button, eventKind, route) => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugTriggerEncounter />));
        fireEvent.press(tree.getByTestId(`debug-trigger-encounter-${button}`));

        expect(mockPush).not.toHaveBeenCalledWith('/(tabs)/exploration');
        expect(store.getState().event.pending!.event.kind).toBe(eventKind);
        expect(selectHasActiveEvent(store.getState())).toBe(true);
        expect(selectPacedEventRoute(store.getState())).toBe(route);
    });
});
