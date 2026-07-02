/**
 * Hermetic unit tests — rarityAffordance helper (Phase 135).
 *
 * Pins the rarity → visual-kind + accessible-phrase mapping and the
 * palette colour resolution. Pure module, no rendering.
 */

import { describe, expect, it } from '@jest/globals';

import {
    rarityAffordance,
    rarityColors,
    RARITY_BLUE,
} from '@/components/inventory/rarityAffordance';
import { paletteFor, DEFAULT_THEME_ID } from '@/theme/palette';

const AXM = paletteFor(DEFAULT_THEME_ID);

describe('rarityAffordance: visual kind + label', () => {
    it('maps uncommon to a green shine with one-affix language', () => {
        const a = rarityAffordance('uncommon');
        expect(a.kind).toBe('green-shine');
        expect(a.isShine).toBe(true);
        expect(a.isOutline).toBe(false);
        expect(a.label).toBe('uncommon, one affix');
    });

    it('maps rare to a blue shine with two-affix language', () => {
        const a = rarityAffordance('rare');
        expect(a.kind).toBe('blue-shine');
        expect(a.isShine).toBe(true);
        expect(a.label).toBe('rare, two affixes');
    });

    it('maps unique to a red outline with three-fixed-modifiers language', () => {
        const a = rarityAffordance('unique');
        expect(a.kind).toBe('red-outline');
        expect(a.isOutline).toBe(true);
        expect(a.isShine).toBe(false);
        expect(a.label).toBe('unique, three fixed modifiers');
    });

    it('maps common to plain with no extra label', () => {
        const a = rarityAffordance('common');
        expect(a.kind).toBe('plain');
        expect(a.isShine).toBe(false);
        expect(a.isOutline).toBe(false);
        expect(a.label).toBeNull();
    });

    it('collapses null / undefined to the plain common treatment', () => {
        expect(rarityAffordance(null).kind).toBe('plain');
        expect(rarityAffordance(undefined).kind).toBe('plain');
    });
});

describe('rarityColors: palette resolution', () => {
    it('uses the heal hue for uncommon green', () => {
        expect(rarityColors('uncommon', AXM).accent).toBe(AXM.heal);
    });

    it('uses the fixed rarity blue for rare', () => {
        expect(rarityColors('rare', AXM).accent).toBe(RARITY_BLUE);
    });

    it('uses the blood hue for unique red', () => {
        expect(rarityColors('unique', AXM).accent).toBe(AXM.blood);
    });

    it('falls back to bone for common / null', () => {
        expect(rarityColors('common', AXM).accent).toBe(AXM.bone);
        expect(rarityColors(null, AXM).accent).toBe(AXM.bone);
    });

    it('derives a translucent glow wash from the accent', () => {
        expect(rarityColors('uncommon', AXM).glow).toMatch(/^rgba\(/);
    });
});
