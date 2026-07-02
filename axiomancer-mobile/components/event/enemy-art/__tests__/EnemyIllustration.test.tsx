/**
 * Hermetic component tests — EnemyIllustration (the combat-encounter art
 * dispatcher rendered on every combat encounter).
 *
 * EnemyIllustration is pure wiring: it resolves an enemy id to a drawing
 * archetype (`resolveEnemyArchetype`) and routes to the right scene —
 * the generic `EncounterIllustration` for unmatched foes, a `CreatureScene`
 * carrying a per-archetype accessibility label + shadow for each bespoke
 * archetype, and a boss-gated branch for `tyrant` (crowned CreatureScene
 * when `isBoss`, the throne `BossIllustration` otherwise). The sibling
 * scenes and the resolver presenter carry their own tests; this pins the
 * dispatcher that wires them together.
 *
 * Labels and resolver truth are read at test time so the suite survives
 * roster / copy churn rather than hard-coding archetype-keyword pairs.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { EnemyIllustration } from '@/components/event/enemy-art/EnemyIllustration';
import {
    resolveEnemyArchetype,
    type EnemyArchetype,
} from '@/state/presenters/enemy-art';

const GENERIC_LABEL =
    'Combat encounter illustration showing a horned creature crouched in a moonlit clearing among twisted trees';
const BOSS_LABEL =
    'Boss encounter illustration showing a crowned figure with glowing eyes and ornate robes on a throne';

/** A representative enemy id per bespoke (non-generic, non-tyrant) archetype. */
const BESPOKE_SAMPLES: ReadonlyArray<readonly [string, EnemyArchetype]> = [
    ['salt-gnaw-rat', 'vermin'],
    ['tidepool-crab', 'crustacean'],
    ['hush-wraith', 'spirit'],
    ['wet-hound', 'beast'],
    ['mournful-gull', 'avian'],
    ['the-forest-mind', 'flora'],
    ['hollow-saint', 'zealot'],
    ['the-unwriting', 'eldritch'],
];

describe('EnemyIllustration', () => {
    it('keeps the bespoke samples aligned with the live resolver', () => {
        for (const [key, archetype] of BESPOKE_SAMPLES) {
            expect(resolveEnemyArchetype(key, false)).toBe(archetype);
        }
    });

    it('falls through to the generic encounter scene for an unmatched enemy', () => {
        expect(resolveEnemyArchetype('a-foe-with-no-keyword', false)).toBe('generic');
        const tree = render(<EnemyIllustration enemyArtKey="a-foe-with-no-keyword" />);
        expect(tree.getByLabelText(GENERIC_LABEL)).toBeTruthy();
    });

    it('falls through to the generic encounter scene when no enemy key is given', () => {
        const tree = render(<EnemyIllustration />);
        expect(tree.getByLabelText(GENERIC_LABEL)).toBeTruthy();
    });

    it('renders a labelled CreatureScene for each bespoke archetype', () => {
        for (const [key, archetype] of BESPOKE_SAMPLES) {
            const tree = render(<EnemyIllustration enemyArtKey={key} />);
            const scene = tree.getByLabelText(
                new RegExp(`Combat encounter illustration showing `),
            );
            expect(scene).toBeTruthy();
            expect(scene.props.accessibilityRole).toBe('image');
            // Not the generic fall-through scene.
            expect(scene.props.accessibilityLabel).not.toBe(GENERIC_LABEL);
            // Sanity: the sample really maps to the claimed archetype.
            expect(resolveEnemyArchetype(key, false)).toBe(archetype);
        }
    });

    it('renders distinct per-archetype labels across bespoke archetypes', () => {
        const labels = BESPOKE_SAMPLES.map(([key]) => {
            const tree = render(<EnemyIllustration enemyArtKey={key} />);
            return tree.getByLabelText(/Combat encounter illustration showing /)
                .props.accessibilityLabel as string;
        });
        expect(new Set(labels).size).toBe(labels.length);
    });

    it('routes a tyrant boss to the crowned CreatureScene (not the throne scene)', () => {
        const key = 'coastal-tyrant';
        expect(resolveEnemyArchetype(key, true)).toBe('tyrant');
        const tree = render(<EnemyIllustration enemyArtKey={key} isBoss />);
        const scene = tree.getByLabelText(/Combat encounter illustration showing /);
        expect(scene).toBeTruthy();
        expect(scene.props.accessibilityRole).toBe('image');
        // The crowned CreatureScene, not the throne BossIllustration.
        expect(tree.queryByLabelText(BOSS_LABEL)).toBeNull();
    });

    it('routes a tyrant non-boss to the throne BossIllustration', () => {
        const key = 'coastal-tyrant';
        expect(resolveEnemyArchetype(key, false)).toBe('tyrant');
        const tree = render(<EnemyIllustration enemyArtKey={key} isBoss={false} />);
        expect(tree.getByLabelText(BOSS_LABEL)).toBeTruthy();
    });

    it('defaults a keyless boss to the crowned tyrant CreatureScene', () => {
        expect(resolveEnemyArchetype(null, true)).toBe('tyrant');
        const tree = render(<EnemyIllustration isBoss />);
        const scene = tree.getByLabelText(/Combat encounter illustration showing /);
        expect(scene).toBeTruthy();
        expect(scene.props.accessibilityRole).toBe('image');
        expect(tree.queryByLabelText(BOSS_LABEL)).toBeNull();
    });
});
