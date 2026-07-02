/**
 * Hermetic component tests — ApproachSelect surface.
 *
 * Pins the gathering approach selection overlay: copy register, approach panel rendering,
 * choice interactions, spread preview, accessibility labels. Tests the modal that
 * appears during gathering site reveal for approach selection.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { ApproachSelect } from '@/components/gathering/ApproachSelect';
import type { GatheringViewModel } from '@/state/presenters/gathering.engine';

const mockGatheringVm: GatheringViewModel = {
    active: true,
    phase: 'approach-select',
    siteId: 'ruined-hearth',
    sessionSeed: 12345,
    title: 'Ruined Hearth-gardens',
    scenario: 'Cultivated earth, the terraced plots now overgrown with invasive bramble.',
    intro: 'The hearth-gardens lie in ruin.',
    boardHeadline: 'SHALLOW EARTH',
    boardNote: 'Choose your approach carefully.',
    approachKey: null,
    approachLabel: '',
    depthIndex: 0,
    depthCount: 3,
    depthName: 'SHALLOW EARTH',
    depthNames: ['SHALLOW EARTH', 'MIDDLE EARTH', 'DEEP EARTH'],
    canDescend: false,
    bagCount: 6,
    turn: 1,
    duskNote: null,
    grace: 0,
    graceNote: null,
    satchelCount: 0,
    satchelRichness: 0,
    satchelFamilies: [],
    offerings: [],
    tools: [],
    approachChoices: [
        {
            key: 'glean',
            name: 'GLEAN',
            badge: 'MILD',
            badgeTone: 'bone',
            description: 'Take restraint — a few pieces from each soil layer.',
            rewardLabel: '2–4 pieces',
            costLabel: 'No wrath',
            ctaLabel: 'GLEAN SOFTLY',
        },
        {
            key: 'strip',
            name: 'STRIP',
            badge: 'FIERCE',
            badgeTone: 'sulfur',
            description: 'Harvest greed — wrench from the soil all you can carry.',
            rewardLabel: '5–8 pieces',
            costLabel: '3+ wrath',
            ctaLabel: 'TAKE ALL',
        },
    ],
    spread: [
        {
            uid: 'plot-1',
            plotId: 'test-moss',
            name: 'Spectral Moss',
            family: 'bloom',
            familyLabel: 'BLOOM',
            trait: null,
            traitLabel: null,
            yieldRichness: 2,
            wrathCost: 1,
            isBreath: false,
            flavor: 'Glowing with ethereal light',
            keywords: [
                { id: 'luminous', name: 'Luminous', desc: 'Gives off soft light' }
            ],
            accessibilityLabel: 'Spectral Moss. BLOOM family. 2 richness yield. 1 wrath cost. Luminous keyword.',
        },
        {
            uid: 'plot-2',
            plotId: 'test-root',
            name: 'Iron Root',
            family: 'vein',
            familyLabel: 'VEIN',
            trait: 'gift',
            traitLabel: 'Gift',
            yieldRichness: 3,
            wrathCost: 2,
            isBreath: false,
            flavor: 'Hard as forged metal',
            keywords: [],
            accessibilityLabel: 'Iron Root. VEIN family. Gift trait. 3 richness yield. 2 wrath cost.',
        },
        {
            uid: 'plot-3',
            plotId: 'test-breath',
            name: 'Calm Breath',
            family: 'bone',
            familyLabel: 'BONE',
            trait: 'breath',
            traitLabel: 'Breath',
            yieldRichness: 0,
            wrathCost: -2,
            isBreath: true,
            flavor: 'A moment of peace',
            keywords: [],
            accessibilityLabel: 'Calm Breath. BONE family. 0 richness yield. -2 wrath cost (relief).',
        },
    ],
    wrath: { 
        value: 0, 
        max: 10, 
        thresholds: [{ at: 7, fired: false }], 
        ratio: 0, 
        duskFallen: false, 
        watcherWoken: false, 
        mired: false, 
        sickled: false 
    },
    boons: [],
    withdrawEnabled: false,
    withdrawLabel: '',
    withdrawSubLabel: '',
    reprisalFlash: null,
    outcome: null,
    spoils: null,
};

const mockOnPick = jest.fn();

describe('ApproachSelect', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('mount contract', () => {
        it('renders without crashing', () => {
            const { getByTestId } = render(
                <ApproachSelect vm={mockGatheringVm} onPick={mockOnPick} />
            );

            expect(getByTestId('gathering-approach-select')).toBeTruthy();
        });

        it('displays the gathering header and scenario', () => {
            const { getByText } = render(
                <ApproachSelect vm={mockGatheringVm} onPick={mockOnPick} />
            );

            expect(getByText('Ruined Hearth-gardens')).toBeTruthy();
            expect(getByText(/Cultivated earth, the terraced plots now overgrown/)).toBeTruthy();
        });

        it('shows the depth name and spread preview', () => {
            const { getByText, getByTestId } = render(
                <ApproachSelect vm={mockGatheringVm} onPick={mockOnPick} />
            );

            expect(getByText(/SHALLOW EARTH — ALREADY ON OFFER/)).toBeTruthy();
            expect(getByTestId('gathering-opening-spread')).toBeTruthy();
        });
    });

    describe('approach choices rendering', () => {
        it('renders all approach choices with correct content', () => {
            const { getByText, getByTestId } = render(
                <ApproachSelect vm={mockGatheringVm} onPick={mockOnPick} />
            );

            // GLEAN approach
            expect(getByText('GLEAN')).toBeTruthy();
            expect(getByText('MILD')).toBeTruthy();
            expect(getByText('Take restraint — a few pieces from each soil layer.')).toBeTruthy();
            expect(getByText('2–4 pieces')).toBeTruthy();
            expect(getByText('No wrath')).toBeTruthy();
            expect(getByText('GLEAN SOFTLY')).toBeTruthy();

            // STRIP approach
            expect(getByText('STRIP')).toBeTruthy();
            expect(getByText('FIERCE')).toBeTruthy();
            expect(getByText('Harvest greed — wrench from the soil all you can carry.')).toBeTruthy();
            expect(getByText('5–8 pieces')).toBeTruthy();
            expect(getByText('3+ wrath')).toBeTruthy();
            expect(getByText('TAKE ALL')).toBeTruthy();

            // Check testIDs
            expect(getByTestId('gathering-approach-glean')).toBeTruthy();
            expect(getByTestId('gathering-approach-strip')).toBeTruthy();
        });

        it('displays GAIN and COST chip labels for each approach', () => {
            const { getAllByText } = render(
                <ApproachSelect vm={mockGatheringVm} onPick={mockOnPick} />
            );

            // Should have 2 GAIN labels (one per approach)
            const gainLabels = getAllByText('GAIN');
            expect(gainLabels).toHaveLength(2);

            // Should have 2 COST labels (one per approach)
            const costLabels = getAllByText('COST');
            expect(costLabels).toHaveLength(2);
        });
    });

    describe('callback behavior', () => {
        it('calls onPick with glean when glean approach is pressed', () => {
            const { getByTestId } = render(
                <ApproachSelect vm={mockGatheringVm} onPick={mockOnPick} />
            );

            fireEvent.press(getByTestId('gathering-approach-glean'));

            expect(mockOnPick).toHaveBeenCalledTimes(1);
            expect(mockOnPick).toHaveBeenCalledWith('glean');
        });

        it('calls onPick with strip when strip approach is pressed', () => {
            const { getByTestId } = render(
                <ApproachSelect vm={mockGatheringVm} onPick={mockOnPick} />
            );

            fireEvent.press(getByTestId('gathering-approach-strip'));

            expect(mockOnPick).toHaveBeenCalledTimes(1);
            expect(mockOnPick).toHaveBeenCalledWith('strip');
        });

        it('does not call onPick when non-interactive elements are touched', () => {
            const { getByText } = render(
                <ApproachSelect vm={mockGatheringVm} onPick={mockOnPick} />
            );

            // Try touching the title
            fireEvent.press(getByText('Ruined Hearth-gardens'));

            expect(mockOnPick).not.toHaveBeenCalled();
        });
    });

    describe('accessibility labels', () => {
        it('provides accessibility labels for approach buttons', () => {
            const { getByTestId } = render(
                <ApproachSelect vm={mockGatheringVm} onPick={mockOnPick} />
            );

            const gleanButton = getByTestId('gathering-approach-glean');
            const stripButton = getByTestId('gathering-approach-strip');

            expect(gleanButton.props.accessibilityRole).toBe('button');
            expect(gleanButton.props.accessibilityLabel).toBe('GLEAN. MILD. Take restraint — a few pieces from each soil layer.');

            expect(stripButton.props.accessibilityRole).toBe('button');
            expect(stripButton.props.accessibilityLabel).toBe('STRIP. FIERCE. Harvest greed — wrench from the soil all you can carry.');
        });
    });

    describe('edge cases and conditional rendering', () => {
        it('handles empty spread gracefully', () => {
            const vmWithEmptySpread: GatheringViewModel = {
                ...mockGatheringVm,
                spread: [],
            };

            const { getByTestId } = render(
                <ApproachSelect vm={vmWithEmptySpread} onPick={mockOnPick} />
            );

            expect(getByTestId('gathering-approach-select')).toBeTruthy();
            expect(getByTestId('gathering-opening-spread')).toBeTruthy();
        });

        it('handles single approach choice', () => {
            const vmWithSingleChoice: GatheringViewModel = {
                ...mockGatheringVm,
                approachChoices: [mockGatheringVm.approachChoices[0]], // Only glean
            };

            const { getByTestId, queryByTestId } = render(
                <ApproachSelect vm={vmWithSingleChoice} onPick={mockOnPick} />
            );

            expect(getByTestId('gathering-approach-glean')).toBeTruthy();
            expect(queryByTestId('gathering-approach-strip')).toBeNull();
        });

        it('handles long scenario text without breaking layout', () => {
            const vmWithLongScenario: GatheringViewModel = {
                ...mockGatheringVm,
                scenario: 'A very long scenario description that goes on and on and should still render properly without breaking the component layout or causing any accessibility issues for screen readers and other assistive technologies.',
            };

            const { getByText, getByTestId } = render(
                <ApproachSelect vm={vmWithLongScenario} onPick={mockOnPick} />
            );

            expect(getByTestId('gathering-approach-select')).toBeTruthy();
            expect(getByText(/A very long scenario description/)).toBeTruthy();
        });
    });
});