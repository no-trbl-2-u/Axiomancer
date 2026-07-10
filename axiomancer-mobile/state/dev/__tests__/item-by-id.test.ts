import { addItemByIdAction } from '../item-by-id';
import { createAppStore } from '@/state/store';

describe('addItemByIdAction dev helper', () => {
    let store: ReturnType<typeof createAppStore>;

    beforeEach(() => {
        store = createAppStore();
    });

    it('rejects an empty id with a graceful reason and no inventory change', () => {
        const before = store.getState().player.inventory?.length ?? 0;
        const result = addItemByIdAction(store, '');

        expect(result.added).toBe(false);
        expect(result.kind).toBeNull();
        expect(result.name).toBeNull();
        expect(result.reason).toBe('enter an item id');
        expect(store.getState().player.inventory?.length ?? 0).toBe(before);
    });

    it('rejects a whitespace-only id and trims it for the report', () => {
        const result = addItemByIdAction(store, '   ');

        expect(result.added).toBe(false);
        expect(result.id).toBe('');
        expect(result.reason).toBe('enter an item id');
    });

    it('resolves a signet relic id and adds it (Phase 21 — relics are the only equipment)', () => {
        const before = store.getState().player.inventory?.length ?? 0;
        const result = addItemByIdAction(store, 'relic-overwhelming');

        expect(result.added).toBe(true);
        expect(result.kind).toBe('equipment');
        expect(result.name).toBeTruthy();
        expect(result.reason).toBeNull();
        expect(store.getState().player.inventory?.length ?? 0).toBe(before + 1);
    });

    it('resolves a consumable id and adds it', () => {
        const before = store.getState().player.inventory?.length ?? 0;
        const result = addItemByIdAction(store, 'healing-potion');

        expect(result.added).toBe(true);
        expect(result.kind).toBe('consumable');
        expect(result.name).toBeTruthy();
        expect(store.getState().player.inventory?.length ?? 0).toBe(before + 1);
    });

    it('trims surrounding whitespace before resolving a real id', () => {
        const result = addItemByIdAction(store, '  relic-overwhelming  ');

        expect(result.added).toBe(true);
        expect(result.id).toBe('relic-overwhelming');
        expect(result.kind).toBe('equipment');
    });

    it('returns a graceful failure for an unknown id with no inventory change', () => {
        const before = store.getState().player.inventory?.length ?? 0;
        const result = addItemByIdAction(store, 'not-a-real-item-id');

        expect(result.added).toBe(false);
        expect(result.kind).toBeNull();
        expect(result.name).toBeNull();
        expect(result.reason).toBe('unknown item id "not-a-real-item-id"');
        expect(store.getState().player.inventory?.length ?? 0).toBe(before);
    });
});
