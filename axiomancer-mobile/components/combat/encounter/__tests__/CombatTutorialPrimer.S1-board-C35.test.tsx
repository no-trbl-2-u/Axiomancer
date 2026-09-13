/**
 * CombatTutorialPrimer — fresh-eyes shard S1-board, cluster C35.
 *
 * Panel 1 taught 'the Surge meter' among the things competing to wear VITAE
 * down, and the live board draws no such meter: the primer promised a readout
 * the player then hunted for and never found. The primer may name only things
 * the board actually displays.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { CombatTutorialPrimer } from '@/components/combat/encounter/CombatTutorialPrimer';

/** Pages through every primer panel, returning each panel's serialised tree. */
function sweepPanels(): string[] {
    const { queryByTestId, toJSON } = render(
        <CombatTutorialPrimer onBegin={() => {}} onSkip={() => {}} />,
    );
    const seen: string[] = [];
    for (let guard = 0; guard < 10; guard++) {
        seen.push(JSON.stringify(toJSON()));
        const next = queryByTestId('combat-primer-next');
        if (!next) break;
        fireEvent.press(next);
    }
    return seen;
}

describe('S1-board-C35 — the primer names no meter the board never draws', () => {
    it('never promises a Surge meter', () => {
        for (const panel of sweepPanels()) {
            expect(panel).not.toMatch(/surge/i);
        }
    });

    it('still names the board readouts it always named', () => {
        const all = sweepPanels().join('\n');
        // The chip the board actually draws in this slot, plus the canon terms.
        expect(all).toMatch(/MOMENTUM/);
        expect(all).toMatch(/VITAE/);
        expect(all).toMatch(/Conviction/);
    });
});
