/**
 * CombatBoard — the SUMMON brood's chips (phase 102).
 *
 * The engine ships SUMMON whole: adds spawn, bite every threat phase outside
 * the `!hindered` gate, and are cleared by the priced `strikeAdd`. None of that
 * is a feature until the player can SEE the bodies and reach the verb — an
 * engine-only ship would be a foe that quietly drains VITAE with nothing on
 * screen to explain it or answer it. This suite is the pin that the surface
 * exists and reports what the engine is actually doing.
 *
 * Board responsibility only: it renders chips and reports the tap. The panel
 * owns the STRIKE/WAIT sheet and calls `strikeAdd`.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { initializeCombatEncounter, rollEncounterDice, STRIKE_ADD_COST } from '@mechanics';
import type { CombatAdd, CombatEncounterState } from '@mechanics';
import { CombatBoard, type DragController } from '@/components/combat/encounter/CombatBoard';
import { COMBAT_HUD_HEIGHT, COMBAT_HUD_PAD_TOP } from '@/components/combat/encounter/CombatCombatantPane';
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

function buildPlayer(store: ReturnType<typeof withAllProviders>['store']) {
    const base = store.getState().player;
    return { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };
}

function openEncounter(player: ReturnType<typeof buildPlayer>): CombatEncounterState {
    const s = initializeCombatEncounter(player, createMockEncounterEnemy(), CARDS, 7);
    return rollEncounterDice(s).state;
}

/** A brood built by hand — the spawn rule is the engine's business and is
 *  pinned in `summon.engine.test.ts`; this suite is about the surface. */
const brood = (n: number, bite = 4): CombatAdd[] =>
    Array.from({ length: n }, (_unused, i) => ({
        id: `add-x-0-${i}`, name: 'Brier Shoot', vitae: 1, maxVitae: 1, bite,
    }));

afterEach(() => { jest.clearAllMocks(); });

describe('CombatBoard — add chips', () => {
    it('renders one chip per living add, badged with its BITE', () => {
        const { store } = withAllProviders(<></>);
        const s = openEncounter(buildPlayer(store));
        const vm = buildCombatViewModel({ ...s, adds: brood(2, 4), conviction: 12 });

        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...boardCallbacks()} />,
            { store },
        );
        render(tree);

        expect(screen.getByTestId('combat-add-add-x-0-0')).toBeTruthy();
        expect(screen.getByTestId('combat-add-add-x-0-1')).toBeTruthy();
        // The badge is the bite, NOT `1/1` VITAE: every shipped add is 1/1, so a
        // health badge would print the same two characters on every chip forever
        // and tell the player nothing they could act on.
        expect(screen.getAllByText('−4')).toHaveLength(2);
    });

    it('renders no add row at all for the ordinary foe that summons nothing', () => {
        const { store } = withAllProviders(<></>);
        const s = openEncounter(buildPlayer(store));
        const vm = buildCombatViewModel(s);

        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...boardCallbacks()} />,
            { store },
        );
        render(tree);

        // `state.adds` is absent on every foe but the summoner, so this is the
        // path virtually every fight takes. It must cost nothing and crash nowhere.
        expect(screen.queryByTestId('combat-add-row')).toBeNull();
        expect(vm.enemy.adds).toEqual([]);
    });

    it('tapping an add chip calls onAdd with that add exactly once, not onChip/onApply', () => {
        const { store } = withAllProviders(<></>);
        const s = openEncounter(buildPlayer(store));
        const vm = buildCombatViewModel({ ...s, adds: brood(1, 6), conviction: 12 });

        const cbs = boardCallbacks();
        const onAdd = jest.fn();
        const onChip = jest.fn();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...cbs} onAdd={onAdd} onChip={onChip} />,
            { store },
        );
        render(tree);

        fireEvent.press(screen.getByTestId('combat-add-add-x-0-0'));

        expect(onAdd).toHaveBeenCalledTimes(1);
        expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: 'add-x-0-0', name: 'Brier Shoot', bite: 6 }));
        // An add is not a status and not a card. Tapping it must not open the
        // keyword plaque or stage anything.
        expect(onChip).not.toHaveBeenCalled();
        expect(cbs.onApply).not.toHaveBeenCalled();
    });

    /**
     * The chip stays TAPPABLE when the player cannot pay. A chip that silently
     * refuses is indistinguishable from a broken one, and the confirm sheet is
     * the only place the price and the shortfall can be read.
     */
    it('still reports the tap when Conviction is short, and marks the chip unaffordable', () => {
        const { store } = withAllProviders(<></>);
        const s = openEncounter(buildPlayer(store));
        const vm = buildCombatViewModel({ ...s, adds: brood(1), conviction: STRIKE_ADD_COST - 1 });

        const onAdd = jest.fn();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...boardCallbacks()} onAdd={onAdd} />,
            { store },
        );
        render(tree);

        expect(vm.enemy.adds[0].affordable).toBe(false);
        expect(vm.enemy.canStrikeAdd).toBe(false);
        fireEvent.press(screen.getByTestId('combat-add-add-x-0-0'));
        expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it('states the bite, the VITAE and the price in the a11y label', () => {
        const { store } = withAllProviders(<></>);
        const s = openEncounter(buildPlayer(store));
        const vm = buildCombatViewModel({ ...s, adds: brood(1, 5), conviction: 12 });

        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...boardCallbacks()} />,
            { store },
        );
        render(tree);

        const label = screen.getByTestId('combat-add-add-x-0-0').props.accessibilityLabel;
        expect(label).toMatch(/Brier Shoot/);
        expect(label).toMatch(/1 of 1 VITAE/);
        expect(label).toMatch(/bites you for 5 every phase/);
        expect(label).toMatch(new RegExp(`strike it down for ${STRIKE_ADD_COST} Conviction`));
    });

    it('names the shortfall rather than the action when the price cannot be paid', () => {
        const { store } = withAllProviders(<></>);
        const s = openEncounter(buildPlayer(store));
        const vm = buildCombatViewModel({ ...s, adds: brood(1), conviction: 0 });

        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...boardCallbacks()} />,
            { store },
        );
        render(tree);

        const label = screen.getByTestId('combat-add-add-x-0-0').props.accessibilityLabel;
        expect(label).toMatch(/cannot strike it down yet/i);
        expect(label).toMatch(new RegExp(`costs ${STRIKE_ADD_COST} Conviction`));
    });
});

describe('the add VM forwards engine truth rather than restating it', () => {
    /**
     * The presenter must not compute the bite. The engine resolves adds outside
     * the threat loop's multiplier stack expressly so the printed number IS the
     * applied number; a presenter that scaled, rounded or projected it would
     * reintroduce exactly the drift that design decision exists to make
     * impossible.
     */
    it('prints the engine’s bite verbatim, whatever the foe’s other multipliers are', () => {
        const { store } = withAllProviders(<></>);
        const s = openEncounter(buildPlayer(store));
        const adds = brood(2, 7);
        const vm = buildCombatViewModel({
            ...s, adds, conviction: 12,
            // Terms that DO scale the foe's own telegraph. None may touch the bite.
            stageThreatBonus: 9, enemyThreatMult: 2,
        } as CombatEncounterState);

        expect(vm.enemy.adds.map((a) => a.bite)).toEqual([7, 7]);
    });

    it('quotes the engine’s own price rather than a copied literal', () => {
        const { store } = withAllProviders(<></>);
        const s = openEncounter(buildPlayer(store));
        const vm = buildCombatViewModel({ ...s, adds: brood(1), conviction: 12 });

        expect(vm.enemy.strikeAddCost).toBe(STRIKE_ADD_COST);
        expect(vm.enemy.adds[0].cost).toBe(STRIKE_ADD_COST);
    });
});

describe('the enemy figure clears the HUD the brood grew', () => {
    /**
     * Phase 102 §1.6 called this a prerequisite and the ship dropped it: the
     * figure's wrap was anchored to the static `COMBAT_HUD_HEIGHT` estimate
     * while every other HUD-adjacent sibling (the board's dock spacer, the LOG
     * toggle, the tutorial coach) had already moved to the measured height. The
     * brood's chip row is what made that gap visible — it stacks a fourth row
     * into `hudRight` — but the chips are right-aligned chrome and measured 0%
     * over the foe's art. What actually crosses the figure is the HUD's
     * FULL-WIDTH block: the name row, the VITAE bar and the alt-win meters
     * (FLAY + DOT together reach ~47% of the drawn art). So the anchor tracks
     * that block, not the whole HUD — anchoring to the whole HUD would pull the
     * top down past the narrow chip column too and collapse the foe to a
     * thumbnail.
     *
     * The assertion is arithmetic on the height fed into the layout event, so
     * re-tuning any meter's own height cannot repeal it. It fails only when the
     * figure stops tracking the block — a guard, not a pinned pixel.
     */
    it('anchors the figure under the HUD’s measured full-width block, not the static estimate', () => {
        const { store } = withAllProviders(<></>);
        const s = openEncounter(buildPlayer(store));
        const vm = buildCombatViewModel({ ...s, adds: brood(2), conviction: 12 });
        // The row's stated configuration: both alt-win meters live above the
        // brood's chip row, so the full-width block is at its tallest.
        const withMeters = {
            ...vm,
            enemy: { ...vm.enemy, swayVisible: true, premiseVisible: true },
        };

        const { tree } = withAllProviders(
            <CombatBoard vm={withMeters} drag={noopDrag()} stagedUids={[]} {...boardCallbacks()} />,
            { store },
        );
        render(tree);

        const topOf = () => (StyleSheet.flatten(
            screen.getByTestId('combat-enemy-figure-wrap').props.style,
        ) as Record<string, unknown>).top;

        // Before any layout pass lands, the static constant is the fallback —
        // imported, never a copied literal.
        expect(topOf()).toBe(COMBAT_HUD_HEIGHT - 14);

        // No SafeAreaProvider in tests → topInset 0 (same as the LOG toggle's
        // measured-height guard in `CombatEncounterPanel.log.test.tsx`).
        const blockH = 131;
        act(() => {
            fireEvent(screen.getByTestId('combat-hud-block'), 'layout', {
                nativeEvent: { layout: { x: 0, y: 0, width: 375, height: blockH } },
            });
        });

        expect(topOf()).toBe(COMBAT_HUD_PAD_TOP + blockH - 14);
        expect(topOf()).not.toBe(COMBAT_HUD_HEIGHT - 14);
    });
});
