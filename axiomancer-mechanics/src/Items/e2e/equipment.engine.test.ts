/**
 * Hermetic E2E Tests — Equipment & Consumables Engine (Spec 05)
 *
 * Hermetic = self-contained + deterministic + isolated:
 *   1. Self-contained — no disk I/O (nullAdapter), no network, no TTY.
 *   2. Deterministic  — Math.random is stubbed via helpers in
 *                       `src/test-utils/rng.ts`.
 *   3. Isolated       — `vi.restoreAllMocks` in afterEach keeps tests
 *                       independent.
 *
 * Coverage:
 *   • equipItem / unequipItem drive `derivedStats` and `effects` mutations
 *     end-to-end through `createCharacter` → `equipItem` round-trip.
 *   • `initializeCombat` seeds `combatResources` from `combatStartTokens`
 *     across every equipped slot.
 *   • `generateBasicActionResources` folds `generationBonus` entries on top
 *     of the base table.
 *   • `getEquipmentProcTriggers` surfaces onHit/onDefend entries per slot.
 *   • Game-store lifecycle for equipItem / unequipItem / useConsumable via
 *     `nullAdapter` with a `vi.spyOn(nullAdapter, 'save')` assertion.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';

import { createCharacter } from '../../Character/index';
import { equipItem, unequipItem, getEquipmentModifiers } from '../../Character/equipment.reducer';
import { emptyLoadout, type EquipmentLoadout } from '../../Character/types';
import { FloatEye } from '../../Enemy/enemy.library';
import { createGameStore } from '../../Game/store';
import { nullAdapter } from '../../Game/persistence/null.adapter';
import {
    aggregateCombatStartTokens,
    applyEquipmentGenerationBonus,
    getEquipmentProcTriggers,
} from '../equipment.engine';
import { initializeCombat } from '../../Combat/combat.reducer';
import { generateBasicActionResources } from '../../Cards/card.engine';
import { mockSequentialRng } from '../../test-utils/rng';
import { Consumable, Equipment } from '../types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Build an `EquipmentLoadout` from an ordered list of pieces (Phase 18):
 * weapon/armor slot in place, everything else fills accessory positions. */
const toLoadout = (pieces: Equipment[]): EquipmentLoadout => {
    const l = emptyLoadout();
    for (const p of pieces) {
        if (p.slot === 'weapon') l.weapon = p;
        else if (p.slot === 'armor') l.armor = p;
        else l.accessories.push(p);
    }
    return l;
};

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
    rarity: 'common',
    requiredLevel: 1,
    statModifiers: [
        { stat: 'body',           value: 2 },
        { stat: 'physicalAttack', value: 1 },
    ],
};

const passiveCirclet: Equipment = {
    id: 'eq_circlet_courage',
    name: 'Circlet of Courage',
    description: 'Grants Briar Stance permanently while worn.',
    category: 'equipment',
    slot: 'accessory',
    accessoryKind: 'head',
    rarity: 'common',
    requiredLevel: 1,
    passiveEffects: ['buff_regeneration'],
};

const berserkerBand: Equipment = {
    id: 'eq_berserker_band',
    name: 'Berserker Band',
    description: '+3 body tokens at combat start.',
    category: 'equipment',
    slot: 'accessory',
    rarity: 'uncommon',
    requiredLevel: 1,
    resourceInteraction: {
        combatStartTokens: { body: 3 },
        generationBonus: [
            { trigger: 'hit', resourceType: 'body', bonus: 2 },
        ],
    },
};

const guaranteedHitProc: Equipment = {
    id: 'eq_proc_weapon',
    name: 'Marking Sword',
    description: 'Marks the foe on every hit.',
    category: 'equipment',
    slot: 'weapon',
    rarity: 'common',
    requiredLevel: 1,
    onHitEffects: [
        {
            effectId:   'debuff_mark',
            target:     'opponent',
            tier:       1,
            baseChance: 1,
            intensityOverride: 1,
            durationOverride:  2,
        },
    ],
};

const healingPotion: Consumable = {
    id: 'csl_heal_10',
    name: 'Healing Potion',
    description: '+10 HP immediately.',
    category: 'consumable',
    healAmount: 10,
    quantity: 3,
};

// ─── Tests ───────────────────────────────────────────────────────────────────

afterEach(() => {
    vi.restoreAllMocks();
});

// ────────────────────────────────────────────────────────────────────────────
// equipItem / unequipItem fold modifiers into derivedStats and effects
// ────────────────────────────────────────────────────────────────────────────

describe('equipItem / unequipItem', () => {
    it('folds statModifiers into derivedStats at equip-time and reverts on unequip', () => {
        const player = buildPlayer();
        // Sanity: base stats and derived stats are the unmodified defaults.
        expect(player.baseStats.body).toBe(3);
        expect(player.derivedStats.physicalAttack).toBe(3); // body * 1

        const equipped = equipItem(player, ironWeapon);

        // The +2 body propagates through deriveStats AND the +1 physicalAttack
        // patch goes on top → 3 + 2 = 5 body, derived physicalAttack = 5 + 1 = 6.
        expect(equipped.equipment.weapon).toBe(ironWeapon);
        expect(equipped.derivedStats.physicalAttack).toBe(6);
        // physicalDefense follows body × DEFENSE multiplier (3) → 15.
        expect(equipped.derivedStats.physicalDefense).toBe(15);
        // baseStats are NOT mutated — the canonical stats remain.
        expect(equipped.baseStats.body).toBe(3);

        const unequipped = unequipItem(equipped, 'weapon');
        expect(unequipped.equipment.weapon).toBeNull();
        expect(unequipped.derivedStats.physicalAttack).toBe(3);
        expect(unequipped.derivedStats.physicalDefense).toBe(9);
    });

    it('Phase 20 — equipping a passiveEffects item applies NO ActiveEffect (equipment is stat-only)', () => {
        const player = buildPlayer();
        expect(player.effects).toHaveLength(0);

        const equipped = equipItem(player, passiveCirclet);
        // Equipment no longer pushes passiveEffects onto Character.effects.
        expect(equipped.effects).toHaveLength(0);

        const unequipped = unequipItem(equipped, 'accessory', 0);
        expect(unequipped.effects).toHaveLength(0);
    });

    it('Phase 20 — replacing an item swaps its statModifiers but touches no effects', () => {
        const player = buildPlayer();
        const passiveWeapon: Equipment = {
            id:             'eq_passive_weapon',
            name:           'Passive Weapon',
            description:    'Grants regeneration while worn.',
            category:       'equipment',
            slot:           'weapon',
            rarity:         'common',
            requiredLevel:  1,
            passiveEffects: ['buff_regeneration'],
            statModifiers:  [{ stat: 'body', value: 2 }],
        };
        const withWeapon = equipItem(player, passiveWeapon);
        expect(withWeapon.effects).toHaveLength(0);          // no passive applied
        expect(withWeapon.derivedStats.physicalAttack).toBe(5); // +2 body (3→5) still folds in

        const replacementWeapon: Equipment = {
            ...passiveWeapon,
            id:             'eq_other_weapon',
            passiveEffects: ['buff_haste'],
            statModifiers:  [],
        };
        const replaced = equipItem(withWeapon, replacementWeapon);
        expect(replaced.effects).toHaveLength(0);            // still no effects
        expect(replaced.derivedStats.physicalAttack).toBe(3); // prior +2 body reverted
    });

    it('createCharacter accepts a starting equipment list and folds stats but applies no effects', () => {
        const player = createCharacter({
            name: 'Equipped',
            level: 1,
            baseStats: { heart: 4, body: 3, mind: 2 },
            equipment: [ironWeapon, passiveCirclet],
        });
        expect(player.derivedStats.physicalAttack).toBe(6);
        // Phase 20 — the passive circlet contributes stats only, no ActiveEffect.
        expect(player.effects).toHaveLength(0);
    });
});

// ────────────────────────────────────────────────────────────────────────────
// Combat-start token seeding
// ────────────────────────────────────────────────────────────────────────────

describe('initializeCombat: combat-start token seeding', () => {
    it('Phase 20 — equipment combatStartTokens no longer seed combatResources (decoupled)', () => {
        const player = createCharacter({
            name: 'Seeded',
            level: 1,
            baseStats: { heart: 4, body: 3, mind: 2 },
            equipment: [berserkerBand], // carries combatStartTokens: { body: 3 }
        });
        const state = initializeCombat(player, FloatEye);
        // Individual equipment contributes nothing to the token economy now.
        expect(state.combatResources).toEqual({
            heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0,
        });
    });

    it('items without resourceInteraction contribute zero to every counter', () => {
        const player = createCharacter({
            name: 'NoTokens',
            level: 1,
            baseStats: { heart: 4, body: 3, mind: 2 },
            equipment: [ironWeapon],
        });
        const state = initializeCombat(player, FloatEye);
        expect(state.combatResources).toEqual({
            heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0,
        });
    });

    it('aggregateCombatStartTokens sums across multiple equipped slots', () => {
        const accessory: Equipment = {
            ...berserkerBand,
            id: 'eq_band_2',
            slot: 'accessory',
            resourceInteraction: { combatStartTokens: { body: 1, paradox: 2 } },
        };
        const offhand: Equipment = {
            id: 'eq_offhand',
            name: 'Offhand',
            description: '',
            category: 'equipment',
            slot: 'accessory',
            accessoryKind: 'hands',
            rarity: 'common',
            requiredLevel: 1,
            resourceInteraction: { combatStartTokens: { body: 4, heart: 1 } },
        };
        const tokens = aggregateCombatStartTokens(toLoadout([accessory, offhand]));
        expect(tokens).toEqual({
            heart: 1, body: 5, mind: 0, fallacy: 0, paradox: 2,
        });
    });
});

// ────────────────────────────────────────────────────────────────────────────
// Generation bonus
// ────────────────────────────────────────────────────────────────────────────

describe('generateBasicActionResources: equipment generation bonus', () => {
    it('Phase 20 — equipment generationBonus no longer applies over the base table (decoupled)', () => {
        const equipment = toLoadout([berserkerBand]); // carries a +2 body-on-hit generationBonus
        const base = { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 };
        // body attack hit base = +3 body; the equipment bonus is NOT applied → 3
        const hit = generateBasicActionResources(base, 'body', 'hit', equipment);
        expect(hit.body).toBe(3);
        // body attack miss base = +1 body → 1
        const miss = generateBasicActionResources(base, 'body', 'miss', equipment);
        expect(miss.body).toBe(1);
    });

    it('a "any"-trigger bonus applies to every basic action outcome', () => {
        const universal: Equipment = {
            id: 'eq_any',
            name: 'Any',
            description: '',
            category: 'equipment',
            slot: 'accessory',
            accessoryKind: 'feet',
            rarity: 'common',
            requiredLevel: 1,
            resourceInteraction: {
                generationBonus: [{ trigger: 'any', resourceType: 'mind', bonus: 1 }],
            },
        };
        const base = { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 };
        const loadout = toLoadout([universal]);
        expect(applyEquipmentGenerationBonus(base, loadout, 'hit').mind).toBe(1);
        expect(applyEquipmentGenerationBonus(base, loadout, 'miss').mind).toBe(1);
        expect(applyEquipmentGenerationBonus(base, loadout, 'defend').mind).toBe(1);
    });
});

// ────────────────────────────────────────────────────────────────────────────
// onHitEffects: surfaced through the Spec 03 proc roll
// ────────────────────────────────────────────────────────────────────────────

describe('Equipment proc triggers', () => {
    it('getEquipmentProcTriggers returns onHit/onDefend entries from every equipped piece', () => {
        const equipment = toLoadout([guaranteedHitProc]);
        expect(getEquipmentProcTriggers(equipment, 'attack')).toHaveLength(1);
        expect(getEquipmentProcTriggers(equipment, 'defend')).toHaveLength(0);
    });
});

// ────────────────────────────────────────────────────────────────────────────
// Equipment modifier aggregation invariants
// ────────────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────────────
// Game store lifecycle — nullAdapter (zero disk access)
// ────────────────────────────────────────────────────────────────────────────

describe('Game store lifecycle: equipment & consumables with nullAdapter', () => {
    it('equipItem / unequipItem flow through the store; autosave is intentionally NOT fired on UI-tier actions (Phase 51, Spec 09 Q4 path B)', () => {
        const saveSpy = vi.spyOn(nullAdapter, 'save');
        const player  = buildPlayer();
        const store   = createGameStore(nullAdapter, { player });

        store.getState().equipItem(ironWeapon);
        expect(store.getState().player.equipment.weapon).toBe(ironWeapon);
        expect(store.getState().player.derivedStats.physicalAttack).toBe(6);

        store.getState().unequipItem('weapon');
        expect(store.getState().player.equipment.weapon).toBeNull();
        expect(store.getState().player.derivedStats.physicalAttack).toBe(3);

        // Phase 51: EQUIP_ITEM and UNEQUIP_ITEM are UI-tier actions and are
        // intentionally excluded from the DURABLE_ACTIONS allowlist. The
        // next COMBAT_ROUND / LEVEL_UP / MOVE_TO_NODE / SAVE_GAME persists
        // the equipment change; an explicit store.save() always writes
        // through. See plan/phases/phase_51_autosave_throttling.md.
        expect(saveSpy).not.toHaveBeenCalled();
    });

    it('useConsumable applies the healAmount on the root player and decrements the stack', () => {
        // Use a fresh, slightly hurt player so the heal is observable.
        const player = {
            ...buildPlayer(),
        };
        const hurt = { ...player, health: player.maxHealth - 5,
                       inventory: [{ ...healingPotion, quantity: 2 }] };
        const store = createGameStore(nullAdapter, { player: hurt });

        const before = store.getState().player.health;
        store.getState().useConsumable(healingPotion.id);

        const after = store.getState().player.health;
        expect(after).toBe(before + 5); // heal clamps at maxHealth; 5 HP missing.
        const left = store.getState().player.inventory
            .find(i => i.id === healingPotion.id) as Consumable;
        expect(left.quantity).toBe(1);
    });

    it('useConsumable is a no-op for a non-consumable / unknown itemId', () => {
        const player = buildPlayer();
        const store  = createGameStore(nullAdapter, { player });
        store.getState().useConsumable('csl_does_not_exist');
        expect(store.getState().player.inventory).toEqual(player.inventory);
    });

    it('Phase 20 — a Berserker Band wearer\'s combat starts with ZERO body tokens (equipment decoupled)', () => {
        mockSequentialRng(0.5);
        const player = createCharacter({
            name: 'Equipped',
            level: 1,
            baseStats: { heart: 4, body: 3, mind: 2 },
            equipment: [berserkerBand],
        });
        const combat = initializeCombat(player, FloatEye);
        // Equipment no longer seeds combat-start tokens — the band's body: 3 is inert.
        expect(combat.combatResources.body).toBe(0);
    });
});
