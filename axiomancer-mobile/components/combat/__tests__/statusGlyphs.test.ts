/**
 * Unit — Spec 25 §7.6 status-effect glyph mapping.
 *
 * Every effect must resolve to a visible glyph + a category colour + a coarse
 * kind so the player can SEE it. Distinctive named effects get distinctive
 * glyphs; everything else falls back to its category glyph.
 */

import { describe, expect, it } from '@jest/globals';
import { effectGlyph, classifyGlyphKind, GLYPH_COLORS } from '../statusGlyphs';

describe('statusGlyphs — classification', () => {
    it('classifies a DoT effect as dot', () => {
        expect(classifyGlyphKind({ id: 'debuff_poison', type: 'debuff', category: 'damage', payload: { damageOverTime: { damagePerRound: 4 } } })).toBe('dot');
    });
    it('classifies a control effect as control', () => {
        expect(classifyGlyphKind({ id: 'debuff_stun', type: 'debuff', category: 'control', payload: { actionRestriction: { skipTurn: true } } })).toBe('control');
    });
    it('classifies a stat debuff as statdown', () => {
        expect(classifyGlyphKind({ id: 'debuff_defense_down', type: 'debuff', category: 'defense', payload: { statModifiers: [{ value: -3 }] } })).toBe('statdown');
    });
    it('classifies a buff as statup', () => {
        expect(classifyGlyphKind({ id: 'buff_x', type: 'buff', category: 'stat', payload: { statModifiers: [{ value: 2 }] } })).toBe('statup');
    });
    it('classifies regen and drain by sign', () => {
        expect(classifyGlyphKind({ id: 'buff_regen', type: 'buff', category: 'regeneration', payload: { regeneration: { healthPerRound: 3 } } })).toBe('regen');
        expect(classifyGlyphKind({ id: 'debuff_drain', type: 'debuff', category: 'regeneration', payload: { regeneration: { healthPerRound: -3 } } })).toBe('drain');
    });
});

describe('statusGlyphs — resolution', () => {
    it('gives distinctive glyphs to named effects', () => {
        expect(effectGlyph({ id: 'debuff_poison', type: 'debuff', payload: { damageOverTime: {} } }).glyph).toBe('☠');
        expect(effectGlyph({ id: 'debuff_bleed', type: 'debuff', payload: { damageOverTime: {} } }).glyph).toBe('🩸');
        expect(effectGlyph({ id: 'debuff_burn', type: 'debuff', payload: { damageOverTime: {} } }).glyph).toBe('🔥');
        expect(effectGlyph({ id: 'debuff_stun', type: 'debuff', category: 'control', payload: { actionRestriction: { skipTurn: true } } }).glyph).toBe('💫');
    });

    it('falls back to a category glyph for unnamed effects, with a colour and label', () => {
        const g = effectGlyph({ id: 'debuff_unknown_thing', type: 'debuff', category: 'control', payload: { actionRestriction: { skipTurn: true } } });
        expect(g.glyph).toBe('⛓');               // control fallback
        expect(g.color).toBe(GLYPH_COLORS.control);
        expect(g.kind).toBe('control');
        expect(g.label).toBe('unknown thing');    // humanised id
    });

    it('every glyph kind has a colour', () => {
        for (const kind of Object.keys(GLYPH_COLORS)) {
            expect(typeof (GLYPH_COLORS as Record<string, string>)[kind]).toBe('string');
        }
    });
});
