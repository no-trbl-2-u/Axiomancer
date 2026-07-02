/**
 * Hermetic component tests — SpoilsOverlay surface ("THE WEIGHING").
 *
 * The gathering-minigame spoils ledger shown after the outcome screen.
 * Covers kept stacks vs the empty-site note, the four-family totals with
 * SET badges, set refinements, the round-harvest line, the coin/vitae/
 * scar/boon ledger, boon done/failed verdicts, the confirm-label swap,
 * and that pressing confirm fires onConfirm exactly once.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { SpoilsOverlay } from '@/components/gathering/SpoilsOverlay';
import type { GatherSpoilsVM } from '@/state/presenters/gathering.engine';

const baseSpoils: GatherSpoilsVM = {
    tier: 'laden',
    keptStacks: [
        { plotId: 'p1', name: 'Mire-Mint Crown', family: 'bloom', quantity: 3 },
        { plotId: 'p2', name: 'Iron Root', family: 'vein', quantity: 1 },
    ],
    lostCount: 0,
    familyTotals: [
        { family: 'bloom', label: 'BLOOM', pieces: 3, richness: 5, setThreshold: 5, set: true },
        { family: 'resin', label: 'RESIN', pieces: 0, richness: 0, setThreshold: 5, set: false },
        { family: 'vein', label: 'VEIN', pieces: 1, richness: 2, setThreshold: 5, set: false },
        { family: 'bone', label: 'BONE', pieces: 0, richness: 0, setThreshold: 5, set: false },
    ],
    refinements: [{ family: 'bloom', name: 'SAINT-WAX SEAL', desc: 'a treasure refined from the bloom' }],
    roundHarvest: false,
    coinNotes: ['+8 shillings — SAINT-WAX SEAL refined'],
    vitaeNotes: ['+5 VITAE — the site’s blessing'],
    scarNote: null,
    boons: [],
    boonNote: null,
    confirmLabel: 'BIND THE SATCHEL ›',
};

describe('SpoilsOverlay', () => {
    describe('mount contract', () => {
        it('renders the weighing header and confirm', () => {
            const { getByTestId, getByText } = render(
                <SpoilsOverlay spoils={baseSpoils} onConfirm={jest.fn()} />,
            );
            expect(getByTestId('gathering-spoils')).toBeTruthy();
            expect(getByText('❧ THE WEIGHING')).toBeTruthy();
            expect(getByTestId('gathering-spoils-confirm')).toBeTruthy();
        });
    });

    describe('kept stacks', () => {
        it('lists each kept stack with name and quantity', () => {
            const { getByText } = render(<SpoilsOverlay spoils={baseSpoils} onConfirm={jest.fn()} />);
            expect(getByText('Mire-Mint Crown')).toBeTruthy();
            expect(getByText('×3')).toBeTruthy();
            expect(getByText('Iron Root')).toBeTruthy();
            expect(getByText('×1')).toBeTruthy();
        });

        it('shows the carried-out label without a lost suffix when nothing was lost', () => {
            const { getByText, queryByText } = render(
                <SpoilsOverlay spoils={baseSpoils} onConfirm={jest.fn()} />,
            );
            expect(getByText('CARRIED OUT')).toBeTruthy();
            expect(queryByText(/LOST TO THE SITE/)).toBeNull();
        });

        it('appends a lost-count suffix when pieces were left behind', () => {
            const { getByText } = render(
                <SpoilsOverlay spoils={{ ...baseSpoils, lostCount: 2 }} onConfirm={jest.fn()} />,
            );
            expect(getByText('CARRIED OUT  ·  2 LOST TO THE SITE')).toBeTruthy();
        });

        it('shows the empty-site note when no stacks were kept', () => {
            const { getByText, queryByText } = render(
                <SpoilsOverlay spoils={{ ...baseSpoils, keptStacks: [] }} onConfirm={jest.fn()} />,
            );
            expect(getByText('nothing — the place kept it all')).toBeTruthy();
            expect(queryByText('Mire-Mint Crown')).toBeNull();
        });
    });

    describe('four families', () => {
        it('renders the family section and richness ratios', () => {
            const { getByText } = render(<SpoilsOverlay spoils={baseSpoils} onConfirm={jest.fn()} />);
            expect(getByText('THE FOUR FAMILIES')).toBeTruthy();
            expect(getByText('5/5')).toBeTruthy();
            expect(getByText('2/5')).toBeTruthy();
        });

        it('renders a SET badge only for set families', () => {
            const { getAllByText } = render(<SpoilsOverlay spoils={baseSpoils} onConfirm={jest.fn()} />);
            // bloom is the only set family in baseSpoils
            expect(getAllByText('SET')).toHaveLength(1);
        });

        it('renders no SET badge when no family is set', () => {
            const noSet = baseSpoils.familyTotals.map((f) => ({ ...f, set: false }));
            const { queryByText } = render(
                <SpoilsOverlay spoils={{ ...baseSpoils, familyTotals: noSet }} onConfirm={jest.fn()} />,
            );
            expect(queryByText('SET')).toBeNull();
        });
    });

    describe('refinements + round harvest', () => {
        it('renders each refinement name and description', () => {
            const { getByText } = render(<SpoilsOverlay spoils={baseSpoils} onConfirm={jest.fn()} />);
            expect(getByText('✦ SAINT-WAX SEAL')).toBeTruthy();
            expect(getByText('a treasure refined from the bloom')).toBeTruthy();
        });

        it('hides the round-harvest line by default', () => {
            const { queryByText } = render(<SpoilsOverlay spoils={baseSpoils} onConfirm={jest.fn()} />);
            expect(queryByText(/THE ROUND HARVEST/)).toBeNull();
        });

        it('shows the round-harvest line when all four families are carried whole', () => {
            const { getByText } = render(
                <SpoilsOverlay spoils={{ ...baseSpoils, roundHarvest: true }} onConfirm={jest.fn()} />,
            );
            expect(getByText('❧ THE ROUND HARVEST — all four families, carried whole')).toBeTruthy();
        });
    });

    describe('ledger notes', () => {
        it('renders coin and vitae notes', () => {
            const { getByText } = render(<SpoilsOverlay spoils={baseSpoils} onConfirm={jest.fn()} />);
            expect(getByText('+8 shillings — SAINT-WAX SEAL refined')).toBeTruthy();
            expect(getByText('+5 VITAE — the site’s blessing')).toBeTruthy();
        });

        it('renders the scar note when the despoiler is marked', () => {
            const scar = '☠ THE DESPOILER’S SCAR — the wild remembers your hand';
            const { getByText } = render(
                <SpoilsOverlay spoils={{ ...baseSpoils, scarNote: scar }} onConfirm={jest.fn()} />,
            );
            expect(getByText(scar)).toBeTruthy();
        });

        it('renders a boon note when present', () => {
            const { getByText } = render(
                <SpoilsOverlay
                    spoils={{ ...baseSpoils, boonNote: '2 kept · 1 broken — boons' }}
                    onConfirm={jest.fn()}
                />,
            );
            expect(getByText('2 kept · 1 broken — boons')).toBeTruthy();
        });

        it('omits the ledger block entirely when there are no notes', () => {
            const { queryByText } = render(
                <SpoilsOverlay
                    spoils={{
                        ...baseSpoils,
                        coinNotes: [],
                        vitaeNotes: [],
                        scarNote: null,
                        boonNote: null,
                    }}
                    onConfirm={jest.fn()}
                />,
            );
            expect(queryByText('+8 shillings — SAINT-WAX SEAL refined')).toBeNull();
        });
    });

    describe('boons', () => {
        it('renders fulfilled and broken boons with their verdict marks', () => {
            const { getByText } = render(
                <SpoilsOverlay
                    spoils={{
                        ...baseSpoils,
                        boons: [
                            { id: 'b1', name: 'GREENWARD PACT', desc: 'take three blooms', status: 'done', rewardLabel: '+6' },
                            { id: 'b2', name: 'STILL HAND', desc: 'shed no blood', status: 'failed', rewardLabel: '—' },
                        ],
                    }}
                    onConfirm={jest.fn()}
                />,
            );
            expect(getByText('BOONS')).toBeTruthy();
            expect(getByText('GREENWARD PACT')).toBeTruthy();
            expect(getByText('✓')).toBeTruthy();
            expect(getByText('STILL HAND')).toBeTruthy();
            expect(getByText('✕')).toBeTruthy();
        });

        it('hides the boons section when there are none', () => {
            const { queryByText } = render(<SpoilsOverlay spoils={baseSpoils} onConfirm={jest.fn()} />);
            expect(queryByText('BOONS')).toBeNull();
        });
    });

    describe('confirm', () => {
        it('renders the bind label and fires onConfirm when pressed', () => {
            const onConfirm = jest.fn();
            const { getByTestId, getByText } = render(
                <SpoilsOverlay spoils={baseSpoils} onConfirm={onConfirm} />,
            );
            expect(getByText('BIND THE SATCHEL ›')).toBeTruthy();
            fireEvent.press(getByTestId('gathering-spoils-confirm'));
            expect(onConfirm).toHaveBeenCalledTimes(1);
        });

        it('renders the walk-on label when nothing was kept', () => {
            const { getByText } = render(
                <SpoilsOverlay
                    spoils={{ ...baseSpoils, keptStacks: [], confirmLabel: 'WALK ON ›' }}
                    onConfirm={jest.fn()}
                />,
            );
            expect(getByText('WALK ON ›')).toBeTruthy();
        });

        it('exposes the confirm as an accessible button', () => {
            const { getByTestId } = render(<SpoilsOverlay spoils={baseSpoils} onConfirm={jest.fn()} />);
            expect(getByTestId('gathering-spoils-confirm').props.accessibilityRole).toBe('button');
        });
    });
});
