/**
 * Hermetic e2e — shop economy (Phase 37).
 *
 * Drives the buy / sell reducers through the public surface they ride
 * on: the `village` MapEvent resolved by `resolveMapEvent` exposes a
 * `shop` field carrying authored wares, and a UI consumer (or the CLI)
 * dispatches `buyItem` / `sellItem` against the resulting character.
 *
 * Unit-level invariants live in `src/Items/shop.reducer.test.ts`; this
 * file pins the end-to-end shape: village resolves → shop surfaces →
 * buy decrements currency + grants a fresh `Consumable` instance →
 * sell rolls it back.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { resolveMapEvent } from '../../World/MapEvents/resolve-map-event';
import { mockSequentialRng } from '../../test-utils/rng';
import { createStartingWorld } from '../../World';
import { createNewGameState } from '../../Game/game.reducer';
import { getMapDefinition, createMapState } from '../../World/map.registry';
import { getConsumableById } from '../consumable.library';
import { buyItem, sellItem } from '../shop.reducer';
import { createCharacter } from '../../Character';
import type { GameState } from '../../Game/types';
import type { MapState } from '../../World/types';
import type { Consumable } from '../types';

// Pool registration lives in `content.ts`; import for side effect.
import '../../World/MapEvents/content';

// The starting map (fishing-village) is now a combat gauntlet with no shop;
// the surviving authored village/shop is northern-forest's Glen Market (nf-8).
function freshWorldAt(
    mapName: 'fishing-village' | 'northern-forest' = 'northern-forest',
    nodeId = 'nf-8',
): GameState {
    const base: GameState = { ...createNewGameState(), world: createStartingWorld() };
    const def = getMapDefinition('coastal-continent', mapName);
    const map: MapState = createMapState(def);
    const player = createCharacter({
        id: 'char-shopper',
        name: 'Shopper',
        level: 1,
        baseStats: { heart: 3, body: 3, mind: 3 },
        currency: 100,
    });
    return {
        ...base,
        world: { ...base.world, currentMap: { ...map, currentNode: nodeId } },
        player,
    };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Phase 37 — shop economy through resolveMapEvent', () => {
    it('village resolution surfaces the authored shop on the event', () => {
        mockSequentialRng(0.5);
        const state = freshWorldAt('northern-forest', 'nf-8');
        const result = resolveMapEvent(state);

        expect(result.event.kind).toBe('village');
        if (result.event.kind !== 'village') return;

        expect(result.event.shop).toBeDefined();
        const wares = result.event.shop!.wares;
        expect(wares.length).toBeGreaterThan(0);
        const ids = wares.map(w => w.itemId);
        expect(ids).toContain('minor-healing-potion');
    });

    it('buy / sell round-trip through a shop ware leaves the character net even', () => {
        mockSequentialRng(0.5);
        const state = freshWorldAt('northern-forest', 'nf-8');
        const result = resolveMapEvent(state);
        if (result.event.kind !== 'village' || !result.event.shop) {
            throw new Error('nf-8 village must carry a shop');
        }

        const ware = result.event.shop.wares.find(w => w.itemId === 'minor-healing-potion');
        expect(ware).toBeDefined();
        const item = getConsumableById(ware!.itemId)!;

        const startingCurrency = result.state.player.currency;
        const afterBuy = buyItem(result.state.player, item, ware!.price);
        expect(afterBuy.currency).toBe(startingCurrency - ware!.price);
        expect(afterBuy.inventory.some(i => i.id === 'minor-healing-potion')).toBe(true);

        // Sell the same item back at the same price; net should be zero.
        const afterSell = sellItem(afterBuy, 'minor-healing-potion', ware!.price);
        expect(afterSell.currency).toBe(startingCurrency);
        expect(afterSell.inventory.some(i => i.id === 'minor-healing-potion')).toBe(false);
    });

    it('buying with insufficient currency leaves the resolved character untouched', () => {
        mockSequentialRng(0.5);
        const state = freshWorldAt('northern-forest', 'nf-8');
        const broke: GameState = { ...state, player: { ...state.player, currency: 0 } };
        const result = resolveMapEvent(broke);
        if (result.event.kind !== 'village' || !result.event.shop) {
            throw new Error('nf-8 village must carry a shop');
        }
        const ware = result.event.shop.wares[0];
        const item = getConsumableById(ware.itemId)!;
        const after = buyItem(result.state.player, item, ware.price);
        expect(after).toBe(result.state.player);
    });

    it('purchased items are deep-cloned — mutating one does not bleed into the catalogue', () => {
        mockSequentialRng(0.5);
        const state = freshWorldAt('northern-forest', 'nf-8');
        const result = resolveMapEvent(state);
        if (result.event.kind !== 'village' || !result.event.shop) {
            throw new Error('nf-8 village must carry a shop');
        }
        const ware = result.event.shop.wares.find(w => w.itemId === 'minor-healing-potion')!;
        const item = getConsumableById(ware.itemId)!;
        const original = item.quantity;

        const bought = buyItem(result.state.player, item, ware.price);
        const inInventory = bought.inventory.find(i => i.id === 'minor-healing-potion') as Consumable;
        inInventory.quantity = 99;

        // The catalogue entry was not mutated.
        const catalogueAgain = getConsumableById('minor-healing-potion')!;
        expect(catalogueAgain.quantity).toBe(original);
    });
});
