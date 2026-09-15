/**
 * Hermetic engine test — Phase 19 relic equipping: the maxHp fold, the
 * createCharacter relic-seeding option, and phase-18 slot semantics for relics.
 */

import { describe, it, expect } from 'vitest';
import { createCharacter, equipItem, unequipItem } from '../index';
import { calculateMaxHealth } from '../../Utils';
import { getRelicById, getSignaturesForLoadout } from '../../Items/relic.library';

describe('createCharacter — seedStartingRelics', () => {
    it('wears the default 5-relic loadout and owns all 11 (worn-first in inventory)', () => {
        const c = createCharacter({ name: 'T', level: 1, baseStats: { heart: 5, body: 5, mind: 5 }, seedStartingRelics: true });
        expect(c.equipment.weapon?.id).toBe('relic-overwhelming');
        expect(c.equipment.armor?.id).toBe('relic-read');
        expect(c.equipment.accessories).toHaveLength(3);
        // All 11 relics owned; inventory leads with the worn 5 (worn-first per slot
        // so the presenter's inventory-position worn convention agrees), then the
        // 6 benched.
        const relicIds = c.inventory.filter(i => i.id.startsWith('relic-')).map(i => i.id);
        expect(relicIds).toHaveLength(11);
        // Owner call 2026-07-18: the Gambler's Knot (Press Fate) is default-worn;
        // the Venom Sigil (The Oath Kept) is benched. Phase 85's 3 new relics
        // (head/hands/feet) also start benched.
        expect(relicIds.slice(0, 5)).toEqual([
            'relic-overwhelming', 'relic-read',
            'relic-clever-gambit', 'relic-disarming-plea', 'relic-press-the-point',
        ]);
        expect(relicIds.slice(5).sort()).toEqual([
            'relic-conclusion', 'relic-conviction-strike', 'relic-endless-labor',
            'relic-mounting-dread', 'relic-second-wind', 'relic-unbroken-stride',
        ]);
    });

    it('folds the worn armor relic +5 maxHp onto maxHealth (and starts at full health)', () => {
        const base = calculateMaxHealth(1, { heart: 5, body: 5, mind: 5 });
        const c = createCharacter({ name: 'T', level: 1, baseStats: { heart: 5, body: 5, mind: 5 }, seedStartingRelics: true });
        expect(c.maxHealth).toBe(base + 5);
        expect(c.health).toBe(c.maxHealth);
    });

    it('folds the worn weapon/accessory stat bumps into derivedStats', () => {
        const bare = createCharacter({ name: 'B', level: 1, baseStats: { heart: 5, body: 5, mind: 5 } });
        const relic = createCharacter({ name: 'R', level: 1, baseStats: { heart: 5, body: 5, mind: 5 }, seedStartingRelics: true });
        // +2 body (Gorgon Brand) raises physicalAttack; +2 mind/heart raise the others.
        expect(relic.derivedStats.physicalAttack).toBeGreaterThan(bare.derivedStats.physicalAttack);
    });

    it('is off by default — a bare character has an empty loadout and no relics', () => {
        const c = createCharacter({ name: 'T', level: 1, baseStats: { heart: 5, body: 5, mind: 5 } });
        expect(c.equipment.weapon).toBeNull();
        expect(c.equipment.armor).toBeNull();
        expect(c.equipment.accessories).toEqual([]);
        expect(c.inventory).toEqual([]);
    });

    it('is ignored when an explicit equipment list is passed', () => {
        const weapon = getRelicById('relic-conclusion')!;
        const c = createCharacter({ name: 'T', level: 1, baseStats: { heart: 5, body: 5, mind: 5 }, equipment: [weapon], seedStartingRelics: true });
        expect(c.equipment.weapon?.id).toBe('relic-conclusion');
        expect(c.inventory).toEqual([]); // no benched relics seeded
    });

    it('derives its full signature kit from the worn loadout', () => {
        const c = createCharacter({ name: 'T', level: 1, baseStats: { heart: 5, body: 5, mind: 5 }, seedStartingRelics: true });
        expect(getSignaturesForLoadout(c.equipment)).toEqual([
            'sig-overwhelming-argument', 'sig-read-opponent',
            'sig-clever-gambit', 'sig-disarming-plea', 'sig-press-the-point',
        ]);
    });
});

describe('equip reducers — maxHp fold', () => {
    it('equipping a +5 maxHp armor relic grows maxHealth and current health by 5', () => {
        const c = createCharacter({ name: 'T', level: 3, baseStats: { heart: 6, body: 6, mind: 6 } });
        const before = c.maxHealth;
        const equipped = equipItem(c, getRelicById('relic-read')!);
        expect(equipped.maxHealth).toBe(before + 5);
        expect(equipped.health).toBe(c.health + 5);
    });

    it('unequipping the armor relic lowers maxHealth and clamps health down', () => {
        const c = createCharacter({ name: 'T', level: 3, baseStats: { heart: 6, body: 6, mind: 6 } });
        const equipped = equipItem(c, getRelicById('relic-read')!); // maxHealth + 5, health full
        const removed = unequipItem(equipped, 'armor');
        expect(removed.maxHealth).toBe(c.maxHealth);
        expect(removed.health).toBe(c.maxHealth); // clamped down to the new ceiling
    });

    it('swapping between the two armor relics keeps the +5 fold stable (no double-count)', () => {
        const c = createCharacter({ name: 'T', level: 3, baseStats: { heart: 6, body: 6, mind: 6 } });
        const withRead = equipItem(c, getRelicById('relic-read')!);
        const swapped = equipItem(withRead, getRelicById('relic-second-wind')!);
        expect(swapped.maxHealth).toBe(c.maxHealth + 5); // still exactly +5, not +10
    });

    it('honours phase-18 slot semantics: a 4th accessory relic is a guarded no-op', () => {
        const c = createCharacter({ name: 'T', level: 1, baseStats: { heart: 5, body: 5, mind: 5 }, seedStartingRelics: true });
        // Accessory row already full (3 default-worn accessory relics). Equipping
        // the 4th accessory relic is a guarded no-op (returns the same reference).
        const after = equipItem(c, getRelicById('relic-conviction-strike')!);
        expect(after).toBe(c);
    });
});
