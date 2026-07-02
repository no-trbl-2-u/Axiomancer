/**
 * QuestBoardTrack — the ring of spaces drawn around the board's center
 * well. Pins the pure geometry/accent helpers (perimeterCells,
 * ringDimensions, questKindAccents) plus the component's conditional
 * surfaces: the piece marker, the destination flag, the route borders,
 * and the center-well children.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { describe, expect, it } from '@jest/globals';

import {
    QuestBoardTrack,
    perimeterCells,
    questKindAccents,
    ringDimensions,
} from '@/components/quest/QuestBoardTrack';
import {
    QUEST_SPACE_GLYPHS,
    type QuestSpaceVM,
} from '@/state/presenters/quest.engine';
import type { QuestSpaceKind } from 'axiomancer-mechanics';
import { usePalette } from '@/theme/runtime';

function space(index: number, kind: QuestSpaceKind, isPiece = false): QuestSpaceVM {
    return {
        index,
        id: `s${index}`,
        kind,
        name: `${kind} ${index}`,
        glyph: QUEST_SPACE_GLYPHS[kind],
        isPiece,
        isSlipway: kind === 'slipway',
    };
}

const SPACES: QuestSpaceVM[] = [
    space(0, 'slipway', true),
    space(1, 'gather'),
    space(2, 'duel'),
    space(3, 'snag'),
];

describe('perimeterCells', () => {
    it('walks the perimeter clockwise from the top-left corner', () => {
        expect(perimeterCells(3, 3)).toEqual([
            { col: 0, row: 0 },
            { col: 1, row: 0 },
            { col: 2, row: 0 },
            { col: 2, row: 1 },
            { col: 2, row: 2 },
            { col: 1, row: 2 },
            { col: 0, row: 2 },
            { col: 0, row: 1 },
        ]);
    });

    it('returns exactly the ring count of cells (no interior)', () => {
        // 5x5 ring = 2*(5+5)-4 = 16 perimeter cells.
        expect(perimeterCells(5, 5)).toHaveLength(16);
        // 4x4 ring = 2*(4+4)-4 = 12.
        expect(perimeterCells(4, 4)).toHaveLength(12);
    });

    it('starts at the slipway corner and never repeats a cell', () => {
        const cells = perimeterCells(4, 4);
        expect(cells[0]).toEqual({ col: 0, row: 0 });
        const seen = new Set(cells.map((c) => `${c.col},${c.row}`));
        expect(seen.size).toBe(cells.length);
    });
});

describe('ringDimensions', () => {
    it('seats 16 spaces in a 5x5 ring', () => {
        expect(ringDimensions(16)).toEqual({ w: 5, h: 5 });
    });

    it('never drops below a 3x3 minimum ring', () => {
        expect(ringDimensions(1)).toEqual({ w: 3, h: 3 });
        expect(ringDimensions(4)).toEqual({ w: 3, h: 3 });
    });

    it('grows the ring until the perimeter can seat the count', () => {
        const { w, h } = ringDimensions(20);
        expect(2 * (w + h) - 4).toBeGreaterThanOrEqual(20);
    });
});

describe('questKindAccents', () => {
    it('maps every space kind to a palette colour', () => {
        let accents: Record<string, string> = {};
        function Probe() {
            accents = questKindAccents(usePalette());
            return null;
        }
        render(<Probe />);
        for (const kind of Object.keys(QUEST_SPACE_GLYPHS) as QuestSpaceKind[]) {
            expect(typeof accents[kind]).toBe('string');
            expect(accents[kind].length).toBeGreaterThan(0);
        }
    });
});

describe('QuestBoardTrack', () => {
    it('renders the track frame and one cell per space', () => {
        render(<QuestBoardTrack spaces={SPACES} size={300} />);
        expect(screen.getByTestId('quest-board-track')).toBeTruthy();
        for (const s of SPACES) {
            expect(screen.getByTestId(`quest-space-${s.index}`)).toBeTruthy();
        }
    });

    it('marks the piece at the space carrying isPiece when pieceIndex is omitted', () => {
        render(<QuestBoardTrack spaces={SPACES} size={300} />);
        expect(screen.getByTestId('quest-piece')).toBeTruthy();
        expect(screen.getByTestId('quest-space-0').props.accessibilityLabel)
            .toContain('the piece stands here');
    });

    it('overrides the marker position with pieceIndex', () => {
        render(<QuestBoardTrack spaces={SPACES} size={300} pieceIndex={2} />);
        expect(screen.getByTestId('quest-space-2').props.accessibilityLabel)
            .toContain('the piece stands here');
        expect(screen.getByTestId('quest-space-0').props.accessibilityLabel)
            .not.toContain('the piece stands here');
    });

    it('draws the destination flag on the target space (when the piece is elsewhere)', () => {
        render(<QuestBoardTrack spaces={SPACES} size={300} pieceIndex={0} targetIndex={3} />);
        expect(screen.getByTestId('quest-target-3')).toBeTruthy();
        expect(screen.getByTestId('quest-space-3').props.accessibilityLabel)
            .toContain('the piece is bound here');
    });

    it('hides the target flag when the piece already stands on the target', () => {
        render(<QuestBoardTrack spaces={SPACES} size={300} pieceIndex={3} targetIndex={3} />);
        expect(screen.queryByTestId('quest-target-3')).toBeNull();
        expect(screen.getByTestId('quest-piece')).toBeTruthy();
    });

    it('renders a glow overlay for every space', () => {
        render(<QuestBoardTrack spaces={SPACES} size={300} />);
        for (const s of SPACES) {
            expect(screen.getByTestId(`quest-space-glow-${s.index}`)).toBeTruthy();
        }
    });

    it('renders center-well children', () => {
        render(
            <QuestBoardTrack spaces={SPACES} size={300}>
                <Text testID="well-content">ROLL</Text>
            </QuestBoardTrack>,
        );
        expect(screen.getByTestId('well-content')).toBeTruthy();
    });
});
