/**
 * Hermetic component tests — BodyDiagram (static SVG of the
 * pilgrim's silhouette, used as the equipment-slot diagram on
 * the inventory + SELF surfaces).
 *
 * Zero props, single render branch. Pin the SVG shape so any
 * accidental edit (lost limb, missing slot dot, swapped color)
 * surfaces here rather than in a screenshot diff.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { BodyDiagram } from '@/components/BodyDiagram';
import { AXM } from '@/theme/axm';

describe('BodyDiagram: render shape', () => {
    it('mounts a single Svg', () => {
        const tree = render(<BodyDiagram />);
        expect(tree.UNSAFE_getAllByType(Svg)).toHaveLength(1);
    });

    it('emits 10 Circles — 1 head outline + 2 elbow joints + 7 slot dots', () => {
        const tree = render(<BodyDiagram />);
        expect(tree.UNSAFE_getAllByType(Circle)).toHaveLength(10);
    });

    it('emits 5 Paths — 1 torso + 2 arms + 2 legs', () => {
        const tree = render(<BodyDiagram />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(5);
    });

    it('emits 2 Ellipses — the two feet', () => {
        const tree = render(<BodyDiagram />);
        expect(tree.UNSAFE_getAllByType(Ellipse)).toHaveLength(2);
    });
});

describe('BodyDiagram: slot-dot palette', () => {
    it('renders the 7 slot dots in AXM.sulfur (the equipment-slot accent)', () => {
        const tree = render(<BodyDiagram />);
        const sulfurFilledCircles = tree.UNSAFE_getAllByType(Circle).filter(
            (c) => c.props.fill === AXM.sulfur,
        );
        expect(sulfurFilledCircles).toHaveLength(7);
    });

    it('the body outlines (head + elbows) are unfilled in parchment stroke', () => {
        const tree = render(<BodyDiagram />);
        const outlineCircles = tree.UNSAFE_getAllByType(Circle).filter(
            (c) => c.props.fill === 'none' && c.props.stroke === AXM.parchment,
        );
        expect(outlineCircles).toHaveLength(3);
    });
});

describe('BodyDiagram: viewport invariants', () => {
    it('uses a fixed 88x220 viewBox so callers can size deterministically', () => {
        const tree = render(<BodyDiagram />);
        const svg = tree.UNSAFE_getAllByType(Svg)[0];
        expect(svg.props.viewBox).toBe('0 0 88 220');
        expect(svg.props.width).toBe(88);
        expect(svg.props.height).toBe(220);
    });
});
