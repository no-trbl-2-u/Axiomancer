/**
 * Inventory feedback presenter (Phase 29 Tick B).
 *
 * Pure mapper from an `inventory:changed` engine event to a toast
 * string the player sees. Defensive: the engine emits this event from
 * several action types with inconsistent payload shapes
 * (USE_ITEM/EQUIP_ITEM/UNEQUIP_ITEM via dispatch carry
 * `{action, state}`; the non-dispatch `addItem` carries `{item, state}`;
 * the non-dispatch `removeItem` carries `{state}` only). The mapper
 * handles each path it can name, returns `null` for the rest so the
 * screen stays silent rather than emitting a misleading toast.
 */

import type { GameEvent } from 'axiomancer-mechanics';
import { isInventoryChangedEvent } from 'axiomancer-mechanics';

/**
 * Runtime-actual shape of an `inventory:changed` event's payload — a
 * superset of the engine's strict `EnginePayload` (`{action, state}`).
 * The engine's non-dispatch `addItem` path ships `{item, state}` and
 * skips the `action` slot; the EQUIP_ITEM dispatched-action payload
 * carries an inline `item` per its action shape. The probe type lists
 * every field this presenter reads, typed loosely so the cast is from
 * `unknown` (precise) rather than `any` (escape hatch).
 */
type InventoryChangedPayloadProbe = {
    readonly item?: { readonly name?: unknown };
    readonly action?: {
        readonly type?: unknown;
        readonly payload?: { readonly item?: { readonly name?: unknown } };
    };
};

/**
 * Best-effort toast string for an `inventory:changed` event.
 * Returns `null` when the payload lacks the information needed to
 * say something meaningful — caller should NOT emit a fallback
 * toast in that case.
 */
export function selectInventoryToast(event: GameEvent): string | null {
    if (!isInventoryChangedEvent(event)) return null;
    // Engine's typed payload claims `{action, state}` everywhere but
    // the runtime sometimes ships `{item, state}` (non-dispatch path);
    // cast through `unknown` to the probe shape so subsequent reads
    // stay typed.
    const payload = event.payload as unknown as InventoryChangedPayloadProbe;

    // Path A: `addItem` non-dispatch — payload has a top-level `item`.
    const directItem = payload.item;
    if (directItem && typeof directItem.name === 'string') {
        return `Picked up ${directItem.name}.`;
    }

    // Path B: dispatched action — payload.action.type tells us what.
    const actionType = payload.action?.type;
    if (actionType === 'USE_ITEM') {
        // The action payload carries `itemId`, not name; the engine
        // has already consumed the item from inventory by the time
        // the event fires, so a name lookup is brittle. Generic toast.
        return 'Used.';
    }
    if (actionType === 'EQUIP_ITEM') {
        const itemName = payload.action?.payload?.item?.name;
        return typeof itemName === 'string' ? `Equipped ${itemName}.` : 'Equipped.';
    }
    if (actionType === 'UNEQUIP_ITEM') {
        return 'Unequipped.';
    }

    return null;
}
