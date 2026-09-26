/**
 * The Beacon Crags — Act 1, map 3 (map revamp M3c; decisions D21–D29).
 *
 * The third Act 1 map, built on T's mountain plate
 * (`axiomancer-mobile/assets/images/maps/act1-mountains.webp`). Named by T from
 * three drafts (D26). The first Act 1 map under `northern-continent` (D28): the
 * Charcoal Wood's stair cave crosses into it the way the shipped chain's
 * `nf-10` cave mouth crosses into the caverns, with a plain `travel` event. The
 * glacier shrine is the door on to fishing-village until the Act 1 underworld
 * ships (D27).
 *
 * One node per landmark on the plate (D25, `act1-landmarks.json`), and no
 * others. The engine graph is abstract (columns and lanes); the mobile layout
 * places each node on its landmark. The stair comes up on the crag road at the
 * top of the plate, so the columns are bands down the mountain in three lanes
 * (west, middle, east), and the map closes on the glacier shrine in the
 * south-west (D16):
 *
 *   c0  the top pass                                    (arrival)
 *   c1  summit beacon · hanging lake · shepherds' village
 *   c2  crag castle · cliff monastery · mine entrance
 *   c3  ruined chapel · rope bridge · toll gate
 *   c4  arch bridge · gorge falls · quarry
 *   c5  mountain inn · stone gate · tunnel bridge
 *   c6  the glacier shrine                              (the door, terminal)
 *
 * Lanes run west to east in every band, so every lateral rib (D1) joins two
 * landmarks that are neighbours on the plate. Events use the shipped builders
 * and the caverns' roster and iron (D29): see `MapEvents/content.ts`.
 */

import { MapDefinition } from '../../types';

const beaconCrags: MapDefinition = {
    name: 'beacon-crags',
    continent: 'northern-continent',
    description: 'A fire on the summit tells the valley who is coming. The rope bridge charges for the crossing, and again for the fall.',
    startingNode: {
        id: 'bc-1',
        location: [0, 0],
        connectedNodes: ['bc-2', 'bc-3', 'bc-4'],
    },
    nodes: [
        // ── c0 — the top pass ───────────────────────────────────────────
        { id: 'bc-1',  location: [0, 0],  connectedNodes: ['bc-2', 'bc-3', 'bc-4'] },
        // ── c1 — summit beacon · hanging lake · shepherds' village ──────
        { id: 'bc-2',  location: [1, -1], connectedNodes: ['bc-5', 'bc-3'] },
        { id: 'bc-3',  location: [1, 0],  connectedNodes: ['bc-5', 'bc-6', 'bc-2', 'bc-4'] },
        { id: 'bc-4',  location: [1, 1],  connectedNodes: ['bc-6', 'bc-7', 'bc-3'] },
        // ── c2 — crag castle · cliff monastery · mine entrance ──────────
        { id: 'bc-5',  location: [2, -1], connectedNodes: ['bc-8', 'bc-9', 'bc-6'] },
        { id: 'bc-6',  location: [2, 0],  connectedNodes: ['bc-9', 'bc-10', 'bc-5', 'bc-7'] },
        { id: 'bc-7',  location: [2, 1],  connectedNodes: ['bc-10', 'bc-6'] },
        // ── c3 — ruined chapel · rope bridge · toll gate ────────────────
        { id: 'bc-8',  location: [3, -1], connectedNodes: ['bc-11', 'bc-9'] },
        { id: 'bc-9',  location: [3, 0],  connectedNodes: ['bc-11', 'bc-12', 'bc-8', 'bc-10'] },
        { id: 'bc-10', location: [3, 1],  connectedNodes: ['bc-12', 'bc-13', 'bc-9'] },
        // ── c4 — arch bridge · gorge falls · quarry ─────────────────────
        { id: 'bc-11', location: [4, -1], connectedNodes: ['bc-14', 'bc-12'] },
        { id: 'bc-12', location: [4, 0],  connectedNodes: ['bc-14', 'bc-15', 'bc-11', 'bc-13'] },
        { id: 'bc-13', location: [4, 1],  connectedNodes: ['bc-15', 'bc-16', 'bc-12'] },
        // ── c5 — mountain inn · stone gate · tunnel bridge ──────────────
        { id: 'bc-14', location: [5, -1], connectedNodes: ['bc-17', 'bc-15'] },
        { id: 'bc-15', location: [5, 0],  connectedNodes: ['bc-17', 'bc-14', 'bc-16'] },
        { id: 'bc-16', location: [5, 1],  connectedNodes: ['bc-17', 'bc-15'] },
        // ── c6 — the glacier shrine. Terminal column: the door. ────────
        { id: 'bc-17', location: [6, 0],  connectedNodes: [] },
    ],
    npcs: [],
    enemies: [],
    uniqueEvents: [],
    quests: [],
    images: {
        mapImage: { alt: '', src: '' },
        combatImage: { alt: '', src: '' },
    },
};

export { beaconCrags };
