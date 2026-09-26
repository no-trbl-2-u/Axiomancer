import { MAP_PLATES } from '@/assets/images/maps';
import { legacySheet } from './sheet';
import type { MapLayout } from './types';

/**
 * The town across the river (northern continent) — Phase W4, plus the
 * Phase W5 ribbon-road door (tar-7).
 * Positions only; kind + edges come from the engine (`@mechanics`).
 * Five engine columns run bottom → top; lanes map y=+1/0/-1 to
 * x=90/180/270 on the 360×400 viewBox.
 */
export const townAcrossRiverLayout: MapLayout = {
    mapId: 'town-across-river',
    continent: 'CONTINENT · NORTHERN',
    region: 'The Sweetheart\'s Village',
    // Ordinal only — no node/path count (CRITIQUE pass 19).
    regionProgress: 'Map iv of v',
    sheet: legacySheet(MAP_PLATES.wentworthStreet),
    nodes: [
        // ── c0 — the far bank rises into a town ──
        { id: 'tar-1', x: 180, y: 375, label: 'The Far Bank', description: 'The far bank rises into a town smaller than the city, kinder than the caverns.' },
        // ── c1 — The Sweetheart ──
        { id: 'tar-2', x: 180, y: 318, label: 'The Well', description: 'She\'s at the well before you\'ve decided how to say her name.' },
        // ── c2 ──
        { id: 'tar-3', x: 90,  y: 261, label: 'The Miller\'s Rest', description: 'A room above the flour store. Paid, and warm.' },
        { id: 'tar-4', x: 180, y: 261, label: 'The Village Court', description: 'The green stands full for once. An elder reads a ribbon-color.' },
        { id: 'tar-5', x: 270, y: 261, label: 'The Back Lane', description: 'A dog that isn\'t anyone\'s barks at you like it remembers a different face.' },
        // ── c3 — the Portreeve ──
        { id: 'tar-6', x: 180, y: 147, label: 'The Portreeve\'s Desk', description: 'Every ribbon, every ledger, every nomination crosses his desk first.' },
        // ── c4 — the ribbon-road stands open (Phase W5) ──
        { id: 'tar-7', x: 180, y: 33,  label: 'The Ribbon-Road', description: 'Past the Portreeve\'s desk, the road runs straight to the capital.' },
    ],
};
