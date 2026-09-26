/**
 * Act 1 map layouts — nodes on the plate (map revamp M3; D15, D16, D25).
 *
 * The Act 1 maps are drawn ON their plates: each node sits on a landmark read
 * off the plate (`assets/images/maps/act1-landmarks.json`). These pins state
 * the three rulings that shape every Act 1 layout:
 *
 *   D25 — every landmark on the plate has a node on it (more nodes are
 *         allowed, never a landmark without one);
 *   D16 — the map does not read as a climb: the nodes spread across the
 *         sheet on both axes, and the entry is not on the bottom edge;
 *   D15 — the plate is the map: shown near full strength, with the
 *         procedural chart texture off.
 *
 * Each Act 1 map joins `ACT1_MAPS` as its M3 PR ships.
 */

import { describe, expect, it } from '@jest/globals';
import { getMapDefinition } from '@mechanics';
import type { ContinentName, MapName } from '@mechanics';

import landmarks from '@/assets/images/maps/act1-landmarks.json';
import { ACT1_PLATES } from '@/assets/images/maps';
import { getMapLayout } from '../index';

type PlateKey = 'act1-coast' | 'act1-forest' | 'act1-mountains' | 'act1-underworld';

const ACT1_MAPS: readonly { mapId: MapName; continent: ContinentName; plate: PlateKey; art: number }[] = [
    { mapId: 'breakwater', continent: 'coastal-continent', plate: 'act1-coast', art: ACT1_PLATES.coast },
];

/** A node counts as ON a landmark within 2% of the sheet (D25's tolerance). */
const ON_LANDMARK = 0.02;

describe.each(ACT1_MAPS)('$mapId — an Act 1 map on its plate', ({ mapId, continent, plate, art }) => {
    const layout = getMapLayout(mapId)!;
    const { sheet } = layout;

    it('has a layout, drawn over its own plate', () => {
        expect(layout).not.toBeNull();
        expect(sheet.backdrop).toBe(art);
    });

    it('puts a node on every landmark of the plate (D25)', () => {
        const bare = landmarks[plate]
            .filter((l) => !layout.nodes.some((n) =>
                Math.hypot(n.x / sheet.width - l.x, n.y / sheet.height - l.y) <= ON_LANDMARK))
            .map((l) => l.id);
        expect(bare).toEqual([]);
    });

    it('spreads across at least half the sheet on both axes (D16)', () => {
        const xs = layout.nodes.map((n) => n.x / sheet.width);
        const ys = layout.nodes.map((n) => n.y / sheet.height);
        expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(0.5);
        expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(0.5);
    });

    it('does not start on the bottom edge — the map is not a climb (D16)', () => {
        const entry = getMapDefinition(continent, mapId).startingNode.id;
        const node = layout.nodes.find((n) => n.id === entry)!;
        expect(node).toBeDefined();
        expect(node.y / sheet.height).toBeLessThan(0.8);
    });

    it('shows the plate as the map: near full strength, no invented chart texture (D15)', () => {
        expect(sheet.plateOpacity).toBeGreaterThanOrEqual(0.75);
        expect(sheet.chartTexture).toBe(false);
    });
});
