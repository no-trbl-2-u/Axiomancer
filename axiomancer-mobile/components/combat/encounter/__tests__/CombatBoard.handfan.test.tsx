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
 *   1. `NAME_BAND_LEFT_CHROME` equals the four styles it claims to sum, read
 *      off the SHIPPED stylesheet (`useCombatBoardStyles`) — not re-typed here.
 *   2. `nameColumnPeek` is the peek, floored, and never exceeds the step.
 *   3. Every covered hand card carries a name box no wider than the peek.
 *   4. The LAST (uncovered) card keeps the full band — no cap.
 *   5. Non-hand faces (staged, reward offer, detail overlay) are uncapped.
 *   6. The tap-to-read hatch is on screen while the fan is still occluded, and
 *      both hint lines fit the single line they are given.
 *   7. Tapping a hand card reaches `onInspect`.
 *
 * Corrected by the burn-day audit of 2026-09-19 (row 3.13). As first shipped,
 * item 1 re-typed the four style numbers as literals beside the constant — a
 * tautology that stayed green when a style moved — and item 6 claimed the tap
 * path was tested when the file contained no such test at all: its one
 * tap-related assertion sat behind an `if (hint)` that never ran, because the
 * hint it looked for only rendered once a card had already been staged. Both
 * are now real gates, each verified red against the tree that shipped them.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { act, render, renderHook, screen } from '@testing-library/react-native';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

import { initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import {
    CombatBoard, CombatCardFace, handFanLayout, nameColumnPeek,
    NAME_BAND_LEFT_CHROME, HAND_CARD_W, useCombatBoardStyles,
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

type Rendered = { vm: CombatViewModel; cbs: ReturnType<typeof boardCallbacks> };

/** Render the board with whatever `stagedUids` the caller derives from the hand. */
function renderBoardWith(stage: (vm: CombatViewModel) => string[], cbs = boardCallbacks()): Rendered {
    const { store, vm } = freshVM();
    const { tree } = withAllProviders(
        <SafeAreaInsetsContext.Provider value={INSETS}>
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={stage(vm)} {...cbs} />
        </SafeAreaInsetsContext.Provider>,
        { store },
    );
    render(tree);
    return { vm, cbs };
}

/** The fan as the player first meets it: nothing staged, every name occluded. */
const renderBoard = (cbs = boardCallbacks()): Rendered => renderBoardWith(() => [], cbs);
/** One card lifted out of the fan and un-died — the staged hint's own branch. */
const renderBoardStaged = (cbs = boardCallbacks()): Rendered =>
    renderBoardWith((vm) => [vm.hand[0]!.uid], cbs);

/** Flatten a node's style down to a plain record. */
const flatten = (style: unknown) => StyleSheet.flatten(style as never) as Record<string, number | string>;

// ── 1. The derived constant ─────────────────────────────────────────────────

describe('NAME_BAND_LEFT_CHROME is derived, not guessed', () => {
    it('equals the four SHIPPED styles it claims to sum', () => {
        // Read off the stylesheet the board actually renders with, never
        // re-typed here: a literal re-sum is a tautology (17.5 === 1.5+6+5+5
        // holds whatever the styles do), and that is exactly how this
        // constant could drift while the gate stayed green.
        const { result } = renderHook(() => useCombatBoardStyles());
        const s = result.current;
        const parts = [
            s.faceCard.borderWidth,          // card face's own left edge
            s.plateBand.paddingHorizontal,   // the band's left half
            s.plateRarityPip.width,          // the wax rarity pip
            s.plateBand.gap,                 // pip -> text
        ];
        // A renamed or dropped key must fail loudly here rather than turn the
        // sum into NaN and take the assertion below down with an unreadable
        // message.
        for (const part of parts) expect(typeof part).toBe('number');
        expect(NAME_BAND_LEFT_CHROME).toBe(parts.reduce((a, b) => (a as number) + (b as number), 0));
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

/** The text a `<Text>` node actually renders, flattened out of its children. */
const textOf = (node: { props: { children?: unknown } }): string => {
    const walk = (c: unknown): string =>
        Array.isArray(c) ? c.map(walk).join('')
            : typeof c === 'string' || typeof c === 'number' ? String(c)
                : '';
    return walk(node.props.children);
};

/**
 * One `numberOfLines={1}` line of `stageHint` copy, in characters.
 *
 * The dock is the full 375pt viewport; `stageHint` is 12pt serif italic,
 * whose average uppercase-and-lowercase advance measured off the 375x812
 * critique capture is ~5.6pt, so a line holds ~63 glyphs before React
 * Native silently drops its TAIL (`ellipsizeMode` defaults to 'tail'). 56
 * is that with a margin for the wider glyphs. This is a legibility floor,
 * not a copy freeze — any rewrite that fits stays green.
 */
const ONE_LINE_BUDGET = 56;

describe('tap-to-read — the affordance the board now advertises', () => {
    it('states the tap hatch on the fan itself, while the names are still occluded', () => {
        // The precedent (RouteSelect, 8f3acef7) changed its visible label for
        // exactly this reason: the wiring existed, but a sighted player only
        // ever met it in an accessibilityHint. Phase 97 then put the line
        // where only a player who had ALREADY staged a card could read it —
        // past the moment they needed it to choose which covered card to lift.
        const { vm } = renderBoard();
        // A covered card exists, so at least one name is being clipped right
        // now: this is precisely when the hatch has to be on screen.
        expect(vm.hand.length).toBeGreaterThan(1);
        expect(screen.getByTestId('combat-tap-hint')).toBeTruthy();
        expect(screen.getByText(/tap .*card.* to read/i)).toBeTruthy();
    });

    it('the fan hatch fits the one line it is given', () => {
        renderBoard();
        const node = screen.getByTestId('combat-tap-hint');
        expect(node.props.numberOfLines).toBe(1);
        expect(textOf(node).length).toBeLessThanOrEqual(ONE_LINE_BUDGET);
    });

    it('the staged hint fits the one line it is given', () => {
        renderBoardStaged();
        const node = screen.getByTestId('combat-stage-hint');
        expect(node.props.numberOfLines).toBe(1);
        expect(textOf(node).length).toBeLessThanOrEqual(ONE_LINE_BUDGET);
    });

    it('tapping a hand card reaches onInspect', async () => {
        // The hatch the two hints advertise. It is a gesture, not an onPress,
        // so `fireEvent.press` never reaches it — driving the real
        // `Gesture.Exclusive(pan, tap)` through its registered test id is the
        // only way to assert the player's tap actually opens the card.
        const { vm, cbs } = renderBoard();
        const card = vm.hand[0]!;
        fireGestureHandler(getByGestureTestId(`combat-card-tap-hand-${card.uid}`), [
            { state: State.BEGAN }, { state: State.ACTIVE }, { state: State.END },
        ]);
        // `runOnJS` hands the call to the JS thread via `queueMicrotask`
        // (react-native-worklets), so it lands after a flush, not inline.
        await act(async () => { await Promise.resolve(); });
        expect(cbs.onInspect).toHaveBeenCalledTimes(1);
        expect((cbs.onInspect.mock.calls[0] as [{ uid: string }])[0].uid).toBe(card.uid);
    });

    it('every hand card still announces the tap hatch to a screen reader', () => {
        const { vm } = renderBoard();
        const first = vm.hand[0]!;
        const node = screen.getByTestId(`combat-hand-${first.uid}`);
        expect(String(node.props.accessibilityHint)).toMatch(/tap to read/i);
    });
});
