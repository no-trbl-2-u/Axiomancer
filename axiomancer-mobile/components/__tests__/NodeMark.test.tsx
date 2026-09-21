/**
 * Hermetic component tests — NodeMark. Pins the kind → SVG
 * branch contract for the exploration-map node glyphs. Each
 * of the four kinds (completed / locked / current / available)
 * renders a distinct combination of Circle / Path nodes; this
 * suite reads those counts + distinguishing prop values to
 * lock the visual semantic.
 *
 * S4-world-C06 re-pinned the accent: `available` (where you CAN go)
 * carries the sulfur beacon, `current` (where you already stand) is a
 * muted bone pin. The assertions below are the same strength as before,
 * inverted, and each kind now also asserts it does NOT wear the other's
 * accent so the pair can never drift back together.
 *
 * 2026-09-21 (owner finding 9 / D1) — the three states a player has to
 * tell apart must be distinguishable WITHOUT COLOUR. The `✕` that 23 of
 * 28 nodes wore in the owner's Drowned Parish screenshot is gone, and the
 * `NODE_MARK_COLOURLESS` block below pins the channels that replaced it:
 * fill (mass), size (radius), and shape. Those assertions read no hue at
 * all — they would hold on a greyscale screen — which is the whole point.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

import { NodeMark, NODE_MARK_RADIUS, type NodeMarkKind } from '@/components/NodeMark';
import { AXM } from '@/theme/axm';

describe('NodeMark: kind → SVG branch', () => {
    it('completed renders the skull cut out of a solid disc (1 path + 4 circles)', () => {
        const tree = render(<NodeMark kind="completed" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(1);
        // backing disc + the solid bone mass + two eye sockets
        expect(tree.UNSAFE_getAllByType(Circle)).toHaveLength(4);
    });

    it('locked renders an EMPTY broken ring — no cross, no fill, no accent hue', () => {
        const tree = render(<NodeMark kind="locked" />);
        // backing shadow + the dashed seal ring. Nothing else.
        const circles = tree.UNSAFE_getAllByType(Circle);
        expect(circles).toHaveLength(2);

        // The `✕` is retired: a sealed node stops offering itself rather
        // than shouting. It was the loudest mark on a map where it is the
        // majority state.
        expect(tree.UNSAFE_queryAllByType(Path)).toHaveLength(0);
        expect(circles.some((c) => c.props.stroke === AXM.blood)).toBe(false);
        expect(circles.some((c) => c.props.fill === AXM.blood)).toBe(false);

        // The ring itself is hollow and broken.
        const ring = circles.find((c) => c.props.strokeDasharray !== undefined);
        expect(ring).toBeDefined();
        expect(ring!.props.fill).toBe('none');
    });

    it('current renders nested circles with a muted bone pin, never the sulfur beacon', () => {
        const tree = render(<NodeMark kind="current" />);
        const circles = tree.UNSAFE_getAllByType(Circle);
        expect(circles).toHaveLength(4);
        // Inner-fill circle carries the bone accent; the dashed ring says
        // "standing here" rather than "go here".
        const boneCircle = circles.find((c) => c.props.fill === AXM.bone);
        expect(boneCircle).toBeDefined();
        const dashedRing = circles.find((c) => c.props.strokeDasharray !== undefined);
        expect(dashedRing).toBeDefined();
        // S4-world-C06: the node you already occupy must not be the
        // brightest mark on the chart.
        expect(circles.some((c) => c.props.fill === AXM.sulfur)).toBe(false);
        expect(circles.some((c) => c.props.stroke === AXM.sulfur)).toBe(false);
    });

    it('available (default) renders 3 circles with the sulfur beacon (incl. backing)', () => {
        const tree = render(<NodeMark />);
        const circles = tree.UNSAFE_getAllByType(Circle);
        expect(circles).toHaveLength(3);
        // Outer ring uses sulfur stroke; inner dot uses sulfur fill.
        const strokeRing = circles.find((c) => c.props.stroke === AXM.sulfur);
        const fillDot = circles.find((c) => c.props.fill === AXM.sulfur);
        expect(strokeRing).toBeDefined();
        expect(fillDot).toBeDefined();
    });

    it('renders the same shape as available when kind is explicit', () => {
        const tree = render(<NodeMark kind="available" />);
        expect(tree.UNSAFE_getAllByType(Circle)).toHaveLength(3);
        expect(tree.UNSAFE_queryAllByType(Path)).toHaveLength(0);
    });
});

/**
 * NODE_MARK_COLOURLESS — owner finding 9: "three node states must be
 * visually distinct WITHOUT relying on colour alone".
 *
 * Every assertion here is hue-free on purpose. If the glyphs are ever
 * retuned so the only difference left is a palette token, this block goes
 * red even though the screen still "looks fine" to a trichromat reviewer.
 */
describe('NODE_MARK_COLOURLESS: the three states separate without hue', () => {
    it('separates them by SIZE — open is the largest mark, sealed the smallest', () => {
        expect(NODE_MARK_RADIUS.available).toBeGreaterThan(NODE_MARK_RADIUS.completed);
        expect(NODE_MARK_RADIUS.completed).toBeGreaterThan(NODE_MARK_RADIUS.locked);
        // The gap has to be visible at a glance, not a rounding difference.
        expect(NODE_MARK_RADIUS.available - NODE_MARK_RADIUS.locked).toBeGreaterThanOrEqual(5);
    });

    it('separates them by FILL — trodden is a solid mass, sealed is empty, open is a ring + core', () => {
        /** Every `fill` value the kind actually paints (excluding 'none'). */
        const fills = (kind: NodeMarkKind): string[] =>
            render(<NodeMark kind={kind} />)
                .UNSAFE_getAllByType(Circle)
                .map((c) => c.props.fill)
                .filter((f): f is string => typeof f === 'string' && f !== 'none');

        // SEALED paints one thing: the shadow that lifts it off the sheet.
        // Its ring is hollow — the only kind on the chart that is.
        const sealedRing = render(<NodeMark kind="locked" />)
            .UNSAFE_getAllByType(Circle)
            .find((c) => c.props.strokeDasharray !== undefined);
        expect(sealedRing!.props.fill).toBe('none');

        // TRODDEN paints a body disc INSIDE the backing — a closed mass.
        expect(fills('completed').length).toBeGreaterThan(fills('locked').length);

        // OPEN paints a core inside a ring.
        expect(fills('available').length).toBeGreaterThanOrEqual(3);
    });

    it('separates them by SHAPE — only trodden carries a figure, only sealed is broken', () => {
        const hasPath = (kind: NodeMarkKind) =>
            render(<NodeMark kind={kind} />).UNSAFE_queryAllByType(Path).length > 0;
        expect(hasPath('completed')).toBe(true);
        expect(hasPath('locked')).toBe(false);
        expect(hasPath('available')).toBe(false);

        const isDashed = (kind: NodeMarkKind) =>
            render(<NodeMark kind={kind} />)
                .UNSAFE_getAllByType(Circle)
                .some((c) => c.props.strokeDasharray !== undefined);
        expect(isDashed('locked')).toBe(true);
        expect(isDashed('available')).toBe(false);
        expect(isDashed('completed')).toBe(false);
    });

    it('gives every kind an accessible name that states the state in words', () => {
        const label = (kind: NodeMarkKind) =>
            render(<NodeMark kind={kind} />).UNSAFE_getByType(Svg).props.accessibilityLabel as string;
        expect(label('available')).toMatch(/available/i);
        expect(label('completed')).toMatch(/trodden/i);
        expect(label('locked')).toMatch(/sealed/i);
        expect(label('current')).toMatch(/current/i);
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
