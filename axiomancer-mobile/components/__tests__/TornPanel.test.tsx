/**
 * Hermetic component tests — TornPanel (UI primitive that wraps
 * children in a torn-paper panel via SVG overlay).
 *
 * Two render branches: pre-layout (`size.width === 0`) renders
 * the inner content only — the SVG overlay is gated on a
 * measured layout so the torn edge can't render at zero width
 * (would clip wrong). Post-layout (`size.width > 0`) the SVG
 * overlay mounts above the inner. The test drives the gate by
 * simulating the onLayout callback fireEvent provides.
 */

import { describe, expect, it } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';
import Svg from 'react-native-svg';

import { TornPanel } from '@/components/TornPanel';

function fireLayout(node: ReturnType<typeof render>['root'], width: number, height: number) {
    fireEvent(node, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width, height } },
    });
}

describe('TornPanel: pre-layout render', () => {
    it('renders children before onLayout fires (SVG overlay deferred until measured)', () => {
        const tree = render(
            <TornPanel>
                <Text testID="child-content">hello</Text>
            </TornPanel>,
        );
        expect(tree.queryByTestId('child-content')).not.toBeNull();
        // SVG overlay is gated on `size.width > 0`; initial render has
        // no measured size yet, so no Svg in the tree.
        expect(tree.UNSAFE_queryAllByType(Svg)).toHaveLength(0);
    });

    it('still renders the inner panel View even without children', () => {
        const tree = render(<TornPanel />);
        // The inner panel View always renders so the layout pipeline
        // has something to measure.
        expect(tree.UNSAFE_getAllByType(View).length).toBeGreaterThan(0);
    });
});

describe('TornPanel: post-layout render', () => {
    it('mounts the SVG overlay after onLayout reports a positive width', () => {
        const tree = render(
            <TornPanel>
                <Text>child</Text>
            </TornPanel>,
        );
        // The outer View is the first View in the tree (the one with
        // the onLayout handler). Fire layout to flip the gate.
        const outer = tree.UNSAFE_getAllByType(View)[0];
        fireLayout(outer, 200, 100);
        expect(tree.UNSAFE_queryAllByType(Svg)).toHaveLength(1);
    });

    it('does not mount the SVG when measured width stays at zero', () => {
        const tree = render(<TornPanel><Text>x</Text></TornPanel>);
        const outer = tree.UNSAFE_getAllByType(View)[0];
        fireLayout(outer, 0, 50);
        // Zero width keeps the gate closed — no SVG.
        expect(tree.UNSAFE_queryAllByType(Svg)).toHaveLength(0);
    });
});

describe('TornPanel: prop passthrough', () => {
    it('honors custom padding on the inner panel', () => {
        const tree = render(
            <TornPanel padding={24}><Text>x</Text></TornPanel>,
        );
        // Inner View is the second View (outer wraps it).
        const inner = tree.UNSAFE_getAllByType(View)[1];
        // Style can be an object, array, or undefined; flatten for
        // assertion robustness.
        const styleArr = Array.isArray(inner.props.style)
            ? inner.props.style
            : [inner.props.style];
        const padding = styleArr.find((s: { padding?: number } | undefined) => s && typeof s.padding === 'number')?.padding;
        expect(padding).toBe(24);
    });

    it('uses default padding of 12 when not specified', () => {
        const tree = render(<TornPanel><Text>x</Text></TornPanel>);
        const inner = tree.UNSAFE_getAllByType(View)[1];
        const styleArr = Array.isArray(inner.props.style)
            ? inner.props.style
            : [inner.props.style];
        const padding = styleArr.find((s: { padding?: number } | undefined) => s && typeof s.padding === 'number')?.padding;
        expect(padding).toBe(12);
    });

    it('honors custom bgColor on the inner panel', () => {
        const tree = render(
            <TornPanel bgColor="#ff0000"><Text>x</Text></TornPanel>,
        );
        const inner = tree.UNSAFE_getAllByType(View)[1];
        const styleArr = Array.isArray(inner.props.style)
            ? inner.props.style
            : [inner.props.style];
        const bg = styleArr.find((s: { backgroundColor?: string } | undefined) => s && typeof s.backgroundColor === 'string')?.backgroundColor;
        expect(bg).toBe('#ff0000');
    });

    it('passes outer style through (caller can position the panel)', () => {
        const tree = render(
            <TornPanel style={{ marginTop: 50 }}><Text>x</Text></TornPanel>,
        );
        const outer = tree.UNSAFE_getAllByType(View)[0];
        const styleArr = Array.isArray(outer.props.style)
            ? outer.props.style
            : [outer.props.style];
        const marginTop = styleArr.find((s: { marginTop?: number } | undefined) => s && typeof s.marginTop === 'number')?.marginTop;
        expect(marginTop).toBe(50);
    });
});
