/**
 * Inventory reducers — pure functions over an `Item[]` array.
 *
 * Earlier these took the full GameState; that coupled item logic to the
 * shape of the root state. Operating on an inventory array keeps these
 * helpers reusable from the Game store, the Combat module, or any UI
 * layer that holds its own copy.
 */

import { Item, isConsumable, isMaterial } from './types';

/** Appends an item to the inventory. */
export function addItem(inventory: Item[], item: Item): Item[] {
    return [...inventory, item];
}

/** Removes the first item with the matching ID from the inventory. */
export function removeItem(inventory: Item[], itemId: string): Item[] {
    return inventory.filter(item => item.id !== itemId);
}

/**
 * Uses one charge of a consumable. If the consumable was the last in its
 * stack, the entry is removed entirely. No-op if the item is not a consumable.
 */
export function useConsumable(inventory: Item[], itemId: string): Item[] {
    const item = inventory.find(i => i.id === itemId);
    if (!item || !isConsumable(item)) return inventory;

    if (item.quantity <= 1) {
        return removeItem(inventory, itemId);
    }
    return inventory.map(i =>
        i.id === itemId && isConsumable(i)
            ? { ...i, quantity: i.quantity - 1 }
            : i,
    );
}

/** Increases the quantity of a stackable item (consumable or material). */
export function stackItem(inventory: Item[], itemId: string, amount: number): Item[] {
    return inventory.map(item => {
        if (item.id !== itemId) return item;
        if (isConsumable(item) || isMaterial(item)) {
            return { ...item, quantity: item.quantity + amount };
        }
        return item;
    });
}

// Legacy aliases used by older tests / callers.
export const addItemToInventory = addItem;
export const removeItemFromInventory = removeItem;
