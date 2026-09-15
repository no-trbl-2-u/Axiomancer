/**
 * Phase 83 — the `region` prop threads from `CombatBoard` down to
 * `CombatCombatantPane`'s arena backdrop. Fixture pattern lifted from
 * `CombatBoard.S1-board.test.tsx`: a real engine-initialized `CombatViewModel`
 * mounted through `withAllProviders`.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import { CombatBoard, type DragController } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel, type CombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

const CARDS = ['spoiled-poultice', 'unction-of-boils', 'frostbitten-palisade', 'thin-hymn'];
const INSETS = { top: 47, bottom: 34, left: 0, right: 0 };

const noopDrag = (): DragController =>
    ({ begin: () => undefined, end: () => undefined, active: null, x: { value: 0 }, y: { value: 0 } } as unknown as DragController);

const boardCallbacks = () => ({
    onApply: jest.fn(), onStage: jest.fn(), onUnstage: jest.fn(), onDiscard: jest.fn(),
    onSignature: jest.fn(), onEndPhase: jest.fn(), onInspect: jest.fn(),
});

function freshVM(): { store: ReturnType<typeof withAllProviders>['store']; vm: CombatViewModel } {
    const { store } = withAllProviders(<></>);
    const base = store.getState().player;
    const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 129, maxHealth: 200 };
    let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
    s = rollEncounterDice(s).state;
    return { store, vm: buildCombatViewModel(s) };
}

function renderBoard(region: string | undefined) {
    const { store, vm } = freshVM();
    const { tree } = withAllProviders(
        <SafeAreaInsetsContext.Provider value={INSETS}>
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} region={region} {...boardCallbacks()} />
        </SafeAreaInsetsContext.Provider>,
        { store },
    );
    return render(tree);
}

describe('CombatBoard: region-keyed arena backdrop (phase 83)', () => {
    it('the Drowned Parish resolves to the coastal-village plate, not the ruined-city fallback', () => {
        const withRegion = renderBoard('the Drowned Parish');
        const withoutRegion = renderBoard(undefined);
        const backdropWith = withRegion.getByTestId('combat-arena-backdrop');
        const backdropWithout = withoutRegion.getByTestId('combat-arena-backdrop');
        expect(backdropWith.props.source).not.toEqual(backdropWithout.props.source);
        expect(backdropWith.props.accessibilityLabel).not.toEqual(backdropWithout.props.accessibilityLabel);
    });

    it('an unmapped region keeps the exact fallback plate and label the dev sandbox gets', () => {
        const withUnmapped = renderBoard('The Caverns');
        const withNone = renderBoard(undefined);
        const backdropUnmapped = withUnmapped.getByTestId('combat-arena-backdrop');
        const backdropNone = withNone.getByTestId('combat-arena-backdrop');
        expect(backdropUnmapped.props.source).toEqual(backdropNone.props.source);
        expect(backdropUnmapped.props.accessibilityLabel).toEqual(backdropNone.props.accessibilityLabel);
    });
});
