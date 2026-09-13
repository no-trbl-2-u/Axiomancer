/**
 * Hermetic screen test — the GRACE break legend must not cost the SELF sheet
 * a line (fresh-eyes `05-character-fresh / 06-character-midgame`, GRACE
 * footer).
 *
 * S3-sheet-C12 gave the arrears tic a key, but stacked that key as its own
 * block under the pool track. Measured against the before/after captures it
 * added exactly 12pt to the sheet at BOTH viewports (375x812 and 1280x800),
 * which pushed the GRACE balance caption — 'the pool above is this balance,
 * read in tenths.' — down onto the bottom tab bar, sliced through the
 * x-height and unreadable at rest.
 *
 * The repair keeps the key and moves it onto the pool label row, which is
 * already 13pt tall for the pool name, so it costs no height. These
 * assertions fail against the damaged version: there the legend is a sibling
 * of the track rather than a child of the header row, and it carries the
 * block margin that made it a line of its own.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { render, within } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import CharacterScreen from '@/app/(tabs)/character';
import { graceBreakLegend } from '@/state/presenters/character.engine';
import { withAllProviders } from '@/test-utils/withAllProviders';

// Hoisted above the imports by babel-plugin-jest-hoist: the SELF sheet pulls
// in the router for its deck link.
jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
        push: jest.fn(),
        back: jest.fn(),
        canGoBack: () => false,
    }),
}));

/**
 * Mount the SELF sheet in the canonical provider stack.
 *
 * Purpose: one place for the render so each assertion below reads as a claim
 * about the sheet rather than as scaffolding.
 * Inputs: none.
 * Outputs: the `@testing-library/react-native` render result.
 * Resolves: `05-character-fresh / 06-character-midgame (/character, GRACE
 * footer)`.
 */
function renderSheet(): ReturnType<typeof render> {
    const { tree } = withAllProviders(<CharacterScreen />);
    return render(tree);
}

describe('GRACE break legend rides the pool label line (fresh-eyes GRACE footer)', () => {
    it('renders the legend inside the GRACE pool header row, not below the track', () => {
        const r = renderSheet();

        const header = r.getByTestId('self-pool-header-grace');
        // Stacked under the track the legend was a sibling of the header and
        // this lookup found nothing — which is the 12pt the sheet lost.
        const legend = within(header).getByTestId('self-grace-break-legend');

        expect(legend.props.children).toBe(graceBreakLegend(2));
    });

    it('lays that header row out horizontally, so the legend shares the label line', () => {
        const r = renderSheet();

        const header = StyleSheet.flatten(r.getByTestId('self-pool-header-grace').props.style);

        expect(header.flexDirection).toBe('row');
    });

    it('gives the legend no block margin and clamps it to one line', () => {
        const r = renderSheet();

        const legend = r.getByTestId('self-grace-break-legend');
        const style = StyleSheet.flatten(legend.props.style);

        // `marginTop: 2` is what made it a line of its own.
        expect(style.marginTop).toBeUndefined();
        expect(style.marginBottom).toBeUndefined();
        // A wrap would grow the row and put the 12pt straight back.
        expect(legend.props.numberOfLines).toBe(1);
    });

    it('leaves VITAE — which carries no arrears tic — without a legend', () => {
        const r = renderSheet();

        const header = r.getByTestId('self-pool-header-vitae');

        expect(within(header).queryByTestId('self-grace-break-legend')).toBeNull();
    });
});
