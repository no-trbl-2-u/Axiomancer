/**
 * Hermetic E2E — the first-fight combat tutorial (primer + turn-one coach).
 *
 * Mounts the real `/combat-encounter` screen and exercises the tutorial's
 * gating and persistence: the primer auto-shows on a first-ever fight, the
 * turn-one coach appears once the primer is dismissed and the board is up,
 * finishing or skipping persists the `combat-tutorial-done` flag, a save that
 * already has the flag sees nothing, and `?tutorial=1` force-replays it anyway.
 * Determinism comes from the engine seed (seed 16 rolls a draftable first die).
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import CombatEncounterScreen from '@/app/combat-encounter/index';
import { COMBAT_TUTORIAL_FLAG } from '@/state/combat/store-actions';
import type { AppStore } from '@/state/store';
import { withAllProviders } from '@/test-utils/withAllProviders';

// Mutable per-test route params (must be `mock`-prefixed for jest's factory scope rule).
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
    useRouter: () => ({ back: jest.fn(), push: jest.fn(), canGoBack: () => true }),
    useLocalSearchParams: () => mockParams,
}));

const SKILLS = ['slippery-slope', 'eternal-regress', 'achilles-gambit', 'befriend'];

beforeEach(() => {
    (globalThis as { __AXM_COMBAT_SEED__?: number }).__AXM_COMBAT_SEED__ = 16;
    mockParams = {};
});
afterEach(() => {
    jest.clearAllMocks();
    delete (globalThis as { __AXM_COMBAT_SEED__?: number }).__AXM_COMBAT_SEED__;
});

function hasFlag(store: AppStore): boolean {
    return ((store.getState() as unknown as { flags?: string[] }).flags ?? []).includes(COMBAT_TUTORIAL_FLAG);
}

function mount(opts: { seenTutorial?: boolean } = {}): { store: AppStore } {
    const { tree, store } = withAllProviders(<CombatEncounterScreen />);
    const player = store.getState().player;
    store.setState({ player: { ...player, knownSkills: SKILLS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 } });
    if (opts.seenTutorial) {
        const flags = (store.getState() as unknown as { flags?: string[] }).flags ?? [];
        store.setState({ flags: [...flags, COMBAT_TUTORIAL_FLAG] } as never);
    }
    render(tree);
    return { store };
}

const press = (id: string) => act(() => { fireEvent.press(screen.getByTestId(id)); });

/** Page through the 3-panel primer to its BEGIN, dismissing it. */
function clearPrimer() {
    press('combat-primer-next');
    press('combat-primer-next');
    press('combat-primer-begin');
}

describe('combat tutorial — gating', () => {
    it('auto-shows the primer on a first-ever fight, with the coach still gated', () => {
        mount();
        expect(screen.getByTestId('combat-tutorial-primer')).toBeTruthy();
        // Coach waits until the primer is dismissed AND the board is up.
        expect(screen.queryByTestId('combat-tutorial')).toBeNull();
    });

    it('shows nothing once the flag is set', () => {
        mount({ seenTutorial: true });
        expect(screen.queryByTestId('combat-tutorial-primer')).toBeNull();
        expect(screen.queryByTestId('combat-tutorial')).toBeNull();
    });

    it('force-replays via ?tutorial=1 even when the flag is set', () => {
        mockParams = { tutorial: '1' };
        mount({ seenTutorial: true });
        expect(screen.getByTestId('combat-tutorial-primer')).toBeTruthy();
    });
});

describe('combat tutorial — flow + persistence', () => {
    it('primer → ENTER shows the coach; finishing turn one persists the flag', () => {
        const { store } = mount();
        clearPrimer();
        expect(screen.queryByTestId('combat-tutorial-primer')).toBeNull();
        expect(hasFlag(store)).toBe(false); // not done until the coach is

        press('combat-enter');
        expect(screen.getByTestId('combat-tutorial')).toBeTruthy(); // step 1: draft

        // Resolving the phase advances the turn/phase → the script completes.
        press('combat-end-phase');
        expect(hasFlag(store)).toBe(true);
        expect(screen.queryByTestId('combat-tutorial')).toBeNull();
    });

    it('skipping the primer persists the flag and dismisses the tutorial', () => {
        const { store } = mount();
        press('combat-primer-skip');
        expect(hasFlag(store)).toBe(true);
        expect(screen.queryByTestId('combat-tutorial-primer')).toBeNull();
    });
});
