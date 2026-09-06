/**
 * Hermetic component tests — DebugEffectApply (effect picker).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - One chip per buff and per debuff in the engine library
 *   - A chip runs the engine's applyEffect onto player.effects
 *   - CLEAR empties player.effects
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { effectsLibrary } from '@mechanics';

import { DebugEffectApply } from '@/components/DebugEffectApply';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
});

const makeStore = (): AppStore => createAppStore({ adapter: createMemoryAdapter() });
const withProvider = (store: AppStore, child: React.ReactNode) => <GameStoreProvider store={store}>{child}</GameStoreProvider>;
const BUFF = effectsLibrary.buffs[0];
const DEBUFF = effectsLibrary.debuffs[0];

describe('DebugEffectApply: DEV gate', () => {
    it('renders a chip per library effect plus CLEAR', () => {
        const tree = render(withProvider(makeStore(), <DebugEffectApply />));
        for (const e of [...effectsLibrary.buffs, ...effectsLibrary.debuffs]) {
            expect(tree.queryByTestId(`debug-effect-${e.id}`)).not.toBeNull();
        }
        expect(tree.queryByTestId('debug-effect-clear')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        const g = global as unknown as { __DEV__: boolean };
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const tree = render(withProvider(makeStore(), <DebugEffectApply />));
            expect(tree.queryByTestId('debug-effect-clear')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugEffectApply: apply + clear', () => {
    it('a buff chip adds that effect to player.effects', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugEffectApply />));
        fireEvent.press(tree.getByTestId(`debug-effect-${BUFF.id}`));
        expect(store.getState().player.effects.map((e) => e.effectId)).toContain(BUFF.id);
    });

    it('a debuff chip adds that effect too, and CLEAR wipes the list', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugEffectApply />));
        fireEvent.press(tree.getByTestId(`debug-effect-${DEBUFF.id}`));
        expect(store.getState().player.effects.map((e) => e.effectId)).toContain(DEBUFF.id);
        fireEvent.press(tree.getByTestId('debug-effect-clear'));
        expect(store.getState().player.effects).toHaveLength(0);
    });
});
