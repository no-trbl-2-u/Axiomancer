/**
 * CombatBoard — the bottom rail's phase ledger reads as one row.
 *
 * On a 375-wide phone the rail's row has about 20pt between the VITAE readout
 * and the piles, so a five-phase ledger that wrapped inside it stacked as a
 * column of five marks. `railLedgerStacks` moves the ledger to its own
 * full-width line at the top of the rail instead, and the ledger itself never
 * wraps. A wide viewport keeps all three cells on one row.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import {
    CombatBoard, railLedgerStacks,
    RAIL_PAD_LEFT, RAIL_PAD_RIGHT, RAIL_LEDGER_MARK,
    type DragController,
} from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel, type CombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

const CARDS = ['grey-strike', 'grey-ward', 'grey-word', 'grey-strike'];
const PHONE = { width: 375, height: 812, scale: 3, fontScale: 1 };
const DESKTOP = { width: 1280, height: 800, scale: 1, fontScale: 1 };
const INSETS = { top: 47, bottom: 34, left: 0, right: 0 };
const FIVE_PHASES: CombatViewModel['ledger'] = ['clear', 'pending', 'pending', 'pending', 'pending'];

// Same pin as the sibling suites: `useWindowDimensions` is read off the module
// object at call time, so overriding the export pins the viewport.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RN = require('react-native') as Record<string, unknown>;
const realUseWindowDimensions = RN.useWindowDimensions;
const pinViewport = (dims: typeof PHONE) =>
    Object.defineProperty(RN, 'useWindowDimensions', { configurable: true, value: () => dims });
afterEach(() => {
    Object.defineProperty(RN, 'useWindowDimensions', { configurable: true, value: realUseWindowDimensions });
});

const noopDrag = (): DragController =>
    ({ begin: () => undefined, end: () => undefined, active: null, x: { value: 0 }, y: { value: 0 } } as unknown as DragController);

function renderBoard(dims: typeof PHONE): void {
    pinViewport(dims);
    const { store } = withAllProviders(<></>);
    const player = { ...store.getState().player, knownCards: CARDS };
    let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
    s = rollEncounterDice(s).state;
    const vm = { ...buildCombatViewModel(s), ledger: FIVE_PHASES };
    const { tree } = withAllProviders(
        <SafeAreaInsetsContext.Provider value={INSETS}>
            <CombatBoard
                vm={vm} drag={noopDrag()} stagedUids={[]}
                onApply={jest.fn()} onStage={jest.fn()} onUnstage={jest.fn()} onDiscard={jest.fn()}
                onSignature={jest.fn()} onEndPhase={jest.fn()} onInspect={jest.fn()}
            />
        </SafeAreaInsetsContext.Provider>,
        { store },
    );
    render(tree);
}

const flat = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;
const railChildIDs = () =>
    (screen.getByTestId('combat-rail').props.children as React.ReactNode[])
        .flat()
        .filter(React.isValidElement)
        .map((c) => (c.props as { testID?: string }).testID ?? null);

describe('railLedgerStacks', () => {
    it('stacks a five-phase ledger on a phone and keeps it inline on a wide screen', () => {
        expect(railLedgerStacks(375, 5)).toBe(true);
        expect(railLedgerStacks(1280, 5)).toBe(false);
        expect(railLedgerStacks(375, 0)).toBe(false);
    });

    it('a stacked ledger fits on one line between the medallion paddings', () => {
        const fiveMarksW = 5 * RAIL_LEDGER_MARK + 4 * 3;
        expect(fiveMarksW).toBeLessThanOrEqual(375 - RAIL_PAD_LEFT - RAIL_PAD_RIGHT);
    });
});

describe('the rail ledger at 375', () => {
    it('takes its own full-width line first in the rail, as one unwrapped row', () => {
        renderBoard(PHONE);
        expect(railChildIDs().slice(0, 2)).toEqual(['combat-ledger', 'combat-rail-vitae']);
        const ledger = flat('combat-ledger');
        expect(ledger.flexDirection).toBe('row');
        expect(ledger.flexWrap).toBeUndefined();
        expect(ledger.width).toBe('100%');
        expect(flat('combat-rail').flexWrap).toBe('wrap');
    });
});

describe('the rail ledger at 1280', () => {
    it('sits inline between VITAE and the piles', () => {
        renderBoard(DESKTOP);
        expect(railChildIDs().slice(0, 2)).toEqual(['combat-rail-vitae', 'combat-ledger']);
        expect(flat('combat-ledger').width).toBeUndefined();
        expect(flat('combat-rail').flexWrap).toBeUndefined();
    });
});
