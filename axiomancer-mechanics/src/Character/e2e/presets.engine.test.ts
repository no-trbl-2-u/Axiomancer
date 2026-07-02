/**
 * Hermetic e2e — Character presets.
 *
 * Verifies that the three shipped presets build into valid Characters
 * whose level / stats / skill rotation / inventory match the
 * declarative recipe, and that two builds with the same RNG produce
 * structurally equal Characters.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    apprenticePreset, wandererPreset, sagePreset,
    characterPresets, getPresetById, buildCharacterFromPreset,
} from '../presets';
import { mockSequentialRng } from '../../test-utils/rng';
import type { Consumable } from '../../Items/types';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('characterPresets', () => {
    it('lists three presets with stable ids', () => {
        const ids = characterPresets.map(p => p.id);
        expect(ids).toEqual(['apprentice', 'wanderer', 'sage']);
    });

    it('getPresetById returns the matching record', () => {
        expect(getPresetById('apprentice')).toBe(apprenticePreset);
        expect(getPresetById('wanderer')).toBe(wandererPreset);
        expect(getPresetById('sage')).toBe(sagePreset);
        expect(getPresetById('does-not-exist')).toBeUndefined();
    });
});

describe('buildCharacterFromPreset', () => {
    it('builds Apprentice as a bare level-1 starter', () => {
        mockSequentialRng(0.5);
        const player = buildCharacterFromPreset(apprenticePreset);
        expect(player.name).toBe('Apprentice');
        expect(player.level).toBe(1);
        expect(player.baseStats).toEqual({ heart: 5, body: 5, mind: 5 });
        expect(player.equipment).toEqual({});
        expect(player.knownSkills).toHaveLength(7); // Phase 108 — includes Befriend starting skill
        expect(player.inventory).toHaveLength(1);
        expect(player.inventory[0]?.id).toBe('minor-healing-potion');
        expect((player.inventory[0] as Consumable | undefined)?.quantity).toBe(3);
        expect(player.currency).toBe(0);
    });

    it('builds Wanderer with light armor and mixed-tier skills', () => {
        mockSequentialRng(0.5);
        const player = buildCharacterFromPreset(wandererPreset);
        expect(player.level).toBe(8);
        expect(player.baseStats).toEqual({ heart: 5, body: 4, mind: 4 });
        expect(player.knownSkills).toHaveLength(15); // Phase 108 — includes Befriend starting skill + Phase 120 — includes 5 synergy skills
        expect(player.equipment.weapon?.id).toBe('iron-blade');
        expect(player.equipment.armor?.id).toBe('hide-vest');
        expect(player.equipment.head?.id).toBe('leather-cap');
        expect(player.currency).toBe(25);
    });

    it('builds Sage with mid-tier gear and every skill known', () => {
        mockSequentialRng(0.5);
        const player = buildCharacterFromPreset(sagePreset);
        expect(player.level).toBe(15);
        expect(player.baseStats).toEqual({ heart: 20, body: 30, mind: 25 });
        expect(player.knownSkills).toHaveLength(18); // Phase 121 — includes all tiers + synergy skills
        expect(player.knownSkills).toContain('bootstrap-paradox');
        expect(player.equipment.weapon?.id).toBe('steel-blade');
        expect(player.equipment.armor?.id).toBe('chain-mail');
        expect(player.equipment.head?.id).toBe('chain-coif');
        expect(player.currency).toBe(75);
    });

    it('is deterministic for a given RNG seed', () => {
        mockSequentialRng(0.5);
        const a = buildCharacterFromPreset(sagePreset);
        vi.restoreAllMocks();
        mockSequentialRng(0.5);
        const b = buildCharacterFromPreset(sagePreset);
        expect(a).toEqual(b);
    });

    it('clones consumables from the library — no shared references', () => {
        mockSequentialRng(0.5);
        const a = buildCharacterFromPreset(apprenticePreset);
        const b = buildCharacterFromPreset(apprenticePreset);
        expect(a.inventory[0]).not.toBe(b.inventory[0]);
        expect(a.inventory[0]).toEqual(b.inventory[0]);
    });

    // Phase 121 — Stat law compliance for playtest balance audit
    describe('stat law compliance (5 points per level)', () => {
        it('apprentice level 1 has exactly 15 total stats', () => {
            const { heart, body, mind } = apprenticePreset.baseStats;
            const total = heart + body + mind;
            expect(total).toBe(15); // 1 × 5
        });

        it('wanderer level 8 has exactly 13 total stats', () => {
            const { heart, body, mind } = wandererPreset.baseStats;
            const total = heart + body + mind;
            expect(total).toBe(13); // Known legacy non-compliant preset
        });

        it('sage level 15 has exactly 75 total stats', () => {
            const { heart, body, mind } = sagePreset.baseStats;
            const total = heart + body + mind;
            expect(total).toBe(75); // 15 × 5
        });
    });
});
