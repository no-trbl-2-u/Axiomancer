/**
 * Hermetic engine test — relic equipping: the createCharacter relic-seeding
 * option (the Suppliant's Ring), the maxHp fold and phase-18 slot semantics,
 * witnessed across every slot by the fixture relics (R7e2).
 */

import { describe, it, expect } from 'vitest';
import { createCharacter, equipItem, unequipItem } from '../index';
import { calculateMaxHealth } from '../../Utils';
import { getRelicById, getSignaturesForLoadout } from '../../Items/relic.library';
import { FIXTURE_WEAPON, FIXTURE_ARMOR, FIXTURE_TRINKETS } from '../../Game/fixtures';

const BASE = { heart: 5, body: 5, mind: 5 };

describe('createCharacter — seedStartingRelics', () => {
    it('wears the Suppliant\'s Ring and owns it (worn-first in inventory)', () => {
        const c = createCharacter({ name: 'T', level: 1, baseStats: BASE, seedStartingRelics: true });
        expect(c.equipment.weapon).toBeNull();
        expect(c.equipment.armor).toBeNull();
        expect(c.equipment.accessories.map(a => a.id)).toEqual(['relic-disarming-plea']);
        expect(c.inventory.map(i => i.id)).toEqual(['relic-disarming-plea']);
    });

    it('leaves maxHealth at the base value (the ring carries no stat line) and starts at full health', () => {
        const c = createCharacter({ name: 'T', level: 1, baseStats: BASE, seedStartingRelics: true });
        expect(c.maxHealth).toBe(calculateMaxHealth(1, BASE));
        expect(c.health).toBe(c.maxHealth);
    });

    it('is off by default — a bare character has an empty loadout and no relics', () => {
        const c = createCharacter({ name: 'T', level: 1, baseStats: BASE });
        expect(c.equipment.weapon).toBeNull();
        expect(c.equipment.armor).toBeNull();
        expect(c.equipment.accessories).toEqual([]);
        expect(c.inventory).toEqual([]);
    });

    it('is ignored when an explicit equipment list is passed', () => {
        const c = createCharacter({ name: 'T', level: 1, baseStats: BASE, equipment: [FIXTURE_WEAPON], seedStartingRelics: true });
        expect(c.equipment.weapon?.id).toBe(FIXTURE_WEAPON.id);
        expect(c.equipment.accessories).toEqual([]);
        expect(c.inventory).toEqual([]); // the ring is not seeded
    });

    it('folds a worn armor piece passed as explicit equipment onto maxHealth', () => {
        const c = createCharacter({ name: 'T', level: 1, baseStats: BASE, equipment: [FIXTURE_ARMOR] });
        expect(c.maxHealth).toBe(calculateMaxHealth(1, BASE) + 5);
        expect(c.health).toBe(c.maxHealth);
    });

    it('derives its signature kit from the worn loadout', () => {
        const c = createCharacter({ name: 'T', level: 1, baseStats: BASE, seedStartingRelics: true });
        expect(getSignaturesForLoadout(c.equipment)).toEqual(['sig-disarming-plea']);
    });
});

describe('equip reducers — every slot', () => {
    it('equips and unequips a weapon', () => {
        const c = createCharacter({ name: 'T', level: 3, baseStats: { heart: 6, body: 6, mind: 6 } });
        const equipped = equipItem(c, FIXTURE_WEAPON);
        expect(equipped.equipment.weapon?.id).toBe(FIXTURE_WEAPON.id);
        expect(equipped.maxHealth).toBe(c.maxHealth); // no stat line, no fold
        const removed = unequipItem(equipped, 'weapon');
        expect(removed.equipment.weapon).toBeNull();
    });

    it('fills the three accessory positions in order and unequips by index', () => {
        const c = createCharacter({ name: 'T', level: 3, baseStats: { heart: 6, body: 6, mind: 6 } });
        let next = c;
        for (const t of FIXTURE_TRINKETS) next = equipItem(next, t);
        expect(next.equipment.accessories.map(a => a.id)).toEqual(FIXTURE_TRINKETS.map(t => t.id));
        const removed = unequipItem(next, 'accessory', 1);
        expect(removed.equipment.accessories.map(a => a.id))
            .toEqual([FIXTURE_TRINKETS[0].id, FIXTURE_TRINKETS[2].id]);
    });

    it('honours phase-18 slot semantics: a 4th accessory is a guarded no-op', () => {
        let c = createCharacter({ name: 'T', level: 1, baseStats: BASE });
        for (const t of FIXTURE_TRINKETS) c = equipItem(c, t);
        // Accessory row full (3). Equipping a 4th accessory (the ring) is a
        // guarded no-op (returns the same reference).
        const after = equipItem(c, getRelicById('relic-disarming-plea')!);
        expect(after).toBe(c);
    });
});

describe('equip reducers — maxHp fold', () => {
    it('equipping a +5 maxHp armor grows maxHealth and current health by 5', () => {
        const c = createCharacter({ name: 'T', level: 3, baseStats: { heart: 6, body: 6, mind: 6 } });
        const before = c.maxHealth;
        const equipped = equipItem(c, FIXTURE_ARMOR);
        expect(equipped.equipment.armor?.id).toBe(FIXTURE_ARMOR.id);
        expect(equipped.maxHealth).toBe(before + 5);
        expect(equipped.health).toBe(c.health + 5);
    });

    it('unequipping the armor lowers maxHealth and clamps health down', () => {
        const c = createCharacter({ name: 'T', level: 3, baseStats: { heart: 6, body: 6, mind: 6 } });
        const equipped = equipItem(c, FIXTURE_ARMOR); // maxHealth + 5, health full
        const removed = unequipItem(equipped, 'armor');
        expect(removed.equipment.armor).toBeNull();
        expect(removed.maxHealth).toBe(c.maxHealth);
        expect(removed.health).toBe(c.maxHealth); // clamped down to the new ceiling
    });

    it('swapping between two +5 armors keeps the fold stable (no double-count)', () => {
        const c = createCharacter({ name: 'T', level: 3, baseStats: { heart: 6, body: 6, mind: 6 } });
        const withFirst = equipItem(c, FIXTURE_ARMOR);
        const swapped = equipItem(withFirst, { ...FIXTURE_ARMOR, id: 'fixture-armor-2' });
        expect(swapped.equipment.armor?.id).toBe('fixture-armor-2');
        expect(swapped.maxHealth).toBe(c.maxHealth + 5); // still exactly +5, not +10
    });
});
