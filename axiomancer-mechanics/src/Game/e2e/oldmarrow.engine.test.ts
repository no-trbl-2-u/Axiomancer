/**
 * Hermetic e2e for Old Marrow — the first canonical moral dialogue tree.
 *
 * Phase 14 introduces a direct `moralDelta` field on `DialogueChoice.effect`
 * and threads three moral choices through Old Marrow's reward branch.
 * This file exercises all three paths end-to-end through the game store +
 * `applyDialogueChoice`, asserting on `state.moralMeter`,
 * `state.player.currency`, and `state.flags`.
 */

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

describe('Old Marrow — moral dialogue tree (Phase 14)', () => {

    it('declining politely from the offer node shifts +2', () => {
        const tree = findOldMarrowTree();
        const store = createGameStore(nullAdapter);
        const offer = tree.nodes['offer']!;
        const decline = offer.choices!.find(c => c.text.startsWith("I've got my own dead"))!;
        expect(decline.effect?.moralDelta).toBe(2);

        const result = applyDialogueChoice(store.getState(), tree, decline);
        expect(result.gameState.moralMeter).toBe(2);
        expect(result.effects.moralShift).toBe(2);
        // No quest started, no currency change.
        expect(result.gameState.quests.active).toEqual([]);
        expect(result.gameState.player.currency).toBe(store.getState().player.currency);
    });

    it('taking only half the reward shifts +5 and grants 12 coin', () => {
        const tree = findOldMarrowTree();
        const store = createGameStore(nullAdapter);

        // Simulate post-quest state: the player has completed the starting quest
        // so the `requires: { questCompleted: 'starting-quest' }` gate opens.
        const baseState = store.getState();
        const completed = completeQuest(baseState.quests, 'starting-quest');
        const startingCurrency = baseState.player.currency;
        const primed = { ...baseState, quests: completed };

        const thanks = tree.nodes['thanks']!;
        const half = thanks.choices!.find(c => c.text.startsWith('Take only half'))!;
        expect(half.effect?.moralDelta).toBe(5);
        expect(half.effect?.grantCurrency).toBe(12);

        const result = applyDialogueChoice(primed, tree, half);
        expect(result.gameState.moralMeter).toBe(5);
        expect(result.gameState.player.currency).toBe(startingCurrency + 12);
    });

    it('demanding double shifts -4, grants 25 coin, sets marrow_pressed flag', () => {
        const tree = findOldMarrowTree();
        const store = createGameStore(nullAdapter);

        const baseState = store.getState();
        const completed = completeQuest(baseState.quests, 'starting-quest');
        const startingCurrency = baseState.player.currency;
        const primed = { ...baseState, quests: completed };

        const thanks = tree.nodes['thanks']!;
        const demand = thanks.choices!.find(c => c.text.startsWith('This nearly killed'))!;
        expect(demand.effect?.moralDelta).toBe(-4);
        expect(demand.effect?.grantCurrency).toBe(25);
        expect(demand.effect?.setFlag).toBe('marrow_pressed');

        const result = applyDialogueChoice(primed, tree, demand);
        expect(result.gameState.moralMeter).toBe(-4);
        expect(result.gameState.player.currency).toBe(startingCurrency + 25);
        expect(result.gameState.flags).toContain('marrow_pressed');
    });

    it('moral shifts compose across choices in a single playthrough', () => {
        const tree = findOldMarrowTree();
        const store = createGameStore(nullAdapter);

        // Decline politely first (+2), then later accept the half-share (+5) =
        // +7 total. Re-prime quests between the two choices since they live on
        // separate nodes.
        const decline = tree.nodes['offer']!.choices!.find(c => c.text.startsWith("I've got my own dead"))!;
        const firstStep = applyDialogueChoice(store.getState(), tree, decline);
        expect(firstStep.gameState.moralMeter).toBe(2);

        const withQuest = { ...firstStep.gameState, quests: completeQuest(firstStep.gameState.quests, 'starting-quest') };
        const half = tree.nodes['thanks']!.choices!.find(c => c.text.startsWith('Take only half'))!;
        const secondStep = applyDialogueChoice(withQuest, tree, half);
        expect(secondStep.gameState.moralMeter).toBe(7);
    });
});
