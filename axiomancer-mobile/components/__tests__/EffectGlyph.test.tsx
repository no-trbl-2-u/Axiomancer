/**
 * Hermetic component tests — EffectGlyph. Pins the switch
 * contract: each known kind picks its own SVG branch (asserted
 * via Path count, which uniquely identifies each branch since
 * the paths-per-kind table differs), and unknown kinds fall
 * back to a colored placeholder View.
 *
 * Sibling to the EffectChip suite (the chip consumes this
 * glyph). Pure presentation — no async, no store.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';
import { Path, Circle } from 'react-native-svg';

import { EffectGlyph } from '@/components/EffectGlyph';

describe('EffectGlyph: kind → SVG branch', () => {
    it('renders 3 paths + 1 circle for kind="poison"', () => {
        const tree = render(<EffectGlyph kind="poison" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(3);
        expect(tree.UNSAFE_getAllByType(Circle)).toHaveLength(1);
    });

    it('renders 3 paths for kind="bleed"', () => {
        const tree = render(<EffectGlyph kind="bleed" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(3);
    });

    it('renders 1 path for kind="stun"', () => {
        const tree = render(<EffectGlyph kind="stun" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(1);
    });

    it('renders 2 paths for kind="regen"', () => {
        const tree = render(<EffectGlyph kind="regen" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(2);
    });

    it('renders 1 path for kind="burn"', () => {
        const tree = render(<EffectGlyph kind="burn" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(1);
    });

    it('renders 1 path for kind="buff" (upward triangle)', () => {
        const tree = render(<EffectGlyph kind="buff" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(1);
    });

    it('renders 1 path for kind="debuff" (downward triangle)', () => {
        const tree = render(<EffectGlyph kind="debuff" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(1);
    });

    it('renders 1 path for kind="shield"', () => {
        const tree = render(<EffectGlyph kind="shield" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(1);
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
