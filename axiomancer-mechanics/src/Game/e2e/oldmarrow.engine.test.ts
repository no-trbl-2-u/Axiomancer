/**
 * Hermetic e2e for Old Marrow's dialogue tree.
 *
 * Exercises the offer and reward branches end-to-end through the game store +
 * `applyDialogueChoice`, asserting on `state.player.currency`,
 * `state.quests` and `state.flags`. (The moral-meter shifts these choices
 * once carried were removed with GRACE, T6 / D39.)
 */

import { createStartingWorld } from '../../World';
import { describe, it, expect } from 'vitest';
import { createGameStore } from '../store';
import { nullAdapter } from '../persistence/null.adapter';
import { getMapDefinition } from '../../World/map.registry';
import { applyDialogueChoice } from '../../World/dialogue.runtime';
import { completeQuest } from '../../World/quest.engine';

function findOldMarrowTree() {
    const def = getMapDefinition('coastal-continent', 'fishing-village');
    const npc = def.npcs!.find(n => n.name === 'Old Marrow');
    expect(npc).toBeDefined();
    expect(npc!.dialogueTree).toBeDefined();
    return npc!.dialogueTree!;
}

describe('Old Marrow — dialogue tree (Phase 14)', () => {

    it('declining politely from the offer node starts no quest and moves no coin', () => {
        const tree = findOldMarrowTree();
        const store = createGameStore(nullAdapter, { world: createStartingWorld('fishing-village') });
        const offer = tree.nodes['offer']!;
        const decline = offer.choices!.find(c => c.text.startsWith("I've got my own dead"))!;

        const result = applyDialogueChoice(store.getState(), tree, decline);
        // No quest started, no currency change.
        expect(result.gameState.quests.active).toEqual([]);
        expect(result.gameState.player.currency).toBe(store.getState().player.currency);
    });

    it('taking only half the reward grants 12 coin', () => {
        const tree = findOldMarrowTree();
        const store = createGameStore(nullAdapter, { world: createStartingWorld('fishing-village') });

        // Simulate post-quest state: the player has completed the starting quest
        // so the `requires: { questCompleted: 'starting-quest' }` gate opens.
        const baseState = store.getState();
        const completed = completeQuest(baseState.quests, 'starting-quest');
        const startingCurrency = baseState.player.currency;
        const primed = { ...baseState, quests: completed };

        const thanks = tree.nodes['thanks']!;
        const half = thanks.choices!.find(c => c.text.startsWith('Take only half'))!;
        expect(half.effect?.grantCurrency).toBe(12);

        const result = applyDialogueChoice(primed, tree, half);
        expect(result.gameState.player.currency).toBe(startingCurrency + 12);
    });

    it('demanding double grants 25 coin and sets the marrow_pressed flag', () => {
        const tree = findOldMarrowTree();
        const store = createGameStore(nullAdapter, { world: createStartingWorld('fishing-village') });

        const baseState = store.getState();
        const completed = completeQuest(baseState.quests, 'starting-quest');
        const startingCurrency = baseState.player.currency;
        const primed = { ...baseState, quests: completed };

        const thanks = tree.nodes['thanks']!;
        const demand = thanks.choices!.find(c => c.text.startsWith('This nearly killed'))!;
        expect(demand.effect?.grantCurrency).toBe(25);
        expect(demand.effect?.setFlag).toBe('marrow_pressed');

        const result = applyDialogueChoice(primed, tree, demand);
        expect(result.gameState.player.currency).toBe(startingCurrency + 25);
        expect(result.gameState.flags).toContain('marrow_pressed');
    });

    it('asking "where should I head" grants get-to-forest once starting-quest is complete (Phase 8)', () => {
        const tree = findOldMarrowTree();
        const store = createGameStore(nullAdapter, { world: createStartingWorld('fishing-village') });

        const baseState = store.getState();
        const primed = { ...baseState, quests: completeQuest(baseState.quests, 'starting-quest') };

        const thanks = tree.nodes['thanks']!;
        const nextSteps = thanks.choices!.find(c => c.text.startsWith('Where should I head'))!;
        expect(nextSteps.effect?.startQuest).toBe('get-to-forest');
        expect(nextSteps.requires?.questCompleted).toBe('starting-quest');

        const result = applyDialogueChoice(primed, tree, nextSteps);
        expect(result.gameState.quests.active.some(q => q.name === 'get-to-forest')).toBe(true);
        expect(result.effects.startedQuest).toBe('get-to-forest');
    });
});
