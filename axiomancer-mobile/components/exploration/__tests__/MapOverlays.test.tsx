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

    it('renders empty legend strings without crashing', () => {
        const { root } = render(<MapOverlays legend={{ left: '', right: '' }} />);
        expect(root).toBeTruthy();
        expect(screen.getByText('NODE GRAPH')).toBeTruthy();
    });
});
