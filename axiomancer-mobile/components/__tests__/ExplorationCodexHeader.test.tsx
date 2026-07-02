/**
 * Hermetic component tests — ExplorationCodexHeader (Phase 50
 * Tick D two-token mono strip atop the exploration screen when
 * `useAesthetic() === 'codex'`).
 *
 * Two props (left / right), single render branch. Pin: passthrough
 * of both tokens, accessibilityRole='header' on the wrapper, and
 * the codex-distinct palette split — parchment for the left
 * (region), bone for the right (node id). Mirrors the test shape
 * of `CodexStatusStrip` but with a paired-token contract.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { ExplorationCodexHeader } from '@/components/ExplorationCodexHeader';
import { AXM, FONTS } from '@/theme/axm';

function flattenStyle(node: { props: { style?: unknown } }): Record<string, unknown> {
    const raw = node.props.style;
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr.reduce<Record<string, unknown>>((acc, entry) => {
        if (entry && typeof entry === 'object') Object.assign(acc, entry);
        return acc;
    }, {});
}

describe('ExplorationCodexHeader: token passthrough', () => {
    it('renders both left and right tokens verbatim', () => {
        const tree = render(<ExplorationCodexHeader left="REGION=fishing-village" right="NODE=fv-3" />);
        expect(tree.queryByText('REGION=fishing-village')).not.toBeNull();
        expect(tree.queryByText('NODE=fv-3')).not.toBeNull();
    });

    it('updates rendered text when either prop changes', () => {
        const tree = render(<ExplorationCodexHeader left="A" right="X" />);
        expect(tree.queryByText('A')).not.toBeNull();
        expect(tree.queryByText('X')).not.toBeNull();
        tree.rerender(<ExplorationCodexHeader left="B" right="Y" />);
        expect(tree.queryByText('A')).toBeNull();
        expect(tree.queryByText('B')).not.toBeNull();
        expect(tree.queryByText('Y')).not.toBeNull();
    });

    it('renders both empty strings without throwing or collapsing the wrapper', () => {
        const tree = render(<ExplorationCodexHeader left="" right="" />);
        expect(tree.UNSAFE_getAllByType(Text)).toHaveLength(2);
    });
});

describe('ExplorationCodexHeader: accessibility', () => {
    it('marks the wrapper as a header for screen readers', () => {
        const tree = render(<ExplorationCodexHeader left="x" right="y" />);
        const view = tree.UNSAFE_getAllByType(View)[0];
        expect(view.props.accessibilityRole).toBe('header');
    });
});

describe('ExplorationCodexHeader: codex palette split', () => {
    it('left token is parchment (the primary "where you are" frame)', () => {
        const tree = render(<ExplorationCodexHeader left="x" right="y" />);
        const leftText = tree.UNSAFE_getAllByType(Text)[0];
        const style = flattenStyle(leftText);
        expect(style.color).toBe(AXM.parchment);
        expect(style.fontFamily).toBe(FONTS.mono);
        expect(style.fontSize).toBe(10);
        expect(style.letterSpacing).toBe(1);
    });

    it('right token is bone (the secondary node-id slot)', () => {
        const tree = render(<ExplorationCodexHeader left="x" right="y" />);
        const rightText = tree.UNSAFE_getAllByType(Text)[1];
        const style = flattenStyle(rightText);
        expect(style.color).toBe(AXM.bone);
        expect(style.fontFamily).toBe(FONTS.mono);
        expect(style.fontSize).toBe(10);
        expect(style.letterSpacing).toBe(1);
    });
});
