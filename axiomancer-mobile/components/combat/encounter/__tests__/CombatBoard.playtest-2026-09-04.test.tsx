/**
 * CombatBoard — playtest 2026-09-04 layout findings at 390x844 (iPhone-class
 * portrait, the playtest driver's viewport).
 *
 *  1. The reward-draft mini face (100x147) clipped its NAME and paid line to
 *     stubs ("C.. +.", "D. 5.") because `adjustsFontSizeToFit` is a no-op on
 *     react-native-web. Under `NARROW_FACE_W` the ledger STACKS (keyword over
 *     value, full width) and every text line wraps to two lines with an
 *     explicit lineHeight — no font-fit dependence.
 *  2. The player VITAE readout on the bottom rail fell off the bottom: the
 *     rail was a fixed 26pt, the text wrapped to two lines and the second
 *     line drew below the screen. The rail now grows (minHeight = line +
 *     bottom inset, paddingBottom = inset) and the readout never wraps.
 *  4. Reanimated (web) warned `[opacity] may be overwritten by a layout
 *     animation` once per hand card per draw: FadeIn drives `opacity` on the
 *     animated wrapper and the in-flight dim was an `opacity` style on the
 *     SAME node. The dim now lives on a plain inner View.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import {
    CombatBoard, CombatCardFace, NARROW_FACE_W, RAIL_LINE_H, type DragController,
} from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel, type CombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

const CARDS = ['spoiled-poultice', 'unction-of-boils', 'frostbitten-palisade', 'thin-hymn'];
const PHONE = { width: 390, height: 844, scale: 3, fontScale: 1 };
const INSETS = { top: 47, bottom: 34, left: 0, right: 0 };

// `useWindowDimensions` is read off the react-native module object at call
// time (named import -> property access), so overriding the export pins the
// board to the playtest viewport without mocking the whole module.
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

function renderBoard() {
    const { store, vm } = freshVM();
    const { tree } = withAllProviders(
        <SafeAreaInsetsContext.Provider value={INSETS}>
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...boardCallbacks()} />
        </SafeAreaInsetsContext.Provider>,
        { store },
    );
    render(tree);
    return vm;
}

const flat = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

// ── Finding 2: the VITAE readout stays on screen ─────────────────────────────

describe('CombatBoard rail — player VITAE is fully visible at 390x844', () => {
    it('the rail grows with the bottom inset instead of clipping to a fixed line', () => {
        renderBoard();
        const rail = flat('combat-rail');
        expect(rail.minHeight).toBe(RAIL_LINE_H + INSETS.bottom);
        expect(rail.paddingBottom).toBe(INSETS.bottom);
        // No fixed height: the row may take a second line when the ledger wraps.
        expect(rail.height).toBeUndefined();
    });

    it('the VITAE readout never wraps and speaks the canon word', () => {
        const vm = renderBoard();
        const hp = screen.getByTestId('combat-rail-vitae');
        expect(hp.props.numberOfLines).toBe(1);
        // FE-016 — the readout now prints the maximum too, so the accessible
        // name names both. The canon word and the one-line rule are unchanged.
        expect(hp.props.accessibilityLabel).toBe(`VITAE ${vm.player.hp} of ${vm.player.maxHp}`);
        const style = StyleSheet.flatten(hp.props.style) as Record<string, unknown>;
        // A flex-shrinking Text is what wrapped "♥ 129" onto two lines.
        expect(style.flexShrink).toBe(0);
        expect(typeof style.lineHeight).toBe('number');
    });
});

// ── Finding 4: no `opacity` on a layout-animated node ───────────────────────

describe('CombatBoard hand fan — the in-flight dim is not on the FadeIn node', () => {
    it('no hand card wrapper carries an opacity style', () => {
        const vm = renderBoard();
        expect(vm.hand.length).toBeGreaterThan(0);
        for (const card of vm.hand) {
            const style = flat(`combat-hand-${card.uid}`);
            expect(style).not.toHaveProperty('opacity');
        }
    });
});

// ── Finding 1: the narrow face reads in full ────────────────────────────────

describe('CombatCardFace — the reward-draft mini face (100x147) is readable', () => {
    const { vm } = freshVM();
    const cards = vm.hand;
    const withPaid = cards.find((c) => c.face.keyword && (c.face.heroText || '').trim());

    it('the fixture carries a paid line to lay out', () => {
        expect(withPaid).toBeDefined();
        expect(NARROW_FACE_W).toBeGreaterThan(100);
        expect(NARROW_FACE_W).toBeLessThanOrEqual(120);
    });

    it('under NARROW_FACE_W the ledger stacks and every line may wrap, no font-fit', () => {
        render(withAllProviders(<CombatCardFace card={withPaid!} width={100} height={147} />).tree);
        expect(screen.getByTestId('combat-card-face-ledger-stacked')).toBeTruthy();
        expect(screen.queryByTestId('combat-card-face-ledger')).toBeNull();
        for (const id of ['combat-card-face-name', 'combat-card-face-keyword', 'combat-card-face-value']) {
            const t = screen.getByTestId(id);
            expect(t.props.numberOfLines).toBe(2);
            expect(t.props.adjustsFontSizeToFit).toBeUndefined();
            const style = StyleSheet.flatten(t.props.style) as Record<string, unknown>;
            expect(typeof style.lineHeight).toBe('number');
        }
        // Full text present, not a stub.
        expect(screen.getByTestId('combat-card-face-name').props.children).toBe(withPaid!.name.toUpperCase());
    });

    it('at the hand width (120) the ledger keeps its side-by-side row', () => {
        render(withAllProviders(<CombatCardFace card={withPaid!} width={120} height={176} />).tree);
        expect(screen.getByTestId('combat-card-face-ledger')).toBeTruthy();
        expect(screen.queryByTestId('combat-card-face-ledger-stacked')).toBeNull();
    });
});
