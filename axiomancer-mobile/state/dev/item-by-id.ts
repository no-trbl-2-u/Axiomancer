/**
 * Dev-only "add item by id" inventory injection (Phase 131).
 *
 * T asked for a dev control that drops a specific engine item into
 * the player's inventory by its id, for evidence runs where the Kid
 * needs a known item present (e.g. a particular consumable or a
 * given equipment rarity). We resolve the id against engine truth in
 * priority order — equipment template → unique template → consumable
 * — so no fake local items are minted. Unknown ids return a graceful
 * failure the UI surfaces rather than a silent no-op.
 *
 * Component mount is `isDevToolsEnabled()`-guarded; production never
 * reaches this.
 */

import {
    getConsumableById,
    getEquipmentTemplate,
    getUniqueTemplate,
} from 'axiomancer-mechanics';

import type { AppStore } from '@/state/store';
import { equipmentFromTemplate as templateToEquipment } from 'axiomancer-mechanics';

export type AddItemByIdKind = 'equipment' | 'unique' | 'consumable';

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
 * Resolve `id` against the engine's central item registries (in
 * priority order) and push the matching item into the player's
 * inventory. Equipment / unique templates are materialised via
 * `templateToEquipment` (uniques are tagged `rarity: 'unique'` to
 * match the populate-all path); consumables are spread to a fresh
 * object so the engine's stack-merge can run.
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

        const equipmentTemplate = getEquipmentTemplate(id);
        if (equipmentTemplate) {
            addItem(templateToEquipment(equipmentTemplate));
            return {
                added: true,
                id,
                kind: 'equipment',
                name: equipmentTemplate.name,
                reason: null,
            };
        }

        const uniqueTemplate = getUniqueTemplate(id);
        if (uniqueTemplate) {
            const base = templateToEquipment(uniqueTemplate);
            addItem({ ...base, rarity: 'unique' });
            return {
                added: true,
                id,
                kind: 'unique',
                name: uniqueTemplate.name,
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
