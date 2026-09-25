/**
 * Equipment reducers — pure transitions over a `Character` for `equipItem`
 * and `unequipItem`, plus `wornMaxHpBonus`, the one stat fold equipment
 * still performs.
 *
 * Design notes:
 *
 * - The only equipment stat line is `maxHp` (the two armor relics' +5 max
 *   VITAE), folded onto `Character.maxHealth` at equip-time. TRIM THE FAT T2a
 *   (D14) deleted the derived-stat recompute this module used to run on every
 *   equip — derived stats no longer exist and the relics' body / mind / heart
 *   bumps were cut.
 * - Equipment is DECOUPLED FROM EFFECTS (phases 20-23). Equipping/unequipping
 *   applies no effect to `Character.effects`; `statModifiers` (now `maxHp`
 *   only) and `grantsSignature` are the SOLE channels from equipment to the
 *   character.
 */

import { Character, EquipmentLoadout } from './types';
import { Equipment, EquipmentSlot, SLOT_CAPACITY } from '../Items/types';
import { StatModifier } from '../Effects/types';

/**
 * Summed worn `maxHp` bonus (Phase 19): the flat `{ stat: 'maxHp' }` lines of
 * every worn item. Folded onto `Character.maxHealth` by `withLoadout`, and by
 * stat allocation / level-up so a rebuilt `maxHealth` keeps the relic bonus.
 *
 * @param loadout - The worn equipment.
 * @returns The total max-VITAE bonus from worn equipment (0 when none).
 */
export function wornMaxHpBonus(loadout: EquipmentLoadout): number {
    let total = 0;
    for (const piece of getEquippedItems(loadout)) {
        for (const mod of piece.statModifiers ?? []) {
            if (mod.stat === 'maxHp') total += mod.value;
        }
    }
    return total;
}

/**
 * Rebuilds a `Character` around a new loadout: folds the worn `maxHp` delta
 * onto `maxHealth` (growing/clamping current `health` by the same delta,
 * mirroring the stat-allocation HP convention). Shared tail for
 * equip/unequip.
 */
function withLoadout(
    character: Character,
    nextLoadout: EquipmentLoadout,
): Character {
    // `character.maxHealth` already includes the previous loadout's bonus, so
    // the delta is exact and idempotent. Equipping a +maxHp armor relic grows
    // current health by the same delta; unequipping lowers maxHealth and
    // clamps health down.
    const hpDelta = wornMaxHpBonus(nextLoadout) - wornMaxHpBonus(character.equipment);
    const nextMaxHealth = character.maxHealth + hpDelta;
    const nextHealth = Math.max(0, Math.min(character.health + hpDelta, nextMaxHealth));

    return {
        ...character,
        equipment: nextLoadout,
        maxHealth: nextMaxHealth,
        health:    nextHealth,
    };
}

/**
 * Equips `item` into its slot kind (Phase 18):
 *
 * - **weapon / armor** — replace in place (today's semantics). We don't return
 *   the displaced piece here; callers that need it back in `inventory` chain
 *   `unequipItem` + `addItem` first, per the existing convention.
 * - **accessory** — fills the first free accessory position. When all 3 are
 *   full, a passed `replaceIndex` (0-2) swaps that position; without it the
 *   equip is a **guarded no-op** (returns the same character reference — the
 *   caller surfaces "accessory slots full"), never a throw or silent replace.
 *
 * Pure — returns a new `Character` (or the same reference on the full no-op).
 */
export function equipItem(
    character: Character,
    item: Equipment,
    opts?: { replaceIndex?: number },
): Character {
    const loadout = character.equipment;
    const slot = item.slot;

    if (slot === 'weapon') {
        return withLoadout(character, { ...loadout, weapon: item });
    }
    if (slot === 'armor') {
        return withLoadout(character, { ...loadout, armor: item });
    }

    // accessory
    const acc = loadout.accessories;
    if (acc.length < SLOT_CAPACITY.accessory) {
        return withLoadout(character, { ...loadout, accessories: [...acc, item] });
    }
    // Full row: honour an explicit replaceIndex, otherwise guarded no-op.
    const idx = opts?.replaceIndex;
    if (idx === undefined || !Number.isInteger(idx) || idx < 0 || idx >= acc.length) {
        return character;
    }
    const nextAcc = acc.slice();
    nextAcc[idx] = item;
    return withLoadout(character, { ...loadout, accessories: nextAcc });
}

/**
 * Unequips the piece in `slot`. For `'accessory'`, `index` selects which of the
 * ≤3 positions to free (required); the remaining accessories compact toward the
 * front (positions have no identity). For weapon/armor, `index` is ignored.
 * No-op (returns the same character reference) when the target is empty or the
 * accessory index is out of range. Pure.
 */
export function unequipItem(
    character: Character,
    slot: EquipmentSlot,
    index?: number,
): Character {
    const loadout = character.equipment;

    if (slot === 'weapon') {
        if (!loadout.weapon) return character;
        return withLoadout(character, { ...loadout, weapon: null });
    }
    if (slot === 'armor') {
        if (!loadout.armor) return character;
        return withLoadout(character, { ...loadout, armor: null });
    }

    // accessory
    const acc = loadout.accessories;
    if (index === undefined || !Number.isInteger(index) || index < 0 || index >= acc.length) {
        return character;
    }
    const nextAcc = acc.slice();
    nextAcc.splice(index, 1);
    return withLoadout(character, { ...loadout, accessories: nextAcc });
}

/**
 * List of every worn piece in canonical order (weapon, armor, accessories by
 * position). Used by `getEquipmentModifiers`, the save migration and dev
 * tooling — anything that walks equipment without caring about slot identity.
 */
export function getEquippedItems(loadout: EquipmentLoadout): Equipment[] {
    const out: Equipment[] = [];
    if (loadout.weapon) out.push(loadout.weapon);
    if (loadout.armor)  out.push(loadout.armor);
    for (const a of loadout.accessories) out.push(a);
    return out;
}

// Re-export so `equipment.reducer` is a single import surface for callers that
// also want a single `StatModifier`-shaped contract.
export type { StatModifier };
