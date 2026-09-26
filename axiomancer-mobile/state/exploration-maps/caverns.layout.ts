import { MAP_PLATES } from '@/assets/images/maps';
import { legacySheet } from './sheet';
import type { MapLayout } from './types';

/**
 * The caverns (northern continent) — 2026-08-28 inter-map travel; Phase W3
 * added the eleventh column (nc-26, the door up to the city), so the rows
 * re-spaced from a 38px to a 35px stride to keep all eleven on the canvas.
 * Positions only; kind + edges come from the engine (`@mechanics`).
 * Eleven engine columns run bottom → top; lanes map y=+1/0/-1/-2 to
 * x=90/180/270/330 on the 360×400 viewBox, mirroring the coastal fixtures.
 */
export const cavernsLayout: MapLayout = {
    mapId: 'caverns',
    continent: 'CONTINENT · NORTHERN',
    region: 'The Caverns',
    // Ordinal only — no node/path count (CRITIQUE pass 19).
    regionProgress: 'Map i of v',
    sheet: legacySheet(MAP_PLATES.thePit),
    nodes: [
        // ── c0 — the mouth of the dark ──
        { id: 'nc-1',  x: 180, y: 375, label: 'The Cave Mouth', description: 'Daylight ends a few steps in. It does not argue.' },
        // ── c1 — the Delver ──
        { id: 'nc-2',  x: 180, y: 340, label: 'The Delver’s Lamp', description: 'One lamp, one woman, one stockpile of ore.' },
        // ── c2 ──
        { id: 'nc-10', x: 90,  y: 305, label: 'The High Seam', description: 'Iron runs dark and clean along the wall.' },
        { id: 'nc-3',  x: 180, y: 305, label: 'Knocking Gallery', description: 'Three knocks from inside the wall. Count them.' },
        { id: 'nc-17', x: 270, y: 305, label: 'The Bad Air', description: 'The sump breathes something that is not air.' },
        // ── c3 ──
        { id: 'nc-11', x: 90,  y: 270, label: 'Pick-Mark Seam', description: 'Earlier hands cut here. They stopped halfway.' },
        { id: 'nc-4',  x: 180, y: 270, label: 'Cold Firepit', description: 'A delver’s camp, sheltered and long cold.' },
        { id: 'nc-18', x: 270, y: 270, label: 'The Wrong Current', description: 'The sump water moves against the current.' },
        { id: 'nc-24', x: 330, y: 270, label: 'The Old Delve', description: 'Nine names chalked. Eight crossed out.' },
        // ── c4 ──
        { id: 'nc-12', x: 90,  y: 235, label: 'The Slate Fall', description: 'A dead delver’s satchel under the slate.' },
        { id: 'nc-5',  x: 180, y: 235, label: 'The Narrows', description: 'The gallery narrows. Something waits for the lamp.' },
        { id: 'nc-19', x: 270, y: 235, label: 'The Drowned Vein', description: 'Ore below the waterline. Cold work. It pays the same.' },
        // ── c5 ──
        { id: 'nc-13', x: 90,  y: 200, label: 'The Watching Seam', description: 'Eyes at the seam’s edge. More than two.' },
        { id: 'nc-6',  x: 180, y: 200, label: 'The Ledger Camp', description: 'Delvers trade around a shared lamp. Underground prices.' },
        { id: 'nc-20', x: 270, y: 200, label: 'The Tired Props', description: 'The timber above has made its decision.' },
        // ── c6 ──
        { id: 'nc-14', x: 90,  y: 165, label: 'The Toll-Box', description: 'Bolted to the rock. Pried open. Not emptied.' },
        { id: 'nc-7',  x: 180, y: 165, label: 'The Arranged Bones', description: 'Bones in the rubble, arranged. The arranger is here.' },
        { id: 'nc-21', x: 270, y: 165, label: 'The Dry Shelf', description: 'Above the waterline. Dry counts as mercy here.' },
        // ── c7 ──
        { id: 'nc-15', x: 90,  y: 130, label: 'The Counter-Mine', description: 'Something mines the seam from the other side.' },
        { id: 'nc-8',  x: 180, y: 130, label: 'The Last Gallery', description: 'The approach to the gate. Defended.' },
        { id: 'nc-22', x: 270, y: 130, label: 'Eleven Dark Steps', description: 'The lamp gutters. The dark takes its toll.' },
        // ── c8 ──
        { id: 'nc-16', x: 90,  y: 95,  label: 'The Sealed Stair', description: 'The way to the city, packed shut with rockfall.' },
        { id: 'nc-9',  x: 180, y: 95,  label: 'The Last Camp', description: 'A hollow behind a fallen slab. The last quiet.' },
        { id: 'nc-23', x: 270, y: 95,  label: 'The Spilled Purse', description: 'Coin where a purse hit rock. Nobody came back down.' },
        // ── c9 — the Under-Gate ──
        { id: 'nc-25', x: 180, y: 60,  label: 'The Under-Gate', description: 'Something has kept this gate too long. It stands up.' },
        // ── c10 — the door up to the city (Phase W3) ──
        { id: 'nc-26', x: 180, y: 25,  label: 'The Gate Stands Open', description: 'A stair climbs toward lamplight. You climb.' },
    ],
};
