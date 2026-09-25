/**
 * CombatBoard — fresh-eyes shard S1-board, cluster C34.
 *
 * The stance chip's empty read was a bare state word, 'NO STANCE', on a chip
 * that answers nothing when tapped: it named a hole and never the action that
 * fills it. The presenter now hands the empty state a `hint` — the action —
 * and the chip prints it beside the value. A held stance keeps the value alone.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import { CombatBoard, type DragController } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel, type CombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

const CARDS = ['spoiled-poultice', 'unction-of-boils', 'frostbitten-palisade', 'thin-hymn'];
const PHONE = { width: 390, height: 844, scale: 3, fontScale: 1 };
const INSETS = { top: 47, bottom: 34, left: 0, right: 0 };

// eslint-disable-next-line @typescript-eslint/no-require-imports
const RN = require('react-native') as Record<string, unknown>;
const realUseWindowDimensions = RN.useWindowDimensions;
beforeAll(() => {
    Object.defineProperty(RN, 'useWindowDimensions', { configurable: true, value: () => PHONE });
});
afterAll(() => {
    Object.defineProperty(RN, 'useWindowDimensions', { configurable: true, value: realUseWindowDimensions });
});

const noopDrag = (): DragController =>
    ({ begin: () => undefined, end: () => undefined, active: null, x: { value: 0 }, y: { value: 0 } } as unknown as DragController);

const boardCallbacks = () => ({
    onApply: jest.fn(), onStage: jest.fn(), onUnstage: jest.fn(), onDiscard: jest.fn(),
    onSignature: jest.fn(), onEndPhase: jest.fn(), onInspect: jest.fn(),
});

/** Builds a view model, optionally with a stance already taken. */
function stanceVM(stance: 'heart' | 'body' | 'mind' | null): {
    store: ReturnType<typeof withAllProviders>['store']; vm: CombatViewModel;
} {
    const { store } = withAllProviders(<></>);
    const base = store.getState().player;
    const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 129, maxHealth: 200 };
    const init = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
    const rolled = rollEncounterDice(init).state;
    return { store, vm: buildCombatViewModel({ ...rolled, playerStance: stance }) };
}

function renderBoard(vm: CombatViewModel, store: ReturnType<typeof withAllProviders>['store']): void {
    const { tree } = withAllProviders(
        <SafeAreaInsetsContext.Provider value={INSETS}>
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...boardCallbacks()} />
        </SafeAreaInsetsContext.Provider>,
        { store },
    );
    render(tree);
}

describe('S1-board-C34 — the empty stance chip names the action that fills it', () => {
    it('the presenter hands the empty state an instruction, not just a state word', () => {
        const { vm } = stanceVM(null);
        const chip = vm.playerStance;
        expect(chip.label).toBe('NO STANCE');
        expect(chip.hint).toBeTruthy();
        // It must be an ACTION — a verb the player can carry out on this board.
        expect(chip.hint).toMatch(/play/i);
    });

    it('a held stance drops the instruction — the value is the whole answer', () => {
        const { vm } = stanceVM('body');
        expect(vm.playerStance.label).toBe('BODY');
        expect(vm.playerStance.hint).toBeNull();
    });

    it('the board prints the instruction beside NO STANCE', () => {
        const { store, vm } = stanceVM(null);
        renderBoard(vm, store);
        expect(screen.getByTestId('combat-player-stance')).toBeTruthy();
        const hint = screen.getByTestId('combat-player-stance-hint');
        expect(JSON.stringify(hint.props.children)).toMatch(/PLAY A PAID CARD/);
    });

    it('the board shows no instruction once a stance is held', () => {
        const { store, vm } = stanceVM('heart');
        renderBoard(vm, store);
        expect(screen.getByTestId('combat-player-stance')).toBeTruthy();
        expect(screen.queryByTestId('combat-player-stance-hint')).toBeNull();
    });
});
