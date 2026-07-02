/**
 * Shop types — Phase 37.
 *
 * `ShopInventory` is an item catalogue keyed by `itemId` with a flat
 * price per ware. It rides on `VillagePayload.shop` so a `village`
 * MapEvent can declare its stock; the resolver forwards it onto the
 * resolved event without mutation. The buy / sell reducers in
 * `shop.reducer.ts` accept a price directly rather than re-resolving
 * against this catalogue — keeps the reducer dumb and lets a UI render
 * "shops buy at half" or any other policy externally.
 */

export interface ShopWare {
    /** Item catalogue id (e.g. an entry from `consumableLibrary`). */
    readonly itemId: string;
    /** Flat price in `Character.currency` units. Must be ≥ 0. */
    readonly price: number;
}

export interface ShopInventory {
    readonly wares: ReadonlyArray<ShopWare>;
}
