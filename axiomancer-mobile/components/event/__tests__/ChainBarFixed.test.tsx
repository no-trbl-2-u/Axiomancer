/**
 * Hermetic component tests — ChainBarFixed.
 */

import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { ChainBarFixed } from '../ChainBarFixed';

describe('ChainBarFixed', () => {
    it('renders top chain bar with label and accent color', () => {
        const tree = render(
            <ChainBarFixed
                position="top"
                label="SEALED · AT ARMS"
                accentColor="#c0152a"
            />
        );
        
        expect(tree.getByTestId('encounter-modal-chain')).toBeTruthy();
        expect(tree.getByText('SEALED · AT ARMS')).toBeTruthy();
        expect(tree.getByText('SEALED · AT ARMS')).toHaveStyle({ color: '#c0152a' });
    });

    it('renders bottom chain bar with label and accent color', () => {
        const tree = render(
            <ChainBarFixed
                position="bottom"
                label="NO RETREAT"
                accentColor="#c0152a"
            />
        );
        
        expect(tree.getByTestId('encounter-modal-chain')).toBeTruthy();
        expect(tree.getByText('NO RETREAT')).toBeTruthy();
        expect(tree.getByText('NO RETREAT')).toHaveStyle({ color: '#c0152a' });
    });

    it('renders diamond strands with correct color', () => {
        const tree = render(
            <ChainBarFixed
                position="top"
                label="TEST LABEL"
                accentColor="#ff0000"
            />
        );
        
        const diamonds = tree.getAllByText('◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆');
        expect(diamonds).toHaveLength(2);
        diamonds.forEach(diamond => {
            expect(diamond).toHaveStyle({ color: '#ff0000' });
        });
    });
});