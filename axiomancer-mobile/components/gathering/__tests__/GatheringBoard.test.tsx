/**
 * Hermetic component tests — GatheringBoard surface.
 *
 * Pins the main gathering gameplay board: plot display, interaction callbacks,
 * depth progression, wrath meter integration, offerings/tools, satchel display.
 * Tests the core gathering session interface that handles resource collection mechanics.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { GatheringBoard } from '@/components/gathering/GatheringBoard';
import type { GatheringViewModel } from '@/state/presenters/gathering.engine';

const mockGatheringVm: GatheringViewModel = {
    active: true,
    phase: 'foraging',
    siteId: 'ruined-hearth',
    sessionSeed: 12345,
    title: 'Ruined Hearth-gardens',
    scenario: 'Cultivated earth, the terraced plots now overgrown with invasive bramble.',
    intro: 'The hearth-gardens lie in ruin.',
    boardHeadline: 'SHALLOW EARTH',
    boardNote: 'Take what you can before dusk falls',
    approachKey: 'glean',
    approachLabel: 'GLEAN',
    approachChoices: [],
    depthIndex: 0,
    depthCount: 3,
    depthName: 'SHALLOW EARTH',
    depthNames: ['SHALLOW EARTH', 'MIDDLE EARTH', 'DEEP EARTH'],
    canDescend: true,
    bagCount: 4,
    turn: 2,
    duskNote: null,
    grace: 0,
    graceNote: null,
    satchelCount: 2,
    satchelRichness: 15,
    satchelFamilies: [
        { family: 'bloom', label: 'BLOOM', pieces: 1, richness: 5, setThreshold: 5, set: false },
        { family: 'vein', label: 'VEIN', pieces: 1, richness: 10, setThreshold: 5, set: false },
    ],
    offerings: [
        {
            id: 'offering-1',
            name: 'Soil Blessing',
            demandLabel: '2 BLOOM',
            paid: false,
            payable: true,
            flavor: 'The earth responds to kindness',
        },
    ],
    tools: [
        {
            id: 'sickle',
            name: 'Iron Sickle',
            desc: 'Clean cuts, no waste',
            used: false,
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
        value: 3, 
        max: 10, 
        thresholds: [{ at: 7, fired: false }], 
        ratio: 0.3, 
        duskFallen: false, 
        watcherWoken: false, 
        mired: false, 
        sickled: false 
    },
    boons: [],
    withdrawEnabled: true,
    withdrawLabel: 'WITHDRAW',
    withdrawSubLabel: 'RETURN TO MAP',
    reprisalFlash: null,
    outcome: null,
    spoils: null,
};

const mockCallbacks = {
    onHarvest: jest.fn(),
    onInspect: jest.fn(),
    onDescend: jest.fn(),
    onPayOffering: jest.fn(),
    onUseTool: jest.fn(),
    onWithdraw: jest.fn(),
};

describe('GatheringBoard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('mount contract', () => {
        it('renders without crashing', () => {
            const { getByTestId } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            expect(getByTestId('gathering-board')).toBeTruthy();
        });

        it('displays the gathering header with correct information', () => {
            const { getByText } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            expect(getByText('❧ GATHERING')).toBeTruthy();
            expect(getByText('GLEAN')).toBeTruthy();
            expect(getByText('TAKINGS 2')).toBeTruthy();
        });

        it('displays the board headline and note', () => {
            const { getByText } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            expect(getByText('SHALLOW EARTH')).toBeTruthy();
            expect(getByText('— Take what you can before dusk falls')).toBeTruthy();
        });

        it('shows depth progression ribbon', () => {
            const { getByText } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            expect(getByText(/◆ SHALLOW EARTH/)).toBeTruthy();
            expect(getByText(/· MIDDLE EARTH/)).toBeTruthy();
            expect(getByText(/· DEEP EARTH/)).toBeTruthy();
        });
    });

    describe('spread rendering', () => {
        it('renders all plots in the spread', () => {
            const { getByTestId } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            expect(getByTestId('gathering-spread')).toBeTruthy();
            expect(getByTestId('gathering-plot-plot-1')).toBeTruthy();
            expect(getByTestId('gathering-plot-plot-2')).toBeTruthy();
            expect(getByTestId('gathering-plot-plot-3')).toBeTruthy();
        });

        it('shows take buttons for each plot', () => {
            const { getByTestId } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            expect(getByTestId('gathering-take-plot-1')).toBeTruthy();
            expect(getByTestId('gathering-take-plot-2')).toBeTruthy();
            expect(getByTestId('gathering-take-plot-3')).toBeTruthy();
        });

        it('displays TEND button for breath plots and TAKE for others', () => {
            const { getAllByText } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            // Should have TAKE buttons (multiple for non-breath plots)
            const takeButtons = getAllByText('TAKE');
            expect(takeButtons.length).toBeGreaterThan(0);
            
            // Should have TEND button for breath plot
            const tendButtons = getAllByText('TEND');
            expect(tendButtons.length).toBeGreaterThan(0);
        });

        it('handles empty spread gracefully', () => {
            const vmWithEmptySpread: GatheringViewModel = {
                ...mockGatheringVm,
                spread: [],
            };

            const { getByText, getByTestId } = render(
                <GatheringBoard vm={vmWithEmptySpread} {...mockCallbacks} />
            );

            expect(getByTestId('gathering-board')).toBeTruthy();
            expect(getByText('nothing left on offer — descend, or take your leave')).toBeTruthy();
        });
    });

    describe('boons display', () => {
        it('renders boons row (empty by default)', () => {
            const { getByTestId } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            // The component should render without crashing even with empty boons
            expect(getByTestId('gathering-board')).toBeTruthy();
        });
    });

    describe('offerings and tools', () => {
        it('renders offerings section with payment options', () => {
            const { getByText, getByTestId } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            expect(getByText('OFFERINGS')).toBeTruthy();
            expect(getByText('Soil Blessing')).toBeTruthy();
            expect(getByTestId('gathering-offering-offering-1')).toBeTruthy();
        });

        it('renders tools section with usage options', () => {
            const { getByText, getByTestId } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            expect(getByText('FIELD TOOLS')).toBeTruthy();
            expect(getByText('Iron Sickle')).toBeTruthy();
            expect(getByText('Clean cuts, no waste')).toBeTruthy();
            expect(getByTestId('gathering-tool-sickle')).toBeTruthy();
        });
    });

    describe('action buttons', () => {
        it('displays descend and withdraw buttons', () => {
            const { getByTestId, getByText } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            expect(getByTestId('gathering-descend')).toBeTruthy();
            expect(getByTestId('gathering-withdraw')).toBeTruthy();
            expect(getByText('DESCEND ▾')).toBeTruthy();
            expect(getByText('WITHDRAW ›')).toBeTruthy();
        });

        it('handles disabled descend state', () => {
            const vmCannotDescend: GatheringViewModel = {
                ...mockGatheringVm,
                canDescend: false,
            };

            const { getByTestId, getByText } = render(
                <GatheringBoard vm={vmCannotDescend} {...mockCallbacks} />
            );

            const descendButton = getByTestId('gathering-descend');
            expect(descendButton.props.accessibilityState.disabled).toBe(true);
            expect(getByText('NO DEEPER')).toBeTruthy();
        });
    });

    describe('interaction callbacks', () => {
        it('calls onHarvest when take button is pressed', () => {
            const { getByTestId } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            fireEvent.press(getByTestId('gathering-take-plot-1'));

            expect(mockCallbacks.onHarvest).toHaveBeenCalledTimes(1);
            expect(mockCallbacks.onHarvest).toHaveBeenCalledWith('plot-1');
        });

        it('calls onInspect when plot card is pressed', () => {
            const { getByTestId } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            fireEvent.press(getByTestId('gathering-plot-plot-1'));

            expect(mockCallbacks.onInspect).toHaveBeenCalledTimes(1);
            expect(mockCallbacks.onInspect).toHaveBeenCalledWith(mockGatheringVm.spread[0]);
        });

        it('calls onPayOffering when offering is pressed', () => {
            const { getByTestId } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            fireEvent.press(getByTestId('gathering-offering-offering-1'));

            expect(mockCallbacks.onPayOffering).toHaveBeenCalledTimes(1);
            expect(mockCallbacks.onPayOffering).toHaveBeenCalledWith('offering-1');
        });

        it('calls onUseTool when tool is pressed', () => {
            const { getByTestId } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            fireEvent.press(getByTestId('gathering-tool-sickle'));

            expect(mockCallbacks.onUseTool).toHaveBeenCalledTimes(1);
            expect(mockCallbacks.onUseTool).toHaveBeenCalledWith('sickle');
        });

        it('calls onDescend when descend button is pressed', () => {
            const { getByTestId } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            fireEvent.press(getByTestId('gathering-descend'));

            expect(mockCallbacks.onDescend).toHaveBeenCalledTimes(1);
        });

        it('calls onWithdraw when withdraw button is pressed', () => {
            const { getByTestId } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            fireEvent.press(getByTestId('gathering-withdraw'));

            expect(mockCallbacks.onWithdraw).toHaveBeenCalledTimes(1);
        });

        it('does not call callbacks when disabled elements are pressed', () => {
            const vmWithDisabledElements: GatheringViewModel = {
                ...mockGatheringVm,
                canDescend: false,
                withdrawEnabled: false,
                tools: [{ ...mockGatheringVm.tools[0], used: true }],
                offerings: [{ ...mockGatheringVm.offerings[0], paid: true }],
            };

            const { getByTestId } = render(
                <GatheringBoard vm={vmWithDisabledElements} {...mockCallbacks} />
            );

            fireEvent.press(getByTestId('gathering-descend'));
            fireEvent.press(getByTestId('gathering-withdraw'));
            fireEvent.press(getByTestId('gathering-tool-sickle'));
            fireEvent.press(getByTestId('gathering-offering-offering-1'));

            expect(mockCallbacks.onDescend).not.toHaveBeenCalled();
            expect(mockCallbacks.onWithdraw).not.toHaveBeenCalled();
            expect(mockCallbacks.onUseTool).not.toHaveBeenCalled();
            expect(mockCallbacks.onPayOffering).not.toHaveBeenCalled();
        });
    });

    describe('accessibility labels', () => {
        it('provides accessibility labels for interactive elements', () => {
            const { getByTestId } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            const plotButton = getByTestId('gathering-plot-plot-1');
            expect(plotButton.props.accessibilityRole).toBe('button');
            expect(plotButton.props.accessibilityLabel).toBe('Spectral Moss. BLOOM family. 2 richness yield. 1 wrath cost. Luminous keyword.');

            const takeButton = getByTestId('gathering-take-plot-1');
            expect(takeButton.props.accessibilityRole).toBe('button');
            expect(takeButton.props.accessibilityLabel).toBe('Take Spectral Moss');

            const tendButton = getByTestId('gathering-take-plot-3');
            expect(tendButton.props.accessibilityLabel).toBe('Tend Calm Breath');

            const offeringButton = getByTestId('gathering-offering-offering-1');
            expect(offeringButton.props.accessibilityRole).toBe('button');
            expect(offeringButton.props.accessibilityLabel).toBe('Soil Blessing, pay 2 BLOOM');

            const toolButton = getByTestId('gathering-tool-sickle');
            expect(toolButton.props.accessibilityRole).toBe('button');
            expect(toolButton.props.accessibilityLabel).toBe('Iron Sickle: Clean cuts, no waste');

            const descendButton = getByTestId('gathering-descend');
            expect(descendButton.props.accessibilityRole).toBe('button');
            expect(descendButton.props.accessibilityLabel).toBe('Descend to MIDDLE EARTH');

            const withdrawButton = getByTestId('gathering-withdraw');
            expect(withdrawButton.props.accessibilityRole).toBe('button');
            expect(withdrawButton.props.accessibilityLabel).toBe('Withdraw. RETURN TO MAP');
        });
    });

    describe('conditional display states', () => {
        it('shows bag count and depth information', () => {
            const { getByText } = render(
                <GatheringBoard vm={mockGatheringVm} {...mockCallbacks} />
            );

            expect(getByText('4 plots left in shallow earth')).toBeTruthy();
        });

        it('shows dusk note when present', () => {
            const vmWithDusk: GatheringViewModel = {
                ...mockGatheringVm,
                duskNote: 'The watcher stirs',
            };

            const { getByText } = render(
                <GatheringBoard vm={vmWithDusk} {...mockCallbacks} />
            );

            expect(getByText('The watcher stirs')).toBeTruthy();
        });

        it('handles zero bag count state', () => {
            const vmNoBag: GatheringViewModel = {
                ...mockGatheringVm,
                bagCount: 0,
            };

            const { getByText } = render(
                <GatheringBoard vm={vmNoBag} {...mockCallbacks} />
            );

            expect(getByText('shallow earth is picked clean')).toBeTruthy();
        });

        it('hides offerings and tools section when both are empty', () => {
            const vmNoAids: GatheringViewModel = {
                ...mockGatheringVm,
                offerings: [],
                tools: [],
            };

            const { queryByText } = render(
                <GatheringBoard vm={vmNoAids} {...mockCallbacks} />
            );

            expect(queryByText('OFFERINGS')).toBeNull();
            expect(queryByText('FIELD TOOLS')).toBeNull();
        });
    });
});