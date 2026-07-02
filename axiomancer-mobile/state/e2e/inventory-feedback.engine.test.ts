/**
 * Hermetic unit tests for `selectInventoryToast` (Phase 29 Tick B).
 *
 * The presenter is a pure mapper; tests construct synthetic
 * `inventory:changed` events that mirror the runtime payload shapes
 * the engine actually emits (see `state/presenters/inventory-feedback.engine.ts`
 * header for the shape catalog). Other event kinds and malformed
 * payloads must yield `null` so the screen stays silent rather than
 * showing a misleading toast.
 */

import type { GameEvent } from 'axiomancer-mechanics';
import { selectInventoryToast } from '@/state/presenters/inventory-feedback.engine';

/** Cheap synthetic event factory — typed loosely on purpose. */
function makeInventoryEvent(payload: unknown): GameEvent {
    return { type: 'inventory:changed', payload } as unknown as GameEvent;
}

describe('selectInventoryToast', () => {
    it('returns "Picked up <name>." for the addItem non-dispatch payload shape', () => {
        const event = makeInventoryEvent({
            item: { id: 'potion-1', name: 'Iron Tonic' },
            state: {},
        });
        expect(selectInventoryToast(event)).toBe('Picked up Iron Tonic.');
    });

    it('returns "Used." for a USE_ITEM dispatched action', () => {
        const event = makeInventoryEvent({
            action: { type: 'USE_ITEM', payload: { itemId: 'potion-1' } },
            state: {},
        });
        expect(selectInventoryToast(event)).toBe('Used.');
    });

    it('returns "Equipped <name>." for an EQUIP_ITEM dispatched action carrying the item name', () => {
        const event = makeInventoryEvent({
            action: {
                type: 'EQUIP_ITEM',
                payload: { item: { id: 'sword-1', name: 'Ash Blade' } },
            },
            state: {},
        });
        expect(selectInventoryToast(event)).toBe('Equipped Ash Blade.');
    });

    it('falls back to generic "Equipped." when EQUIP_ITEM lacks an item name', () => {
        const event = makeInventoryEvent({
            action: { type: 'EQUIP_ITEM', payload: {} },
            state: {},
        });
        expect(selectInventoryToast(event)).toBe('Equipped.');
    });

    it('returns "Unequipped." for an UNEQUIP_ITEM dispatched action', () => {
        const event = makeInventoryEvent({
            action: { type: 'UNEQUIP_ITEM', payload: { slot: 'mainHand' } },
            state: {},
        });
        expect(selectInventoryToast(event)).toBe('Unequipped.');
    });

    it('returns null when the payload lacks both item and action', () => {
        const event = makeInventoryEvent({ state: {} });
        expect(selectInventoryToast(event)).toBeNull();
    });

    it('returns null for unrelated event types (no false toasts)', () => {
        const event = {
            type: 'combat:started',
            payload: { enemy: { name: 'Test Foe' }, state: {} },
        } as unknown as GameEvent;
        expect(selectInventoryToast(event)).toBeNull();
    });

    it('returns null for an unrecognized action type within inventory:changed', () => {
        const event = makeInventoryEvent({
            action: { type: 'MYSTERY_ACTION', payload: {} },
            state: {},
        });
        expect(selectInventoryToast(event)).toBeNull();
    });
});
