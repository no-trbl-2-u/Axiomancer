import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState, PersistenceAdapter } from 'axiomancer-mechanics';

import {
    DEFAULT_MIGRATIONS,
    type MigrationMap,
    type StoredEnvelope,
    unwrap,
    wrap,
} from './migrations';

/** Single-slot storage key (Q2 / Q5 in spec 09: one slot, namespaced). */
export const SAVE_KEY = '@axiomancer/save:v1';

/** Production debounce — bursts of state changes coalesce into one write. */
export const DEFAULT_DEBOUNCE_MS = 500;

type AsyncStorageLike = Pick<
    typeof AsyncStorage,
    'getItem' | 'setItem' | 'removeItem'
>;

export interface AsyncStorageAdapterOptions {
    /** Defaults to 500ms. Set to 0 to write synchronously on every `save`. */
    debounceMs?: number;
    /** Injectable for tests. Defaults to the real AsyncStorage. */
    storage?: AsyncStorageLike;
    /**
     * Forward-migrations keyed by source version. Empty by default —
     * bump `CURRENT_SCHEMA_VERSION` in `migrations.ts` and add an entry
     * here when the save shape changes.
     */
    migrations?: MigrationMap;
    /**
     * Called when a debounced write rejects. Defaults to `console.warn`.
     * Surfacing the failure to the user is the host's responsibility.
     */
    onError?: (err: unknown) => void;
}

export interface AsyncStorageAdapter extends PersistenceAdapter {
    /**
     * Read the on-disk save into the in-memory cache. Must complete
     * before `load()` returns meaningful data — the adapter's whole
     * reason to exist is bridging the engine's synchronous
     * `PersistenceAdapter` interface to AsyncStorage's async I/O.
     *
     * Throws on corrupt / future-version saves (Q7=A — host should
     * catch and show a "save corrupted" UX).
     */
    preload(): Promise<void>;
    /** Flush any pending debounced write. Awaitable. */
    flush(): Promise<void>;
    /** Wipe the slot (cache + on-disk). Awaitable. */
    clear(): Promise<void>;
}

export function createAsyncStorageAdapter(
    options: AsyncStorageAdapterOptions = {},
): AsyncStorageAdapter {
    const {
        debounceMs = DEFAULT_DEBOUNCE_MS,
        storage = AsyncStorage,
        migrations = DEFAULT_MIGRATIONS,
        onError = defaultOnError,
    } = options;

    let cache: GameState | null = null;
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingState: GameState | null = null;
    let pendingWrite: Promise<void> | null = null;

    const writeNow = async (): Promise<void> => {
        const state = pendingState;
        pendingState = null;
        pendingTimer = null;
        if (state === null) return;
        try {
            await storage.setItem(SAVE_KEY, JSON.stringify(wrap(state)));
        } catch (err) {
            onError(err);
        }
    };

    return {
        async preload() {
            const raw = await storage.getItem(SAVE_KEY);
            if (raw === null) {
                cache = null;
                return;
            }
            const envelope = JSON.parse(raw) as StoredEnvelope;
            cache = unwrap(envelope, migrations);
        },
        load() {
            return cache;
        },
        save(state: GameState) {
            cache = state;
            pendingState = state;
            if (debounceMs <= 0) {
                pendingWrite = writeNow();
                return;
            }
            if (pendingTimer !== null) clearTimeout(pendingTimer);
            pendingTimer = setTimeout(() => {
                pendingWrite = writeNow();
            }, debounceMs);
        },
        async flush() {
            if (pendingTimer !== null) {
                clearTimeout(pendingTimer);
                pendingTimer = null;
                pendingWrite = writeNow();
            }
            if (pendingWrite) {
                await pendingWrite;
                pendingWrite = null;
            }
        },
        async clear() {
            if (pendingTimer !== null) {
                clearTimeout(pendingTimer);
                pendingTimer = null;
            }
            pendingState = null;
            cache = null;
            await storage.removeItem(SAVE_KEY);
        },
    };
}

function defaultOnError(err: unknown): void {
    if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[asyncStorageAdapter] save failed:', err);
    }
}
