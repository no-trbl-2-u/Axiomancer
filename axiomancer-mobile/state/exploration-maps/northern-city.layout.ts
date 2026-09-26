import { MAP_PLATES } from '@/assets/images/maps';
import { legacySheet } from './sheet';
import type { MapLayout } from './types';

/**
 * The northern city (northern continent) — Phase W3, plus the Phase W4
 * water-gate door (ncy-26).
 * Positions only; kind + edges come from the engine (`@mechanics`).
 * Eleven engine columns run bottom → top; lanes map y=+1/0/-1/-2 to
 * x=90/180/270/330 on the 360×400 viewBox: the WALL (x=90), the HIGH
 * STREET (x=180, the spine), the HARBOR (x=270), and the drowned slip
 * hanging off at x=330.
 */
export const northernCityLayout: MapLayout = {
    mapId: 'northern-city',
    continent: 'CONTINENT · NORTHERN',
    region: 'The Northern City',
    // Ordinal only — no node/path count (CRITIQUE pass 19).
    regionProgress: 'Map ii of v',
    sheet: legacySheet(MAP_PLATES.ludgateHill),
    nodes: [
        // ── c0 — the gatehouse ──
        { id: 'ncy-1',  x: 180, y: 375, label: 'The Gatehouse', description: 'The stair ends in lamplight. The city starts at once.' },
        // ── c1 — the Gate-Clerk ──
        { id: 'ncy-2',  x: 180, y: 337, label: 'The Clerk’s Desk', description: 'A desk at the top of the stair. The pen is moving.' },
        // ── c2 ──
        { id: 'ncy-10', x: 90,  y: 299, label: 'The Timber Yard', description: 'Seconds stacked by the wall. Hulls start here.' },
        { id: 'ncy-3',  x: 180, y: 299, label: 'Guild Row', description: 'The street narrows between halls. A toll nobody posted.' },
        { id: 'ncy-17', x: 270, y: 299, label: 'The Swamped Skiff', description: 'Half under, still tied. The lockbox kept dry.' },
        // ── c3 ──
        { id: 'ncy-11', x: 90,  y: 261, label: 'The Short Crane', description: 'The load swings wide. The wall takes most of it.' },
        { id: 'ncy-4',  x: 180, y: 261, label: 'The Scales', description: 'An inn. Honest beds, honest bill.' },
        { id: 'ncy-18', x: 270, y: 261, label: 'The Ropewalk', description: 'Pitch boils at the far end. The drippings cool loose.' },
        { id: 'ncy-24', x: 330, y: 261, label: 'The Drowned Slip', description: 'The angle is still true. It would take a hull tomorrow.' },
        // ── c4 ──
        { id: 'ncy-12', x: 90,  y: 223, label: 'The Rent-Box', description: 'Behind a loose rampart stone. The collector stopped.' },
        { id: 'ncy-5',  x: 180, y: 223, label: 'The High Street', description: 'Talk runs faster than the carts. The advisor is dead.' },
        { id: 'ncy-19', x: 270, y: 223, label: 'The Chandlery', description: 'Rope, tallow, salt, remedies. Crews buy here first.' },
        // ── c5 ──
        { id: 'ncy-13', x: 90,  y: 185, label: 'The Wall Walk', description: 'A watchman’s purse where the walk turns. Unreported.' },
        { id: 'ncy-6',  x: 180, y: 185, label: 'The Iron Market', description: 'Every stall weighs true. The checkers are not kind.' },
        { id: 'ncy-20', x: 270, y: 185, label: 'The Green Stones', description: 'The quay below the tide line. Find out yourself.' },
        // ── c6 ──
        { id: 'ncy-14', x: 90,  y: 147, label: 'The Rampart Hooks', description: 'Wings too heavy for a gull. Its larder hangs here.' },
        { id: 'ncy-7',  x: 180, y: 147, label: 'The Watched Door', description: 'A doorway watches you pass. Then it stops being one.' },
        { id: 'ncy-21', x: 270, y: 147, label: 'The Shipwright’s Yard', description: 'Half a hull stands over the yard. She works under it.' },
        // ── c7 ──
        { id: 'ncy-15', x: 90,  y: 109, label: 'The Assize Bell', description: 'It rings for verdicts. The rope is frayed from use.' },
        { id: 'ncy-8',  x: 180, y: 109, label: 'The Harbor Gate', description: 'The last street before the water. Somebody minds it.' },
        { id: 'ncy-22', x: 270, y: 109, label: 'The Dark Between', description: 'Two warehouses, no lamplight, and a price on your coat.' },
        // ── c8 ──
        { id: 'ncy-16', x: 90,  y: 71,  label: 'The Long Watch', description: 'An inn built into the wall. The garrison drinks cheaper.' },
        { id: 'ncy-9',  x: 180, y: 71,  label: 'The Ferry Bell', description: 'An inn at the harbor gate, used to last nights.' },
        { id: 'ncy-23', x: 270, y: 71,  label: 'The River-Gate', description: 'Chained below the waterline. Boats queue and wait.' },
        // ── c9 — the Harbormaster ──
        { id: 'ncy-25', x: 180, y: 33,  label: 'The Weighing House', description: 'Nothing leaves by water unweighed. He is waiting.' },
        // ── c10 — the water-gate stands open (Phase W4) ──
        { id: 'ncy-26', x: 180, y: 5,   label: 'The Water-Gate', description: 'Past the weighing-house, the harbor opens onto open water.' },
    ],
};
