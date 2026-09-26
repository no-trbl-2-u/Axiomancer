import { MAP_PLATES } from '@/assets/images/maps';
import { legacySheet } from './sheet';
import type { MapLayout } from './types';

/**
 * The connecting river (northern continent) — Phase W4.
 * Positions only; kind + edges come from the engine (`@mechanics`).
 * Seven engine columns run bottom → top; lanes map y=+1/0/-1 to
 * x=90/180/270 on the 360×400 viewBox — no named lane structure (the river
 * is wild, not surveyed, unlike the city's WALL/HIGH STREET/HARBOR).
 */
export const connectingRiverLayout: MapLayout = {
    mapId: 'connecting-river',
    continent: 'CONTINENT · NORTHERN',
    region: 'The Connecting River',
    // Ordinal only — no node/path count (CRITIQUE pass 19).
    regionProgress: 'Map iii of v',
    sheet: legacySheet(MAP_PLATES.charonCrossing),
    nodes: [
        // ── c0 — the current takes the boat ──
        { id: 'cr-1',  x: 180, y: 375, label: 'The Launch', description: 'The current takes the boat before the bank lets go of it.' },
        // ── c1 — The Boatwoman ──
        { id: 'cr-2',  x: 180, y: 318, label: 'The Boatwoman', description: 'She keeps the only boat that goes downriver, and goes only one direction.' },
        // ── c2 ──
        { id: 'cr-3',  x: 90,  y: 261, label: 'The Shallows', description: 'Something surfaces just long enough to count you, then doesn\'t.' },
        { id: 'cr-4',  x: 180, y: 261, label: 'The Gravel Spit', description: 'Driftwood enough for a fire that won\'t be seen from the water.' },
        { id: 'cr-5',  x: 270, y: 261, label: 'The Reed Cut', description: 'Green and springy, cut at the waterline. Weavers pay for the good kind.' },
        // ── c3 ──
        { id: 'cr-6',  x: 90,  y: 204, label: 'The Current', description: 'The current takes an opinion about your footing. It wins.' },
        { id: 'cr-7',  x: 180, y: 204, label: 'The Capsized Skiff', description: 'Gear still lashed in. Whoever owned it isn\'t diving for it now.' },
        { id: 'cr-8',  x: 270, y: 204, label: 'The Reed Break', description: 'The reeds part wrong, in a shape that isn\'t wind.' },
        // ── c4 ──
        { id: 'cr-9',  x: 90,  y: 147, label: 'The River Court', description: 'Islanders hold a rite on the water. A child is chosen once a year.' },
        { id: 'cr-10', x: 180, y: 147, label: 'The Landing', description: 'A trading post on stilts, built to outlast the flood line.' },
        { id: 'cr-11', x: 270, y: 147, label: 'The Narrows', description: 'The bank narrows. Something has been waiting for it to.' },
        // ── c5 — the Waterreeve ──
        { id: 'cr-12', x: 180, y: 90,  label: 'The Reeve\'s Post', description: 'Nothing crosses unweighed.' },
        // ── c6 — the water-gate stands open ──
        { id: 'cr-13', x: 180, y: 33,  label: 'The Water-Gate', description: 'Past the reeve\'s post, the river opens onto the far bank.' },
    ],
};
