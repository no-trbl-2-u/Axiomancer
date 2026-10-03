/**
 * The map's SVG raster budget.
 *
 * `react-native-svg` on Android rasterises every `<Svg>` into one ARGB_8888
 * bitmap the size of the view (`SvgView.drawOutput`), so an SVG costs
 * `width px × height px × 4` bytes whatever it draws. The Act 1 sheets are
 * 2400dp square: one SVG across that canvas was a 207MB bitmap at density 3,
 * mounted under every screen for the whole session. These tests render each
 * real Act 1 map with its real roads and hold the total under a budget.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Svg from 'react-native-svg';
import { createStartingWorld, type MapName } from '@mechanics';

import { MapCanvas, canvasSizeOf, edgeStripOf, edgeStroke } from '../MapCanvas';
import { ALL_MAP_LAYOUTS } from '@/state/exploration-maps';
import { selectExplorationViewModel } from '@/state/presenters/exploration.engine';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

/** A dense phone screen; the budget is stated at this density. */
const DENSITY = 3;
const BYTES_PER_PX = 4;
const MB = 1024 * 1024;

/** Everything the pannable canvas rasterises for one map, roads and halos together. */
const CANVAS_SVG_BUDGET_MB = 24;

const PALETTE = { parchment: '#fff', ash: '#888', bone: '#ccc' };

function svgRasterBytes(root: ReturnType<typeof render>): { total: number; largest: number; count: number } {
    const canvas = root.getByTestId('map-canvas');
    let total = 0;
    let largest = 0;
    let count = 0;
    for (const svg of canvas.findAllByType(Svg)) {
        const { width, height } = svg.props as { width: number; height: number };
        const bytes = width * DENSITY * height * DENSITY * BYTES_PER_PX;
        total += bytes;
        largest = Math.max(largest, bytes);
        count += 1;
    }
    return { total, largest, count };
}

describe('MapCanvas: SVG raster budget on the Act 1 sheets', () => {
    it.each(ALL_MAP_LAYOUTS.map((layout) => [layout.mapId] as const))(
        '%s draws its roads within the budget',
        (mapId) => {
            const store = createAppStore({
                adapter: createMemoryAdapter(),
                overrides: { world: createStartingWorld(mapId as MapName) },
            });
            const vm = selectExplorationViewModel(store.getState());
            expect(vm.mapId).toBe(mapId);
            expect(vm.edges.length).toBeGreaterThan(0);

            const root = render(
                <MapCanvas nodes={vm.nodes} edges={vm.edges} sheet={vm.sheet}>
                    <></>
                </MapCanvas>,
            );
            const raster = svgRasterBytes(root);
            const canvas = canvasSizeOf(vm.sheet);
            const wholeCanvasBytes = canvas.w * DENSITY * canvas.h * DENSITY * BYTES_PER_PX;

            // Every road is drawn...
            expect(root.getAllByTestId('map-edge')).toHaveLength(vm.edges.length);
            // ...no SVG spans the canvas...
            expect(raster.largest).toBeLessThan(wholeCanvasBytes / 20);
            // ...and the lot fits the budget.
            expect(raster.total / MB).toBeLessThan(CANVAS_SVG_BUDGET_MB);
        },
    );
});

describe('edgeStripOf: a road in its own strip', () => {
    const road = edgeStroke({ fromId: 'a', toId: 'b', traveled: true, locked: false, lateral: false }, PALETTE);
    const rib = edgeStroke({ fromId: 'a', toId: 'b', traveled: false, locked: false, lateral: true }, PALETTE);

    it('is as long as the road and only as tall as its ink', () => {
        const strip = edgeStripOf({ x: 100, y: 100 }, { x: 400, y: 500 }, road, true, 2.4);
        expect(strip.length).toBe(500);
        expect(strip.width).toBeCloseTo((500 + strip.pad * 2) * 2.4);
        expect(strip.height).toBeCloseTo(strip.pad * 2 * 2.4);
        expect(strip.height).toBeLessThan(24);
    });

    it('pivots on the road start, so the rotated strip ends on the far node', () => {
        const A = { x: 100, y: 100 };
        const B = { x: 400, y: 500 };
        const scale = 2.4;
        const strip = edgeStripOf(A, B, road, true, scale);
        // The road's start sits `pad` in from the strip's corner.
        expect(strip.left + strip.pad * scale).toBeCloseTo(A.x * scale);
        expect(strip.top + strip.pad * scale).toBeCloseTo(A.y * scale);
        const rad = (strip.angle * Math.PI) / 180;
        expect(A.x + strip.length * Math.cos(rad)).toBeCloseTo(B.x);
        expect(A.y + strip.length * Math.sin(rad)).toBeCloseTo(B.y);
    });

    it('leaves room for the casing, the round caps and the travelled bead', () => {
        const strip = edgeStripOf({ x: 0, y: 0 }, { x: 10, y: 0 }, road, true, 1);
        expect(strip.pad).toBeGreaterThan((road.width + 3) / 2);
        expect(strip.pad).toBeGreaterThan(2.5);
    });

    it('gives an uncased rib a thinner strip than a road', () => {
        const a = { x: 0, y: 0 };
        const b = { x: 10, y: 0 };
        expect(edgeStripOf(a, b, rib, false, 1).height).toBeLessThan(edgeStripOf(a, b, road, false, 1).height);
    });
});
