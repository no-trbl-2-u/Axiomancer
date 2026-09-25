/**
 * CombatBoard — THE COLOR LAW at the UI gate (owner directive 2026-07-12).
 *
 * The engine's COLOR LAW (`playCombatCard`, axiomancer-mechanics
 * src/Combat/combat.engine.ts ~:1339) fizzles an off-color play at resolution.
 * The board must make that state UNREACHABLE: during a die drag every staged
 * card the die cannot power reads disabled (dimmed), an off-color drop
 * REJECTS (no selection, no dispatch), and APPLY never routes an off-color
 * die at a card (it falls back to the FREE action instead of eating a
 * fizzle). Wild dice stay legal everywhere.
 *
 * The drag/measureInWindow plumbing can't run under jest, so the drop
 * decision is covered through the PURE `resolveDieDropTarget` (exactly what
 * `resolveDrop` feeds with measurements); the APPLY assertions choose a die
 * through the board's real tap-to-power gesture (`tapCombatDie`), which runs
 * the same gate.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
    initializeCombatEncounter, rollEncounterDice, combatDieCanPower,
    type CombatEncounterState, type CombatDieColor,
} from '@mechanics';
import { CombatBoard, resolveDieDropTarget, type DragController } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel, dieCanPowerCardVM, type CombatDieVM } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';
import { tapCombatDie } from '@/test-utils/tapCombatDie';

// Spec 32 v3 fixtures (same as the multistage suite): two Affliction DoTs,
// the Bulwark guard, a Charm sway — a hand guaranteed to span stances.
const CARDS = ['spoiled-poultice', 'unction-of-boils', 'frostbitten-palisade', 'thin-hymn'];
const STANCES = ['heart', 'body', 'mind'] as const;

const noopDrag = (): DragController =>
    ({ begin: () => undefined, end: () => undefined, active: null, x: { value: 0 }, y: { value: 0 } } as unknown as DragController);

/** A drag controller mid-die-drag — what the board sees while a die is in flight. */
const dieDrag = (die: CombatDieVM): DragController =>
    ({
        begin: () => undefined, end: () => undefined,
        active: { type: 'die', dieId: die.id, die },
        x: { value: 0 }, y: { value: 0 },
    } as unknown as DragController);

const ghostDie = (color: string): CombatDieVM =>
    ({
        id: `ghost-${color}`, color, colorHex: '#fff', glyph: '?', stanceLabel: color.toUpperCase(),
        spent: false, isX: color === 'x', draggable: true,
    } as CombatDieVM);

const boardCallbacks = () => ({
    onApply: jest.fn(), onStage: jest.fn(), onUnstage: jest.fn(), onDiscard: jest.fn(),
    onSignature: jest.fn(), onEndPhase: jest.fn(), onInspect: jest.fn(),
});

function freshEncounter(seed = 16): { store: ReturnType<typeof withAllProviders>['store']; s: CombatEncounterState } {
    const { store } = withAllProviders(<></>);
    const base = store.getState().player;
    const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };
    let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, seed);
    s = rollEncounterDice(s).state;
    return { store, s };
}

/** A stance color the card does NOT match (the off-color drag fixture). */
const offColorFor = (stance: string): string => STANCES.find((c) => c !== stance)!;

afterEach(() => { jest.clearAllMocks(); });

// ── The UI mirror of the engine rule ─────────────────────────────────────────

describe('dieCanPowerCardVM — parity with the engine COLOR LAW', () => {
    it('matches combatDieCanPower verdict-for-verdict on every color pairing', () => {
        const dieColors: CombatDieColor[] = ['heart', 'body', 'mind', 'wild', 'x'];
        const cardColors: CombatDieColor[] = ['heart', 'body', 'mind', 'wild'];
        for (const d of dieColors) {
            for (const c of cardColors) {
                expect(dieCanPowerCardVM({ color: d, isX: d === 'x' }, c))
                    .toBe(combatDieCanPower({ id: 'p', color: d, state: 'available', temporary: false }, c));
            }
        }
    });

    it('colored dice power only their color; WILD powers everything; X never drag-powers', () => {
        expect(dieCanPowerCardVM({ color: 'body', isX: false }, 'body')).toBe(true);
        expect(dieCanPowerCardVM({ color: 'body', isX: false }, 'mind')).toBe(false);
        expect(dieCanPowerCardVM({ color: 'mind', isX: false }, 'heart')).toBe(false);
        for (const stance of STANCES) expect(dieCanPowerCardVM({ color: 'wild', isX: false }, stance)).toBe(true);
        expect(dieCanPowerCardVM({ color: 'x', isX: true }, 'body')).toBe(false);
    });
});

// ── The drop decision (what resolveDrop dispatches) ──────────────────────────

describe('resolveDieDropTarget — an illegal drop dispatches NOTHING', () => {
    const stanceOf = (uid: string) => ({ 'u-mind': 'mind', 'u-body': 'body' } as Record<string, string>)[uid];

    it('a red (body) die dropped ON a blue (mind) card rejects', () => {
        expect(resolveDieDropTarget(ghostDie('body'), 'u-mind', true, ['u-mind'], stanceOf, {})).toBeNull();
    });

    it('a matching die dropped on its card lands', () => {
        expect(resolveDieDropTarget(ghostDie('mind'), 'u-mind', true, ['u-mind'], stanceOf, {})).toBe('u-mind');
    });

    it('a WILD die drops anywhere', () => {
        expect(resolveDieDropTarget(ghostDie('wild'), 'u-mind', true, ['u-mind', 'u-body'], stanceOf, {})).toBe('u-mind');
        expect(resolveDieDropTarget(ghostDie('wild'), 'u-body', true, ['u-mind', 'u-body'], stanceOf, {})).toBe('u-body');
    });

    it('loose-drop forgiveness only ever lands on a color-legal card', () => {
        // body die, loose drop, [mind, body] staged → lands on the BODY card.
        expect(resolveDieDropTarget(ghostDie('body'), null, true, ['u-mind', 'u-body'], stanceOf, {})).toBe('u-body');
        // only an off-color card staged → nothing.
        expect(resolveDieDropTarget(ghostDie('body'), null, true, ['u-mind'], stanceOf, {})).toBeNull();
    });

    it('a drop outside the play area never lands', () => {
        expect(resolveDieDropTarget(ghostDie('wild'), null, false, ['u-mind', 'u-body'], stanceOf, {})).toBeNull();
    });

    // ── The STAGING LAW (owner directive 2026-07-12): a card already carrying
    // a dropped die rejects further drops — exactly like an off-color card. ──
    it('a direct hit on an already-armed card REJECTS, even color-legal', () => {
        expect(resolveDieDropTarget(ghostDie('body'), 'u-body', true, ['u-body'], stanceOf, { 'u-body': 'die-1' })).toBeNull();
        expect(resolveDieDropTarget(ghostDie('wild'), 'u-body', true, ['u-body'], stanceOf, { 'u-body': 'die-1' })).toBeNull();
    });

    it('loose-drop forgiveness skips armed cards; all armed → nothing lands', () => {
        // body die, loose drop, body card armed + mind card open → the open
        // card is off-color → nothing lands.
        expect(resolveDieDropTarget(ghostDie('body'), null, true, ['u-body', 'u-mind'], stanceOf, { 'u-body': 'die-1' })).toBeNull();
        // wild die: the armed body card is skipped, the open mind card takes it.
        expect(resolveDieDropTarget(ghostDie('wild'), null, true, ['u-body', 'u-mind'], stanceOf, { 'u-body': 'die-1' })).toBe('u-mind');
        // every staged card armed → the die snaps home.
        expect(resolveDieDropTarget(ghostDie('wild'), null, true, ['u-body', 'u-mind'], stanceOf, { 'u-body': 'die-1', 'u-mind': 'die-2' })).toBeNull();
    });
});

// ── Render: the drag-time affordance ─────────────────────────────────────────

describe('CombatBoard — staged cards read disabled while an off-color die is in flight', () => {
    it('an off-color drag disables the card; a matching card stays enabled', () => {
        const { store, s } = freshEncounter();
        const vm = buildCombatViewModel(s);
        expect(vm.hand.length).toBeGreaterThanOrEqual(2);
        const card = vm.hand[0];
        const off = offColorFor(card.stance);

        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={dieDrag(ghostDie(off))} stagedUids={[card.uid]} {...boardCallbacks()} />,
            { store },
        );
        render(tree);

        // "a red-die drop on a blue card … the card reads disabled during the drag"
        expect(screen.getByTestId(`combat-staged-${card.uid}`).props.accessibilityState)
            .toEqual({ disabled: true });
        // and its socket does not invite the drop.
        expect(screen.getByTestId(`combat-socket-${card.uid}`)).toBeTruthy();
    });

    it('a MATCHING die drag leaves the card enabled', () => {
        const { store, s } = freshEncounter();
        const vm = buildCombatViewModel(s);
        const card = vm.hand[0];

        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={dieDrag(ghostDie(card.stance))} stagedUids={[card.uid]} {...boardCallbacks()} />,
            { store },
        );
        render(tree);
        expect(screen.getByTestId(`combat-staged-${card.uid}`).props.accessibilityState)
            .toEqual({ disabled: false });
    });

    it('a WILD die drag disables NO staged card', () => {
        const { store, s } = freshEncounter();
        const vm = buildCombatViewModel(s);
        const uids = [vm.hand[0].uid, vm.hand[1].uid];

        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={dieDrag(ghostDie('wild'))} stagedUids={uids} {...boardCallbacks()} />,
            { store },
        );
        render(tree);
        for (const uid of uids) {
            expect(screen.getByTestId(`combat-staged-${uid}`).props.accessibilityState)
                .toEqual({ disabled: false });
        }
    });
});

// ── APPLY routing: an off-color die never powers ─────────────────────────────

describe('CombatBoard — APPLY never routes an off-color die', () => {
    /** Recolor the first live tray die to `color` (a MANA face, so it powers)
     *  — a pure-state override giving the board a die of a KNOWN color. */
    function withTrayDie(s: CombatEncounterState, color: CombatDieColor): { s: CombatEncounterState; dieId: string } {
        const first = s.dice.findIndex((d) => d.state === 'available' && !d.floating && d.face !== 'miss');
        expect(first).toBeGreaterThanOrEqual(0);
        const dice = s.dice.map((d, i) => (i === first ? { ...d, color, face: 'mana' as const } : d));
        return { s: { ...s, dice }, dieId: dice[first].id };
    }

    function renderStaged(s: CombatEncounterState, uid: string, store: ReturnType<typeof withAllProviders>['store']) {
        const vm = buildCombatViewModel(s);
        const cbs = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[uid]} {...cbs} />,
            { store },
        );
        render(tree);
        return cbs;
    }

    it('an off-color die is refused → APPLY dispatches the FREE action (no die, no fizzle)', async () => {
        const { store, s: s0 } = freshEncounter();
        const card = buildCombatViewModel(s0).hand[0];
        const { s, dieId } = withTrayDie(s0, offColorFor(card.stance) as CombatDieColor);
        const cbs = renderStaged(s, card.uid, store);

        // The player chooses the off-color die: the gate refuses it…
        await tapCombatDie(dieId);
        expect(screen.queryByTestId('combat-staged-die')).toBeNull();
        // …and APPLY commits the FREE action instead of routing the die at it.
        fireEvent.press(screen.getByTestId(`combat-apply-${card.uid}`));
        expect(cbs.onApply).toHaveBeenCalledTimes(1);
        expect(cbs.onApply).toHaveBeenCalledWith(card.uid, null, false);
    });

    it('a matching die → APPLY powers the card with that EXPLICIT die', async () => {
        const { store, s: s0 } = freshEncounter();
        const card = buildCombatViewModel(s0).hand[0];
        const { s, dieId } = withTrayDie(s0, card.stance as CombatDieColor);
        const cbs = renderStaged(s, card.uid, store);

        await tapCombatDie(dieId);
        expect(screen.getByTestId('combat-staged-die')).toBeTruthy();
        fireEvent.press(screen.getByTestId(`combat-apply-${card.uid}`));
        expect(cbs.onApply).toHaveBeenCalledWith(card.uid, dieId, true);
    });

    it('a WILD die → powers any staged card', async () => {
        const { store, s: s0 } = freshEncounter();
        const card = buildCombatViewModel(s0).hand[0];
        const { s, dieId } = withTrayDie(s0, 'wild');
        const cbs = renderStaged(s, card.uid, store);

        await tapCombatDie(dieId);
        fireEvent.press(screen.getByTestId(`combat-apply-${card.uid}`));
        expect(cbs.onApply).toHaveBeenCalledWith(card.uid, dieId, true);
    });

    it('no die chosen → APPLY is FREE — nothing auto-attaches, even a matching die', () => {
        const { store, s: s0 } = freshEncounter();
        const card = buildCombatViewModel(s0).hand[0];
        const { s } = withTrayDie(s0, card.stance as CombatDieColor);
        const cbs = renderStaged(s, card.uid, store);

        expect(screen.queryByTestId('combat-staged-die')).toBeNull();
        fireEvent.press(screen.getByTestId(`combat-apply-${card.uid}`));
        expect(cbs.onApply).toHaveBeenCalledWith(card.uid, null, false);
    });

    it('END PHASE batch honors the law too: a refused off-color die auto-applies FREE', async () => {
        const { store, s: s0 } = freshEncounter();
        const card = buildCombatViewModel(s0).hand[0];
        const { s, dieId } = withTrayDie(s0, offColorFor(card.stance) as CombatDieColor);
        const cbs = renderStaged(s, card.uid, store);

        await tapCombatDie(dieId);
        fireEvent.press(screen.getByTestId('combat-end-phase'));
        expect(cbs.onApply).toHaveBeenCalledWith(card.uid, null, false);
        expect(cbs.onEndPhase).toHaveBeenCalledTimes(1);
    });

    it('END PHASE batch commits a chosen matching die POWERED', async () => {
        const { store, s: s0 } = freshEncounter();
        const card = buildCombatViewModel(s0).hand[0];
        const { s, dieId } = withTrayDie(s0, card.stance as CombatDieColor);
        const cbs = renderStaged(s, card.uid, store);

        await tapCombatDie(dieId);
        fireEvent.press(screen.getByTestId('combat-end-phase'));
        expect(cbs.onApply).toHaveBeenCalledWith(card.uid, dieId, true);
        expect(cbs.onEndPhase).toHaveBeenCalledTimes(1);
    });
});
