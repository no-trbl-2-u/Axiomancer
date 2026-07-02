/**
 * Hermetic component tests — PlaceholderIllustration (the
 * slug-keyed SVG placeholder for non-encounter event kinds).
 *
 * The component is a single Svg with a deterministic background
 * (60-segment Line strip) plus one of three kind-specific
 * groups rendered conditionally on `slug`. Per the file's
 * header, these are deliberate placeholders until the asset-
 * swap workflow ships real art. The branches still need pinning
 * so a refactor can't silently drop a kind's visual.
 *
 * Phase 137 cleanup: the rest / gathering / loot-cache / hazard
 * branches left with their kinds (those events launch minigames and
 * never reach the event modal).
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Line, Path } from 'react-native-svg';

import { PlaceholderIllustration } from '@/components/event/PlaceholderIllustration';
import { EVENT_ART_SLUGS, type EventArtSlug } from '@/state/presenters/event-assets';

describe('PlaceholderIllustration: always-on background', () => {
    it('renders the 60-segment Line grid regardless of slug', () => {
        // Cover the grid invariant across two arbitrary slugs to
        // confirm it's not conditional on any branch.
        const treeNpc = render(<PlaceholderIllustration slug="interaction-generic" />);
        const treeVillage = render(<PlaceholderIllustration slug="village" />);
        expect(treeNpc.UNSAFE_getAllByType(Line)).toHaveLength(60);
        expect(treeVillage.UNSAFE_getAllByType(Line)).toHaveLength(60);
    });
});

describe('PlaceholderIllustration: kind-specific branches', () => {
    it('interaction-generic: emits the figure body Path (1 Path)', () => {
        const tree = render(<PlaceholderIllustration slug="interaction-generic" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(1);
    });

    it('village: emits 4 huts × 2 Paths each (8 Paths total)', () => {
        const tree = render(<PlaceholderIllustration slug="village" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(8);
    });

    it('cutscene: emits the central crosshair Path (1 Path)', () => {
        const tree = render(<PlaceholderIllustration slug="cutscene" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(1);
    });
});

describe('PlaceholderIllustration: accessibility labels', () => {
    it('provides accessibility labels for all defined EventArtSlug values', () => {
        // Verify that getAccessibilityLabel function has coverage for every
        // slug defined in EVENT_ART_SLUGS to prevent accessibility gaps
        EVENT_ART_SLUGS.forEach((slug: EventArtSlug) => {
            const tree = render(<PlaceholderIllustration slug={slug} />);
            const svgElement = tree.getByLabelText(/illustration/i);

            // Verify the SVG has an accessibility label that contains meaningful text
            expect(svgElement.props.accessibilityLabel).toBeTruthy();
            expect(svgElement.props.accessibilityLabel).not.toBe(`Event illustration for ${slug}`);
        });
    });

    it('provides specific descriptive labels for each event type', () => {
        // Verify specific accessibility labels match expected patterns
        const expectedLabels: Record<EventArtSlug, string> = {
            'interaction-generic': 'Generic interaction illustration showing a figure with speech elements',
            'village': 'Village illustration showing multiple buildings',
            'cutscene': 'Cutscene illustration showing narrative elements with circular focus',
            'encounter': 'Combat encounter illustration showing a creature among twisted trees and ground debris',
            'boss': 'Boss encounter illustration showing a crowned figure with glowing eyes and ornate robes on a throne'
        };

        (Object.entries(expectedLabels) as [EventArtSlug, string][]).forEach(([slug, expectedLabel]) => {
            const tree = render(<PlaceholderIllustration slug={slug} />);
            const svgElement = tree.getByLabelText(expectedLabel);
            expect(svgElement).toBeTruthy();
        });
    });

    it('sets proper accessibility role as image for screen readers', () => {
        const tree = render(<PlaceholderIllustration slug="village" />);
        const svgElement = tree.getByLabelText('Village illustration showing multiple buildings');
        expect(svgElement).toBeTruthy();
        expect(svgElement.props.accessibilityRole).toBe('image');
    });
});

describe('PlaceholderIllustration: encounter / boss slugs render only the background', () => {
    it('renders only the background grid for the encounter slug (real art ships via EncounterIllustration)', () => {
        // The dispatcher in EventArt routes encounter/boss away from
        // this placeholder. If a slug ever falls through here for an
        // illustration that has its own component, we want to know
        // the placeholder is intentionally bare (no second branch
        // accidentally lights up).
        const tree = render(<PlaceholderIllustration slug="encounter" />);
        expect(tree.UNSAFE_queryAllByType(Path)).toHaveLength(0);
    });

    it('renders only the background grid for the boss slug', () => {
        const tree = render(<PlaceholderIllustration slug="boss" />);
        expect(tree.UNSAFE_queryAllByType(Path)).toHaveLength(0);
    });
});
