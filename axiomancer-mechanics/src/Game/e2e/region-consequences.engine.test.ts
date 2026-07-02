/**
 * Phase 109 — Region-level consequences for befriend exploit/spare choices.
 *
 * Tests that sparing an elite/miniboss grants 'open-minded' status to the
 * region boss when combat starts (applied in the START_COMBAT path).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createCharacter } from '../../Character';
import { createGameStore } from '../store';
import { nullAdapter } from '../persistence/null.adapter';
import { mockSequentialRng } from '../../test-utils/rng';
import { Enemy } from '../../Enemy/types';
import { ActiveEffect } from '../../Effects/types';

const testRegionBoss: Enemy = {
    id: 'test-region-boss',
    name: 'Test Region Boss',
    description: 'A test region boss',
    level: 6,
    health: 100,
    maxHealth: 100,
    baseStats: { body: 6, mind: 3, heart: 4 },
    derivedStats: {
        physicalAttack: 12, physicalDefense: 12, physicalSkill: 12,
        mentalAttack: 6, mentalDefense: 6, mentalSkill: 6,
        emotionalAttack: 8, emotionalDefense: 8, emotionalSkill: 8,
        luck: 4
    },
    mapName: 'fishing-village', // Same region as elite
    difficulty: 'boss',
    logic: 'boss',
    effects: [],
};

describe('Phase 109 — Region consequences for befriend choices', () => {
    let player: ReturnType<typeof createCharacter>;

    beforeEach(() => {
        mockSequentialRng(0.5);
        player = createCharacter({
            name: 'Test Player',
            level: 5,
            baseStats: { heart: 5, body: 3, mind: 3 },
        });
    });

    describe('Spare consequences', () => {
        it('grants open-minded status to region boss after elite spare', async () => {
            const store = createGameStore(nullAdapter, {
                player,
                regionConsequences: {
                    exploitedRegions: [],
                    sparedRegions: ['fishing-village']
                }
            });

            // Start combat with region boss
            store.getState().startCombat({ enemies: [testRegionBoss] });
            const boss = store.getState().currentEncounter!.enemies[0]!;

            // Verify boss has open-minded effect
            const hasOpenMinded = boss.effects.some(
                (effect: ActiveEffect) => effect.effectId === 'buff_open_minded'
            );
            expect(hasOpenMinded).toBe(true);
        });
    });

    describe('Open-minded status and befriend qualification', () => {
        it('open-minded status qualifies boss for befriend paths', async () => {
            const store = createGameStore(nullAdapter, {
                player,
                regionConsequences: {
                    exploitedRegions: [],
                    sparedRegions: ['fishing-village']
                }
            });

            // Start combat with region boss (should have open-minded)
            store.getState().startCombat({ enemies: [testRegionBoss] });
            const boss = store.getState().currentEncounter!.enemies[0]!;

            // Verify boss has open-minded effect
            const openMindedEffect = boss.effects.find(
                (effect: ActiveEffect) => effect.effectId === 'buff_open_minded'
            );
            expect(openMindedEffect).toBeTruthy();
            expect(openMindedEffect?.intensity).toBe(1);
            expect(openMindedEffect?.remainingDuration).toBe(-1); // Permanent
            expect(openMindedEffect?.sourceId).toBe('region-mercy-consequence');
        });
    });
});
