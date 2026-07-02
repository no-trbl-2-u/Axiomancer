/**
 * Hermetic e2e — Phase 63 NPC alignment observers.
 *
 * Drives the observer cycle for Old Marrow's tree end-to-end:
 *   1. First conversation: no cached cell → reactive branch hidden.
 *   2. After applyDialogueChoice on an identified tree, the cell is
 *      cached at state.lastSeenAlignmentCells['old-marrow'].
 *   3. Shift the player's alignment to a different cell.
 *   4. Re-converse: visibleChoices surfaces the reactive branch.
 *   5. Apply the reactive branch → cache updates to the new cell.
 *
 * Unrelated trees (no `id`) opt out: their applyDialogueChoice does
 * not write to lastSeenAlignmentCells; their gates always hide.
 */

import { describe, it, expect } from 'vitest';
import { createGameStore } from '../store';
import { nullAdapter } from '../persistence/null.adapter';
import { applyDialogueChoice } from '../../World/dialogue.runtime';
import { visibleChoices } from '../../NPCs';
import { getMapDefinition } from '../../World/map.registry';
import { getAlignmentCell } from '../../Philosophy';

function loadOldMarrow() {
    const fishingVillage = getMapDefinition('coastal-continent', 'fishing-village');
    const npc = fishingVillage.npcs!.find(n => n.name === 'Old Marrow')!;
    return { tree: npc.dialogueTree!, npc };
}

describe('Phase 63 — Old Marrow alignment observer', () => {
    it("observer_recognition branch is hidden when there's no cached cell (first visit)", () => {
        const { tree } = loadOldMarrow();
        const greet = tree.nodes.greet;
        const visible = visibleChoices(greet, {
            activeQuests: new Set(),
            completedQuests: new Set(),
            flags: new Set(),
            alignment: { epistemology: 0, outlook: 0, scope: 0 },
            // lastSeenAlignmentCellId: undefined — no prior observation
        });
        expect(visible.find(c => c.nextNodeId === 'observer_recognition')).toBeUndefined();
    });

    it('applyDialogueChoice writes the current cell to state.lastSeenAlignmentCells[tree.id]', () => {
        const store = createGameStore(nullAdapter);
        const { tree } = loadOldMarrow();
        // Pick a benign choice (no alignmentDelta on this one) so the cell
        // is unchanged by the choice itself.
        const benign = tree.nodes.greet.choices!.find(c => c.text === 'Leave him be.')!;
        const next = applyDialogueChoice(store.getState(), tree, benign);
        const expectedCellId = getAlignmentCell(next.gameState.philosophicalAlignment).id;
        expect(next.gameState.lastSeenAlignmentCells).toEqual({
            'old-marrow': expectedCellId,
        });
    });

    it('observer_recognition branch surfaces after a shift + re-converse', () => {
        const store = createGameStore(nullAdapter);
        const { tree } = loadOldMarrow();
        // Step 1 — first visit caches the starting cell.
        const benign = tree.nodes.greet.choices!.find(c => c.text === 'Leave him be.')!;
        const afterFirst = applyDialogueChoice(store.getState(), tree, benign);

        // Step 2 — shift alignment to a different cell.
        const shifted = {
            ...afterFirst.gameState,
            philosophicalAlignment: { epistemology: 67, outlook: 67, scope: 67 },
        };
        const cachedCellId = afterFirst.gameState.lastSeenAlignmentCells!['old-marrow'];
        const currentCellId = getAlignmentCell(shifted.philosophicalAlignment).id;
        expect(cachedCellId).not.toBe(currentCellId);

        // Step 3 — re-converse; visibleChoices on greet should surface the
        // reactive branch.
        const visible = visibleChoices(tree.nodes.greet, {
            activeQuests: new Set(),
            completedQuests: new Set(),
            flags: new Set(),
            alignment: shifted.philosophicalAlignment,
            lastSeenAlignmentCellId: cachedCellId,
        });
        const reactive = visible.find(c => c.nextNodeId === 'observer_recognition');
        expect(reactive).toBeDefined();
        expect(reactive!.text).toMatch(/Stand quietly/);
    });

    it('observer_recognition branch stays hidden when the cell has NOT changed', () => {
        const store = createGameStore(nullAdapter);
        const { tree } = loadOldMarrow();
        const benign = tree.nodes.greet.choices!.find(c => c.text === 'Leave him be.')!;
        const afterFirst = applyDialogueChoice(store.getState(), tree, benign);

        // Re-converse without shifting alignment.
        const visible = visibleChoices(tree.nodes.greet, {
            activeQuests: new Set(),
            completedQuests: new Set(),
            flags: new Set(),
            alignment: afterFirst.gameState.philosophicalAlignment,
            lastSeenAlignmentCellId: afterFirst.gameState.lastSeenAlignmentCells!['old-marrow'],
        });
        expect(visible.find(c => c.nextNodeId === 'observer_recognition')).toBeUndefined();
    });

    it('unidentified tree (no id) does NOT write to lastSeenAlignmentCells', () => {
        const store = createGameStore(nullAdapter);
        const fishingVillage = getMapDefinition('coastal-continent', 'fishing-village');
        const beggar = fishingVillage.npcs!.find(n => n.name === 'Coastal Beggar')!;
        const beggarTree = beggar.dialogueTree!;
        // Sanity: beggar tree has no id (only Old Marrow's tree was authored
        // with one per Phase 63 D1).
        expect(beggarTree.id).toBeUndefined();
        const benign = beggarTree.nodes.greet.choices!.find(c => c.text.startsWith('"Everyone has'))!;
        const next = applyDialogueChoice(store.getState(), beggarTree, benign);
        // The cache stays undefined (cold-start; no other tree wrote it).
        expect(next.gameState.lastSeenAlignmentCells).toBeUndefined();
    });
});
