/**
 * Hermetic component tests — ActionIcon.
 *
 * 10-way switch dispatching SVG kinds. Pin the contract so a
 * renamed kind in upstream callers (combat actions, event
 * modal subtitles, exploration codex strip) surfaces as a
 * test failure, not as a silent missing icon.
 *
 * Known kinds: sword, shield, arcane, bag, flee, eye, crown,
 * chest, scroll, flame. 'flame' delegates to EffectGlyph
 * (burn). Unknown kind returns null.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { ActionIcon } from '@/components/ActionIcon';

const KNOWN_KINDS: readonly string[] = [
    'sword',
    'shield',
    'arcane',
    'bag',
    'flee',
    'eye',
    'crown',
    'chest',
    'scroll',
    'flame',
];

function countSvgs(json: unknown): number {
    if (json === null || typeof json !== 'object') return 0;
    const node = json as { type?: string; children?: unknown[] };
    let count = node.type === 'RNSVGSvgView' || node.type === 'Svg' ? 1 : 0;
    if (Array.isArray(node.children)) {
        for (const c of node.children) count += countSvgs(c);
    }
    return count;
}

describe('ActionIcon: known kinds render an SVG', () => {
    it.each(KNOWN_KINDS)('kind="%s" produces non-null output', (kind) => {
        const tree = render(<ActionIcon kind={kind} />);
        expect(tree.toJSON()).not.toBeNull();
    });

    it.each(KNOWN_KINDS)('kind="%s" mounts at least one Svg root', (kind) => {
        const tree = render(<ActionIcon kind={kind} />);
        // flame delegates to EffectGlyph(burn), which also wraps in Svg.
        expect(countSvgs(tree.toJSON())).toBeGreaterThanOrEqual(1);
    });
});

describe('ActionIcon: unknown kinds', () => {
    it('returns null for an unrecognized kind', () => {
        const tree = render(<ActionIcon kind="not-a-kind" />);
        expect(tree.toJSON()).toBeNull();
    });

    it('returns null for an empty kind string', () => {
        const tree = render(<ActionIcon kind="" />);
        expect(tree.toJSON()).toBeNull();
    });
});

describe('ActionIcon: size + color props', () => {
    it('size prop is forwarded to the rendered Svg width/height', () => {
        const tree = render(<ActionIcon kind="sword" size={42} />);
        const json = tree.toJSON();
        // Walk the tree finding the first node with a numeric width prop.
        function findWidth(node: unknown): unknown {
            if (node === null || typeof node !== 'object') return null;
            const n = node as { props?: { width?: unknown }; children?: unknown[] };
            if (typeof n.props?.width === 'number') return n.props.width;
            if (typeof n.props?.width === 'string') return n.props.width;
            if (Array.isArray(n.children)) {
                for (const c of n.children) {
                    const found = findWidth(c);
                    if (found !== null) return found;
                }
            }
            return null;
        }
        const w = findWidth(json);
        // react-native-svg sometimes stringifies numeric props on RN web,
        // but in jest-expo the Svg width is the literal number.
        expect(w === 42 || w === '42').toBe(true);
    });

    it('default size renders without crashing when no size prop is given', () => {
        const tree = render(<ActionIcon kind="shield" />);
        expect(tree.toJSON()).not.toBeNull();
    });
});
