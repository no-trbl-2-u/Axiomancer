/**
 * Hermetic component tests — DebugSeedButton (Phase 54).
 *
 * Pins the dev-only mount gate + the action-routing contract. The
 * full state mutation is exercised in
 * `state/e2e/debug-seed.engine.test.ts`; here we only verify the
 * component renders correctly in DEV, hides in production, and
 * routes presses through `useGameActions().debugSeed()`.
 */

import { describe, expect, it } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugSeedButton } from '@/components/DebugSeedButton';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

describe('DebugSeedButton: DEV gate', () => {
    it('renders the button when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugSeedButton />));
        expect(tree.queryByTestId('debug-seed-button')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
         
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugSeedButton />));
            expect(tree.queryByTestId('debug-seed-button')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugSeedButton: press routing', () => {
    it('a tap mutates the engine state (inventory + skills + map)', () => {
        const store = makeStore();
        const inventoryBefore = (store.getState().player.inventory ?? []).length;
        const skillsBefore = (store.getState().player.knownSkills ?? []).length;

        const tree = render(withProvider(store, <DebugSeedButton />));
        fireEvent.press(tree.getByTestId('debug-seed-button'));

        const inventoryAfter = (store.getState().player.inventory ?? []).length;
        const skillsAfter = (store.getState().player.knownSkills ?? []).length;

        expect(inventoryAfter).toBeGreaterThan(inventoryBefore);
        expect(skillsAfter).toBeGreaterThan(skillsBefore);
    });

    it('a tap updates the visible result line with a "seeded · ..." summary', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugSeedButton />));
        // Before press, the row shows the static "items + skills + map reset" subtitle.
        expect(tree.queryByText('items + skills + map reset')).not.toBeNull();

        fireEvent.press(tree.getByTestId('debug-seed-button'));

        // After press, the subtitle reflects the seed result.
        const after = tree.toJSON();
        const text = JSON.stringify(after);
        expect(text).toMatch(/seeded · \d+ items · \d+ skills · map (reset|unchanged)/);
    });

    it('a second tap is non-destructive — keeps inventory growing or stable, never crashes', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugSeedButton />));

        fireEvent.press(tree.getByTestId('debug-seed-button'));
        const firstSkillCount = (store.getState().player.knownSkills ?? []).length;

        // Second press: skills should stay the same (set semantics in
        // the action), items may grow (the engine's addItem doesn't
        // dedupe equipment — non-stackable items create new stacks).
        expect(() =>
            fireEvent.press(tree.getByTestId('debug-seed-button')),
        ).not.toThrow();

        const secondSkillCount = (store.getState().player.knownSkills ?? []).length;
        expect(secondSkillCount).toBe(firstSkillCount);
    });
});

describe('DebugSeedButton: accessibility', () => {
    it('exposes accessibilityRole=button and a descriptive label', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugSeedButton />));
        const btn = tree.getByTestId('debug-seed-button');
        expect(btn.props.accessibilityRole).toBe('button');
        expect(btn.props.accessibilityLabel).toMatch(/seed/i);
    });
});
