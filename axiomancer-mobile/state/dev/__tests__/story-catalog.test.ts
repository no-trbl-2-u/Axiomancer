/**
 * Hermetic tests — dev story catalogue (real NPCs + real quests).
 *
 * Pins:
 *   - `listNpcs` finds staged NPCs with trees across maps, unique keys.
 *   - `listQuests` finds the authored quest line in campaign order.
 *   - `openNpcDialogue` seeds an interaction + cursor at the tree root
 *     that `selectHasActiveEvent` recognises.
 *   - start → advance → complete moves a real quest through the log.
 */

import {
    advanceQuest,
    completeQuestByName,
    listNpcs,
    listQuests,
    openNpcDialogue,
    questStatus,
    startQuestByName,
} from '@/state/dev/story-catalog';
import { selectHasActiveEvent } from '@/state/presenters/event.engine';
import { createAppStore } from '@/state/store';

describe('story-catalog dev helpers', () => {
    it('lists staged NPC trees with unique keys across maps', () => {
        const npcs = listNpcs();
        expect(npcs.length).toBeGreaterThan(0);
        expect(new Set(npcs.map((n) => n.key)).size).toBe(npcs.length);
        expect(npcs.some((n) => n.map === 'fishing-village')).toBe(true);
        for (const n of npcs) expect(n.tree.nodes[n.tree.rootId]).toBeDefined();
    });

    it('lists the authored quest line starting with starting-quest', () => {
        const quests = listQuests();
        expect(quests[0]?.key).toBe('starting-quest');
        expect(quests.map((q) => q.key)).toEqual(expect.arrayContaining(['get-to-forest', 'gather-wood']));
    });

    it('openNpcDialogue seeds an interaction with a cursor at the root', () => {
        const store = createAppStore();
        const npc = listNpcs()[0];
        openNpcDialogue(store, npc);
        const slice = store.getState().event;
        expect(selectHasActiveEvent(store.getState())).toBe(true);
        expect((slice.pending!.event as { kind: string; npcName: string }).npcName).toBe(npc.name);
        expect(slice.dialogueCursor?.nodeId).toBe(npc.tree.rootId);
    });

    it('start → advance → complete walks a real quest through the log', () => {
        const store = createAppStore();
        const quest = listQuests()[0];
        expect(advanceQuest(store, quest)).toBe(false);
        startQuestByName(store, quest);
        expect(questStatus(store.getState(), quest.key)).toBe('active');
        expect(advanceQuest(store, quest)).toBe(true);
        // A one-objective quest auto-completes on its first advance; a
        // longer one stays active with a bumped counter. Either is progress.
        const afterAdvance = store.getState();
        const active = afterAdvance.quests.active.find((q) => q.name === quest.key);
        expect(active ? active.objectives[0].currentCount >= 1 : questStatus(afterAdvance, quest.key) === 'done').toBe(true);
        completeQuestByName(store, quest);
        expect(questStatus(store.getState(), quest.key)).toBe('done');
    });
});
