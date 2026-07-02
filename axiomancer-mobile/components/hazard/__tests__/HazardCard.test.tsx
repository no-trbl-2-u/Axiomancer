import React from 'react';
import { render } from '@testing-library/react-native';

import { HazardCard, CardArt } from '../HazardCard';
import type { HazardCardVM } from '@/state/presenters/hazard.engine';

const mockCardVM: HazardCardVM = {
    uid: 'test-card-1',
    cardId: 'test-card',
    name: 'Test Card',
    kind: 'red',
    rarity: 'common',
    dead: false,
    utility: false,
    free: { force: 3, escape: 1 },
    powered: { force: 5, escape: 2 },
    freeEffectLabel: '',
    poweredEffectLabel: '',
    flavor: 'A powerful card for testing',
    keywords: [],
    dieAvailable: true,
    poweredByDieId: null,
    applied: false,
    salvageLabel: null, powerColors: ['red'], choose: false, chosenKey: null, vowBonus: null,
};

describe('HazardCard', () => {
    it('renders card in hand mode with proper structure', () => {
        const { getByText } = render(
            <HazardCard card={mockCardVM} mode="hand" />
        );
        
        expect(getByText('Test Card')).toBeTruthy();
    });

    it('renders card in play mode with compact layout', () => {
        const { getByText } = render(
            <HazardCard card={mockCardVM} mode="play" />
        );
        
        expect(getByText('Test Card')).toBeTruthy();
    });

    it('renders card in detail mode with full information', () => {
        const { getByText } = render(
            <HazardCard card={mockCardVM} mode="detail" />
        );
        
        expect(getByText('Test Card')).toBeTruthy();
        expect(getByText('FREE')).toBeTruthy();
        expect(getByText('MANA')).toBeTruthy();
    });

    it('renders card in offer mode for rewards', () => {
        const { getByText } = render(
            <HazardCard card={mockCardVM} mode="offer" />
        );
        
        expect(getByText('Test Card')).toBeTruthy();
    });

    it('shows mana socket when card is powered', () => {
        const { getByText } = render(
            <HazardCard card={mockCardVM} mode="detail" />
        );
        
        expect(getByText('MANA')).toBeTruthy();
    });

    it('handles utility cards correctly', () => {
        const utilityCard = { ...mockCardVM, utility: true, freeEffectLabel: 'Heal 2', poweredEffectLabel: 'Heal 4' };
        const { getByText } = render(
            <HazardCard card={utilityCard} mode="detail" />
        );
        
        // Hybrid detail rows show the effect with a ⬡ glyph prefix.
        expect(getByText(/Heal 2/)).toBeTruthy();
        expect(getByText(/Heal 4/)).toBeTruthy();
    });

    it('displays rarity indicator', () => {
        const rareCard = { ...mockCardVM, rarity: 'rare' as const };
        const { getByText } = render(
            <HazardCard card={rareCard} mode="detail" />
        );
        
        // The rarity should be reflected in the styling (this tests the component renders without crash)
        expect(getByText('Test Card')).toBeTruthy();
    });

    it('handles dead cards', () => {
        const deadCard = { ...mockCardVM, dead: true };
        const { getByText } = render(
            <HazardCard card={deadCard} mode="hand" />
        );
        
        expect(getByText('Test Card')).toBeTruthy();
    });
});

describe('CardArt', () => {
    it('renders card art with default size', () => {
        const { root } = render(<CardArt kind="red" />);
        expect(root).toBeTruthy();
    });

    it('renders card art with custom size', () => {
        const { root } = render(<CardArt kind="blue" size={60} />);
        expect(root).toBeTruthy();
    });

    it('renders different colors correctly', () => {
        const colors = ['red', 'blue', 'purple', 'gold'] as const;
        colors.forEach(color => {
            const { root } = render(<CardArt kind={color} />);
            expect(root).toBeTruthy();
        });
    });
});