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
import { STARTING_CARD_IDS } from '../../Combat/combat.rewards';

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
        // Every preset wears the starting relics (R7e2: the Suppliant's Ring
        // alone; signatures come from worn equipment, not archetype).
        expect(player.equipment.weapon).toBeNull();
        expect(player.equipment.armor).toBeNull();
        expect(player.equipment.accessories.map(a => a.id)).toEqual(['relic-disarming-plea']);
        // The card purge (P1, 2026-09-27): every preset seeds the grey deck.
        expect(player.knownCards).toEqual([...STARTING_CARD_IDS]);
        // Apprentice declares no procedural gear: inventory = the ring (worn-first)
        // + the 1 declared potion.
        expect(player.inventory.map(i => i.id)).toEqual(['relic-disarming-plea', 'minor-healing-potion']);
        const potion = player.inventory.find(i => i.id === 'minor-healing-potion');
        expect(potion).toBeDefined();
        expect((potion as Consumable | undefined)?.quantity).toBe(3);
        expect(player.currency).toBe(0);
    });

    it('builds Wanderer with light armor and the grey deck', () => {
        mockSequentialRng(0.5);
        const player = buildCharacterFromPreset(wandererPreset);
        expect(player.level).toBe(8);
        expect(player.baseStats).toEqual({ heart: 5, body: 4, mind: 4 });
        expect(player.knownCards).toEqual([...STARTING_CARD_IDS]); // the purge: grey deck at every tier
        // Phase 21 — the procedural library is retired; presets wear the ring
        // and carry NO procedural gear (the ring is the only equipment).
        expect(player.equipment.accessories.map(a => a.id)).toEqual(['relic-disarming-plea']);
        const invEquipmentIds = player.inventory.filter(i => i.category === 'equipment').map(i => i.id);
        expect(invEquipmentIds).toEqual(['relic-disarming-plea']);
        expect(player.currency).toBe(25);
    });

    it('builds Sage with mid-tier gear and the grey deck', () => {
        mockSequentialRng(0.5);
        const player = buildCharacterFromPreset(sagePreset);
        expect(player.level).toBe(15);
        expect(player.baseStats).toEqual({ heart: 20, body: 30, mind: 25 });
        expect(player.knownCards).toEqual([...STARTING_CARD_IDS]); // the purge: grey deck at every tier
        // Wears the ring; declared procedural gear does not resolve (Phase 21),
        // so the ring is the only equipment.
        expect(player.equipment.accessories.map(a => a.id)).toEqual(['relic-disarming-plea']);
        const invEquipmentIds = player.inventory.filter(i => i.category === 'equipment').map(i => i.id);
        expect(invEquipmentIds).toEqual(['relic-disarming-plea']);
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
