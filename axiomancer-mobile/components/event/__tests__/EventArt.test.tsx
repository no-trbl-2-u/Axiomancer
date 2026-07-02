/**
 * Hermetic component tests — EventArt slug→illustration dispatcher.
 *
 * Three-branch dispatch: `'encounter' → EncounterIllustration`,
 * `'boss' → BossIllustration`, everything else →
 * `PlaceholderIllustration` (slug forwarded). The PlaceholderIllustration
 * test already pins the placeholder branches; this test pins the
 * dispatch contract so a future refactor can't silently re-route an
 * encounter slug to the placeholder (or vice-versa).
 *
 * Phase 137 cleanup: the rest / gathering / hazard slug cases left
 * with their kinds (those events launch minigames and never reach the
 * event modal); the live placeholder slugs are interaction-generic,
 * village, and cutscene.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Line, Path } from 'react-native-svg';

import { EventArt } from '@/components/event/EventArt';

describe('EventArt: slug dispatch', () => {
    it("routes 'encounter' to EncounterIllustration (no 60-segment placeholder grid)", () => {
        const tree = render(<EventArt slug="encounter" />);
        // EncounterIllustration has its own SVG; the placeholder's
        // 60-segment Line grid is absent.
        expect(tree.UNSAFE_queryAllByType(Line)).not.toHaveLength(60);
        // EncounterIllustration emits at least one Path.
        expect(tree.UNSAFE_getAllByType(Path).length).toBeGreaterThan(0);
    });

    it("routes 'boss' to BossIllustration (no 60-segment placeholder grid)", () => {
        const tree = render(<EventArt slug="boss" />);
        expect(tree.UNSAFE_queryAllByType(Line)).not.toHaveLength(60);
        expect(tree.UNSAFE_getAllByType(Path).length).toBeGreaterThan(0);
    });

    it("routes 'interaction-generic' to PlaceholderIllustration (60-segment grid)", () => {
        const tree = render(<EventArt slug="interaction-generic" />);
        // PlaceholderIllustration always renders the 60-segment grid.
        expect(tree.UNSAFE_getAllByType(Line)).toHaveLength(60);
    });

    it("routes 'village' to PlaceholderIllustration (forwards the slug — 8 hut Paths)", () => {
        const tree = render(<EventArt slug="village" />);
        expect(tree.UNSAFE_getAllByType(Line)).toHaveLength(60);
        // The `village` placeholder branch emits 4 huts × 2 Paths —
        // confirms EventArt forwards the slug, not a fallback default.
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(8);
    });

    it("routes 'cutscene' to PlaceholderIllustration (forwards the slug — 1 cross Path)", () => {
        const tree = render(<EventArt slug="cutscene" />);
        expect(tree.UNSAFE_getAllByType(Line)).toHaveLength(60);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(1);
    });
});
