import {
    lootRarityItem,
    lootCommonItemAction,
    lootUncommonItemAction,
    lootRareItemAction,
    lootUniqueItemAction,
} from '../loot-rarity';
import { createAppStore } from '@/state/store';
import type { Equipment } from 'axiomancer-mechanics';

describe('loot-rarity dev helper', () => {
    let store: ReturnType<typeof createAppStore>;

    beforeEach(() => {
        store = createAppStore();
    });

    it('loots a real common drop with exactly zero modifiers', () => {
        const before = store.getState().player.inventory?.length ?? 0;
        const result = lootCommonItemAction(store);

        expect(result.added).toBe(true);
        expect(result.rarity).toBe('common');
        expect(result.name).toBeTruthy();
        expect(result.affixCount).toBe(0);
        expect(store.getState().player.inventory?.length ?? 0).toBe(before + 1);
    });

    it('loots a real uncommon drop with exactly one modifier', () => {
        const before = store.getState().player.inventory?.length ?? 0;
        const result = lootUncommonItemAction(store);

        expect(result.added).toBe(true);
        expect(result.rarity).toBe('uncommon');
        expect(result.name).toBeTruthy();
        expect(result.affixCount).toBe(1);
        expect(store.getState().player.inventory?.length ?? 0).toBe(before + 1);
    });

    it('loots a real rare drop with exactly two modifiers', () => {
        const before = store.getState().player.inventory?.length ?? 0;
        const result = lootRareItemAction(store);

        expect(result.added).toBe(true);
        expect(result.rarity).toBe('rare');
        expect(result.name).toBeTruthy();
        expect(result.affixCount).toBe(2);
        expect(store.getState().player.inventory?.length ?? 0).toBe(before + 1);
    });

    it('loots a unique relic with exactly three fixed modifiers', () => {
        // Uniques gate behind a required level; lift the player so a
        // relic is eligible.
        store.setState({ player: { ...store.getState().player, level: 30 } });
        const before = store.getState().player.inventory?.length ?? 0;
        const result = lootUniqueItemAction(store);

        expect(result.added).toBe(true);
        expect(result.rarity).toBe('unique');
        expect(result.name).toBeTruthy();
        expect(result.affixCount).toBe(3);
        expect(store.getState().player.inventory?.length ?? 0).toBe(before + 1);
        const inv = store.getState().player.inventory ?? [];
        expect((inv[inv.length - 1] as Equipment).rarity).toBe('unique');
    });

    it('adds the generated item at the requested engine rarity', () => {
        lootRarityItem(store, 'rare');
        const inv = store.getState().player.inventory ?? [];
        const last = inv[inv.length - 1] as Equipment;
        expect(last.rarity).toBe('rare');
    });

    it('returns a graceful failure when no base template is level-eligible', () => {
        store.setState({
            player: { ...store.getState().player, level: 0 },
        });
        const before = store.getState().player.inventory?.length ?? 0;
        const result = lootRarityItem(store, 'uncommon');

        expect(result.added).toBe(false);
        expect(result.name).toBeNull();
        expect(result.affixCount).toBeNull();
        expect(result.reason).toBeTruthy();
        expect(store.getState().player.inventory?.length ?? 0).toBe(before);
    });
});
