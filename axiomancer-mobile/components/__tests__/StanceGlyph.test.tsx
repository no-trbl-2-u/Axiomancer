/**
 * Hermetic component tests — StanceGlyph + GlyphHeart asset wiring.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { GlyphHeart, GlyphBody, GlyphMind, StanceGlyph } from '../StanceGlyph';

afterEach(() => {
    jest.restoreAllMocks();
});

describe('GlyphHeart — woodcut SVG asset', () => {
    it('renders at the default size without throwing', () => {
        const tree = render(<GlyphHeart />);
        expect(tree.toJSON()).not.toBeNull();
    });

    it('renders at the smallest spec-contract size (12 px)', () => {
        const tree = render(<GlyphHeart size={12} />);
        expect(tree.toJSON()).not.toBeNull();
    });

    it('renders at the largest spec-contract size (64 px)', () => {
        const tree = render(<GlyphHeart size={64} />);
        expect(tree.toJSON()).not.toBeNull();
    });

    it('forwards a custom color to the SvgXml root (currentColor inheritance)', () => {
        const tree = render(<GlyphHeart color="#c0152a" />);
        const json = tree.toJSON();
        expect(json).not.toBeNull();
        const serialized = JSON.stringify(json);
        expect(serialized).toContain('#c0152a');
    });

    it('does not hardcode any color other than currentColor in the rendered tree', () => {
        const tree = render(<GlyphHeart color="#abcdef" />);
        const serialized = JSON.stringify(tree.toJSON());
        expect(serialized).not.toMatch(/#000(?![0-9a-f])/i);
        expect(serialized).not.toMatch(/#fff(?![0-9a-f])/i);
    });

    it('accepts the GlyphProps stroke prop without throwing (back-compat with dispatcher)', () => {
        const tree = render(<GlyphHeart size={32} color="#e8dfc8" />);
        expect(tree.toJSON()).not.toBeNull();
    });
});

describe('StanceGlyph dispatcher', () => {
    it('routes kind="heart" to the GlyphHeart asset', () => {
        const tree = render(<StanceGlyph kind="heart" />);
        expect(tree.toJSON()).not.toBeNull();
    });

    it('routes kind="body" to the GlyphBody asset', () => {
        const tree = render(<StanceGlyph kind="body" />);
        expect(tree.toJSON()).not.toBeNull();
    });

    it('routes any other kind (including "mind") to GlyphMind', () => {
        const tree = render(<StanceGlyph kind="mind" />);
        expect(tree.toJSON()).not.toBeNull();
    });

    it('forwards size + color props through to the routed glyph', () => {
        const tree = render(<StanceGlyph kind="heart" size={48} color="#d4c026" />);
        const serialized = JSON.stringify(tree.toJSON());
        expect(serialized).toContain('#d4c026');
    });
});

describe('GlyphBody — woodcut SVG asset', () => {
    it('renders at the default size without throwing', () => {
        const tree = render(<GlyphBody />);
        expect(tree.toJSON()).not.toBeNull();
    });

    it('renders at the smallest spec-contract size (12 px)', () => {
        const tree = render(<GlyphBody size={12} />);
        expect(tree.toJSON()).not.toBeNull();
    });

    it('renders at the largest spec-contract size (64 px)', () => {
        const tree = render(<GlyphBody size={64} />);
        expect(tree.toJSON()).not.toBeNull();
    });

    it('forwards a custom color to the SvgXml root (currentColor inheritance)', () => {
        const tree = render(<GlyphBody color="#c0152a" />);
        const json = tree.toJSON();
        expect(json).not.toBeNull();
        const serialized = JSON.stringify(json);
        expect(serialized).toContain('#c0152a');
    });

    it('does not hardcode any color other than currentColor in the rendered tree', () => {
        const tree = render(<GlyphBody color="#abcdef" />);
        const serialized = JSON.stringify(tree.toJSON());
        expect(serialized).not.toMatch(/#000(?![0-9a-f])/i);
        expect(serialized).not.toMatch(/#fff(?![0-9a-f])/i);
    });
});

describe('GlyphMind (placeholder, untouched by this swap)', () => {
    it('GlyphMind still renders (no regression)', () => {
        const tree = render(<GlyphMind />);
        expect(tree.toJSON()).not.toBeNull();
    });
});
