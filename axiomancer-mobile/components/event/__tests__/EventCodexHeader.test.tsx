/**
 * Hermetic component tests — EventCodexHeader (Phase 50 Tick C
 * two-token mono strip atop event modals when codex aesthetic
 * is active).
 *
 * Structurally identical to ExplorationCodexHeader but with a
 * blood-left palette (matches the design's ENC token accent)
 * instead of parchment. Tests pin: passthrough of both tokens,
 * accessibilityRole='header' on the wrapper, and the codex
 * palette split distinct from exploration's.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { EventCodexHeader } from '@/components/event/EventCodexHeader';
import { AXM, FONTS } from '@/theme/axm';

function flattenStyle(node: { props: { style?: unknown } }): Record<string, unknown> {
    const raw = node.props.style;
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr.reduce<Record<string, unknown>>((acc, entry) => {
        if (entry && typeof entry === 'object') Object.assign(acc, entry);
        return acc;
    }, {});
}

describe('EventCodexHeader: token passthrough', () => {
    it('renders both left and right tokens verbatim', () => {
        const tree = render(<EventCodexHeader left="ENC=cairn-rot" right="HP=10/10" />);
        expect(tree.queryByText('ENC=cairn-rot')).not.toBeNull();
        expect(tree.queryByText('HP=10/10')).not.toBeNull();
    });

    it('updates rendered text when either prop changes', () => {
        const tree = render(<EventCodexHeader left="A" right="X" />);
        expect(tree.queryByText('A')).not.toBeNull();
        tree.rerender(<EventCodexHeader left="B" right="Y" />);
        expect(tree.queryByText('A')).toBeNull();
        expect(tree.queryByText('B')).not.toBeNull();
        expect(tree.queryByText('Y')).not.toBeNull();
    });

    it('renders both empty strings without throwing or collapsing the wrapper', () => {
        const tree = render(<EventCodexHeader left="" right="" />);
        expect(tree.UNSAFE_getAllByType(Text)).toHaveLength(2);
    });
});

describe('EventCodexHeader: accessibility', () => {
    it('marks the wrapper as a header for screen readers', () => {
        const tree = render(<EventCodexHeader left="x" right="y" />);
        const view = tree.UNSAFE_getAllByType(View)[0];
        expect(view.props.accessibilityRole).toBe('header');
    });
});

describe('EventCodexHeader: codex palette split (distinct from ExplorationCodexHeader)', () => {
    it('left token is blood (matches the design source ENC accent — "what you face")', () => {
        const tree = render(<EventCodexHeader left="x" right="y" />);
        const leftText = tree.UNSAFE_getAllByType(Text)[0];
        const style = flattenStyle(leftText);
        expect(style.color).toBe(AXM.blood);
        expect(style.fontFamily).toBe(FONTS.mono);
        expect(style.fontSize).toBe(10);
        expect(style.letterSpacing).toBe(1);
    });

    it('right token is bone (the secondary HP/stat slot)', () => {
        const tree = render(<EventCodexHeader left="x" right="y" />);
        const rightText = tree.UNSAFE_getAllByType(Text)[1];
        const style = flattenStyle(rightText);
        expect(style.color).toBe(AXM.bone);
        expect(style.fontFamily).toBe(FONTS.mono);
        expect(style.fontSize).toBe(10);
        expect(style.letterSpacing).toBe(1);
    });

    it('wrapper background is the deeper bg used inside event modals (deepBg)', () => {
        const tree = render(<EventCodexHeader left="x" right="y" />);
        const wrapper = tree.UNSAFE_getAllByType(View)[0];
        expect(flattenStyle(wrapper).backgroundColor).toBe(AXM.deepBg);
    });
});
