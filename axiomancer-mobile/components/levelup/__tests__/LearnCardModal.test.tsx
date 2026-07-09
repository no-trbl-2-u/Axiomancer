/**
 * Hermetic component tests — LearnCardModal surface.
 *
 * Pins the card-learning modal: copy register, offer rendering,
 * button interactions, accessibility labels. Tests the overlay that
 * appears during character level-up for card selection.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { LearnCardModal } from '@/components/levelup/LearnCardModal';
import type { LearnableCardOffer } from '@/state/actions';

const mockOffer: LearnableCardOffer = {
    id: 'test-card-id',
    name: 'Test Card',
    tier: 2,
    category: 'fallacy',
    stance: 'mind',
    effectText: 'deals +2 damage',
    description: 'A test card for unit testing',
};

describe('LearnCardModal: mount contract', () => {
    it('renders the modal root with testID', () => {
        const tree = render(
            <LearnCardModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        expect(tree.getByTestId('learn-card-modal')).toBeTruthy();
    });

    it('renders the header copy (eyebrow + title + subtitle)', () => {
        const tree = render(
            <LearnCardModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        expect(tree.queryByText('✠ A NEW TURN OF PHRASE')).not.toBeNull();
        expect(tree.queryByText('LEARN A CARD')).not.toBeNull();
        expect(tree.queryByText('choose one — the mind keeps what it names')).not.toBeNull();
    });

    it('renders multiple picks subtitle when picksRemaining > 1', () => {
        const tree = render(
            <LearnCardModal
                offers={[mockOffer]}
                picksRemaining={3}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        expect(tree.queryByText('choose one · 3 picks remain')).not.toBeNull();
    });

    it('renders card offer with all required fields', () => {
        const tree = render(
            <LearnCardModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        expect(tree.queryByText('Test Card')).not.toBeNull();
        expect(tree.queryByText('T2 · FALLACY')).not.toBeNull();
        expect(tree.queryByText('deals +2 damage')).not.toBeNull();
        expect(tree.queryByText('A test card for unit testing')).not.toBeNull();
        expect(tree.queryByText('LEARN ›')).not.toBeNull();
    });

    it('renders skip button with expected copy', () => {
        const tree = render(
            <LearnCardModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        expect(tree.getByTestId('learn-card-skip')).toBeTruthy();
        expect(tree.queryByText('forgo — let the words go unlearned')).not.toBeNull();
    });
});

describe('LearnCardModal: callbacks', () => {
    it('card offer button fires onPick with card id exactly once', () => {
        const onPick = jest.fn();
        const onSkip = jest.fn();
        const tree = render(
            <LearnCardModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={onPick}
                onSkip={onSkip}
            />,
        );
        fireEvent.press(tree.getByTestId('learn-card-offer-test-card-id'));
        expect(onPick).toHaveBeenCalledTimes(1);
        expect(onPick).toHaveBeenCalledWith('test-card-id');
        expect(onSkip).not.toHaveBeenCalled();
    });

    it('skip button fires onSkip exactly once', () => {
        const onPick = jest.fn();
        const onSkip = jest.fn();
        const tree = render(
            <LearnCardModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={onPick}
                onSkip={onSkip}
            />,
        );
        fireEvent.press(tree.getByTestId('learn-card-skip'));
        expect(onSkip).toHaveBeenCalledTimes(1);
        expect(onPick).not.toHaveBeenCalled();
    });
});

describe('LearnCardModal: voice register', () => {
    it('subtitle uses lowercase ritual register (no second-person archaic pronouns)', () => {
        const tree = render(
            <LearnCardModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        const subtitle = tree.getByText('choose one — the mind keeps what it names');
        expect(subtitle.props.children).toBe(subtitle.props.children.toLowerCase());
        const banned = /\b(thou|thee|thy|thine|ye)\b/i;
        expect(subtitle.props.children).not.toMatch(banned);
    });

    it('skip text uses lowercase ritual register (no second-person archaic pronouns)', () => {
        const tree = render(
            <LearnCardModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        const skipText = tree.getByText('forgo — let the words go unlearned');
        expect(skipText.props.children).toBe(skipText.props.children.toLowerCase());
        const banned = /\b(thou|thee|thy|thine|ye)\b/i;
        expect(skipText.props.children).not.toMatch(banned);
    });
});

describe('LearnCardModal: accessibility', () => {
    it('card offer button surfaces descriptive accessibilityLabel', () => {
        const tree = render(
            <LearnCardModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        const button = tree.getByTestId('learn-card-offer-test-card-id');
        expect(button.props.accessibilityLabel).toBe(
            'Learn Test Card, deals +2 damage',
        );
        expect(button.props.accessibilityRole).toBe('button');
    });

    it('skip button surfaces descriptive accessibilityLabel', () => {
        const tree = render(
            <LearnCardModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        const button = tree.getByTestId('learn-card-skip');
        expect(button.props.accessibilityLabel).toBe('Forgo learning a card this level');
        expect(button.props.accessibilityRole).toBe('button');
    });
});

describe('LearnCardModal: multiple offers', () => {
    it('renders all provided card offers with unique testIDs', () => {
        const offers: LearnableCardOffer[] = [
            { ...mockOffer, id: 'card-1', name: 'First Card' },
            { ...mockOffer, id: 'card-2', name: 'Second Card' },
            { ...mockOffer, id: 'card-3', name: 'Third Card' },
        ];
        const tree = render(
            <LearnCardModal
                offers={offers}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        expect(tree.getByTestId('learn-card-offer-card-1')).toBeTruthy();
        expect(tree.getByTestId('learn-card-offer-card-2')).toBeTruthy();
        expect(tree.getByTestId('learn-card-offer-card-3')).toBeTruthy();
        expect(tree.queryByText('First Card')).not.toBeNull();
        expect(tree.queryByText('Second Card')).not.toBeNull();
        expect(tree.queryByText('Third Card')).not.toBeNull();
    });
});