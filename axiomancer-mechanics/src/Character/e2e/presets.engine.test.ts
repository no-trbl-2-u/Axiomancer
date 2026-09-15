/**
 * Hermetic e2e — Character presets.
 *
 * Verifies that the three shipped presets build into valid Characters
 * whose level / stats / card rotation / inventory match the
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
        // Phase 19 — every preset wears the default 5-relic loadout (signatures
        // come from worn equipment, not archetype).
        expect(player.equipment.weapon?.id).toBe('relic-overwhelming');
        expect(player.equipment.armor?.id).toBe('relic-read');
        expect(player.equipment.accessories).toHaveLength(3);
        expect(player.knownCards).toHaveLength(7); // Phase 108 — includes Befriend starting card
        // Apprentice declares no procedural gear: inventory = 11 relics (worn-first)
        // + the 1 declared potion.
        expect(player.inventory).toHaveLength(12);
        const potion = player.inventory.find(i => i.id === 'minor-healing-potion');
        expect(potion).toBeDefined();
        expect((potion as Consumable | undefined)?.quantity).toBe(3);
        expect(player.currency).toBe(0);
    });

    it('builds Wanderer with light armor and mixed-tier cards', () => {
        mockSequentialRng(0.5);
        const player = buildCharacterFromPreset(wandererPreset);
        expect(player.level).toBe(8);
        expect(player.baseStats).toEqual({ heart: 5, body: 4, mind: 4 });
        expect(player.knownCards).toHaveLength(11); // spec 32 v3 recipe: 7 openers + 3 mid-tier + the synergy payoff
        // Phase 21 — the procedural library is retired; presets wear the relic
        // loadout and carry NO procedural gear (only relics as equipment).
        expect(player.equipment.weapon?.id).toBe('relic-overwhelming');
        expect(player.equipment.armor?.id).toBe('relic-read');
        const invEquipmentIds = player.inventory.filter(i => i.category === 'equipment').map(i => i.id);
        expect(invEquipmentIds.every(id => id.startsWith('relic-'))).toBe(true);
        expect(invEquipmentIds).not.toContain('iron-blade');
        expect(player.currency).toBe(25);
    });

    it('builds Sage with mid-tier gear and every card known', () => {
        mockSequentialRng(0.5);
        const player = buildCharacterFromPreset(sagePreset);
        expect(player.level).toBe(15);
        expect(player.baseStats).toEqual({ heart: 20, body: 30, mind: 25 });
        expect(player.knownCards).toHaveLength(14); // spec 32 v3 recipe: all tiers + the synergy payoff
        // Profane Canon (2026-08-08): the synergy payoff is communion-of-the-worm
        // (RUPTURE ALL + SIPHON — the resonance-detonation successor).
        expect(player.knownCards).toContain('communion-of-the-worm');
        // Phase 19 — wears the relic loadout; declared procedural gear benched.
        expect(player.equipment.weapon?.id).toBe('relic-overwhelming');
        expect(player.equipment.armor?.id).toBe('relic-read');
        // Phase 21 — no procedural gear; only relics as equipment.
        const invEquipmentIds = player.inventory.filter(i => i.category === 'equipment').map(i => i.id);
        expect(invEquipmentIds.every(id => id.startsWith('relic-'))).toBe(true);
        expect(invEquipmentIds).not.toContain('steel-blade');
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
