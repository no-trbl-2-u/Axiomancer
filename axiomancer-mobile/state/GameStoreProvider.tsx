import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useStore } from 'zustand/react';
import type { GameEventHandler, PersistenceAdapter } from 'axiomancer-mechanics';
import {
    createAppStore,
    getEmitterForStore,
    type AppStore,
    type AppStoreState,
} from './store';
import { createAppActions, type AppActions } from './actions';

interface GameStoreContextValue {
    store: AppStore;
    actions: AppActions;
}

const GameStoreContext = createContext<GameStoreContextValue | null>(null);

export interface GameStoreProviderProps {
    children: React.ReactNode;
    /**
     * Optional injected store — tests pass one built with a memory adapter.
     * When omitted, the provider lazily creates a singleton-per-mount store
     * backed by the engine's nullAdapter.
     */
    store?: AppStore;
    /**
     * Optional persistence adapter used when no `store` is supplied. Ignored
     * when `store` is provided. Spec 09 will plug in the AsyncStorage adapter.
     */
    adapter?: PersistenceAdapter;
}

export function GameStoreProvider({ children, store, adapter }: GameStoreProviderProps) {
    const storeRef = useRef<AppStore | null>(store ?? null);
    if (storeRef.current === null) {
        storeRef.current = createAppStore({ adapter });
    }

    const value = useMemo<GameStoreContextValue>(() => {
        const s = storeRef.current!;
        return { store: s, actions: createAppActions(s) };
    }, []);

    return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>;
}

function useGameStoreContext(): GameStoreContextValue {
    const ctx = useContext(GameStoreContext);
    if (ctx === null) {
        throw new Error('useGameState/useGameActions must be used inside <GameStoreProvider>');
    }
    return ctx;
}

/**
 * Subscribe to a slice of game state. Components re-render only when the
 * selected value changes by reference identity. Prefer per-field selectors
 * (e.g. `useGameState(s => s.player.hp)`) to keep re-renders narrow.
 */
export function useGameState<U>(selector: (state: AppStoreState) => U): U {
    const { store } = useGameStoreContext();
    return useStore(store, selector);
}

/**
 * Returns the typed action creators. The reference is stable for the
 * lifetime of the provider, so it can safely sit in effect dependency lists.
 */
export function useGameActions(): AppActions {
    return useGameStoreContext().actions;
}

/**
 * Escape hatch — returns the raw vanilla store. Use sparingly (subscribe
 * outside React, imperative reads). Components should prefer `useGameState`.
 */
export function useGameStore(): AppStore {
    return useGameStoreContext().store;
}

/**
 * Subscribe to engine-emitted typed events via the store's
 * `GameEventEmitter` (Phase 25). The handler fires for every dispatched
 * event; consumers narrow via the `is*Event` guards exported from
 * `axiomancer-mechanics`. The subscription is set up on mount and torn
 * down on unmount; the `handler` is read from a ref so its identity
 * doesn't need to be stable across renders.
 *
 * No-op when the store has no emitter attached (e.g. an externally
 * injected vanilla store in a test that bypasses `createAppStore`).
 */
export function useGameEvents(handler: GameEventHandler): void {
    const { store } = useGameStoreContext();
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        const emitter = getEmitterForStore(store);
        if (emitter === null) return;
        const unsubscribe = emitter.onAny((event) => {
            handlerRef.current(event);
        });
        return unsubscribe;
    }, [store]);
}
