/**
 * CombatBoard — repair of the damage this sweep's own S1-board fixes did, as
 * an independent reader found it in the before/after captures.
 *
 *  C11-R  The chrome-free band (375 − 102 − 90 = 183pt) cannot seat five 120pt
 *         cards. Clamped into it, every non-last card collapsed to the 28pt
 *         sliver floor — four of five names cut to two letters, all art and
 *         cost chips hidden, each card a 28pt drag target — and the 232pt fan
 *         overflowed the 183pt band anyway. The fan now falls back to the full
 *         board band whenever the chrome band cannot seat the hand.
 *  C11-R2 The same overflow parked the last card's keyword chip HALF under the
 *         END disc, which cut it to 'GUAR' with '12' wrapped beneath. With the
 *         board band restored the disc meets that card no further into its
 *         face than it did before the sweep — the chip is wholly behind it.
 *  C19-R  The ⓘ tap mark rendered OUTSIDE the readout's dark backing plate, on
 *         bright arena floor art (~1.5:1) — invisible on desktop — and shoved
 *         the 'no momentum' readout off the centre it held. The mark now
 *         carries the same plate, and a mirrored gutter holds the centre.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import {
    CombatBoard, handFanLayout,
    HAND_CARD_W, HAND_FAN_LEFT, HAND_FAN_RIGHT, HAND_FAN_MIN_STEP, HAND_FAN_BOARD_EDGE,
    CHIP_INFO_MARK_W, CHIP_INFO_MARK_GAP,
    type DragController,
} from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel, type CombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

const CARDS = ['spoiled-poultice', 'unction-of-boils', 'frostbitten-palisade', 'thin-hymn'];
/** The capture's primary viewport — the one the fan collapsed at. */
const PHONE = { width: 375, height: 812, scale: 3, fontScale: 1 };
/** The capture's second viewport — a fix for one must not cost the other. */
const DESKTOP_W = 1280;
const INSETS = { top: 47, bottom: 34, left: 0, right: 0 };

// Same pin as CombatBoard.S1-board: `useWindowDimensions` is read off the
// module object at call time, so overriding the export pins the board to the
// phone viewport without mocking all of react-native.
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

const flat = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, number | string>;

/** The fan's total laid-out width for `n` cards at the given step. */
const fanWidth = (n: number, step: number) => (n < 1 ? 0 : HAND_CARD_W + step * (n - 1));

/**
 * Where the fan's cards actually land, given the fan box's own paddings.
 *
 * Inputs: viewport width, card count, and the box's left/right padding (the
 * fan is `justifyContent: 'center'`, so content wider than the box overflows
 * it symmetrically). Output: the step, the leading edge, the LAST card's
 * leading edge, and the fan's trailing edge — board coordinates.
 *
 * Resolves C11-R/C11-R2: both findings are statements about these edges.
 */
function fanEdges(screenW: number, n: number, padLeft: number, padRight: number): {
    step: number; left: number; lastLeft: number; right: number;
} {
    const { step } = handFanLayout(screenW, n);
    const left = padLeft + (screenW - padLeft - padRight - fanWidth(n, step)) / 2;
    return { step, left, lastLeft: left + step * (n - 1), right: left + fanWidth(n, step) };
}

/**
 * The reference fan — the pre-sweep, edge-to-edge layout the BEFORE captures
 * show: the board band at HAND_FAN_BOARD_EDGE insets, corner medallions
 * floating above its ends.
 *
 * Inputs: viewport width and card count. Output: the same edges as `fanEdges`.
 * Resolves C11-R/C11-R2: the repair must be no worse than this on both counts.
 */
function referenceFanEdges(screenW: number, n: number): { step: number; left: number; lastLeft: number; right: number } {
    const band = screenW - HAND_FAN_BOARD_EDGE * 2;
    const step = n > 1
        ? Math.min(HAND_CARD_W - 16, Math.max(HAND_FAN_MIN_STEP, (band - HAND_CARD_W) / (n - 1)))
        : HAND_CARD_W;
    const left = HAND_FAN_BOARD_EDGE + (band - fanWidth(n, step)) / 2;
    return { step, left, lastLeft: left + step * (n - 1), right: left + fanWidth(n, step) };
}

// ── C11-R: the fan reads again at the phone viewport ────────────────────────

describe('C11-R — a hand the chrome-free band cannot seat takes the board band', () => {
    it('a five-card hand at 375 keeps a name-wide peek, not the sliver floor', () => {
        const { band, step } = handFanLayout(PHONE.width, 5);
        // The chrome-free band is 183pt; five 120pt cards do not fit it at any
        // readable step, so the fan lays out in the board band instead.
        expect(band).toBe(PHONE.width - HAND_FAN_BOARD_EDGE * 2);
        expect(step).toBeCloseTo(referenceFanEdges(PHONE.width, 5).step, 5);
        // The damaged layout clamped every card to the floor: two letters of a
        // name, no art, a 28pt drag target.
        expect(step).toBeGreaterThan(HAND_FAN_MIN_STEP * 1.5);
    });

    it('every hand size at 375 shows more than the sliver until the hand is enormous', () => {
        for (const n of [2, 3, 4, 5, 6, 7]) {
            expect(handFanLayout(PHONE.width, n).step).toBeGreaterThan(HAND_FAN_MIN_STEP);
        }
        // The floor still guards a hand no band can seat.
        expect(handFanLayout(PHONE.width, 12).step).toBe(HAND_FAN_MIN_STEP);
        for (const n of [1, 2, 5, 9, 12, 20]) {
            expect(handFanLayout(PHONE.width, n).step).toBeGreaterThanOrEqual(HAND_FAN_MIN_STEP);
        }
    });

    it('a hand that DOES seat beside the chrome still lays out clear of both corners', () => {
        for (const n of [1, 2, 3]) {
            const { band, step } = handFanLayout(PHONE.width, n);
            expect(band).toBe(PHONE.width - HAND_FAN_LEFT - HAND_FAN_RIGHT);
            expect(fanWidth(n, step)).toBeLessThanOrEqual(band);
        }
    });

    it('the desktop viewport is untouched: the fan still seats beside both corners', () => {
        for (const n of [3, 4, 5, 6]) {
            const { band, step } = handFanLayout(DESKTOP_W, n);
            expect(band).toBe(DESKTOP_W - HAND_FAN_LEFT - HAND_FAN_RIGHT);
            expect(fanWidth(n, step)).toBeLessThanOrEqual(band);
            expect(step).toBeGreaterThan(HAND_FAN_MIN_STEP);
        }
    });
});

// ── C11-R2: the last card's chip is not cut by the END disc ────────────────

describe('C11-R2 — the END disc does not slice the last card mid-chip', () => {
    it('lays the fan out no further left than the reference layout, and on-board', () => {
        const vm = renderBoard();
        const n = vm.hand.length;
        expect(n).toBeGreaterThan(1);
        const fan = flat('combat-hand');
        const laid = fanEdges(PHONE.width, n, fan.paddingLeft as number, fan.paddingRight as number);
        const ref = referenceFanEdges(PHONE.width, n);
        // The END corner starts here; the damaged fan stopped 24pt inside it,
        // which cut the last card's keyword chip in half instead of hiding it.
        const endCornerLeft = PHONE.width - HAND_FAN_RIGHT;
        // Either the fan clears the corner outright (a small hand seats beside
        // it), or it tucks at least as deep under the disc as the reference
        // layout did — never grazing it, which is what cut the chip in half.
        const clearsCorner = laid.right <= endCornerLeft;
        expect(clearsCorner || laid.lastLeft >= ref.lastLeft).toBe(true);
        // And the board still clips nothing: the fan ends inside the viewport.
        expect(laid.right).toBeLessThanOrEqual(PHONE.width);
        expect(laid.left).toBeGreaterThanOrEqual(0);
    });
});

// ── C19-R: the tap mark is legible, the readout keeps its centre ───────────

describe('C19-R — the momentum tap mark carries its own backing plate', () => {
    /** Force the chip's empty state — the one the desktop capture shows. */
    const emptyChain = (vm: CombatViewModel): CombatViewModel => ({
        ...vm,
        momentumV2: { ...vm.momentumV2, color: null, length: 0, chain: [], next: null, broke: false, surged: false },
    });

    it('plates the mark exactly as the readout beside it is plated', () => {
        renderBoard(emptyChain);
        const mark = flat('combat-momentum-info-mark');
        const readout = flat('combat-momentum-empty');
        // Bare, the glyph sat on the arena floor art at ~1.5:1 and vanished.
        expect(mark.backgroundColor).toBe(readout.backgroundColor);
        expect(mark.borderColor).toBe(readout.borderColor);
        expect(mark.borderWidth).toBe(readout.borderWidth);
        expect(Number(mark.borderWidth)).toBeGreaterThan(0);
    });

    it('mirrors the mark on the row’s leading edge so the readout stays centred', () => {
        renderBoard(emptyChain);
        const mark = flat('combat-momentum-info-mark');
        const gutter = flat('combat-momentum-info-gutter');
        expect(mark.width).toBe(CHIP_INFO_MARK_W);
        expect(mark.marginLeft).toBe(CHIP_INFO_MARK_GAP);
        // The gutter carries the mark's whole footprint, so the row's centre
        // line is still the readout's centre line.
        expect(gutter.width).toBe(Number(mark.width) + Number(mark.marginLeft));
    });

    it('still marks the chip as the tappable half of the pair', () => {
        renderBoard(emptyChain);
        expect(screen.getByTestId('combat-momentum-v2').props.accessibilityRole).toBe('button');
        expect(screen.getByTestId('combat-momentum-info-mark')).toBeTruthy();
    });
});
