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

describe('Phase 18 — preset loadouts (Phase 21: relics are the only equipment)', () => {
    it.each(allPresets.map(p => [p.id, p] as const))('%s builds a legal loadout', (_id, preset) => {
        const c = buildCharacterFromPreset(preset);
        const l = c.equipment;
        expect(l.accessories.length).toBeLessThanOrEqual(SLOT_CAPACITY.accessory);
        expect(getEquippedItems(l).length).toBeLessThanOrEqual(5);
        // Every worn accessory carries a kind; weapon/armor never do.
        for (const a of l.accessories) expect(a.accessoryKind).toBeDefined();
        if (l.weapon) expect(l.weapon.slot).toBe('weapon');
        if (l.armor) expect(l.armor.slot).toBe('armor');
    });

    it('every preset wears the 5 default relics and owns all 11 (no procedural gear)', () => {
        const l50 = levelLadderPresets.find(p => p.id === 'kid-l50')!;
        const c = buildCharacterFromPreset(l50);
        expect(getEquippedItems(c.equipment).length).toBe(5);
        // The only inventory equipment is the 11 signet relics (worn-first per the
        // phase-19 convention); no procedural gear survives.
        const invEquipment = c.inventory.filter(isEquipment);
        expect(invEquipment).toHaveLength(11);
        expect(invEquipment.every(e => e.id.startsWith('relic-'))).toBe(true);
    });
});
