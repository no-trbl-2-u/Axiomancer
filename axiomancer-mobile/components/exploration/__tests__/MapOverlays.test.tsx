/**
 * MapOverlays component — hermetic test suite.
 * Tests the compass + NODE GRAPH label + bottom-legend chrome layered
 * over the exploration map. The component is prop-driven on `legend`
 * (left/right strings) and renders fixed compass + node-graph chrome
 * alongside it.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { MapOverlays } from '../MapOverlays';

describe('MapOverlays', () => {
    const legend = { left: 'visited', right: 'sealed' };

    it('renders without crashing', () => {
        const { root } = render(<MapOverlays legend={legend} />);
        expect(root).toBeTruthy();
    });

    it('renders the fixed compass chrome', () => {
        render(<MapOverlays legend={legend} />);
        expect(screen.getByText('N ↑ · scale: leagues')).toBeTruthy();
    });

    it('renders the NODE GRAPH label', () => {
        render(<MapOverlays legend={legend} />);
        expect(screen.getByText('NODE GRAPH')).toBeTruthy();
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
     * FE-005 — the travel hint used to be an absolutely-positioned view on the
     * SCREEN at `bottom: 80`, which landed on top of this legend at 375x812.
     * It is now a sibling of the legend inside the map's fixed furniture, so
     * these guards pin that it renders here and that it is optional.
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
            expect(screen.getByText('NODE GRAPH')).toBeTruthy();
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

    it('renders empty legend strings without crashing', () => {
        const { root } = render(<MapOverlays legend={{ left: '', right: '' }} />);
        expect(root).toBeTruthy();
        expect(screen.getByText('NODE GRAPH')).toBeTruthy();
    });
});
