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

describe('philosopher-tea and void-essence no longer print byte-identical effect lines (issue #307)', () => {
    // Both used to share `buff_critical_damage_up` (grantAdvantage on all three
    // stances), so the Glen Market shop printed the same "ADVANTAGE ON BODY /
    // MIND / HEART" line for two items at different prices. Split onto
    // `buff_liars_gambit` (mind-only) and `buff_abyssal_presence` (heart-only).
    it('the two consumables reference different effect ids', () => {
        const tea = getConsumableById('philosopher-tea')!;
        const essence = getConsumableById('void-essence')!;
        expect(tea.effectId).not.toBe(essence.effectId);
    });

    it('philosopher-tea grants advantage on mind only', () => {
        const item = getConsumableById('philosopher-tea')!;
        const effect = lookupEffect(item.effectId!)!;
        expect(effect.payload.advantageModifier?.grantAdvantage).toEqual(['mind']);
    });

    it('void-essence grants advantage on heart only', () => {
        const item = getConsumableById('void-essence')!;
        const effect = lookupEffect(item.effectId!)!;
        expect(effect.payload.advantageModifier?.grantAdvantage).toEqual(['heart']);
    });

    it('using each consumable applies its own single-stance advantage grant', () => {
        const teaItem = getConsumableById('philosopher-tea')!;
        const { player: afterTea } = useConsumableEffect(Player, teaItem, 1, lookupEffect);
        expect(afterTea.effects.some(e => e.effectId === 'buff_liars_gambit')).toBe(true);

        const essenceItem = getConsumableById('void-essence')!;
        const { player: afterEssence } = useConsumableEffect(Player, essenceItem, 1, lookupEffect);
        expect(afterEssence.effects.some(e => e.effectId === 'buff_abyssal_presence')).toBe(true);
    });
});

describe('antidote and clarity-serum no longer print byte-identical effect lines (adjust-equipment pass 11)', () => {
    // Both used to share `buff_cleanse` (tier 2), so Herb Trader / Camp
    // Ledgerman / Iron Factor each printed the same "CLEANSE" line for two
    // wares at different prices — the same bug class as issue #307
    // (philosopher-tea/void-essence). clarity-serum now applies its own
    // `buff_cleanse_minor` (tier 1, strips tier-1 debuffs only).
    it('the two consumables reference different effect ids', () => {
        const antidote = getConsumableById('antidote')!;
        const serum = getConsumableById('clarity-serum')!;
        expect(antidote.effectId).not.toBe(serum.effectId);
    });

    it('clarity-serum cleanses at a lower tier than antidote', () => {
        const antidote = getConsumableById('antidote')!;
        const serum = getConsumableById('clarity-serum')!;
        const antidoteEffect = lookupEffect(antidote.effectId!)!;
        const serumEffect = lookupEffect(serum.effectId!)!;
        expect(antidoteEffect.payload.cleanse).toBe(true);
        expect(serumEffect.payload.cleanse).toBe(true);
        expect(serumEffect.tier).toBeLessThan(antidoteEffect.tier);
    });

    it('using each consumable applies its own tier-scoped cleanse', () => {
        const antidoteItem = getConsumableById('antidote')!;
        const { applied: antidoteApplied } = useConsumableEffect(Player, antidoteItem, 1, lookupEffect);
        expect(antidoteApplied?.id).toBe('buff_cleanse');

        const serumItem = getConsumableById('clarity-serum')!;
        const { applied: serumApplied } = useConsumableEffect(Player, serumItem, 1, lookupEffect);
        expect(serumApplied?.id).toBe('buff_cleanse_minor');
    });
});
