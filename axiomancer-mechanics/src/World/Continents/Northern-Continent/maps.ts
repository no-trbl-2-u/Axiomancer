/**
 * Northern Continent map definitions (2026-08-28 — inter-map travel;
 * Phase W3 — the northern city).
 *
 * 2026-09-21, D1 — every map in this file carries LATERAL LANE RIBS on
 * top of its forward skeleton: sideways edges between neighbouring lanes
 * in each multi-node column except the terminal one, authored both ways.
 * The forward skeleton (column x -> x+1) is untouched, so every route
 * still takes the same beats and meets the same boss; the ribs give the
 * canvas a branching web to draw and give frontier roaming a sideways
 * step. See `Coastal-Village/maps.ts`'s layering-law block for the full
 * rationale and `forwardEdges()` in `world.reducer.ts` for the split.
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
 * camps, two shops, priced scenery, fewer wilderness hazards. As of Phase
 * W4 the map no longer ends at the Harbormaster: `ncy-26`, one column past
 * him, is the DOOR to `connecting-river` — the water-gate he was keeping.
 * `ncy-23` stays sealed scenery (flavor beside the last inns, the nc-16
 * pattern); the real door sits past the boss.
 *
 * Map 3: THE CONNECTING RIVER — a boat trip downriver to the islanders'
 * territory, where a child is chosen each generation to be put forward as
 * the King's next advisor. Wild again after the city: camps instead of
 * inns, one trading post instead of a market. The advisor-rumor flags
 * planted at `ncy-5` (and the "crowning ceremony" flags from S-01's
 * northern-forest dilemma) get their payoff at `cr-9`.
 *
 * Map 4: TOWN ACROSS THE RIVER — the coda. Home of the sweetheart the boy
 * left behind; her own village puts her forward the same way the
 * islanders did. Deliberately small (`map.library.ts`'s own narrative
 * frames it as a homecoming, not a new front) — four columns, no door
 * onward yet.
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
            text: "A lamp hangs from a crooked post. Under it, a woman sorts ore from stone by touch. “Down from the wood, then. Most come down faster, and in pieces.” She does not look up. “The seam runs high along the left wall. Iron pays. The dark does not.”",
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
            text: "“The city up the stair buys every fist of it. The stair is shut. I stockpile and I wait.” She weighs a lump of ore and sets it down. “Cut me two fists from the seam and I will pay in coin you can spend somewhere with a roof.”",
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
            text: "“Mind the props. Where the wood is new, the fall is old.” She goes back to sorting. The lamp does not flicker. Nothing down here moves the air enough.",
        },
        refused: {
            id: 'refused',
            text: "“So does everyone. That is why the stockpile is small.” She says nothing else. The sorting resumes.",
        },
        // Phase W3 — the get-to-northern-city grant. Appended LAST per the
        // index-stability convention (Coastal-Village maps.ts, Phase 46/62/63).
        // Ungated on purpose: the Delver will tell anyone the way up — the
        // door itself sits a column past the Under-Gate, so the boss still
        // gates the crossing in play. (Old Marrow's get-to-forest grant is
        // gated on the boss quest; here the map's own graph does that work.)
        the_stair: {
            id: 'the_stair',
            text: "“One stair, and it is shut. The Under-Gate is not.” She points her chin down the gallery. “What keeps that gate has kept it a hundred years. Go armed, or go home.”",
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
        { id: 'nc-10', location: [2, 1], connectedNodes: ['nc-11', 'nc-4', 'nc-3'] },
        { id: 'nc-3',  location: [2, 0], connectedNodes: ['nc-11', 'nc-4', 'nc-18', 'nc-10', 'nc-17'] },
        { id: 'nc-17', location: [2, -1], connectedNodes: ['nc-4', 'nc-18', 'nc-24', 'nc-3'] },
        // ── c3 — gathering / rest / encounter, plus nc-24 hanging off the
        //        sump at y=-2. Every node in this column opens onto ALL of
        //        c4 (lane drift relaxed, the fv c3 pattern) so no lane —
        //        least of all nc-24's — can strand a run.
        { id: 'nc-11', location: [3, 1], connectedNodes: ['nc-12', 'nc-5', 'nc-19', 'nc-4'] },
        { id: 'nc-4',  location: [3, 0], connectedNodes: ['nc-12', 'nc-5', 'nc-19', 'nc-11', 'nc-18'] },
        { id: 'nc-18', location: [3, -1], connectedNodes: ['nc-12', 'nc-5', 'nc-19', 'nc-4', 'nc-24'] },
        { id: 'nc-24', location: [3, -2], connectedNodes: ['nc-12', 'nc-5', 'nc-19', 'nc-18'] },
        // ── c4 — loot / encounter / gathering ────────────────────────
        { id: 'nc-12', location: [4, 1], connectedNodes: ['nc-13', 'nc-6', 'nc-5'] },
        { id: 'nc-5',  location: [4, 0], connectedNodes: ['nc-13', 'nc-6', 'nc-20', 'nc-12', 'nc-19'] },
        { id: 'nc-19', location: [4, -1], connectedNodes: ['nc-6', 'nc-20', 'nc-5'] },
        // ── c5 — encounter / VILLAGE (the Ledger Camp) / hazard ──────
        { id: 'nc-13', location: [5, 1], connectedNodes: ['nc-14', 'nc-7', 'nc-6'] },
        { id: 'nc-6',  location: [5, 0], connectedNodes: ['nc-14', 'nc-7', 'nc-21', 'nc-13', 'nc-20'] },
        { id: 'nc-20', location: [5, -1], connectedNodes: ['nc-7', 'nc-21', 'nc-6'] },
        // ── c6 — loot / encounter / rest ─────────────────────────────
        { id: 'nc-14', location: [6, 1], connectedNodes: ['nc-15', 'nc-8', 'nc-7'] },
        { id: 'nc-7',  location: [6, 0], connectedNodes: ['nc-15', 'nc-8', 'nc-22', 'nc-14', 'nc-21'] },
        { id: 'nc-21', location: [6, -1], connectedNodes: ['nc-8', 'nc-22', 'nc-7'] },
        // ── c7 — encounter / encounter / hazard ──────────────────────
        { id: 'nc-15', location: [7, 1], connectedNodes: ['nc-16', 'nc-9', 'nc-8'] },
        { id: 'nc-8',  location: [7, 0], connectedNodes: ['nc-16', 'nc-9', 'nc-23', 'nc-15', 'nc-22'] },
        { id: 'nc-22', location: [7, -1], connectedNodes: ['nc-9', 'nc-23', 'nc-8'] },
        // ── c8 — THE SEALED STAIR / rest / loot. The stair toward
        //        northern-city is scenery, not a door: it is authored
        //        sealed (a cutscene); the real door is nc-26, one column
        //        past the boss (Phase W3).
        { id: 'nc-16', location: [8, 1], connectedNodes: ['nc-25', 'nc-9'] },
        { id: 'nc-9',  location: [8, 0], connectedNodes: ['nc-25', 'nc-16', 'nc-23'] },
        { id: 'nc-23', location: [8, -1], connectedNodes: ['nc-25', 'nc-9'] },
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
            text: "A desk at the top of the stair. A man behind it, pen wet. “Up from under. That is a column I have not used in years.” He rules a line without looking down. “Name goes in the book. The book stays here. You go where you like.”",
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
                {
                    // Phase W4 — the way to the river. Placed last (index-
                    // stability convention); see the `the_water_gate` node
                    // comment.
                    text: "Is there a way to the river from here?",
                    nextNodeId: 'the_water_gate',
                    effect: { startQuest: 'get-to-connecting-river' },
                },
            ],
        },
        named: {
            id: 'named',
            text: "He writes it smaller than you said it. “There. The city knows you now, as much as it wants to.” He points the pen at the street. “Iron goes left. Water goes right. Trouble finds its own way.”",
        },
        the_book: {
            id: 'the_book',
            text: "“Nothing, any more. The office that read it burned in my father's time.” He squares the ledger's corners. “I keep it because the desk is dry and the wage is real. Ask a better question up the street.”",
        },
        walked: {
            id: 'walked',
            text: "The pen does not pause. “They all walk past,” he says, to the book. “The book stays open on principle.”",
        },
        // Phase W4 — the way to the river. Ungated, like The Delver's
        // the_stair grant: the Gate-Clerk will tell anyone the way to the
        // water-gate — the map's own graph still gates the crossing on the
        // Harbormaster, one column before the door.
        the_water_gate: {
            id: 'the_water_gate',
            text: "“Water goes right, I said.” He taps the desk once. “Follow it to the harbor and past the weighing-house. What the Harbormaster lets by, the river takes from there.”",
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
            text: "A woman planes a rib of pale timber and does not stop for you. Half a hull stands over her like a carcass. “Looking is free. Everything else is timber, pitch, and iron.” The shavings curl and drop. “Say what you want or take the free thing.”",
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
            text: "She sights down the plank. “I could build a king a navy, given the materials. You are not a king.” The plane resumes. “Timber from the yard. Pitch from the walk. Iron from under the hill. Bring those and we will talk about boats.”",
        },
        the_hull: {
            id: 'the_hull',
            text: "“A trader's. He paid a third and drowned on other business.” She knocks the rib once, listening to it. “The river takes payment in more than one office. It is patient about collecting the rest.”",
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
            text: "“It waits. A hull half-paid belongs to nobody, and nobody is a careful owner.” She sets the plane down at last and looks at you. “If you ever pay for a whole one, pay for the whole thing at once.”",
        },
        looked: {
            id: 'looked',
            text: "You look. The hull is beautiful the way a rib cage is beautiful. She works on and lets the fact of it charge you nothing.",
        },
    },
};

// Phase W4 — `get-to-connecting-river` (a previously dangling
// NorthernCityQuests union member) is authored: granted by the Gate-Clerk
// (the map's guaranteed singleton, the fv-2/nc-2 precedent), completed by
// reaching `cr-1` (the river arrival ticks the reach objective on its own
// resolution, the get-to-forest/get-to-northern-city pattern).
const getToConnectingRiverQuest: Quest = {
    name: 'get-to-connecting-river',
    description: "Fight past the Harbormaster and take the water-gate to the river.",
    mapName: 'northern-city',
    status: 'available',
    objectives: [
        {
            id: 'reach-connecting-river',
            type: 'reach',
            target: 'cr-1',
            description: "Reach the connecting river.",
            requiredCount: 1,
            currentCount: 0,
        },
    ],
    reward: { kind: 'experience', amount: 60 },
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
// Four singleton columns (Phase W4 — the nc-26 pattern): c0 (the arrival
// at the gatehouse), c1 (the Gate-Clerk — the city's first face on every
// route), c9 (the Harbormaster), and c10 (the water-gate standing open —
// the door to connecting-river, one column past the boss). ncy-24 hangs
// off the harbor at [3,-2] (the drowned slip); its whole column opens
// onto all of c4 so it can never strand a run. ncy-23 (c8) stays sealed
// scenery — flavor beside the last inns, never the real exit.

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
        { id: 'ncy-10', location: [2, 1], connectedNodes: ['ncy-11', 'ncy-4', 'ncy-3'] },
        { id: 'ncy-3',  location: [2, 0], connectedNodes: ['ncy-11', 'ncy-4', 'ncy-18', 'ncy-10', 'ncy-17'] },
        { id: 'ncy-17', location: [2, -1], connectedNodes: ['ncy-4', 'ncy-18', 'ncy-24', 'ncy-3'] },
        // ── c3 — hazard / inn / gathering, plus ncy-24 hanging off the
        //        harbor at y=-2. Every node in this column opens onto ALL
        //        of c4 (lane drift relaxed, the fv/nc c3 pattern) so no
        //        lane — least of all ncy-24's — can strand a run.
        { id: 'ncy-11', location: [3, 1], connectedNodes: ['ncy-12', 'ncy-5', 'ncy-19', 'ncy-4'] },
        { id: 'ncy-4',  location: [3, 0], connectedNodes: ['ncy-12', 'ncy-5', 'ncy-19', 'ncy-11', 'ncy-18'] },
        { id: 'ncy-18', location: [3, -1], connectedNodes: ['ncy-12', 'ncy-5', 'ncy-19', 'ncy-4', 'ncy-24'] },
        { id: 'ncy-24', location: [3, -2], connectedNodes: ['ncy-12', 'ncy-5', 'ncy-19', 'ncy-18'] },
        // ── c4 — loot / the rumor / the chandlery ────────────────────
        { id: 'ncy-12', location: [4, 1], connectedNodes: ['ncy-13', 'ncy-6', 'ncy-5'] },
        { id: 'ncy-5',  location: [4, 0], connectedNodes: ['ncy-13', 'ncy-6', 'ncy-20', 'ncy-12', 'ncy-19'] },
        { id: 'ncy-19', location: [4, -1], connectedNodes: ['ncy-6', 'ncy-20', 'ncy-5'] },
        // ── c5 — loot / THE IRON MARKET / hazard ─────────────────────
        { id: 'ncy-13', location: [5, 1], connectedNodes: ['ncy-14', 'ncy-7', 'ncy-6'] },
        { id: 'ncy-6',  location: [5, 0], connectedNodes: ['ncy-14', 'ncy-7', 'ncy-21', 'ncy-13', 'ncy-20'] },
        { id: 'ncy-20', location: [5, -1], connectedNodes: ['ncy-7', 'ncy-21', 'ncy-6'] },
        // ── c6 — encounter / encounter / the shipwright ──────────────
        { id: 'ncy-14', location: [6, 1], connectedNodes: ['ncy-15', 'ncy-8', 'ncy-7'] },
        { id: 'ncy-7',  location: [6, 0], connectedNodes: ['ncy-15', 'ncy-8', 'ncy-22', 'ncy-14', 'ncy-21'] },
        { id: 'ncy-21', location: [6, -1], connectedNodes: ['ncy-8', 'ncy-22', 'ncy-7'] },
        // ── c7 — the assize bell / encounter / encounter ─────────────
        { id: 'ncy-15', location: [7, 1], connectedNodes: ['ncy-16', 'ncy-9', 'ncy-8'] },
        { id: 'ncy-8',  location: [7, 0], connectedNodes: ['ncy-16', 'ncy-9', 'ncy-23', 'ncy-15', 'ncy-22'] },
        { id: 'ncy-22', location: [7, -1], connectedNodes: ['ncy-9', 'ncy-23', 'ncy-8'] },
        // ── c8 — inn / inn / THE SEALED RIVER-GATE. The way toward
        //        connecting-river is scenery, not a door: W4 ships that
        //        map, so the exit is authored sealed (a cutscene) and the
        //        map ends at the Harbormaster instead (the W2 pattern).
        { id: 'ncy-16', location: [8, 1], connectedNodes: ['ncy-25', 'ncy-9'] },
        { id: 'ncy-9',  location: [8, 0], connectedNodes: ['ncy-25', 'ncy-16', 'ncy-23'] },
        { id: 'ncy-23', location: [8, -1], connectedNodes: ['ncy-25', 'ncy-9'] },
        // ── c9 — the Harbormaster. Every run goes through here. ──────
        { id: 'ncy-25', location: [9, 0], connectedNodes: ['ncy-26'] },
        // ── c10 — the water-gate stands open (Phase W4). The DOOR to
        //        connecting-river, one column past the boss — the
        //        nc-26/fv-10 pattern: the way out opens only after the
        //        climax. ncy-23 stays sealed scenery; this is the real gate.
        { id: 'ncy-26', location: [10, 0], connectedNodes: [] },
    ],
    npcs: [theGateClerk, theShipwright],
    enemies: [],
    uniqueEvents: [],
    // The city's own remaining declared quests ('find-blacksmith',
    // 'build-boat', 'kill-some-time') stay dangling — a future phase
    // authors them. `get-to-connecting-river` is authored this phase (W4).
    // `get-to-northern-city` lives on the caverns, its granting map, per
    // the get-to-forest precedent.
    quests: [getToConnectingRiverQuest],
    images: {
        mapImage: { alt: '', src: '' },
        combatImage: { alt: '', src: '' },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// THE CONNECTING RIVER (Phase W4) — map 3 of the northern continent.
// ═══════════════════════════════════════════════════════════════════════════

// ─── NPC content ──────────────────────────────────────────────────────────────

// The Boatwoman keeps the only boat that goes downriver. Wild again after
// the city: she doesn't collect a toll, she IS the crossing.
const boatwomanTree: DialogueTree = {
    id: 'the-boatwoman',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "A flat-bottomed boat rides low against the bank, tied to a post retied more than replaced. A woman coils rope without looking up. “Down the water or up the bank. I only go one direction, and it isn't up.”",
            choices: [
                {
                    text: "Take me down the river.",
                    nextNodeId: 'the_offer',
                    effect: { startQuest: 'find-islanders' },
                },
                {
                    text: "What's downriver?",
                    nextNodeId: 'lore',
                },
                {
                    text: "Not today.",
                    nextNodeId: undefined,
                },
            ],
        },
        the_offer: {
            id: 'the_offer',
            text: "“Islanders, mostly. Once a year they hold a court on the water and I ferry every hopeful mother's favorite.” She nods at the current. “Sit low. The river doesn't care whose boat it takes.”",
            choices: [
                {
                    text: "I'm headed across, eventually.",
                    nextNodeId: 'far_bank',
                    effect: { startQuest: 'get-to-town-across-river' },
                },
                {
                    text: "One trip at a time.",
                    nextNodeId: undefined,
                },
            ],
        },
        far_bank: {
            id: 'far_bank',
            text: "“Eventually gets you there same as urgent does, on this river.” She finishes the coil and sets it in the bow. “Get in when you're ready.”",
        },
        lore: {
            id: 'lore',
            text: "“A river, then a town, then whatever's past the town.” She shrugs. “I've only ever gone as far as the ritual and back. Some things you don't follow to the end.”",
        },
    },
};

const theBoatwoman: NPC = {
    name: 'The Boatwoman',
    description: 'She keeps the only boat that goes downriver, and goes only one direction.',
    dialogueTree: boatwomanTree,
};

// ─── Quest content ────────────────────────────────────────────────────────────

// `find-islanders`, `join-islanders-for-ritual` and `get-to-town-across-river`
// are declared ConnectingRiverQuests union members (quest.library.ts) with no
// authored Quest object until now. Granted from The Boatwoman (the
// guaranteed singleton, cr-2) and from the river-court narration (cr-9) —
// both sit on THIS map, so both Quest objects live in this map's own
// `quests` array (the lookup in `dialogue.runtime.ts` resolves against
// `gameState.world.currentMap`, never a different map's declared quests).
const findIslandersQuest: Quest = {
    name: 'find-islanders',
    description: "Follow the river down to the islanders' court.",
    mapName: 'connecting-river',
    status: 'available',
    objectives: [
        {
            id: 'reach-river-court',
            type: 'reach',
            target: 'cr-9',
            description: "Reach the river court.",
            requiredCount: 1,
            currentCount: 0,
        },
    ],
    reward: { kind: 'experience', amount: 40 },
};

const joinIslandersForRitualQuest: Quest = {
    name: 'join-islanders-for-ritual',
    description: "Having watched the ritual, follow it to the far bank.",
    mapName: 'connecting-river',
    status: 'available',
    objectives: [
        {
            id: 'reach-water-gate',
            type: 'reach',
            target: 'cr-13',
            description: "Reach the water-gate.",
            requiredCount: 1,
            currentCount: 0,
        },
    ],
    reward: { kind: 'experience', amount: 55 },
};

const getToTownAcrossRiverQuest: Quest = {
    name: 'get-to-town-across-river',
    description: "Cross the water-gate to the town on the far bank.",
    mapName: 'connecting-river',
    status: 'available',
    objectives: [
        {
            id: 'reach-town-across-river',
            type: 'reach',
            target: 'tar-1',
            description: "Reach the town across the river.",
            requiredCount: 1,
            currentCount: 0,
        },
    ],
    reward: { kind: 'experience', amount: 60 },
};

// ─── Map definition ───────────────────────────────────────────────────────────
//
// Seven columns, three lanes: no named lane structure — the river is wild,
// not surveyed. Four singleton columns (the caverns/nc-26 pattern, tolerance
// bumped to 4 for this map): c0 (the arrival), c1 (The Boatwoman — the
// crossing's premise on every route), c5 (the Waterreeve, the climax), and
// c6 (the water-gate to town-across-river, one column past the boss). The
// advisor-selection ritual (`cr-9`) sits in an ordinary 3-lane column — the
// `ncy-5` precedent: campaign-seam content doesn't need a scarce singleton
// slot when it doesn't gate progression.

const connectingRiver: MapDefinition = {
    name: 'connecting-river',
    continent: 'northern-continent',
    description: 'A river wide enough to lose the banks in fog. The islanders hold their court on it once a year, and the current takes whoever argues with it.',
    startingNode: {
        id: 'cr-1',
        location: [0, 0],
        connectedNodes: ['cr-2'],
    },
    nodes: [
        // ── c0 — the current takes the boat. The ncy-26 door lands here. ─
        { id: 'cr-1',  location: [0, 0], connectedNodes: ['cr-2'] },
        // ── c1 — The Boatwoman. A singleton column so the crossing's
        //        premise is on every route (the fv-2/nc-2 precedent).
        { id: 'cr-2',  location: [1, 0], connectedNodes: ['cr-3', 'cr-4', 'cr-5'] },
        // ── c2 — encounter / rest / gathering ─────────────────────────
        { id: 'cr-3',  location: [2, 1], connectedNodes: ['cr-6', 'cr-7', 'cr-8', 'cr-4'] },
        { id: 'cr-4',  location: [2, 0], connectedNodes: ['cr-6', 'cr-7', 'cr-8', 'cr-3', 'cr-5'] },
        { id: 'cr-5',  location: [2, -1], connectedNodes: ['cr-6', 'cr-7', 'cr-8', 'cr-4'] },
        // ── c3 — hazard / loot / encounter ────────────────────────────
        { id: 'cr-6',  location: [3, 1], connectedNodes: ['cr-9', 'cr-10', 'cr-11', 'cr-7'] },
        { id: 'cr-7',  location: [3, 0], connectedNodes: ['cr-9', 'cr-10', 'cr-11', 'cr-6', 'cr-8'] },
        { id: 'cr-8',  location: [3, -1], connectedNodes: ['cr-9', 'cr-10', 'cr-11', 'cr-7'] },
        // ── c4 — THE RIVER COURT (the ritual) / THE LANDING (shop) /
        //        encounter ────────────────────────────────────────────
        { id: 'cr-9',  location: [4, 1], connectedNodes: ['cr-12', 'cr-10'] },
        { id: 'cr-10', location: [4, 0], connectedNodes: ['cr-12', 'cr-9', 'cr-11'] },
        { id: 'cr-11', location: [4, -1], connectedNodes: ['cr-12', 'cr-10'] },
        // ── c5 — the Waterreeve. Every run goes through here. ─────────
        { id: 'cr-12', location: [5, 0], connectedNodes: ['cr-13'] },
        // ── c6 — the water-gate stands open. The DOOR to
        //        town-across-river, one column past the boss. ─────────
        { id: 'cr-13', location: [6, 0], connectedNodes: [] },
    ],
    npcs: [theBoatwoman],
    enemies: [],
    uniqueEvents: [],
    quests: [findIslandersQuest, joinIslandersForRitualQuest, getToTownAcrossRiverQuest],
    images: {
        mapImage: { alt: '', src: '' },
        combatImage: { alt: '', src: '' },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// TOWN ACROSS THE RIVER (Phase W4) — map 4 of the northern continent.
// ═══════════════════════════════════════════════════════════════════════════

// ─── NPC content ──────────────────────────────────────────────────────────────

// The Sweetheart — home of the boy the player left behind (`map.library.ts`'s
// own narrative note). No quest here; the beat is emotional, not mechanical.
const sweetheartTree: DialogueTree = {
    id: 'the-sweetheart',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "She's at the well before you've decided how to say her name. She decides for you. “You came back.” Not a question. She sets the bucket down like it might listen too.",
            choices: [
                {
                    text: "I came back.",
                    nextNodeId: 'stayed',
                    effect: { alignmentDelta: { outlook: 1 } },
                },
                {
                    text: "I'm only passing through.",
                    nextNodeId: 'passing',
                    effect: { alignmentDelta: { outlook: -1 } },
                },
                {
                    text: "Tell me what's happened here.",
                    nextNodeId: 'news',
                },
                {
                    // Phase W5 — the way to the capital. Placed last (the
                    // Gate-Clerk/the_water_gate index-stability convention).
                    text: "Where does the road go from here?",
                    nextNodeId: 'the_capital_road',
                    effect: { startQuest: 'get-to-the-capital' },
                },
            ],
        },
        stayed: {
            id: 'stayed',
            text: "“Good,” she says, like the word costs her something and she's paying it anyway. “Walk with me. There's somewhere I have to be today, and I'd rather you saw it than heard about it after.”",
        },
        passing: {
            id: 'passing',
            text: "“Passing through.” She picks the bucket back up. “That's an answer too. I'll remember which one you gave.”",
        },
        news: {
            id: 'news',
            text: "“The town elected a new ribbon-color this spring.” She doesn't explain further. “You'll see what that means, if you stay long enough.”",
        },
        // Phase W5 — the way to the capital. Ungated, like the Gate-Clerk's
        // the_water_gate grant: she'll tell anyone the road; the map's own
        // graph still gates the crossing on the Portreeve, one column
        // before the door.
        the_capital_road: {
            id: 'the_capital_road',
            text: "“Same road the ribbon walks.” She nods past the rooftops, toward where the smoke thins. “Every color the provinces sent goes to the capital this season. Mine included.” A beat. “If you're walking, walk with me that far.”",
        },
    },
};

const theSweetheart: NPC = {
    name: 'The Sweetheart',
    description: 'The girl the boy left behind, keeping the well the way she kept everything else — exactly.',
    dialogueTree: sweetheartTree,
};

// ─── Quest content ────────────────────────────────────────────────────────────

// `get-to-the-capital` is a declared TownAcrossRiverQuests union member
// (quest.library.ts) with no authored Quest object until now. Granted from
// The Sweetheart (the guaranteed singleton, tar-2) — the getToConnectingRiverQuest
// / getToTownAcrossRiverQuest precedent: the Quest object lives on the SAME
// map as the NPC who grants it.
const getToTheCapitalQuest: Quest = {
    name: 'get-to-the-capital',
    description: "Follow the ribbon-road to the capital.",
    mapName: 'town-across-river',
    status: 'available',
    objectives: [
        {
            id: 'reach-the-capital',
            type: 'reach',
            target: 'cap-1',
            description: "Reach the capital.",
            requiredCount: 1,
            currentCount: 0,
        },
    ],
    reward: { kind: 'experience', amount: 65 },
};

// ─── Map definition ───────────────────────────────────────────────────────────
//
// Four columns, three lanes across the middle: the coda location
// (`map.library.ts`: "Home of sweetheart"), deliberately small — a
// homecoming, not a new front. Three singleton columns, the default
// tolerance: c0 (the arrival), c1 (The Sweetheart), and c3 (the Portreeve,
// the climax). Phase W5 (2026-09-10) — tar-7, one column past the boss, is
// the DOOR to the-capital (the nc-26/ncy-26/cr-13 pattern: the way out opens
// only after the climax).

const townAcrossRiver: MapDefinition = {
    name: 'town-across-river',
    continent: 'northern-continent',
    description: 'Smaller than the city, kinder than the caverns. Woodsmoke over rooftops, and a well that remembers your face.',
    startingNode: {
        id: 'tar-1',
        location: [0, 0],
        connectedNodes: ['tar-2'],
    },
    nodes: [
        // ── c0 — the far bank rises into a town. ──────────────────────
        { id: 'tar-1', location: [0, 0], connectedNodes: ['tar-2'] },
        // ── c1 — The Sweetheart. A singleton column so she is on every
        //        route (the fv-2/nc-2 precedent).
        { id: 'tar-2', location: [1, 0], connectedNodes: ['tar-3', 'tar-4', 'tar-5'] },
        // ── c2 — rest (inn) / THE VILLAGE COURT (the ritual, mirrored) /
        //        encounter ─────────────────────────────────────────────
        { id: 'tar-3', location: [2, 1], connectedNodes: ['tar-6', 'tar-4'] },
        { id: 'tar-4', location: [2, 0], connectedNodes: ['tar-6', 'tar-3', 'tar-5'] },
        { id: 'tar-5', location: [2, -1], connectedNodes: ['tar-6', 'tar-4'] },
        // ── c3 — the Portreeve. Every run goes through here. ──────────
        { id: 'tar-6', location: [3, 0], connectedNodes: ['tar-7'] },
        // ── c4 — the ribbon-road stands open (Phase W5). The DOOR to
        //        the-capital, one column past the boss. ────────────────
        { id: 'tar-7', location: [4, 0], connectedNodes: [] },
    ],
    npcs: [theSweetheart],
    enemies: [],
    uniqueEvents: [],
    quests: [getToTheCapitalQuest],
    images: {
        mapImage: { alt: '', src: '' },
        combatImage: { alt: '', src: '' },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// THE CAPITAL (Phase W5, 2026-09-10) — map 5 of the northern continent.
// ═══════════════════════════════════════════════════════════════════════════
//
// Where the ribbon-roads end. `cr-9`'s river-court boy went "to the capital
// in the spring boat"; `tar-4`'s sweetheart went the same way overland. This
// is that destination — the selection made concrete instead of rumored.
// The Factor, already met as a northern-city debt-broker, presides: he
// "buys positions... his office is wherever you are standing when the
// interest comes due," which is exactly what the capital's court is for.
// No new enemies authored — the pool reuses northern-city's own roster
// (a grander sibling city, same class of enforcer) plus two forest
// re-treads for variety, the northern-city precedent (`EnemiesByMap`).

// ─── NPC content ──────────────────────────────────────────────────────────────

// The Herald keeps the gate ledger — the capital's first face, reading
// ribbons instead of names (mirrors the Gate-Clerk's book, colder).
const heraldTree: DialogueTree = {
    id: 'the-herald',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "A woman checks ribbons against a ledger, not faces. “State your business or state your color.”",
            choices: [
                {
                    text: "I'm here for the selection.",
                    nextNodeId: 'nominee',
                    requires: { flag: 'sweetheart-was-nominated' },
                },
                {
                    text: "I'm no one's nominee. Just watching.",
                    nextNodeId: 'watcher',
                },
                {
                    text: "What happens to the ones who lose?",
                    nextNodeId: 'the_losers',
                },
            ],
        },
        nominee: {
            id: 'nominee',
            text: "“Ribbon color, then. I don't need the name — the ribbon already has one.” She marks the ledger without looking up. “Court convenes at the bell. Don't be late on her behalf.”",
        },
        watcher: {
            id: 'watcher',
            text: "“Watching is a business too, here.” She waves you past. “Mind the line doesn't move for you either.”",
        },
        the_losers: {
            id: 'the_losers',
            text: "“Go home,” she says, like it's obvious, because to her it is. “The tally balances either way. That's the whole of the mercy in it.”",
        },
    },
};

const theHerald: NPC = {
    name: 'The Herald',
    description: 'Keeps the gate ledger, reading ribbons instead of faces. The capital\'s first word on every nominee.',
    dialogueTree: heraldTree,
};

// The Ribbon-Picker works the wall where the gate's refused petitions pile
// up — the underside of The Herald's ledger. Where the Herald checks a
// ribbon IN, she is what happens to one after it's cut loose: she doesn't
// gate anything, she salvages what the gate already spent. Homed at cap-5
// (the gathering node, "Refused petitions pile up against the wall") as a
// second weighted `MapEventPoolEntry` alongside the existing gathering
// payload (`MapEvents/content.ts`'s `capRibbonScraps`) rather than a new
// node — a minor, occasional voice, not a second guaranteed singleton.
const ribbonPickerTree: DialogueTree = {
    id: 'the-ribbon-picker',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "A woman sits at the base of the wall, sorting ribbons from a heap nobody claims twice. She doesn't look up. “Every color gets cut loose eventually. I keep what's left of it.”",
            choices: [
                {
                    text: "What do you do with them?",
                    nextNodeId: 'the_unmaking',
                },
                {
                    text: "Sell me one.",
                    nextNodeId: 'the_trade',
                },
                {
                    text: "Walk on.",
                    nextNodeId: undefined,
                },
                {
                    // Reads tar-4's `sweetheart-was-nominated` flag, set in
                    // town-across-river before this map — chronologically
                    // earlier, the same flag capCourtConvenes reads at cap-8.
                    // Placed LAST per the index-stability convention.
                    text: "(One color in the pile stops you.)",
                    nextNodeId: 'recognized',
                    requires: { flag: 'sweetheart-was-nominated' },
                },
            ],
        },
        the_unmaking: {
            id: 'the_unmaking',
            text: "“Unpick the thread, sell it plain. A ribbon only means something tied on. Loose, it's just string — and string sells the same regardless of what color lost.”",
        },
        the_trade: {
            id: 'the_trade',
            text: "“Not for sale. Not this pile.” She doesn't look up from the sorting. “You want a ribbon, earn one at the gate. Mine are the ones the gate already spent.”",
        },
        recognized: {
            id: 'recognized',
            text: "She lifts a ribbon the same color as the one you're thinking of, turns it once in the light, and sets it back on the pile without a word. Some colors she doesn't need to ask about.",
        },
    },
};

const theRibbonPicker: NPC = {
    name: 'The Ribbon-Picker',
    description: 'Sorts the gate\'s refused ribbons into thread. Not a gatekeeper — what a gatekeeper leaves behind.',
    dialogueTree: ribbonPickerTree,
};

// ─── Map definition ───────────────────────────────────────────────────────────
//
// Six columns: the arrival, The Herald (a singleton so the capital's first
// face is on every route — the fv-2/nc-2/cr-2/ncy-2 precedent), a 3-lane
// column (hazard / rest / gathering — The Ribbon-Picker rides the
// gathering lane as an occasional second voice, Phase adjust-npcs pass 5),
// a 2-lane column (market / loot-cache), the court narration (singleton —
// the payoff reads flags planted at cr-9 and tar-4), and The Factor
// (singleton — the climax). No door onward yet (the tar-6/nc-25-pre-W3
// pattern): the next continent is not shipped.

const theCapital: MapDefinition = {
    name: 'the-capital',
    continent: 'northern-continent',
    description: 'A wall tall enough to lose the sky behind. Every gate has a line; this one has the longest.',
    startingNode: {
        id: 'cap-1',
        location: [0, 0],
        connectedNodes: ['cap-2'],
    },
    nodes: [
        // ── c0 — the ribbon-road ends at the wall. ────────────────────
        { id: 'cap-1', location: [0, 0], connectedNodes: ['cap-2'] },
        // ── c1 — The Herald. A singleton column so the capital's first
        //        face is on every route (the fv-2/nc-2 precedent).
        { id: 'cap-2', location: [1, 0], connectedNodes: ['cap-3', 'cap-4', 'cap-5'] },
        // ── c2 — hazard / rest (inn) / gathering ───────────────────────
        { id: 'cap-3', location: [2, 1], connectedNodes: ['cap-6', 'cap-7', 'cap-4'] },
        { id: 'cap-4', location: [2, 0], connectedNodes: ['cap-6', 'cap-7', 'cap-3', 'cap-5'] },
        { id: 'cap-5', location: [2, -1], connectedNodes: ['cap-6', 'cap-7', 'cap-4'] },
        // ── c3 — the market / loot-cache ───────────────────────────────
        { id: 'cap-6', location: [3, 1], connectedNodes: ['cap-8', 'cap-7'] },
        { id: 'cap-7', location: [3, -1], connectedNodes: ['cap-8', 'cap-6'] },
        // ── c4 — the court convenes. Every run goes through here. ──────
        { id: 'cap-8', location: [4, 0], connectedNodes: ['cap-9'] },
        // ── c5 — The Factor. The climax — no door onward yet. ──────────
        { id: 'cap-9', location: [5, 0], connectedNodes: [] },
    ],
    npcs: [theHerald, theRibbonPicker],
    enemies: [],
    uniqueEvents: [],
    quests: [],
    images: {
        mapImage: { alt: '', src: '' },
        combatImage: { alt: '', src: '' },
    },
};

export { caverns, northernCity, connectingRiver, townAcrossRiver, theCapital };
