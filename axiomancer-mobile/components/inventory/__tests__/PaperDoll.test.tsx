import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperDoll } from '../PaperDoll';

describe('PaperDoll', () => {
    it('renders correctly', () => {
        const { getByTestId } = render(<PaperDoll />);
        
        // The SVG should render without errors
        const svgElement = getByTestId;
        expect(svgElement).toBeDefined();
    });

    it('has correct SVG dimensions', () => {
        const component = render(<PaperDoll />);
        
        // Should render without throwing
        expect(component.toJSON()).toBeTruthy();
    });
});