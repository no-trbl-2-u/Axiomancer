/**
 * Hermetic component tests — WrathMeter surface (gathering WRATH bar).
 *
 * The segmented WRATH meter under the gathering site's opening eye. Covers
 * the pure segmentColor threshold helper (unfilled / 0 / 1 / 2+ threshold
 * bands), the WRATH value/max label, the dynamic vm.max-driven segment
 * count, the four conditional surcharge tags (sickled / mired / watcher /
 * dusk), the grace value + colouring, the grace-note row, and the
 * accessibility label's dusk suffix.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { WrathMeter, segmentColor } from '@/components/gathering/WrathMeter';
import type { GatherWrathVM } from '@/state/presenters/gathering.engine';
import type { Palette } from '@/theme/palette';

const AXM = { blood: '#e01f33' } as Palette;

const baseWrath: GatherWrathVM = {
    value: 3,
    max: 8,
    thresholds: [
        { at: 3, fired: false },
        { at: 6, fired: false },
    ],
    ratio: 3 / 8,
    duskFallen: false,
    watcherWoken: false,
    mired: false,
    sickled: false,
};

describe('segmentColor', () => {
    it('paints unfilled segments (index >= value) the dim wash', () => {
        // value 3 → indices 0,1,2 filled; index 3+ unfilled.
        expect(segmentColor(3, baseWrath, AXM)).toBe('rgba(0,0,0,0.45)');
        expect(segmentColor(7, baseWrath, AXM)).toBe('rgba(0,0,0,0.45)');
    });

    it('paints a filled segment below any threshold the base ember', () => {
        // index 0 → cell 1, below the first threshold at 3.
        expect(segmentColor(0, baseWrath, AXM)).toBe('#5a4a28');
    });

    it('paints a filled segment past one threshold the mid ember', () => {
        // A meter filled to 4 with a single threshold at 3: index 3 (cell 4)
        // has passed exactly one threshold.
        const vm: GatherWrathVM = {
            ...baseWrath,
            value: 5,
            thresholds: [{ at: 3, fired: true }],
        };
        expect(segmentColor(3, vm, AXM)).toBe('#8a3a1e');
    });

    it('paints a filled segment past two-or-more thresholds blood', () => {
        // index 6 (cell 7) has passed both thresholds at 3 and 6.
        const vm: GatherWrathVM = { ...baseWrath, value: 8 };
        expect(segmentColor(6, vm, AXM)).toBe(AXM.blood);
    });

    it('counts a threshold as passed when the cell equals its position', () => {
        // index 2 → cell 3 == threshold at 3 → one threshold passed.
        const vm: GatherWrathVM = {
            ...baseWrath,
            value: 8,
            thresholds: [{ at: 3, fired: false }],
        };
        expect(segmentColor(2, vm, AXM)).toBe('#8a3a1e');
    });
});

describe('WrathMeter', () => {
    describe('mount contract', () => {
        it('renders the meter root and WRATH value/max label', () => {
            const { getByTestId, getByText } = render(
                <WrathMeter vm={baseWrath} grace={0} graceNote={null} />,
            );
            expect(getByTestId('gathering-wrath')).toBeTruthy();
            expect(getByText('3')).toBeTruthy();
            expect(getByText('/ 8')).toBeTruthy();
        });

        it('reports value and dusk state through an accessibility label', () => {
            const { getByLabelText } = render(
                <WrathMeter vm={baseWrath} grace={0} graceNote={null} />,
            );
            expect(getByLabelText('Wrath 3 of 8')).toBeTruthy();
        });

        it('appends the dusk note to the accessibility label when dusk has fallen', () => {
            const { getByLabelText } = render(
                <WrathMeter
                    vm={{ ...baseWrath, duskFallen: true }}
                    grace={0}
                    graceNote={null}
                />,
            );
            expect(getByLabelText('Wrath 3 of 8, dusk has fallen')).toBeTruthy();
        });
    });

    describe('surcharge tags', () => {
        it('shows no status tags when the meter is calm', () => {
            const { queryByText } = render(
                <WrathMeter vm={baseWrath} grace={0} graceNote={null} />,
            );
            expect(queryByText('SICKLED — next taking free')).toBeNull();
            expect(queryByText('MIRED — next taking dearer')).toBeNull();
            expect(queryByText('THE WARDEN WATCHES')).toBeNull();
            expect(queryByText('DUSK')).toBeNull();
        });

        it('shows the sickled tag when sickled', () => {
            const { getByText } = render(
                <WrathMeter
                    vm={{ ...baseWrath, sickled: true }}
                    grace={0}
                    graceNote={null}
                />,
            );
            expect(getByText('SICKLED — next taking free')).toBeTruthy();
        });

        it('shows the mired tag when mired', () => {
            const { getByText } = render(
                <WrathMeter
                    vm={{ ...baseWrath, mired: true }}
                    grace={0}
                    graceNote={null}
                />,
            );
            expect(getByText('MIRED — next taking dearer')).toBeTruthy();
        });

        it('shows the watcher tag when the warden has woken', () => {
            const { getByText } = render(
                <WrathMeter
                    vm={{ ...baseWrath, watcherWoken: true }}
                    grace={0}
                    graceNote={null}
                />,
            );
            expect(getByText('THE WARDEN WATCHES')).toBeTruthy();
        });

        it('shows the dusk tag when dusk has fallen', () => {
            const { getByText } = render(
                <WrathMeter
                    vm={{ ...baseWrath, duskFallen: true }}
                    grace={0}
                    graceNote={null}
                />,
            );
            expect(getByText('DUSK')).toBeTruthy();
        });

        it('shows every active surcharge tag at once', () => {
            const { getByText } = render(
                <WrathMeter
                    vm={{
                        ...baseWrath,
                        sickled: true,
                        mired: true,
                        watcherWoken: true,
                        duskFallen: true,
                    }}
                    grace={0}
                    graceNote={null}
                />,
            );
            expect(getByText('SICKLED — next taking free')).toBeTruthy();
            expect(getByText('MIRED — next taking dearer')).toBeTruthy();
            expect(getByText('THE WARDEN WATCHES')).toBeTruthy();
            expect(getByText('DUSK')).toBeTruthy();
        });
    });

    describe('grace', () => {
        it('renders the grace value', () => {
            const { getByText } = render(
                <WrathMeter vm={baseWrath} grace={2} graceNote={null} />,
            );
            expect(getByText('2')).toBeTruthy();
        });

        it('renders the grace note when present', () => {
            const { getByText } = render(
                <WrathMeter vm={baseWrath} grace={1} graceNote="grace spent" />,
            );
            expect(getByText('grace spent')).toBeTruthy();
        });

        it('omits the tag row entirely when no tags and no grace note', () => {
            const { queryByText } = render(
                <WrathMeter vm={baseWrath} grace={0} graceNote={null} />,
            );
            expect(queryByText('grace spent')).toBeNull();
        });
    });
});
