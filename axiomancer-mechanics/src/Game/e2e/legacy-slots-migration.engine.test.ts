/**
 * Hermetic E2E — Phase 18 legacy slot re-slotting + v11 → v12 save migration.
 *
 * `LEGACY_SLOT_MAP` / `reslotLegacyEquipment` / `reslotLegacyLoadout` fold the
 * old 7-slot shape into the 5-slot loadout; `migrate` applies the whole
 * transform to a v11 save (body loses to armor, fixed accessory order, overflow
 * to inventory, item slot strings re-mapped).
 */

import { describe, it, expect } from 'vitest';

import {
    reslotLegacyEquipment, reslotLegacyLoadout, LEGACY_SLOT_MAP,
    migrate, createNewGameState,
} from '../index';
import { getEquippedItems } from '../../Character';
import type { Equipment } from '../../Items/types';
import type { StatModifier } from '../../Effects/types';
import type { LegacySlot } from '../index';

/** Build a legacy-shaped Equipment instance (slot may be a pre-Phase-18 kind). */
function legacy(id: string, slot: LegacySlot, maxHp = 0): Equipment {
    const statModifiers: StatModifier[] = maxHp ? [{ stat: 'maxHp', value: maxHp }] : [];
    return {
        id, name: id, description: '', category: 'equipment',
        slot: slot as Equipment['slot'], statModifiers,
    };
}

describe('Phase 18 — reslotLegacyEquipment', () => {
    it('maps head/hands/feet to accessory kinds and body to armor', () => {
        expect(reslotLegacyEquipment(legacy('h', 'head'))).toMatchObject({ slot: 'accessory', accessoryKind: 'head' });
        expect(reslotLegacyEquipment(legacy('g', 'hands'))).toMatchObject({ slot: 'accessory', accessoryKind: 'hands' });
        expect(reslotLegacyEquipment(legacy('b', 'feet'))).toMatchObject({ slot: 'accessory', accessoryKind: 'feet' });
        expect(reslotLegacyEquipment(legacy('coat', 'body'))).toMatchObject({ slot: 'armor' });
        expect(reslotLegacyEquipment(legacy('coat', 'body')).accessoryKind).toBeUndefined();
    });

    it('gives a generic legacy accessory the charm kind', () => {
        expect(reslotLegacyEquipment(legacy('trinket', 'accessory'))).toMatchObject({ slot: 'accessory', accessoryKind: 'charm' });
    });

    it('LEGACY_SLOT_MAP is total over the 7 legacy slots', () => {
        expect(Object.keys(LEGACY_SLOT_MAP).sort()).toEqual(
            ['accessory', 'armor', 'body', 'feet', 'hands', 'head', 'weapon'],
        );
    });
});

describe('Phase 18 — reslotLegacyLoadout', () => {
    it('armor wins the armor slot; body overflows', () => {
        const { loadout, overflow } = reslotLegacyLoadout({
            armor: legacy('plate', 'armor'),
            body: legacy('coat', 'body'),
        });
        expect(loadout.armor?.id).toBe('plate');
        expect(overflow.map(i => i.id)).toEqual(['coat']);
    });

    it('a lone body takes the armor slot', () => {
        const { loadout } = reslotLegacyLoadout({ body: legacy('coat', 'body') });
        expect(loadout.armor?.id).toBe('coat');
    });

    it('fills accessories in fixed order [accessory, head, hands, feet]; the 4th overflows', () => {
        const { loadout, overflow } = reslotLegacyLoadout({
            head: legacy('helm', 'head'),
            hands: legacy('gaunt', 'hands'),
            feet: legacy('boots', 'feet'),
            accessory: legacy('ring', 'accessory'),
        });
        // ring (accessory) first, then head, hands — feet overflows.
        expect(loadout.accessories.map(i => i.id)).toEqual(['ring', 'helm', 'gaunt']);
        expect(overflow.map(i => i.id)).toEqual(['boots']);
    });
});

describe('Phase 18 — migrate v11 → v12', () => {
    function v11Save() {
        const state = createNewGameState();
        // Downgrade to a v11-shaped payload: legacy record equipment + legacy
        // inventory equipment, worn record over-filled to force overflow.
        const raw = {
            ...state,
            version: 11,
            player: {
                ...state.player,
                equipment: {
                    weapon: legacy('sword', 'weapon'),
                    armor: legacy('plate', 'armor'),
                    body: legacy('coat', 'body', 3),
                    head: legacy('helm', 'head'),
                    hands: legacy('gaunt', 'hands'),
                    feet: legacy('boots', 'feet'),
                    accessory: legacy('ring', 'accessory'),
                },
                inventory: [legacy('spare-cap', 'head')],
            },
        };
        return raw as unknown;
    }

    it('folds the legacy record into a loadout', () => {
        // Pin toVersion=12 to exercise the Phase-18 hop in isolation; the
        // Phase-19 v12→v13 relic seeding (which would replace this loadout) is
        // covered separately in the relic-library migration test.
        const migrated = migrate(v11Save(), 11, 12);
        expect(migrated.version).toBe(12);

        const loadout = migrated.player.equipment;
        expect(loadout.weapon?.id).toBe('sword');
        expect(loadout.armor?.id).toBe('plate');           // armor wins over body
        expect(loadout.accessories.length).toBe(3);
        // worn set is exactly 5 pieces (1 weapon + 1 armor + 3 accessories).
        expect(getEquippedItems(loadout).length).toBe(5);
    });

    it('returns worn overflow (body + 4th accessory) and re-slots inventory equipment', () => {
        const migrated = migrate(v11Save(), 11, 12);
        const invIds = migrated.player.inventory.map(i => i.id);
        // coat (body loses to armor) and one accessory overflow land in inventory,
        // alongside the pre-existing spare-cap (re-slotted to accessory).
        expect(invIds).toContain('coat');
        const spare = migrated.player.inventory.find(i => i.id === 'spare-cap') as Equipment;
        expect(spare.slot).toBe('accessory');
        expect(spare.accessoryKind).toBe('head');
    });

    it('still rejects an unsupported (non-v11) version', () => {
        expect(() => migrate({ version: 9 }, 9)).toThrow(/not supported/);
    });
});
