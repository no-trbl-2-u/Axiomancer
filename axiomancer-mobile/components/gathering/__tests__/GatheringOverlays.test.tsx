/**
 * Hermetic component tests — GatheringOverlays surface.
 *
 * Covers the three gathering-minigame overlays that live in
 * GatheringOverlays.tsx: the reprisal flash (the site answers a
 * crossing), the Communion/Laden/Despoiled/Routed outcome screen, and
 * the tap-to-read plot detail with keyword call-outs + TAKE/TEND.
 *
 * Each overlay is a pure presentational component fed a view-model and
 * a callback; tests pin the rendered copy, the variant branches
 * (eruption / veiled / each outcome tier), and the press wiring.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import {
    GatheringOutcomeOverlay,
    PlotDetailOverlay,
    ReprisalOverlay,
} from '@/components/gathering/GatheringOverlays';
import type {
    GatherOutcomeVM,
    GatherPlotVM,
    GatherReprisalFlashVM,
} from '@/state/presenters/gathering.engine';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseFlash: GatherReprisalFlashVM = {
    kind: 'thorns',
    name: 'The Briar Wakes',
    desc: 'Thorns close around the crossing.',
    detail: '-3 VITAE',
    eruption: false,
    veiled: false,
};

const eruptionFlash: GatherReprisalFlashVM = {
    ...baseFlash,
    name: 'The Meter Bursts',
    desc: 'The site overflows with wrath.',
    detail: '2 BLOOM pieces spoil',
    eruption: true,
    veiled: false,
};

const veiledFlash: GatherReprisalFlashVM = {
    ...baseFlash,
    name: 'A Quiet Crossing',
    desc: 'The line holds, barely.',
    detail: null,
    eruption: false,
    veiled: true,
};

const communionOutcome: GatherOutcomeVM = {
    tier: 'communion',
    word: 'COMMUNION',
    sub: 'the site is at peace',
    line: 'You took only what was offered.',
    ctaLabel: 'CARRY ON',
};

const ladenOutcome: GatherOutcomeVM = {
    tier: 'laden',
    word: 'LADEN',
    sub: 'your satchel is full',
    line: 'A fair harvest, fairly won.',
    ctaLabel: 'CARRY ON',
};

const despoiledOutcome: GatherOutcomeVM = {
    tier: 'despoiled',
    word: 'DESPOILED',
    sub: 'the site remembers',
    line: 'You took more than your share.',
    ctaLabel: 'CARRY ON',
};

const routedOutcome: GatherOutcomeVM = {
    tier: 'routed',
    word: 'ROUTED',
    sub: 'the site casts you out',
    line: 'The watcher woke, and you fled.',
    ctaLabel: 'FLEE',
};

const plot: GatherPlotVM = {
    uid: 'plot-1',
    plotId: 'mire-mint',
    name: 'Mire-Mint Crown',
    family: 'bloom',
    familyLabel: 'BLOOM',
    trait: 'gift',
    traitLabel: 'GIFT',
    yieldRichness: 3,
    wrathCost: 2,
    isBreath: false,
    flavor: 'A crown of pale leaves.',
    keywords: [
        { id: 'gift', name: 'Gift', desc: 'No wrath cost if taken first.' },
        { id: 'set', name: 'Set', desc: 'Collect 5 richness for refinement.' },
    ],
    accessibilityLabel: 'Mire-Mint Crown, BLOOM plot: gift trait, yields 3, costs 2 wrath',
};

const breathPlot: GatherPlotVM = {
    ...plot,
    uid: 'plot-breath',
    plotId: 'calm-breath',
    name: 'Calm Breath',
    family: 'bone',
    familyLabel: 'BONE',
    trait: 'breath',
    traitLabel: 'BREATH',
    yieldRichness: 0,
    wrathCost: -3,
    isBreath: true,
    keywords: [{ id: 'breath', name: 'Breath', desc: 'Soothes the site instead of taking.' }],
};

// ---------------------------------------------------------------------------
// ReprisalOverlay
// ---------------------------------------------------------------------------

describe('ReprisalOverlay', () => {
    it('renders the name and description', () => {
        const { getByText } = render(<ReprisalOverlay flash={baseFlash} onDone={() => {}} />);
        expect(getByText('The Briar Wakes')).toBeTruthy();
        expect(getByText('Thorns close around the crossing.')).toBeTruthy();
    });

    it('uses the default eyebrow when neither eruption nor veiled', () => {
        const { getByText } = render(<ReprisalOverlay flash={baseFlash} onDone={() => {}} />);
        expect(getByText('THE SITE ANSWERS')).toBeTruthy();
    });

    it('uses the eruption eyebrow when eruption is true', () => {
        const { getByText } = render(<ReprisalOverlay flash={eruptionFlash} onDone={() => {}} />);
        expect(getByText('THE METER FILLS')).toBeTruthy();
    });

    it('uses the veiled eyebrow when veiled is true', () => {
        const { getByText } = render(<ReprisalOverlay flash={veiledFlash} onDone={() => {}} />);
        expect(getByText('A LINE WAS CROSSED')).toBeTruthy();
    });

    it('renders the detail call-out when detail is present', () => {
        const { getByText } = render(<ReprisalOverlay flash={baseFlash} onDone={() => {}} />);
        expect(getByText('-3 VITAE')).toBeTruthy();
    });

    it('omits the detail call-out when detail is null', () => {
        const { queryByText } = render(<ReprisalOverlay flash={veiledFlash} onDone={() => {}} />);
        expect(queryByText('-3 VITAE')).toBeNull();
    });

    it('shows the tap-to-continue hint', () => {
        const { getByText } = render(<ReprisalOverlay flash={baseFlash} onDone={() => {}} />);
        expect(getByText('TAP TO CONTINUE')).toBeTruthy();
    });

    it('fires onDone when the overlay is pressed', () => {
        const onDone = jest.fn();
        const { getByTestId } = render(<ReprisalOverlay flash={baseFlash} onDone={onDone} />);
        fireEvent.press(getByTestId('gathering-reprisal'));
        expect(onDone).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// GatheringOutcomeOverlay
// ---------------------------------------------------------------------------

describe('GatheringOutcomeOverlay', () => {
    it('renders the outcome word, sub, and line', () => {
        const { getByText } = render(
            <GatheringOutcomeOverlay outcome={communionOutcome} onContinue={() => {}} />,
        );
        expect(getByText('COMMUNION')).toBeTruthy();
        expect(getByText('the site is at peace')).toBeTruthy();
        expect(getByText('“You took only what was offered.”')).toBeTruthy();
    });

    it('renders each outcome tier word', () => {
        const tiers: GatherOutcomeVM[] = [
            communionOutcome,
            ladenOutcome,
            despoiledOutcome,
            routedOutcome,
        ];
        tiers.forEach((outcome) => {
            const { getByText } = render(
                <GatheringOutcomeOverlay outcome={outcome} onContinue={() => {}} />,
            );
            expect(getByText(outcome.word)).toBeTruthy();
        });
    });

    it('renders the continue CTA label', () => {
        const { getByText } = render(
            <GatheringOutcomeOverlay outcome={routedOutcome} onContinue={() => {}} />,
        );
        expect(getByText('FLEE')).toBeTruthy();
    });

    it('fires onContinue when the CTA is pressed', () => {
        const onContinue = jest.fn();
        const { getByTestId } = render(
            <GatheringOutcomeOverlay outcome={ladenOutcome} onContinue={onContinue} />,
        );
        fireEvent.press(getByTestId('gathering-outcome-continue'));
        expect(onContinue).toHaveBeenCalledTimes(1);
    });

    it('exposes the outcome root testID', () => {
        const { getByTestId } = render(
            <GatheringOutcomeOverlay outcome={communionOutcome} onContinue={() => {}} />,
        );
        expect(getByTestId('gathering-outcome')).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// PlotDetailOverlay
// ---------------------------------------------------------------------------

describe('PlotDetailOverlay', () => {
    it('renders each keyword name and description', () => {
        const { getByText } = render(
            <PlotDetailOverlay plot={plot} onTake={() => {}} onClose={() => {}} />,
        );
        expect(getByText('Gift')).toBeTruthy();
        expect(getByText('No wrath cost if taken first.')).toBeTruthy();
        expect(getByText('Set')).toBeTruthy();
    });

    it('labels every keyword block with the KEYWORD tag', () => {
        const { getAllByText } = render(
            <PlotDetailOverlay plot={plot} onTake={() => {}} onClose={() => {}} />,
        );
        expect(getAllByText('KEYWORD')).toHaveLength(plot.keywords.length);
    });

    it('renders the embedded plot card via the plot name', () => {
        const { getByText } = render(
            <PlotDetailOverlay plot={plot} onTake={() => {}} onClose={() => {}} />,
        );
        expect(getByText('Mire-Mint Crown')).toBeTruthy();
    });

    it('shows the TAKE label for non-breath plots', () => {
        const { getByText } = render(
            <PlotDetailOverlay plot={plot} onTake={() => {}} onClose={() => {}} />,
        );
        expect(getByText('TAKE IT ›')).toBeTruthy();
    });

    it('shows the TEND label for breath plots', () => {
        const { getByText } = render(
            <PlotDetailOverlay plot={breathPlot} onTake={() => {}} onClose={() => {}} />,
        );
        expect(getByText('TEND IT ›')).toBeTruthy();
    });

    it('uses a Take accessibility label for non-breath plots', () => {
        const { getByLabelText } = render(
            <PlotDetailOverlay plot={plot} onTake={() => {}} onClose={() => {}} />,
        );
        expect(getByLabelText('Take Mire-Mint Crown')).toBeTruthy();
    });

    it('uses a Tend accessibility label for breath plots', () => {
        const { getByLabelText } = render(
            <PlotDetailOverlay plot={breathPlot} onTake={() => {}} onClose={() => {}} />,
        );
        expect(getByLabelText('Tend Calm Breath')).toBeTruthy();
    });

    it('fires onTake with the plot uid when TAKE is pressed', () => {
        const onTake = jest.fn();
        const { getByTestId } = render(
            <PlotDetailOverlay plot={plot} onTake={onTake} onClose={() => {}} />,
        );
        fireEvent.press(getByTestId('gathering-detail-take'));
        expect(onTake).toHaveBeenCalledWith('plot-1');
    });

    it('fires onClose when the backdrop is pressed', () => {
        const onClose = jest.fn();
        const { getByTestId } = render(
            <PlotDetailOverlay plot={plot} onTake={() => {}} onClose={onClose} />,
        );
        fireEvent.press(getByTestId('gathering-plot-detail'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows the tap-to-close hint', () => {
        const { getByText } = render(
            <PlotDetailOverlay plot={plot} onTake={() => {}} onClose={() => {}} />,
        );
        expect(getByText('TAP ANYWHERE ELSE TO CLOSE')).toBeTruthy();
    });
});
