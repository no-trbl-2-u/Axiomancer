/**
 * CombatTutorialPrimer — the primer may name only things the board actually
 * displays. The live board draws no Surge meter, so the primer never promises
 * one. It names neither MOMENTUM nor POISON either: no grey card feeds the
 * chain, and nothing applies Poison.
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

    it('names no system a grey deck cannot reach', () => {
        const all = sweepPanels().join('\n');
        expect(all).not.toMatch(/MOMENTUM/);
        expect(all).not.toMatch(/POISON/);
    });

    it('still names the canon terms', () => {
        const all = sweepPanels().join('\n');
        expect(all).toMatch(/VITAE/);
        expect(all).toMatch(/Conviction/);
    });
});
