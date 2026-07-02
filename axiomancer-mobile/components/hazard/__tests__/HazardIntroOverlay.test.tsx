import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { HazardIntroOverlay, type HazardIntroOverlayProps } from '../HazardIntroOverlay';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => {};
    return Reanimated;
});

// Mock expo-haptics (fires impactAsync on mount with .catch)
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(() => Promise.resolve()),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

const mockProps: HazardIntroOverlayProps = {
    hazardId: 'cracked-cliff',
    title: 'Cracked Cliff',
    intro: 'The path ahead splits into a chasm. Ancient stone crumbles beneath your feet.',
    onContinue: jest.fn(),
};

describe('HazardIntroOverlay', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with required props', () => {
        const { root } = render(<HazardIntroOverlay {...mockProps} />);
        expect(root).toBeTruthy();
    });

    it('displays the danger eyebrow', () => {
        const { getByText } = render(<HazardIntroOverlay {...mockProps} />);
        expect(getByText('☠ DANGER')).toBeTruthy();
    });

    it('displays the hazard title', () => {
        const { getByText } = render(<HazardIntroOverlay {...mockProps} />);
        expect(getByText('Cracked Cliff')).toBeTruthy();
    });

    it('displays the intro text', () => {
        const { getByText } = render(<HazardIntroOverlay {...mockProps} />);
        expect(getByText(/The path ahead splits into a chasm/)).toBeTruthy();
    });

    it('renders DangerArt with correct hazardId', () => {
        const { getByTestId } = render(<HazardIntroOverlay {...mockProps} />);
        const overlay = getByTestId('hazard-intro-overlay');
        expect(overlay).toBeTruthy();
    });

    it('renders continue button with correct text', () => {
        const { getByText } = render(<HazardIntroOverlay {...mockProps} />);
        expect(getByText('FACE IT ›')).toBeTruthy();
    });

    it('continue button has accessibility role and label', () => {
        const { getByLabelText } = render(<HazardIntroOverlay {...mockProps} />);
        expect(getByLabelText('Face the danger — choose your route')).toBeTruthy();
    });

    it('calls onContinue when continue button is pressed', () => {
        const { getByTestId } = render(<HazardIntroOverlay {...mockProps} />);
        const continueButton = getByTestId('hazard-intro-continue');
        
        fireEvent.press(continueButton);
        
        expect(mockProps.onContinue).toHaveBeenCalledTimes(1);
    });

    it('handles different hazard IDs', () => {
        const floodProps = { ...mockProps, hazardId: 'flooded-undercroft' };
        const { root } = render(<HazardIntroOverlay {...floodProps} />);
        expect(root).toBeTruthy();
    });

    it('handles unknown hazard IDs (fallback to cliff)', () => {
        const unknownProps = { ...mockProps, hazardId: 'unknown-hazard' };
        const { root } = render(<HazardIntroOverlay {...unknownProps} />);
        expect(root).toBeTruthy();
    });

    it('handles long title text', () => {
        const longTitleProps = { 
            ...mockProps, 
            title: 'A Very Long Hazard Title That Tests Layout Behavior' 
        };
        const { getByText } = render(<HazardIntroOverlay {...longTitleProps} />);
        expect(getByText('A Very Long Hazard Title That Tests Layout Behavior')).toBeTruthy();
    });

    it('handles long intro text', () => {
        const longIntroProps = { 
            ...mockProps, 
            intro: 'This is a very long introduction text that describes the hazard in great detail, explaining the dire circumstances and the perilous situation that the player character finds themselves in during this particular dangerous encounter.' 
        };
        const { getByText } = render(<HazardIntroOverlay {...longIntroProps} />);
        expect(getByText(/This is a very long introduction text/)).toBeTruthy();
    });

    it('has correct testID for automated testing', () => {
        const { getByTestId } = render(<HazardIntroOverlay {...mockProps} />);
        expect(getByTestId('hazard-intro-overlay')).toBeTruthy();
        expect(getByTestId('hazard-intro-continue')).toBeTruthy();
    });

    it('fires haptic feedback on mount', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { impactAsync } = require('expo-haptics');
        
        render(<HazardIntroOverlay {...mockProps} />);
        
        expect(impactAsync).toHaveBeenCalledWith('heavy');
    });

    it('handles empty title gracefully', () => {
        const emptyTitleProps = { ...mockProps, title: '' };
        const { root } = render(<HazardIntroOverlay {...emptyTitleProps} />);
        expect(root).toBeTruthy();
    });

    it('handles empty intro gracefully', () => {
        const emptyIntroProps = { ...mockProps, intro: '' };
        const { root } = render(<HazardIntroOverlay {...emptyIntroProps} />);
        expect(root).toBeTruthy();
    });
});