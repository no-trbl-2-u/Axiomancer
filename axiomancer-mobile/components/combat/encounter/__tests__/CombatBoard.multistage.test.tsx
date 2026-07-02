/**
 * CombatBoard — multi-card staging (2026-06-22).
 *
 * The board now accepts `stagedUids: string[]` (was a single `stagedUid`) so the
 * player can stage SEVERAL cards at once, hazard-style — each renders its own
 * staged frame + die slot + APPLY. The drag/drop + per-card die-drop path uses
 * gestures + `measureInWindow`, which jest can't drive; this asserts the pure
 * render logic: given N staged uids, N staged cards render and the count shows.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { initializeCombatEncounter, rollEncounterDice, draftStanceDie } from 'axiomancer-mechanics';
import { CombatBoard, type DragController } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

const SKILLS = ['slippery-slope', 'eternal-regress', 'achilles-gambit', 'befriend'];

const noopDrag = (): DragController =>
    ({ begin: () => undefined, move: () => undefined, end: () => undefined, active: null } as unknown as DragController);

const boardCallbacks = () => ({
    onApply: jest.fn(), onStage: jest.fn(), onUnstage: jest.fn(), onDiscard: jest.fn(),
    onSignature: jest.fn(), onEndPhase: jest.fn(), onInspect: jest.fn(),
});

afterEach(() => { jest.clearAllMocks(); });

describe('CombatBoard — multi-card staging', () => {
    it('renders one staged frame per uid in stagedUids and shows the count', () => {
        const { store } = withAllProviders(<></>);
        const base = store.getState().player;
        const player = { ...base, knownSkills: SKILLS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };

        let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
        s = rollEncounterDice(s).state;
        const vm = buildCombatViewModel(s);
        expect(vm.hand.length).toBeGreaterThanOrEqual(2);

        const uids = [vm.hand[0].uid, vm.hand[1].uid];
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={uids} {...boardCallbacks()} />,
            { store },
        );
        render(tree);

        // Both staged cards render (was impossible with the old single-staged board),
        // each with its own APPLY ribbon (the 2026-07 polish dropped the text count —
        // the staged row itself is the count).
        expect(screen.getByTestId(`combat-staged-${uids[0]}`)).toBeTruthy();
        expect(screen.getByTestId(`combat-staged-${uids[1]}`)).toBeTruthy();
        expect(screen.getByTestId(`combat-apply-${uids[0]}`)).toBeTruthy();
        expect(screen.getByTestId(`combat-apply-${uids[1]}`)).toBeTruthy();
    });

    // END PHASE is a COMMIT, not a discard: any card still staged when the player
    // hits END PHASE must be auto-APPLYd (never silently dropped) before the phase
    // resolves. Regression guard for the "staged cards vanish on END PHASE" bug.
    it('END PHASE auto-applies every still-staged card, then resolves the phase', () => {
        const { store } = withAllProviders(<></>);
        const base = store.getState().player;
        const player = { ...base, knownSkills: SKILLS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };

        let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
        s = rollEncounterDice(s).state;
        const vm = buildCombatViewModel(s);
        expect(vm.hand.length).toBeGreaterThanOrEqual(2);

        const uids = [vm.hand[0].uid, vm.hand[1].uid];
        const cbs = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={uids} {...cbs} />,
            { store },
        );
        render(tree);

        fireEvent.press(screen.getByTestId('combat-end-phase'));

        // Each staged card was committed (no drafted/dropped die here → FREE apply)...
        expect(cbs.onApply).toHaveBeenCalledTimes(2);
        for (const uid of uids) expect(cbs.onApply).toHaveBeenCalledWith(uid, null, false);
        // ...and only then did the phase resolve.
        expect(cbs.onEndPhase).toHaveBeenCalledTimes(1);
    });

    it('renders the empty play area (no staged cards) when stagedUids is empty', () => {
        const { store } = withAllProviders(<></>);
        const base = store.getState().player;
        const player = { ...base, knownSkills: SKILLS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };

        let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
        s = rollEncounterDice(s).state;
        const vm = buildCombatViewModel(s);

        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...boardCallbacks()} />,
            { store },
        );
        render(tree);

        expect(screen.getByTestId('combat-play-area')).toBeTruthy();
        expect(screen.queryByTestId(`combat-staged-${vm.hand[0].uid}`)).toBeNull();
    });
});

// ── Invariants (locked, not brittle snapshots) ───────────────────────────────
describe('CombatBoard — die-attribution + DoT-notation invariants', () => {
    // (c) A single drafted (combo) die must light up EXACTLY ONE staged card — the
    // next-to-consume comboTarget — never every staged card at once.
    it('the shared drafted die arms exactly ONE staged card (one staged-die slot)', () => {
        const { store } = withAllProviders(<></>);
        const base = store.getState().player;
        const player = { ...base, knownSkills: SKILLS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };

        let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
        s = rollEncounterDice(s).state;
        const usable = s.dice.find((d) => d.color !== 'x');
        expect(usable).toBeTruthy();
        s = draftStanceDie(s, usable!.id).state;          // one drafted/combo die exists
        const vm = buildCombatViewModel(s);
        expect(vm.dice.some((d) => d.drafted)).toBe(true);

        const uids = [vm.hand[0].uid, vm.hand[1].uid];
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={uids} {...boardCallbacks()} />,
            { store },
        );
        render(tree);

        // INVARIANT: the combo die shows on the single comboTarget, not on both cards.
        expect(screen.getAllByTestId('combat-staged-die')).toHaveLength(1);
    });

    // (c) The DoT face VM is legible: TOTAL headline + 'over N turns' subtext — never
    // the user-rejected 'n/t·t' / bare-slash form.
    it('the DoT VM yields total + "over N turns", never the rejected n/t·t form', () => {
        const { store } = withAllProviders(<></>);
        const base = store.getState().player;
        const player = { ...base, knownSkills: SKILLS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };

        let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
        s = rollEncounterDice(s).state;
        const vm = buildCombatViewModel(s);
        const dot = vm.hand.find((c) => c.face.kind === 'dot');
        expect(dot).toBeTruthy();
        expect(dot!.face.heroText).toMatch(/^\d+$/);              // pure integer TOTAL
        expect(dot!.face.heroSub).toMatch(/^over \d+ turns$/);    // legible duration subtext
        expect(dot!.face.heroText).not.toMatch(/\/t/);            // never the rejected per-turn slash
        expect(`${dot!.face.heroSub}`).not.toMatch(/\d+\/t/);
    });
});
