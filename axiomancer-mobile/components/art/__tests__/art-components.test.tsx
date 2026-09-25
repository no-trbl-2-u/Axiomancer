/**
 * Hermetic component tests — components/art/* visual primitives.
 *
 * Hermetic = self-contained + deterministic + isolated. See
 * docs/testing.md. These pin the render contracts of the decorative
 * art components (FiligreeRule, VictoryWreath) so a future "tidy this
 * up" refactor cannot silently change their dimensions, decorative-a11y posture,
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
import { VictoryWreath } from '@/components/art/VictoryWreath';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: Svg } = require('react-native-svg');

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
