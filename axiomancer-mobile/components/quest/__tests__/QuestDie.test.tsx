/**
 * QuestDie — the bone die in the center well. Tumbles while rolling,
 * shows the settled value + total once still.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { QuestDie } from '@/components/quest/QuestDie';

describe('QuestDie', () => {
    it('hides the total while the die is tumbling', () => {
        render(<QuestDie face={4} rolling tick={3} bonus={0} total={null} />);
        expect(screen.getByTestId('quest-die-face')).toBeTruthy();
        expect(screen.queryByTestId('quest-die-total')).toBeNull();
    });

    it('shows the settled total once still', () => {
        render(<QuestDie face={5} rolling={false} tick={0} bonus={0} total={5} />);
        expect(screen.getByTestId('quest-die-total').props.children).toBe('5');
    });

    it('breaks out die + bonus when wind boosted the cast', () => {
        render(<QuestDie face={4} rolling={false} tick={0} bonus={2} total={6} />);
        // "6 (4+2)"
        expect(screen.getByTestId('quest-die-total').props.children).toBe('6 (4+2)');
    });

    it('renders a pip glyph for 1-6 and falls back gracefully for null', () => {
        const { rerender } = render(<QuestDie face={1} rolling={false} tick={0} bonus={0} total={1} />);
        expect(screen.getByTestId('quest-die-face').props.children).toBe('⚀');
        rerender(<QuestDie face={6} rolling={false} tick={0} bonus={0} total={6} />);
        expect(screen.getByTestId('quest-die-face').props.children).toBe('⚅');
        rerender(<QuestDie face={null} rolling={false} tick={0} bonus={0} total={null} />);
        expect(screen.getByTestId('quest-die-face').props.children).toBe('⚄');
    });
});
