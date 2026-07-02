import { GameState } from '../types';

/**
 * PersistenceAdapter
 *
 * The engine is agnostic about where state is stored.
 * Swap the implementation to change the storage backend without
 * touching any game logic.
 *
 * The two-method shape (`load(): GameState | null` + `save(state):
 * void`) is intentionally **synchronous**. Consumers that need async
 * I/O (AsyncStorage, IndexedDB, network) should **extend** the
 * interface rather than re-declaring it locally — keep `load` + `save`
 * as the cache-fronted sync surface and add async lifecycle helpers
 * (`preload`, `flush`, `clear`, etc.) for the bridge:
 *
 * ```ts
 * import type { PersistenceAdapter } from 'axiomancer-mechanics';
 *
 * export interface AsyncStorageAdapter extends PersistenceAdapter {
 *     preload(): Promise<void>;  // populate cache before load()
 *     flush(): Promise<void>;    // wait for pending writes
 *     clear(): Promise<void>;    // wipe cache + storage
 * }
 * ```
 *
 * Bundled implementations:
 *
 *   Node.js CLI  → createNodeAdapter()   (fs JSON file; src/Game/persistence/node.adapter.ts)
 *   Tests / sims → nullAdapter           (in-memory; src/Game/persistence/null.adapter.ts)
 *
 * Reference external implementations (consumer-side extensions):
 *
 *   React Native → `AsyncStorageAdapter extends PersistenceAdapter`
 *                  in `axiomancer-mobile/state/persistence/asyncStorageAdapter.ts`
 *                  — debounced writes + in-memory cache fronting the
 *                  synchronous `load()` against AsyncStorage's async
 *                  primitive, with `preload` / `flush` / `clear`
 *                  exposed for app-level lifecycle hooks.
 */
export interface PersistenceAdapter {
    /** Load persisted state. Returns null if no save exists or load fails. */
    load(): GameState | null;
    /** Persist the current state snapshot. */
    save(state: GameState): void;
}
