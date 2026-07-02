/**
 * Equip-change delta — hermetic E2E tests (Phase 154).
 *
 * Pins the three delta modes (equip / unequip / swap), the deltas-only
 * contract, structured affix-keyword surfacing, and the engine-simulated stat
 * diff. Hermetic: builds characters/equipment in-line, no mocks.
 */

import { describe, it, expect } from 'vitest';

import { createCharacter } from '../index';
import { computeEquipDelta } from '../equip-delta';
import type { Equipment } from '../../Items/types';

const buildPlayer = () =>
    createCharacter({ name: 'TestPlayer', level: 5, baseStats: { heart: 4, body: 3, mind: 2 } });

function makeEquipment(id: string, extra: Partial<Equipment> = {}): Equipment {
    return {
        id,
        name: id,
        description: '',
        category: 'equipment',
        slot: 'weapon',
        rarity: 'common',
        requiredLevel: 1,
        ...extra,
    };
}

describe('computeEquipDelta', () => {
    it('equip into an empty slot → mode equip, gained only', () => {
        const candidate = makeEquipment('blade', {
            statModifiers: [{ stat: 'physicalAttack', value: 3 }],
        });
        const d = computeEquipDelta(candidate, null, buildPlayer());
        expect(d.mode).toBe('equip');
        expect(d.against).toBeNull();
        expect(d.lost).toMatchObject({ modifiers: [], keywords: [] });
        expect(d.stats.some((s) => s.delta > 0)).toBe(true);
    });

    it('unequip the worn item → mode unequip, lost only', () => {
        const worn = makeEquipment('blade', { statModifiers: [{ stat: 'physicalAttack', value: 3 }] });
        const d = computeEquipDelta(worn, worn, buildPlayer());
        expect(d.mode).toBe('unequip');
        expect(d.against).toEqual({ id: 'blade', name: 'blade' });
        expect(d.gained).toMatchObject({ modifiers: [], keywords: [] });
    });

    it('swap → mode swap, against the worn sibling', () => {
        const worn = makeEquipment('old', { statModifiers: [{ stat: 'physicalAttack', value: 1 }] });
        const candidate = makeEquipment('new', { statModifiers: [{ stat: 'physicalAttack', value: 4 }] });
        const d = computeEquipDelta(candidate, worn, buildPlayer());
        expect(d.mode).toBe('swap');
        expect(d.against).toEqual({ id: 'old', name: 'old' });
    });

    it('surfaces structured prefix/suffix affixes as keyword deltas', () => {
        const candidate = makeEquipment('keen-blade', {
            prefixName: 'Keen',
            suffixName: 'of Clarity',
        });
        const d = computeEquipDelta(candidate, null);
        const labels = d.gained.keywords.map((k) => k.label).sort();
        expect(labels).toEqual(['Keen', 'of Clarity']);
    });

    it('is empty when nothing changes (identical worn item, no player)', () => {
        const item = makeEquipment('plain');
        const d = computeEquipDelta(item, item);
        expect(d.mode).toBe('unequip');
        expect(d.isEmpty).toBe(true);
    });
});
