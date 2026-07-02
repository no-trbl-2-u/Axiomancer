/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DefeatModal from '../DefeatModal';

const mockDefeatProps = {
    visible: true,
    characterName: 'SEEKER KAINE',
    cause: {
        killerName: 'THE HIEROPHANT',
        killerEpithet: 'iron-tongued',
        finalSkill: 'BINDING WORD',
        damage: 15,
    },
    causePhrase: 'the word fell like a stone and the seeker could not rise again.',
    run: {
        rounds: 12,
        encountersSurvived: 3,
        deepestNode: 7,
    },
    onRetry: jest.fn(),
    onAbandon: jest.fn(),
};

describe('DefeatModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders defeat content when visible', () => {
        const { getByText } = render(<DefeatModal {...mockDefeatProps} />);

        expect(getByText('✠ THE PAGE CLOSES')).toBeTruthy();
        expect(getByText('SEEKER KAINE')).toBeTruthy();
        expect(getByText('fell to THE HIEROPHANT, iron-tongued')).toBeTruthy();
        expect(getByText('rounds endured')).toBeTruthy();
        expect(getByText('12')).toBeTruthy();
        expect(getByText('encounters survived')).toBeTruthy();
        expect(getByText('3')).toBeTruthy();
        expect(getByText('deepest node reached')).toBeTruthy();
        expect(getByText('7')).toBeTruthy();
        expect(getByText('✠ BEGIN AGAIN')).toBeTruthy();
        expect(getByText('let the page close')).toBeTruthy();
    });

    it('does not render when not visible', () => {
        const { queryByText } = render(<DefeatModal {...mockDefeatProps} visible={false} />);
        expect(queryByText('✠ THE PAGE CLOSES')).toBeFalsy();
    });

    it('renders chronicle phrase with dropcap', () => {
        const { getByText } = render(<DefeatModal {...mockDefeatProps} />);

        // Check for dropcap (first letter)
        expect(getByText('T')).toBeTruthy();
        // Check for the rest of the phrase
        expect(getByText('he word fell like a stone and the seeker could not rise again.')).toBeTruthy();
    });

    it('calls onRetry when retry button is pressed', () => {
        const { getByText } = render(<DefeatModal {...mockDefeatProps} />);
        
        fireEvent.press(getByText('✠ BEGIN AGAIN'));
        expect(mockDefeatProps.onRetry).toHaveBeenCalledTimes(1);
    });

    it('calls onAbandon when abandon button is pressed', () => {
        const { getByText } = render(<DefeatModal {...mockDefeatProps} />);
        
        fireEvent.press(getByText('let the page close'));
        expect(mockDefeatProps.onAbandon).toHaveBeenCalledTimes(1);
    });

    it('handles different run statistics', () => {
        const propsWithDifferentStats = {
            ...mockDefeatProps,
            run: {
                rounds: 25,
                encountersSurvived: 8,
                deepestNode: 15,
            },
        };

        const { getByText } = render(<DefeatModal {...propsWithDifferentStats} />);
        
        expect(getByText('25')).toBeTruthy();
        expect(getByText('8')).toBeTruthy();
        expect(getByText('15')).toBeTruthy();
    });

    it('handles different killer details', () => {
        const propsWithDifferentKiller = {
            ...mockDefeatProps,
            cause: {
                killerName: 'SHADOW WARDEN',
                killerEpithet: 'void-touched',
                finalSkill: 'DRAIN',
                damage: 22,
            },
        };

        const { getByText } = render(<DefeatModal {...propsWithDifferentKiller} />);
        
        expect(getByText('fell to SHADOW WARDEN, void-touched')).toBeTruthy();
    });
});