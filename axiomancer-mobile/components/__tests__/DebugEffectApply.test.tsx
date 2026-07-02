/**
 * Hermetic component tests — DebugEffectApply (Phase 61e).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - BUFF · ME applies buff_body_defense_up to player.effects
 *
 * The legacy `BLEED · FOE` button targeted the removed turn-based
 * `state.combat.enemy` slice (mechanics 0.37.0) and was dropped along
 * with its coverage.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugEffectApply } from '@/components/DebugEffectApply';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

describe('DebugEffectApply: DEV gate', () => {
    it('renders the buff button when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugEffectApply />));
        expect(tree.queryByTestId('debug-effect-buff-player')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
         
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugEffectApply />));
            expect(tree.queryByTestId('debug-effect-buff-player')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugEffectApply: buff routing', () => {
    it('BUFF · ME adds an effect to player.effects', () => {
        const store = makeStore();
        const before = store.getState().player.effects?.length ?? 0;

        const tree = render(withProvider(store, <DebugEffectApply />));
        fireEvent.press(tree.getByTestId('debug-effect-buff-player'));

        const after = store.getState().player.effects ?? [];
        expect(after.length).toBeGreaterThan(before);
        // The effect's effectId on the ActiveEffect points back to the registry entry.
        expect(after.some((e) => e.effectId === 'buff_body_defense_up')).toBe(true);
    });
});

// The legacy `BLEED · FOE` button (which mutated `state.combat.enemy`,
// removed from the engine in mechanics 0.37.0) was dropped; its coverage
// retired with it.

describe('DebugEffectApply: accessibility', () => {
    it('exposes accessibilityRole=button and descriptive label', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugEffectApply />));

        const buff = tree.getByTestId('debug-effect-buff-player');
        expect(buff.props.accessibilityRole).toBe('button');
        expect(buff.props.accessibilityLabel).toMatch(/buff/i);
    });
});
