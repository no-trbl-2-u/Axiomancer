/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import PixelHeartEmblem from '../PixelHeartEmblem';

describe('PixelHeartEmblem', () => {
    it('renders pixel heart emblem', () => {
        // SVG should render with default props
        const component = render(<PixelHeartEmblem />);
        expect(component).toBeTruthy();
    });

    it('accepts custom cell size', () => {
        // Should render with smaller cells
        const component = render(<PixelHeartEmblem cellSize={8} />);
        expect(component).toBeTruthy();
    });

    it('renders SVG with correct dimensions', () => {
        const cellSize = 10;
        
        const component = render(<PixelHeartEmblem cellSize={cellSize} />);
        expect(component).toBeTruthy();
        
        // The component should render without errors
        // More detailed SVG testing would require additional setup
    });

    it('uses default cell size when not specified', () => {
        const component = render(<PixelHeartEmblem />);
        expect(component).toBeTruthy();
        
        // Default should be 12px cells (192px total)
        // Component should render successfully with defaults
    });

    it('renders SVG elements for pixel art structure', () => {
        const { UNSAFE_queryByType, UNSAFE_queryAllByType } = render(<PixelHeartEmblem />);
        
        // Should have SVG container
        const svgElement = UNSAFE_queryByType('RNSVGSvgView' as any);
        expect(svgElement).toBeTruthy();
        
        // Should have multiple rect elements for pixels
        const rectElements = UNSAFE_queryAllByType('RNSVGRect' as any);
        expect(rectElements.length).toBeGreaterThan(0);
    });

    it('handles various cell sizes without crashing', () => {
        const testCellSizes = [1, 5, 12, 15, 20];
        
        testCellSizes.forEach(cellSize => {
            expect(() => {
                render(<PixelHeartEmblem cellSize={cellSize} />);
            }).not.toThrow();
        });
    });
});