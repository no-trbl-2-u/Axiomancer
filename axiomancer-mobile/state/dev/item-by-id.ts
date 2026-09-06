/**
 * Dev-only "add item by id" inventory injection (Phase 131).
 *
 * T asked for a dev control that drops a specific engine item into
 * the player's inventory by its id, for evidence runs where the Kid
 * needs a known item present (e.g. a particular consumable or a
 * given relic). We resolve the id against engine truth in priority
 * order — signet relic (`getRelicById`) → consumable
 * (`getConsumableById`) — so no fake local items are minted. Unknown
 * ids return a graceful failure the UI surfaces rather than a silent
 * no-op. Surfaced on `/dev` by `DebugItemPicker` (one chip per id).
 *
 * Component mount is `isDevToolsEnabled()`-guarded; production never
 * reaches this.
 */

import {
    getConsumableById,
    getRelicById,
} from '@mechanics';

import type { AppStore } from '@/state/store';

export type AddItemByIdKind = 'equipment' | 'consumable';

export interface AddItemByIdResult {
    added: boolean;
    /** The trimmed id that was looked up. */
    id: string;
    /** Which registry resolved the id, or null when nothing matched. */
    kind: AddItemByIdKind | null;
    /** Resolved item display name, or null when unknown. */
    name: string | null;
    /** Human-readable reason when `added` is false. */
    reason: string | null;
}

/**
 * Resolve `id` against the engine's item registries (relics first,
 * then consumables) and push a fresh copy of the match into the
 * player's inventory so the engine's stack-merge can run.
 */
export function addItemByIdAction(
    store: AppStore,
    rawId: string,
): AddItemByIdResult {
    const id = (rawId ?? '').trim();
    if (id.length === 0) {
        return {
            added: false,
            id,
            kind: null,
            name: null,
            reason: 'enter an item id',
        };
    }

    try {
        const addItem = store.getState().addItem;

        // Phase 21 — the only equipment is the 8 signet relics (resolve by id).
        const relic = getRelicById(id);
        if (relic) {
            addItem({ ...relic });
            return {
                added: true,
                id,
                kind: 'equipment',
                name: relic.name,
                reason: null,
            };
        }

        const consumable = getConsumableById(id);
        if (consumable) {
            addItem({ ...consumable });
            return {
                added: true,
                id,
                kind: 'consumable',
                name: consumable.name,
                reason: null,
            };
        }

        return {
            added: false,
            id,
            kind: null,
            name: null,
            reason: `unknown item id "${id}"`,
        };
    } catch (error) {
        console.error(`Failed to add item by id "${id}":`, error);
        return {
            added: false,
            id,
            kind: null,
            name: null,
            reason: 'add failed — see console',
        };
    }
}
