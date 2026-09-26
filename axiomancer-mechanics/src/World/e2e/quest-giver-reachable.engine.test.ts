/**
 * Phase 53c — the finding, as a test.
 *
 * Before this phase, `starting-quest` had exactly two authored start
 * sites, both inside Old Marrow's dialogue tree — and Old Marrow had no
 * node. `fishing-village` had exactly one `interaction` node (`fv-19`),
 * and it named a `Weathered Fisher` who existed in no roster. The map's
 * premise quest was never active in real play.
 *
 * This is the assertion that could not pass before Phase 53c: starting
 * from a fresh game state, a legal route reaches Old Marrow, his greeting
 * is available through the real navigation + event-resolution path (not
 * fetched directly off the map definition), and `starting-quest` becomes
 * active.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    moveToNode, resolveMapEvent, applyDialogueChoice,
} from '../index';
import { createNewGameState } from '../../Game/game.reducer';
import { mockSequentialRng } from '../../test-utils/rng';

afterEach(() => vi.restoreAllMocks());

describe('starting-quest is reachable in live play (Phase 53c)', () => {
    it('walks a fresh state to Old Marrow, resolves his greeting, and starts the quest', () => {
        mockSequentialRng(0.5);
        const state = createNewGameState({ startMap: 'fishing-village' });

        // The one legal move from the start node.
        const world = moveToNode(state.world, 'fv-2');
        expect(world.currentMap.currentNode).toBe('fv-2');

        const arrived = { ...state, world };
        const result = resolveMapEvent(arrived);
        expect(result.event.kind).toBe('interaction');
        if (result.event.kind !== 'interaction') return;

        // The node resolves to the rostered NPC, not a name nobody answers to.
        expect(result.event.npcName).toBe('Old Marrow');
        expect(result.event.dialogue).toBeDefined();
        const tree = result.event.dialogue!;

        const greet = tree.nodes[tree.rootId];
        const offerChoice = greet.choices!.find(c => c.text.startsWith('What needs'))!;
        const step1 = applyDialogueChoice(result.state, tree, offerChoice);
        expect(step1.nextNode?.id).toBe('offer');

        const acceptChoice = step1.nextNode!.choices!.find(c => c.effect?.startQuest === 'starting-quest')!;
        const step2 = applyDialogueChoice(step1.gameState, tree, acceptChoice);

        expect(step2.effects.startedQuest).toBe('starting-quest');
        expect(step2.gameState.quests.active.find(q => q.name === 'starting-quest')).toBeDefined();
    });
});
