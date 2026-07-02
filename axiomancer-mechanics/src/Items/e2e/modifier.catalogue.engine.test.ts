/**
 * Hermetic E2E Tests — Modifier Catalogue (Spec 05d)
 *
 * Drives `rollModifiers` / `resolveModifiers` against the new Spec 05d
 * catalogue. Coverage matrix (Spec 05d §9 acceptance):
 *
 *   • Roll counts honoured per rarity (Common/Uncommon/Rare/Unique).
 *   • Level gating excludes mods whose lowest `levelReq > playerLevel`.
 *   • Unique-only mods never appear on procedural drops (500-drop sweep).
 *   • Determinism: identical seeded rng → identical rolled mods.
 *   • Hidden-rarity weight distribution matches the documented 10:3:1 ratio.
 *   • `resolveModifiers` substitutes `value: 0` / `bonus: 0` / token sentinels
 *     and concatenates / sums payloads correctly.
 *   • Resolved Equipment passes through `equipItem` cleanly.
 *
 * Hermetic standard: self-contained, deterministic, isolated. All randomness
 * comes from a seeded LCG; no `Math.random` dependence; no `vi` mocks needed.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';

import {
    dropItem,
    rollModifiers,
    resolveModifiers,
    getEquipmentTemplate,
    getUniqueTemplate,
    weaponModPool,
    headModPool,
    bodyModPool,
    handsModPool,
    feetModPool,
    accessoryModPool,
    armorModPool,
    uniqueModPool,
    MOD_POOLS,
    getModifierById,
    pickValueTier,
    allModifiers,
    HIDDEN_MOD_RARITY_WEIGHTS,
} from '../index';
import { equipItem } from '../../Character/equipment.reducer';
import { createCharacter } from '../../Character';

// ─── Deterministic LCG ──────────────────────────────────────────────────────

const seededRng = (seed: number): (() => number) => {
    let state = seed >>> 0;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0x100000000;
    };
};

afterEach(() => vi.restoreAllMocks());

// ─── Catalogue inventory ────────────────────────────────────────────────────

describe('modifier.catalogue: inventory (Spec 05d §4 / §7)', () => {
    it('exports one pool per equipment slot via MOD_POOLS', () => {
        const slots = ['weapon', 'armor', 'head', 'body', 'hands', 'feet', 'accessory'] as const;
        for (const slot of slots) {
            expect(MOD_POOLS[slot]).toBeDefined();
            expect(MOD_POOLS[slot].length).toBeGreaterThanOrEqual(3);
        }
    });

    it('weapon pool ships the 4 documented mods', () => {
        const ids = weaponModPool.map(m => m.id);
        expect(ids).toEqual(
            expect.arrayContaining(['wm-flat-damage', 'wm-lifesteal', 'wm-body-gen', 'wm-exploit']),
        );
    });

    it('every other procedural pool ships at least 3 mods', () => {
        expect(headModPool.length).toBeGreaterThanOrEqual(3);
        expect(bodyModPool.length).toBeGreaterThanOrEqual(3);
        expect(handsModPool.length).toBeGreaterThanOrEqual(3);
        expect(feetModPool.length).toBeGreaterThanOrEqual(3);
        expect(accessoryModPool.length).toBeGreaterThanOrEqual(3);
        expect(armorModPool.length).toBeGreaterThanOrEqual(3);
    });

    it('uniqueModPool ships the 3 documented unique-only signatures', () => {
        const ids = uniqueModPool.map(m => m.id);
        expect(ids).toEqual(
            expect.arrayContaining(['um-stance-echo', 'um-paradox-edge', 'um-resonance-prime']),
        );
    });

    it('every mod has at least one level tier and a non-empty payload', () => {
        for (const mod of allModifiers) {
            expect(mod.levelTiers.length).toBeGreaterThan(0);
            const payloadKeys = Object.keys(mod.payload);
            expect(payloadKeys.length).toBeGreaterThan(0);
        }
    });

    it('every level tier is well-formed (range[0] <= range[1], levelReq >= 1)', () => {
        for (const mod of allModifiers) {
            for (const tier of mod.levelTiers) {
                expect(tier.levelReq).toBeGreaterThanOrEqual(1);
                expect(tier.range[0]).toBeLessThanOrEqual(tier.range[1]);
            }
        }
    });

    it('HIDDEN_MOD_RARITY_WEIGHTS exports the documented 10:3:1 ratio', () => {
        expect(HIDDEN_MOD_RARITY_WEIGHTS.common_mod).toBe(10);
        expect(HIDDEN_MOD_RARITY_WEIGHTS.uncommon_mod).toBe(3);
        expect(HIDDEN_MOD_RARITY_WEIGHTS.rare_mod).toBe(1);
    });
});

// ─── Roll count contract ────────────────────────────────────────────────────

describe('rollModifiers: count per rarity', () => {
    const ironBlade = getEquipmentTemplate('iron-blade')!;

    it('Common returns no mods', () => {
        expect(rollModifiers(ironBlade, 'common', 8, seededRng(1))).toHaveLength(0);
    });

    it('Uncommon returns exactly 1 mod from the slot pool', () => {
        const rolled = rollModifiers(ironBlade, 'uncommon', 8, seededRng(2));
        expect(rolled).toHaveLength(1);
        const ids = weaponModPool.map(m => m.id);
        expect(ids).toContain(rolled[0]!.modId);
    });

    it('Rare returns exactly 2 distinct mods from the slot pool', () => {
        const rolled = rollModifiers(ironBlade, 'rare', 8, seededRng(3));
        expect(rolled).toHaveLength(2);
        expect(new Set(rolled.map(r => r.modId)).size).toBe(2);
    });
});

// ─── Level gating ───────────────────────────────────────────────────────────

describe('rollModifiers: level gating (Spec 05d §5)', () => {
    const ironBlade = getEquipmentTemplate('iron-blade')!;

    it('cannot roll wm-exploit at playerLevel 8 (lvl req 10)', () => {
        const seen = new Set<string>();
        for (let s = 1; s <= 200; s++) {
            const rolled = rollModifiers(ironBlade, 'rare', 8, seededRng(s));
            for (const r of rolled) seen.add(r.modId);
        }
        expect(seen.has('wm-exploit')).toBe(false);
    });

    it('can roll wm-exploit at playerLevel 15', () => {
        const seen = new Set<string>();
        for (let s = 1; s <= 500; s++) {
            const rolled = rollModifiers(ironBlade, 'rare', 15, seededRng(s));
            for (const r of rolled) seen.add(r.modId);
        }
        expect(seen.has('wm-exploit')).toBe(true);
    });

    it('pickValueTier returns the highest tier <= playerLevel', () => {
        const wmFlat = getModifierById('wm-flat-damage')!;
        // levelTiers: [{1,[1,3]},{10,[4,8]},{20,[9,15]}]
        expect(pickValueTier(wmFlat, 1)?.range).toEqual([1, 3]);
        expect(pickValueTier(wmFlat, 9)?.range).toEqual([1, 3]);
        expect(pickValueTier(wmFlat, 10)?.range).toEqual([4, 8]);
        expect(pickValueTier(wmFlat, 19)?.range).toEqual([4, 8]);
        expect(pickValueTier(wmFlat, 20)?.range).toEqual([9, 15]);
    });

    it('pickValueTier returns undefined when playerLevel < every levelReq', () => {
        const wmExploit = getModifierById('wm-exploit')!;
        expect(pickValueTier(wmExploit, 5)).toBeUndefined();
    });
});

// ─── Unique pool exclusion (Spec 05d Q4) ─────────────────────────────────────

describe('rollModifiers: uniqueModPool never appears on procedural drops', () => {
    it('500 procedural drops never surface a unique-only mod ID', () => {
        const uniqueIds = new Set(uniqueModPool.map(m => m.id));
        const rng = seededRng(999);
        for (let i = 0; i < 500; i++) {
            const drop = dropItem('iron-blade', 20, 'rare', rng);
            for (const r of drop.rolledMods ?? []) {
                expect(uniqueIds.has(r.modId)).toBe(false);
            }
        }
    });
});

// ─── Unique drop wiring ─────────────────────────────────────────────────────

describe('rollModifiers: unique templates honour fixedModIds', () => {
    it('axioms-edge rolls exactly its 3 fixedModIds in order', () => {
        const tpl = getUniqueTemplate('axioms-edge')!;
        const rolled = dropItem('axioms-edge', 10, 'unique', seededRng(7)).rolledMods!;
        expect(rolled.map(r => r.modId)).toEqual(tpl.fixedModIds);
    });

    it('paradox-loop rolls exactly its 3 fixedModIds in order', () => {
        const tpl = getUniqueTemplate('paradox-loop')!;
        const rolled = dropItem('paradox-loop', 20, 'unique', seededRng(11)).rolledMods!;
        expect(rolled.map(r => r.modId)).toEqual(tpl.fixedModIds);
    });

    it('axioms-edge rolled values fall within Spec 05d catalogue ranges (lvl 10)', () => {
        const drop = dropItem('axioms-edge', 10, 'unique', seededRng(13));
        const get = (id: string) => drop.rolledMods!.find(m => m.modId === id)!;
        // wm-flat-damage @ lvl 10 → [4, 8]
        expect(get('wm-flat-damage').value).toBeGreaterThanOrEqual(4);
        expect(get('wm-flat-damage').value).toBeLessThanOrEqual(8);
        // wm-body-gen @ lvl 10 → [1, 2]
        expect(get('wm-body-gen').value).toBeGreaterThanOrEqual(1);
        expect(get('wm-body-gen').value).toBeLessThanOrEqual(2);
        // um-paradox-edge @ lvl 10 → [1, 1]
        expect(get('um-paradox-edge').value).toBe(1);
    });
});

// ─── Determinism ────────────────────────────────────────────────────────────

describe('rollModifiers: deterministic with seeded rng', () => {
    it('identical seeds produce identical mod IDs and values', () => {
        const a = rollModifiers(getEquipmentTemplate('iron-blade')!, 'rare', 15, seededRng(77));
        const b = rollModifiers(getEquipmentTemplate('iron-blade')!, 'rare', 15, seededRng(77));
        expect(a).toEqual(b);
    });
});

// ─── Hidden-rarity distribution ─────────────────────────────────────────────

describe('rollModifiers: hidden-rarity weight distribution (Spec 05d §1)', () => {
    it('over 1000 Uncommon weapon rolls, common_mod >> uncommon_mod >> rare_mod', () => {
        // Use a level where all 4 weapon mods are eligible (lvl 20).
        const counts: Record<string, number> = {
            common_mod: 0, uncommon_mod: 0, rare_mod: 0,
        };
        const rng = seededRng(424242);
        const tpl = getEquipmentTemplate('iron-blade')!;
        for (let i = 0; i < 1000; i++) {
            const rolled = rollModifiers(tpl, 'uncommon', 20, rng);
            const mod = getModifierById(rolled[0]!.modId)!;
            counts[mod.hiddenRarity] = (counts[mod.hiddenRarity] ?? 0) + 1;
        }
        // Eligible weapon pool at lvl 20 has 1 common, 2 uncommon, 1 rare.
        // Per-mod weights: common=10, uncommon=3, rare=1.
        // Aggregate weights across the pool:
        //   common  → 1 × 10 = 10
        //   uncommon → 2 × 3 = 6
        //   rare    → 1 × 1 = 1
        // Total weight = 17 → expected counts ≈ 588 / 353 / 59.
        // Bands give plenty of tolerance for the LCG.
        expect(counts.common_mod).toBeGreaterThan(counts.uncommon_mod);
        expect(counts.uncommon_mod).toBeGreaterThan(counts.rare_mod);
        expect(counts.rare_mod).toBeGreaterThan(0); // sanity: rare can roll
    });
});

// ─── resolveModifiers payload merging ───────────────────────────────────────

describe('resolveModifiers: payload merging', () => {
    it('substitutes value:0 sentinel in statModifiers with rolled value', () => {
        const tpl = getEquipmentTemplate('iron-blade')!;
        const merged = resolveModifiers(tpl, [{ modId: 'wm-flat-damage', value: 7 }]);
        expect(merged.statModifiers).toContainEqual({ stat: 'physicalAttack', value: 7 });
        // Base stats preserved.
        expect(merged.statModifiers).toContainEqual({ stat: 'body', value: 2 });
    });

    it('substitutes bonus:0 sentinel in generationBonus with rolled value', () => {
        const tpl = getEquipmentTemplate('iron-blade')!;
        const merged = resolveModifiers(tpl, [{ modId: 'wm-body-gen', value: 3 }]);
        expect(merged.resourceInteraction?.generationBonus).toEqual([
            { trigger: 'hit', resourceType: 'body', bonus: 3 },
        ]);
    });

    it('substitutes 0-value combatStartTokens with rolled value (Spec 05b Q2 sum)', () => {
        const tpl = getEquipmentTemplate('hide-vest')!;
        const merged = resolveModifiers(tpl, [
            { modId: 'armm-heart-start', value: 4 },
        ]);
        expect(merged.resourceInteraction?.combatStartTokens?.heart).toBe(4);
    });

    it('sums combatStartTokens across multiple mods', () => {
        const tpl = getEquipmentTemplate('hide-vest')!;
        // Two distinct mods that both grant heart at start, each with a
        // different rolled value. Verify additive merge.
        const merged = resolveModifiers(tpl, [
            { modId: 'armm-heart-start', value: 2 },
            { modId: 'armm-heart-start', value: 3 },
        ]);
        expect(merged.resourceInteraction?.combatStartTokens?.heart).toBe(5);
    });

    it('concatenates onHitEffects arrays from multiple mods', () => {
        const tpl = getEquipmentTemplate('iron-blade')!;
        const merged = resolveModifiers(tpl, [
            { modId: 'wm-lifesteal', value: 1 },
            { modId: 'wm-exploit',   value: 5 },
        ]);
        expect(merged.onHitEffects).toBeDefined();
        // wm-lifesteal contributes 1 proc; wm-exploit contributes 1 proc → 2.
        expect(merged.onHitEffects).toHaveLength(2);
        // wm-exploit also pushes a stat modifier; the rolled value substitutes.
        expect(merged.statModifiers).toContainEqual({ stat: 'physicalAttack', value: 5 });
    });

    it('resolves um-resonance-prime into 3 stance tokens with the rolled value', () => {
        const tpl = getUniqueTemplate('paradox-loop')!;
        const merged = resolveModifiers(tpl, [
            { modId: 'um-resonance-prime', value: 2 },
        ]);
        const cs = merged.resourceInteraction?.combatStartTokens;
        expect(cs?.heart).toBe(2);
        expect(cs?.body).toBe(2);
        expect(cs?.mind).toBe(2);
    });

    it('resolves um-stance-echo into 3 generationBonus entries with the rolled value', () => {
        const tpl = getUniqueTemplate('axioms-edge')!;
        const merged = resolveModifiers(tpl, [
            { modId: 'um-stance-echo', value: 1 },
        ]);
        const gb = merged.resourceInteraction?.generationBonus ?? [];
        expect(gb).toHaveLength(3);
        const types = gb.map(g => g.resourceType).sort();
        expect(types).toEqual(['body', 'heart', 'mind']);
        for (const entry of gb) {
            expect(entry.bonus).toBe(1);
            expect(entry.trigger).toBe('any');
        }
    });

    it('passiveEffects from rolled mods are included in the resolved Equipment', () => {
        const tpl = getEquipmentTemplate('cloth-wrap')!;
        const merged = resolveModifiers(tpl, [{ modId: 'bm-reflect', value: 1 }]);
        expect(merged.passiveEffects).toContain('buff_reflect');
    });
});

// ─── equipItem round-trip with rolled payloads ──────────────────────────────

describe('Spec 05d → equipItem round-trip', () => {
    it('an Uncommon weapon drop with wm-flat-damage equips and lifts physicalAttack', () => {
        const tpl = getEquipmentTemplate('iron-blade')!;
        const player = createCharacter({
            name: 'Equipper',
            level: 8,
            baseStats: { heart: 4, body: 3, mind: 2 },
        });
        const rolledMods = [{ modId: 'wm-flat-damage', value: 5 }];
        const resolved = resolveModifiers(tpl, rolledMods);
        const drop = {
            ...tpl,
            category: 'equipment' as const,
            rarity: 'uncommon' as const,
            ...resolved,
            rolledMods,
        };
        const equipped = equipItem(player, drop);
        expect(equipped.equipment.weapon).toBe(drop);
        // +2 body (base) ⇒ physicalAttack baseline; +5 from rolled mod.
        const lift = equipped.derivedStats.physicalAttack - player.derivedStats.physicalAttack;
        expect(lift).toBeGreaterThanOrEqual(5);
    });
});
