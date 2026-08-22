/**
 * CombatBoard — Seal chip row (phase 50).
 *
 * Phase 33d's `state.glyphs` renders as "Seal" chips merged into the
 * existing statusStrip row (Phase 49 decision 1). Tapping a chip must call
 * `onSeal` with that seal's view-model exactly once — the panel owns the
 * CRACK/WAIT confirm sheet, the board only reports the tap.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import type { CombatEncounterState, GlyphInstance } from '@mechanics';
import { CombatBoard, type DragController } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

const CARDS = ['shallow-grave', 'spoiled-poultice'];

const noopDrag = (): DragController =>
    ({ begin: () => undefined, move: () => undefined, end: () => undefined, active: null } as unknown as DragController);

const boardCallbacks = () => ({
    onApply: jest.fn(), onStage: jest.fn(), onUnstage: jest.fn(), onDiscard: jest.fn(),
    onSignature: jest.fn(), onEndPhase: jest.fn(), onInspect: jest.fn(),
});

function openEncounter(player: ReturnType<typeof buildPlayer>): CombatEncounterState {
    const s = initializeCombatEncounter(player, createMockEncounterEnemy(), CARDS, 7);
    return rollEncounterDice(s).state;
}

function buildPlayer(store: ReturnType<typeof withAllProviders>['store']) {
    const base = store.getState().player;
    return { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };
}

afterEach(() => { jest.clearAllMocks(); });

describe('CombatBoard — Seal chips', () => {
    it('renders a Seal chip per glyphs.glyphs entry with the charges/cap badge', () => {
        const { store } = withAllProviders(<></>);
        const player = buildPlayer(store);
        const s = openEncounter(player);
        const glyphs: GlyphInstance[] = [
            { id: 'g1', cardId: 'glyph-of-suppuration', payload: { kind: 'poison', baseIntensity: 1, duration: 2 }, charges: 2, cap: 3 },
        ];
        const vm = buildCombatViewModel({ ...s, glyphs });

        const cbs = boardCallbacks();
        const onSeal = jest.fn();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...cbs} onSeal={onSeal} />,
            { store },
        );
        render(tree);

        expect(screen.getByTestId('combat-seal-g1')).toBeTruthy();
        expect(screen.getByText('2/3')).toBeTruthy();
    });

    it('tapping a Seal chip calls onSeal with that seal exactly once, not onApply/onChip', () => {
        const { store } = withAllProviders(<></>);
        const player = buildPlayer(store);
        const s = openEncounter(player);
        const glyphs: GlyphInstance[] = [
            { id: 'g2', cardId: 'glyph-of-the-bulwark', payload: { kind: 'barrier', baseAmount: 2 }, charges: 1, cap: 3 },
        ];
        const vm = buildCombatViewModel({ ...s, glyphs });

        const cbs = boardCallbacks();
        const onSeal = jest.fn();
        const onChip = jest.fn();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...cbs} onSeal={onSeal} onChip={onChip} />,
            { store },
        );
        render(tree);

        fireEvent.press(screen.getByTestId('combat-seal-g2'));

        expect(onSeal).toHaveBeenCalledTimes(1);
        expect(onSeal).toHaveBeenCalledWith(expect.objectContaining({ id: 'g2', kind: 'barrier', charges: 1, cap: 3 }));
        expect(onChip).not.toHaveBeenCalled();
        expect(cbs.onApply).not.toHaveBeenCalled();
    });

    it('renders no Seal chips and no statusStrip crash when state.glyphs is absent', () => {
        const { store } = withAllProviders(<></>);
        const player = buildPlayer(store);
        const s = openEncounter(player);
        const vm = buildCombatViewModel(s);

        const cbs = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...cbs} />,
            { store },
        );
        render(tree);

        expect(screen.queryByTestId(/^combat-seal-/)).toBeNull();
    });
});
