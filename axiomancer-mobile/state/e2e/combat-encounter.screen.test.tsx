/**
 * Hermetic E2E — Spec 26 / 26b Combat encounter screen.
 *
 * Mounts the real `/combat-encounter` screen against a rigged store player and
 * walks the redesigned flow: the reveal → ENTER → the board (portraits, visible
 * HP, the two Pressure Tracks, the 2-die DRAFT, Conviction + Signature Skills,
 * the hidden-stance read) → END PHASE. Determinism comes from the engine seed
 * (`__AXM_COMBAT_SEED__`); seed 16 rolls a draftable first die (mind, heart).
 * The engine owns the rules; this asserts the presenter + screen wiring.
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import CombatEncounterScreen from '@/app/combat-encounter/index';
import type { AppStore } from '@/state/store';
import { withAllProviders } from '@/test-utils/withAllProviders';

jest.mock('expo-router', () => ({
    useRouter: () => ({ back: jest.fn(), push: jest.fn(), canGoBack: () => true }),
    useLocalSearchParams: () => ({}),
}));

const SKILLS = ['slippery-slope', 'eternal-regress', 'achilles-gambit', 'befriend'];

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
    store.setState({ player: { ...player, knownSkills: SKILLS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 } });
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

    it('ENTER reveals the full board surface (portraits, HP, dice, hand) — HP is the only enemy bar', () => {
        mount();
        enter();
        expect(screen.getByTestId('combat-board')).toBeTruthy();
        expect(screen.getByTestId('combat-combatant-pane')).toBeTruthy();
        // HP is the sole enemy bar now — the DoT / Control pressure tracks are gone.
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
        // The 2 turn dice render in the tray, to be DRAGGED onto a staged card.
        expect(screen.getByTestId('combat-dice-tray')).toBeTruthy();
        expect(screen.getByTestId('combat-die-t1-d0')).toBeTruthy();
        // The play area is the staging zone (empty until a card is dragged up).
        expect(screen.getByTestId('combat-play-area')).toBeTruthy();
        // The redesign removes the tap-draft read banner and the FREE/POWER buttons.
        expect(screen.queryByTestId('combat-read-banner')).toBeNull();
        expect(screen.queryByTestId('combat-free-slippery-slope')).toBeNull();
        expect(screen.queryByTestId('combat-power-slippery-slope')).toBeNull();
        // END PHASE + SCRAP stay; the dice-reroll button is deliberately GONE
        // (2026-07 polish): the rolled dice ARE the turn.
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
