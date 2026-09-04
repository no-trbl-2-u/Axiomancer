/**
 * Hermetic component test — the persistent combat log toggle (playtest fix
 * 2026-09-04).
 *
 * The playtest found combat has no persistent log: every beat is a floating
 * token that vanishes in ~1s, so the player cannot reconstruct what just
 * happened. This pins the panel wiring only (the line content itself is
 * covered by `state/presenters/__tests__/combat-log-history.engine.test.ts`):
 * the toggle is absent over the reveal, appears once the board is live,
 * opens the `combat-log` sheet, and the sheet's own close button dismisses it.
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { CombatEncounterPanel } from '@/components/combat/encounter/CombatEncounterPanel';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

const CARDS = ['spoiled-poultice', 'the-long-lent', 'chilblain-watch', 'thin-hymn'];

function mount() {
    const { tree, store } = withAllProviders(<></>);
    const base = store.getState().player!;
    const bootstrapPlayer = {
        ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 160, maxHealth: 160,
    };
    const enemy = createMockEncounterEnemy();
    const onExit = jest.fn();
    const { tree: panelTree } = withAllProviders(
        <CombatEncounterPanel enemy={enemy} bootstrapPlayer={bootstrapPlayer} deck={CARDS} seed={7} onExit={onExit} />,
        { store },
    );
    render(panelTree);
    return { store, onExit };
}

function enter() {
    act(() => { fireEvent.press(screen.getByTestId('combat-enter')); });
}

describe('CombatEncounterPanel — combat log toggle', () => {
    it('is absent over the pre-combat reveal (nothing has happened yet)', () => {
        mount();
        expect(screen.getByTestId('combat-reveal')).toBeTruthy();
        expect(screen.queryByTestId('combat-log-toggle')).toBeNull();
        expect(screen.queryByTestId('combat-log')).toBeNull();
    });

    it('appears once the board is live, and the sheet is closed by default', () => {
        mount();
        enter();
        expect(screen.getByTestId('combat-log-toggle')).toBeTruthy();
        expect(screen.queryByTestId('combat-log')).toBeNull();
    });

    it('tapping the toggle opens the log sheet; tapping close dismisses it', () => {
        mount();
        enter();

        act(() => { fireEvent.press(screen.getByTestId('combat-log-toggle')); });
        expect(screen.getByTestId('combat-log')).toBeTruthy();

        act(() => { fireEvent.press(screen.getByTestId('combat-log-close')); });
        expect(screen.queryByTestId('combat-log')).toBeNull();
        // The toggle itself survives closing the sheet — it can be reopened.
        expect(screen.getByTestId('combat-log-toggle')).toBeTruthy();
    });
});
