/**
 * SATCHEL × the first-node relic grant.
 *
 * The owner's finding was "new players start with no items". The satchel was
 * never empty — this file pins that, and pins what the player now actually
 * SEES when the run's first node hands over the Suppliant's Ring.
 *
 * Presenter-level, not a render test: the SATCHEL screen consumes
 * `selectInventoryViewModel` unconditionally (`app/(tabs)/inventory/index.tsx`
 * feeds `vm.items` / `vm.equipmentDock` straight into `<ItemGrid>` /
 * `<EquipmentDock>`, and `<ItemGrid>` only swaps in the empty-sack placeholder
 * on `vm.isEmpty`), so the view-model is where "what the satchel shows" is
 * decided.
 */

import { describe, it, expect } from '@jest/globals';

import { grantFirstNodeRelic, FIRST_NODE_RELIC_ID, STAND_IN_RELIC_ID } from '@mechanics';
import type { GameState } from '@mechanics';

import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { selectInventoryViewModel } from '@/state/presenters/inventory.engine';

const RING_NAME = "Suppliant's Ring";

function freshStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function vmOf(store: AppStore) {
    return selectInventoryViewModel(store.getState(), {});
}

function settleGrant(store: AppStore) {
    const state = store.getState() as unknown as GameState;
    const result = grantFirstNodeRelic(state.player, state.flags);
    store.setState({ player: result.character, flags: [...result.flags] } as never);
    return result;
}

describe('SATCHEL — a brand-new run', () => {
    it('is not empty: the starting relics render as real rows', () => {
        const vm = vmOf(freshStore());
        expect(vm.isEmpty).toBe(false);
        expect(vm.items.length).toBeGreaterThan(0);
        expect(vm.tabs.find(t => t.key === 'all')?.count).toBe(vm.items.length);
    });

    it('wears a full five-relic loadout in the dock, with no bare slot', () => {
        const vm = vmOf(freshStore());
        expect(vm.equipmentDock.slots).toHaveLength(5);
        for (const slot of vm.equipmentDock.slots) {
            expect(slot.item).not.toBeNull();
        }
    });

    it('does not yet carry the ring — that is the first node\'s to give', () => {
        const vm = vmOf(freshStore());
        expect(vm.items.map(i => i.id)).not.toContain(FIRST_NODE_RELIC_ID);
        expect(vm.equipmentDock.slots.map(s => s.item?.id)).not.toContain(FIRST_NODE_RELIC_ID);
    });
});

describe('SATCHEL — after the first node grants the ring', () => {
    it('renders the Suppliant\'s Ring as a worn row naming what it grants', () => {
        const store = freshStore();
        const result = settleGrant(store);
        expect(result.reason).toBe('granted');

        const row = vmOf(store).items.find(i => i.id === FIRST_NODE_RELIC_ID);
        expect(row).toBeDefined();
        expect(row!.name).toBe(RING_NAME);
        expect(row!.equipped).toBe(true);
        expect(row!.category).toBe('equipment');
        // The signature is the point of the relic — the row must say so.
        expect(row!.grantsSignature).toBe('The Open Hand');
    });

    it('shows the ring on the body, in a trinket slot', () => {
        const store = freshStore();
        settleGrant(store);

        const dockIds = vmOf(store).equipmentDock.slots.map(s => s.item?.id);
        expect(dockIds).toContain(FIRST_NODE_RELIC_ID);
    });

    it('returns the displaced relic to the sack rather than destroying it', () => {
        const store = freshStore();
        const before = vmOf(store);
        const result = settleGrant(store);
        const after = vmOf(store);

        expect(result.displaced?.id).toBe(STAND_IN_RELIC_ID);
        expect(after.items.length).toBe(before.items.length + 1);

        const displacedRow = after.items.find(i => i.id === STAND_IN_RELIC_ID);
        expect(displacedRow).toBeDefined();
        expect(displacedRow!.equipped).toBe(false);
        expect(after.equipmentDock.slots.map(s => s.item?.id)).not.toContain(STAND_IN_RELIC_ID);
    });

    it('keeps the dock and the engine loadout telling the same story', () => {
        // The dock reads worn-state positionally off `inventory`; combat reads
        // `player.equipment`. A disagreement here is two screens lying about
        // one save.
        const store = freshStore();
        settleGrant(store);

        const vm = vmOf(store);
        const loadout = (store.getState() as unknown as GameState).player.equipment;
        const dockAccessories = vm.equipmentDock.slots
            .filter(s => s.key === 'accessory')
            .map(s => s.item?.id)
            .filter((id): id is string => typeof id === 'string');

        expect(dockAccessories).toEqual(loadout.accessories.map(a => a.id));
        expect(vm.equipmentDock.slots.find(s => s.key === 'weapon')?.item?.id)
            .toBe(loadout.weapon?.id);
        expect(vm.equipmentDock.slots.find(s => s.key === 'armor')?.item?.id)
            .toBe(loadout.armor?.id);
    });

    it('the GEAR tab count keeps up with the grant', () => {
        const store = freshStore();
        const before = vmOf(store).tabs.find(t => t.key === 'equipment')!.count;
        settleGrant(store);
        const after = vmOf(store).tabs.find(t => t.key === 'equipment')!.count;
        expect(after).toBe(before + 1);
    });

    it('is settled once — a second pass changes nothing on screen', () => {
        const store = freshStore();
        settleGrant(store);
        const once = vmOf(store);
        const again = settleGrant(store);
        const twice = vmOf(store);

        expect(again.reason).toBe('already-settled');
        expect(twice.items.map(i => i.id)).toEqual(once.items.map(i => i.id));
        expect(twice.items.filter(i => i.id === FIRST_NODE_RELIC_ID)).toHaveLength(1);
    });
});
