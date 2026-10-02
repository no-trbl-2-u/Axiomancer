/**
 * MapOverlays component — hermetic test suite.
 * Tests the gesture line + bottom-legend chrome layered over the
 * exploration map. The component is prop-driven on `legend` (left/right
 * strings) and `hint`.
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
        // window, so the always-on furniture has to say so — the first-visit
        // hint chip fades and cannot be the only place it is told.
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
     * The travel hint is a sibling of the legend inside the map's fixed
     * furniture, so it cannot land on top of the legend; these guards pin
     * that it renders here and that it is optional.
     */
    describe('FE-005: travel hint', () => {
        it('renders the hint above the legend when one is passed', () => {
            render(<MapOverlays legend={legend} hint="Tap a glowing node to travel there" />);
            expect(screen.getByTestId('map-hint')).toBeTruthy();
            expect(screen.getByText('Tap a glowing node to travel there')).toBeTruthy();
        });

        it('draws nothing when the hint is null or empty', () => {
            const { rerender } = render(<MapOverlays legend={legend} hint={null} />);
            expect(screen.queryByTestId('map-hint')).toBeNull();
            rerender(<MapOverlays legend={legend} hint="" />);
            expect(screen.queryByTestId('map-hint')).toBeNull();
        });

        it('omitting the prop keeps the pre-FE-005 chrome intact', () => {
            render(<MapOverlays legend={legend} />);
            expect(screen.queryByTestId('map-hint')).toBeNull();
            expect(screen.getByText('drag · pinch')).toBeTruthy();
        });

        it('sits clear of the legend: its bottom offset is greater', () => {
            // The collision was purely geometric, so pin the geometry.
            render(<MapOverlays legend={legend} hint="x" />);
            const hint = screen.getByTestId('map-hint');
            const flat = Array.isArray(hint.props.style)
                ? Object.assign({}, ...hint.props.style.flat(Infinity).filter(Boolean))
                : hint.props.style;
            expect(flat.position).toBe('absolute');
            expect(flat.bottom).toBeGreaterThan(8);
        });
    });

    /**
     * A box running chart edge to chart edge lets a long hint swallow
     * `<MapCanvas>`'s recentre button (32x32, pinned at
     * `right: 10, bottom: 10`, i.e. a 42px footprint in the very band the
     * pill sits in). The box must stop short of that corner — and mirror the
     * inset, or the pill drifts off the chart's centre line.
     */
    describe('04-exploration-midgame: the hint leaves the recentre button its corner', () => {
        // MapCanvas: 32px recentre button pinned 10px off the chart's right edge.
        const BUTTON_FOOTPRINT = 42;
        const LONG_HINT = 'Tap a glowing node to travel — drag or pinch the chart';

        /** Flattened style of the rendered hint box, for the given copy. */
        const hintBoxStyle = (hint: string) => {
            render(<MapOverlays legend={legend} hint={hint} />);
            const box = screen.getByTestId('map-hint');
            return Array.isArray(box.props.style)
                ? Object.assign({}, ...box.props.style.flat(Infinity).filter(Boolean))
                : box.props.style;
        };

        it('stops short of the button, so the longest copy wraps instead of covering it', () => {
            const flat = hintBoxStyle(LONG_HINT);
            expect(flat.right).toBeGreaterThan(BUTTON_FOOTPRINT);
        });

        it('mirrors that inset on the left, keeping the pill centred on the chart', () => {
            const flat = hintBoxStyle(LONG_HINT);
            expect(flat.left).toBe(flat.right);
            expect(flat.alignItems).toBe('center');
        });

        it('still reads the whole nudge, gesture and all', () => {
            render(<MapOverlays legend={legend} hint={LONG_HINT} />);
            expect(screen.getByText(LONG_HINT)).toBeTruthy();
        });
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

        it('keeps the travel hint clear of the now two-line strip', () => {
            // The hint and the legend collide if their offsets are chosen
            // independently. The legend is
            // anchored at bottom: 8 and grows upward over two ~11px lines.
            render(<MapOverlays legend={legend} hint="x" />);
            const hint = StyleSheet.flatten(screen.getByTestId('map-hint').props.style);
            const strip = StyleSheet.flatten(screen.getByTestId('map-legend').props.style);
            expect(hint.bottom).toBeGreaterThan(strip.bottom + 22);
        });
    });

    it('renders empty legend strings without crashing', () => {
        const { root } = render(<MapOverlays legend={{ left: '', right: '' }} />);
        expect(root).toBeTruthy();
        expect(screen.getByText('drag · pinch')).toBeTruthy();
    });
});
