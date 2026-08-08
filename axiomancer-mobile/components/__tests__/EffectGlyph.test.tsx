/**
 * Hermetic component tests — EffectGlyph. Pins the adapter contract
 * (Phase V1): each known status-effect kind resolves to its registry
 * silhouette (an Svg with at least one Path), and unknown kinds fall
 * back to a colored placeholder View — the loud "this effect has no
 * mark yet" signal.
 *
 * Sibling to the EffectChip suite (the chip consumes this glyph).
 * Pure presentation — no async, no store.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';
import { Path } from 'react-native-svg';

import { EffectGlyph } from '@/components/EffectGlyph';

const KNOWN_KINDS: readonly string[] = [
    'poison',
    'bleed',
    'stun',
    'regen',
    'burn',
    'buff',
    'debuff',
    'shield',
];

describe('EffectGlyph: kind → registry silhouette', () => {
    it.each(KNOWN_KINDS)('kind="%s" renders at least one Path', (kind) => {
        const tree = render(<EffectGlyph kind={kind} />);
        expect(tree.UNSAFE_getAllByType(Path).length).toBeGreaterThanOrEqual(1);
    });

    it.each(KNOWN_KINDS)('kind="%s" exposes the registry a11y label', (kind) => {
        const tree = render(<EffectGlyph kind={kind} />);
        const label = `${kind[0].toUpperCase()}${kind.slice(1)} effect`.replace(
            'Regen effect',
            'Regeneration effect',
        );
        expect(tree.getByLabelText(label)).toBeTruthy();
    });
});

describe('EffectGlyph: default branch', () => {
    it('renders a placeholder View (no SVG paths) for unknown kinds', () => {
        const tree = render(<EffectGlyph kind="not-a-real-effect" />);
        // Default branch returns a plain <View />, so no Path nodes.
        expect(tree.UNSAFE_queryAllByType(Path)).toHaveLength(0);
        // At least one View renders (the placeholder).
        expect(tree.UNSAFE_getAllByType(View).length).toBeGreaterThan(0);
    });

    it('placeholder uses the requested size + color', () => {
        const tree = render(
            <EffectGlyph kind="unknown" size={24} color="#abcdef" />,
        );
        const views = tree.UNSAFE_getAllByType(View);
        // The component's default-case returns the only View we render
        // for this kind; outer wrappers from testing-library don't show
        // up as plain `View` nodes here.
        const styled = views.find((v) => {
            const style = v.props.style;
            if (Array.isArray(style)) {
                // Handle style array case (from useMemo)
                return style.some(s => s?.backgroundColor === '#abcdef');
            }
            return (style as { backgroundColor?: string })?.backgroundColor === '#abcdef';
        });
        expect(styled).toBeDefined();

        // Extract style properties from array or direct object
        const style = styled?.props.style;
        let width, height;
        if (Array.isArray(style)) {
            // Find the style object with dimensions
            const dimensionStyle = style.find(s => s?.width !== undefined);
            width = dimensionStyle?.width;
            height = dimensionStyle?.height;
        } else {
            width = (style as { width: number })?.width;
            height = (style as { height: number })?.height;
        }

        expect(width).toBe(24);
        expect(height).toBe(24);
    });
});
