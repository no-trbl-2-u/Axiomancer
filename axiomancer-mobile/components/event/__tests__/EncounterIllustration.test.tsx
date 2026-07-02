/**
 * Hermetic component tests — EncounterIllustration (the combat
 * encounter SVG illustration).
 *
 * The component is a single Svg with a creature among twisted trees
 * and ground debris. Includes background trees, ground line, central
 * creature figure, moon/circle, and scattered debris lines. All
 * elements are coded placeholders until the asset-swap workflow
 * ships real art. The test pins the SVG element structure so a
 * refactor can't silently drop visual elements.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Path, Circle, Line, G, Ellipse } from 'react-native-svg';

import { EncounterIllustration } from '@/components/event/EncounterIllustration';
import { AXM } from '@/theme/axm';

describe('EncounterIllustration', () => {
    it('renders with accessibility attributes', () => {
        const tree = render(<EncounterIllustration />);
        const svg = tree.getByLabelText('Combat encounter illustration showing a horned creature crouched in a moonlit clearing among twisted trees');
        expect(svg).toBeTruthy();
        expect(svg.props.accessibilityRole).toBe('image');
    });

    it('renders the ground horizon line', () => {
        const tree = render(<EncounterIllustration />);
        const lines = tree.UNSAFE_getAllByType(Line);
        // First line should be the ground horizon
        expect(lines.length).toBeGreaterThan(0);
        expect(lines[0].props.x1).toBe(0);
        expect(lines[0].props.y1).toBe(200);
        expect(lines[0].props.x2).toBe(374);
        expect(lines[0].props.y2).toBe(200);
    });

    it('renders twisted background trees', () => {
        const tree = render(<EncounterIllustration />);
        const paths = tree.UNSAFE_getAllByType(Path);
        // Should have multiple tree trunk paths (4 trees at different x positions)
        const treePaths = paths.filter(path => 
            path.props.d && path.props.d.includes('220') // Tree trunk ends at y=220
        );
        expect(treePaths.length).toBeGreaterThanOrEqual(4); // 4 main tree trunks
    });

    it('renders the central creature figure', () => {
        const tree = render(<EncounterIllustration />);
        const ellipses = tree.UNSAFE_getAllByType(Ellipse);
        // Creature should have elliptical body parts
        expect(ellipses.length).toBeGreaterThan(0);
        
        const paths = tree.UNSAFE_getAllByType(Path);
        // Creature should have irregular outline
        const creaturePaths = paths.filter(path =>
            path.props.d && path.props.d.includes('-50 0 L -55 -20') // Creature outline pattern
        );
        expect(creaturePaths.length).toBeGreaterThan(0);
    });

    it('renders creature details (eyes, mouth)', () => {
        const tree = render(<EncounterIllustration />);
        const circles = tree.UNSAFE_getAllByType(Circle);
        // Should have circular creature features (eyes, nodes, etc.)
        const redCircles = circles.filter(circle =>
            circle.props.fill === AXM.blood // creature accent
        );
        expect(redCircles.length).toBeGreaterThan(0);
    });

    it('renders moon/circle in background', () => {
        const tree = render(<EncounterIllustration />);
        const circles = tree.UNSAFE_getAllByType(Circle);
        // Should have a moon outline circle
        const moonCircle = circles.find(circle =>
            circle.props.cx === 290 && circle.props.cy === 66 && circle.props.r === 26 && circle.props.fill === 'none'
        );
        expect(moonCircle).toBeTruthy();
    });

    it('renders ground debris scatter', () => {
        const tree = render(<EncounterIllustration />);
        const lines = tree.UNSAFE_getAllByType(Line);
        // Should have many ground-mist hatch lines (40 from the Array.from pattern)
        const debrisLines = lines.filter(line =>
            line.props.x1 !== undefined && line.props.x1 !== 0 // Exclude the horizon line
        );
        expect(debrisLines.length).toBeGreaterThan(30); // Expect substantial ground mist
    });

    it('has proper SVG structure with groups and transforms', () => {
        const tree = render(<EncounterIllustration />);
        const groups = tree.UNSAFE_getAllByType(G);
        // Should have grouped elements for organization (trees, creature, etc.)
        expect(groups.length).toBeGreaterThan(0);
    });
});