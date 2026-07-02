/**
 * Gathering-minigame palette (visual-audit 2026-06, twenty-second tick).
 *
 * Isolates components/gathering/palette.ts's own contract — the
 * near-identical sibling of components/hazard/palette.ts (covered the
 * twenty-first tick and deferred here). Colour is never the only channel:
 * every material family pairs its colour with a distinct glyph shape, so
 * the map's completeness and per-family glyph distinctness is a real
 * colour-blind-play contract, not cosmetic. Pins:
 *   - FAMILY covers every gather family with a complete colorway, every
 *     colour token is valid hex, every label is uppercase, and every
 *     glyph is in the documented union and distinct per family.
 *   - GL site hues / TRAIT_UI accents / the card-stock ink constants are
 *     valid hex, with uppercase trait labels.
 *   - approachAccent derives `glean` from the live palette's bone and
 *     keeps `strip` pinned, so it tracks the active theme.
 */

import { describe, expect, it } from '@jest/globals';

import { paletteFor, DEFAULT_THEME_ID, THEME_ORDER } from '@/theme/palette';

import {
    approachAccent,
    CARD_EDGE,
    CARD_INK,
    CARD_INK2,
    FAMILY,
    GL,
    PLOT_INK,
    PLOT_PAPER,
    TRAIT_UI,
    type FamilyColorway,
} from '../palette';

const HEX = /^#[0-9a-fA-F]{6}$/;

const FAMILIES = ['bloom', 'resin', 'vein', 'bone'] as const;
const VALID_GLYPHS: FamilyColorway['glyph'][] = ['sprig', 'drop', 'shard', 'knuckle'];

describe('gathering palette — FAMILY colorway map', () => {
    it('covers every gather family exactly once', () => {
        expect(Object.keys(FAMILY).sort()).toEqual([...FAMILIES].sort());
    });

    it.each(FAMILIES)('gives %s a complete colorway with valid hex tokens', (family) => {
        const cw = FAMILY[family];
        expect(cw).toBeDefined();
        for (const token of [cw.c, cw.dark, cw.lite, cw.bg] as const) {
            expect(token).toMatch(HEX);
        }
        expect(cw.label).toBe(cw.label.toUpperCase());
        expect(cw.label.length).toBeGreaterThan(0);
        expect(VALID_GLYPHS).toContain(cw.glyph);
    });

    it('pairs every family with a distinct glyph (the non-colour channel)', () => {
        const glyphs = FAMILIES.map((f) => FAMILY[f].glyph);
        expect(new Set(glyphs).size).toBe(glyphs.length);
    });

    it('pairs every family with a distinct base colour', () => {
        const colours = FAMILIES.map((f) => FAMILY[f].c);
        expect(new Set(colours).size).toBe(colours.length);
    });
});

describe('gathering palette — site hues / trait accents', () => {
    it('GL site hues are all valid hex', () => {
        for (const token of Object.values(GL)) {
            expect(token).toMatch(HEX);
        }
    });

    it('TRAIT_UI carries gift/lure/breath/tangle with uppercase labels and valid hex', () => {
        expect(Object.keys(TRAIT_UI).sort()).toEqual(['breath', 'gift', 'lure', 'tangle']);
        for (const ui of Object.values(TRAIT_UI)) {
            expect(ui.c).toMatch(HEX);
            expect(ui.label).toBe(ui.label.toUpperCase());
            expect(ui.label.length).toBeGreaterThan(0);
        }
    });
});

describe('gathering palette — card-stock constants', () => {
    it('exposes valid hex plot/card ink + paper constants', () => {
        for (const token of [PLOT_PAPER, PLOT_INK, CARD_INK, CARD_INK2, CARD_EDGE]) {
            expect(token).toMatch(HEX);
        }
    });
});

describe('gathering palette — approachAccent', () => {
    it('derives the GLEAN accent from the live palette bone and pins STRIP', () => {
        const AXM = paletteFor(DEFAULT_THEME_ID);
        const accent = approachAccent(AXM);
        expect(accent.glean).toBe(AXM.bone);
        expect(accent.strip).toMatch(HEX);
    });

    it('tracks the active theme — every registered theme derives GLEAN from its own bone', () => {
        for (const id of THEME_ORDER) {
            const AXM = paletteFor(id);
            const accent = approachAccent(AXM);
            expect(accent.glean).toBe(AXM.bone);
            expect(accent.strip).toMatch(HEX);
        }
    });

    it('yields a different GLEAN accent when two themes have different bone', () => {
        const a = paletteFor(DEFAULT_THEME_ID);
        const other = paletteFor(THEME_ORDER.find((id) => id !== DEFAULT_THEME_ID)!);
        if (other.bone !== a.bone) {
            expect(approachAccent(a).glean).not.toBe(approachAccent(other).glean);
        }
        expect(approachAccent(a).strip).toBe(approachAccent(other).strip);
    });
});
