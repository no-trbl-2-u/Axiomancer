/**
 * Hermetic component tests — DebugQuestState (real authored quests).
 *
 * The panel lists the quests the engine authors on a `MapDefinition`. No
 * quest is authored today, so the panel renders nothing; the start /
 * advance / complete helpers it drives are
 * pinned on the fixture quest in `state/dev/__tests__/story-catalog.test.ts`.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { DebugQuestState } from '@/components/DebugQuestState';
import { listQuests } from '@/state/dev/story-catalog';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

describe('DebugQuestState', () => {
    it('renders nothing while no quest is authored', () => {
        expect(listQuests()).toEqual([]);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const tree = render(<GameStoreProvider store={store}><DebugQuestState /></GameStoreProvider>);
        expect(tree.queryByTestId('debug-quests')).toBeNull();
        expect(tree.queryByTestId('debug-quest-start')).toBeNull();
    });
});
