/**
 * Northern Continent map definitions (2026-08-28 — inter-map travel).
 *
 * First map of the second continent: THE CAVERNS — iron-ore galleries
 * climbing toward the first northern city (`map.library.ts`'s narrative).
 * The player arrives through the cave mouth at northern-forest `nf-10`;
 * the way onward to `northern-city` is not shipped yet, so the map ends
 * at an authored boss node (the Under-Gate) with the sealed stair beside
 * it as scenery — see the c8 comment below.
 *
 * Same column-layering law as the coastal maps (2026-08-08 first-map
 * audit; enforced by `src/World/e2e/map-traversal.engine.test.ts`):
 * every edge runs column x → x+1 where a node's column IS `location[0]`.
 *
 * Ten columns, three lanes: the SEAM (y=+1, the mining lane — both of
 * the upper ore veins live here), the GALLERY (y=0, the spine), and the
 * SUMP (y=-1, the wet lane). Three singleton columns, the tolerated
 * maximum: c0 (the arrival), c1 (the Delver — the quest-giver is
 * guaranteed on every route, the fv-2/Old Marrow precedent), and c9
 * (the boss — every run ends at the Under-Gate). nc-24 hangs off the
 * sump at [3,-2]; like fv-12/fv-13, its whole column opens onto all of
 * c4 so it can never strand a run.
 */

import { MapDefinition, Quest } from '../../types';
import { NPC, DialogueTree } from '../../../NPCs/types';

// ─── NPC content ──────────────────────────────────────────────────────────────

const delverTree: DialogueTree = {
    id: 'the-delver',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "A lamp hangs from a crooked post. Under it, a woman sorts ore from stone by touch. \"Down from the wood, then. Most come down faster, and in pieces.\" She does not look up. \"The seam runs high along the left wall. Iron pays. The dark does not.\"",
            choices: [
                {
                    text: "What do you want with the iron?",
                    nextNodeId: 'offer',
                },
                {
                    text: "Walk on.",
                    nextNodeId: undefined,
                },
            ],
        },
        offer: {
            id: 'offer',
            text: "\"The city up the stair buys every fist of it. The stair is shut. I stockpile and I wait.\" She weighs a lump of ore and sets it down. \"Cut me two fists from the seam and I will pay in coin you can spend somewhere with a roof.\"",
            choices: [
                {
                    text: "Agreed. (Accept the quest.)",
                    nextNodeId: 'accepted',
                    effect: { startQuest: 'gather-iron' },
                },
                {
                    text: "Carry your own ore.",
                    nextNodeId: 'refused',
                    // Cold refusal of a fair trade: self-first, colder read
                    // of the world.
                    effect: { alignmentDelta: { outlook: -1, scope: -1 } },
                },
            ],
        },
        accepted: {
            id: 'accepted',
            text: "\"Mind the props. Where the wood is new, the fall is old.\" She goes back to sorting. The lamp does not flicker. Nothing down here moves the air enough.",
        },
        refused: {
            id: 'refused',
            text: "\"So does everyone. That is why the stockpile is small.\" She says nothing else. The sorting resumes.",
        },
    },
};

const theDelver: NPC = {
    name: 'The Delver',
    description: 'A woman who mines the caverns alone and outlasts everything that objects.',
    dialogueTree: delverTree,
};

// ─── Quest content ────────────────────────────────────────────────────────────

// `gather-iron` is a declared CavernsQuests union member (quest.library.ts)
// that had no authored Quest object until now. `get-to-northern-city`, its
// sibling, stays dangling on purpose — its target map is not shipped.
const gatherIronQuest: Quest = {
    name: 'gather-iron',
    description: "Cut two fists of iron ore from the seam. The Delver pays in coin.",
    mapName: 'caverns',
    status: 'available',
    objectives: [
        {
            id: 'collect-iron-ore',
            type: 'collect',
            target: 'iron-ore',
            description: "Gather 2 iron ore.",
            requiredCount: 2,
            currentCount: 0,
        },
    ],
    reward: { kind: 'currency', amount: 25 },
};

// ─── Map definition ───────────────────────────────────────────────────────────

const caverns: MapDefinition = {
    name: 'caverns',
    continent: 'northern-continent',
    description: 'Iron galleries under the northern mountains; the ore is honest, the dark is not, and the only stair to the city is sealed.',
    startingNode: {
        id: 'nc-1',
        location: [0, 0],
        connectedNodes: ['nc-2'],
    },
    nodes: [
        // ── c0 — the mouth of the dark. The travel door at nf-10 lands here.
        { id: 'nc-1',  location: [0, 0], connectedNodes: ['nc-2'] },
        // ── c1 — The Delver, the quest-giver. A singleton column so the
        //        map's premise is on every route (fv-2 precedent).
        { id: 'nc-2',  location: [1, 0], connectedNodes: ['nc-10', 'nc-3', 'nc-17'] },
        // ── c2 — gathering / encounter / hazard ──────────────────────
        { id: 'nc-10', location: [2, 1], connectedNodes: ['nc-11', 'nc-4'] },
        { id: 'nc-3',  location: [2, 0], connectedNodes: ['nc-11', 'nc-4', 'nc-18'] },
        { id: 'nc-17', location: [2, -1], connectedNodes: ['nc-4', 'nc-18', 'nc-24'] },
        // ── c3 — gathering / rest / encounter, plus nc-24 hanging off the
        //        sump at y=-2. Every node in this column opens onto ALL of
        //        c4 (lane drift relaxed, the fv c3 pattern) so no lane —
        //        least of all nc-24's — can strand a run.
        { id: 'nc-11', location: [3, 1], connectedNodes: ['nc-12', 'nc-5', 'nc-19'] },
        { id: 'nc-4',  location: [3, 0], connectedNodes: ['nc-12', 'nc-5', 'nc-19'] },
        { id: 'nc-18', location: [3, -1], connectedNodes: ['nc-12', 'nc-5', 'nc-19'] },
        { id: 'nc-24', location: [3, -2], connectedNodes: ['nc-12', 'nc-5', 'nc-19'] },
        // ── c4 — loot / encounter / gathering ────────────────────────
        { id: 'nc-12', location: [4, 1], connectedNodes: ['nc-13', 'nc-6'] },
        { id: 'nc-5',  location: [4, 0], connectedNodes: ['nc-13', 'nc-6', 'nc-20'] },
        { id: 'nc-19', location: [4, -1], connectedNodes: ['nc-6', 'nc-20'] },
        // ── c5 — encounter / VILLAGE (the Ledger Camp) / hazard ──────
        { id: 'nc-13', location: [5, 1], connectedNodes: ['nc-14', 'nc-7'] },
        { id: 'nc-6',  location: [5, 0], connectedNodes: ['nc-14', 'nc-7', 'nc-21'] },
        { id: 'nc-20', location: [5, -1], connectedNodes: ['nc-7', 'nc-21'] },
        // ── c6 — loot / encounter / rest ─────────────────────────────
        { id: 'nc-14', location: [6, 1], connectedNodes: ['nc-15', 'nc-8'] },
        { id: 'nc-7',  location: [6, 0], connectedNodes: ['nc-15', 'nc-8', 'nc-22'] },
        { id: 'nc-21', location: [6, -1], connectedNodes: ['nc-8', 'nc-22'] },
        // ── c7 — encounter / encounter / hazard ──────────────────────
        { id: 'nc-15', location: [7, 1], connectedNodes: ['nc-16', 'nc-9'] },
        { id: 'nc-8',  location: [7, 0], connectedNodes: ['nc-16', 'nc-9', 'nc-23'] },
        { id: 'nc-22', location: [7, -1], connectedNodes: ['nc-9', 'nc-23'] },
        // ── c8 — THE SEALED STAIR / rest / loot. The stair toward
        //        northern-city is scenery, not a door: the next map is not
        //        shipped, so the exit is authored sealed (a cutscene) and
        //        the map ends at the boss instead.
        { id: 'nc-16', location: [8, 1], connectedNodes: ['nc-25'] },
        { id: 'nc-9',  location: [8, 0], connectedNodes: ['nc-25'] },
        { id: 'nc-23', location: [8, -1], connectedNodes: ['nc-25'] },
        // ── c9 — the Under-Gate. Every run ends here. ────────────────
        { id: 'nc-25', location: [9, 0], connectedNodes: [] },
    ],
    npcs: [theDelver],
    enemies: [],
    uniqueEvents: [],
    quests: [gatherIronQuest],
    images: {
        mapImage: { alt: '', src: '' },
        combatImage: { alt: '', src: '' },
    },
};

export { caverns };
