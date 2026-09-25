/**
 * Phase 38 — combat-first adoption witness. Proves the card play/refusal
 * site (`StagedCard`'s drop-confirm pop + rejection shake) actually fires
 * through the lib/juice primitives.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { Gesture } from 'react-native-gesture-handler';

import { initializeCombatEncounter, rollEncounterDice, type CombatEncounterState } from '@mechanics';
import { StagedCard } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';
import * as Juice from '@/lib/juice';

jest.mock('@/lib/juice', () => {
    const actual = jest.requireActual('@/lib/juice') as typeof Juice;
    return {
        ...actual,
        useJuicePulse: jest.fn(actual.useJuicePulse),
        useJuiceShake: jest.fn(actual.useJuiceShake),
    };
});

const CARDS = ['spoiled-poultice', 'unction-of-boils', 'frostbitten-palisade', 'thin-hymn'];

function freshCard() {
    const { store } = withAllProviders(<></>);
    const base = store.getState().player;
    const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };
    let s: CombatEncounterState = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
    s = rollEncounterDice(s).state;
    const vm = buildCombatViewModel(s);
    return vm.hand[0];
}

describe('StagedCard — combat adoption of lib/juice primitives', () => {
    it('a rising rejectKey fires the shake primitive', () => {
        const card = freshCard();
        const { rerender } = render(
            <StagedCard card={card} assignedDie={null} onApply={jest.fn()} gesture={Gesture.Exclusive(Gesture.Tap())} register={jest.fn()} rejectKey={0} />,
        );
        rerender(
            <StagedCard card={card} assignedDie={null} onApply={jest.fn()} gesture={Gesture.Exclusive(Gesture.Tap())} register={jest.fn()} rejectKey={1} />,
        );
        const calls = (Juice.useJuiceShake as jest.Mock).mock.calls;
        expect(calls.some(([key, intensity]) => key === 1 && intensity === 'low')).toBe(true);
    });

    it('a rising popKey (drop confirm) fires the pulse primitive at a subtle intensity', () => {
        const card = freshCard();
        const { rerender } = render(
            <StagedCard card={card} assignedDie={null} onApply={jest.fn()} gesture={Gesture.Exclusive(Gesture.Tap())} register={jest.fn()} popKey={0} />,
        );
        rerender(
            <StagedCard card={card} assignedDie={null} onApply={jest.fn()} gesture={Gesture.Exclusive(Gesture.Tap())} register={jest.fn()} popKey={1} />,
        );
        const calls = (Juice.useJuicePulse as jest.Mock).mock.calls;
        expect(calls.some(([key, intensity]) => key === 1 && intensity === 0.4)).toBe(true);
    });
});
