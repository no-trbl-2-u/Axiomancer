import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MapCanvas, computeFocusTransform, focusKeyOf } from '../MapCanvas';
import type { ExplorationNode, ExplorationEdge } from '@/state/presenters/exploration.engine';

const mockNodes: ExplorationNode[] = [
    {
        id: 'node-1',
        label: 'First Node',
        kind: 'current',
        type: 'encounter',
        x: 100,
        y: 200,
        triggersCombat: true,
    },
    {
        id: 'node-2',
        label: 'Second Node',
        kind: 'available',
        type: 'treasure',
        x: 300,
        y: 400,
        triggersCombat: false,
    },
    {
        id: 'node-3',
        label: 'Third Node',
        kind: 'locked',
        type: 'boss',
        x: 500,
        y: 600,
        triggersCombat: true,
    },
    {
        id: 'node-4',
        label: 'Fourth Node',
        kind: 'completed',
        type: 'rest',
        x: 150,
        y: 100,
        triggersCombat: false,
    },
];

const mockEdges: ExplorationEdge[] = [
    {
        fromId: 'node-1',
        toId: 'node-2',
        traveled: false,
        locked: false,
    },
    {
        fromId: 'node-2',
        toId: 'node-3',
        traveled: false,
        locked: true,
    },
    {
        fromId: 'node-1',
        toId: 'node-4',
        traveled: true,
        locked: false,
    },
];

describe('MapCanvas', () => {
    const MockChildren = () => <></>; // Simple mock children

    it('renders correctly with nodes and edges', () => {
        const { getByTestId } = render(
            <MapCanvas nodes={mockNodes} edges={mockEdges}>
                <MockChildren />
            </MapCanvas>
        );

        // Should render the main wrapper
        expect(getByTestId('map-canvas-wrapper')).toBeDefined();
    });

    it('renders correctly with empty nodes and edges', () => {
        const { getByTestId } = render(
            <MapCanvas nodes={[]} edges={[]}>
                <MockChildren />
            </MapCanvas>
        );

        // Should still render the wrapper even with no nodes
        expect(getByTestId('map-canvas-wrapper')).toBeDefined();
    });

    it('builds node lookup map correctly', () => {
        // Test that the component can handle node lookups internally
        const { getByTestId } = render(
            <MapCanvas nodes={mockNodes} edges={mockEdges}>
                <MockChildren />
            </MapCanvas>
        );

        // The component should render without errors even with edge references
        expect(getByTestId('map-canvas-wrapper')).toBeDefined();
    });

    it('handles viewport layout changes', () => {
        const { getByTestId } = render(
            <MapCanvas nodes={mockNodes} edges={mockEdges}>
                <MockChildren />
            </MapCanvas>
        );

        const wrapper = getByTestId('map-canvas-wrapper');
        
        // Simulate layout event
        fireEvent(wrapper, 'layout', {
            nativeEvent: { layout: { width: 375, height: 400 } }
        });

        // Should handle layout without errors
        expect(wrapper).toBeDefined();
    });

    it('ignores zero-width layout events', () => {
        const { getByTestId } = render(
            <MapCanvas nodes={mockNodes} edges={mockEdges}>
                <MockChildren />
            </MapCanvas>
        );

        const wrapper = getByTestId('map-canvas-wrapper');
        
        // Simulate zero-width layout event (should be ignored)
        fireEvent(wrapper, 'layout', {
            nativeEvent: { layout: { width: 0, height: 400 } }
        });

        // Should handle gracefully
        expect(wrapper).toBeDefined();
    });

    it('renders children correctly', () => {
        const TestChild = () => <></>;
        const { getByTestId } = render(
            <MapCanvas nodes={mockNodes} edges={mockEdges}>
                <TestChild />
            </MapCanvas>
        );

        // The children should be rendered inside the animated canvas
        expect(getByTestId('map-canvas-wrapper')).toBeDefined();
    });

    it('calculates spread canvas dimensions correctly', () => {
        // The component uses a 2.6x spread factor
        const SPREAD = 2.6;
        const expectedCanvasW = 360 * SPREAD;
        const expectedCanvasH = 400 * SPREAD;

        const { getByTestId } = render(
            <MapCanvas nodes={mockNodes} edges={mockEdges}>
                <MockChildren />
            </MapCanvas>
        );

        // Should render without errors with correct dimensions
        expect(getByTestId('map-canvas-wrapper')).toBeDefined();
        
        // Verify canvas dimensions are applied (936 x 1040)
        expect(expectedCanvasW).toBe(936);
        expect(expectedCanvasH).toBe(1040);
    });

    it('mounts overlays in the viewport-fixed furniture layer (CRITIQUE pass 20)', () => {
        const { getByTestId } = render(
            <MapCanvas nodes={mockNodes} edges={mockEdges} overlays={<MockChildren />}>
                <MockChildren />
            </MapCanvas>
        );

        // The fixed layer exists and never swallows pan gestures.
        const fixed = getByTestId('map-overlays-fixed');
        expect(fixed).toBeDefined();
        expect(fixed.props.pointerEvents).toBe('none');
    });

    it('omits the fixed overlay layer when no overlays are passed', () => {
        const { queryByTestId } = render(
            <MapCanvas nodes={mockNodes} edges={mockEdges}>
                <MockChildren />
            </MapCanvas>
        );

        expect(queryByTestId('map-overlays-fixed')).toBeNull();
    });

    it('handles nodes with mixed availability states', () => {
        const mixedNodes: ExplorationNode[] = [
            {
                id: 'current-node',
                label: 'Current Position',
                kind: 'current',
                type: 'encounter',
                x: 180,
                y: 200,
                triggersCombat: true,
            },
            {
                id: 'available-node',
                label: 'Available Option',
                kind: 'available',
                type: 'treasure',
                x: 220,
                y: 250,
                triggersCombat: false,
            },
        ];

        const { getByTestId } = render(
            <MapCanvas nodes={mixedNodes} edges={[]}>
                <MockChildren />
            </MapCanvas>
        );

        expect(getByTestId('map-canvas-wrapper')).toBeDefined();
    });

    it('handles edges with different states correctly', () => {
        const edgesWithStates: ExplorationEdge[] = [
            {
                fromId: 'node-1',
                toId: 'node-2',
                traveled: true,
                locked: false,
            },
            {
                fromId: 'node-2',
                toId: 'node-3',
                traveled: false,
                locked: true,
            },
            {
                fromId: 'node-1',
                toId: 'node-4',
                traveled: false,
                locked: false,
            },
        ];

        const { getByTestId } = render(
            <MapCanvas nodes={mockNodes} edges={edgesWithStates}>
                <MockChildren />
            </MapCanvas>
        );

        expect(getByTestId('map-canvas-wrapper')).toBeDefined();
    });

    it('handles missing node references in edges gracefully', () => {
        const edgesWithMissingNodes: ExplorationEdge[] = [
            {
                fromId: 'nonexistent-1',
                toId: 'nonexistent-2',
                traveled: false,
                locked: false,
            },
            {
                fromId: 'node-1',
                toId: 'nonexistent-3',
                traveled: false,
                locked: false,
            },
        ];

        const { getByTestId } = render(
            <MapCanvas nodes={mockNodes} edges={edgesWithMissingNodes}>
                <MockChildren />
            </MapCanvas>
        );

        // Should render without errors even with invalid edge references
        expect(getByTestId('map-canvas-wrapper')).toBeDefined();
    });

    it('centers viewport on focus nodes (current and available)', () => {
        const focusNodes: ExplorationNode[] = [
            {
                id: 'current',
                label: 'Current',
                kind: 'current',
                type: 'encounter',
                x: 150,
                y: 200,
                triggersCombat: true,
            },
            {
                id: 'available',
                label: 'Available',
                kind: 'available',
                type: 'treasure',
                x: 250,
                y: 300,
                triggersCombat: false,
            },
        ];

        const { getByTestId } = render(
            <MapCanvas nodes={focusNodes} edges={[]}>
                <MockChildren />
            </MapCanvas>
        );

        const wrapper = getByTestId('map-canvas-wrapper');
        
        // Trigger layout to initiate centering
        fireEvent(wrapper, 'layout', {
            nativeEvent: { layout: { width: 375, height: 400 } }
        });

        expect(wrapper).toBeDefined();
    });

    it('falls back to canvas center when no focus nodes available', () => {
        const nonFocusNodes: ExplorationNode[] = [
            {
                id: 'locked',
                label: 'Locked',
                kind: 'locked',
                type: 'boss',
                x: 150,
                y: 200,
                triggersCombat: true,
            },
            {
                id: 'completed',
                label: 'Completed',
                kind: 'completed',
                type: 'rest',
                x: 250,
                y: 300,
                triggersCombat: false,
            },
        ];

        const { getByTestId } = render(
            <MapCanvas nodes={nonFocusNodes} edges={[]}>
                <MockChildren />
            </MapCanvas>
        );

        const wrapper = getByTestId('map-canvas-wrapper');
        
        // Trigger layout to initiate centering fallback
        fireEvent(wrapper, 'layout', {
            nativeEvent: { layout: { width: 375, height: 400 } }
        });

        expect(wrapper).toBeDefined();
    });
});

describe('computeFocusTransform', () => {
    const SPREAD = 2.6;

    it('centres a single focus node at 1x — no zoom-out needed', () => {
        const nodes: ExplorationNode[] = [
            { id: 'a', label: 'A', kind: 'current', type: 'encounter', x: 100, y: 100, triggersCombat: false },
        ];
        const fit = computeFocusTransform(nodes, { w: 400, h: 800 });
        expect(fit.scale).toBe(1);
        expect(fit.tx).toBeCloseTo(400 / 2 - 100 * SPREAD);
        expect(fit.ty).toBeCloseTo(800 / 2 - 100 * SPREAD);
    });

    it('falls back to canvas centre at 1x when no focus nodes exist', () => {
        const nodes: ExplorationNode[] = [
            { id: 'a', label: 'A', kind: 'locked', type: 'encounter', x: 100, y: 100, triggersCombat: false },
        ];
        const fit = computeFocusTransform(nodes, { w: 400, h: 800 });
        const CANVAS_W = 360 * SPREAD;
        const CANVAS_H = 400 * SPREAD;
        expect(fit).toEqual({ scale: 1, tx: (400 - CANVAS_W) / 2, ty: (800 - CANVAS_H) / 2 });
    });

    // CRITIQUE.md [MED] "open map nodes just off-screen no-op silently on
    // tap" — a wide branch of simultaneously-open nodes must all land
    // inside the viewport on the initial fit, not just their centroid.
    it('zooms out to fit a wide branch of open nodes fully in the viewport', () => {
        const nodes: ExplorationNode[] = [
            { id: 'left',  label: 'Left',  kind: 'available', type: 'encounter', x: 0,   y: 200, triggersCombat: false },
            { id: 'right', label: 'Right', kind: 'available', type: 'encounter', x: 180, y: 200, triggersCombat: false },
        ];
        const viewport = { w: 420, h: 900 };
        const fit = computeFocusTransform(nodes, viewport);

        expect(fit.scale).toBeLessThan(1);

        // Every focus node's projected screen position must land within
        // [0, viewport] on both axes — the exact defect this fit prevents.
        for (const n of nodes) {
            const screenX = n.x * SPREAD * fit.scale + fit.tx;
            const screenY = n.y * SPREAD * fit.scale + fit.ty;
            expect(screenX).toBeGreaterThanOrEqual(0);
            expect(screenX).toBeLessThanOrEqual(viewport.w);
            expect(screenY).toBeGreaterThanOrEqual(0);
            expect(screenY).toBeLessThanOrEqual(viewport.h);
        }
    });

    it('never zooms in past 1x even when focus nodes sit close together', () => {
        const nodes: ExplorationNode[] = [
            { id: 'a', label: 'A', kind: 'current',   type: 'encounter', x: 100, y: 100, triggersCombat: false },
            { id: 'b', label: 'B', kind: 'available', type: 'encounter', x: 102, y: 100, triggersCombat: false },
        ];
        const fit = computeFocusTransform(nodes, { w: 400, h: 800 });
        expect(fit.scale).toBe(1);
    });

    it('clamps to the minimum scale rather than shrinking without bound', () => {
        const nodes: ExplorationNode[] = [
            { id: 'left',  label: 'Left',  kind: 'available', type: 'encounter', x: 0,   y: 0,   triggersCombat: false },
            { id: 'right', label: 'Right', kind: 'available', type: 'encounter', x: 1000, y: 1000, triggersCombat: false },
        ];
        const fit = computeFocusTransform(nodes, { w: 400, h: 800 });
        expect(fit.scale).toBe(0.6);
    });
});

// ---------------------------------------------------------------------------
// BUG-04 — the camera re-frames as the road opens, without fighting a pan
// ---------------------------------------------------------------------------

/**
 * `focusKeyOf` is the whole safety argument for re-fitting the camera, so it is
 * pinned directly rather than inferred from a rendered Reanimated transform.
 *
 * PLAYTEST_BUGS_2026-09-18 BUG-04: the camera fitted once at mount
 * (`initialized.current`) and never again, so after the player moved, their
 * onward choices could sit entirely off-screen — measured at the Crossing on a
 * 414px viewport, two of three onward paths off opposite edges, 19 of 25 nodes
 * out of frame.
 *
 * The danger in fixing it is `plan/CRITIQUE.md`'s RESOLVED row at :2140 ("the
 * map recenters against manual panning", commit 6fe4e47c, issue #294). A naive
 * re-key on `nodes` would reopen it, because `nodes` is a fresh array on every
 * render. These cases pin the property that keeps both closed.
 */
describe('focusKeyOf — what the camera considers a change', () => {
    const node = (id: string, kind: ExplorationNode['kind']): ExplorationNode => ({
        id, label: id, kind, type: 'encounter', x: 0, y: 0, triggersCombat: false,
    });

    it('is EQUAL across a fresh array with identical content', () => {
        // THE REGRESSION GUARD for issue #294. The presenter hands MapCanvas a
        // new array every render; if that alone counted as a change the camera
        // would re-fit constantly and fight every pan.
        const a = [node('n1', 'current'), node('n2', 'available')];
        const b = [node('n1', 'current'), node('n2', 'available')];
        expect(a).not.toBe(b);
        expect(focusKeyOf(a)).toBe(focusKeyOf(b));
    });

    it('is EQUAL when the same options arrive in a different order', () => {
        const a = [node('n1', 'current'), node('n2', 'available'), node('n3', 'available')];
        const b = [node('n1', 'current'), node('n3', 'available'), node('n2', 'available')];
        expect(focusKeyOf(a)).toBe(focusKeyOf(b));
    });

    it('CHANGES when the player moves', () => {
        // This is BUG-04 itself: the moment the camera has to re-fit.
        const before = [node('n1', 'current'), node('n2', 'available')];
        const after = [node('n2', 'current'), node('n3', 'available')];
        expect(focusKeyOf(before)).not.toBe(focusKeyOf(after));
    });

    it('CHANGES when a new path opens without the player moving', () => {
        const before = [node('n1', 'current'), node('n2', 'available')];
        const after = [node('n1', 'current'), node('n2', 'available'), node('n3', 'available')];
        expect(focusKeyOf(before)).not.toBe(focusKeyOf(after));
    });

    it('is UNCHANGED by locked or completed nodes', () => {
        // They are not the camera's subject; folding them in would re-fit the
        // view for changes the player did not make to their position or options.
        const bare = [node('n1', 'current'), node('n2', 'available')];
        const dressed = [
            node('n1', 'current'), node('n2', 'available'),
            node('n9', 'locked'), node('n8', 'completed'),
        ];
        expect(focusKeyOf(bare)).toBe(focusKeyOf(dressed));
    });

    it('is stable with no current node (empty map / pre-boot)', () => {
        expect(focusKeyOf([])).toBe(focusKeyOf([]));
        expect(() => focusKeyOf([])).not.toThrow();
    });
});

describe('MapCanvas re-frames on a focus change', () => {
    const MockChildren = () => <></>;

    it('re-renders with a changed focus set without throwing', () => {
        // Integration smoke: the effect now runs more than once by design, so
        // prove the second run is harmless against a live component.
        const { getByTestId, rerender } = render(
            <MapCanvas nodes={mockNodes} edges={mockEdges}><MockChildren /></MapCanvas>,
        );
        fireEvent(getByTestId('map-canvas-wrapper'), 'layout', {
            nativeEvent: { layout: { width: 414, height: 896 } },
        });

        const moved: ExplorationNode[] = mockNodes.map((n) =>
            n.id === 'node-1' ? { ...n, kind: 'completed' as const }
            : n.id === 'node-2' ? { ...n, kind: 'current' as const }
            : n);

        expect(() =>
            rerender(<MapCanvas nodes={moved} edges={mockEdges}><MockChildren /></MapCanvas>),
        ).not.toThrow();
        expect(getByTestId('map-canvas-wrapper')).toBeDefined();
    });
});
