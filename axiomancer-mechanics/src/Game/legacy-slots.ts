/**
 * Old-save equipment-slot re-slotting.
 *
 * Old saves can carry up to 7 independent slots
 * (`weapon | armor | accessory | head | body | hands | feet`). This module is
 * the single, permanent source of truth for folding that old shape into the
 * 3-kind / 5-slot model (1 weapon + 1 armor + 3 accessories). It lives in the
 * Game (save) module deliberately: `LEGACY_SLOT_MAP` must stay so old-save
 * upgrades keep working. Nothing here depends on the procedural
 * template / affix / modifier libraries.
 */

import type { Equipment, EquipmentSlot, AccessoryKind } from '../Items/types';
import { SLOT_CAPACITY } from '../Items/types';
import type { EquipmentLoadout } from '../Character/types';
import { emptyLoadout } from '../Character/types';

/** The seven legacy slot literals. */
export type LegacySlot =
    | 'weapon' | 'armor' | 'accessory' | 'head' | 'body' | 'hands' | 'feet';

/** Where a legacy slot lands in the current model. */
export interface LegacySlotMapping {
    slot: EquipmentSlot;
    /** Set iff `slot === 'accessory'` — the kind the legacy slot becomes. */
    accessoryKind?: AccessoryKind;
}

/**
 * Fixed legacy → current slot mapping. `body` folds into `armor` (torso wear
 * is armor, not an accessory); `head`/`hands`/`feet` fold into `accessory` as
 * matching kinds; a generic legacy `accessory` becomes kind `charm`. `weapon`
 * and `armor` are unchanged.
 */
export const LEGACY_SLOT_MAP: Record<LegacySlot, LegacySlotMapping> = {
    weapon:    { slot: 'weapon' },
    armor:     { slot: 'armor' },
    body:      { slot: 'armor' },
    accessory: { slot: 'accessory', accessoryKind: 'charm' },
    head:      { slot: 'accessory', accessoryKind: 'head' },
    hands:     { slot: 'accessory', accessoryKind: 'hands' },
    feet:      { slot: 'accessory', accessoryKind: 'feet' },
};

/**
 * The order legacy accessory-family slots fill the 3 accessory positions when
 * migrating a worn record (decision 6): `accessory` first, then `head`,
 * `hands`, `feet`. The first 3 present stay worn; any remainder overflows.
 */
const ACCESSORY_FILL_ORDER: readonly LegacySlot[] = ['accessory', 'head', 'hands', 'feet'];

/**
 * Re-slot a single persisted `Equipment` instance to the current model:
 * rewrites `slot` via `LEGACY_SLOT_MAP` and assigns `accessoryKind` when the
 * result is an accessory (preserving any kind the instance already carries).
 * Non-accessory results have `accessoryKind` stripped. Pure.
 */
export function reslotLegacyEquipment(item: Equipment): Equipment {
    const mapping = LEGACY_SLOT_MAP[item.slot as LegacySlot] ?? { slot: item.slot };
    if (mapping.slot === 'accessory') {
        return {
            ...item,
            slot: 'accessory',
            accessoryKind: item.accessoryKind ?? mapping.accessoryKind ?? 'charm',
        };
    }
    const { accessoryKind: _drop, ...rest } = item;
    return { ...rest, slot: mapping.slot };
}

/**
 * Fold a legacy worn-equipment record into an `EquipmentLoadout`,
 * returning the loadout plus every piece that no longer fits (`overflow` — the
 * caller returns these to inventory). Deterministic (decision 6):
 *
 *   - `weapon` → the weapon slot.
 *   - `armor` wins the armor slot; if both `armor` and `body` are worn, the
 *     `body` occupant overflows. A lone `body` takes the armor slot.
 *   - accessories fill in fixed order `[accessory, head, hands, feet]`; the
 *     first 3 present stay worn, the rest overflow.
 *
 * Pure — the input record is not mutated.
 */
export function reslotLegacyLoadout(
    record: Partial<Record<LegacySlot, Equipment>>,
): { loadout: EquipmentLoadout; overflow: Equipment[] } {
    const loadout = emptyLoadout();
    const overflow: Equipment[] = [];

    if (record.weapon) loadout.weapon = reslotLegacyEquipment(record.weapon);

    if (record.armor) {
        loadout.armor = reslotLegacyEquipment(record.armor);
        if (record.body) overflow.push(reslotLegacyEquipment(record.body));
    } else if (record.body) {
        loadout.armor = reslotLegacyEquipment(record.body);
    }

    for (const legacySlot of ACCESSORY_FILL_ORDER) {
        const piece = record[legacySlot];
        if (!piece) continue;
        const reslotted = reslotLegacyEquipment(piece);
        if (loadout.accessories.length < SLOT_CAPACITY.accessory) {
            loadout.accessories.push(reslotted);
        } else {
            overflow.push(reslotted);
        }
    }

    return { loadout, overflow };
}
