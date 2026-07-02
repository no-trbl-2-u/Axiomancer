/**
 * NodeToast component — hermetic test suite.
 * Tests the locked/consumed-node feedback toast layered over the
 * exploration map. The component is prop-driven on `tip` and renders
 * the tip text inside an `exploration-node-toast` container with a
 * mount-time fade-in entrance.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { NodeToast } from '../NodeToast';

describe('NodeToast', () => {
    it('renders without crashing', () => {
        const { root } = render(<NodeToast tip="That path is sealed." />);
        expect(root).toBeTruthy();
    });

    it('renders the tip text from props', () => {
        render(<NodeToast tip="That path is sealed." />);
        expect(screen.getByText('That path is sealed.')).toBeTruthy();
    });

    it('exposes the exploration-node-toast testID', () => {
        render(<NodeToast tip="Already visited." />);
        expect(screen.getByTestId('exploration-node-toast')).toBeTruthy();
    });

    it('reflects updated tip props on re-render', () => {
        const { rerender } = render(<NodeToast tip="Already visited." />);
        expect(screen.getByText('Already visited.')).toBeTruthy();

        rerender(<NodeToast tip="That path is sealed." />);
        expect(screen.getByText('That path is sealed.')).toBeTruthy();
        expect(screen.queryByText('Already visited.')).toBeNull();
    });

    it('renders an empty tip without crashing', () => {
        const { root } = render(<NodeToast tip="" />);
        expect(root).toBeTruthy();
        expect(screen.getByTestId('exploration-node-toast')).toBeTruthy();
    });
});
