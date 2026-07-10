/**
 * Hermetic E2E — equip / unequip stat folding + consumable lifecycle.
 *
 * After the equipment-signature epic (phases 18-23) equipment carries only
 * static `statModifiers` (folded into `derivedStats` / `maxHealth` at
 * equip-time) and one `grantsSignature`. The rarity / affix / rolled-modifier /
 * passive-effect / proc / resource-token machinery is gone, so this suite pins
 * only the surviving contracts:
 *
 *   • `equipItem` folds `statModifiers` into `derivedStats`; `unequipItem` reverts.
 *   • Equipment applies NO effects (stat-only) — `Character.effects` untouched.
 *   • `getEquipmentModifiers` aggregation invariants.
 *   • Consumable heal / stack lifecycle through the store.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';

import { createCharacter } from '../../Character/index';
import { equipItem, unequipItem, getEquipmentModifiers } from '../../Character/equipment.reducer';
import { emptyLoadout } from '../../Character/types';
import { createGameStore } from '../../Game/store';
import { nullAdapter } from '../../Game/persistence/null.adapter';
import { Consumable, Equipment } from '../types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const buildPlayer = () => createCharacter({
    name: 'TestPlayer',
    level: 1,
    baseStats: { heart: 4, body: 3, mind: 2 },
});

const ironWeapon: Equipment = {
    id: 'eq_iron_blade',
    name: 'Iron Blade',
    description: 'A simple iron blade. +2 body, +1 physicalAttack.',
    category: 'equipment',
    slot: 'weapon',
    statModifiers: [
        { stat: 'body',           value: 2 },
        { stat: 'physicalAttack', value: 1 },
    ],
};

/** A plain accessory (no effects — equipment is stat-only post-epic). */
const plainCirclet: Equipment = {
    id: 'eq_circlet_courage',
    name: 'Circlet of Courage',
    description: 'A quiet circlet.',
    category: 'equipment',
    slot: 'accessory',
    accessoryKind: 'head',
};

const healingPotion: Consumable = {
    id: 'csl_heal_10',
    name: 'Healing Potion',
    description: '+10 HP immediately.',
    category: 'consumable',
    healAmount: 10,
    quantity: 3,
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('equipItem / unequipItem', () => {
    it('folds statModifiers into derivedStats at equip-time and reverts on unequip', () => {
        const player = buildPlayer();
        expect(player.baseStats.body).toBe(3);
        expect(player.derivedStats.physicalAttack).toBe(3); // body * 1

        const equipped = equipItem(player, ironWeapon);
        // +2 body → 5 body; derived physicalAttack = 5 + 1 patch = 6.
        expect(equipped.equipment.weapon).toBe(ironWeapon);
        expect(equipped.derivedStats.physicalAttack).toBe(6);
        expect(equipped.derivedStats.physicalDefense).toBe(15);
        expect(equipped.baseStats.body).toBe(3); // baseStats untouched

        const unequipped = unequipItem(equipped, 'weapon');
        expect(unequipped.equipment.weapon).toBeNull();
        expect(unequipped.derivedStats.physicalAttack).toBe(3);
        expect(unequipped.derivedStats.physicalDefense).toBe(9);
    });

    it('equipment is stat-only — equipping/unequipping never touches Character.effects', () => {
        const player = buildPlayer();
        expect(player.effects).toHaveLength(0);
        const equipped = equipItem(player, plainCirclet);
        expect(equipped.effects).toHaveLength(0);
        const unequipped = unequipItem(equipped, 'accessory', 0);
        expect(unequipped.effects).toHaveLength(0);
    });

    it('replacing a weapon swaps its statModifiers and leaves effects empty', () => {
        const player = buildPlayer();
        const bodyWeapon: Equipment = { ...ironWeapon, id: 'eq_body_weapon', statModifiers: [{ stat: 'body', value: 2 }] };
        const withWeapon = equipItem(player, bodyWeapon);
        expect(withWeapon.effects).toHaveLength(0);
        expect(withWeapon.derivedStats.physicalAttack).toBe(5); // +2 body (3→5)

        const replacement: Equipment = { ...bodyWeapon, id: 'eq_other_weapon', statModifiers: [] };
        const replaced = equipItem(withWeapon, replacement);
        expect(replaced.effects).toHaveLength(0);
        expect(replaced.derivedStats.physicalAttack).toBe(3); // prior +2 body reverted
    });

    it('createCharacter accepts a starting equipment list and folds stats but applies no effects', () => {
        const player = createCharacter({
            name: 'Equipped',
            level: 1,
            baseStats: { heart: 4, body: 3, mind: 2 },
            equipment: [ironWeapon, plainCirclet],
        });
        expect(player.derivedStats.physicalAttack).toBe(6);
        expect(player.effects).toHaveLength(0);
    });
});

describe('Invariants', () => {
    it('getEquipmentModifiers on an empty slot map returns zeroed maps', () => {
        const agg = getEquipmentModifiers(emptyLoadout());
        expect(agg.statFlat.size).toBe(0);
        expect(agg.statMultBonus.size).toBe(0);
    });

    it('unequipping an empty slot is a no-op (returns the same reference)', () => {
        const player = buildPlayer();
        expect(unequipItem(player, 'weapon')).toBe(player);
    });

    it('input character is not mutated by equipItem', () => {
        const player = buildPlayer();
        const beforeHash = JSON.stringify(player);
        equipItem(player, ironWeapon);
        expect(JSON.stringify(player)).toBe(beforeHash);
    });
});

describe('Game store lifecycle: equipment & consumables with nullAdapter', () => {
    it('equipItem / unequipItem flow through the store; autosave is NOT fired on UI-tier actions', () => {
        const saveSpy = vi.spyOn(nullAdapter, 'save');
        const player  = buildPlayer();
        const store   = createGameStore(nullAdapter, { player });

        store.getState().equipItem(ironWeapon);
        expect(store.getState().player.equipment.weapon).toBe(ironWeapon);
        expect(store.getState().player.derivedStats.physicalAttack).toBe(6);

        store.getState().unequipItem('weapon');
        expect(store.getState().player.equipment.weapon).toBeNull();
        expect(store.getState().player.derivedStats.physicalAttack).toBe(3);

        expect(saveSpy).not.toHaveBeenCalled();
    });

    it('useConsumable applies the healAmount on the root player and decrements the stack', () => {
        const player = buildPlayer();
        const hurt = { ...player, health: player.maxHealth - 5, inventory: [{ ...healingPotion, quantity: 2 }] };
        const store = createGameStore(nullAdapter, { player: hurt });

        const before = store.getState().player.health;
        store.getState().useConsumable(healingPotion.id);
        expect(store.getState().player.health).toBe(before + 5);
        const left = store.getState().player.inventory.find(i => i.id === healingPotion.id) as Consumable;
        expect(left.quantity).toBe(1);
    });

    it('useConsumable is a no-op for a non-consumable / unknown itemId', () => {
        const player = buildPlayer();
        const store  = createGameStore(nullAdapter, { player });
        store.getState().useConsumable('csl_does_not_exist');
        expect(store.getState().player.inventory).toEqual(player.inventory);
    });
});
