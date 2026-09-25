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

import { initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import { CombatBoard, type DragController } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';
import { tapCombatDie } from '@/test-utils/tapCombatDie';

// Spec 32 v3 fixtures: two Affliction DoTs, the Bulwark guard, a Charm sway.
const CARDS = ['spoiled-poultice', 'unction-of-boils', 'frostbitten-palisade', 'thin-hymn'];

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
        const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };

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
        const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };

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

        // Each staged card was committed (no die chosen here → FREE apply)...
        expect(cbs.onApply).toHaveBeenCalledTimes(2);
        for (const uid of uids) expect(cbs.onApply).toHaveBeenCalledWith(uid, null, false);
        // ...and only then did the phase resolve.
        expect(cbs.onEndPhase).toHaveBeenCalledTimes(1);
    });

    // WI-3 — a threat phase resolving must lock the END button: a touch
    // double-tap used to machine-gun `onEndPhase`, resolving several phases with
    // zero player turns between them (2026-07-12 playtest). The board renders the
    // button disabled and its handler no-ops while `resolving`.
    it('END PHASE is disabled + press-inert while a phase is resolving', () => {
        const { store } = withAllProviders(<></>);
        const base = store.getState().player;
        const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };

        let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
        s = rollEncounterDice(s).state;
        const vm = buildCombatViewModel(s);
        const uids = [vm.hand[0].uid, vm.hand[1].uid];
        const cbs = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={uids} {...cbs} resolving />,
            { store },
        );
        render(tree);

        const btn = screen.getByTestId('combat-end-phase');
        expect(btn.props.accessibilityState?.disabled).toBe(true);
        fireEvent.press(btn);
        // Neither the resolve nor the auto-apply of staged cards fires again.
        expect(cbs.onEndPhase).not.toHaveBeenCalled();
        expect(cbs.onApply).not.toHaveBeenCalled();
    });

    it('renders the empty play area (no staged cards) when stagedUids is empty', () => {
        const { store } = withAllProviders(<></>);
        const base = store.getState().player;
        const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };

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
    // (c) A chosen die lights up EXACTLY ONE staged card — the one it was
    // dropped on — never every staged card at once, and staging a second card
    // afterwards never shares or moves it.
    it('a chosen die arms exactly ONE staged card (one staged-die slot)', async () => {
        const { store } = withAllProviders(<></>);
        const base = store.getState().player;
        const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };

        let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
        s = rollEncounterDice(s).state;
        // A live WILD mana die powers any card, so the only thing limiting the
        // arming is the one-die-one-card law itself.
        const first = s.dice.findIndex((d) => d.state === 'available' && !d.floating && d.face !== 'miss');
        expect(first).toBeGreaterThanOrEqual(0);
        s = { ...s, dice: s.dice.map((d, i) => (i === first ? { ...d, color: 'wild' as const, face: 'mana' as const } : d)) };
        const dieId = s.dice[first].id;
        const vm = buildCombatViewModel(s);
        const uids = [vm.hand[0].uid, vm.hand[1].uid];

        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[uids[0]]} {...boardCallbacks()} />,
            { store },
        );
        const view = render(tree);
        await tapCombatDie(dieId);
        expect(screen.getAllByTestId('combat-staged-die')).toHaveLength(1);

        // Stage the second card: the die stays on the first — still ONE slot.
        const { tree: tree2 } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={uids} {...boardCallbacks()} />,
            { store },
        );
        view.rerender(tree2);
        expect(screen.getAllByTestId('combat-staged-die')).toHaveLength(1);
        expect(screen.getByTestId(`combat-socket-${uids[1]}`)).toBeTruthy();
    });

    // (c) The DoT face VM is legible — never the user-rejected 'n/t·t' bare-slash
    // per-turn form. WI-2: an event DoT (poison=card-played / bleed=damage-instance)
    // reads its real trigger ("2/play", "per card you play · Nt"); a round-clock DoT
    // still reads "N over M turns". Both are legible; the rejected "N/t" is not.
    it('the DoT VM reads its real trigger (event) or lifetime (round-clock), never n/t·t', () => {
        const { store } = withAllProviders(<></>);
        const base = store.getState().player;
        const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };

        let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
        s = rollEncounterDice(s).state;
        const vm = buildCombatViewModel(s);
        const dot = vm.hand.find((c) => c.face.kind === 'dot');
        expect(dot).toBeTruthy();
        // Event face ("2/play") OR round-clock face (pure integer total).
        expect(dot!.face.heroText).toMatch(/^\d+(\/(play|hit|payoff))?$/);
        expect(dot!.face.heroSub).toMatch(
            /^(over \d+ turns|per card you play · \d+t|per hit taken · \d+ stacks?|per payoff you detonate · \d+t)$/,
        );
        // Never the rejected per-turn bare-slash notation.
        expect(dot!.face.heroText).not.toMatch(/\d+\/t\b/);
        expect(`${dot!.face.heroSub}`).not.toMatch(/\d+\/t\b/);
        // HP→VITAE: the verb line never says HP.
        expect(dot!.face.verbLine).not.toMatch(/\bHP\b/);
    });
});
