/**
 * AsyncStorage persistence adapter — THREE SAVE SLOTS (owner call 2026-09-23).
 *
 * Bridges the engine's synchronous `PersistenceAdapter` (`load()` /
 * `save()`) to AsyncStorage's async I/O with an in-memory mirror, exactly as
 * the single-slot Spec 09 adapter did, and adds the slot surface the main
 * menu drives (`SaveSlotStore` in `saveSlots.ts`).
 *
 * ## Shape
 *
 * - Each slot lives under its own key (`slotStorageKey(id)`), as a
 *   `StoredEnvelope` stamped with `savedAt`.
 * - `LAST_SLOT_KEY` remembers which slot the store last ran from. `preload()`
 *   reads it so a cold launch (a browser refresh on `/exploration`, a phone
 *   relaunch) boots the store STRAIGHT into that slot's state, the way the
 *   single slot always did — the title menu's CONTINUE is then a no-op
 *   confirmation, not a second load.
 * - The retired single-slot key (`LEGACY_SAVE_KEY`) is DELETED on preload and
 *   never read (owner call: discard the legacy save).
 *
 * ## Contract with the store
 *
 * - `load()` returns the ACTIVE slot's state, or `null` when no slot is
 *   active or the active slot is empty → the engine boots a fresh state.
 * - `save(state)` writes to the ACTIVE slot only. With no active slot the
 *   write is dropped and logged (`save-no-slot`): nothing is ever written
 *   into a slot the player did not pick. Debounced like before; `flush()`
 *   forces the pending write (used by `<SaveOnExit>`).
 * - A slot whose bytes fail to parse or migrate reads `unreadable`; it is
 *   never loaded and never thrown over — the LOAD screen shows it torn and
 *   offers to clear it. `preload()` itself only rejects when STORAGE fails
 *   (the root layout's corrupt-save modal handles that).
 *
 * Functions (lowest → highest abstraction):
 *   readSlotFromStorage(storage, id, migrations)   one slot → {envelope,state} | unreadable
 *   createAsyncStorageAdapter(options)              the adapter
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLogger } from '@mechanics';
import type { GameState, PersistenceAdapter } from '@mechanics';

import {
    DEFAULT_MIGRATIONS,
    type MigrationMap,
    type StoredEnvelope,
    unwrap,
    wrap,
} from './migrations';
import {
    LAST_SLOT_KEY,
    LEGACY_SAVE_KEY,
    SAVE_SLOT_IDS,
    isSaveSlotId,
    slotStorageKey,
    summarizeSlot,
    unreadableSlotSummary,
    type SaveSlotId,
    type SaveSlotStore,
    type SaveSlotSummary,
} from './saveSlots';

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
    /** Clock for `savedAt` stamps. Injectable so tests pin it. Defaults to `Date.now`. */
    now?: () => number;
}

export interface AsyncStorageAdapter extends PersistenceAdapter, SaveSlotStore {
    /**
     * Read every slot (and the remembered active slot) into the in-memory
     * mirror. Must complete before `load()` returns meaningful data.
     *
     * Rejects only when storage itself fails; an unreadable slot is
     * reported through `listSlots()` instead.
     */
    preload(): Promise<void>;
    /** Flush any pending debounced write. Awaitable. */
    flush(): Promise<void>;
    /** Wipe the ACTIVE slot (cache + on-disk). No-op when none is active. Awaitable. */
    clear(): Promise<void>;
}

/** One slot's in-memory mirror. */
interface SlotMirror {
    envelope: StoredEnvelope | null;
    state: GameState | null;
    unreadable: boolean;
}

const EMPTY_MIRROR: SlotMirror = Object.freeze({ envelope: null, state: null, unreadable: false });

/**
 * Read one slot from storage. Never throws for bad bytes: a parse or
 * migration failure yields `unreadable: true` and is logged.
 */
async function readSlotFromStorage(
    storage: AsyncStorageLike,
    id: SaveSlotId,
    migrations: MigrationMap,
): Promise<SlotMirror> {
    const raw = await storage.getItem(slotStorageKey(id));
    if (raw === null) return EMPTY_MIRROR;
    try {
        const envelope = JSON.parse(raw) as StoredEnvelope;
        const state = unwrap(envelope, migrations);
        return { envelope, state, unreadable: false };
    } catch (err) {
        getLogger().warn('persistence', 'slot-unreadable', {
            slot: id,
            message: err instanceof Error ? err.message : String(err),
        });
        return { envelope: null, state: null, unreadable: true };
    }
}

export function createAsyncStorageAdapter(
    options: AsyncStorageAdapterOptions = {},
): AsyncStorageAdapter {
    const {
        debounceMs = DEFAULT_DEBOUNCE_MS,
        storage = AsyncStorage,
        migrations = DEFAULT_MIGRATIONS,
        onError = defaultOnError,
        now = Date.now,
    } = options;

    const mirrors = new Map<SaveSlotId, SlotMirror>(SAVE_SLOT_IDS.map((id) => [id, EMPTY_MIRROR]));
    let activeSlot: SaveSlotId | null = null;
    let summaries: readonly SaveSlotSummary[] = SAVE_SLOT_IDS.map((id) => summarizeSlot(id, null, null));
    const listeners = new Set<() => void>();

    let pendingTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingState: GameState | null = null;
    let pendingWrite: Promise<void> | null = null;

    /** Recompute the stable summaries snapshot and notify subscribers. */
    const changed = (): void => {
        summaries = SAVE_SLOT_IDS.map((id) => {
            const m = mirrors.get(id) ?? EMPTY_MIRROR;
            return m.unreadable ? unreadableSlotSummary(id) : summarizeSlot(id, m.envelope, m.state);
        });
        for (const listener of listeners) listener();
    };

    const activeMirror = (): SlotMirror =>
        activeSlot === null ? EMPTY_MIRROR : (mirrors.get(activeSlot) ?? EMPTY_MIRROR);

    const writeNow = async (): Promise<void> => {
        const state = pendingState;
        const slot = activeSlot;
        pendingState = null;
        pendingTimer = null;
        if (state === null || slot === null) return;
        try {
            const envelope = wrap(state, now());
            const payload = JSON.stringify(envelope);
            await storage.setItem(slotStorageKey(slot), payload);
            mirrors.set(slot, { envelope, state, unreadable: false });
            getLogger().debug('persistence', 'save-written', { slot, bytes: payload.length });
            changed();
        } catch (err) {
            getLogger().error('persistence', 'save-failed', {
                slot,
                message: err instanceof Error ? err.message : String(err),
            });
            onError(err);
        }
    };

    const rememberActive = (id: SaveSlotId): void => {
        storage.setItem(LAST_SLOT_KEY, String(id)).catch((err: unknown) => {
            getLogger().warn('persistence', 'last-slot-write-failed', {
                message: err instanceof Error ? err.message : String(err),
            });
        });
    };

    return {
        // ── boot ────────────────────────────────────────────────────────
        async preload() {
            // Owner call: the single-slot save is discarded, never migrated.
            // Best-effort delete so the retired key does not linger.
            await storage.removeItem(LEGACY_SAVE_KEY).catch(() => undefined);

            for (const id of SAVE_SLOT_IDS) {
                mirrors.set(id, await readSlotFromStorage(storage, id, migrations));
            }

            const rawLast = await storage.getItem(LAST_SLOT_KEY);
            const last = rawLast === null ? NaN : Number(rawLast);
            activeSlot = isSaveSlotId(last) && (mirrors.get(last)?.state ?? null) !== null ? last : null;

            getLogger().info('persistence', 'preload', {
                slots: SAVE_SLOT_IDS.map((id) => {
                    const m = mirrors.get(id) ?? EMPTY_MIRROR;
                    return m.unreadable ? 'unreadable' : m.state ? 'saved' : 'empty';
                }),
                activeSlot,
            });
            changed();
        },

        // ── engine PersistenceAdapter ───────────────────────────────────
        load() {
            return activeMirror().state;
        },
        save(state: GameState) {
            if (activeSlot === null) {
                // Nothing is ever written into a slot the player did not pick.
                getLogger().warn('persistence', 'save-no-slot');
                return;
            }
            // Mirror the state at once so `load()` is current even before
            // the debounced write lands (the previous adapter's contract).
            const current = mirrors.get(activeSlot) ?? EMPTY_MIRROR;
            mirrors.set(activeSlot, { ...current, state, unreadable: false });
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
            if (activeSlot === null) return;
            await this.clearSlot(activeSlot);
        },

        // ── SaveSlotStore ───────────────────────────────────────────────
        listSlots() {
            return summaries;
        },
        getActiveSlot() {
            return activeSlot;
        },
        selectSlot(id: SaveSlotId) {
            if (pendingTimer !== null) {
                // A write queued for the OLD slot must not land in the new one.
                clearTimeout(pendingTimer);
                pendingTimer = null;
                pendingWrite = writeNow();
            }
            activeSlot = id;
            rememberActive(id);
            getLogger().info('persistence', 'slot-selected', { slot: id });
            changed();
        },
        readSlot(id: SaveSlotId) {
            return mirrors.get(id)?.state ?? null;
        },
        async clearSlot(id: SaveSlotId) {
            if (id === activeSlot && pendingTimer !== null) {
                clearTimeout(pendingTimer);
                pendingTimer = null;
                pendingState = null;
            }
            mirrors.set(id, EMPTY_MIRROR);
            await storage.removeItem(slotStorageKey(id));
            getLogger().info('persistence', 'slot-cleared', { slot: id });
            changed();
        },
        subscribe(listener: () => void) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}

function defaultOnError(err: unknown): void {
    if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[asyncStorageAdapter] save failed:', err);
    }
}
