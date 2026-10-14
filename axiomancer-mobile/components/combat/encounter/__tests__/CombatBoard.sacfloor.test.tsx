/**
 * CombatBoard — the SACRIFICE floor points at the VITAE ring (phase SF1).
 *
 * A line refused because its SACRIFICE would leave the player below 1 VITAE
 * flags the player's VITAE ring: a red outline pulse and a ghost segment of
 * the unpaid SACRIFICE, tagged `SACRIFICE <cost>`, with the ring's label
 * naming the numbers. Any other refusal (a printed condition, a Global in
 * play, an off-colour die) leaves the ring alone.
 *
 * The board reads the numbers from the card VM's `freeShortfall` /
 * `paidShortfall` (the engine's `programLineShortfall`, pinned in the
 * presenter and engine suites), so these cases inject them on a grey hand
 * card. The drag path needs `measureInWindow`, which jest cannot run; the
 * die-tap and APPLY paths are the real gestures.
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { initializeCombatEncounter, rollEncounterDice, type CombatEncounterState } from '@mechanics';
import { CombatBoard, type DragController } from '@/components/combat/encounter/CombatBoard';
import { SACRIFICE_CALLOUT_MS, sacrificeGhostArcs } from '@/components/combat/encounter/VitaeSacrificeCallout';
import { buildCombatViewModel, PROGRAM_COPY } from '@/state/presenters/combat-encounter.engine';
import { createSettingsStore } from '@/state/settings';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';
import { tapCombatDie } from '@/test-utils/tapCombatDie';

const CARDS = ['grey-strike', 'grey-ward', 'grey-word', 'grey-strike'];
const FLOOR = 'that SACRIFICE would leave you below 1 VITAE';
const SHORT = { cost: 4, vitae: 4 };

const noopDrag = (): DragController =>
    ({ begin: () => undefined, end: () => undefined, active: null, x: { value: 0 }, y: { value: 0 } } as unknown as DragController);

const boardCallbacks = () => ({
    onApply: jest.fn(), onStage: jest.fn(), onUnstage: jest.fn(), onDiscard: jest.fn(),
    onSignature: jest.fn(), onEndPhase: jest.fn(), onInspect: jest.fn(),
});

function freshEncounter(): { store: ReturnType<typeof withAllProviders>['store']; s: CombatEncounterState } {
    const { store } = withAllProviders(<></>);
    const base = store.getState().player;
    const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };
    const s = rollEncounterDice(initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16)).state;
    return { store, s: { ...s, player: { ...s.player, health: 4 } } };
}

type Play = {
    freeBlock: string | null; paidBlock: string | null;
    freeShortfall: { cost: number; vitae: number } | null; paidShortfall: { cost: number; vitae: number } | null;
};

/** The first hand card, read as a program card with `play`, staged. */
function boardWith(play: Play, opts: { reduced?: boolean } = {}) {
    const { store, s } = freshEncounter();
    const vm0 = buildCombatViewModel(s);
    const card = { ...vm0.hand[0], play: { ...play, unscrappable: false, xRange: null } };
    const vm = { ...vm0, hand: [card, ...vm0.hand.slice(1)] };
    const cbs = boardCallbacks();
    const settings = createSettingsStore({
        storage: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined },
    });
    if (opts.reduced) settings.set({ reducedMotion: 'on' });
    const { tree } = withAllProviders(
        <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[card.uid]} {...cbs} />,
        { store, settings },
    );
    render(tree);
    const die = vm.dice.find((d) => d.draggable && !d.spent)!;
    return { vm, card, cbs, die };
}

afterEach(() => { jest.useRealTimers(); jest.clearAllMocks(); });

describe('the ghost segment geometry', () => {
    it('covers the whole fill, then the overflow back from 12 o\'clock', () => {
        expect(sacrificeGhostArcs(4, 100, 6, 100)).toEqual([{ from: 0, to: 4 }, { from: 98, to: 100 }]);
    });

    it('a cost equal to the VITAE held has no overflow; the overflow never laps the fill', () => {
        expect(sacrificeGhostArcs(4, 100, 4, 100)).toEqual([{ from: 0, to: 4 }]);
        expect(sacrificeGhostArcs(60, 100, 200, 100)).toEqual([{ from: 0, to: 60 }, { from: 60, to: 100 }]);
        expect(sacrificeGhostArcs(4, 100, 0, 100)).toEqual([]);
    });
});

describe('CombatBoard — a refusal at the SACRIFICE floor flags the VITAE ring', () => {
    it('a die tapped onto a card whose PAID SACRIFICE cannot be paid runs the callout', async () => {
        const { die } = boardWith({ freeBlock: null, paidBlock: FLOOR, freeShortfall: null, paidShortfall: SHORT });
        expect(screen.queryByTestId('combat-vitae-callout')).toBeNull();
        await tapCombatDie(die.id);
        expect(screen.getByTestId('combat-vitae-callout')).toBeTruthy();
        expect(screen.getByText(PROGRAM_COPY.floorTag(4))).toBeTruthy();
        expect(screen.getAllByTestId('combat-vitae-ghost').length).toBeGreaterThan(0);
        expect(screen.getByTestId('combat-vitae-outline-pulse')).toBeTruthy();
    });

    it('the VITAE ring\'s label names the numbers during the callout', async () => {
        const { die } = boardWith({ freeBlock: null, paidBlock: FLOOR, freeShortfall: null, paidShortfall: SHORT });
        await tapCombatDie(die.id);
        expect(screen.getByTestId('combat-player-medallion').props.accessibilityLabel)
            .toBe('VITAE 4 of 200. SACRIFICE 4 would leave you below 1.');
    });

    it('a refused APPLY on a FREE line that cannot be paid runs it, and plays nothing', () => {
        const { card, cbs } = boardWith({ freeBlock: FLOOR, paidBlock: FLOOR, freeShortfall: { cost: 6, vitae: 4 }, paidShortfall: SHORT });
        fireEvent.press(screen.getByTestId(`combat-apply-${card.uid}`));
        expect(cbs.onApply).not.toHaveBeenCalled();
        expect(screen.getByText(PROGRAM_COPY.floorTag(6))).toBeTruthy();
    });

    it('clears after the callout span', async () => {
        jest.useFakeTimers();
        const { card } = boardWith({ freeBlock: FLOOR, paidBlock: FLOOR, freeShortfall: SHORT, paidShortfall: SHORT });
        fireEvent.press(screen.getByTestId(`combat-apply-${card.uid}`));
        expect(screen.getByTestId('combat-vitae-callout')).toBeTruthy();
        act(() => { jest.advanceTimersByTime(SACRIFICE_CALLOUT_MS + 10); });
        expect(screen.queryByTestId('combat-vitae-callout')).toBeNull();
    });

    it('with reduced motion the outline holds still (no pulse)', () => {
        const { card } = boardWith({ freeBlock: FLOOR, paidBlock: FLOOR, freeShortfall: SHORT, paidShortfall: SHORT }, { reduced: true });
        fireEvent.press(screen.getByTestId(`combat-apply-${card.uid}`));
        expect(screen.getByTestId('combat-vitae-outline-static')).toBeTruthy();
        expect(screen.queryByTestId('combat-vitae-outline-pulse')).toBeNull();
        expect(screen.getAllByTestId('combat-vitae-ghost').length).toBeGreaterThan(0);
    });
});

describe('CombatBoard — any other refusal leaves the VITAE ring alone', () => {
    it('a PAID line refused by a printed condition', async () => {
        const { die } = boardWith({ freeBlock: null, paidBlock: 'only at half VITAE or less', freeShortfall: null, paidShortfall: null });
        await tapCombatDie(die.id);
        expect(screen.queryByTestId('combat-vitae-callout')).toBeNull();
    });

    it('a Global already in play, refused at APPLY', () => {
        const { card, cbs } = boardWith({ freeBlock: 'that Global is already in play', paidBlock: 'that Global is already in play', freeShortfall: null, paidShortfall: null });
        fireEvent.press(screen.getByTestId(`combat-apply-${card.uid}`));
        expect(cbs.onApply).not.toHaveBeenCalled();
        expect(screen.queryByTestId('combat-vitae-callout')).toBeNull();
        expect(screen.getByTestId('combat-player-medallion').props.accessibilityLabel).toMatch(/Inspect your pilgrim/);
    });

    it('a card that already holds a die refuses a second one without the callout', async () => {
        const { vm, die } = boardWith({ freeBlock: null, paidBlock: null, freeShortfall: null, paidShortfall: SHORT });
        await tapCombatDie(die.id);
        const other = vm.dice.find((d) => d.draggable && !d.spent && d.id !== die.id);
        if (other) await tapCombatDie(other.id);
        expect(screen.queryByTestId('combat-vitae-callout')).toBeNull();
    });
});
