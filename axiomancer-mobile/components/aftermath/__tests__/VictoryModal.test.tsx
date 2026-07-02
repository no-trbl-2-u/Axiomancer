/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import VictoryModal from '../VictoryModal';

const mockVictoryProps = {
    visible: true,
    enemyName: 'THE HIEROPHANT',
    enemyEpithet: 'iron-tongued',
    finalBlow: {
        skillName: 'AXE-FALL',
        damage: 28,
        descriptor: 'cleaves the binding rib',
    },
    finalBlowPhrase: 'and the iron-tongued went down face-first into its own teeth.',
    rewards: {
        xp: 24,
        currency: {
            vitae: 6,
            sigils: 1,
        },
        loot: [
            { name: 'Rusted Chain', slot: 'neck', rarity: 'common' as const },
            { name: 'Bone Shard', slot: 'misc', rarity: 'rare' as const },
        ],
    },
    onContinue: jest.fn(),
};

describe('VictoryModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders victory content when visible', () => {
        const { getByText } = render(<VictoryModal {...mockVictoryProps} />);

        expect(getByText('✠ THE FOE FALLS')).toBeTruthy();
        expect(getByText('THE HIEROPHANT')).toBeTruthy();
        expect(getByText('iron-tongued')).toBeTruthy();
        expect(getByText('FINAL BLOW · AXE-FALL · 28')).toBeTruthy();
        expect(getByText('and the iron-tongued went down face-first into its own teeth.')).toBeTruthy();
        expect(getByText('24')).toBeTruthy();
        expect(getByText('6 / 1')).toBeTruthy();
        expect(getByText('2')).toBeTruthy();
        expect(getByText('Rusted Chain')).toBeTruthy();
        expect(getByText('✠ CARRY ON')).toBeTruthy();
    });

    it('does not render when not visible', () => {
        const { queryByText } = render(<VictoryModal {...mockVictoryProps} visible={false} />);
        expect(queryByText('✠ THE FOE FALLS')).toBeFalsy();
    });

    it('handles empty loot list', () => {
        const propsWithoutLoot = {
            ...mockVictoryProps,
            rewards: {
                ...mockVictoryProps.rewards,
                loot: [],
            },
        };

        const { getByText } = render(<VictoryModal {...propsWithoutLoot} />);
        expect(getByText('no spoils. only quiet.')).toBeTruthy();
    });

    it('calls onContinue when continue button is pressed', () => {
        const { getByText } = render(<VictoryModal {...mockVictoryProps} />);
        
        fireEvent.press(getByText('✠ CARRY ON'));
        expect(mockVictoryProps.onContinue).toHaveBeenCalledTimes(1);
    });

    it('displays different rarity indicators', () => {
        const propsWithVariedLoot = {
            ...mockVictoryProps,
            rewards: {
                ...mockVictoryProps.rewards,
                loot: [
                    { name: 'Common Item', slot: 'hand', rarity: 'common' as const },
                    { name: 'Rare Item', slot: 'chest', rarity: 'rare' as const },
                    { name: 'Legendary Item', slot: 'head', rarity: 'legendary' as const },
                ],
            },
        };

        const { getByText } = render(<VictoryModal {...propsWithVariedLoot} />);
        
        expect(getByText('Common Item')).toBeTruthy();
        expect(getByText('Rare Item')).toBeTruthy();
        expect(getByText('Legendary Item')).toBeTruthy();
    });
});