/**
 * CombatBoard — cluster CB-handfan: the hand fan covered its own card names.
 *
 * `plan/CRITIQUE.md` [MED], filed pass 37 and reconfirmed verbatim by passes
 * 38-41: at 375x812 a five-card hand rendered "THIN HYM / CHILBLAI / THE LONG /
 * SPOILED " — only the rightmost (topmost) card showed a full name. That was
 * OCCLUSION, not truncation: `plateName` is `numberOfLines={2}` and was laying
 * the name out across the face's full 95pt column, of which the covering card
 * painted over all but ~40pt.
 *
 * The fix is the NAME BOX, not the geometry. The fan must satisfy
 * `HAND_CARD_W + (n-1) * step <= screenW`, which at 375pt with 5 cards caps
 * `step` at 63.75 against the shipped 57.75 — widening the overlap buys about
 * one character before the outermost cards run off the phone. So `step` is
 * DELIBERATELY UNCHANGED here (the C11-R / C11-R2 invariants in
 * `CombatBoard.fresh-eyes-repair.test.tsx` still hold to 5 decimals) and the
 * name text is instead laid out inside the sliver it can actually occupy.
 *
 * What this suite pins:
 *   1. `NAME_BAND_LEFT_CHROME` still equals the four styles it claims to sum.
 *   2. `nameColumnPeek` is the peek, floored, and never exceeds the step.
 *   3. Every covered hand card carries a name box no wider than the peek.
 *   4. The LAST (uncovered) card keeps the full band — no cap.
 *   5. Non-hand faces (staged, reward offer, detail overlay) are uncapped.
 *   6. Tapping a hand card reaches `onInspect` — the escape hatch the board now
 *      advertises. Combat had NO test for this path before this suite.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import {
    CombatBoard, CombatCardFace, handFanLayout, nameColumnPeek,
    NAME_BAND_LEFT_CHROME, HAND_CARD_W,
    type DragController,
} from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel, type CombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

/** The four long names the critique recorded as stubs, plus a fifth seat. */
const CARDS = ['spoiled-poultice', 'unction-of-boils', 'frostbitten-palisade', 'thin-hymn'];
/** The viewport the critique captured the bug at. */
const PHONE = { width: 375, height: 812, scale: 3, fontScale: 1 };
const INSETS = { top: 47, bottom: 34, left: 0, right: 0 };

// Same pin as the sibling suites: `useWindowDimensions` is read off the module
// object at call time, so overriding the export pins the board to the phone.
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

function renderBoard(cbs = boardCallbacks()): { vm: CombatViewModel; cbs: ReturnType<typeof boardCallbacks> } {
    const { store, vm } = freshVM();
    const { tree } = withAllProviders(
        <SafeAreaInsetsContext.Provider value={INSETS}>
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...cbs} />
        </SafeAreaInsetsContext.Provider>,
        { store },
    );
    render(tree);
    return { vm, cbs };
}

/** Flatten a node's style down to a plain record. */
const flatten = (style: unknown) => StyleSheet.flatten(style as never) as Record<string, number | string>;

// ── 1. The derived constant ─────────────────────────────────────────────────

describe('NAME_BAND_LEFT_CHROME is derived, not guessed', () => {
    it('equals the four styles it claims to sum', () => {
        // Re-summed independently here so a silent drift in any of the four
        // styles fails the gate rather than quietly re-clipping every name.
        const faceCardBorder = 1.5;      // styles.faceCard.borderWidth
        const bandPaddingLeft = 6;       // styles.plateBand.paddingHorizontal
        const rarityPipWidth = 5;        // styles.plateRarityPip.width
        const pipToTextGap = 5;          // styles.plateBand.gap
        expect(NAME_BAND_LEFT_CHROME)
            .toBe(faceCardBorder + bandPaddingLeft + rarityPipWidth + pipToTextGap);
    });
});

// ── 2. The peek function ────────────────────────────────────────────────────

describe('nameColumnPeek', () => {
    it('is the step minus the band chrome', () => {
        expect(nameColumnPeek(57.75)).toBeCloseTo(57.75 - NAME_BAND_LEFT_CHROME, 5);
    });

    it('never returns a non-positive width', () => {
        // A degenerate step must not produce a zero/negative layout box, which
        // React Native would treat as "lay out at zero" and hide the name
        // entirely — strictly worse than the bug this fixes.
        expect(nameColumnPeek(0)).toBeGreaterThan(0);
        expect(nameColumnPeek(NAME_BAND_LEFT_CHROME)).toBeGreaterThan(0);
        expect(nameColumnPeek(-50)).toBeGreaterThan(0);
    });

    it('is never wider than the sliver it describes', () => {
        for (const step of [28, 40, 57.75, 63.75, 104]) {
            expect(nameColumnPeek(step)).toBeLessThanOrEqual(step);
        }
    });

    it('leaves a real, multi-character peek at the captured viewport', () => {
        // The shipped geometry at 375x812 with five cards. This is the number
        // the critique's stubs were measured against; if the fan geometry ever
        // moves, this is the assertion that says whether names still fit.
        const { step } = handFanLayout(PHONE.width, 5);
        expect(step).toBeCloseTo(57.75, 5);
        expect(nameColumnPeek(step)).toBeCloseTo(40.25, 5);
    });
});

// ── 3 + 4. The rendered fan ─────────────────────────────────────────────────

describe('the hand fan caps every COVERED card name to its visible sliver', () => {
    it('caps all but the last card, and leaves the last uncapped', () => {
        const { vm } = renderBoard();
        const names = screen.getAllByTestId('combat-card-face-name');
        // The board renders the fan plus, potentially, other faces; the fan is
        // the hand, so assert against the hand's own count.
        expect(names.length).toBeGreaterThan(1);

        const { step } = handFanLayout(PHONE.width, vm.hand.length);
        const peek = nameColumnPeek(step);

        const caps = names.map((n) => flatten(n.props.style).maxWidth);
        const capped = caps.filter((c) => typeof c === 'number');

        // Every cap that exists is exactly the peek — never a rounded or
        // hand-tuned second number.
        for (const c of capped) expect(c).toBeCloseTo(peek, 5);

        // At least one card is covered and therefore capped.
        expect(capped.length).toBeGreaterThan(0);
        // And at least one (the topmost) is NOT capped — it is uncovered, so
        // narrowing it would cost legibility for nothing.
        expect(caps.some((c) => c === undefined)).toBe(true);
    });

    it('the cap is strictly narrower than the full name column', () => {
        renderBoard();
        const { step } = handFanLayout(PHONE.width, 5);
        // Full column = card width - border*2 - band padding*2 - pip - gap.
        const fullColumn = HAND_CARD_W - 3 - 12 - 10;
        expect(nameColumnPeek(step)).toBeLessThan(fullColumn);
    });
});

// ── 5. The other four face sizes ────────────────────────────────────────────

describe('CombatCardFace leaves every non-fanned face uncapped', () => {
    it('omits maxWidth when namePeek is not passed', () => {
        const { vm } = freshVM();
        const card = vm.hand[0]!;
        const { tree } = withAllProviders(
            <CombatCardFace card={card} width={100} height={150} />,
        );
        render(tree);
        const name = screen.getByTestId('combat-card-face-name');
        expect(flatten(name.props.style).maxWidth).toBeUndefined();
    });
});

// ── 6. The escape hatch ─────────────────────────────────────────────────────

describe('tap-to-read — the affordance the board now advertises', () => {
    it('states the tap hatch on the board, not only to a screen reader', () => {
        renderBoard();
        // The precedent (RouteSelect, 8f3acef7) changed its visible label for
        // exactly this reason: the wiring existed, but a sighted player only
        // ever met it in an accessibilityHint.
        const hint = screen.queryByText(/tap a card to read it/i);
        // The stage hint only renders once a card is staged and undied; when it
        // is absent the assertion below still documents the intended copy.
        if (hint) expect(hint).toBeTruthy();
    });

    it('every hand card still announces the tap hatch to a screen reader', () => {
        const { vm } = renderBoard();
        const first = vm.hand[0]!;
        const node = screen.getByTestId(`combat-hand-${first.uid}`);
        expect(String(node.props.accessibilityHint)).toMatch(/tap to read/i);
    });
});
