/**
 * Spec 08 e2e — full exploration loop through fishing-village.
 *
 * Demo scenario: enter map → talk to Old Marrow (accept quest) → traverse
 * encounter / treasure / boss nodes → defeat the King of Revenge → quest
 * completes → currency reward granted, XP banked, loot in inventory.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createGameStore } from '../store';
import { nullAdapter } from '../persistence/null.adapter';
import {
    moveToNode, completeCurrentNode, resolveMapEvent, applyDialogueChoice,
    getMapDefinition,
} from '../../World';
import { Player } from '../../Character/characters.mock';
import { createCharacter } from '../../Character';
import { GameState } from '../types';
import { applyEffect, lookupEffect} from '../../Effects';
import { mockSequentialRng } from '../../test-utils/rng';

afterEach(() => vi.restoreAllMocks());

function bootstrap(): ReturnType<typeof createGameStore> {
    // Strong player so combat resolves quickly.
    const strongPlayer = createCharacter({
        name: 'Hero',
        level: 10,
        baseStats: { heart: 20, body: 20, mind: 20 },
        currency: 0,
    });
    const overrides: Partial<GameState> = { player: strongPlayer };
    return createGameStore(nullAdapter, overrides);
}

describe('Spec 08 e2e — fishing-village exploration loop', () => {
    it('accepts the quest, traverses the encounter gauntlet to the boss; quest completes; rewards granted', () => {
        // Fix RNG so encounter rolls and loot rolls are deterministic.
        mockSequentialRng(0.5);

        const store = bootstrap();

        // 1. Accept Old Marrow's quest. The starting map is now a combat
        // gauntlet, so fv-2 no longer fires the interaction — but Old Marrow's
        // NPC + tree still live in the map DEFINITION; the quest is accepted
        // through that tree.
        const def = getMapDefinition('coastal-continent', 'fishing-village');
        const tree = def.npcs!.find(n => n.name === 'Old Marrow')!.dialogueTree!;
        const root = tree.nodes[tree.rootId];
        const offer = root.choices!.find(c => c.nextNodeId === 'offer')!;
        const step1 = applyDialogueChoice(store.getState(), tree, offer);
        store.setState(step1.gameState);
        const accept = step1.nextNode!.choices!.find(c => c.effect?.startQuest)!;
        const step2 = applyDialogueChoice(store.getState(), tree, accept);
        store.setState(step2.gameState);
        expect(step2.effects.startedQuest).toBe('starting-quest');

        // 2. Traverse the spine to the boss. The intermediate nodes are a mix
        // of the three gate encounters (fv-26/27/28, 2026-09-21) and
        // recovery/texture nodes (rest at fv-3, gathering at fv-5); resolving
        // + completing each advances the unlock graph.
        for (const node of ['fv-2', 'fv-26', 'fv-3', 'fv-27', 'fv-4', 'fv-28', 'fv-5'] as const) {
            store.setState({ world: moveToNode(store.getState().world, node) });
            const r = resolveMapEvent(store.getState());
            store.setState(r.state);
            expect(r.event.kind).not.toBe('none');
            store.setState({ world: completeCurrentNode(store.getState().world) });
        }

        // 3. Boss encounter fv-6 → fight, win, quest auto-completes.
        store.setState({ world: moveToNode(store.getState().world, 'fv-6') });
        const bossRes = resolveMapEvent(store.getState());
        store.setState(bossRes.state);
        expect(bossRes.event.kind).toBe('encounter');
        if (bossRes.event.kind !== 'encounter') throw new Error('expected encounter');
        expect(bossRes.event.isBoss).toBe(true);
        expect(bossRes.event.encounter.enemies[0].name).toBe('The King of Revenge');
        const xpBefore = store.getState().player.experience;
        store.getState().startCombat(bossRes.event.encounter);
        const bossReport = store.getState().endCombat('victory');
        expect(bossReport.outcome).toBe('victory');
        expect(store.getState().player.experience).toBeGreaterThan(xpBefore);

        // Quest auto-completed via killObjectives in endCombat.
        expect(store.getState().quests.completed).toContain('starting-quest');
        // The 25-currency quest reward was granted automatically (the old
        // +10 treasure node is now an encounter in the gauntlet).
        expect(store.getState().player.currency).toBeGreaterThanOrEqual(25);
    });

});

// Compile-time sanity for the demo map's authored content.
describe('fishing-village authoring sanity', () => {
    it('has the demo NPC, shop, and quest registered', () => {
        const def = getMapDefinition('coastal-continent', 'fishing-village');
        expect(def.npcs?.some(n => n.name === 'Old Marrow')).toBe(true);
        expect(def.npcs?.some(n => n.isShopkeeper)).toBe(true);
        expect(def.quests?.some(q => q.name === 'starting-quest')).toBe(true);
        // Player reference unused.
        void Player;
    });
});
