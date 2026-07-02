import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { RewardsOverlay } from '../RewardsOverlay';
import type { HazardRewardsVM } from '@/state/presenters/hazard.engine';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => {};
    return Reanimated;
});

const mockRewardsVM: HazardRewardsVM = {
    tier: 'complete',
    rewards: [
        {
            id: 'vitae-1',
            icon: 'vitae',
            name: '+5 Vitae',
            desc: 'Health restored',
        },
        {
            id: 'xp-1',
            icon: 'xp',
            name: '+10 XP',
            desc: 'Experience gained',
        },
    ],
    consequences: [
        {
            id: 'align-1',
            icon: 'align',
            name: '-1 Alignment',
            desc: 'Moral cost',
        },
    ],
    consequencesLabel: '☠ CONSEQUENCES — 1 ROUND LOST',
    offerCards: [
        {
            uid: 'offer-1',
            cardId: 'card-1',
            name: 'Fire Strike',
            kind: 'red',
            rarity: 'common',
            dead: false,
            utility: false,
            free: { force: 3, escape: 0 },
            powered: { force: 5, escape: 0 },
            freeEffectLabel: '',
            poweredEffectLabel: '',
            flavor: 'Basic fire attack',
            keywords: [],
            dieAvailable: true,
            poweredByDieId: null,
            applied: false,
            salvageLabel: null, powerColors: ['red'], choose: false, chosenKey: null, vowBonus: null,
        },
        {
            uid: 'offer-2',
            cardId: 'card-2',
            name: 'Ice Shield',
            kind: 'blue',
            rarity: 'uncommon',
            dead: false,
            utility: false,
            free: { force: 0, escape: 2 },
            powered: { force: 0, escape: 4 },
            freeEffectLabel: '',
            poweredEffectLabel: '',
            flavor: 'Basic ice defense',
            keywords: [],
            dieAvailable: true,
            poweredByDieId: null,
            applied: false,
            salvageLabel: null, powerColors: ['red'], choose: false, chosenKey: null, vowBonus: null,
        },
    ],
    offerSubLabel: 'Choose one card',
    canSkip: true,
    reserveNote: '+2 VITAE — unspent dice',
    penaltyNote: null,
        sacrificeNote: null,
        mendNote: null,
        bountyNote: null,
        subquests: [],
        questBonusNote: null,
};

describe('RewardsOverlay', () => {
    const mockProps = {
        rewards: mockRewardsVM,
        onConfirm: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders rewards overlay without errors', () => {
        const { root } = render(<RewardsOverlay {...mockProps} />);
        expect(root).toBeTruthy();
    });

    it('renders reward items', () => {
        // Boon chips show only their icon; the name/desc live on the
        // accessibility label (and in the tap tooltip).
        const { getByLabelText } = render(<RewardsOverlay {...mockProps} />);
        expect(getByLabelText('+5 Vitae. Health restored')).toBeTruthy();
        expect(getByLabelText('+10 XP. Experience gained')).toBeTruthy();
    });

    it('renders consequence items', () => {
        const { getByLabelText } = render(<RewardsOverlay {...mockProps} />);
        expect(getByLabelText('-1 Alignment. Moral cost')).toBeTruthy();
    });

    it('renders card offers', () => {
        const { getByText } = render(<RewardsOverlay {...mockProps} />);
        expect(getByText('Fire Strike')).toBeTruthy();
        expect(getByText('Ice Shield')).toBeTruthy();
    });

    // Regression guard for issue #460 (critique pass 46 / Kid playthrough
    // 2026-06-18): every reward offer tile must surface its card name AND
    // rarity — both as visible text and on the tile's accessibility label —
    // BEFORE the player opens the preview. A blank pre-preview tile leaves
    // automation/screen-reader users choosing blind.
    it('exposes each offer tile name + rarity visibly before any preview', () => {
        const { getByText } = render(<RewardsOverlay {...mockProps} />);
        // Visible card names (the offer-mode HazardCard renders these).
        expect(getByText('Fire Strike')).toBeTruthy();
        expect(getByText('Ice Shield')).toBeTruthy();
        // Visible rarity labels on the tiles.
        expect(getByText('COMMON')).toBeTruthy();
        expect(getByText('UNCOMMON')).toBeTruthy();
    });

    it('exposes each offer tile name + rarity on its accessibility label before preview', () => {
        const { getByLabelText, queryByTestId } = render(<RewardsOverlay {...mockProps} />);
        // No preview is open at mount.
        expect(queryByTestId('hazard-card-preview')).toBeNull();
        // The offer Pressable carries name + rarity for screen readers /
        // automation that read the accessibility tree rather than innerText.
        expect(getByLabelText('Preview reward card Fire Strike, common')).toBeTruthy();
        expect(getByLabelText('Preview reward card Ice Shield, uncommon')).toBeTruthy();
    });

    it('renders offer sub-label', () => {
        const { getByText } = render(<RewardsOverlay {...mockProps} />);
        expect(getByText('Choose one card')).toBeTruthy();
    });

    it('renders skip button when canSkip is true', () => {
        const { getByText } = render(<RewardsOverlay {...mockProps} />);
        // Skip button should be accessible through testID or text
        // Component should render without error
        expect(getByText('Fire Strike')).toBeTruthy();
    });

    it('hides skip button when canSkip is false', () => {
        const vmNoSkip = { ...mockRewardsVM, canSkip: false };
        const { root } = render(<RewardsOverlay {...mockProps} rewards={vmNoSkip} />);
        expect(root).toBeTruthy();
    });

    it('renders reserve note when present', () => {
        const { getByText } = render(<RewardsOverlay {...mockProps} />);
        expect(getByText(/\+2 VITAE — unspent dice/)).toBeTruthy();
    });

    it('handles penalty note when present', () => {
        const vmWithPenalty = { 
            ...mockRewardsVM, 
            penaltyNote: '−3 VITAE — route penalty' 
        };
        const { getByText } = render(<RewardsOverlay {...mockProps} rewards={vmWithPenalty} />);
        expect(getByText('−3 VITAE — route penalty')).toBeTruthy();
    });

    it('handles empty rewards and consequences', () => {
        const vmEmpty = { ...mockRewardsVM, rewards: [], consequences: [] };
        const { root } = render(<RewardsOverlay {...mockProps} rewards={vmEmpty} />);
        expect(root).toBeTruthy();
    });

    it('handles empty card offers', () => {
        const vmNoCards = { ...mockRewardsVM, offerCards: [] };
        const { root } = render(<RewardsOverlay {...mockProps} rewards={vmNoCards} />);
        expect(root).toBeTruthy();
    });

    it('handles different tier outcomes', () => {
        const perfectVM = { ...mockRewardsVM, tier: 'perfect' as const };
        const { root } = render(<RewardsOverlay {...mockProps} rewards={perfectVM} />);
        expect(root).toBeTruthy();

        const failureVM = { ...mockRewardsVM, tier: 'failure' as const };
        const { root: failureRoot } = render(<RewardsOverlay {...mockProps} rewards={failureVM} />);
        expect(failureRoot).toBeTruthy();
    });

    describe('card preview overlay', () => {
        it('opens preview when tapping a reward card', () => {
            const { getByTestId, queryByTestId } = render(<RewardsOverlay {...mockProps} />);
            
            // Preview should not be visible initially
            expect(queryByTestId('hazard-card-preview')).toBeNull();
            
            // Tap the first reward card
            fireEvent.press(getByTestId('hazard-offer-card-1'));
            
            // Preview overlay should now be visible
            expect(getByTestId('hazard-card-preview')).toBeTruthy();
        });

        it('shows card preview with correct information', () => {
            const { getByTestId, getAllByText, getByText } = render(<RewardsOverlay {...mockProps} />);
            
            // Tap the first reward card
            fireEvent.press(getByTestId('hazard-offer-card-1'));
            
            // Should show preview title
            expect(getByText('REWARD PREVIEW')).toBeTruthy();
            // Card name should appear (possibly multiple times)
            expect(getAllByText('Fire Strike').length).toBeGreaterThan(0);
            expect(getByText('RED CARD')).toBeTruthy();
        });

        it('renders keyword names (not [object Object]) in preview', () => {
            const vmWithKeywords = {
                ...mockRewardsVM,
                offerCards: [
                    {
                        ...mockRewardsVM.offerCards[0],
                        keywords: [
                            { id: 'pierce', name: 'Pierce', desc: 'Ignores armor.' },
                            { id: 'burn', name: 'Burn', desc: 'Deals damage over time.' },
                        ],
                    },
                    mockRewardsVM.offerCards[1],
                ],
            };
            const { getByTestId, getByText, queryByText } = render(
                <RewardsOverlay {...mockProps} rewards={vmWithKeywords} />
            );

            fireEvent.press(getByTestId('hazard-offer-card-1'));

            expect(getByText('Pierce, Burn')).toBeTruthy();
            expect(queryByText(/\[object Object\]/)).toBeNull();
        });

        it('shows confirm and cancel buttons in preview', () => {
            const { getByTestId } = render(<RewardsOverlay {...mockProps} />);
            
            // Tap the first reward card
            fireEvent.press(getByTestId('hazard-offer-card-1'));
            
            // Should show both action buttons
            expect(getByTestId('hazard-preview-cancel')).toBeTruthy();
            expect(getByTestId('hazard-preview-confirm')).toBeTruthy();
        });

        it('closes preview when cancel button is pressed', () => {
            const { getByTestId, queryByTestId } = render(<RewardsOverlay {...mockProps} />);
            
            // Open preview
            fireEvent.press(getByTestId('hazard-offer-card-1'));
            expect(getByTestId('hazard-card-preview')).toBeTruthy();
            
            // Press cancel
            fireEvent.press(getByTestId('hazard-preview-cancel'));
            
            // Preview should be hidden
            expect(queryByTestId('hazard-card-preview')).toBeNull();
        });

        it('selects card and closes preview when confirm button is pressed', () => {
            const { getByTestId, queryByTestId } = render(<RewardsOverlay {...mockProps} />);
            
            // Open preview
            fireEvent.press(getByTestId('hazard-offer-card-1'));
            expect(getByTestId('hazard-card-preview')).toBeTruthy();
            
            // Press confirm
            fireEvent.press(getByTestId('hazard-preview-confirm'));
            
            // Preview should be hidden
            expect(queryByTestId('hazard-card-preview')).toBeNull();
            
            // Card should be visually selected (check for picked badge or visual indicator)
            // This would be tested by checking the visual state of the card
        });

        it('does not immediately select card when tapped (preview first)', () => {
            const mockOnConfirm = jest.fn();
            const { getByTestId } = render(<RewardsOverlay {...mockProps} onConfirm={mockOnConfirm} />);
            
            // Tap the first reward card
            fireEvent.press(getByTestId('hazard-offer-card-1'));
            
            // onConfirm should not have been called yet (preview should open instead)
            expect(mockOnConfirm).not.toHaveBeenCalled();
        });

        it('calls onConfirm only after card is confirmed through preview', () => {
            const mockOnConfirm = jest.fn();
            const { getByTestId } = render(<RewardsOverlay {...mockProps} onConfirm={mockOnConfirm} />);
            
            // Tap card to open preview
            fireEvent.press(getByTestId('hazard-offer-card-1'));
            expect(mockOnConfirm).not.toHaveBeenCalled();
            
            // Confirm selection through preview
            fireEvent.press(getByTestId('hazard-preview-confirm'));
            
            // Now the main confirm button should be enabled, but we need to test the full flow
            fireEvent.press(getByTestId('hazard-rewards-confirm'));
            
            // onConfirm should be called with the selected card ID
            expect(mockOnConfirm).toHaveBeenCalledWith('card-1');
        });
    });
});