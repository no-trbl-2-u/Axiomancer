/**
 * EventBadge component — hermetic test suite.
 * Tests the event notification badge that appears on exploration nodes
 * to indicate new events are available.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { EventBadge } from '../EventBadge';

describe('EventBadge', () => {
    const mockEventCallout = {
        iconKey: 'combat',
        title: 'Bandits Ahead',
    };

    it('renders without crashing', () => {
        const { root } = render(<EventBadge eventCallout={mockEventCallout} />);
        expect(root).toBeTruthy();
    });

    it('displays the event title', () => {
        render(<EventBadge eventCallout={mockEventCallout} />);
        expect(screen.getByText('Bandits Ahead')).toBeTruthy();
    });

    it('displays "NEW EVENT" label', () => {
        render(<EventBadge eventCallout={mockEventCallout} />);
        expect(screen.getByText('NEW EVENT')).toBeTruthy();
    });

    it('renders with different event titles', () => {
        const differentEvent = {
            iconKey: 'dialogue',
            title: 'Mysterious Stranger',
        };
        
        render(<EventBadge eventCallout={differentEvent} />);
        expect(screen.getByText('Mysterious Stranger')).toBeTruthy();
        expect(screen.getByText('NEW EVENT')).toBeTruthy();
    });

    it('renders with different icon keys', () => {
        const eventWithDifferentIcon = {
            iconKey: 'treasure',
            title: 'Hidden Cache',
        };
        
        const { root } = render(<EventBadge eventCallout={eventWithDifferentIcon} />);
        expect(root).toBeTruthy();
        expect(screen.getByText('Hidden Cache')).toBeTruthy();
    });

    it('handles long event titles', () => {
        const longTitleEvent = {
            iconKey: 'hazard',
            title: 'An extremely long event title that might wrap across multiple lines',
        };
        
        render(<EventBadge eventCallout={longTitleEvent} />);
        expect(screen.getByText('An extremely long event title that might wrap across multiple lines')).toBeTruthy();
    });

    it('handles empty title gracefully', () => {
        const emptyTitleEvent = {
            iconKey: 'unknown',
            title: '',
        };
        
        const { root } = render(<EventBadge eventCallout={emptyTitleEvent} />);
        expect(root).toBeTruthy();
        expect(screen.getByText('NEW EVENT')).toBeTruthy();
    });
});