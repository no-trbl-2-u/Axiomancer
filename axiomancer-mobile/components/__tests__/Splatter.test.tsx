/**
 * Hermetic component tests — Splatter (phase V7: a real acquired
 * ink-splatter plate, tinted via `tintColor`, replacing the old procedural
 * random-circle SVG). Tests pin the acquired-art contract: deterministic
 * plate selection by seed, and prop passthrough (size, color -> tintColor).
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { processColor } from 'react-native';
import React from 'react';

import { Splatter } from '@/components/Splatter';
import { splatterFor } from '@/assets/images/splatter';

function flattenStyle(style: unknown): Record<string, unknown> {
    return Array.isArray(style) ? Object.assign({}, ...style) : (style as Record<string, unknown>);
}

// expo-image normalizes `source` into an array of resolved sources.
const sourceOf = (image: { props: { source: unknown } }) => image.props.source;

describe('Splatter: acquired-art plate selection', () => {
    it('renders the plate for its seed', () => {
        const tree = render(<Splatter seed={3} />);
        expect(sourceOf(tree.getByTestId('splatter-plate'))).toEqual([splatterFor(3)]);
    });

    it('same seed produces the same plate', () => {
        const a = render(<Splatter seed={42} />);
        const b = render(<Splatter seed={42} />);
        expect(sourceOf(a.getByTestId('splatter-plate')))
            .toEqual(sourceOf(b.getByTestId('splatter-plate')));
    });

    it('different seeds can produce different plates', () => {
        const a = render(<Splatter seed={1} />);
        const b = render(<Splatter seed={2} />);
        expect(sourceOf(a.getByTestId('splatter-plate')))
            .not.toEqual(sourceOf(b.getByTestId('splatter-plate')));
    });
});

describe('Splatter: prop passthrough', () => {
    it('honors a custom size (default 220)', () => {
        const tree = render(<Splatter size={400} />);
        const style = flattenStyle(tree.getByTestId('splatter-plate').props.style);
        expect(style.width).toBe(400);
        expect(style.height).toBe(400);
    });

    it('uses the default size 220 when not specified', () => {
        const tree = render(<Splatter />);
        const style = flattenStyle(tree.getByTestId('splatter-plate').props.style);
        expect(style.width).toBe(220);
        expect(style.height).toBe(220);
    });

    it('applies the color prop as tintColor', () => {
        const tree = render(<Splatter color="#abcdef" />);
        expect(tree.getByTestId('splatter-plate').props.tintColor).toBe(processColor('#abcdef'));
    });

    it('defaults tintColor to a theme colour when no color is passed', () => {
        // Region themes pick a different `blood` hex each — the exact value
        // isn't pinned here (see theme/__tests__/palette.test.ts), only that
        // the default path resolves to SOME real colour, not undefined.
        const tree = render(<Splatter />);
        expect(tree.getByTestId('splatter-plate').props.tintColor).toEqual(expect.any(Number));
    });
});
