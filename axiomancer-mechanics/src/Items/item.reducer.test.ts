import { describe, it, expect } from 'vitest';
import { addItem, removeItem, useConsumable, stackItem } from './item.reducer';
import { Consumable, Item } from './types';

const empty = (): Item[] => [];
const potion: Consumable = { id: 'hp1', name: 'Potion', description: '', category: 'consumable', healAmount: 10, quantity: 3 };

describe('addItem', () => {
    it('adds item', () => {
        const inv = addItem(empty(), potion);
        expect(inv).toHaveLength(1);
        expect(inv[0].id).toBe('hp1');
    });
});

describe('removeItem', () => {
    it('removes by id', () => {
        const inv = addItem(empty(), potion);
        expect(removeItem(inv, 'hp1')).toHaveLength(0);
    });
});

describe('useConsumable', () => {
    it('decrements quantity', () => {
        const inv = addItem(empty(), potion);
        const after = useConsumable(inv, 'hp1');
        expect((after[0] as Consumable).quantity).toBe(2);
    });
    it('removes when last one', () => {
        const inv = addItem(empty(), { ...potion, quantity: 1 });
        const after = useConsumable(inv, 'hp1');
        expect(after).toHaveLength(0);
    });
    it('no-op when item does not exist', () => {
        const inv = empty();
        expect(useConsumable(inv, 'nonexistent')).toBe(inv);
    });
});

describe('duplicate rows of one consumable (RC walk, leg 2)', () => {
    // Saves written before the map-event grants stacked hold the same potion
    // as two rows of quantity 1. Drinking one must leave the other.
    const twoRows = (): Item[] => [{ ...potion, quantity: 1 }, { ...potion, quantity: 1 }];

    it('removeItem takes only the first matching row', () => {
        expect(removeItem(twoRows(), 'hp1')).toHaveLength(1);
    });

    it('useConsumable spends one potion, not every row', () => {
        const after = useConsumable(twoRows(), 'hp1');
        expect(after).toHaveLength(1);
        expect((after[0] as Consumable).quantity).toBe(1);
    });
});

describe('stackItem', () => {
    it('increases quantity', () => {
        const inv = addItem(empty(), potion);
        const after = stackItem(inv, 'hp1', 5);
        expect((after[0] as Consumable).quantity).toBe(8);
    });
});
