/**
 * Hermetic component tests — PixelEmblem.
 *
 * Pins the lone pixel-art primitive's render contract (Phase 70
 * Tick B). The emblem is the app's ONE deliberate aesthetic break;
 * see the JSDoc on `components/event/aftermath/PixelEmblem.tsx`
 * for the carve-out rationale. These pins keep a future "tidy this
 * up" refactor from silently normalizing the sprite into a regular
 * icon.
 *
 * What's pinned:
 *   1. Frame mounts (testID present, lives at the right edge of
 *      the panel — caller-controlled).
 *   2. Sprite renders the expected total cell count given the
 *      ported 16×16 PIXEL_HEART grid (transparent cells skipped).
 *      The exact count is computed from the constant itself so the
 *      test doesn't drift if the bundle ships a touch-up — it
 *      simply checks the rendered SVG matches the source string.
 *   3. Cell scaling honours the `cell` prop (default 11 → 176×176).
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { PIXEL_HEART, PixelEmblem } from '@/components/event/aftermath/PixelEmblem';

// Count the non-transparent cells in the ported sprite. The render
// emits exactly one <Rect> per non-'.' character.
const NON_TRANSPARENT_CELLS = PIXEL_HEART.reduce(
    (acc, row) => acc + row.split('').filter((c) => c !== '.').length,
    0,
);

describe('PixelEmblem: sprite render contract', () => {
    it('mounts the emblem frame', () => {
        const tree = render(<PixelEmblem />);
        expect(tree.queryByTestId('pixel-emblem')).not.toBeNull();
    });

    it('renders exactly one <Rect> per non-transparent cell in PIXEL_HEART', () => {
        const tree = render(<PixelEmblem />);
        // findAllByType is the only reliable way to enumerate
        // react-native-svg children (their host names vary by env).
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Rect } = require('react-native-svg');
        const rects = tree.UNSAFE_queryAllByType(Rect);
        expect(rects).toHaveLength(NON_TRANSPARENT_CELLS);
    });

    it('default cell size renders a 176-pixel sprite (16 * 11)', () => {
        const tree = render(<PixelEmblem />);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { default: Svg } = require('react-native-svg');
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.width).toBe(176);
        expect(svg.props.height).toBe(176);
    });

    it('honours the cell prop', () => {
        const tree = render(<PixelEmblem cell={4} />);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { default: Svg } = require('react-native-svg');
        const svg = tree.UNSAFE_getByType(Svg);
        expect(svg.props.width).toBe(64);
        expect(svg.props.height).toBe(64);
    });
});

describe('PIXEL_HEART invariants (carve-out fence)', () => {
    it('is exactly 16 rows tall', () => {
        expect(PIXEL_HEART).toHaveLength(16);
    });

    it('every row is exactly 16 characters wide', () => {
        for (const row of PIXEL_HEART) {
            expect(row).toHaveLength(16);
        }
    });

    it('uses only the documented character set (. r s h p *)', () => {
        const allowed = new Set(['.', 'r', 's', 'h', 'p', '*']);
        for (const row of PIXEL_HEART) {
            for (const ch of row) {
                expect(allowed.has(ch)).toBe(true);
            }
        }
    });
});
