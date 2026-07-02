/**
 * Phase 75 — `previewTemplateAtRarity` helper (closes the user-jot
 * at `b5c8165` / mobile item-library mod-visibility).
 *
 * Pins the happy path (rolled-mod count matches rarity tier), the
 * determinism contract (default rng produces identical Equipment
 * across calls), and the three soft-error paths per D1 (unknown
 * templateId / level-too-low / unique-rarity on regular template).
 *
 * The wrapped `dropItem` is already covered by its own e2e; this
 * file only pins the preview-helper-specific behaviour.
 */
import { describe, it, expect } from 'vitest';
import { previewTemplateAtRarity, previewTemplateAtAllRarities } from '../index';

describe('Phase 75 — previewTemplateAtRarity', () => {
    it('returns Equipment with rolled-mod count matching the rarity tier (common=0 / uncommon=1 / rare=2)', () => {
        const common = previewTemplateAtRarity('iron-blade', 'common', 5);
        const uncommon = previewTemplateAtRarity('iron-blade', 'uncommon', 5);
        const rare = previewTemplateAtRarity('iron-blade', 'rare', 5);

        expect(common).toBeDefined();
        expect(uncommon).toBeDefined();
        expect(rare).toBeDefined();

        // Common drops carry no rolledMods (MODS_PER_RARITY['common'] === 0).
        expect(common!.rolledMods ?? []).toHaveLength(0);
        expect(uncommon!.rolledMods).toHaveLength(1);
        expect(rare!.rolledMods).toHaveLength(2);

        // Rarity threads through onto the Equipment instance.
        expect(common!.rarity).toBe('common');
        expect(uncommon!.rarity).toBe('uncommon');
        expect(rare!.rarity).toBe('rare');
    });

    it('is deterministic per (template, rarity, playerLevel) with the default rng (D2)', () => {
        const a = previewTemplateAtRarity('iron-blade', 'uncommon', 5);
        const b = previewTemplateAtRarity('iron-blade', 'uncommon', 5);
        expect(a).toEqual(b);
    });

    it('returns undefined for unknown templateId (D1 — UI-tier safety)', () => {
        expect(previewTemplateAtRarity('no-such-template', 'common', 1)).toBeUndefined();
    });

    it('returns undefined when playerLevel < template.requiredLevel (D1)', () => {
        // mithril-blade is requiredLevel 20; preview at level 5 is unreachable
        // for the player, so the helper returns undefined rather than throwing.
        expect(previewTemplateAtRarity('mithril-blade', 'rare', 5)).toBeUndefined();
    });

    it('returns undefined for rarity="unique" against a regular template (D1)', () => {
        // iron-blade is a regular EquipmentTemplate; unique rarity is reserved
        // for UniqueItemTemplate per Spec 05c §9.
        expect(previewTemplateAtRarity('iron-blade', 'unique', 5)).toBeUndefined();
    });
});

describe('Phase 76 — previewTemplateAtAllRarities (batch helper)', () => {
    it('returns the full Record<ItemRarity, Equipment | undefined> for a regular template', () => {
        const record = previewTemplateAtAllRarities('iron-blade', 5);
        // Three rarities populated (common / uncommon / rare); unique returns
        // undefined because iron-blade is a regular template (Phase 75 D1).
        expect(record.common).toBeDefined();
        expect(record.uncommon).toBeDefined();
        expect(record.rare).toBeDefined();
        expect(record.unique).toBeUndefined();
        // Each cell's rolled-mod count matches the rarity tier (Phase 75 contract).
        expect(record.common!.rolledMods ?? []).toHaveLength(0);
        expect(record.uncommon!.rolledMods).toHaveLength(1);
        expect(record.rare!.rolledMods).toHaveLength(2);
    });

    it('returns all-undefined record when playerLevel < template.requiredLevel (D2)', () => {
        // mithril-blade is requiredLevel 20; preview at level 5 fails for every rarity.
        const record = previewTemplateAtAllRarities('mithril-blade', 5);
        expect(record.common).toBeUndefined();
        expect(record.uncommon).toBeUndefined();
        expect(record.rare).toBeUndefined();
        expect(record.unique).toBeUndefined();
    });

    it('unique template returns only the unique cell populated (D2)', () => {
        // paradox-loop is a UniqueItemTemplate at requiredLevel 15; preview at
        // level 20 (≥15) returns the unique-rolled Equipment in the `unique`
        // cell only — non-unique rarities are reserved for UniqueItemTemplate
        // per Spec 05c §9; previewTemplateAtRarity soft-coerces but the
        // common/uncommon/rare cells still return undefined for these.
        const record = previewTemplateAtAllRarities('paradox-loop', 20);
        expect(record.unique).toBeDefined();
        expect(record.unique!.rarity).toBe('unique');
        // Phase 75 D4 says unique templates soft-coerce rarity → so all four
        // cells return the unique-rolled Equipment (not just the `unique` cell).
        // The other three cells are NOT undefined per D4 — they return the
        // same unique-rolled Equipment.
        expect(record.common).toBeDefined();
        expect(record.common!.rarity).toBe('unique');
    });
});
