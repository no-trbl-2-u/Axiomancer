/**
 * Hermetic component tests — SatchelTray surface ("THE SATCHEL").
 *
 * The four family stacks under the gathering site, showing set-progress —
 * everything in the tray is "at risk" until the player withdraws. Covers
 * the THE SATCHEL header copy (empty-and-safe vs at-risk subline), each
 * FamilyStack's composed accessibility label, the SET-badge vs
 * richness/threshold progress-text branch, and that an empty stack still
 * renders its zero count.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { SatchelTray } from '@/components/gathering/SatchelTray';
import type { GatherSatchelFamilyVM } from '@/state/presenters/gathering.engine';

const baseFamilies: GatherSatchelFamilyVM[] = [
    { family: 'bloom', label: 'BLOOM', pieces: 3, richness: 5, setThreshold: 5, set: true },
    { family: 'resin', label: 'RESIN', pieces: 0, richness: 0, setThreshold: 5, set: false },
    { family: 'vein', label: 'VEIN', pieces: 1, richness: 2, setThreshold: 5, set: false },
    { family: 'bone', label: 'BONE', pieces: 0, richness: 0, setThreshold: 5, set: false },
];

describe('SatchelTray', () => {
    describe('mount contract', () => {
        it('renders the tray root and THE SATCHEL header', () => {
            const { getByTestId, getByText } = render(
                <SatchelTray families={baseFamilies} count={4} richness={7} />,
            );
            expect(getByTestId('gathering-satchel')).toBeTruthy();
            expect(getByText('THE SATCHEL')).toBeTruthy();
        });
    });

    describe('header subline', () => {
        it('shows the empty-and-safe note when the satchel holds nothing', () => {
            const empty = baseFamilies.map((f) => ({
                ...f,
                pieces: 0,
                richness: 0,
                set: false,
            }));
            const { getByText } = render(
                <SatchelTray families={empty} count={0} richness={0} />,
            );
            expect(getByText('empty — and safe that way')).toBeTruthy();
        });

        it('shows the at-risk tally when the satchel holds pieces', () => {
            const { getByText } = render(
                <SatchelTray families={baseFamilies} count={4} richness={7} />,
            );
            expect(
                getByText('4 pieces · 7 richness · at risk until you leave'),
            ).toBeTruthy();
        });
    });

    describe('family stacks', () => {
        it('renders every family label and its piece count', () => {
            const { getByText, getAllByText } = render(
                <SatchelTray families={baseFamilies} count={4} richness={7} />,
            );
            expect(getByText('BLOOM')).toBeTruthy();
            expect(getByText('RESIN')).toBeTruthy();
            expect(getByText('VEIN')).toBeTruthy();
            expect(getByText('BONE')).toBeTruthy();
            // resin and bone both hold zero pieces.
            expect(getAllByText('0')).toHaveLength(2);
            expect(getByText('3')).toBeTruthy();
            expect(getByText('1')).toBeTruthy();
        });

        it('shows the SET badge for a completed family', () => {
            const { getByText } = render(
                <SatchelTray families={baseFamilies} count={4} richness={7} />,
            );
            expect(getByText('SET')).toBeTruthy();
        });

        it('shows richness/threshold progress text for an unset family', () => {
            const { getByText, getAllByText } = render(
                <SatchelTray families={baseFamilies} count={4} richness={7} />,
            );
            // vein: richness 2 of 5.
            expect(getByText('2/5')).toBeTruthy();
            // resin / bone: 0 of 5 (two stacks).
            expect(getAllByText('0/5')).toHaveLength(2);
        });
    });

    describe('accessibility labels', () => {
        it('reports a completed family as set complete', () => {
            const { getByLabelText } = render(
                <SatchelTray families={baseFamilies} count={4} richness={7} />,
            );
            expect(
                getByLabelText('BLOOM: 3 pieces, richness 5 of 5, set complete'),
            ).toBeTruthy();
        });

        it('reports an in-progress family without the set-complete suffix', () => {
            const { getByLabelText } = render(
                <SatchelTray families={baseFamilies} count={4} richness={7} />,
            );
            expect(getByLabelText('VEIN: 1 pieces, richness 2 of 5')).toBeTruthy();
        });

        it('reports an empty family with zero pieces and richness', () => {
            const { getByLabelText } = render(
                <SatchelTray families={baseFamilies} count={4} richness={7} />,
            );
            expect(getByLabelText('RESIN: 0 pieces, richness 0 of 5')).toBeTruthy();
        });
    });
});
