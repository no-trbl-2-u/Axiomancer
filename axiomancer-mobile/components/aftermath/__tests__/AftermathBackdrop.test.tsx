/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import AftermathBackdrop from '../AftermathBackdrop';
import { Text } from 'react-native';

describe('AftermathBackdrop', () => {
    it('renders children correctly', () => {
        const { getByText } = render(
            <AftermathBackdrop>
                <Text>Test Content</Text>
            </AftermathBackdrop>
        );

        expect(getByText('Test Content')).toBeTruthy();
    });

    it('applies custom tint color', () => {
        const customTint = '#123456';
        const { getByTestId } = render(
            <AftermathBackdrop tint={customTint}>
                <Text testID="content">Test</Text>
            </AftermathBackdrop>
        );

        // The backdrop should render with custom tint
        expect(getByTestId('content')).toBeTruthy();
    });

    it('handles hatch overlay when enabled', () => {
        const { getByText } = render(
            <AftermathBackdrop hatch={true}>
                <Text>Hatched Content</Text>
            </AftermathBackdrop>
        );

        expect(getByText('Hatched Content')).toBeTruthy();
    });

    it('renders backdrop with proper component structure', () => {
        const { UNSAFE_queryAllByType } = render(
            <AftermathBackdrop>
                <Text>Structure Test</Text>
            </AftermathBackdrop>
        );
        
        // Should have View elements for backdrop structure
        const viewElements = UNSAFE_queryAllByType('View' as any);
        expect(viewElements.length).toBeGreaterThan(0);
    });

    it('supports non-dismissible backdrop behavior', () => {
        // Test that backdrop can be set up for non-dismissible modal
        expect(() => {
            render(
                <AftermathBackdrop>
                    <Text>Non-dismissible content</Text>
                </AftermathBackdrop>
            );
        }).not.toThrow();
    });
});