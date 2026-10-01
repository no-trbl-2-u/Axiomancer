/**
 * Neutral test fixtures for the plumbing with no authored content (R7e, D72).
 *
 * Act 1 stages no NPC, shop or quest, so dialogue, shops and the quest engine
 * have no live carrier. These placeholders are their witnesses: suites and
 * state fixtures (`stagedEvent`) use them, the live world never registers
 * them, and their text is placeholder copy, not story (D58).
 */

import type { NPC } from '../../NPCs/types';
import type { ShopInventory } from '../../Items/shop.types';
import type { MapEventPayload } from '../../World/MapEvents/types';
import type { Quest } from '../../World/types';

/** A quest with one `reach` objective on an Act 1 node. */
export const FIXTURE_QUEST: Quest = {
    name: 'fixture-quest',
    description: 'A placeholder quest.',
    mapName: 'breakwater',
    objectives: [{
        id: 'reach-bw-2',
        type: 'reach',
        description: 'Reach bw-2.',
        target: 'bw-2',
        requiredCount: 1,
        currentCount: 0,
    }],
    reward: { kind: 'currency', amount: 1 },
    status: 'available',
};

/** A two-node dialogue: one choice starts the fixture quest, one leaves. */
export const FIXTURE_NPC: NPC = {
    name: 'Fixture NPC',
    description: 'A placeholder speaker.',
    dialogueTree: {
        id: 'fixture-npc',
        rootId: 'start',
        nodes: {
            start: {
                id: 'start',
                text: 'A placeholder line.',
                choices: [
                    { text: 'Take the quest.', nextNodeId: 'end', effect: { startQuest: FIXTURE_QUEST.name } },
                    { text: 'Leave.' },
                ],
            },
            end: { id: 'end', text: 'A closing line.' },
        },
    },
};

/** A shop that sells the healing potion. */
export const FIXTURE_SHOP: ShopInventory = {
    wares: [{ itemId: 'minor-healing-potion', price: 12 }],
};

/** Staged events for the arrival state fixtures (`StateFixture.stagedEvent`). */
export const FIXTURE_DIALOGUE_EVENT: MapEventPayload = {
    kind: 'narration',
    dialogue: FIXTURE_NPC.dialogueTree!,
};

export const FIXTURE_VILLAGE_EVENT: MapEventPayload = {
    kind: 'village',
    villageName: 'Fixture Shop',
    merchants: [{ name: 'Fixture Shopkeeper', isShopkeeper: true }],
    shop: FIXTURE_SHOP,
};

export const FIXTURE_CUTSCENE_EVENT: MapEventPayload = {
    kind: 'cutscene',
    lines: ['A placeholder line.', 'A second placeholder line.'],
};
