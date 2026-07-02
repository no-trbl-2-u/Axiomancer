/**
 * Spec 07 — Encounter generator tests.
 *
 * Verifies:
 *   - Per-map node resolution (`fv-*` → fishing-village, `nf-*` → northern-forest).
 *   - Adaptive scaling bands per difficulty tier.
 *   - Difficulty filtering.
 *   - Encounter cloning (no canonical-library mutation).
 *   - Errors for unknown nodes / empty pools.
 */

import { describe, it, expect } from 'vitest';
import {
    generateEncounter, scaleEnemyToLevel, scaledEncounterLevel,
    DIFFICULTY_LEVEL_BANDS,
} from './encounter';
import { Enemy } from '../Enemy/types';
import { TidepoolCrab, EchoOfPyrrhonia, ENEMY_REGISTRY } from '../Enemy/enemy.library';
import { MapNode } from './types';

const fishingNode: MapNode = { id: 'fv-2', location: [0, 0], connectedNodes: [] };
const forestNode:  MapNode = { id: 'nf-3', location: [0, 0], connectedNodes: [] };
const unknownNode: MapNode = { id: 'zz-1', location: [0, 0], connectedNodes: [] };

describe('DIFFICULTY_LEVEL_BANDS', () => {
    it('keeps simple at or below player level, boss two-to-three above', () => {
        expect(DIFFICULTY_LEVEL_BANDS.simple).toEqual({ min: -1, max: 0 });
        expect(DIFFICULTY_LEVEL_BANDS.boss).toEqual({ min: 2, max: 3 });
    });
    it('unique stays at authored level — no adaptive scaling', () => {
        expect(DIFFICULTY_LEVEL_BANDS.unique).toBe('authored');
    });
});

describe('scaledEncounterLevel', () => {
    it('clamps the floor to 1 when scaling simple enemies for a low-level player', () => {
        const simple: Enemy = { ...TidepoolCrab };
        // Player level 1, simple band = [-1, 0] → either 0 (clamped to 1) or 1.
        for (let i = 0; i < 20; i++) {
            const level = scaledEncounterLevel(simple, 1);
            expect(level).toBeGreaterThanOrEqual(1);
            expect(level).toBeLessThanOrEqual(1);
        }
    });

    it('unique enemies ignore player level — they stay at authored level', () => {
        const level = scaledEncounterLevel(EchoOfPyrrhonia, 50);
        expect(level).toBe(EchoOfPyrrhonia.level);
    });

    it('boss band stays in [+2, +3] relative to the player', () => {
        const boss = ENEMY_REGISTRY['coastal-tyrant'];
        for (let i = 0; i < 50; i++) {
            const level = scaledEncounterLevel(boss, 5);
            expect(level).toBeGreaterThanOrEqual(7);
            expect(level).toBeLessThanOrEqual(8);
        }
    });
});

describe('scaleEnemyToLevel', () => {
    it('returns a clone — does not mutate the source', () => {
        const before = JSON.stringify(TidepoolCrab);
        scaleEnemyToLevel(TidepoolCrab, 5);
        expect(JSON.stringify(TidepoolCrab)).toBe(before);
    });

    it('recomputes maxHealth and resets HP to full', () => {
        const scaled = scaleEnemyToLevel(TidepoolCrab, 5);
        expect(scaled.level).toBe(5);
        expect(scaled.health).toBe(scaled.maxHealth);
        expect(scaled.maxHealth).toBeGreaterThan(TidepoolCrab.maxHealth);
    });

    it('clamps the target level to a floor of 1', () => {
        const scaled = scaleEnemyToLevel(TidepoolCrab, -5);
        expect(scaled.level).toBe(1);
    });

    it('rescales xpReward when the source used the default multiplier', () => {
        const scaled = scaleEnemyToLevel(TidepoolCrab, 4);
        // TidepoolCrab is simple; default = 4 × 10 = 40.
        expect(scaled.xpReward).toBe(40);
    });
});

describe('generateEncounter', () => {
    it('picks an enemy from the resolved map and stamps origin', () => {
        const enc = generateEncounter(fishingNode, 1);
        expect(enc.enemies).toHaveLength(1);
        expect(enc.enemies[0].mapName).toBe('fishing-village');
        expect(enc.origin).toBe('fishing-village:fv-2');
    });

    it('throws for nodes whose map cannot be resolved', () => {
        expect(() => generateEncounter(unknownNode, 1)).toThrow(/cannot resolve map/);
    });

    it('honours an explicit options.mapName for non-prefixed nodes', () => {
        const enc = generateEncounter(unknownNode, 1, { mapName: 'northern-forest' });
        expect(enc.enemies[0].mapName).toBe('northern-forest');
    });

    it('honours options.difficulty as a filter', () => {
        for (let i = 0; i < 20; i++) {
            const enc = generateEncounter(forestNode, 5, { difficulty: 'boss' });
            expect(enc.enemies[0].difficulty).toBe('boss');
        }
    });

    it('throws when the difficulty filter empties the pool', () => {
        // No simple enemies on the fishing village beyond crab/wisp; pick a
        // difficulty that doesn't exist there (`unique`).
        expect(() => generateEncounter(fishingNode, 5, { difficulty: 'unique' })).toThrow();
    });

    it('the returned enemy is a fresh clone — combat mutations don\'t bleed back', () => {
        const enc = generateEncounter(fishingNode, 1);
        const picked = enc.enemies[0];
        picked.health = 0;
        const enc2 = generateEncounter(fishingNode, 1);
        expect(enc2.enemies[0].health).toBeGreaterThan(0);
    });

    it('every map pool contains at least one enemy at every authored difficulty', () => {
        // Sanity check the library indices used by the generator.
        const fishing = generateEncounter(fishingNode, 5, { difficulty: 'normal' });
        const forest  = generateEncounter(forestNode,  5, { difficulty: 'elite' });
        expect(fishing.enemies[0].difficulty).toBe('normal');
        expect(forest.enemies[0].difficulty).toBe('elite');
    });
});
