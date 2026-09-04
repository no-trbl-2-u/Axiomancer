/**
 * Hermetic E2E — every consumable does SOMETHING on use (adjust-equipment
 * pass 1, 2026-09-04). `focus-vial` / `heart-draught` / `body-elixir` /
 * `resonance-crystal` / `greater-resonance-crystal` shipped with none of
 * `healAmount` / `effectId` / `inlineEffect` set — `useConsumableEffect`
 * silently applied nothing on use (`healed: 0`, `applied: null`), so 5 of 22
 * consumables were flavor text with no mechanical payload. Fixed by wiring
 * each to the closest existing library effect. This file guards the whole
 * library against the class of bug, not just the 5 fixed instances.
 */

import { describe, it, expect } from 'vitest';
import { Player } from '../../Character/characters.mock';
import { lookupEffect } from '../../Effects';
import { consumableLibrary, getConsumableById } from '../consumable.library';
import { useConsumableEffect } from '../equipment.engine';

// Player mock starts at full HP — a heal-only consumable would show
// `healed: 0` against it (clamped), false-failing the "did something" guard
// below. Wound the fixture first so healing is observable too.
const woundedPlayer = { ...Player, health: 1 };

describe('every library consumable has a real payload', () => {
    it.each(consumableLibrary.map(c => c.id))('%s sets healAmount, effectId, or inlineEffect', id => {
        const item = getConsumableById(id)!;
        const hasPayload =
            (typeof item.healAmount === 'number' && item.healAmount > 0) ||
            item.effectId !== undefined ||
            item.inlineEffect !== undefined;
        expect(hasPayload).toBe(true);
    });

    it.each(consumableLibrary.map(c => c.id))('%s changes HP or effects when used', id => {
        const item = getConsumableById(id)!;
        const before = woundedPlayer;
        const { player: after, healed, applied } = useConsumableEffect(before, item, 1, lookupEffect);
        const didSomething = healed > 0 || applied !== null || after.effects.length !== before.effects.length;
        expect(didSomething).toBe(true);
    });
});

describe('the 5 previously-dead consumables now apply a real effect', () => {
    const cases: Array<[id: string, expectedEffectId: string]> = [
        ['focus-vial', 'buff_accuracy_up'],
        ['heart-draught', 'buff_status_chance_up'],
        ['body-elixir', 'buff_damage_reduction'],
        ['resonance-crystal', 'buff_all_stats_up'],
        ['greater-resonance-crystal', 'buff_all_stats_up'],
    ];

    it.each(cases)('%s applies %s', (id, expectedEffectId) => {
        const item = getConsumableById(id)!;
        const { player: after, applied } = useConsumableEffect(Player, item, 1, lookupEffect);
        expect(applied?.id).toBe(expectedEffectId);
        expect(after.effects.some(e => e.effectId === expectedEffectId)).toBe(true);
    });

    it("greater-resonance-crystal's intensityOverride doubles resonance-crystal's stat gain", () => {
        const base = getConsumableById('resonance-crystal')!;
        const greater = getConsumableById('greater-resonance-crystal')!;
        const { player: afterBase } = useConsumableEffect(Player, base, 1, lookupEffect);
        const { player: afterGreater } = useConsumableEffect(Player, greater, 1, lookupEffect);

        const baseIntensity = afterBase.effects.find(e => e.effectId === 'buff_all_stats_up')?.intensity ?? 0;
        const greaterIntensity = afterGreater.effects.find(e => e.effectId === 'buff_all_stats_up')?.intensity ?? 0;
        expect(greaterIntensity).toBe(baseIntensity * 2);
    });
});
