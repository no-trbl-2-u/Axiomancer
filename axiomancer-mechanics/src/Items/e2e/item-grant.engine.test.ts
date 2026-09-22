/**
 * The shared item-grant path — hermetic E2E tests.
 *
 * Two of these tests exist to pin the SILENT failure modes that make this
 * module necessary. `equipItem` does not return the displaced piece: on
 * weapon/armor it replaces in place (the worn relic is gone), and on a FULL
 * accessory row it is a guarded no-op that returns the SAME character
 * reference, so a shallow equality check reads the failure as success. The
 * `equipItem — the failure modes this module exists to prevent` block asserts
 * that behaviour directly, and the `grantItem` blocks assert that the shared
 * path does not inherit it.
 *
 * Hermetic: real relics from the library, characters built in-line, no mocks.
 */

import { describe, it, expect } from 'vitest';

import { createCharacter } from '../../Character/index';
import { equipItem } from '../../Character/equipment.reducer';
import { getRelicById } from '../relic.library';
import {
    grantItem,
    qualifiesForItemRewardScreen,
    partitionGrantsForReward,
    displacedBy,
} from '../item-grant';
import { SLOT_CAPACITY } from '../types';
import type { Consumable, Equipment, Item, Material, QuestItem } from '../types';
import type { Character } from '../../Character/types';

// ─── fixtures ─────────────────────────────────────────────────────────────────

const relic = (id: string): Equipment => {
    const found = getRelicById(id);
    if (!found) throw new Error(`relic fixture missing: ${id}`);
    return JSON.parse(JSON.stringify(found)) as Equipment;
};

/** A seeded player: 5 worn relics (1 weapon, 1 armor, 3 accessories) + 6 benched. */
const seededPlayer = (): Character =>
    createCharacter({
        name: 'Grantee',
        level: 3,
        baseStats: { body: 3, mind: 3, heart: 3 },
        seedStartingRelics: true,
    });

/** A bare player: nothing worn, nothing carried. */
const barePlayer = (): Character =>
    createCharacter({
        name: 'Pauper',
        level: 1,
        baseStats: { body: 2, mind: 2, heart: 2 },
    });

/** A player wearing `worn` via the loadout ONLY — nothing in inventory. This is
 *  what `createCharacter({ equipment: [...] })` produces, and it is the shape
 *  that proves the displaced piece is genuinely rescued rather than merely
 *  already present. */
const loadoutOnlyPlayer = (worn: Equipment[]): Character => {
    let c = barePlayer();
    for (const piece of worn) c = equipItem(c, piece);
    return c;
};

const potion = (id: string, quantity = 1): Consumable => ({
    id,
    name: 'Draught',
    description: 'A test draught.',
    category: 'consumable',
    quantity,
    healAmount: 10,
});

const scrap = (id: string, quantity = 1): Material => ({
    id,
    name: 'Scrap',
    description: 'A test material.',
    category: 'material',
    quantity,
});

const token = (id: string): QuestItem => ({
    id,
    name: 'Token',
    description: 'A test quest item.',
    category: 'quest-item',
    questId: 'q-test',
});

const countById = (inventory: readonly Item[], id: string): number =>
    inventory.filter(i => i.id === id).length;

const wornIds = (c: Character): string[] => [
    ...(c.equipment.weapon ? [c.equipment.weapon.id] : []),
    ...(c.equipment.armor ? [c.equipment.armor.id] : []),
    ...c.equipment.accessories.map(a => a.id),
];

// ─── the failure modes ────────────────────────────────────────────────────────

describe('equipItem — the failure modes this module exists to prevent', () => {
    it('weapon: a naive equip DESTROYS the worn relic (it is in neither loadout nor inventory)', () => {
        const worn = relic('relic-overwhelming');
        const incoming = relic('relic-conclusion');
        const player = loadoutOnlyPlayer([worn]);

        const after = equipItem(player, incoming);

        expect(after.equipment.weapon?.id).toBe(incoming.id);
        // The displaced relic is simply gone — no return value, no inventory row.
        expect(countById(after.inventory, worn.id)).toBe(0);
        expect(wornIds(after)).not.toContain(worn.id);
    });

    it('full accessory row: a naive equip is a SILENT no-op returning the same reference', () => {
        const player = loadoutOnlyPlayer([
            relic('relic-conviction-strike'),
            relic('relic-clever-gambit'),
            relic('relic-disarming-plea'),
        ]);
        expect(player.equipment.accessories).toHaveLength(SLOT_CAPACITY.accessory);

        const incoming = relic('relic-press-the-point');
        const after = equipItem(player, incoming);

        // Same reference — a shallow equality check reads this as success.
        expect(after).toBe(player);
        expect(wornIds(after)).not.toContain(incoming.id);
    });
});

// ─── grantItem: inventory-only grants ─────────────────────────────────────────

describe('grantItem — inventory grants', () => {
    it('adds a deep clone, never the caller object', () => {
        const player = barePlayer();
        const source = potion('elixir');

        const res = grantItem(player, source);

        expect(res.outcome).toBe('inventory');
        expect(res.equipped).toBe(false);
        expect(res.displaced).toBeNull();
        expect(res.granted).not.toBe(source);
        expect(res.granted.id).toBe('elixir');
        expect(countById(res.character.inventory, 'elixir')).toBe(1);
        // Pure: the input character is untouched.
        expect(player.inventory).toHaveLength(0);
    });

    it('stacks a consumable already in inventory instead of adding a row', () => {
        let player = barePlayer();
        player = grantItem(player, potion('elixir', 1)).character;
        const res = grantItem(player, potion('elixir', 2));

        expect(countById(res.character.inventory, 'elixir')).toBe(1);
        const row = res.character.inventory.find(i => i.id === 'elixir') as Consumable;
        expect(row.quantity).toBe(3);
    });

    it('stacks materials too, and honours { stack: false }', () => {
        let player = barePlayer();
        player = grantItem(player, scrap('iron', 2)).character;

        const stacked = grantItem(player, scrap('iron', 3)).character;
        expect(countById(stacked.inventory, 'iron')).toBe(1);
        expect((stacked.inventory.find(i => i.id === 'iron') as Material).quantity).toBe(5);

        const unstacked = grantItem(player, scrap('iron', 3), { stack: false }).character;
        expect(countById(unstacked.inventory, 'iron')).toBe(2);
    });

    it('{ equip: true } on a non-equipment item is ignored, not an error', () => {
        const res = grantItem(barePlayer(), potion('elixir'), { equip: true });
        expect(res.outcome).toBe('inventory');
        expect(res.equipped).toBe(false);
        expect(countById(res.character.inventory, 'elixir')).toBe(1);
    });
});

// ─── grantItem: equipping into a free slot ────────────────────────────────────

describe('grantItem — equipping into a free slot', () => {
    it('wears the grant and keeps it in inventory (worn items live in both)', () => {
        const incoming = relic('relic-overwhelming');
        const res = grantItem(barePlayer(), incoming, { equip: true });

        expect(res.outcome).toBe('equipped');
        expect(res.equipped).toBe(true);
        expect(res.displaced).toBeNull();
        expect(res.character.equipment.weapon?.id).toBe(incoming.id);
        expect(countById(res.character.inventory, incoming.id)).toBe(1);
    });

    it('fills a free accessory position without displacing anything', () => {
        const player = loadoutOnlyPlayer([relic('relic-conviction-strike')]);
        const incoming = relic('relic-clever-gambit');

        const res = grantItem(player, incoming, { equip: true });

        expect(res.outcome).toBe('equipped');
        expect(res.displaced).toBeNull();
        expect(res.character.equipment.accessories.map(a => a.id)).toEqual([
            'relic-conviction-strike',
            'relic-clever-gambit',
        ]);
    });

    it('folds the grant stat modifiers into the wearer (the sole equipment channel)', () => {
        const before = barePlayer();
        // `relic-read` is an armor relic carrying a flat maxHp modifier.
        const incoming = relic('relic-read');
        const res = grantItem(before, incoming, { equip: true });

        const hpMod = (incoming.statModifiers ?? []).find(m => m.stat === 'maxHp' && !m.isMultiplier);
        if (hpMod) {
            expect(res.character.maxHealth).toBe(before.maxHealth + hpMod.value);
        } else {
            // No maxHp on this relic — assert the derived stats moved instead.
            expect(res.character.derivedStats).not.toEqual(before.derivedStats);
        }
    });
});

// ─── grantItem: the swap (D6) ─────────────────────────────────────────────────

describe('grantItem — swap never destroys (D6)', () => {
    it('weapon swap returns the displaced relic to inventory', () => {
        const worn = relic('relic-overwhelming');
        const incoming = relic('relic-conclusion');
        const player = loadoutOnlyPlayer([worn]);

        const res = grantItem(player, incoming, { equip: true });

        expect(res.outcome).toBe('swapped');
        expect(res.equipped).toBe(true);
        expect(res.displaced?.id).toBe(worn.id);
        expect(res.character.equipment.weapon?.id).toBe(incoming.id);
        // The whole point: the displaced relic is still the player's.
        expect(countById(res.character.inventory, worn.id)).toBe(1);
        expect(countById(res.character.inventory, incoming.id)).toBe(1);
    });

    it('armor swap returns the displaced relic to inventory', () => {
        const worn = relic('relic-read');
        const incoming = relic('relic-second-wind');
        const player = loadoutOnlyPlayer([worn]);

        const res = grantItem(player, incoming, { equip: true });

        expect(res.displaced?.id).toBe(worn.id);
        expect(res.character.equipment.armor?.id).toBe(incoming.id);
        expect(countById(res.character.inventory, worn.id)).toBe(1);
    });

    it('a FULL accessory row swaps instead of silently no-op-ing', () => {
        const player = loadoutOnlyPlayer([
            relic('relic-conviction-strike'),
            relic('relic-clever-gambit'),
            relic('relic-disarming-plea'),
        ]);
        const incoming = relic('relic-press-the-point');

        const res = grantItem(player, incoming, { equip: true });

        expect(res.character).not.toBe(player);
        expect(res.outcome).toBe('swapped');
        expect(res.equipped).toBe(true);
        expect(res.character.equipment.accessories).toHaveLength(SLOT_CAPACITY.accessory);
        expect(wornIds(res.character)).toContain(incoming.id);
        // Default displacement is the LAST worn accessory.
        expect(res.displaced?.id).toBe('relic-disarming-plea');
        expect(countById(res.character.inventory, 'relic-disarming-plea')).toBe(1);
    });

    it('honours an explicit replaceIndex on a full accessory row', () => {
        const player = loadoutOnlyPlayer([
            relic('relic-conviction-strike'),
            relic('relic-clever-gambit'),
            relic('relic-disarming-plea'),
        ]);
        const incoming = relic('relic-press-the-point');

        const res = grantItem(player, incoming, { equip: true, replaceIndex: 0 });

        expect(res.displaced?.id).toBe('relic-conviction-strike');
        expect(countById(res.character.inventory, 'relic-conviction-strike')).toBe(1);
        expect(wornIds(res.character)).toContain(incoming.id);
        expect(wornIds(res.character)).not.toContain('relic-conviction-strike');
    });

    it('an out-of-range replaceIndex falls back to the last position, never a no-op', () => {
        const player = loadoutOnlyPlayer([
            relic('relic-conviction-strike'),
            relic('relic-clever-gambit'),
            relic('relic-disarming-plea'),
        ]);
        const incoming = relic('relic-press-the-point');

        const res = grantItem(player, incoming, { equip: true, replaceIndex: 99 });

        expect(res.character).not.toBe(player);
        expect(res.equipped).toBe(true);
        expect(res.displaced?.id).toBe('relic-disarming-plea');
    });

    it('conserves item count across a full-row swap on a seeded player', () => {
        const player = seededPlayer();
        const before = player.inventory.length;
        // The seeded player wears 3 accessories already; grant a 4th.
        const benched = player.inventory.find(
            i => i.category === 'equipment'
                && (i as Equipment).slot === 'accessory'
                && !wornIds(player).includes(i.id),
        ) as Equipment | undefined;
        expect(benched).toBeDefined();

        const res = grantItem(player, benched as Equipment, { equip: true });

        // One row added (the granted clone); nothing removed.
        expect(res.character.inventory.length).toBe(before + 1);
        expect(res.character.equipment.accessories).toHaveLength(SLOT_CAPACITY.accessory);
        expect(res.displaced).not.toBeNull();
        expect(countById(res.character.inventory, (res.displaced as Equipment).id)).toBeGreaterThan(0);
    });
});

// ─── displacedBy ──────────────────────────────────────────────────────────────

describe('displacedBy — the swap preview', () => {
    it('reports null for an empty slot and for a free accessory position', () => {
        const bare = barePlayer();
        expect(displacedBy(bare, relic('relic-overwhelming')).item).toBeNull();
        expect(displacedBy(bare, relic('relic-conviction-strike')).item).toBeNull();
    });

    it('reports the worn weapon and the last accessory at capacity', () => {
        const player = loadoutOnlyPlayer([
            relic('relic-overwhelming'),
            relic('relic-conviction-strike'),
            relic('relic-clever-gambit'),
            relic('relic-disarming-plea'),
        ]);
        expect(displacedBy(player, relic('relic-conclusion')).item?.id).toBe('relic-overwhelming');
        const acc = displacedBy(player, relic('relic-press-the-point'));
        expect(acc.item?.id).toBe('relic-disarming-plea');
        expect(acc.index).toBe(2);
    });

    it('agrees with what grantItem actually displaces', () => {
        const player = loadoutOnlyPlayer([
            relic('relic-conviction-strike'),
            relic('relic-clever-gambit'),
            relic('relic-disarming-plea'),
        ]);
        const incoming = relic('relic-press-the-point');
        const preview = displacedBy(player, incoming, { replaceIndex: 1 });
        const res = grantItem(player, incoming, { equip: true, replaceIndex: 1 });
        expect(res.displaced?.id).toBe(preview.item?.id);
    });
});

// ─── D5 predicate ─────────────────────────────────────────────────────────────

describe('qualifiesForItemRewardScreen — the D5 trigger (routes the intended items exactly)', () => {
    it('true for a signet relic (signature + stats)', () => {
        expect(qualifiesForItemRewardScreen(relic('relic-disarming-plea'))).toBe(true);
    });

    it('true for every relic in the library — each carries a signature', () => {
        for (const id of [
            'relic-overwhelming', 'relic-conclusion', 'relic-read', 'relic-second-wind',
            'relic-conviction-strike', 'relic-clever-gambit', 'relic-disarming-plea',
            'relic-press-the-point', 'relic-mounting-dread', 'relic-endless-labor',
            'relic-unbroken-stride',
        ]) {
            expect(qualifiesForItemRewardScreen(relic(id))).toBe(true);
        }
    });

    it('true for equipment with stat modifiers but no signature', () => {
        const plainGear: Equipment = {
            id: 'gear-plain',
            name: 'Plain Gear',
            description: '',
            category: 'equipment',
            slot: 'armor',
            statModifiers: [{ stat: 'physicalDefense', value: 2 }],
        };
        expect(qualifiesForItemRewardScreen(plainGear)).toBe(true);
    });

    it('false for equipment with neither a signature nor stat modifiers', () => {
        const inert: Equipment = {
            id: 'gear-inert',
            name: 'Inert Gear',
            description: '',
            category: 'equipment',
            slot: 'weapon',
        };
        expect(qualifiesForItemRewardScreen(inert)).toBe(false);
        expect(qualifiesForItemRewardScreen({ ...inert, statModifiers: [] })).toBe(false);
    });

    it('false for consumables, materials, and quest items', () => {
        expect(qualifiesForItemRewardScreen(potion('elixir'))).toBe(false);
        expect(qualifiesForItemRewardScreen(scrap('iron'))).toBe(false);
        expect(qualifiesForItemRewardScreen(token('sigil'))).toBe(false);
    });

    it('partitions a mixed haul into reward-screen and inline grants, preserving order', () => {
        const haul: Item[] = [
            scrap('iron'),
            relic('relic-disarming-plea'),
            potion('elixir'),
            relic('relic-read'),
        ];
        const { reward, inline } = partitionGrantsForReward(haul);
        expect(reward.map(i => i.id)).toEqual(['relic-disarming-plea', 'relic-read']);
        expect(inline.map(i => i.id)).toEqual(['iron', 'elixir']);
    });
});
