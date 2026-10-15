/**
 * Hermetic component tests — LabyrinthGate.
 *
 * LabyrinthGate is a side-effect-only component (returns null) that pushes
 * the user into `/labyrinth` whenever a visit to THE APORIA opens: the
 * Lantern Deep's vault door, the dev menu, or a save loaded mid-visit. It
 * stays put when the player is already on the route.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import React from 'react';

import { LabyrinthGate } from '@/components/LabyrinthGate';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { EMPTY_LABYRINTH_SLICE, createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const mockPush = jest.fn();
const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
};
let mockPathname = '/(tabs)/exploration/index';

jest.mock('@/lib/platform/router', () => ({
    // A fresh object per call, as in production.
    useRouter: () => ({ ...mockRouter }),
    usePathname: () => mockPathname,
}));

afterEach(() => {
    mockPush.mockClear();
    mockPathname = '/(tabs)/exploration/index';
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function openVisit(store: AppStore): void {
    store.setState({
        labyrinthUi: {
            session: { actId: 'act1', savedWorld: null, lastRemark: null, arrivalNote: null },
        },
    });
}

function withProvider(store: AppStore) {
    return <GameStoreProvider store={store}><LabyrinthGate /></GameStoreProvider>;
}

describe('LabyrinthGate: an open visit routes to /labyrinth', () => {
    it('does not push outside a visit', () => {
        render(withProvider(makeStore()));
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('pushes /labyrinth when a visit is open at mount (a save loaded mid-visit)', () => {
        const store = makeStore();
        openVisit(store);
        render(withProvider(store));
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/labyrinth');
    });

    it('pushes /labyrinth when a visit opens (the vault door)', () => {
        const store = makeStore();
        render(withProvider(store));
        act(() => openVisit(store));
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/labyrinth');
    });

    it('does not push when the visit opens on the route itself (act select)', () => {
        mockPathname = '/labyrinth/index';
        const store = makeStore();
        render(withProvider(store));
        act(() => openVisit(store));
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not push again when the visit ends', () => {
        const store = makeStore();
        openVisit(store);
        render(withProvider(store));
        mockPush.mockClear();
        act(() => store.setState({ labyrinthUi: EMPTY_LABYRINTH_SLICE }));
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not push again when another route covers the labyrinth mid-visit (a fight)', () => {
        mockPathname = '/labyrinth/index';
        const store = makeStore();
        openVisit(store);
        const tree = render(withProvider(store));
        mockPathname = '/combat-encounter/index';
        act(() => { store.setState({ _devSkipSeq: 1 } as never); });
        tree.rerender(withProvider(store));
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('pushes again for the next visit', () => {
        const store = makeStore();
        openVisit(store);
        render(withProvider(store));
        act(() => store.setState({ labyrinthUi: EMPTY_LABYRINTH_SLICE }));
        act(() => openVisit(store));
        expect(mockPush).toHaveBeenCalledTimes(2);
    });

    it('renders nothing (side-effect-only)', () => {
        expect(render(withProvider(makeStore())).toJSON()).toBeNull();
    });
});
