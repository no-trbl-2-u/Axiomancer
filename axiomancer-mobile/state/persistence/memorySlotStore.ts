/**
 * In-memory `SaveSlotStore` — the slot surface for launches that must NOT
 * touch AsyncStorage: fixture boots (`createFixtureBootAdapter`) and tests.
 *
 * Mirrors the AsyncStorage adapter's slot semantics exactly (three slots,
 * one active, summaries, subscriptions) over a plain `Map`, and doubles as a
 * `PersistenceAdapter` so a store can be built over it directly. Pure
 * function factory; no I/O, no timers.
 *
 * Functions:
 *   createMemorySlotStore(options)   the store (+ `saveCount` for tests)
 */

import type { GameState, PersistenceAdapter } from '@mechanics';

import type { StoredEnvelope } from './migrations';
import {
    SAVE_SLOT_IDS,
    summarizeSlot,
    type SaveSlotId,
    type SaveSlotStore,
    type SaveSlotSummary,
} from './saveSlots';

export interface MemorySlotStoreOptions {
    /** Pre-filled slots. */
    initial?: Partial<Record<SaveSlotId, { state: GameState; savedAt: number }>>;
    /** The slot `load()` starts on. Defaults to none. */
    activeSlot?: SaveSlotId | null;
    /** Clock for `savedAt`. Defaults to a counter so writes order deterministically. */
    now?: () => number;
}

export interface MemorySlotStore extends PersistenceAdapter, SaveSlotStore {
    /** How many `save()` calls landed in a slot. */
    readonly saveCount: number;
}

export function createMemorySlotStore(options: MemorySlotStoreOptions = {}): MemorySlotStore {
    let tick = 0;
    const now = options.now ?? (() => ++tick);
    const slots = new Map<SaveSlotId, { envelope: StoredEnvelope; state: GameState } | null>(
        SAVE_SLOT_IDS.map((id) => {
            const seed = options.initial?.[id];
            return [id, seed ? { envelope: { schemaVersion: 3, state: seed.state, savedAt: seed.savedAt }, state: seed.state } : null];
        }),
    );
    let activeSlot: SaveSlotId | null = options.activeSlot ?? null;
    let saveCount = 0;
    const listeners = new Set<() => void>();
    let summaries: readonly SaveSlotSummary[] = [];

    const changed = (): void => {
        summaries = SAVE_SLOT_IDS.map((id) => {
            const s = slots.get(id) ?? null;
            return summarizeSlot(id, s?.envelope ?? null, s?.state ?? null);
        });
        for (const l of listeners) l();
    };
    changed();

    return {
        get saveCount() {
            return saveCount;
        },
        load: () => (activeSlot === null ? null : (slots.get(activeSlot)?.state ?? null)),
        save: (state: GameState) => {
            if (activeSlot === null) return;
            slots.set(activeSlot, { envelope: { schemaVersion: 3, state, savedAt: now() }, state });
            saveCount += 1;
            changed();
        },
        listSlots: () => summaries,
        getActiveSlot: () => activeSlot,
        selectSlot: (id: SaveSlotId) => {
            activeSlot = id;
            changed();
        },
        readSlot: (id: SaveSlotId) => slots.get(id)?.state ?? null,
        clearSlot: async (id: SaveSlotId) => {
            slots.set(id, null);
            changed();
        },
        subscribe: (listener: () => void) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}
