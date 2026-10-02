/**
 * Hermetic component tests — DebugDialogueJump (real NPC trees).
 *
 * The panel offers one chip per NPC a map stages. R7e (D72) deleted the
 * parked world's NPC trees and Act 1 stages none, so the row shows no chips;
 * the jump it drives (`openNpcDialogue`) is pinned on the fixture NPC in
 * `state/dev/__tests__/story-catalog.test.ts`.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { DebugDialogueJump } from '@/components/DebugDialogueJump';
import { listNpcs } from '@/state/dev/story-catalog';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const renderPanel = () => render(
    <GameStoreProvider store={createAppStore({ adapter: createMemoryAdapter() })}><DebugDialogueJump /></GameStoreProvider>,
);

describe('DebugDialogueJump', () => {
    it('offers no chip while no map stages an NPC', () => {
        expect(listNpcs()).toEqual([]);
        const tree = renderPanel();
        expect(tree.queryByTestId('debug-dialogue')).not.toBeNull();
        expect(tree.getByText('0 staged NPCs · tap to talk')).toBeTruthy();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        const g = global as unknown as { __DEV__: boolean };
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            expect(renderPanel().queryByTestId('debug-dialogue')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});
