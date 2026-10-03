/**
 * MapOverlays component — hermetic test suite.
 * Tests the gesture line + bottom-legend chrome layered over the
 * exploration map. The component is prop-driven on `legend` (left/right
 * strings).
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { MapOverlays } from '../MapOverlays';
import { MAP_LEGEND_LEFT } from '@/state/presenters/exploration.engine';

describe('MapOverlays', () => {
    const legend = { left: 'visited', right: 'sealed' };

    it('renders without crashing', () => {
        const { root } = render(<MapOverlays legend={legend} />);
        expect(root).toBeTruthy();
    });

    it('renders the fixed gesture line, naming the pan/pinch gesture', () => {
        render(<MapOverlays legend={legend} />);
        // The chart pans and zooms behind a much smaller
        // window, so the always-on furniture has to say so.
        expect(screen.getByText('drag · pinch')).toBeTruthy();
    });

    it('carries no compass and no NODE GRAPH label (T, 2026-10-02)', () => {
        render(<MapOverlays legend={legend} />);
        expect(screen.queryByText('NODE GRAPH')).toBeNull();
        expect(screen.queryByText(/N ↑|leagues/)).toBeNull();
    });

    it('renders both legend strings from props', () => {
        render(<MapOverlays legend={legend} />);
        expect(screen.getByText('visited')).toBeTruthy();
        expect(screen.getByText('sealed')).toBeTruthy();
    });

    it('reflects updated legend props on re-render', () => {
        const { rerender } = render(<MapOverlays legend={legend} />);
        expect(screen.getByText('visited')).toBeTruthy();

        rerender(<MapOverlays legend={{ left: 'explored', right: 'locked' }} />);
        expect(screen.getByText('explored')).toBeTruthy();
        expect(screen.getByText('locked')).toBeTruthy();
        expect(screen.queryByText('visited')).toBeNull();
    });

    /**
     * THE LEGEND MUST NOT CLIP.
     *
     * The strip can be cut off for two independent reasons, and guarding
     * either alone leaves the other live, so both are pinned:
     *
     *   1. running under `<MapCanvas>`'s recentre button (32x32, pinned at
     *      `right: 10, bottom: 10` — a 42px corner reaching up from the
     *      chart's foot) while the legend sits at `bottom: 8`;
     *   2. a row whose `Text`s cannot give way, inside `graphWrap`'s
     *      `overflow: 'hidden'`, so strings that exceed the strip are
     *      clipped rather than wrapped.
     *
     * These assertions are geometric on purpose: the collision is geometric,
     * and shortening the copy would hide it rather than fix it.
     */
    describe('owner finding 9: the legend cannot be clipped', () => {
        // MapCanvas: 32px recentre button pinned 10px off the chart's right edge.
        const BUTTON_FOOTPRINT = 42;

        const legendBox = () => {
            render(<MapOverlays legend={legend} />);
            return StyleSheet.flatten(screen.getByTestId('map-legend').props.style);
        };

        it('leaves the recentre button its corner instead of drawing across it', () => {
            expect(legendBox().right).toBeGreaterThan(BUTTON_FOOTPRINT);
        });

        it('stacks the keys and the counter, so neither has to share a line', () => {
            // As a row they competed for one strip's width; as a column each
            // line owns the full remaining width.
            expect(legendBox().flexDirection).toBe('column');
        });

        it('BOUNDS each line to the strip, so long copy wraps instead of running off', () => {
            // This is the assertion that actually closes the clipping. In a
            // column, `alignItems: 'stretch'` is what hands each Text the
            // container's width as its wrap bound; content-sized lines
            // (`flex-start`) would overflow exactly as the row did, and
            // `flexShrink` governs HEIGHT on this axis, not width.
            expect(legendBox().alignItems).toBe('stretch');
            for (const id of ['map-legend-keys', 'map-legend-count']) {
                const flat = StyleSheet.flatten(screen.getByTestId(id).props.style);
                // Belt and braces: Yoga defaults flexShrink to 0.
                expect(flat.flexShrink).toBe(1);
                // And nothing may clamp a wrapped line back to one row.
                expect(screen.getByTestId(id).props.numberOfLines).toBeUndefined();
            }
        });

        it('holds the real legend copy, not just the short test fixture', () => {
            render(<MapOverlays legend={{ left: MAP_LEGEND_LEFT, right: '28 nodes · 23 sealed' }} />);
            expect(screen.getByText(MAP_LEGEND_LEFT)).toBeTruthy();
            expect(screen.getByText('28 nodes · 23 sealed')).toBeTruthy();
        });
    });

    it('renders empty legend strings without crashing', () => {
        const { root } = render(<MapOverlays legend={{ left: '', right: '' }} />);
        expect(root).toBeTruthy();
        expect(screen.getByText('drag · pinch')).toBeTruthy();
    });
});
