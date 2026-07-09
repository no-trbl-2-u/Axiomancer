/**
 * Hermetic E2E — Phase 18 preset loadouts are legal.
 *
 * Every character/ladder preset must build a `Character` whose worn loadout
 * obeys the 5-slot cap (≤1 weapon, ≤1 armor, ≤3 accessories) and returns any
 * overflow to inventory rather than dropping it.
 */

import { describe, it, expect } from 'vitest';

import { characterPresets, levelLadderPresets, buildCharacterFromPreset } from '../index';
import { getEquippedItems } from '../equipment.reducer';
import { SLOT_CAPACITY, isEquipment } from '../../Items/types';

const allPresets = [...characterPresets, ...levelLadderPresets];
const seeded = () => { let s = 1; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; };

describe('Phase 18 — preset loadouts', () => {
    it.each(allPresets.map(p => [p.id, p] as const))('%s builds a legal loadout', (_id, preset) => {
        const c = buildCharacterFromPreset(preset, seeded());
        const l = c.equipment;
        expect(l.accessories.length).toBeLessThanOrEqual(SLOT_CAPACITY.accessory);
        expect(getEquippedItems(l).length).toBeLessThanOrEqual(5);
        // Every worn accessory carries a kind; weapon/armor never do.
        for (const a of l.accessories) expect(a.accessoryKind).toBeDefined();
        if (l.weapon) expect(l.weapon.slot).toBe('weapon');
        if (l.armor) expect(l.armor.slot).toBe('armor');
    });

    it('overflow gear seeds the inventory (L50 ladder wears 5, benches the rest)', () => {
        const l50 = levelLadderPresets.find(p => p.id === 'kid-l50')!;
        const c = buildCharacterFromPreset(l50, seeded());
        // 7 declared pieces → 5 worn, 2 benched among the inventory equipment.
        expect(getEquippedItems(c.equipment).length).toBe(5);
        const benchedEquipment = c.inventory.filter(isEquipment);
        expect(benchedEquipment.length).toBeGreaterThanOrEqual(2);
    });
});
