import type { GameState, PersistenceAdapter } from 'axiomancer-mechanics';

export interface MemoryAdapter extends PersistenceAdapter {
    saveCount: number;
    clear(): void;
}

/**
 * In-memory persistence adapter for tests. Mirrors the shape of the
 * engine's nullAdapter but persists across save/load calls within a test
 * and tracks how many times save() was called so tests can assert on it.
 */
export function createMemoryAdapter(initial: GameState | null = null): MemoryAdapter {
    let store: GameState | null = initial;
    let saveCount = 0;

    const adapter: MemoryAdapter = {
        get saveCount() {
            return saveCount;
        },
        load() {
            return store;
        },
        save(state: GameState) {
            store = state;
            saveCount++;
        },
        clear() {
            store = null;
            saveCount = 0;
        },
    };

    return adapter;
}
