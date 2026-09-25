/**
 * CombatBoard — fresh-eyes shard S1-board, confirmed clusters.
 *
 *  C11  The player medallion (bottom-left) and the END stack (bottom-right)
 *       were parked ON the outermost hand cards: the fan ran edge-to-edge at
 *       12pt insets under both. The fan now lays out in the chrome-free band
 *       between them (`handFanLayout`).
 *  C12  The board bled past the viewport's right edge — the END consequence
 *       line was anchored 30pt LEFT of an 80pt disc sitting at right 10, so
 *       its 140pt box ended 20pt off-screen, which the page could scroll to.
 *       The line is anchored inward and the board clips at its own edge.
 *  C19  `StanceChip` (inert) looked exactly like `MomentumChainChip`
 *       (tappable) directly above it. The tappable one now carries a ⓘ mark
 *       and the readout names itself.
 *  C32  `compactFree` fell through to `v.slice(0, 3)` and printed '×4 ' — a
 *       chopped three-character piece of '×4 · 3t', not a value.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import {
    CombatBoard, compactFree, handFanLayout,
    HAND_CARD_W, HAND_FAN_LEFT, HAND_FAN_RIGHT, HAND_FAN_MIN_STEP,
    type DragController,
} from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel, type CombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

const CARDS = ['spoiled-poultice', 'unction-of-boils', 'frostbitten-palisade', 'thin-hymn'];
const PHONE = { width: 390, height: 844, scale: 3, fontScale: 1 };
const INSETS = { top: 47, bottom: 34, left: 0, right: 0 };

// Same pin as CombatBoard.playtest-2026-09-04: `useWindowDimensions` is read
// off the module object at call time, so overriding the export pins the board
// to the phone viewport without mocking all of react-native.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RN = require('react-native') as Record<string, unknown>;
const realUseWindowDimensions = RN.useWindowDimensions;
beforeAll(() => {
    Object.defineProperty(RN, 'useWindowDimensions', { configurable: true, value: () => PHONE });
});
afterAll(() => {
    Object.defineProperty(RN, 'useWindowDimensions', { configurable: true, value: realUseWindowDimensions });
});

const noopDrag = (): DragController =>
    ({ begin: () => undefined, end: () => undefined, active: null, x: { value: 0 }, y: { value: 0 } } as unknown as DragController);

const boardCallbacks = () => ({
    onApply: jest.fn(), onStage: jest.fn(), onUnstage: jest.fn(), onDiscard: jest.fn(),
    onSignature: jest.fn(), onEndPhase: jest.fn(), onInspect: jest.fn(),
});

function freshVM(): { store: ReturnType<typeof withAllProviders>['store']; vm: CombatViewModel } {
    const { store } = withAllProviders(<></>);
    const base = store.getState().player;
    const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 129, maxHealth: 200 };
    let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
    s = rollEncounterDice(s).state;
    return { store, vm: buildCombatViewModel(s) };
}

function renderBoard(shape: (vm: CombatViewModel) => CombatViewModel = (v) => v): CombatViewModel {
    const { store, vm: base } = freshVM();
    const vm = shape(base);
    const { tree } = withAllProviders(
        <SafeAreaInsetsContext.Provider value={INSETS}>
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...boardCallbacks()} />
        </SafeAreaInsetsContext.Provider>,
        { store },
    );
    render(tree);
    return vm;
}

/** A DEAD TRAY (live dice, none of which can power any card in hand) is what
 *  makes END print its consequence line — the one piece of board chrome that
 *  used to reach past the screen's right edge. Every die reads HEART, every
 *  card BODY: no colour-law pairing exists. */
const withDeadTray = (vm: CombatViewModel): CombatViewModel => ({
    ...vm,
    dice: vm.dice.map((d) => ({ ...d, color: 'heart', face: 'mana' as const, spent: false, isX: false, draggable: true })),
    hand: vm.hand.map((c) => ({ ...c, stance: 'body' })),
});

const flat = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

/** The fan's total laid-out width for `n` cards at the given step. */
const fanWidth = (n: number, step: number) => (n < 1 ? 0 : HAND_CARD_W + step * (n - 1));

// ── C11: the fan sits BESIDE the corner medallions ──────────────────────────

describe('S1-board-C11 — the hand fan lays out beside the corner chrome', () => {
    it('reserves both corner footprints instead of running edge-to-edge', () => {
        renderBoard();
        const fan = flat('combat-hand');
        expect(fan.paddingLeft).toBe(HAND_FAN_LEFT);
        expect(fan.paddingRight).toBe(HAND_FAN_RIGHT);
        // The old edge-to-edge inset is gone on both sides.
        expect(fan.paddingHorizontal).toBeUndefined();
    });

    it('a hand that fits stays entirely clear of both medallions', () => {
        for (const n of [1, 2, 3]) {
            const { band, step } = handFanLayout(PHONE.width, n);
            expect(band).toBe(PHONE.width - HAND_FAN_LEFT - HAND_FAN_RIGHT);
            expect(fanWidth(n, step)).toBeLessThanOrEqual(band);
        }
    });

    it('an oversized hand overflows the band by points, not by whole cards', () => {
        // The pre-fix band was the full screen less 12pt insets, so the fan ran
        // right under the 102pt medallion and the 90pt END disc.
        const OLD_BAND = PHONE.width - 24;
        for (const n of [4, 5, 6]) {
            const { band, step } = handFanLayout(PHONE.width, n);
            const spill = (fanWidth(n, step) - band) / 2;   // symmetric: justify center
            const oldStep = Math.min(HAND_CARD_W - 16, Math.max(HAND_FAN_MIN_STEP, (OLD_BAND - HAND_CARD_W) / (n - 1)));
            const oldSpillLeft = HAND_FAN_LEFT - (PHONE.width - fanWidth(n, oldStep)) / 2;
            expect(spill).toBeLessThan(oldSpillLeft);
            // Whatever the hand size, the outermost card keeps its touch centre
            // clear of the chrome it used to hide under.
            expect(spill).toBeLessThan(HAND_CARD_W / 2);
        }
    });

    it('never tightens a card below the readable sliver, and never on a single card', () => {
        // Both inputs re-picked for the C11 repair, same properties: a hand the
        // chrome band cannot seat now takes the BOARD band (the narrow band
        // crushed a five-card hand to the floor and overflowed anyway), so the
        // floor binds later — and 200pt was never narrower than one 120pt card.
        expect(handFanLayout(PHONE.width, 12).step).toBe(HAND_FAN_MIN_STEP);
        expect(handFanLayout(PHONE.width, 1).step).toBe(HAND_CARD_W);
        expect(handFanLayout(PHONE.width, 1).overlap).toBe(0);
        // A viewport narrower than one card still yields a usable band.
        expect(handFanLayout(100, 3).band).toBe(HAND_CARD_W);
    });
});

// ── C12: the board fits the phone ───────────────────────────────────────────

describe('S1-board-C12 — nothing on the board runs past the viewport', () => {
    it('the board clips at its own edge', () => {
        renderBoard();
        expect(flat('combat-board').overflow).toBe('hidden');
    });

    it('the END consequence line is anchored inward, not off the right edge', () => {
        renderBoard(withDeadTray);
        expect(screen.getByTestId('combat-end-consequence')).toBeTruthy();
        const wrap = flat('combat-end-consequence-wrap');
        // Anchored to the medallion's right edge: the box runs INTO the board.
        expect(wrap.right).toBe(0);
        expect(wrap.left).toBeUndefined();
        // Its own footprint (right inset 10 + width) still lands on-screen.
        expect(10 + (wrap.width as number)).toBeLessThanOrEqual(PHONE.width);
    });
});

// ── C19: the tappable chip is the one that looks tappable ───────────────────

describe('S1-board-C19 — the momentum chip and the stance chip read apart', () => {
    it('the momentum chip is a button and carries a visible tap mark', () => {
        renderBoard();
        const chip = screen.getByTestId('combat-momentum-v2');
        expect(chip.props.accessibilityRole).toBe('button');
        expect(screen.getByTestId('combat-momentum-info-mark')).toBeTruthy();
    });

    it('the stance chip stays an inert readout and names itself', () => {
        renderBoard();
        const chip = screen.getByTestId('combat-player-stance');
        expect(chip.props.accessibilityRole).toBe('text');
        // Either it prints the canon word as its caption, or its value already
        // carries it ('NO STANCE') — never a bare unlabelled chip.
        const caption = screen.queryByTestId('combat-player-stance-caption');
        const label = String(chip.props.accessibilityLabel ?? '');
        expect(caption !== null || /stance/i.test(label)).toBe(true);
    });
});

// ── C32: a value cell shows a whole value ───────────────────────────────────

describe('S1-board-C32 — compactFree never prints a chopped fragment', () => {
    it('compacts the presenter’s applyEffect rail to its intensity', () => {
        expect(compactFree('×4 · 3t')).toBe('×4');
        expect(compactFree('×4 · 3t +')).toBe('×4');
        expect(compactFree('×1')).toBe('×1');
        expect(compactFree('mark ×1 (enemy)')).toBe('×1');
    });

    it('keeps the reads it already had', () => {
        expect(compactFree('i1 d1')).toBe('+1');
        expect(compactFree('3 rounds')).toBe('3r');
        expect(compactFree('2')).toBe('+2');
        expect(compactFree('+2 int')).toBe('+2');
        expect(compactFree(null)).toBe('');
    });

    it('prints nothing rather than half a word', () => {
        expect(compactFree('mercy')).toBe('');
        expect(compactFree('timed')).toBe('');
        expect(compactFree('all DoTs')).toBe('all');
        // Every output is a whole thing: a derived value, or a whole word of
        // the input — never a slice through one, never a trailing space.
        for (const v of ['×4 · 3t', 'mercy', 'timed', 'spare a foe', 'all DoTs', '3 rounds']) {
            const out = compactFree(v);
            const derived = /^(?:[×+]\d+|\d+r)$/.test(out);
            const wholeWord = v.trim().split(/\s+/).includes(out);
            expect(out === '' || derived || wholeWord).toBe(true);
            expect(out).toBe(out.trim());
        }
    });
});
