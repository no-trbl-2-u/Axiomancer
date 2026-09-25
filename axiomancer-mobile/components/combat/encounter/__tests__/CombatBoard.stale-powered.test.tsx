/**
 * CombatBoard — the STALE-POWERED bug (owner playtest 2026-07-12).
 *
 * Report: "when I apply a die and play a card, the NEXT card appears powered."
 *
 * Root cause (draft era): a powered play that landed a status REFRESHED the
 * powering die (it stayed available), and the board re-attached that die to
 * the first color-legal staged card, so a card the player never armed
 * rendered (and committed) powered.
 *
 * The law, carried into the spec-33 model (no draft, D7): a die powers only
 * the card the player explicitly dropped (or tapped) it onto. A die that is
 * still live after powering card A — a refresh rider/mechanic hands it back —
 * never re-attaches to card B on its own: B both READS and COMMITS as FREE
 * until the player chooses the die again, and that explicit re-choice works.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
    initializeCombatEncounter, rollEncounterDice,
    type CombatEncounterState,
} from '@mechanics';
import { CombatBoard, resolveDieDropTarget, type DragController } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel, type CombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';
import { tapCombatDie } from '@/test-utils/tapCombatDie';

// spoiled-poultice and unction-of-boils are BOTH body-stance Affliction DoTs —
// exactly the pairing where the old re-attach showed: play A with a body die,
// stage B (also body) → B lit up.
const CARDS = ['spoiled-poultice', 'unction-of-boils', 'frostbitten-palisade', 'thin-hymn'];

const noopDrag = (): DragController =>
    ({ begin: () => undefined, end: () => undefined, active: null, x: { value: 0 }, y: { value: 0 } } as unknown as DragController);

const boardCallbacks = () => ({
    onApply: jest.fn(), onStage: jest.fn(), onUnstage: jest.fn(), onDiscard: jest.fn(),
    onSignature: jest.fn(), onEndPhase: jest.fn(), onInspect: jest.fn(),
});

/** A rolled encounter whose first live tray die is a BODY mana face — legal
 *  for both A and B. Returns the state and that die's id. */
function openWithBodyDie(store: ReturnType<typeof withAllProviders>['store']): { s: CombatEncounterState; dieId: string } {
    const base = store.getState().player;
    const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };
    let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
    s = rollEncounterDice(s).state;
    const first = s.dice.findIndex(d => d.state === 'available' && !d.floating && d.face !== 'miss');
    expect(first).toBeGreaterThanOrEqual(0);
    const dice = s.dice.map((d, i) => (i === first ? { ...d, color: 'body' as const, face: 'mana' as const } : d));
    return { s: { ...s, dice }, dieId: dice[first].id };
}

/** Renders the board for `stagedUids`, returning the callbacks and a
 *  re-render hook that keeps the SAME board instance (its pending-die map
 *  is the state under test). */
function mountBoard(vm: CombatViewModel, stagedUids: string[], store: ReturnType<typeof withAllProviders>['store']) {
    const cbs = boardCallbacks();
    const { tree } = withAllProviders(
        <CombatBoard vm={vm} drag={noopDrag()} stagedUids={stagedUids} {...cbs} />,
        { store },
    );
    const view = render(tree);
    const restage = (next: string[]) => {
        const { tree: t } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={next} {...cbs} />,
            { store },
        );
        view.rerender(t);
    };
    return { cbs, restage };
}

afterEach(() => { jest.clearAllMocks(); });

describe('CombatBoard — a die that powered card A never re-attaches to card B', () => {
    it('after APPLYing A with the die, a staged B does NOT render powered and commits FREE', async () => {
        const { store } = withAllProviders(<></>);
        const { s, dieId } = openWithBodyDie(store);
        // The die is still live after A's play (the refresh case): the VM the
        // board sees keeps it available.
        const vm = buildCombatViewModel(s);
        const a = vm.hand.find(c => c.cardId === 'spoiled-poultice')!;
        const b = vm.hand.find(c => c.cardId === 'unction-of-boils')!;
        expect(a.stance).toBe('body');
        expect(b.stance).toBe('body'); // same color — the old re-attach case

        const { cbs, restage } = mountBoard(vm, [a.uid], store);
        await tapCombatDie(dieId);
        fireEvent.press(screen.getByTestId(`combat-apply-${a.uid}`));
        expect(cbs.onApply).toHaveBeenLastCalledWith(a.uid, dieId, true);

        // A leaves staging; the player stages B.
        restage([b.uid]);
        // THE BUG: B rendered the die in its socket ("appears powered")
        // without the player ever choosing it for B.
        expect(screen.queryByTestId('combat-staged-die')).toBeNull();
        expect(screen.getByTestId(`combat-socket-${b.uid}`)).toBeTruthy();

        fireEvent.press(screen.getByTestId(`combat-apply-${b.uid}`));
        // Display and commit agree: the card the player never armed plays FREE.
        expect(cbs.onApply).toHaveBeenLastCalledWith(b.uid, null, false);
    });

    it('the still-live die can be chosen again for B — the explicit re-choice powers it', async () => {
        const { store } = withAllProviders(<></>);
        const { s, dieId } = openWithBodyDie(store);
        const vm = buildCombatViewModel(s);
        const a = vm.hand.find(c => c.cardId === 'spoiled-poultice')!;
        const b = vm.hand.find(c => c.cardId === 'unction-of-boils')!;

        const { cbs, restage } = mountBoard(vm, [a.uid], store);
        await tapCombatDie(dieId);
        fireEvent.press(screen.getByTestId(`combat-apply-${a.uid}`));
        restage([b.uid]);

        await tapCombatDie(dieId);
        expect(screen.getByTestId('combat-staged-die')).toBeTruthy();
        fireEvent.press(screen.getByTestId(`combat-apply-${b.uid}`));
        expect(cbs.onApply).toHaveBeenLastCalledWith(b.uid, dieId, true);
    });

    it('a live die stays draggable and its re-drop targets legally', () => {
        const { store } = withAllProviders(<></>);
        const { s, dieId } = openWithBodyDie(store);
        const die = buildCombatViewModel(s).dice.find(d => d.id === dieId)!;
        // The second life is an explicit re-drag, so the die must be grabbable…
        expect(die.draggable).toBe(true);
        // …and the drop resolver accepts it on a color-legal card only.
        const stanceOf = (uid: string) => ({ 'u-body': 'body', 'u-mind': 'mind' } as Record<string, string>)[uid];
        expect(resolveDieDropTarget(die, 'u-body', true, ['u-body'], stanceOf, {})).toBe('u-body');
        expect(resolveDieDropTarget(die, 'u-mind', true, ['u-mind'], stanceOf, {})).toBeNull();
    });
});
