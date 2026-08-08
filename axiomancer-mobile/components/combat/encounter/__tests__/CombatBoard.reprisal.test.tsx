/**
 * CombatBoard — REPRISE songbook interception (phase 28).
 *
 * APPLYing a staged `reprise`-mechanic card with a drafted die (a POWERED
 * play — the only face reprise ever fires on) and a non-empty discard pile
 * must call `onReprisalNeeded` instead of `onApply`, so the panel can pop its
 * picker. Every other combination (no reprise mechanic, empty discard, or
 * the FREE/no-die face) must go straight to `onApply`, unchanged.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
    initializeCombatEncounter, rollEncounterDice, draftStanceDie,
    registerSandboxCards, clearSandboxCards,
} from '@mechanics';
import type { Card, CombatEncounterState, CombatDieColor } from '@mechanics';
import { CombatBoard, type DragController } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

const CARDS = ['second-thoughts', 'slippery-slope'];

const noopDrag = (): DragController =>
    ({ begin: () => undefined, move: () => undefined, end: () => undefined, active: null } as unknown as DragController);

const boardCallbacks = () => ({
    onApply: jest.fn(), onStage: jest.fn(), onUnstage: jest.fn(), onDiscard: jest.fn(),
    onSignature: jest.fn(), onEndPhase: jest.fn(), onInspect: jest.fn(),
    onReprisalNeeded: jest.fn(),
});

/** Rolls dice, forces the pool to a known color, and drafts die 0 — mirrors
 *  the mechanics e2e `openAndDraft` helper so `vm.drafted` is a usable die. */
function openAndDraft(player: ReturnType<typeof buildPlayer>, deck: string[], die: CombatDieColor): CombatEncounterState {
    let s = initializeCombatEncounter(player, createMockEncounterEnemy(), deck, 7);
    s = rollEncounterDice(s).state;
    const turn = s.turn || 1;
    const dice = [die, 'x' as const].map((c, i) => ({
        id: `t${turn}-d${i}`, color: c, state: (c === 'x' ? 'locked' : 'available') as 'locked' | 'available', temporary: false,
    }));
    s = { ...s, dice, draftedDieId: null, turn };
    s = draftStanceDie(s, s.dice[0].id).state;
    return s;
}

function buildPlayer(store: ReturnType<typeof withAllProviders>['store']) {
    const base = store.getState().player;
    return { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };
}

afterEach(() => { jest.clearAllMocks(); });

describe('CombatBoard — REPRISE songbook interception', () => {
    it('calls onReprisalNeeded (not onApply) for a powered reprise card with a non-empty discard', () => {
        const { store } = withAllProviders(<></>);
        const player = buildPlayer(store);
        let s = openAndDraft(player, CARDS, 'mind'); // second-thoughts is philosophicalAspect 'mind'
        s = { ...s, discard: ['recurring-symptom'] };
        const vm = buildCombatViewModel(s);
        const uid = vm.hand.find(c => c.cardId === 'second-thoughts')!.uid;

        const cbs = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[uid]} {...cbs} />,
            { store },
        );
        render(tree);

        fireEvent.press(screen.getByTestId(`combat-apply-${uid}`));

        expect(cbs.onReprisalNeeded).toHaveBeenCalledTimes(1);
        expect(cbs.onReprisalNeeded).toHaveBeenCalledWith(uid, null, true, undefined);
        expect(cbs.onApply).not.toHaveBeenCalled();
    });

    it('holds the deferred play (nothing consumed): a second APPLY re-defers with identical args, so a panel cancel restores the pre-play state', () => {
        const { store } = withAllProviders(<></>);
        const player = buildPlayer(store);
        let s = openAndDraft(player, CARDS, 'mind');
        s = { ...s, discard: ['recurring-symptom'] };
        const vm = buildCombatViewModel(s);
        const uid = vm.hand.find(c => c.cardId === 'second-thoughts')!.uid;

        const cbs = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[uid]} {...cbs} />,
            { store },
        );
        render(tree);

        // First APPLY defers; the board must NOT clear its staging bookkeeping
        // (the panel's backdrop can cancel). A second APPLY therefore defers
        // again, byte-identical — proof the play was held, not half-committed.
        fireEvent.press(screen.getByTestId(`combat-apply-${uid}`));
        fireEvent.press(screen.getByTestId(`combat-apply-${uid}`));

        expect(cbs.onReprisalNeeded).toHaveBeenCalledTimes(2);
        expect(cbs.onReprisalNeeded).toHaveBeenNthCalledWith(1, uid, null, true, undefined);
        expect(cbs.onReprisalNeeded).toHaveBeenNthCalledWith(2, uid, null, true, undefined);
        expect(cbs.onApply).not.toHaveBeenCalled();
    });

    it('threads the chosen X through the deferral (a deferred X-card must not fall back to min X)', () => {
        // No library card carries both `reprise` and `recoil_x` today — author
        // a sandbox one so the combination stays covered as sets grow.
        const xReprise: Card = {
            id: 'test-x-reprise',
            theme: 'grave',
            name: 'Test X Reprise',
            philosophicalAspect: 'mind',
            description: 'Board-test fixture: REPRISE + chosen-X on one card.',
            tier: 1, rank: 2, cardType: 'spell',
            targetType: 'enemy',
            free: {},
            specialMechanics: [
                { kind: 'reprise', count: 1 },
                { kind: 'recoil_x', min: 3, poisonPerX: 1 / 3 },
            ],
            addedIn: '2026-07-12',
            tags: ['test'],
        };
        clearSandboxCards();
        registerSandboxCards([xReprise]);
        try {
            const { store } = withAllProviders(<></>);
            const player = { ...buildPlayer(store), knownCards: [...CARDS, xReprise.id] };
            let s = openAndDraft(player, [xReprise.id, 'slippery-slope'], 'mind');
            s = { ...s, discard: ['recurring-symptom'] };
            const vm = buildCombatViewModel(s);
            const card = vm.hand.find(c => c.cardId === xReprise.id)!;
            expect(card.chooseX).not.toBeNull(); // the stepper is live
            const uid = card.uid;

            const cbs = boardCallbacks();
            const { tree } = withAllProviders(
                <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[uid]} {...cbs} />,
                { store },
            );
            render(tree);

            // Step X up from the printed min, then APPLY: the deferral must
            // carry the stepped X, not silently drop it to the min.
            fireEvent.press(screen.getByTestId(`combat-choose-x-plus-${uid}`));
            fireEvent.press(screen.getByTestId(`combat-apply-${uid}`));

            expect(cbs.onReprisalNeeded).toHaveBeenCalledTimes(1);
            expect(cbs.onReprisalNeeded).toHaveBeenCalledWith(uid, null, true, card.chooseX!.min + 1);
            expect(cbs.onApply).not.toHaveBeenCalled();
        } finally {
            clearSandboxCards();
        }
    });

    it('applies directly when the discard pile is empty (nothing to choose)', () => {
        const { store } = withAllProviders(<></>);
        const player = buildPlayer(store);
        const s = openAndDraft(player, CARDS, 'mind'); // discard starts empty
        const vm = buildCombatViewModel(s);
        const uid = vm.hand.find(c => c.cardId === 'second-thoughts')!.uid;

        const cbs = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[uid]} {...cbs} />,
            { store },
        );
        render(tree);

        fireEvent.press(screen.getByTestId(`combat-apply-${uid}`));

        expect(cbs.onApply).toHaveBeenCalledWith(uid, null, true);
        expect(cbs.onReprisalNeeded).not.toHaveBeenCalled();
    });

    it('applies directly for a non-reprise card even with a non-empty discard', () => {
        const { store } = withAllProviders(<></>);
        const player = buildPlayer(store);
        // slippery-slope is philosophicalAspect 'body' — the drafted die must
        // match it: THE COLOR LAW gate (2026-07-12) demotes an off-color
        // drafted die to the FREE action instead of routing a fizzle.
        let s = openAndDraft(player, CARDS, 'body');
        s = { ...s, discard: ['recurring-symptom'] };
        const vm = buildCombatViewModel(s);
        const uid = vm.hand.find(c => c.cardId === 'slippery-slope')!.uid;

        const cbs = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[uid]} {...cbs} />,
            { store },
        );
        render(tree);

        fireEvent.press(screen.getByTestId(`combat-apply-${uid}`));

        expect(cbs.onApply).toHaveBeenCalledWith(uid, null, true);
        expect(cbs.onReprisalNeeded).not.toHaveBeenCalled();
    });
});
