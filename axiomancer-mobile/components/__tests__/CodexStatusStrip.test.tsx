/**
 * Hermetic component tests — CodexStatusStrip (Phase 50 Tick B
 * mono status line, shown at the top of the combat surface when
 * `useAesthetic() === 'codex'`).
 *
 * Single prop, single render branch. Tests pin: line passthrough,
 * accessibility role (header), and the mono typographic invariants
 * (mono font, fixed letterSpacing/size/color) so the codex
 * aesthetic stays distinct from the canonical render.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { CodexStatusStrip } from '@/components/CodexStatusStrip';
import { AXM, FONTS } from '@/theme/axm';

function flattenStyle(node: { props: { style?: unknown } }): Record<string, unknown> {
    const raw = node.props.style;
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr.reduce<Record<string, unknown>>((acc, entry) => {
        if (entry && typeof entry === 'object') Object.assign(acc, entry);
        return acc;
    }, {});
}

describe('CodexStatusStrip: line passthrough', () => {
    it('renders the line prop verbatim', () => {
        const tree = render(<CodexStatusStrip line="ENC=03 · TURN=01 · PHASE=stance" />);
        expect(tree.queryByText('ENC=03 · TURN=01 · PHASE=stance')).not.toBeNull();
    });

    it('updates rendered text when line prop changes', () => {
        const tree = render(<CodexStatusStrip line="A" />);
        expect(tree.queryByText('A')).not.toBeNull();
        tree.rerender(<CodexStatusStrip line="B" />);
        expect(tree.queryByText('A')).toBeNull();
        expect(tree.queryByText('B')).not.toBeNull();
    });

    it('renders an empty string without throwing or omitting the wrapper', () => {
        const tree = render(<CodexStatusStrip line="" />);
        expect(tree.UNSAFE_getAllByType(Text)).toHaveLength(1);
    });
});

describe('CodexStatusStrip: accessibility', () => {
    it('marks the strip as a header for screen readers', () => {
        const tree = render(<CodexStatusStrip line="x" />);
        const text = tree.UNSAFE_getAllByType(Text)[0];
        expect(text.props.accessibilityRole).toBe('header');
    });
});

describe('CodexStatusStrip: codex typographic invariants', () => {
    it('renders in the mono font (distinct from the canonical aesthetic)', () => {
        const tree = render(<CodexStatusStrip line="x" />);
        const text = tree.UNSAFE_getAllByType(Text)[0];
        expect(flattenStyle(text).fontFamily).toBe(FONTS.mono);
    });

    it('renders at the fixed codex size + letterSpacing + bone color', () => {
        const tree = render(<CodexStatusStrip line="x" />);
        const text = tree.UNSAFE_getAllByType(Text)[0];
        const style = flattenStyle(text);
        expect(style.fontSize).toBe(10);
        expect(style.letterSpacing).toBe(1);
        expect(style.color).toBe(AXM.bone);
    });
});
