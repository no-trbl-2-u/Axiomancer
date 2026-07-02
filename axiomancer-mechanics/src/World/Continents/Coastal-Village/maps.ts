/**
 * Coastal Continent map definitions (Spec 08 Q5A — static templates only).
 *
 * Each export is a frozen `MapDefinition`. Runtime per-save progress lives in
 * `MapState`, built via `createMapState(definition)` and stored under
 * `WorldState.currentMap`.
 *
 * The `fishing-village` chain demos the full Spec 08 exploration loop in
 * post-Phase-23 MapEventKind terms (`npc` and `shop` were folded into
 * `interaction` and `village`):
 *   fv-1 (start) → fv-2 (interaction — quest giver) → fv-3 (village — shop)
 *                → fv-4 (encounter) → fv-5 (loot-cache) → fv-6 (encounter — boss).
 */

import { MapDefinition, Quest } from '../../types';
import { NPC, DialogueTree } from '../../../NPCs/types';
import { captainBlackwater, fishermansDaughter, villageHealer, unionLeader, merchantWidow } from './npcs';
import { shrineKeeper, chronicler, wanderingPhilosopher, forestRanger, hermitSage, lostTrader } from '../Northern-Forest/npcs';

/**
 * CoastalContinentMapNames are all the maps in the Coastal Continent
 * - 'fishing-village': Starting village. Quest giver + shop + boss chain.
 * - 'northern-forest': Small forest. Gather Wood.
 */
export type CoastalContinentMapNames =
  'fishing-village' |
  'northern-forest';

// ─── NPC content for fishing-village ──────────────────────────────────────────

const oldDockmasterTree: DialogueTree = {
    // Phase 63 — observed tree. applyDialogueChoice writes the player's
    // current alignment cell id to state.lastSeenAlignmentCells['old-marrow']
    // after each choice; the gull_recognition-style reactive branch below
    // surfaces when the player's cell has shifted since the last visit.
    id: 'old-marrow',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "Old Marrow looks up from a tangle of nets. \"You've a sturdy back, child. Care to earn a coin?\"",
            choices: [
                {
                    text: "What needs doing?",
                    nextNodeId: 'offer',
                },
                {
                    text: "Leave him be.",
                    nextNodeId: undefined,
                },
                {
                    // Phase 63 — reactive branch surfacing when the player's
                    // alignment cell has shifted since the last conversation
                    // with Old Marrow. Placed LAST per the stable-index
                    // convention. The observer cache is keyed by tree.id.
                    text: "(Stand quietly. He looks up and sees who you have become.)",
                    nextNodeId: 'observer_recognition',
                    requires: { playerAlignmentCellChangedSince: true },
                    effect: {
                        moralDelta: 1,
                        alignmentDelta: { outlook: 1 },
                    },
                },
            ],
        },
        offer: {
            id: 'offer',
            text: "\"A great crab — bigger than my hauling-table — has nested at the breakwater. Bring me proof you've slain it and the coin is yours.\"",
            choices: [
                {
                    text: "Consider it done. (Accept the quest.)",
                    nextNodeId: 'accepted',
                    effect: { startQuest: 'starting-quest' },
                },
                {
                    text: "I've got my own dead to bury — maybe later.",
                    nextNodeId: undefined,
                    // Phase 43 — declining for personal grief: scope leans
                    // individual; outlook nudges pessimistic via the weight
                    // of acknowledged loss.
                    effect: { moralDelta: 2, alignmentDelta: { outlook: -1, scope: -2 } },
                },
                {
                    // Phase 46 — pessimistic-only branch. Surfaces only when
                    // the player already shares Old Marrow's grief-shape.
                    // Two-broken-people recognition: he opens up because you
                    // arrive carrying the same weight.
                    text: "You speak like someone who already lost everything.",
                    nextNodeId: 'accepted',
                    requires: { requiresAlignment: { axis: 'outlook', op: 'lte', value: -34 } },
                    effect: {
                        startQuest: 'starting-quest',
                        alignmentDelta: { outlook: -1, scope: 1 },
                    },
                },
            ],
        },
        accepted: {
            id: 'accepted',
            text: "Old Marrow nods slowly. \"Mind the tide. The reef takes the careless.\"",
        },
        observer_recognition: {
            id: 'observer_recognition',
            // Phase 63 — terminal node for the post-shift reactive branch.
            // Old Marrow has been weighing nets long enough to notice when
            // the wind off a person changes.
            text: "He sets the net down. \"Aye. Something's moved in you since we last spoke. The sea makes that kind of weather too — a tide that turns inside, not on the chart.\" He doesn't ask which way it turned.",
        },
        thanks: {
            id: 'thanks',
            text: "\"You did it, then. Take this — gods know I've no use for coin where I'm headed.\"",
            choices: [
                {
                    text: "Take it — coin keeps a man fed.",
                    nextNodeId: undefined,
                    requires: { questCompleted: 'starting-quest' },
                    effect: { grantCurrency: 25 },
                },
                {
                    text: "Take only half — your need is greater than mine.",
                    nextNodeId: undefined,
                    requires: { questCompleted: 'starting-quest' },
                    // Phase 43 — Faith-Optimistic-Relational lean (Jean
                    // Valjean / Dorothy Day cells): mercy + service.
                    effect: {
                        grantCurrency: 12,
                        moralDelta: 5,
                        alignmentDelta: { epistemology: -2, outlook: 3, scope: 3 },
                    },
                },
                {
                    text: "This nearly killed me. Pay double or keep it.",
                    nextNodeId: undefined,
                    requires: { questCompleted: 'starting-quest' },
                    // Phase 43 — Logic-Pessimistic-Individual lean (Underground
                    // Man cell): hyper-rational grievance + self-prioritisation.
                    effect: {
                        grantCurrency: 25,
                        moralDelta: -4,
                        setFlag: 'marrow_pressed',
                        alignmentDelta: { epistemology: 3, outlook: -3, scope: -3 },
                    },
                },
            ],
        },
    },
};

const tideshopkeeperTree: DialogueTree = {
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "\"Saltwater hardtack and twine. Coin only.\"",
            choices: [
                {
                    text: "Browse the stall.",
                    nextNodeId: 'browse',
                },
                {
                    text: "Walk on.",
                    nextNodeId: undefined,
                },
            ],
        },
        browse: {
            id: 'browse',
            text: "The shopkeeper gestures at three crates. (Shop implementation lands in a later spec.)",
        },
    },
};

const oldMarrow: NPC = {
    name: 'Old Marrow',
    description: 'A weather-worn dockmaster who has lost too many to the tide.',
    dialogueTree: oldDockmasterTree,
};

const tideShopkeeper: NPC = {
    name: 'Tide-Shopkeeper',
    description: 'Sells salt-cured fare from a stall by the wharf.',
    dialogueTree: tideshopkeeperTree,
    isShopkeeper: true,
};

const beggarTree: DialogueTree = {
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "A haggard figure sits against the weathered wall, an empty bowl at their feet. \"Spare a coin for one fallen on hard times? The sea took my nets... my livelihood...\"",
            choices: [
                {
                    text: "Give 10 gold generously. \"Here, take this.\"",
                    nextNodeId: 'grateful_generous',
                    // Phase 43 — Faith-Optimistic-Relational lean.
                    effect: {
                        grantCurrency: -10,
                        moralDelta: 5,
                        alignmentDelta: { epistemology: -2, outlook: 2, scope: 3 },
                    },
                },
                {
                    text: "Give 5 gold. \"I can spare a little.\"",
                    nextNodeId: 'grateful_small',
                    effect: { grantCurrency: -5, moralDelta: 1 },
                },
                {
                    text: "Offer to share your rations instead.",
                    nextNodeId: 'grateful_kind',
                    // Phase 43 — Agnostic-Optimistic-Relational lean (Atticus
                    // Finch / Dewey cells): practical kindness without
                    // metaphysical justification.
                    effect: {
                        moralDelta: 3,
                        alignmentDelta: { outlook: 2, scope: 2 },
                    },
                },
                {
                    text: "\"Everyone has their struggles.\" (Walk away)",
                    nextNodeId: 'dismissed',
                    effect: { moralDelta: -1 },
                },
                {
                    text: "\"Find work like everyone else.\" (Be harsh)",
                    nextNodeId: 'harsh',
                    // Phase 43 — Logic-Pessimistic-Individual lean: cold
                    // rationality + dismissal of relational obligation.
                    effect: {
                        moralDelta: -5,
                        alignmentDelta: { epistemology: 2, outlook: -2, scope: -3 },
                    },
                },
                {
                    // Phase 46 — transcendent-only branch (placed LAST so the
                    // index-based tests in moral.meter.engine.test.ts keep
                    // their assertions stable). A player whose scope already
                    // reaches past the individual hears the beggar as a node
                    // in the larger weave; the recognition changes the
                    // encounter.
                    text: "Sit with them a while. Their grief is part of yours.",
                    nextNodeId: 'grateful_kind',
                    requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 34 } },
                    effect: {
                        moralDelta: 4,
                        alignmentDelta: { epistemology: -1, outlook: 1, scope: 2 },
                    },
                },
                {
                    // Phase 62 — flag-gated branch surfacing only after the
                    // player has befriended the Mournful Gull (which sets
                    // the `befriended-mournful-gull` flag via its
                    // friendshipReward.flagSet). The beggar's voice softens
                    // when they recognise a fellow listener. Placed LAST per
                    // the same index-stability convention.
                    text: "\"I've been hearing the gulls quieter, lately.\" (Mention the Mournful Gull.)",
                    nextNodeId: 'gull_recognition',
                    requires: { flag: 'befriended-mournful-gull' },
                    effect: {
                        moralDelta: 2,
                        alignmentDelta: { outlook: 1, scope: 1 },
                    },
                },
            ],
        },
        grateful_generous: {
            id: 'grateful_generous',
            text: "The beggar's eyes brighten with genuine gratitude. \"Ten gold! Bless you, kind soul. This will see me through the harsh season.\" They clutch the coins with trembling hands. [Moral meter +5]",
        },
        grateful_small: {
            id: 'grateful_small',
            text: "The beggar nods gratefully. \"Five gold is more kindness than most show. Thank you, friend.\" [Moral meter +1]",
        },
        grateful_kind: {
            id: 'grateful_kind',
            text: "The beggar's weathered face lights up. \"You would share your own food? Such kindness is rarer than gold. I'll remember this.\" [Moral meter +3]",
        },
        dismissed: {
            id: 'dismissed',
            text: "The beggar nods wearily, accustomed to indifference. \"Aye, we all must find our way.\" They turn back to watching the harbor. [Moral meter -1]",
        },
        harsh: {
            id: 'harsh',
            text: "The beggar recoils as if struck. \"I... I have tried. But the storms...\" They lower their head in shame and say no more. [Moral meter -5]",
        },
        gull_recognition: {
            id: 'gull_recognition',
            // Phase 62 — terminal node for the post-befriend-gull dialogue
            // branch. Establishes the village as a small network of listeners
            // who notice when a known bitter creature stops circling.
            text: "The beggar's head tilts. \"Aye. She used to scream the same names every dawn. I'd thought she was warning us. Maybe she was just keeping count.\" Their gaze settles on the harbor. \"It's good to hear a quieter morning.\"",
        },
    },
};

const coastalBeggar: NPC = {
    name: 'Coastal Beggar',
    description: 'A weather-beaten soul whose luck ran out with the changing tides.',
    dialogueTree: beggarTree,
};

// ─── Quest content ────────────────────────────────────────────────────────────

const startingQuest: Quest = {
    name: 'starting-quest',
    description: "Slay the Coastal Tyrant nesting at the breakwater. Old Marrow will reward you.",
    mapName: 'fishing-village',
    status: 'available',
    objectives: [
        {
            id: 'kill-tyrant',
            type: 'kill',
            target: 'The Coastal Tyrant',
            description: "Defeat the Coastal Tyrant.",
            requiredCount: 1,
            currentCount: 0,
        },
    ],
    reward: { kind: 'currency', amount: 25 },
};

// ─── Map definitions ──────────────────────────────────────────────────────────
//
// Per Spec 23 / Phase 24, node events are no longer authored on the
// MapDefinition. The legacy `nodeEvents` block was removed in Phase 25;
// see `src/World/MapEvents/content.ts` for the per-node pool overrides
// that drive `resolveMapEvent` against fishing-village + northern-forest.

const fishingVillage: MapDefinition = {
    name: 'fishing-village',
    continent: 'coastal-continent',
    description: 'Your home town: familiar faces, salty air, old shacks lining the docks.',
    // Phase 65 — expanded from a linear 10-node chain to a 25-node
    // branching grid with three sub-areas: Harbor District (y=+1..+2),
    // Inland Streets (y=-1..-2), and Cliff Path (y=+1..+2 east). Spine
    // fv-1..fv-10 preserved verbatim along y=0 so existing tests / Phase
    // 43 / Phase 62 / Phase 63 wiring continue to work unmodified; new
    // connectedNodes extend (don't replace) the spine entries.
    startingNode: {
        id: 'fv-1',
        location: [0, 0],
        connectedNodes: ['fv-2', 'fv-11'],
    },
    nodes: [
        // ── Spine (Phase 1 era; preserved by Phase 65 D1) ────────────
        { id: 'fv-1',  location: [0, 0], connectedNodes: ['fv-2', 'fv-11'] },
        { id: 'fv-2',  location: [1, 0], connectedNodes: ['fv-3', 'fv-12'] },
        { id: 'fv-3',  location: [2, 0], connectedNodes: ['fv-4', 'fv-13', 'fv-16'] },
        { id: 'fv-4',  location: [3, 0], connectedNodes: ['fv-5', 'fv-17'] },
        { id: 'fv-5',  location: [4, 0], connectedNodes: ['fv-6', 'fv-18'] },
        { id: 'fv-6',  location: [5, 0], connectedNodes: ['fv-7'] },
        { id: 'fv-7',  location: [6, 0], connectedNodes: ['fv-8', 'fv-21'] },
        { id: 'fv-8',  location: [7, 0], connectedNodes: ['fv-9', 'fv-22'] },
        { id: 'fv-9',  location: [8, 0], connectedNodes: ['fv-10'] },
        { id: 'fv-10', location: [9, 0], connectedNodes: [] },
        // ── Harbor district (Phase 65; y=+1..+2; fv-15 dead-end) ──────
        { id: 'fv-11', location: [0, 1], connectedNodes: ['fv-1', 'fv-12', 'fv-14'] },
        { id: 'fv-12', location: [1, 1], connectedNodes: ['fv-2', 'fv-11', 'fv-13'] },
        { id: 'fv-13', location: [2, 1], connectedNodes: ['fv-3', 'fv-12'] },
        { id: 'fv-14', location: [0, 2], connectedNodes: ['fv-11', 'fv-15'] },
        { id: 'fv-15', location: [1, 2], connectedNodes: ['fv-14'] },
        // ── Inland streets (Phase 65; y=-1..-2; fv-17 ↔ fv-19 loop) ──
        { id: 'fv-16', location: [2, -1], connectedNodes: ['fv-3', 'fv-17'] },
        { id: 'fv-17', location: [3, -1], connectedNodes: ['fv-4', 'fv-16', 'fv-18', 'fv-19'] },
        { id: 'fv-18', location: [4, -1], connectedNodes: ['fv-5', 'fv-17', 'fv-19'] },
        { id: 'fv-19', location: [3, -2], connectedNodes: ['fv-17', 'fv-18', 'fv-20'] },
        { id: 'fv-20', location: [4, -2], connectedNodes: ['fv-19'] },
        // ── Cliff path (Phase 65; y=+1..+2 east; fv-25 dead-end) ─────
        { id: 'fv-21', location: [6, 1], connectedNodes: ['fv-7', 'fv-22', 'fv-24'] },
        { id: 'fv-22', location: [7, 1], connectedNodes: ['fv-8', 'fv-21', 'fv-23'] },
        { id: 'fv-23', location: [8, 1], connectedNodes: ['fv-22', 'fv-24'] },
        { id: 'fv-24', location: [8, 2], connectedNodes: ['fv-21', 'fv-23', 'fv-25'] },
        { id: 'fv-25', location: [9, 2], connectedNodes: ['fv-24'] },
    ],
    npcs: [oldMarrow, tideShopkeeper, coastalBeggar, captainBlackwater, fishermansDaughter, villageHealer, unionLeader, merchantWidow],
    enemies: [],
    uniqueEvents: [],
    quests: [startingQuest],
    images: {
        mapImage: { alt: '', src: '' },
        combatImage: { alt: '', src: '' },
    },
};

const northernForest: MapDefinition = {
    name: 'northern-forest',
    continent: 'coastal-continent',
    description: 'A pine-thick wood inland from the village; cold springs, low light, and a cave mouth at the far edge.',
    startingNode: {
        id: 'nf-1',
        location: [0, 0],
        connectedNodes: ['nf-2', 'nf-3'],
    },
    nodes: [
        // Existing spine (preserved)
        { id: 'nf-1',  location: [0, 0], connectedNodes: ['nf-2', 'nf-3'] },
        { id: 'nf-2',  location: [1, 0], connectedNodes: ['nf-4'] },
        { id: 'nf-3',  location: [1, 1], connectedNodes: ['nf-5', 'nf-12'] },
        { id: 'nf-4',  location: [2, 0], connectedNodes: ['nf-6'] },
        { id: 'nf-5',  location: [2, 1], connectedNodes: ['nf-6', 'nf-20'] },
        { id: 'nf-6',  location: [3, 0], connectedNodes: ['nf-7', 'nf-15'] },
        { id: 'nf-7',  location: [4, 0], connectedNodes: ['nf-8', 'nf-11'] },
        { id: 'nf-8',  location: [5, 0], connectedNodes: ['nf-9', 'nf-18'] },
        { id: 'nf-9',  location: [6, 0], connectedNodes: ['nf-10', 'nf-22'] },
        { id: 'nf-10', location: [7, 0], connectedNodes: [] },
        
        // Mist Ridge sub-area
        { id: 'nf-11', location: [4, -1], connectedNodes: ['nf-7'] },
        
        // Glen Path sub-area
        { id: 'nf-12', location: [1, -1], connectedNodes: ['nf-3', 'nf-13', 'nf-20'] },
        { id: 'nf-13', location: [2, -1], connectedNodes: ['nf-12', 'nf-14'] },
        { id: 'nf-14', location: [3, -1], connectedNodes: ['nf-13'] },
        
        // Bone Hollow sub-area
        { id: 'nf-15', location: [3, 1], connectedNodes: ['nf-6', 'nf-16'] },
        { id: 'nf-16', location: [4, 1], connectedNodes: ['nf-15', 'nf-17'] },
        { id: 'nf-17', location: [5, 1], connectedNodes: ['nf-16'] },
        
        // Mist Ridge continued
        { id: 'nf-18', location: [5, -1], connectedNodes: ['nf-8', 'nf-19'] },
        { id: 'nf-19', location: [6, -1], connectedNodes: ['nf-18'] },
        
        // Glen Path lower branch
        { id: 'nf-20', location: [1, -2], connectedNodes: ['nf-5', 'nf-12', 'nf-21'] },
        { id: 'nf-21', location: [2, -2], connectedNodes: ['nf-20'] },
        
        // Mist Ridge east
        { id: 'nf-22', location: [6, 0], connectedNodes: ['nf-9', 'nf-23'] },
        { id: 'nf-23', location: [7, 0], connectedNodes: ['nf-22', 'nf-24'] },
        { id: 'nf-24', location: [7, -1], connectedNodes: ['nf-23', 'nf-25'] },
        { id: 'nf-25', location: [8, -1], connectedNodes: ['nf-24'] },
    ],
    npcs: [shrineKeeper, chronicler, wanderingPhilosopher, forestRanger, hermitSage, lostTrader],
    enemies: [],
    uniqueEvents: [],
    quests: [],
    images: {
        mapImage: { alt: '', src: '' },
        combatImage: { alt: '', src: '' },
    },
};

export { fishingVillage, northernForest };
