/**
 * Unit tests for the fishing-village layout fixture — **visual presentation
 * only**. The node GRAPH (ids + edges) is the engine's `MapDefinition`; the
 * fixture supplies positions + copy. Node-id parity with the engine is guarded
 * by `layout-engine-parity.test.ts`; edge/traversal behaviour is covered by the
 * presenter e2e (`state/e2e/exploration.engine.test.ts`). These tests assert
 * only what the fixture itself owns: a complete, well-distributed set of 25
 * on-canvas positions with labels and blurbs.
 */

import { describe, it, expect } from '@jest/globals';
import { fishingVillageLayout } from '../fishing-village.layout';

describe('fishingVillageLayout: structure validation', () => {
    it('contains exactly 25 nodes (fv-1..fv-25)', () => {
        expect(fishingVillageLayout.nodes).toHaveLength(25);

        const ids = fishingVillageLayout.nodes.map(n => n.id);
        const expectedIds = Array.from({ length: 25 }, (_, i) => `fv-${i + 1}`);

        for (const expectedId of expectedIds) {
            expect(ids).toContain(expectedId);
        }
    });

    it('has correct metadata matching the expanded scope', () => {
        expect(fishingVillageLayout.mapId).toBe('fishing-village');
        expect(fishingVillageLayout.continent).toBe('CONTINENT · COASTAL');
        expect(fishingVillageLayout.region).toBe('Fishing Village');
        expect(fishingVillageLayout.regionProgress).toBe('Map i of ii · 24 paths open');
    });

    it('all nodes have required presentation properties on-canvas', () => {
        for (const node of fishingVillageLayout.nodes) {
            expect(typeof node.id).toBe('string');
            expect(typeof node.x).toBe('number');
            expect(typeof node.y).toBe('number');
            expect(typeof node.label).toBe('string');
            expect(node.label.length).toBeGreaterThan(0);
            expect(typeof node.description).toBe('string');
            expect(node.description.length).toBeGreaterThan(0);

            // Validate position is within the canonical 360x400 viewBox.
            expect(node.x).toBeGreaterThanOrEqual(0);
            expect(node.x).toBeLessThanOrEqual(360);
            expect(node.y).toBeGreaterThanOrEqual(0);
            expect(node.y).toBeLessThanOrEqual(400);
        }
    });
});

describe('fishingVillageLayout: visual distribution validation', () => {
    it('spine nodes are distributed vertically', () => {
        const spineNodes = fishingVillageLayout.nodes.filter(n =>
            /^fv-([1-9]|10)$/.test(n.id)
        );

        // Sort by Y position (top to bottom)
        const sorted = [...spineNodes].sort((a, b) => b.y - a.y);

        // Verify they maintain the expected ID order from fv-1 (highest Y) to fv-10 (lowest Y)
        expect(sorted[0].id).toBe('fv-1');  // highest Y value (bottom of screen)
        expect(sorted[sorted.length - 1].id).toBe('fv-10');  // lowest Y value (top of screen)
    });

    it('district nodes are positioned laterally from the spine', () => {
        const harborNodes = fishingVillageLayout.nodes.filter(n =>
            ['fv-11', 'fv-12', 'fv-13', 'fv-14', 'fv-15'].includes(n.id)
        );
        const inlandNodes = fishingVillageLayout.nodes.filter(n =>
            ['fv-16', 'fv-17', 'fv-18', 'fv-19', 'fv-20'].includes(n.id)
        );
        const cliffNodes = fishingVillageLayout.nodes.filter(n =>
            ['fv-21', 'fv-22', 'fv-23', 'fv-24', 'fv-25'].includes(n.id)
        );

        // All districts should have valid coordinates
        expect(harborNodes).toHaveLength(5);
        expect(inlandNodes).toHaveLength(5);
        expect(cliffNodes).toHaveLength(5);

        // Validate X positioning distribution (districts spread horizontally)
        const allX = fishingVillageLayout.nodes.map(n => n.x);
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        expect(maxX - minX).toBeGreaterThan(100); // Nodes spread across viewBox width
    });

    it('no two nodes occupy the exact same position', () => {
        const positions = fishingVillageLayout.nodes.map(n => `${n.x},${n.y}`);
        const uniquePositions = new Set(positions);

        expect(uniquePositions.size).toBe(fishingVillageLayout.nodes.length);
    });
});
