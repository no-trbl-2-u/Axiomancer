/**
 * QuestLegend — the "what the marks mean" key. Collapsed by default,
 * unfolds to one row per *distinct* space kind on the board.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { QuestLegend } from '@/components/quest/QuestLegend';
import {
    QUEST_SPACE_GLYPHS,
    QUEST_SPACE_KIND_LABELS,
    type QuestSpaceVM,
} from '@/state/presenters/quest.engine';
import type { QuestSpaceKind } from 'axiomancer-mechanics';

function space(index: number, kind: QuestSpaceKind): QuestSpaceVM {
    return {
        index,
        id: `s${index}`,
        kind,
        name: `${kind} ${index}`,
        glyph: QUEST_SPACE_GLYPHS[kind],
        isPiece: false,
        isSlipway: kind === 'slipway',
    };
}

const SPACES: QuestSpaceVM[] = [
    space(0, 'slipway'),
    space(1, 'gather'),
    space(2, 'duel'),
    space(3, 'gather'), // duplicate kind — should not produce a second row
];

describe('QuestLegend', () => {
    it('starts collapsed — only the toggle shows', () => {
        render(<QuestLegend spaces={SPACES} />);
        expect(screen.getByTestId('quest-legend-toggle')).toBeTruthy();
        expect(screen.queryByTestId('quest-legend-slipway')).toBeNull();
    });

    it('unfolds one row per distinct kind, in board order, with labels', () => {
        render(<QuestLegend spaces={SPACES} />);
        fireEvent.press(screen.getByTestId('quest-legend-toggle'));

        expect(screen.getByTestId('quest-legend-slipway')).toBeTruthy();
        expect(screen.getByTestId('quest-legend-gather')).toBeTruthy();
        expect(screen.getByTestId('quest-legend-duel')).toBeTruthy();
        // Only three distinct kinds despite four spaces.
        expect(screen.getAllByTestId(/^quest-legend-(slipway|gather|duel|snag|hearth|market|parley|cache|omen)$/))
            .toHaveLength(3);
        // Labels come from the shared presenter map.
        expect(screen.getByText(QUEST_SPACE_KIND_LABELS.gather)).toBeTruthy();
    });

    it('toggles back closed', () => {
        render(<QuestLegend spaces={SPACES} />);
        const toggle = screen.getByTestId('quest-legend-toggle');
        fireEvent.press(toggle);
        expect(screen.getByTestId('quest-legend-duel')).toBeTruthy();
        fireEvent.press(toggle);
        expect(screen.queryByTestId('quest-legend-duel')).toBeNull();
    });
});
