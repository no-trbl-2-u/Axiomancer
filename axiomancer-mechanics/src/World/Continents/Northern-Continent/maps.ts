/**
 * Northern Continent map definitions (2026-08-28 — inter-map travel;
 * Phase W3 — the northern city).
 *
 * Map 1: THE CAVERNS — iron-ore galleries climbing toward the first
 * northern city (`map.library.ts`'s narrative). The player arrives
 * through the cave mouth at northern-forest `nf-10`. As of Phase W3 the
 * map no longer ends at the Under-Gate boss: `nc-26`, one column past
 * it, is the DOOR to `northern-city` — the gate the boss was keeping.
 * The sealed stair at `nc-16` stays sealed scenery ("whoever opens it
 * will do it from the other side, or through the gate below" — the gate
 * below is exactly what opens).
 *
 * Map 2: THE NORTHERN CITY — the continent's first city. Stone, guilds,
 * the iron trade, a harbor where a boat could be built (`map.library.ts`
 * narrative; spec 34 §1's Parish register). Lean urban: inns instead of
 * camps, two shops, priced scenery, fewer wilderness hazards. The way
 * onward to `connecting-river` is not shipped (W4) — the river-gate at
 * `ncy-23` is sealed scenery, and the map ends at the Harbormaster.
 *
 * Same column-layering law as the coastal maps (2026-08-08 first-map
 * audit; enforced by `src/World/e2e/map-traversal.engine.test.ts`):
 * every edge runs column x → x+1 where a node's column IS `location[0]`.
 *
 * Caverns: eleven columns, three lanes: the SEAM (y=+1, the mining lane —
 * both of the upper ore veins live here), the GALLERY (y=0, the spine),
 * and the SUMP (y=-1, the wet lane). Four singleton columns: c0 (the
 * arrival), c1 (the Delver — the quest-giver is guaranteed on every
 * route, the fv-2/Old Marrow precedent), c9 (the Under-Gate boss), and
 * c10 (the door up to the city — the fv-10 pattern: the way out sits
 * past the boss, so the door only opens once the gate's keeper is dealt
 * with). nc-24 hangs off the sump at [3,-2]; like fv-12/fv-13, its whole
 * column opens onto all of c4 so it can never strand a run.
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
                {
                    // Phase W3 — the way up. Placed last (index-stability
                    // convention); see the `the_stair` node comment.
                    text: "Is there a way up to the city?",
                    nextNodeId: 'the_stair',
                    effect: { startQuest: 'get-to-northern-city' },
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
        // Phase W3 — the get-to-northern-city grant. Appended LAST per the
        // index-stability convention (Coastal-Village maps.ts, Phase 46/62/63).
        // Ungated on purpose: the Delver will tell anyone the way up — the
        // door itself sits a column past the Under-Gate, so the boss still
        // gates the crossing in play. (Old Marrow's get-to-forest grant is
        // gated on the boss quest; here the map's own graph does that work.)
        the_stair: {
            id: 'the_stair',
            text: "\"One stair, and it is shut. The Under-Gate is not.\" She points her chin down the gallery. \"What keeps that gate has kept it a hundred years. Go armed, or go home.\"",
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
// that had no authored Quest object until now.
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

// Phase W3 — `get-to-northern-city` (a previously dangling CavernsQuests
// union member) is authored: granted by The Delver (the map's guaranteed
// singleton, so the grantor is on every route — the fv-2 precedent),
// completed by reaching `ncy-1` (the city arrival ticks the reach
// objective on its own resolution, the get-to-forest/nf-1 pattern).
const getToNorthernCityQuest: Quest = {
    name: 'get-to-northern-city',
    description: "Fight through the Under-Gate and climb into the northern city.",
    mapName: 'caverns',
    status: 'available',
    objectives: [
        {
            id: 'reach-northern-city',
            type: 'reach',
            target: 'ncy-1',
            description: "Reach the northern city.",
            requiredCount: 1,
            currentCount: 0,
        },
    ],
    reward: { kind: 'experience', amount: 50 },
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
        // ── c9 — the Under-Gate. Every run goes through here. ────────
        { id: 'nc-25', location: [9, 0], connectedNodes: ['nc-26'] },
        // ── c10 — the gate stands open (Phase W3). The DOOR to
        //        northern-city, one column past the boss — the fv-10
        //        pattern: the way out opens only after the map's climax.
        { id: 'nc-26', location: [10, 0], connectedNodes: [] },
    ],
    npcs: [theDelver],
    enemies: [],
    uniqueEvents: [],
    quests: [gatherIronQuest, getToNorthernCityQuest],
    images: {
        mapImage: { alt: '', src: '' },
        combatImage: { alt: '', src: '' },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// THE NORTHERN CITY (Phase W3) — map 2 of the northern continent.
// ═══════════════════════════════════════════════════════════════════════════

// ─── NPC content ──────────────────────────────────────────────────────────────

// The Gate-Clerk keeps the ledger at the top of the Under-Gate stair. The
// city's first face is a man counting what comes up out of the dark. Spec
// 34 §1: the machinery of collection outlived the faith that justified it.
const gateClerkTree: DialogueTree = {
    id: 'the-gate-clerk',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "A desk at the top of the stair. A man behind it, pen wet. \"Up from under. That is a column I have not used in years.\" He rules a line without looking down. \"Name goes in the book. The book stays here. You go where you like.\"",
            choices: [
                {
                    text: "Give your name.",
                    nextNodeId: 'named',
                    // Playing along with the machinery: an orderly, local read.
                    effect: { alignmentDelta: { epistemology: 1, scope: -1 } },
                },
                {
                    text: "What is the book for?",
                    nextNodeId: 'the_book',
                },
                {
                    text: "Walk past.",
                    nextNodeId: 'walked',
                },
            ],
        },
        named: {
            id: 'named',
            text: "He writes it smaller than you said it. \"There. The city knows you now, as much as it wants to.\" He points the pen at the street. \"Iron goes left. Water goes right. Trouble finds its own way.\"",
        },
        the_book: {
            id: 'the_book',
            text: "\"Nothing, any more. The office that read it burned in my father's time.\" He squares the ledger's corners. \"I keep it because the desk is dry and the wage is real. Ask a better question up the street.\"",
        },
        walked: {
            id: 'walked',
            text: "The pen does not pause. \"They all walk past,\" he says, to the book. \"The book stays open on principle.\"",
        },
    },
};

// The Shipwright works the harbor yard where a boat could be built — the
// `build-boat` seam (`quest.library.ts`, still dangling until its phase).
// She prices the hull in the same materials the map lets you gather.
const shipwrightTree: DialogueTree = {
    id: 'the-shipwright',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "A woman planes a rib of pale timber and does not stop for you. Half a hull stands over her like a carcass. \"Looking is free. Everything else is timber, pitch, and iron.\" The shavings curl and drop. \"Say what you want or take the free thing.\"",
            choices: [
                {
                    text: "Could you build me a boat?",
                    nextNodeId: 'the_price',
                },
                {
                    text: "Whose hull is that?",
                    nextNodeId: 'the_hull',
                },
                {
                    text: "Take the free thing. Look, and go.",
                    nextNodeId: 'looked',
                },
            ],
        },
        the_price: {
            id: 'the_price',
            text: "She sights down the plank. \"I could build a king a navy, given the materials. You are not a king.\" The plane resumes. \"Timber from the yard. Pitch from the walk. Iron from under the hill. Bring those and we will talk about boats.\"",
        },
        the_hull: {
            id: 'the_hull',
            text: "\"A trader's. He paid a third and drowned on other business.\" She knocks the rib once, listening to it. \"The river takes payment in more than one office. It is patient about collecting the rest.\"",
            choices: [
                {
                    text: "What happens to the hull now?",
                    nextNodeId: 'the_lien',
                },
                {
                    text: "Leave her to the work.",
                    nextNodeId: undefined,
                },
            ],
        },
        the_lien: {
            id: 'the_lien',
            // The Parish register: everything is obligation, even salvage.
            text: "\"It waits. A hull half-paid belongs to nobody, and nobody is a careful owner.\" She sets the plane down at last and looks at you. \"If you ever pay for a whole one, pay for the whole thing at once.\"",
        },
        looked: {
            id: 'looked',
            text: "You look. The hull is beautiful the way a rib cage is beautiful. She works on and lets the fact of it charge you nothing.",
        },
    },
};

const theGateClerk: NPC = {
    name: 'The Gate-Clerk',
    description: 'The man who keeps a dead office\'s ledger at the top of the Under-Gate stair.',
    dialogueTree: gateClerkTree,
};

const theShipwright: NPC = {
    name: 'The Shipwright',
    description: 'A woman building a drowned man\'s hull in the harbor yard, one rib at a time.',
    dialogueTree: shipwrightTree,
};

// ─── Map definition ───────────────────────────────────────────────────────────
//
// Ten columns, three lanes: the WALL (y=+1 — ramparts, yards, the assize
// bell), the HIGH STREET (y=0, the spine — inns, the market, the rumor),
// and the HARBOR (y=-1 — pitch, shops, the shipwright, the river-gate).
// Three singleton columns, the tolerated maximum: c0 (the arrival at the
// gatehouse), c1 (the Gate-Clerk — the city's first face on every route),
// and c9 (the Harbormaster — every run ends at the water). ncy-24 hangs
// off the harbor at [3,-2] (the drowned slip); its whole column opens
// onto all of c4 so it can never strand a run. The seam toward
// `connecting-river` is sealed scenery at ncy-23 (c8, the W2 nc-16
// pattern) — W4 ships that door.

const northernCity: MapDefinition = {
    name: 'northern-city',
    continent: 'northern-continent',
    description: 'The first city of the north. Stone streets, guild iron, a harbor that prices everything, and a river-gate nobody opens.',
    startingNode: {
        id: 'ncy-1',
        location: [0, 0],
        connectedNodes: ['ncy-2'],
    },
    nodes: [
        // ── c0 — the gatehouse. The nc-26 door lands here. ───────────
        { id: 'ncy-1',  location: [0, 0], connectedNodes: ['ncy-2'] },
        // ── c1 — the Gate-Clerk. A singleton column so the city's first
        //        face is on every route (the fv-2/nc-2 precedent).
        { id: 'ncy-2',  location: [1, 0], connectedNodes: ['ncy-10', 'ncy-3', 'ncy-17'] },
        // ── c2 — timber yard / encounter / loot ──────────────────────
        { id: 'ncy-10', location: [2, 1], connectedNodes: ['ncy-11', 'ncy-4'] },
        { id: 'ncy-3',  location: [2, 0], connectedNodes: ['ncy-11', 'ncy-4', 'ncy-18'] },
        { id: 'ncy-17', location: [2, -1], connectedNodes: ['ncy-4', 'ncy-18', 'ncy-24'] },
        // ── c3 — hazard / inn / gathering, plus ncy-24 hanging off the
        //        harbor at y=-2. Every node in this column opens onto ALL
        //        of c4 (lane drift relaxed, the fv/nc c3 pattern) so no
        //        lane — least of all ncy-24's — can strand a run.
        { id: 'ncy-11', location: [3, 1], connectedNodes: ['ncy-12', 'ncy-5', 'ncy-19'] },
        { id: 'ncy-4',  location: [3, 0], connectedNodes: ['ncy-12', 'ncy-5', 'ncy-19'] },
        { id: 'ncy-18', location: [3, -1], connectedNodes: ['ncy-12', 'ncy-5', 'ncy-19'] },
        { id: 'ncy-24', location: [3, -2], connectedNodes: ['ncy-12', 'ncy-5', 'ncy-19'] },
        // ── c4 — loot / the rumor / the chandlery ────────────────────
        { id: 'ncy-12', location: [4, 1], connectedNodes: ['ncy-13', 'ncy-6'] },
        { id: 'ncy-5',  location: [4, 0], connectedNodes: ['ncy-13', 'ncy-6', 'ncy-20'] },
        { id: 'ncy-19', location: [4, -1], connectedNodes: ['ncy-6', 'ncy-20'] },
        // ── c5 — loot / THE IRON MARKET / hazard ─────────────────────
        { id: 'ncy-13', location: [5, 1], connectedNodes: ['ncy-14', 'ncy-7'] },
        { id: 'ncy-6',  location: [5, 0], connectedNodes: ['ncy-14', 'ncy-7', 'ncy-21'] },
        { id: 'ncy-20', location: [5, -1], connectedNodes: ['ncy-7', 'ncy-21'] },
        // ── c6 — encounter / encounter / the shipwright ──────────────
        { id: 'ncy-14', location: [6, 1], connectedNodes: ['ncy-15', 'ncy-8'] },
        { id: 'ncy-7',  location: [6, 0], connectedNodes: ['ncy-15', 'ncy-8', 'ncy-22'] },
        { id: 'ncy-21', location: [6, -1], connectedNodes: ['ncy-8', 'ncy-22'] },
        // ── c7 — the assize bell / encounter / encounter ─────────────
        { id: 'ncy-15', location: [7, 1], connectedNodes: ['ncy-16', 'ncy-9'] },
        { id: 'ncy-8',  location: [7, 0], connectedNodes: ['ncy-16', 'ncy-9', 'ncy-23'] },
        { id: 'ncy-22', location: [7, -1], connectedNodes: ['ncy-9', 'ncy-23'] },
        // ── c8 — inn / inn / THE SEALED RIVER-GATE. The way toward
        //        connecting-river is scenery, not a door: W4 ships that
        //        map, so the exit is authored sealed (a cutscene) and the
        //        map ends at the Harbormaster instead (the W2 pattern).
        { id: 'ncy-16', location: [8, 1], connectedNodes: ['ncy-25'] },
        { id: 'ncy-9',  location: [8, 0], connectedNodes: ['ncy-25'] },
        { id: 'ncy-23', location: [8, -1], connectedNodes: ['ncy-25'] },
        // ── c9 — the Harbormaster. Every run ends at the water. ──────
        { id: 'ncy-25', location: [9, 0], connectedNodes: [] },
    ],
    npcs: [theGateClerk, theShipwright],
    enemies: [],
    uniqueEvents: [],
    // The city's own declared quests ('find-blacksmith', 'build-boat',
    // 'kill-some-time', 'get-to-connecting-river') stay dangling — their
    // phases (W4+) author them. `get-to-northern-city` lives on the
    // caverns, its granting map, per the get-to-forest precedent.
    quests: [],
    images: {
        mapImage: { alt: '', src: '' },
        combatImage: { alt: '', src: '' },
    },
};

export { caverns, northernCity };
