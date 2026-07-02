/**
 * Hermetic component tests — BossIllustration (the boss encounter
 * SVG illustration).
 *
 * The component is a single Svg with a complex multi-part boss figure
 * (crown, face, robes, arms, throne) plus decorative pillars. All
 * elements are coded placeholders until the asset-swap workflow
 * ships real art. The test pins the SVG element structure so a
 * refactor can't silently drop visual elements.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Path, Circle, Line, G } from 'react-native-svg';

import { BossIllustration } from '@/components/event/BossIllustration';
import { AXM } from '@/theme/axm';

describe('BossIllustration', () => {
    it('renders with accessibility attributes', () => {
        const tree = render(<BossIllustration />);
        const svg = tree.getByLabelText('Boss encounter illustration showing a crowned figure with glowing eyes and ornate robes on a throne');
        expect(svg).toBeTruthy();
        expect(svg.props.accessibilityRole).toBe('image');
    });

    it('renders the throne base structure', () => {
        const tree = render(<BossIllustration />);
        const paths = tree.UNSAFE_getAllByType(Path);
        // Throne base should be the first path element
        expect(paths.length).toBeGreaterThan(0);
        expect(paths[0].props.d).toBe("M40 20 L 40 200 L 100 80 L 187 30 L 274 80 L 334 200 L 334 20 Z");
    });

    it('renders crown elements', () => {
        const tree = render(<BossIllustration />);
        const paths = tree.UNSAFE_getAllByType(Path);
        // Crown path should be present
        const crownPath = paths.find(path => 
            path.props.d && path.props.d.includes('-82') // Crown spikes pattern
        );
        expect(crownPath).toBeTruthy();
    });

    it('renders glowing eyes', () => {
        const tree = render(<BossIllustration />);
        const circles = tree.UNSAFE_getAllByType(Circle);
        // Should have glowing red eye dots (using AXM.blood color)
        const redCircles = circles.filter(circle =>
            circle.props.fill === AXM.blood // glowing-eye accent
        );
        expect(redCircles.length).toBeGreaterThanOrEqual(2); // Two eyes
    });

    it('renders decorative pillars', () => {
        const tree = render(<BossIllustration />);
        const lines = tree.UNSAFE_getAllByType(Line);
        // Should have pillar line elements
        expect(lines.length).toBeGreaterThan(0);
    });

    it('renders ornate robes with decorative elements', () => {
        const tree = render(<BossIllustration />);
        const paths = tree.UNSAFE_getAllByType(Path);
        // Robe paths should include decorative bands
        const robeDecorations = paths.filter(path => 
            path.props.d && path.props.d.includes('Q') // Curved decorative elements
        );
        expect(robeDecorations.length).toBeGreaterThan(0);
    });

    it('has proper SVG structure with groups and transforms', () => {
        const tree = render(<BossIllustration />);
        const groups = tree.UNSAFE_getAllByType(G);
        // Should have grouped elements for organization
        expect(groups.length).toBeGreaterThan(0);
    });
});