/**
 * Village encounter presenter — composes the dedicated settlement
 * screen's VM from the pending `village` event (Phase 137). Pure: no
 * store writes. Wares resolve against the engine item libraries; the
 * BUY action lives in the action layer (`buyVillageWare`).
 */

import {
    consumableLibrary,
    equipmentTemplates,
    type Item,
    type ShopWare,
} from 'axiomancer-mechanics';
import { equipmentFromTemplate as templateToEquipment } from 'axiomancer-mechanics';
import type { AppStoreState } from '@/state/store';

export interface VillageMerchantVM {
    name: string;
    /** First dialogue line, used as the merchant's stall-call. */
    line: string;
    /** Merchant has a walkable dialogue tree. */
    hasDialogue: boolean;
}

export interface VillageWareVM {
    itemId: string;
    name: string;
    description: string;
    price: number;
    affordable: boolean;
}

export interface VillageVM {
    active: boolean;
    villageName: string;
    body: string;
    merchants: readonly VillageMerchantVM[];
    wares: readonly VillageWareVM[];
    currency: number;
}

const EMPTY_VM: VillageVM = Object.freeze({
    active: false,
    villageName: '',
    body: '',
    merchants: Object.freeze([]),
    wares: Object.freeze([]),
    currency: 0,
});

/**
 * Resolves a shop ware's `itemId` against the engine item libraries.
 * Unknown ids return null and the ware is hidden (defensive — content
 * authoring owns id correctness).
 */
export function resolveWareItem(ware: ShopWare): Item | null {
    const consumable = consumableLibrary.find(c => c.id === ware.itemId);
    if (consumable) return consumable;
    const template = equipmentTemplates.find(t => t.id === ware.itemId);
    if (template) return templateToEquipment(template);
    return null;
}

export function selectVillageVM(
    state: Pick<AppStoreState, 'event' | 'player'>,
): VillageVM {
    const pending = state.event?.pending;
    if (!pending || pending.event.kind !== 'village') return EMPTY_VM;
    const event = pending.event;
    const currency = state.player?.currency ?? 0;

    const merchants: VillageMerchantVM[] = event.merchants.map(npc => {
        const tree = npc.dialogueTree;
        const rootText = tree ? tree.nodes[tree.rootId]?.text ?? '' : '';
        return {
            name: npc.name,
            line: rootText,
            hasDialogue: tree !== undefined && rootText.length > 0,
        };
    });

    const wares: VillageWareVM[] = (event.shop?.wares ?? [])
        .map(ware => {
            const item = resolveWareItem(ware);
            if (!item) return null;
            return {
                itemId: ware.itemId,
                name: item.name,
                description: item.description ?? '',
                price: ware.price,
                affordable: currency >= ware.price,
            };
        })
        .filter((w): w is VillageWareVM => w !== null);

    return {
        active: true,
        villageName: event.villageName,
        body:
            'Roofs and smoke and the particular noise of people who all know ' +
            'each other. Coin is welcome. Strangers are tolerated, provided ' +
            'they become customers promptly.',
        merchants,
        wares,
        currency,
    };
}
