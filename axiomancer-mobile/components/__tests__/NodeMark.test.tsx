/**
 * Hermetic component tests — NodeMark. Pins the kind → SVG
 * branch contract for the exploration-map node glyphs. Each
 * of the four kinds (completed / locked / current / available)
 * renders a distinct combination of Circle / Path nodes; this
 * suite reads those counts + distinguishing prop values to
 * lock the visual semantic.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

import { NodeMark } from '@/components/NodeMark';
import { AXM } from '@/theme/axm';

describe('NodeMark: kind → SVG branch', () => {
    it('completed renders the skull glyph on a backing disc (1 path + 3 circles)', () => {
        const tree = render(<NodeMark kind="completed" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(1);
        // backing disc + two eye sockets
        expect(tree.UNSAFE_getAllByType(Circle)).toHaveLength(3);
    });

    it('locked renders 2 circles + 1 path with AXM.blood stroke (X mark)', () => {
        const tree = render(<NodeMark kind="locked" />);
        // backing disc + dashed seal ring
        expect(tree.UNSAFE_getAllByType(Circle)).toHaveLength(2);
        const paths = tree.UNSAFE_getAllByType(Path);
        expect(paths).toHaveLength(1);
        expect(paths[0].props.stroke).toBe(AXM.blood);
    });

    it('current renders nested circles with sulfur accent (incl. backing)', () => {
        const tree = render(<NodeMark kind="current" />);
        const circles = tree.UNSAFE_getAllByType(Circle);
        expect(circles).toHaveLength(4);
        // Inner-fill circle carries the sulfur accent.
        const sulfurCircle = circles.find((c) => c.props.fill === AXM.sulfur);
        expect(sulfurCircle).toBeDefined();
    });

    it('available (default) renders 3 circles with parchment chrome (incl. backing)', () => {
        const tree = render(<NodeMark />);
        const circles = tree.UNSAFE_getAllByType(Circle);
        expect(circles).toHaveLength(3);
        // Outer ring uses parchment stroke; inner dot uses parchment fill.
        const strokeRing = circles.find((c) => c.props.stroke === AXM.parchment);
        const fillDot = circles.find((c) => c.props.fill === AXM.parchment);
        expect(strokeRing).toBeDefined();
        expect(fillDot).toBeDefined();
    });

    it('renders the same shape as available when kind is explicit', () => {
        const tree = render(<NodeMark kind="available" />);
        expect(tree.UNSAFE_getAllByType(Circle)).toHaveLength(3);
        expect(tree.UNSAFE_queryAllByType(Path)).toHaveLength(0);
    });
});

describe('NodeMark: size prop', () => {
    it('passes the size prop through to the Svg width + height (default 28)', () => {
        const tree = render(<NodeMark kind="current" />);
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.width).toBe(28);
        expect(svg.props.height).toBe(28);
    });

    it('honors a custom size prop on every kind', () => {
        for (const kind of ['completed', 'locked', 'current', 'available'] as const) {
            const tree = render(<NodeMark kind={kind} size={48} />);
            const svg = tree.UNSAFE_getByType(Svg);
            expect(svg.props.width).toBe(48);
            expect(svg.props.height).toBe(48);
        }
    });
});
