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
        ['body-elixir', 'buff_stoic_resolve'],
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

describe('body-elixir and iron-skin-draught no longer print byte-identical effect lines (adjust-equipment pass 14)', () => {
    // Both used to share `buff_damage_reduction` (tier 2), so the Cursed
    // Paladin's loot table printed the same "GUARD" line for two drops at the
    // same weight — the same bug class as issue #307 and pass 11
    // (antidote/clarity-serum), surfaced in a reward table instead of a shop.
    // body-elixir now applies its own `buff_stoic_resolve` (tier 1, lesser
    // defenseModifier).
    it('the two consumables reference different effect ids', () => {
        const elixir = getConsumableById('body-elixir')!;
        const draught = getConsumableById('iron-skin-draught')!;
        expect(elixir.effectId).not.toBe(draught.effectId);
    });

    it('body-elixir applies a lesser defense buff than iron-skin-draught', () => {
        const elixir = getConsumableById('body-elixir')!;
        const draught = getConsumableById('iron-skin-draught')!;
        const elixirEffect = lookupEffect(elixir.effectId!)!;
        const draughtEffect = lookupEffect(draught.effectId!)!;
        expect(elixirEffect.payload.defenseModifier).toBeGreaterThan(0);
        expect(draughtEffect.payload.defenseModifier).toBeGreaterThan(0);
        expect(elixirEffect.tier).toBeLessThan(draughtEffect.tier);
    });

    it('using each consumable applies its own tier-scoped defense buff', () => {
        const elixirItem = getConsumableById('body-elixir')!;
        const { applied: elixirApplied } = useConsumableEffect(Player, elixirItem, 1, lookupEffect);
        expect(elixirApplied?.id).toBe('buff_stoic_resolve');

        const draughtItem = getConsumableById('iron-skin-draught')!;
        const { applied: draughtApplied } = useConsumableEffect(Player, draughtItem, 1, lookupEffect);
        expect(draughtApplied?.id).toBe('buff_damage_reduction');
    });
});

describe('war-horn-draught no longer prints the same haste line as berserker-brew / quicksilver-vial (adjust-equipment pass 15)', () => {
    // All three applied `buff_haste` byte-for-byte, but only war-horn-draught
    // is tagged 'late-game' — the dominated-item complaint pass 11/14 fixed
    // elsewhere, here without the items ever sharing one shop/reward table.
    // Split war-horn-draught onto its own tier-3 `buff_haste_surge`.
    it('war-horn-draught references a different effect id than its siblings', () => {
        const draught = getConsumableById('war-horn-draught')!;
        const brew = getConsumableById('berserker-brew')!;
        const vial = getConsumableById('quicksilver-vial')!;
        expect(draught.effectId).not.toBe(brew.effectId);
        expect(draught.effectId).not.toBe(vial.effectId);
        expect(brew.effectId).toBe(vial.effectId);
    });

    it('war-horn-draught grants a stronger roll bonus than the shared buff_haste', () => {
        const draughtEffect = lookupEffect(getConsumableById('war-horn-draught')!.effectId!)!;
        const sharedEffect = lookupEffect(getConsumableById('berserker-brew')!.effectId!)!;
        expect(draughtEffect.payload.rollModifier ?? 0).toBeGreaterThan(sharedEffect.payload.rollModifier ?? 0);
    });

    it('using war-horn-draught applies its own surge effect', () => {
        const item = getConsumableById('war-horn-draught')!;
        const { applied } = useConsumableEffect(Player, item, 1, lookupEffect);
        expect(applied?.id).toBe('buff_haste_surge');
    });
});
