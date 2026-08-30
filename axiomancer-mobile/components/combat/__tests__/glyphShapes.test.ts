/**
 * Unit — the card-face FREE-glyph silhouette table (Phase V6, glyph
 * unification). Two jobs: (1) basic hygiene on every registered shape, and
 * (2) a keyword-mark canon audit — every registry keyword that can actually
 * reach the card face through a live effect (`state/combat/keywords.ts`'s
 * `EFFECT_KEYWORD`) must resolve to a real silhouette, and no shape is kept
 * for a keyword the free-glyph path can no longer produce (the BARRIER
 * removal this phase is the regression this guards against).
 */

import { describe, expect, it } from '@jest/globals';

import { GLYPH_SHAPES, glyphShapeFor } from '../glyphShapes';
import { allRegistryKeywords } from '@/state/combat/keywords';

describe('glyphShapes — hygiene', () => {
    it('every registered shape has a non-empty SVG path', () => {
        for (const shape of Object.values(GLYPH_SHAPES)) {
            expect(shape.d.length).toBeGreaterThan(0);
        }
    });

    it('glyphShapeFor is case-insensitive and null-safe', () => {
        expect(glyphShapeFor('bleed')).toEqual(glyphShapeFor('BLEED'));
        expect(glyphShapeFor(null)).toBeNull();
        expect(glyphShapeFor(undefined)).toBeNull();
        expect(glyphShapeFor('not-a-real-keyword')).toBeNull();
    });
});

describe('glyphShapes — keyword canon audit (Phase V6)', () => {
    // The FREE-glyph path (`freeGlyphMeta` in
    // `state/presenters/combat-encounter.engine.ts`) can only ever produce
    // three families of key: the two card-type labels, a fixed set of
    // currency-rider literals (already registry keywords), and a registry
    // keyword resolved via `keywordForEffect`. Every live registry keyword
    // reachable that way must render a canonical mark, not the text-rune
    // fallback.
    const registryKeywords = new Set(allRegistryKeywords().map((k) => k.toUpperCase()));

    it('BARRIER no longer carries a shape (merged into GUARD, Phase 29)', () => {
        expect(glyphShapeFor('BARRIER')).toBeNull();
        expect(registryKeywords.has('BARRIER')).toBe(false);
    });

    it('every effect-backed registry keyword resolves to a silhouette', () => {
        // debuff_poison/_bleed/_mark/_backfire/_quarter, buff_thorns, and the
        // creeping_doom Doom promotion — the only ids a live card may carry
        // on its FREE line (spec 32 v3 §3's card-vocabulary ban list).
        const effectBackedKeywords = ['POISON', 'BLEED', 'MARK', 'BACKFIRE', 'QUARTER', 'THORNS', 'DOOM'];
        for (const kw of effectBackedKeywords) {
            expect(registryKeywords.has(kw)).toBe(true);
            expect(glyphShapeFor(kw)).not.toBeNull();
        }
    });
});
