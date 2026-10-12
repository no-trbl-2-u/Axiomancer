/**
 * CombatBoard — a drag pickup re-renders only what it changes.
 *
 * Picking a card up flips the panel's `drag.active`, which re-renders the
 * board. Every GestureDetector that re-renders pushes its handlers' configs
 * back to the native gesture module, and the drag ghost only shows once that
 * pickup commit lands — so a whole-fan, whole-tray re-render on every pickup
 * and drop was drag lag. This pins the memo boundaries: lifting one card
 * re-renders that card's detector and no other card's in the fan.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import { CombatBoard, type DragController } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

// Records which fan card each GestureDetector render belongs to, passing
// everything through to the real detector. Tray dice re-render on their own
// tumble state, so only fan detectors are counted.
const detectorRenders: string[] = [];
jest.mock('react-native-gesture-handler', () => {
    const actual = jest.requireActual<typeof import('react-native-gesture-handler')>('react-native-gesture-handler');
    const R = jest.requireActual<typeof import('react')>('react');
    function CountingDetector(props: React.ComponentProps<typeof actual.GestureDetector>) {
        const testID = (props.children as React.ReactElement<{ testID?: string }> | undefined)?.props?.testID;
        if (testID?.startsWith('combat-hand-')) detectorRenders.push(testID);
        return R.createElement(actual.GestureDetector, props);
    }
    return { ...actual, GestureDetector: CountingDetector };
});

const CARDS = ['grey-strike', 'grey-ward', 'grey-word', 'grey-strike'];

const dragWith = (active: DragController['active']): DragController =>
    ({ begin: () => undefined, end: () => undefined, active } as unknown as DragController);

const callbacks = {
    onApply: jest.fn(), onStage: jest.fn(), onUnstage: jest.fn(), onDiscard: jest.fn(),
    onSignature: jest.fn(), onEndPhase: jest.fn(), onInspect: jest.fn(),
};

describe('CombatBoard — drag pickup re-render scope', () => {
    it('lifting one hand card re-renders only that card\'s gesture detector', () => {
        const { store } = withAllProviders(<></>);
        const base = store.getState().player;
        const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };
        let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
        s = rollEncounterDice(s).state;
        const vm = buildCombatViewModel(s);
        expect(vm.hand.length).toBeGreaterThanOrEqual(3);
        expect(vm.dice.length).toBeGreaterThan(0);

        const board = (drag: DragController) => withAllProviders(
            <CombatBoard vm={vm} drag={drag} stagedUids={[]} {...callbacks} />,
            { store },
        ).tree;
        const view = render(board(dragWith(null)));
        // Every fan card mounted a detector.
        expect(detectorRenders).toHaveLength(vm.hand.length);

        detectorRenders.length = 0;
        const card = vm.hand[0];
        view.rerender(board(dragWith({ type: 'card', from: 'hand', uid: card.uid, card })));
        expect(detectorRenders).toEqual([`combat-hand-${card.uid}`]);

        // The drop re-renders the same one card back.
        detectorRenders.length = 0;
        view.rerender(board(dragWith(null)));
        expect(detectorRenders).toEqual([`combat-hand-${card.uid}`]);
    });
});
