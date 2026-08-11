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
                {
                    // Phase 8 — placed LAST per this file's index-stability
                    // convention (Phase 46/62/63). Old Marrow points the
                    // player toward the mid-game gate once the boss is dead.
                    text: "Where should I head, now that's done?",
                    nextNodeId: 'next_steps',
                    requires: { questCompleted: 'starting-quest' },
                    effect: { startQuest: 'get-to-forest' },
                },
            ],
        },
        next_steps: {
            id: 'next_steps',
            // Phase 8 — terminal node for the get-to-forest quest grant.
            text: "\"North, past the last shacks. The road turns to forest before the wind picks up. Mind the treeline — the family that keeps the village fed doesn't walk past it lightly.\"",
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
            text: "A haggard figure sits against the weathered wall, an empty bowl at their feet. \"Spare what you can. The sea took my nets. It kept the rest.\"",
            choices: [
                {
                    text: "Give ten gold. \"Take it.\"",
                    nextNodeId: 'grateful_generous',
                    // Phase 43 — Faith-Optimistic-Relational lean.
                    effect: {
                        grantCurrency: -10,
                        moralDelta: 5,
                        alignmentDelta: { epistemology: -2, outlook: 2, scope: 3 },
                    },
                },
                {
                    text: "Give five gold. \"I can spare this much.\"",
                    nextNodeId: 'grateful_small',
                    effect: { grantCurrency: -5, moralDelta: 1 },
                },
                {
                    text: "Offer your rations instead.",
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
                    text: "\"Everyone carries something.\" (Walk on.)",
                    nextNodeId: 'dismissed',
                    effect: { moralDelta: -1 },
                },
                {
                    text: "\"Find work, like everyone else.\" (Speak coldly.)",
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
                    text: "Sit with them a while. Their grief is yours too.",
                    nextNodeId: 'grateful_kind',
                    requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 34 } },
                    effect: {
                        moralDelta: 4,
                        alignmentDelta: { epistemology: -1, outlook: 1, scope: 2 },
                    },
                },
                {
                    // Phase 62 — flag-gated branch surfacing only after the
                    // player has befriended Little Belle (which sets the
                    // `befriended-little-belle` flag via its
                    // friendshipReward.flagSet). The beggar's voice softens
                    // when they recognise a fellow listener. Placed LAST per
                    // the same index-stability convention.
                    text: "\"The bell by the docks has gone quiet.\" (Mention Little Belle.)",
                    nextNodeId: 'gull_recognition',
                    requires: { flag: 'befriended-little-belle' },
                    effect: {
                        moralDelta: 2,
                        alignmentDelta: { outlook: 1, scope: 1 },
                    },
                },
            ],
        },
        grateful_generous: {
            id: 'grateful_generous',
            text: "The beggar's hands close around the coins, trembling. \"Ten gold. This sees me through the season.\" They do not look up again.",
        },
        grateful_small: {
            id: 'grateful_small',
            text: "The beggar nods. \"Five gold is more than most spare. My thanks.\"",
        },
        grateful_kind: {
            id: 'grateful_kind',
            text: "The beggar's face eases. \"You'd give your own food. That is rarer than gold. I'll remember it.\"",
        },
        dismissed: {
            id: 'dismissed',
            text: "The beggar nods, unsurprised. \"Aye. We all find our own way.\" They turn back to the harbor.",
        },
        harsh: {
            id: 'harsh',
            text: "The beggar flinches as if struck. \"I have tried. The storms took more than nets.\" They lower their head and say nothing further.",
        },
        gull_recognition: {
            id: 'gull_recognition',
            // Phase 62 — terminal node for the post-befriend-gull dialogue
            // branch. Establishes the village as a small network of listeners
            // who notice when a known bitter creature stops circling.
            text: "The beggar's head tilts. \"Aye. It rang the same hour every dawn. I'd thought it was tolling for us. Maybe it was just keeping the service.\" Their gaze settles on the harbor. \"It's good to hear a quieter morning.\"",
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
    description: "Slay the King of Revenge holding court at the breakwater. Old Marrow will reward you.",
    mapName: 'fishing-village',
    status: 'available',
    objectives: [
        {
            id: 'kill-tyrant',
            type: 'kill',
            target: 'The King of Revenge',
            description: "Defeat the King of Revenge.",
            requiredCount: 1,
            currentCount: 0,
        },
    ],
    reward: { kind: 'currency', amount: 25 },
};

// Phase 8 — the mid-game gate. `quest.library.ts` has declared these three
// QuestName union members since before the nexus loop; none had an authored
// Quest object until now.
const getToForestQuest: Quest = {
    name: 'get-to-forest',
    description: "Leave the village and walk the coast road north into the forest.",
    mapName: 'fishing-village',
    status: 'available',
    objectives: [
        {
            id: 'reach-forest',
            type: 'reach',
            target: 'nf-1',
            description: "Reach the northern forest.",
            requiredCount: 1,
            currentCount: 0,
        },
    ],
    reward: { kind: 'experience', amount: 30 },
};

const gatherWoodQuest: Quest = {
    name: 'gather-wood',
    description: "Gather three bundles of oak branches for the Hermit Sage's hearth.",
    mapName: 'northern-forest',
    status: 'available',
    objectives: [
        {
            id: 'collect-oak-branch',
            type: 'collect',
            target: 'oak-branch',
            description: "Collect 3 oak branches.",
            requiredCount: 3,
            currentCount: 0,
        },
    ],
    reward: { kind: 'currency', amount: 20 },
};

const getToCaveQuest: Quest = {
    name: 'get-to-cave',
    description: "Follow the Forest Ranger's directions to the cave at the forest's edge.",
    mapName: 'northern-forest',
    status: 'available',
    objectives: [
        {
            id: 'reach-cave',
            type: 'reach',
            target: 'nf-10',
            description: "Reach the cave mouth.",
            requiredCount: 1,
            currentCount: 0,
        },
    ],
    reward: { kind: 'experience', amount: 40 },
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
    // 2026-08-08 first-map audit — re-layered from the Phase 65 free-form
    // grid into a COLUMN-LAYERED forward gauntlet (the Slay-the-Spire
    // shape). The Phase 65 grid mixed one-way spine edges with two-way
    // sub-area edges under the gauntlet's completed-node lock, and that
    // combination stranded runs: eight nodes could be entered with every
    // remaining neighbour already completed, leaving zero legal moves and
    // no UI recovery. The shortest strand was four nodes deep
    // (fv-1 → fv-11 → fv-14 → fv-15), and across all 260 possible routes
    // the breakwater boss (fv-6) and the quest-board node (fv-15) were
    // NEVER co-reachable in one life. See `docs/reports/FIRST-MAP-AUDIT.md`.
    //
    // The layering law, enforced by `auditMapTraversal` + the hermetic
    // invariant test in `src/World/e2e/map-traversal.engine.test.ts`:
    //
    //   Every edge runs from column x to column x+1, where a node's
    //   column IS its `location[0]`.
    //
    // Because a run therefore visits exactly one node per column and can
    // never revisit a column, no node's forward neighbours can already be
    // completed — strands become structurally impossible rather than
    // patched. `connectedNodes` lists forward neighbours only; that
    // one-way authoring is now deliberate and is what the invariant reads.
    //
    // Ten columns, three lanes: the WHARF LANE (y=+1), the SPINE (y=0),
    // and the INLAND LANE (y=-1). Lanes drift — a node at y reaches every
    // next-column node within one step of y — so a route is a real
    // sequence of choices rather than a committed corridor. Column 5 holds
    // fv-6 alone, so every single run now fights the King of Revenge.
    // Spine ids fv-1..fv-10 stay on y=0 at x=0..9 (Phase 65 D1).
    startingNode: {
        id: 'fv-1',
        location: [0, 0],
        connectedNodes: ['fv-2', 'fv-12', 'fv-13'],
    },
    nodes: [
        // ── c0 — the shore you wake on ───────────────────────────────
        { id: 'fv-1',  location: [0, 0], connectedNodes: ['fv-2', 'fv-12', 'fv-13'] },
        // ── c1 — encounter / loot / gathering ────────────────────────
        { id: 'fv-12', location: [1, 1], connectedNodes: ['fv-3', 'fv-16'] },
        { id: 'fv-2',  location: [1, 0], connectedNodes: ['fv-3', 'fv-16', 'fv-11'] },
        { id: 'fv-13', location: [1, -1], connectedNodes: ['fv-3', 'fv-11'] },
        // ── c2 — encounter / rest / loot ─────────────────────────────
        { id: 'fv-16', location: [2, 1], connectedNodes: ['fv-4', 'fv-17'] },
        { id: 'fv-3',  location: [2, 0], connectedNodes: ['fv-4', 'fv-17', 'fv-14'] },
        { id: 'fv-11', location: [2, -1], connectedNodes: ['fv-4', 'fv-14'] },
        // ── c3 — loot / encounter / narration. This column alone opens
        //        onto ALL of c4 (lane drift relaxed) so every route can
        //        reach the pre-boss rest at fv-20 — the pre-audit map's
        //        stated "heal before the climax" intent, now guaranteed.
        { id: 'fv-17', location: [3, 1], connectedNodes: ['fv-15', 'fv-5', 'fv-20'] },
        { id: 'fv-4',  location: [3, 0], connectedNodes: ['fv-15', 'fv-5', 'fv-20'] },
        { id: 'fv-14', location: [3, -1], connectedNodes: ['fv-15', 'fv-5', 'fv-20'] },
        // ── c4 — the last breath: quest board / gathering / REST ─────
        { id: 'fv-15', location: [4, 1], connectedNodes: ['fv-6'] },
        { id: 'fv-5',  location: [4, 0], connectedNodes: ['fv-6'] },
        { id: 'fv-20', location: [4, -1], connectedNodes: ['fv-6'] },
        // ── c5 — the breakwater. Every route passes through here. ────
        { id: 'fv-6',  location: [5, 0], connectedNodes: ['fv-18', 'fv-7', 'fv-19'] },
        // ── c6 — hazard / encounter / interaction ────────────────────
        { id: 'fv-18', location: [6, 1], connectedNodes: ['fv-8', 'fv-21'] },
        { id: 'fv-7',  location: [6, 0], connectedNodes: ['fv-8', 'fv-21', 'fv-25'] },
        { id: 'fv-19', location: [6, -1], connectedNodes: ['fv-8', 'fv-25'] },
        // ── c7 — encounter / gathering / rest ────────────────────────
        { id: 'fv-21', location: [7, 1], connectedNodes: ['fv-9', 'fv-22'] },
        { id: 'fv-8',  location: [7, 0], connectedNodes: ['fv-9', 'fv-22', 'fv-23'] },
        { id: 'fv-25', location: [7, -1], connectedNodes: ['fv-9', 'fv-23'] },
        // ── c8 — gathering / rest / hazard ───────────────────────────
        { id: 'fv-22', location: [8, 1], connectedNodes: ['fv-24', 'fv-10'] },
        { id: 'fv-9',  location: [8, 0], connectedNodes: ['fv-24', 'fv-10'] },
        { id: 'fv-23', location: [8, -1], connectedNodes: ['fv-10'] },
        // ── c9 — the coast road out. Authored terminal column. ───────
        { id: 'fv-24', location: [9, 1], connectedNodes: [] },
        { id: 'fv-10', location: [9, 0], connectedNodes: [] },
    ],
    npcs: [oldMarrow, tideShopkeeper, coastalBeggar, captainBlackwater, fishermansDaughter, villageHealer, unionLeader, merchantWidow],
    enemies: [],
    uniqueEvents: [],
    quests: [startingQuest, getToForestQuest],
    images: {
        mapImage: { alt: '', src: '' },
        combatImage: { alt: '', src: '' },
    },
};

const northernForest: MapDefinition = {
    name: 'northern-forest',
    continent: 'coastal-continent',
    description: 'A pine-thick wood inland from the village; cold springs, low light, and a cave mouth at the far edge.',
    // 2026-08-08 first-map audit — re-layered onto the same column law as
    // fishing-village above (see that block's comment for the full
    // rationale and the invariant test). The Phase-65-era forest carried
    // the identical defect: seven nodes could strand a run outright, the
    // longest single life covered 13 of 25 nodes, and nf-9/nf-22 and
    // nf-10/nf-23 shared grid coordinates so the map canvas drew them
    // stacked on top of each other.
    //
    // Nine columns, three lanes: the RIDGE (y=+1), the TRAIL (y=0), and
    // the GLEN (y=-1). nf-10 — the cave mouth the `get-to-cave` quest
    // reaches for — moves to the authored terminal column so the map ends
    // where the story says it ends.
    startingNode: {
        id: 'nf-1',
        location: [0, 0],
        connectedNodes: ['nf-3', 'nf-2', 'nf-12'],
    },
    nodes: [
        // ── c0 — the treeline ────────────────────────────────────────
        { id: 'nf-1',  location: [0, 0], connectedNodes: ['nf-3', 'nf-2', 'nf-12'] },
        // ── c1 — interaction / gathering / encounter ─────────────────
        { id: 'nf-3',  location: [1, 1], connectedNodes: ['nf-5', 'nf-4'] },
        { id: 'nf-2',  location: [1, 0], connectedNodes: ['nf-5', 'nf-4', 'nf-13'] },
        { id: 'nf-12', location: [1, -1], connectedNodes: ['nf-4', 'nf-13'] },
        // ── c2 — interaction / rest / gathering ──────────────────────
        { id: 'nf-5',  location: [2, 1], connectedNodes: ['nf-15', 'nf-6'] },
        { id: 'nf-4',  location: [2, 0], connectedNodes: ['nf-15', 'nf-6', 'nf-14'] },
        { id: 'nf-13', location: [2, -1], connectedNodes: ['nf-6', 'nf-14'] },
        // ── c3 — hazard / encounter / interaction ────────────────────
        { id: 'nf-15', location: [3, 1], connectedNodes: ['nf-16', 'nf-7'] },
        { id: 'nf-6',  location: [3, 0], connectedNodes: ['nf-16', 'nf-7', 'nf-11'] },
        { id: 'nf-14', location: [3, -1], connectedNodes: ['nf-7', 'nf-11'] },
        // ── c4 — loot / interaction / rest ───────────────────────────
        { id: 'nf-16', location: [4, 1], connectedNodes: ['nf-17', 'nf-8'] },
        { id: 'nf-7',  location: [4, 0], connectedNodes: ['nf-17', 'nf-8', 'nf-20'] },
        { id: 'nf-11', location: [4, -1], connectedNodes: ['nf-8', 'nf-20'] },
        // ── c5 — cutscene / village / loot ───────────────────────────
        { id: 'nf-17', location: [5, 1], connectedNodes: ['nf-21', 'nf-9'] },
        { id: 'nf-8',  location: [5, 0], connectedNodes: ['nf-21', 'nf-9', 'nf-19'] },
        { id: 'nf-20', location: [5, -1], connectedNodes: ['nf-9', 'nf-19'] },
        // ── c6 — cutscene / interaction / encounter ──────────────────
        { id: 'nf-21', location: [6, 1], connectedNodes: ['nf-22', 'nf-23'] },
        { id: 'nf-9',  location: [6, 0], connectedNodes: ['nf-22', 'nf-23', 'nf-18'] },
        { id: 'nf-19', location: [6, -1], connectedNodes: ['nf-23', 'nf-18'] },
        // ── c7 — gathering / interaction / village ───────────────────
        { id: 'nf-22', location: [7, 1], connectedNodes: ['nf-24', 'nf-10'] },
        { id: 'nf-23', location: [7, 0], connectedNodes: ['nf-24', 'nf-10', 'nf-25'] },
        { id: 'nf-18', location: [7, -1], connectedNodes: ['nf-10', 'nf-25'] },
        // ── c8 — rest / THE CAVE MOUTH / hazard. Terminal column. ────
        { id: 'nf-24', location: [8, 1], connectedNodes: [] },
        { id: 'nf-10', location: [8, 0], connectedNodes: [] },
        { id: 'nf-25', location: [8, -1], connectedNodes: [] },
    ],
    npcs: [shrineKeeper, chronicler, wanderingPhilosopher, forestRanger, hermitSage, lostTrader],
    enemies: [],
    uniqueEvents: [],
    quests: [gatherWoodQuest, getToCaveQuest],
    images: {
        mapImage: { alt: '', src: '' },
        combatImage: { alt: '', src: '' },
    },
};

export { fishingVillage, northernForest };
