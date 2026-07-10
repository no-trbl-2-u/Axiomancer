/**
 * Phase 21 — the procedural equipment library + rarity/affix system are retired.
 * The dev "loot rarity" buttons no longer roll rarity drops; each grants a signet
 * relic (the only equipment). These tests pin the new behavior.
 */
import {
    lootRarityItem,
    lootCommonItemAction,
    lootUncommonItemAction,
    lootRareItemAction,
    lootUniqueItemAction,
} from '../loot-rarity';
import { createAppStore } from '@/state/store';
import { isEquipment } from '@mechanics';

describe('loot-rarity dev helper (Phase 21 — grants signet relics)', () => {
    let store: ReturnType<typeof createAppStore>;

    beforeEach(() => {
        store = createAppStore();
    });

    it.each([
        ['common', lootCommonItemAction],
        ['uncommon', lootUncommonItemAction],
        ['rare', lootRareItemAction],
        ['unique', lootUniqueItemAction],
    ] as const)('the %s button grants a signet relic (rarity is meaningless now)', (_label, action) => {
        const before = store.getState().player.inventory?.length ?? 0;
        const result = action(store);

        expect(result.added).toBe(true);
        expect(result.name).toBeTruthy();
        expect(result.affixCount).toBe(0);
        expect(store.getState().player.inventory?.length ?? 0).toBe(before + 1);
        const inv = store.getState().player.inventory ?? [];
        const last = inv[inv.length - 1];
        expect(isEquipment(last) && last.id.startsWith('relic-')).toBe(true);
    });

    it('adds a relic regardless of the requested rarity (no level gate)', () => {
        store.setState({ player: { ...store.getState().player, level: 0 } });
        const before = store.getState().player.inventory?.length ?? 0;
        const result = lootRarityItem(store, 'rare');
        expect(result.added).toBe(true);
        expect(store.getState().player.inventory?.length ?? 0).toBe(before + 1);
    });
});
