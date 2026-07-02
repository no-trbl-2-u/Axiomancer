/**
 * Hermetic E2E Tests — engine-owned loot generation (Phase 154).
 *
 * Pins the rarity-drop contract and the loot generators absorbed from the
 * mobile app: named-affix counts per rarity (`dropItemAtRarity`), the verified
 * single drop (`generateRarityDrop`), deterministic loot-cache reward sets
 * (`rollCacheLoot`), template inflation (`equipmentFromTemplate`), and the
 * worn-state convention helpers.
 *
 * Hermetic standard: self-contained, deterministic via seeded rng.
 */

import { describe, it, expect } from 'vitest';

import {
    dropItemAtRarity,
    AFFIXES_PER_RARITY,
    countNamedAffixes,
    hasBakedAffix,
    generateRarityDrop,
    rollCacheLoot,
    equipmentFromTemplate,
    equipmentTemplates,
    uniqueTemplates,
    firstEquippedPerSlot,
    isEquippedFirstOfSlot,
    findEquippedInSlot,
    isEquipment,
    type Equipment,
    type Item,
} from '../../index';

/** mulberry32 seeded rng for deterministic assertions. */
function seeded(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** First clean (no baked affix) base template at/below the level. */
function cleanTemplateId(level: number): string {
    const t = equipmentTemplates.find((tpl) => tpl.requiredLevel <= level && !hasBakedAffix(tpl));
    if (!t) throw new Error('no clean template');
    return t.id;
}

/** Roll until the realised affix count matches the target (a slot's affix pool
 * can occasionally roll short); bounded so a genuine failure still terminates. */
function rollExact(level: number, rarity: 'uncommon' | 'rare'): Equipment {
    const id = cleanTemplateId(level);
    for (let i = 0; i < 60; i++) {
        const item = dropItemAtRarity(id, level, rarity);
        if (countNamedAffixes(item) === AFFIXES_PER_RARITY[rarity]) return item;
    }
    throw new Error(`could not roll an exact ${rarity}`);
}

describe('dropItemAtRarity', () => {
    it('common: zero affixes, base name, no rolled mods', () => {
        const item = dropItemAtRarity(cleanTemplateId(10), 10, 'common');
        expect(item.rarity).toBe('common');
        expect(countNamedAffixes(item)).toBe(0);
        expect(item.prefixName).toBeFalsy();
        expect(item.suffixName).toBeFalsy();
        expect(item.rolledMods ?? []).toHaveLength(0);
    });

    it('uncommon: exactly one named affix, stamped uncommon', () => {
        const id = cleanTemplateId(10);
        for (let i = 0; i < 12; i++) {
            const item = dropItemAtRarity(id, 10, 'uncommon');
            expect(item.rarity).toBe('uncommon');
            expect(countNamedAffixes(item)).toBe(1);
        }
    });

    it('rare: a prefix and a suffix, both composed into the name', () => {
        const item = rollExact(10, 'rare');
        expect(item.rarity).toBe('rare');
        expect(item.prefixName).toBeTruthy();
        expect(item.suffixName).toBeTruthy();
        expect(countNamedAffixes(item)).toBe(2);
        expect(item.name).toContain(item.prefixName as string);
        expect(item.name).toContain(item.suffixName as string);
    });

    it('unique: three fixed modifiers, authored name, no prefix/suffix', () => {
        const relic = uniqueTemplates[0];
        const item = dropItemAtRarity(relic.id, Math.max(relic.requiredLevel, 30), 'unique');
        expect(item.rarity).toBe('unique');
        expect(item.name).toBe(relic.name);
        expect(item.prefixName).toBeFalsy();
        expect(item.suffixName).toBeFalsy();
        expect(item.rolledMods ?? []).toHaveLength(3);
    });

    it('is deterministic under a seeded rng', () => {
        const id = cleanTemplateId(20);
        const a = dropItemAtRarity(id, 20, 'rare', seeded(1234));
        const b = dropItemAtRarity(id, 20, 'rare', seeded(1234));
        expect(a).toEqual(b);
    });
});

describe('generateRarityDrop', () => {
    it('generates a verified uncommon drop (exactly 1 affix)', () => {
        const r = generateRarityDrop('uncommon', { playerLevel: 20, rng: seeded(7) });
        expect(r.item).not.toBeNull();
        expect(r.rarity).toBe('uncommon');
        expect(r.affixCount).toBe(1);
        expect(countNamedAffixes(r.item as Equipment)).toBe(1);
    });

    it('generates a verified rare drop (exactly 2 affixes)', () => {
        const r = generateRarityDrop('rare', { playerLevel: 30, rng: seeded(9) });
        expect(r.item).not.toBeNull();
        expect(r.affixCount).toBe(2);
        expect(countNamedAffixes(r.item as Equipment)).toBe(2);
    });

    it('generates a unique relic (3 fixed mods)', () => {
        const r = generateRarityDrop('unique', { playerLevel: 60, rng: seeded(3) });
        expect(r.item).not.toBeNull();
        expect(r.affixCount).toBe(3);
    });

    it('fails gracefully when no template is level-eligible', () => {
        const r = generateRarityDrop('rare', { playerLevel: 0 });
        expect(r.item).toBeNull();
        expect(r.reason).toBeTruthy();
    });
});

describe('rollCacheLoot', () => {
    it('is deterministic: same (level, seed, tier) → same items', () => {
        const a = rollCacheLoot({ playerLevel: 25, seed: 42, tier: 'rich' });
        const b = rollCacheLoot({ playerLevel: 25, seed: 42, tier: 'rich' });
        expect(a).toEqual(b);
    });

    it('respects the modest tier item count band and never throws', () => {
        const items = rollCacheLoot({ playerLevel: 25, seed: 99, tier: 'modest' });
        expect(items.length).toBeGreaterThanOrEqual(1);
        expect(items.length).toBeLessThanOrEqual(2);
    });

    it('returns [] for a level with no eligible templates', () => {
        expect(rollCacheLoot({ playerLevel: 0, seed: 1, tier: 'modest' })).toEqual([]);
    });
});

describe('equipmentFromTemplate', () => {
    it('inflates a template to a common instance, mapping base stats', () => {
        const tpl = equipmentTemplates[0];
        const eq = equipmentFromTemplate(tpl);
        expect(eq.category).toBe('equipment');
        expect(eq.rarity).toBe('common');
        expect(eq.slot).toBe(tpl.slot);
        expect(eq.statModifiers).toEqual(tpl.baseStatModifiers ?? []);
        expect(isEquipment(eq)).toBe(true);
    });
});

describe('worn-state helpers', () => {
    const mk = (id: string, slot: Equipment['slot']): Equipment => ({
        id,
        name: id,
        description: '',
        category: 'equipment',
        slot,
        rarity: 'common',
        requiredLevel: 1,
    });

    it('firstEquippedPerSlot keeps the first equipment per slot', () => {
        const inv: Item[] = [mk('w1', 'weapon'), mk('w2', 'weapon'), mk('a1', 'armor')];
        const map = firstEquippedPerSlot(inv);
        expect(map.get('weapon')?.id).toBe('w1');
        expect(map.get('armor')?.id).toBe('a1');
    });

    it('isEquippedFirstOfSlot / findEquippedInSlot follow the convention', () => {
        const w1 = mk('w1', 'weapon');
        const w2 = mk('w2', 'weapon');
        const inv: Item[] = [w1, w2];
        expect(isEquippedFirstOfSlot(inv, w1)).toBe(true);
        expect(isEquippedFirstOfSlot(inv, w2)).toBe(false);
        expect(findEquippedInSlot(inv, w2)?.id).toBe('w1');
        expect(findEquippedInSlot(inv, w1)).toBeNull();
    });
});
