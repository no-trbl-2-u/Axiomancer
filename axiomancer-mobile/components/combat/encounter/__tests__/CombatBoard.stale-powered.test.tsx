/**
 * CombatBoard — the STALE-POWERED bug (owner playtest 2026-07-12).
 *
 * Report: "when I apply a die and play a card, the NEXT card appears powered."
 *
 * Root cause: almost every powered play lands a NEW status, and the engine's
 * combo loop then REFRESHES the drafted die (`die-refreshed` — it stays
 * drafted AND available). The board's `comboTargetUid` display re-attached
 * that die to the first color-legal staged card, and `handleApply` would
 * silently consume it there — so a card the player never armed rendered (and
 * committed) powered.
 *
 * The fix: a REFRESHED combo die (drafted + available + a play already made
 * this turn, vm `refreshed`) never auto-attaches. It returns to the tray
 * draggable ("↻ AGAIN"); powering a second card takes an explicit re-drop,
 * and an un-armed card both READS and COMMITS as FREE. A fresh drafted die
 * (no play yet this turn — the synthetic/fizzle state) keeps the shared
 * combo-commit law, pinned by the colorlaw suite.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
    initializeCombatEncounter, rollEncounterDice, draftStanceDie, playCombatCard,
    type CombatEncounterState,
} from '@mechanics';
import { CombatBoard, resolveDieDropTarget, type DragController } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

// slippery-slope and recurring-symptom are BOTH body-stance Affliction DoTs (the D8 valve replaced retired straw-mans-jab here) —
// exactly the pairing where the old comboTarget re-attach showed: play A with
// a body die (status lands → die refreshed), stage B (also body) → B lit up.
const CARDS = ['slippery-slope', 'recurring-symptom', 'brace-for-impact', 'soft-word'];

const noopDrag = (): DragController =>
    ({ begin: () => undefined, end: () => undefined, active: null, x: { value: 0 }, y: { value: 0 } } as unknown as DragController);

const boardCallbacks = () => ({
    onApply: jest.fn(), onStage: jest.fn(), onUnstage: jest.fn(), onDiscard: jest.fn(),
    onSignature: jest.fn(), onEndPhase: jest.fn(), onInspect: jest.fn(),
});

/** The exact user flow up to the report: draft a matching die, play card A
 *  POWERED (its status lands → the engine refreshes the die). Returns the
 *  post-play state with the refreshed drafted die live in the tray. */
function playAWithDie(store: ReturnType<typeof withAllProviders>['store']): {
    s: CombatEncounterState; playedId: string;
} {
    const base = store.getState().player;
    const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };
    let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
    s = rollEncounterDice(s).state;
    const a = s.hand.find(h => h.cardId === 'slippery-slope');
    expect(a).toBeTruthy();
    // Force die 0 to the card's color (body) so the powered play is color-legal.
    const first = s.dice.findIndex(d => d.state === 'available');
    const dice = s.dice.map((d, i) => (i === first ? { ...d, color: 'body' as const } : d));
    s = draftStanceDie({ ...s, dice }, dice[first].id).state;
    const t = playCombatCard(s, { uid: a!.uid }, true);
    // The premise of the bug: the play landed a status → the die REFRESHED.
    expect(t.events.some(e => e.kind === 'die-refreshed')).toBe(true);
    return { s: t.state, playedId: a!.uid };
}

afterEach(() => { jest.clearAllMocks(); });

describe('CombatBoard — a refreshed combo die never re-attaches on its own', () => {
    it('after playing card A with the die, staged card B does NOT render powered', () => {
        const { store } = withAllProviders(<></>);
        const { s } = playAWithDie(store);
        const vm = buildCombatViewModel(s);
        // Engine truth: the drafted die is back (available), a play was made.
        const die = vm.dice.find(d => d.drafted && !d.spent);
        expect(die).toBeTruthy();
        expect(die!.refreshed).toBe(true);
        const b = vm.hand.find(c => c.cardId === 'recurring-symptom')!;
        expect(b.stance).toBe('body'); // same color — the old comboTarget re-attach case

        const cbs = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[b.uid]} {...cbs} />,
            { store },
        );
        render(tree);

        // THE BUG: B rendered the refreshed die in its socket ("appears
        // powered") without the player ever dropping a die on it.
        expect(screen.queryByTestId('combat-staged-die')).toBeNull();
        // Its empty socket still renders (nothing armed).
        expect(screen.getByTestId(`combat-socket-${b.uid}`)).toBeTruthy();
        // The tray telegraphs the die's second life instead.
        expect(screen.getByTestId(`combat-refreshed-${die!.id}`)).toBeTruthy();
    });

    it('APPLY on the un-armed card B commits FREE — display and commit agree', () => {
        const { store } = withAllProviders(<></>);
        const { s } = playAWithDie(store);
        const vm = buildCombatViewModel(s);
        const b = vm.hand.find(c => c.cardId === 'recurring-symptom')!;

        const cbs = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[b.uid]} {...cbs} />,
            { store },
        );
        render(tree);

        fireEvent.press(screen.getByTestId(`combat-apply-${b.uid}`));
        // Old behavior: onApply(b.uid, null, true) — the refreshed die silently
        // consumed. Fixed: the card the player never armed plays FREE.
        expect(cbs.onApply).toHaveBeenCalledTimes(1);
        expect(cbs.onApply).toHaveBeenCalledWith(b.uid, null, false);
    });

    it('the refreshed die is draggable again and its re-drop targets legally', () => {
        const { store } = withAllProviders(<></>);
        const { s } = playAWithDie(store);
        const vm = buildCombatViewModel(s);
        const die = vm.dice.find(d => d.drafted && !d.spent)!;
        // The second life is an explicit re-drag, so the die must be grabbable…
        expect(die.draggable).toBe(true);
        // …and the drop resolver accepts it on a color-legal card only.
        const stanceOf = (uid: string) => ({ 'u-body': 'body', 'u-mind': 'mind' } as Record<string, string>)[uid];
        expect(resolveDieDropTarget(die, 'u-body', true, ['u-body'], stanceOf, {})).toBe('u-body');
        expect(resolveDieDropTarget(die, 'u-mind', true, ['u-mind'], stanceOf, {})).toBeNull();
    });

    it('a FRESH drafted die (no play yet this turn) still auto-arms — the combo pin is untouched', () => {
        const { store } = withAllProviders(<></>);
        const base = store.getState().player;
        const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };
        let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
        s = rollEncounterDice(s).state;
        const b = s.hand.find(h => h.cardId === 'recurring-symptom')!;
        const first = s.dice.findIndex(d => d.state === 'available');
        const dice = s.dice.map((d, i) => (i === first ? { ...d, color: 'body' as const } : d));
        s = draftStanceDie({ ...s, dice }, dice[first].id).state; // drafted, NOTHING played
        const vm = buildCombatViewModel(s);
        expect(vm.dice.find(d => d.drafted)!.refreshed).toBeUndefined();

        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[b.uid]} {...boardCallbacks()} />,
            { store },
        );
        render(tree);
        expect(screen.getByTestId('combat-staged-die')).toBeTruthy();
    });
});
