/**
 * Hermetic component tests — LearnSkillModal surface.
 *
 * Pins the skill-learning modal: copy register, offer rendering,
 * button interactions, accessibility labels. Tests the overlay that
 * appears during character level-up for skill selection.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { LearnSkillModal } from '@/components/levelup/LearnSkillModal';
import type { LearnableSkillOffer } from '@/state/actions';

const mockOffer: LearnableSkillOffer = {
    id: 'test-skill-id',
    name: 'Test Skill',
    tier: 2,
    category: 'fallacy',
    stance: 'mind',
    effectText: 'deals +2 damage',
    description: 'A test skill for unit testing',
};

describe('LearnSkillModal: mount contract', () => {
    it('renders the modal root with testID', () => {
        const tree = render(
            <LearnSkillModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        expect(tree.getByTestId('learn-skill-modal')).toBeTruthy();
    });

    it('renders the header copy (eyebrow + title + subtitle)', () => {
        const tree = render(
            <LearnSkillModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        expect(tree.queryByText('✠ A NEW TURN OF PHRASE')).not.toBeNull();
        expect(tree.queryByText('LEARN A SKILL')).not.toBeNull();
        expect(tree.queryByText('choose one — the mind keeps what it names')).not.toBeNull();
    });

    it('renders multiple picks subtitle when picksRemaining > 1', () => {
        const tree = render(
            <LearnSkillModal
                offers={[mockOffer]}
                picksRemaining={3}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        expect(tree.queryByText('choose one · 3 picks remain')).not.toBeNull();
    });

    it('renders skill offer with all required fields', () => {
        const tree = render(
            <LearnSkillModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        expect(tree.queryByText('Test Skill')).not.toBeNull();
        expect(tree.queryByText('T2 · FALLACY')).not.toBeNull();
        expect(tree.queryByText('deals +2 damage')).not.toBeNull();
        expect(tree.queryByText('A test skill for unit testing')).not.toBeNull();
        expect(tree.queryByText('LEARN ›')).not.toBeNull();
    });

    it('renders skip button with expected copy', () => {
        const tree = render(
            <LearnSkillModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        expect(tree.getByTestId('learn-skill-skip')).toBeTruthy();
        expect(tree.queryByText('forgo — let the words go unlearned')).not.toBeNull();
    });
});

describe('LearnSkillModal: callbacks', () => {
    it('skill offer button fires onPick with skill id exactly once', () => {
        const onPick = jest.fn();
        const onSkip = jest.fn();
        const tree = render(
            <LearnSkillModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={onPick}
                onSkip={onSkip}
            />,
        );
        fireEvent.press(tree.getByTestId('learn-skill-offer-test-skill-id'));
        expect(onPick).toHaveBeenCalledTimes(1);
        expect(onPick).toHaveBeenCalledWith('test-skill-id');
        expect(onSkip).not.toHaveBeenCalled();
    });

    it('skip button fires onSkip exactly once', () => {
        const onPick = jest.fn();
        const onSkip = jest.fn();
        const tree = render(
            <LearnSkillModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={onPick}
                onSkip={onSkip}
            />,
        );
        fireEvent.press(tree.getByTestId('learn-skill-skip'));
        expect(onSkip).toHaveBeenCalledTimes(1);
        expect(onPick).not.toHaveBeenCalled();
    });
});

describe('LearnSkillModal: voice register', () => {
    it('subtitle uses lowercase ritual register (no second-person archaic pronouns)', () => {
        const tree = render(
            <LearnSkillModal
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
            <LearnSkillModal
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

describe('LearnSkillModal: accessibility', () => {
    it('skill offer button surfaces descriptive accessibilityLabel', () => {
        const tree = render(
            <LearnSkillModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        const button = tree.getByTestId('learn-skill-offer-test-skill-id');
        expect(button.props.accessibilityLabel).toBe(
            'Learn Test Skill, deals +2 damage',
        );
        expect(button.props.accessibilityRole).toBe('button');
    });

    it('skip button surfaces descriptive accessibilityLabel', () => {
        const tree = render(
            <LearnSkillModal
                offers={[mockOffer]}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        const button = tree.getByTestId('learn-skill-skip');
        expect(button.props.accessibilityLabel).toBe('Forgo learning a skill this level');
        expect(button.props.accessibilityRole).toBe('button');
    });
});

describe('LearnSkillModal: multiple offers', () => {
    it('renders all provided skill offers with unique testIDs', () => {
        const offers: LearnableSkillOffer[] = [
            { ...mockOffer, id: 'skill-1', name: 'First Skill' },
            { ...mockOffer, id: 'skill-2', name: 'Second Skill' },
            { ...mockOffer, id: 'skill-3', name: 'Third Skill' },
        ];
        const tree = render(
            <LearnSkillModal
                offers={offers}
                picksRemaining={1}
                onPick={() => undefined}
                onSkip={() => undefined}
            />,
        );
        expect(tree.getByTestId('learn-skill-offer-skill-1')).toBeTruthy();
        expect(tree.getByTestId('learn-skill-offer-skill-2')).toBeTruthy();
        expect(tree.getByTestId('learn-skill-offer-skill-3')).toBeTruthy();
        expect(tree.queryByText('First Skill')).not.toBeNull();
        expect(tree.queryByText('Second Skill')).not.toBeNull();
        expect(tree.queryByText('Third Skill')).not.toBeNull();
    });
});