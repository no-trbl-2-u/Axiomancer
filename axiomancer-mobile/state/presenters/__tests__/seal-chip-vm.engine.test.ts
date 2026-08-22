/**
 * Phase 50 — Seal chip view-model mapping.
 *
 * `playerPane` maps the Phase 33d engine's `state.glyphs` (GlyphInstance[])
 * onto `CombatPlayerPaneVM.seals`. `crackValue`/`previewText` must mirror
 * `crackGlyph`'s own payload formula (`baseIntensity`/`baseAmount` +
 * `charges`) exactly — the confirm sheet reads these, and WI-2's acceptance
 * criterion 4 requires the "foretold next crack value" never lie.
 */

import { describe, expect, it } from '@jest/globals';
import { createCharacter, initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import type { CombatEncounterState, GlyphInstance } from '@mechanics';

import { buildCombatViewModel } from '../combat-encounter.engine';
import { createMockEncounterEnemy } from '../../mocks/combat.mock';

const DECK = ['spoiled-poultice', 'spoiled-poultice', 'chilblain-watch', 'chilblain-watch'];

function openEncounter(): CombatEncounterState {
    const player = createCharacter({ name: 'Hero', level: 3, baseStats: { heart: 8, body: 8, mind: 8 } });
    player.knownCards = DECK;
    const s = initializeCombatEncounter(player, createMockEncounterEnemy(), DECK, 7);
    return rollEncounterDice(s).state;
}

describe('playerPane: seals (Phase 50)', () => {
    it('returns an empty seals array when state.glyphs is absent', () => {
        const s = openEncounter();
        const vm = buildCombatViewModel(s);
        expect(vm.player.seals).toEqual([]);
    });

    it('maps a poison glyph to its crack value + preview text (baseIntensity + charges)', () => {
        const s = openEncounter();
        const glyphs: GlyphInstance[] = [
            { id: 'g1', cardId: 'glyph-of-suppuration', payload: { kind: 'poison', baseIntensity: 1, duration: 2 }, charges: 2, cap: 3 },
        ];
        const vm = buildCombatViewModel({ ...s, glyphs });
        expect(vm.player.seals).toHaveLength(1);
        const seal = vm.player.seals[0];
        expect(seal.id).toBe('g1');
        expect(seal.kind).toBe('poison');
        expect(seal.charges).toBe(2);
        expect(seal.cap).toBe(3);
        expect(seal.crackValue).toBe(3); // baseIntensity 1 + charges 2
        expect(seal.previewText).toBe('Poison 3, 2 rounds');
        expect(seal.label.toLowerCase()).not.toContain('glyph');
    });

    it('maps a barrier glyph to its crack value (baseAmount + charges)', () => {
        const s = openEncounter();
        const glyphs: GlyphInstance[] = [
            { id: 'g2', cardId: 'glyph-of-the-bulwark', payload: { kind: 'barrier', baseAmount: 2 }, charges: 1, cap: 3 },
        ];
        const vm = buildCombatViewModel({ ...s, glyphs });
        const seal = vm.player.seals[0];
        expect(seal.kind).toBe('barrier');
        expect(seal.crackValue).toBe(3); // baseAmount 2 + charges 1
        expect(seal.previewText).toBe('Barrier 3');
    });

    it('round-trips charges/cap without clamping (the engine already caps on tick)', () => {
        const s = openEncounter();
        const glyphs: GlyphInstance[] = [
            { id: 'g3', cardId: 'ash-that-remembers', payload: { kind: 'poison', baseIntensity: 1, duration: 2 }, charges: 0, cap: 3 },
        ];
        const vm = buildCombatViewModel({ ...s, glyphs });
        expect(vm.player.seals[0].charges).toBe(0);
        expect(vm.player.seals[0].crackValue).toBe(1);
    });
});
