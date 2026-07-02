/**
 * Hermetic component tests — components/art/* visual primitives.
 *
 * Hermetic = self-contained + deterministic + isolated. See
 * docs/testing.md. These pin the render contracts of the four
 * decorative art components (FiligreeRule, PlayerPortrait,
 * TitleEmblem, VictoryWreath) so a future "tidy this up" refactor
 * cannot silently change their dimensions, decorative-a11y posture,
 * or theme-aware colour forwarding.
 *
 * react-native-svg host names vary by env, so SVG roots are read via
 * `UNSAFE_getByType` against the imported component classes — the
 * same approach used by PixelEmblem's test.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { FiligreeRule } from '@/components/art/Filigree';
import { PlayerPortrait } from '@/components/art/PlayerPortrait';
import { TitleEmblem } from '@/components/art/TitleEmblem';
import { VictoryWreath } from '@/components/art/VictoryWreath';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: Svg, Line } = require('react-native-svg');

describe('FiligreeRule — decorative divider', () => {
    it('mounts without throwing at the default width', () => {
        const tree = render(<FiligreeRule />);
        expect(tree.toJSON()).not.toBeNull();
    });

    it('is hidden from the a11y tree (decorative)', () => {
        const tree = render(<FiligreeRule />);
        const json = tree.toJSON();
        const serialized = JSON.stringify(json);
        expect(serialized).toContain('no-hide-descendants');
    });

    it('forwards a custom color to the rule', () => {
        const tree = render(<FiligreeRule color="#abcdef" />);
        const serialized = JSON.stringify(tree.toJSON());
        expect(serialized).toContain('#abcdef');
    });

    it('honours a numeric width prop on the row', () => {
        const tree = render(<FiligreeRule width={240} />);
        const serialized = JSON.stringify(tree.toJSON());
        expect(serialized).toContain('240');
    });
});

describe('PlayerPortrait — pilgrim bust', () => {
    it('renders the default 80x96 SVG', () => {
        const tree = render(<PlayerPortrait />);
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.width).toBe(80);
        expect(svg.props.height).toBe(96);
    });

    it('honours explicit width/height props', () => {
        const tree = render(<PlayerPortrait width={120} height={144} />);
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.width).toBe(120);
        expect(svg.props.height).toBe(144);
    });

    it('is hidden from the a11y tree (decorative; label supplied by caller frame)', () => {
        const tree = render(<PlayerPortrait />);
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.accessibilityElementsHidden).toBe(true);
        expect(svg.props.importantForAccessibility).toBe('no-hide-descendants');
    });

    it('keeps the fixed 0 0 100 120 viewBox regardless of size', () => {
        const tree = render(<PlayerPortrait width={200} height={240} />);
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.viewBox).toBe('0 0 100 120');
    });
});

describe('TitleEmblem — heraldic crest', () => {
    it('renders the default 168x168 SVG', () => {
        const tree = render(<TitleEmblem />);
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.width).toBe(168);
        expect(svg.props.height).toBe(168);
    });

    it('honours the size prop (square)', () => {
        const tree = render(<TitleEmblem size={220} />);
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.width).toBe(220);
        expect(svg.props.height).toBe(220);
    });

    it('is decorative by default (hidden from a11y, no label)', () => {
        const tree = render(<TitleEmblem />);
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.accessibilityElementsHidden).toBe(true);
        expect(svg.props.accessibilityRole).toBeUndefined();
    });

    it('exposes itself as a labelled image when given a title', () => {
        const tree = render(<TitleEmblem title="Axiomancer" />);
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.accessibilityRole).toBe('image');
        expect(svg.props.accessibilityLabel).toBe('Axiomancer');
        expect(svg.props.accessibilityElementsHidden).toBeUndefined();
    });

    it('renders the full 24-tick astrolabe ring', () => {
        const tree = render(<TitleEmblem />);
        const lines = tree.UNSAFE_queryAllByType(Line);
        // 24 astrolabe ticks + 6 radiant-burst rays + 1 fuller groove = 31.
        expect(lines.length).toBe(31);
    });
});

describe('VictoryWreath — aftermath laurel', () => {
    it('renders the default size (96 wide, 0.84 aspect)', () => {
        const tree = render(<VictoryWreath />);
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.width).toBe(96);
        expect(svg.props.height).toBeCloseTo(96 * 0.84);
    });

    it('honours the size prop, preserving aspect ratio', () => {
        const tree = render(<VictoryWreath size={120} />);
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.width).toBe(120);
        expect(svg.props.height).toBeCloseTo(120 * 0.84);
    });

    it('is hidden from the a11y tree (decorative)', () => {
        const tree = render(<VictoryWreath />);
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.accessibilityElementsHidden).toBe(true);
        expect(svg.props.importantForAccessibility).toBe('no-hide-descendants');
    });

    it('forwards a custom branch color and accent', () => {
        // react-native-svg's host serializer converts colours to ARGB
        // int payloads, so assert against those rather than hex strings.
        // #abcdef -> 0xFFabcdef, #fedcba -> 0xFFfedcba.
        const argb = (hex: number) => (0xff000000 + hex) >>> 0;
        const tree = render(<VictoryWreath color="#abcdef" accent="#fedcba" />);
        const serialized = JSON.stringify(tree.toJSON());
        expect(serialized).toContain(String(argb(0xabcdef)));
        expect(serialized).toContain(String(argb(0xfedcba)));
    });
});
