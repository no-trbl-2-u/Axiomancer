import { MAP_PLATES } from '@/assets/images/maps';
import { legacySheet } from './sheet';
import type { MapLayout } from './types';

/**
 * The capital (northern continent) — Phase W5 (2026-09-10).
 * Positions only; kind + edges come from the engine (`@mechanics`).
 * Six engine columns run bottom → top; lanes map y=+1/0/-1 to
 * x=90/180/270 on the 360×400 viewBox.
 */
export const theCapitalLayout: MapLayout = {
    mapId: 'the-capital',
    continent: 'CONTINENT · NORTHERN',
    region: 'The Capital',
    // Ordinal only — no node/path count (CRITIQUE pass 19).
    regionProgress: 'Map v of v',
    sheet: legacySheet(MAP_PLATES.ludgateHill),
    nodes: [
        // ── c0 — the ribbon-road ends at the wall ──
        { id: 'cap-1', x: 180, y: 375, label: 'The Wall', description: 'A wall tall enough to lose the sky behind. Every gate has a line.' },
        // ── c1 — The Herald ──
        { id: 'cap-2', x: 180, y: 307, label: 'The Herald\'s Ledger', description: 'She checks ribbons against a ledger before she checks faces at all.' },
        // ── c2 ──
        { id: 'cap-3', x: 90,  y: 239, label: 'The Petition Line', description: 'The line does not move and does not forgive being pushed.' },
        { id: 'cap-4', x: 180, y: 239, label: 'The Waiting Room', description: 'Paid by the hour. Petitioners sleep here the way they queue — in shifts.' },
        { id: 'cap-5', x: 270, y: 239, label: 'The Refused Petitions', description: 'Refused petitions pile against the wall, ribbons still tied to the corners.' },
        // ── c3 ──
        { id: 'cap-6', x: 90,  y: 171, label: 'The Petitioners\' Row', description: 'Everything the provinces don\'t stock, priced for people with nothing left to lose but coin.' },
        { id: 'cap-7', x: 270, y: 171, label: 'The Dropped Purse', description: 'A purse, dropped and not missed — or missed and not worth the line to reclaim.' },
        // ── c4 — the court convenes ──
        { id: 'cap-8', x: 180, y: 103, label: 'The Court Hall', description: 'A dais, a bell, and a Factor with a ledger heavier than every ribbon-road that fed it.' },
        // ── c5 — The Factor ──
        { id: 'cap-9', x: 180, y: 35,  label: 'The Factor\'s Ledger', description: 'He buys positions, not fights. Yours is the last one on today\'s ledger.' },
    ],
};
