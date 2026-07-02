/**
 * Hermetic component tests — MindMark (combat-HUD mind-mark
 * badge). Two render branches: `stacks <= 0` returns null
 * cleanly (no phantom badge on zero-stack states); `stacks > 0`
 * renders the SVG + 'MARK ×N' text. The N reflects the stack
 * count verbatim.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Circle } from 'react-native-svg';

import { MindMark } from '@/components/MindMark';

describe('MindMark: null-render branch', () => {
    it('renders nothing when stacks is 0 (default)', () => {
        const tree = render(<MindMark />);
        expect(tree.toJSON()).toBeNull();
    });

    it('renders nothing when stacks is explicitly 0', () => {
        const tree = render(<MindMark stacks={0} />);
        expect(tree.toJSON()).toBeNull();
    });

    it('renders nothing when stacks is negative', () => {
        const tree = render(<MindMark stacks={-2} />);
        expect(tree.toJSON()).toBeNull();
    });
});

describe('MindMark: badge render branch', () => {
    it('renders the badge when stacks is 1', () => {
        const tree = render(<MindMark stacks={1} />);
        expect(tree.queryByText('MARK ×1')).not.toBeNull();
        // SVG sun-glyph: 2 circles + 1 path (the 4-tick rays).
        expect(tree.UNSAFE_getAllByType(Circle)).toHaveLength(2);
    });

    it('reflects the stack count in the text', () => {
        const tree = render(<MindMark stacks={5} />);
        expect(tree.queryByText('MARK ×5')).not.toBeNull();
    });

    it('renders correctly for large stack counts', () => {
        const tree = render(<MindMark stacks={42} />);
        expect(tree.queryByText('MARK ×42')).not.toBeNull();
    });
});
