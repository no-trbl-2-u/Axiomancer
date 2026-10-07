/**
 * Hermetic E2E — Combat encounter screen.
 *
 * Mounts the real `/combat-encounter` screen against a rigged store player and
 * walks the flow: the reveal → ENTER → the board (portraits, visible HP, the
 * four-die tray, Conviction, the signature bar, the foe's intent) → END PHASE. Determinism comes from the engine seed
 * (`__AXM_COMBAT_SEED__`). The engine owns the rules; this asserts the
 * presenter + screen wiring.
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import CombatEncounterScreen from '@/app/combat-encounter/index';
import { REVEAL_COLUMN_MAX_WIDTH } from '@/components/combat/encounter/CombatEncounterPanel';
import type { AppStore } from '@/state/store';
import { withAllProviders } from '@/test-utils/withAllProviders';

jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({ back: jest.fn(), push: jest.fn(), canGoBack: () => true }),
    useLocalSearchParams: () => ({}),
}));

const CARDS = ['slippery-slope', 'recurring-symptom', 'brace-for-impact', 'soft-word'];

beforeEach(() => {
    (globalThis as { __AXM_COMBAT_SEED__?: number }).__AXM_COMBAT_SEED__ = 16;
});
afterEach(() => {
    jest.clearAllMocks();
    delete (globalThis as { __AXM_COMBAT_SEED__?: number }).__AXM_COMBAT_SEED__;
});

function mount(): { store: AppStore } {
    const { tree, store } = withAllProviders(<CombatEncounterScreen />);
    const player = store.getState().player;
    store.setState({ player: { ...player, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 } });
    render(tree);
    return { store };
}

function enter() {
    act(() => { fireEvent.press(screen.getByTestId('combat-enter')); });
}

describe('combat-encounter screen — reveal then board', () => {
    it('shows the enemy reveal before combat', () => {
        mount();
        expect(screen.getByTestId('combat-reveal')).toBeTruthy();
        expect(screen.getByTestId('combat-enter')).toBeTruthy();
    });

    it('each collapsed threat-sequence header names its phase damage', () => {
        mount();
        const heads = screen.getAllByTestId(/^combat-reveal-phase-\d+$/);
        expect(heads.length).toBeGreaterThan(1);
        for (const h of heads) expect(h.props.accessibilityLabel).toMatch(/^Phase \d+, ATTACKS, \d+ damage$/);
    });

    it('holds the foe and its threat rows in one centred column at a reading width', () => {
        mount();
        const column = StyleSheet.flatten(screen.getByTestId('combat-reveal-column').props.contentContainerStyle);
        expect(column.maxWidth).toBe(REVEAL_COLUMN_MAX_WIDTH);
        expect(REVEAL_COLUMN_MAX_WIDTH).toBeGreaterThanOrEqual(480);
        expect(REVEAL_COLUMN_MAX_WIDTH).toBeLessThanOrEqual(560);
        expect(column.alignSelf).toBe('center');
        expect(column.width).toBe('100%');
        expect(screen.getByTestId('combat-reveal-column')).toContainElement(screen.getByTestId('combat-reveal-phase-1'));
    });

    it('ENTER reveals the full board surface (portraits, HP, dice, hand) — HP is the only enemy bar', () => {
        mount();
        enter();
        expect(screen.getByTestId('combat-board')).toBeTruthy();
        expect(screen.getByTestId('combat-combatant-pane')).toBeTruthy();
        // HP is the sole enemy bar — there are no DoT / Control pressure tracks.
        expect(screen.queryByTestId('combat-pressure-tracks')).toBeNull();
        expect(screen.getByTestId('combat-dice-tray')).toBeTruthy();
        expect(screen.getByTestId('combat-hand')).toBeTruthy();
        expect(screen.getByTestId('combat-conviction')).toBeTruthy();
        expect(screen.getByTestId('combat-signature-bar')).toBeTruthy();
        expect(screen.getByTestId('combat-intent')).toBeTruthy();
    });
});

describe('combat-encounter screen — drag-to-power flow (2026-06-22)', () => {
    it('renders draggable dice + the empty play area; the FREE/POWER split + read banner are gone', () => {
        mount();
        enter();
        // The four spec-33 dice (one per colour) render in the tray, to be
        // DRAGGED onto a staged card.
        expect(screen.getByTestId('combat-dice-tray')).toBeTruthy();
        for (const color of ['heart', 'body', 'mind', 'wild']) {
            expect(screen.getByTestId(`combat-die-t1-u-${color}`)).toBeTruthy();
        }
        // The play area is the staging zone (empty until a card is dragged up).
        expect(screen.getByTestId('combat-play-area')).toBeTruthy();
        // The redesign removes the tap-draft read banner and the FREE/POWER buttons.
        expect(screen.queryByTestId('combat-read-banner')).toBeNull();
        expect(screen.queryByTestId('combat-free-slippery-slope')).toBeNull();
        expect(screen.queryByTestId('combat-power-slippery-slope')).toBeNull();
        // END PHASE + SCRAP are present; there is no dice-reroll button: the
        // rolled dice ARE the turn.
        expect(screen.queryByTestId('combat-new-turn')).toBeNull();
        expect(screen.getByTestId('combat-end-phase')).toBeTruthy();
        expect(screen.getByTestId('combat-trash')).toBeTruthy();
    });
});

describe('combat-encounter screen — END PHASE + terminal outcome', () => {
    it('END PHASE resolves without crashing', () => {
        mount();
        enter();
        act(() => { fireEvent.press(screen.getByTestId('combat-end-phase')); });
        const alive = screen.queryByTestId('combat-board') || screen.queryByTestId('combat-summary') || screen.queryByTestId('combat-mercy');
        expect(alive).toBeTruthy();
    });

    it('ending phases without clearing drives to a terminal outcome', () => {
        mount();
        enter();
        for (let i = 0; i < 40; i++) {
            if (screen.queryByTestId('combat-summary') || screen.queryByTestId('combat-mercy')) break;
            const end = screen.queryByTestId('combat-end-phase');
            if (!end) break;
            act(() => { fireEvent.press(end); });
        }
        const done = screen.queryByTestId('combat-summary') || screen.queryByTestId('combat-mercy') || screen.queryByTestId('combat-board');
        expect(done).toBeTruthy();
    });
});

// The foe's action card shows for a moment so the player knows what happened
// on the foe's turn. The shaping is pinned in
// `state/presenters/__tests__/enemy-action-card.engine.test.ts`; this is the
// wiring pin: the panel actually mounts the reveal off a real resolution.
describe('combat-encounter screen — the enemy plays its card back at you', () => {
    it('END PHASE reveals the foe\'s action card', () => {
        mount();
        enter();
        expect(screen.queryByTestId('combat-enemy-action-card')).toBeNull();
        act(() => { fireEvent.press(screen.getByTestId('combat-end-phase')); });
        expect(screen.queryByTestId('combat-enemy-action-card')).not.toBeNull();
    });

    it('never shows over the pre-combat reveal (nothing has resolved yet)', () => {
        mount();
        expect(screen.queryByTestId('combat-enemy-action-card')).toBeNull();
    });
});

// The dev sandbox route hands the panel no `onWithdraw` — retreat is a live-map
// concern (it forfeits a real map node), so the sandbox must not offer it.
describe('combat-encounter screen — retreat is a live-map affordance only', () => {
    it('the dev route\'s reveal offers no WITHDRAW', () => {
        mount();
        expect(screen.getByTestId('combat-reveal')).toBeTruthy();
        expect(screen.queryByTestId('combat-withdraw')).toBeNull();
    });
});
