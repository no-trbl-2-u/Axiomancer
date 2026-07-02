/**
 * Hermetic component tests — Splatter (combat-prelude decorative
 * SVG). The component uses a deterministic `rnd(i, seed)` helper
 * to place 28 droplet circles + 1 main blot — tests pin both the
 * total circle count and the determinism contract (same seed →
 * same positions; different seeds → different positions).
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import Svg, { Circle } from 'react-native-svg';

import { Splatter } from '@/components/Splatter';

describe('Splatter: circle count', () => {
    it('renders 29 circles total (1 main blot + 28 droplets)', () => {
        const tree = render(<Splatter />);
        expect(tree.UNSAFE_getAllByType(Circle)).toHaveLength(29);
    });
});

describe('Splatter: determinism', () => {
    it('same seed produces identical positions', () => {
        const a = render(<Splatter seed={42} />);
        const b = render(<Splatter seed={42} />);
        const aCircles = a.UNSAFE_getAllByType(Circle).map((c) => ({
            cx: c.props.cx,
            cy: c.props.cy,
            r: c.props.r,
        }));
        const bCircles = b.UNSAFE_getAllByType(Circle).map((c) => ({
            cx: c.props.cx,
            cy: c.props.cy,
            r: c.props.r,
        }));
        expect(aCircles).toEqual(bCircles);
    });

    it('different seeds produce different positions', () => {
        const a = render(<Splatter seed={1} />);
        const b = render(<Splatter seed={2} />);
        const aMain = a.UNSAFE_getAllByType(Circle)[0];
        const bMain = b.UNSAFE_getAllByType(Circle)[0];
        // At least one of the main blot's properties differs between seeds.
        const differs =
            aMain.props.cx !== bMain.props.cx ||
            aMain.props.cy !== bMain.props.cy ||
            aMain.props.r !== bMain.props.r;
        expect(differs).toBe(true);
    });
});

describe('Splatter: prop passthrough', () => {
    it('honors a custom size on the Svg root (default 220)', () => {
        const tree = render(<Splatter size={400} />);
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.width).toBe(400);
        expect(svg.props.height).toBe(400);
    });

    it('uses the default size 220 when not specified', () => {
        const tree = render(<Splatter />);
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.width).toBe(220);
        expect(svg.props.height).toBe(220);
    });

    it('applies the color prop to every circle fill', () => {
        const tree = render(<Splatter color="#abcdef" />);
        const circles = tree.UNSAFE_getAllByType(Circle);
        for (const circle of circles) {
            expect(circle.props.fill).toBe('#abcdef');
        }
    });
});
