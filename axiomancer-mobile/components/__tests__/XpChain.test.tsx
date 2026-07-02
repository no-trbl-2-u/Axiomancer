/**
 * Hermetic component tests — XpChain.
 *
 * XpChain renders a row of link ellipses (default 16) where each
 * link is filled iff its index < Math.round((value/max) * links).
 * The non-obvious contract is the **rounding boundary** — does
 * 0.5 of a link round up or down? `Math.round` rounds half *away
 * from zero*, so 0.5 → 1 link filled. Pin that, plus the edge
 * cases (0/max, max/max, value > max).
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { XpChain } from '@/components/XpChain';
import { AXM } from '@/theme/axm';

/**
 * Walk the rendered tree and count outline ellipses whose stroke
 * is `AXM.sulfur`. react-native-svg encodes colors as packed
 * ARGB uint32 payloads on the resolved tree, so `#d4c026` (sulfur)
 * surfaces as `0xFFD4C026` (4292132902 unsigned, or -2834394 if
 * the runtime stores it as Int32). Accept both encodings.
 */
const SULFUR_HEX = AXM.sulfur.replace('#', '').toLowerCase();
const SULFUR_PAYLOAD_UNSIGNED = parseInt(`ff${SULFUR_HEX}`, 16);
const SULFUR_PAYLOAD_SIGNED = SULFUR_PAYLOAD_UNSIGNED | 0;

function isSulfurStroke(stroke: unknown): boolean {
    if (typeof stroke === 'string') return stroke === AXM.sulfur;
    if (stroke && typeof stroke === 'object') {
        const p = (stroke as { payload?: unknown }).payload;
        if (typeof p === 'number') {
            return p === SULFUR_PAYLOAD_UNSIGNED || p === SULFUR_PAYLOAD_SIGNED;
        }
    }
    return false;
}

function countFilledLinks(json: unknown): number {
    if (json === null || typeof json !== 'object') return 0;
    const node = json as {
        type?: string;
        props?: { stroke?: unknown; rx?: number; ry?: number };
        children?: unknown[];
    };
    let count = 0;
    if (
        (node.type === 'RNSVGEllipse' || node.type === 'Ellipse') &&
        node.props?.rx === 4 &&
        node.props?.ry === 6 &&
        isSulfurStroke(node.props?.stroke)
    ) {
        // The outline ellipse (rx=4 / ry=6) carries the link's
        // canonical stroke. The inner fill (rx=2 / ry=3) is a
        // separate ellipse — don't double-count.
        count += 1;
    }
    if (Array.isArray(node.children)) {
        for (const c of node.children) {
            count += countFilledLinks(c);
        }
    }
    return count;
}

function countLinkEllipses(json: unknown): number {
    // Each link renders TWO Ellipses (outline + inner fill). The
    // outline is always present; count it as the canonical "this
    // is a link" anchor.
    if (json === null || typeof json !== 'object') return 0;
    const node = json as {
        type?: string;
        props?: { rx?: number; ry?: number };
        children?: unknown[];
    };
    let count = 0;
    if (
        (node.type === 'RNSVGEllipse' || node.type === 'Ellipse') &&
        node.props?.rx === 4 &&
        node.props?.ry === 6
    ) {
        // The outline ellipse uses rx=4 / ry=6; the inner fill is rx=2 / ry=3.
        count += 1;
    }
    if (Array.isArray(node.children)) {
        for (const c of node.children) {
            count += countLinkEllipses(c);
        }
    }
    return count;
}

describe('XpChain: link count', () => {
    it('renders 16 links by default', () => {
        const tree = render(<XpChain value={0} max={100} />);
        expect(countLinkEllipses(tree.toJSON())).toBe(16);
    });

    it('renders the requested number of links when `links` is set', () => {
        const tree = render(<XpChain value={0} max={100} links={8} />);
        expect(countLinkEllipses(tree.toJSON())).toBe(8);
    });
});

describe('XpChain: fill rounding', () => {
    it('empty (0/100) renders no filled links', () => {
        const tree = render(<XpChain value={0} max={100} />);
        expect(countFilledLinks(tree.toJSON())).toBe(0);
    });

    it('full (100/100) renders all 16 links filled', () => {
        const tree = render(<XpChain value={100} max={100} />);
        expect(countFilledLinks(tree.toJSON())).toBe(16);
    });

    it('half (50/100) renders 8 filled links', () => {
        const tree = render(<XpChain value={50} max={100} />);
        expect(countFilledLinks(tree.toJSON())).toBe(8);
    });

    it('just-under-half (3/16 ≈ 0.1875 → 3 links) rounds correctly', () => {
        // 0.1875 * 16 = 3 exactly. No rounding to test here; the case
        // exists to pin the no-rounding-needed boundary.
        const tree = render(<XpChain value={3} max={16} />);
        expect(countFilledLinks(tree.toJSON())).toBe(3);
    });

    it('rounding half-up: 1/32 * 16 = 0.5 → 1 link (Math.round rounds half away from zero)', () => {
        const tree = render(<XpChain value={1} max={32} />);
        expect(countFilledLinks(tree.toJSON())).toBe(1);
    });

    it('rounding down: 0.4 of a link rounds to 0', () => {
        // 4 / 16 = 0.25 of a link's worth of progress per 1 unit when
        // links=16. value=2 / max=80 gives (2/80)*16 = 0.4 → 0 filled.
        const tree = render(<XpChain value={2} max={80} />);
        expect(countFilledLinks(tree.toJSON())).toBe(0);
    });
});

describe('XpChain: edge cases', () => {
    it('overflow (200/100) renders all 16 links filled (no clamp at the math layer)', () => {
        // The component does not clamp; rounded fill count is
        // Math.round(2 * 16) = 32. The for-loop only iterates 16
        // times, so every link satisfies i < 32 → all 16 sulfur.
        // Pin this so a future overflow clamp is a conscious change.
        const tree = render(<XpChain value={200} max={100} />);
        expect(countFilledLinks(tree.toJSON())).toBe(16);
    });

    it('negative value rounds to 0 or below — no links filled', () => {
        const tree = render(<XpChain value={-50} max={100} />);
        expect(countFilledLinks(tree.toJSON())).toBe(0);
    });

    it('renders without crashing when links=1', () => {
        const tree = render(<XpChain value={1} max={1} links={1} />);
        expect(countLinkEllipses(tree.toJSON())).toBe(1);
        expect(countFilledLinks(tree.toJSON())).toBe(1);
    });
});
