/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FriendshipModal from '../FriendshipModal';

const mockFriendshipProps = {
    visible: true,
    formerFoeName: 'THE HIEROPHANT',
    formerFoeEpithet: 'iron-tongued',
    pactPhrase: 'the iron-tongued lowered its gaze and spoke of old hurts.',
    rewards: {
        xp: 18,
        currency: {
            vitae: 4,
            sigils: 2,
        },
        loot: [],
        journalEntry: {
            bookName: 'THE CODEX OF KEPT WORDS',
            entryTitle: 'On the Iron-Tongued',
            preview: 'Once a keeper of the old paths, the hierophant speaks',
        },
    },
    onContinue: jest.fn(),
};

describe('FriendshipModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders friendship content when visible', () => {
        const { getByText } = render(<FriendshipModal {...mockFriendshipProps} />);

        expect(getByText('❦ THE HEART OPENS')).toBeTruthy();
        expect(getByText('THE HIEROPHANT')).toBeTruthy();
        expect(getByText('iron-tongued')).toBeTruthy();
        expect(getByText('❦ AN ACCORD')).toBeTruthy();
        expect(getByText('the iron-tongued lowered its gaze and spoke of old hurts.')).toBeTruthy();
        expect(getByText('18')).toBeTruthy();
        expect(getByText('4 / 2')).toBeTruthy();
        expect(getByText('❦ PART AS FRIENDS')).toBeTruthy();
    });

    it('does not render when not visible', () => {
        const { queryByText } = render(<FriendshipModal {...mockFriendshipProps} visible={false} />);
        expect(queryByText('❦ THE HEART OPENS')).toBeFalsy();
    });

    it('renders journal entry when present', () => {
        const { getByText } = render(<FriendshipModal {...mockFriendshipProps} />);

        expect(getByText('✎ A NEW ENTRY')).toBeTruthy();
        expect(getByText('THE CODEX OF KEPT WORDS')).toBeTruthy();
        expect(getByText('On the Iron-Tongued')).toBeTruthy();
        expect(getByText('Once a keeper of the old paths, the hierophant speaks…')).toBeTruthy();
    });

    it('hides journal entry when not present', () => {
        const propsWithoutJournal = {
            ...mockFriendshipProps,
            rewards: {
                ...mockFriendshipProps.rewards,
                journalEntry: null,
            },
        };

        const { queryByText } = render(<FriendshipModal {...propsWithoutJournal} />);
        expect(queryByText('✎ A NEW ENTRY')).toBeFalsy();
    });

    it('handles empty loot list', () => {
        const { getByText } = render(<FriendshipModal {...mockFriendshipProps} />);
        expect(getByText('no spoils. only quiet.')).toBeTruthy();
    });

    it('calls onContinue when continue button is pressed', () => {
        const { getByText } = render(<FriendshipModal {...mockFriendshipProps} />);
        
        fireEvent.press(getByText('❦ PART AS FRIENDS'));
        expect(mockFriendshipProps.onContinue).toHaveBeenCalledTimes(1);
    });

    it('renders with loot when present', () => {
        const propsWithLoot = {
            ...mockFriendshipProps,
            rewards: {
                ...mockFriendshipProps.rewards,
                loot: [{ name: 'Peace Token', slot: 'misc', rarity: 'rare' as const }],
            },
        };

        const { getByText, queryByText } = render(<FriendshipModal {...propsWithLoot} />);
        
        expect(getByText('Peace Token')).toBeTruthy();
        expect(queryByText('no spoils. only quiet.')).toBeFalsy();
    });
});