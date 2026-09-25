/**
 * CombatBoard — REPRISE songbook interception (phase 28).
 *
 * APPLYing a staged `reprise`-mechanic card with a chosen die (a POWERED
 * play — the only face reprise ever fires on) and a non-empty discard pile
 * must call `onReprisalNeeded` instead of `onApply`, so the panel can pop its
 * picker. Every other combination (no reprise mechanic, empty discard, or
 * the FREE/no-die face) must go straight to `onApply`, unchanged.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
    initializeCombatEncounter, rollEncounterDice,
    registerSandboxCards, clearSandboxCards,
} from '@mechanics';
import type { Card, CombatEncounterState } from '@mechanics';
import { CombatBoard, type DragController } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';
import { tapCombatDie } from '@/test-utils/tapCombatDie';

const CARDS = ['shallow-grave', 'spoiled-poultice'];

const noopDrag = (): DragController =>
    ({ begin: () => undefined, move: () => undefined, end: () => undefined, active: null } as unknown as DragController);

const boardCallbacks = () => ({
    onApply: jest.fn(), onStage: jest.fn(), onUnstage: jest.fn(), onDiscard: jest.fn(),
    onSignature: jest.fn(), onEndPhase: jest.fn(), onInspect: jest.fn(),
    onReprisalNeeded: jest.fn(),
});

/** The one tray die these fixtures hand the player. */
const DIE = 't1-u-power';

/** Rolls dice, then replaces the tray with ONE live MANA die matching
 *  `cardId`'s colour — so choosing it (`tapCombatDie(DIE)`) makes the staged
 *  card's APPLY a POWERED, colour-legal play. */
function openWithDie(player: ReturnType<typeof buildPlayer>, deck: string[], cardId: string): CombatEncounterState {
    let s = initializeCombatEncounter(player, createMockEncounterEnemy(), deck, 7);
    s = rollEncounterDice(s).state;
    const stance = buildCombatViewModel(s).hand.find(c => c.cardId === cardId)!.stance;
    const color = stance === 'any' ? 'wild' : stance;
    return { ...s, dice: [{ id: DIE, color: color as 'heart' | 'body' | 'mind' | 'wild', face: 'mana', state: 'available', temporary: false }] };
}

function buildPlayer(store: ReturnType<typeof withAllProviders>['store']) {
    const base = store.getState().player;
    return { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };
}

afterEach(() => { jest.clearAllMocks(); });

describe('CombatBoard — REPRISE songbook interception', () => {
    it('calls onReprisalNeeded (not onApply) for a powered reprise card with a non-empty discard', async () => {
        const { store } = withAllProviders(<></>);
        const player = buildPlayer(store);
        let s = openWithDie(player, CARDS, 'shallow-grave');
        s = { ...s, discard: ['unction-of-boils'] };
        const vm = buildCombatViewModel(s);
        const uid = vm.hand.find(c => c.cardId === 'shallow-grave')!.uid;

        const cbs = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[uid]} {...cbs} />,
            { store },
        );
        render(tree);
        await tapCombatDie(DIE);

        fireEvent.press(screen.getByTestId(`combat-apply-${uid}`));

        expect(cbs.onReprisalNeeded).toHaveBeenCalledTimes(1);
        expect(cbs.onReprisalNeeded).toHaveBeenCalledWith(uid, DIE, true, undefined);
        expect(cbs.onApply).not.toHaveBeenCalled();
    });

    it('holds the deferred play (nothing consumed): a second APPLY re-defers with identical args, so a panel cancel restores the pre-play state', async () => {
        const { store } = withAllProviders(<></>);
        const player = buildPlayer(store);
        let s = openWithDie(player, CARDS, 'shallow-grave');
        s = { ...s, discard: ['unction-of-boils'] };
        const vm = buildCombatViewModel(s);
        const uid = vm.hand.find(c => c.cardId === 'shallow-grave')!.uid;

        const cbs = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[uid]} {...cbs} />,
            { store },
        );
        render(tree);
        await tapCombatDie(DIE);

        // First APPLY defers; the board must NOT clear its staging bookkeeping
        // (the panel's backdrop can cancel). A second APPLY therefore defers
        // again, byte-identical — proof the play was held, not half-committed.
        fireEvent.press(screen.getByTestId(`combat-apply-${uid}`));
        fireEvent.press(screen.getByTestId(`combat-apply-${uid}`));

        expect(cbs.onReprisalNeeded).toHaveBeenCalledTimes(2);
        expect(cbs.onReprisalNeeded).toHaveBeenNthCalledWith(1, uid, DIE, true, undefined);
        expect(cbs.onReprisalNeeded).toHaveBeenNthCalledWith(2, uid, DIE, true, undefined);
        expect(cbs.onApply).not.toHaveBeenCalled();
    });

    it('threads the chosen X through the deferral (a deferred X-card must not fall back to min X)', async () => {
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
            let s = openWithDie(player, [xReprise.id, 'spoiled-poultice'], xReprise.id);
            s = { ...s, discard: ['unction-of-boils'] };
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
            await tapCombatDie(DIE);

            // Step X up from the printed min, then APPLY: the deferral must
            // carry the stepped X, not silently drop it to the min.
            fireEvent.press(screen.getByTestId(`combat-choose-x-plus-${uid}`));
            fireEvent.press(screen.getByTestId(`combat-apply-${uid}`));

            expect(cbs.onReprisalNeeded).toHaveBeenCalledTimes(1);
            expect(cbs.onReprisalNeeded).toHaveBeenCalledWith(uid, DIE, true, card.chooseX!.min + 1);
            expect(cbs.onApply).not.toHaveBeenCalled();
        } finally {
            clearSandboxCards();
        }
    });

    it('applies directly when the discard pile is empty (nothing to choose)', async () => {
        const { store } = withAllProviders(<></>);
        const player = buildPlayer(store);
        const s = openWithDie(player, CARDS, 'shallow-grave'); // discard starts empty
        const vm = buildCombatViewModel(s);
        const uid = vm.hand.find(c => c.cardId === 'shallow-grave')!.uid;

        const cbs = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[uid]} {...cbs} />,
            { store },
        );
        render(tree);
        await tapCombatDie(DIE);

        fireEvent.press(screen.getByTestId(`combat-apply-${uid}`));

        expect(cbs.onApply).toHaveBeenCalledWith(uid, DIE, true);
        expect(cbs.onReprisalNeeded).not.toHaveBeenCalled();
    });

    it('applies directly for a non-reprise card even with a non-empty discard', async () => {
        const { store } = withAllProviders(<></>);
        const player = buildPlayer(store);
        // The die matches spoiled-poultice's colour: THE COLOR LAW gate
        // (2026-07-12) refuses an off-color die, which would demote the play
        // to FREE and make this assertion pass for the wrong reason.
        let s = openWithDie(player, CARDS, 'spoiled-poultice');
        s = { ...s, discard: ['unction-of-boils'] };
        const vm = buildCombatViewModel(s);
        const uid = vm.hand.find(c => c.cardId === 'spoiled-poultice')!.uid;

        const cbs = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[uid]} {...cbs} />,
            { store },
        );
        render(tree);
        await tapCombatDie(DIE);

        fireEvent.press(screen.getByTestId(`combat-apply-${uid}`));

        expect(cbs.onApply).toHaveBeenCalledWith(uid, DIE, true);
        expect(cbs.onReprisalNeeded).not.toHaveBeenCalled();
    });
});
