/**
 * Hermetic component tests — EnemyPortrait (the compact in-combat enemy
 * avatar rendered by CombatEnemyPanel on every fight).
 *
 * EnemyPortrait is pure wiring: it resolves an enemy art key to a drawing
 * archetype (`resolveEnemyArchetype`), routes to one of ten per-archetype
 * `FIGURES`, frames it in a small SVG, and applies the
 * `label ?? 'Enemy portrait'` accessibility fallback. The archetype figures
 * are anonymous SVG groups carrying no labels, so this suite pins the
 * dispatcher's observable contract — the resolver alignment that selects the
 * figure, the SVG mounts for every archetype, the a11y role/label fallback +
 * override, the keyless/boss defaults, and dimension propagation — rather
 * than the figure pixels (the figures + resolver carry their own coverage).
 *
 * Resolver truth is read at test time so the suite survives roster churn
 * rather than hard-coding archetype-keyword pairs.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { EnemyPortrait } from '@/components/event/enemy-art/EnemyPortrait';
import {
    resolveEnemyArchetype,
    type EnemyArchetype,
} from '@/state/presenters/enemy-art';

const DEFAULT_LABEL = 'Enemy portrait';

/** A representative enemy id per bespoke (non-generic) archetype. */
const BESPOKE_SAMPLES: ReadonlyArray<readonly [string, EnemyArchetype]> = [
    ['salt-gnaw-rat', 'vermin'],
    ['tidepool-crab', 'crustacean'],
    ['hush-wraith', 'spirit'],
    ['wet-hound', 'beast'],
    ['mournful-gull', 'avian'],
    ['the-forest-mind', 'flora'],
    ['hollow-saint', 'zealot'],
    ['the-unwriting', 'eldritch'],
    ['coastal-tyrant', 'tyrant'],
];

describe('EnemyPortrait', () => {
    it('keeps the bespoke samples aligned with the live resolver', () => {
        for (const [key, archetype] of BESPOKE_SAMPLES) {
            const boss = archetype === 'tyrant';
            expect(resolveEnemyArchetype(key, boss)).toBe(archetype);
        }
    });

    it('renders an image-role portrait for every bespoke archetype', () => {
        for (const [key, archetype] of BESPOKE_SAMPLES) {
            const boss = archetype === 'tyrant';
            const tree = render(<EnemyPortrait enemyArtKey={key} isBoss={boss} />);
            const svg = tree.getByLabelText(DEFAULT_LABEL);
            expect(svg).toBeTruthy();
            expect(svg.props.accessibilityRole).toBe('image');
        }
    });

    it('mounts with the generic figure for an unmatched enemy key', () => {
        expect(resolveEnemyArchetype('a-foe-with-no-keyword', false)).toBe('generic');
        const tree = render(<EnemyPortrait enemyArtKey="a-foe-with-no-keyword" />);
        expect(tree.getByLabelText(DEFAULT_LABEL)).toBeTruthy();
    });

    it('defaults a keyless non-boss to the generic figure', () => {
        expect(resolveEnemyArchetype(null, false)).toBe('generic');
        const tree = render(<EnemyPortrait />);
        const svg = tree.getByLabelText(DEFAULT_LABEL);
        expect(svg).toBeTruthy();
        expect(svg.props.accessibilityRole).toBe('image');
    });

    it('defaults a keyless boss to the crowned tyrant figure', () => {
        expect(resolveEnemyArchetype(null, true)).toBe('tyrant');
        const tree = render(<EnemyPortrait isBoss />);
        const svg = tree.getByLabelText(DEFAULT_LABEL);
        expect(svg).toBeTruthy();
        expect(svg.props.accessibilityRole).toBe('image');
    });

    it('uses the default accessibility label when none is supplied', () => {
        const tree = render(<EnemyPortrait enemyArtKey="salt-gnaw-rat" />);
        expect(tree.getByLabelText(DEFAULT_LABEL)).toBeTruthy();
    });

    it('overrides the accessibility label when one is supplied', () => {
        const label = 'Salt-gnaw rat, hunched and bristling';
        const tree = render(
            <EnemyPortrait enemyArtKey="salt-gnaw-rat" label={label} />,
        );
        expect(tree.getByLabelText(label)).toBeTruthy();
        expect(tree.queryByLabelText(DEFAULT_LABEL)).toBeNull();
    });

    it('propagates custom width and height to the portrait SVG', () => {
        const tree = render(
            <EnemyPortrait enemyArtKey="wet-hound" width={120} height={140} />,
        );
        const svg = tree.getByLabelText(DEFAULT_LABEL);
        expect(svg.props.width).toBe(120);
        expect(svg.props.height).toBe(140);
    });
});
