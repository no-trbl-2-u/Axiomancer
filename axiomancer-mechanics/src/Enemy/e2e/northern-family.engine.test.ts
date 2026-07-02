/**
 * Phase 114 — Northern-forest enemy family e2e tests.
 *
 * Hermetic coverage of the 10 new northern-forest enemies: AI diversity,
 * befriendability configs, philosophical alignment distribution, and
 * comprehensive journal/aftermath content.
 */

import { describe, it, expect } from 'vitest';
import { bucketAxis } from '../../Philosophy';
import {
    ThornedSentinel, PackleaderWolf, WhisperingOak,
    FrostboundHunter, MistwalkerShade, VerdantProtector,
    NightmareStag, TheForestMind, EternalAutumn, ShadowOfTheFirst
} from '../enemy.library';

describe('Phase 114: Northern-forest enemy family', () => {
    describe('Enemy definitions and distribution', () => {
        it('creates 10 enemies with correct difficulty distribution', () => {
            const normalEnemies = [ThornedSentinel, PackleaderWolf, WhisperingOak];
            const eliteEnemies = [FrostboundHunter, MistwalkerShade, VerdantProtector];
            const bossEnemies = [NightmareStag, TheForestMind];
            const uniqueEnemies = [EternalAutumn, ShadowOfTheFirst];

            // Verify counts match brief (3 normal, 3 elite, 2 boss, 2 unique)
            expect(normalEnemies).toHaveLength(3);
            expect(eliteEnemies).toHaveLength(3);
            expect(bossEnemies).toHaveLength(2);
            expect(uniqueEnemies).toHaveLength(2);

            // Verify difficulty assignments
            normalEnemies.forEach(enemy => {
                expect(enemy.difficulty).toBe('normal');
                expect(enemy.mapName).toBe('northern-forest');
            });

            eliteEnemies.forEach(enemy => {
                expect(enemy.difficulty).toBe('elite');
                expect(enemy.mapName).toBe('northern-forest');
            });

            bossEnemies.forEach(enemy => {
                expect(enemy.difficulty).toBe('boss');
                expect(enemy.mapName).toBe('northern-forest');
            });

            uniqueEnemies.forEach(enemy => {
                expect(enemy.difficulty).toBe('unique');
                expect(enemy.mapName).toBe('northern-forest');
            });
        });

        it('has diverse AI patterns beyond randomLogic', () => {
            const aiLogics = [
                ThornedSentinel.logic,  // defensive
                PackleaderWolf.logic,  // aggressive  
                WhisperingOak.logic,   // strategic
                FrostboundHunter.logic, // strategic
                MistwalkerShade.logic,  // defensive
                VerdantProtector.logic, // balanced
                NightmareStag.logic,    // boss
                TheForestMind.logic,    // strategic
                EternalAutumn.logic,    // strategic
                ShadowOfTheFirst.logic  // aggressive
            ];

            // Verify no enemies use 'random' logic
            expect(aiLogics).not.toContain('random');

            // Verify diverse patterns
            const uniqueLogics = new Set(aiLogics);
            expect(uniqueLogics.size).toBeGreaterThanOrEqual(4); // defensive, aggressive, strategic, balanced, boss
        });

        it('distributes philosophical alignments across multiple cube cells', () => {
            const alignments = [
                ThornedSentinel.philosophicalAlignment!,  // faith-pessimistic-relational
                PackleaderWolf.philosophicalAlignment!,   // logic-mid-individual
                WhisperingOak.philosophicalAlignment!,    // mid-optimistic-transcendent
                FrostboundHunter.philosophicalAlignment!, // logic-pessimistic-relational
                MistwalkerShade.philosophicalAlignment!,  // mid-mid-transcendent
                VerdantProtector.philosophicalAlignment!, // faith-optimistic-transcendent
                NightmareStag.philosophicalAlignment!,    // mid-pessimistic-transcendent
                TheForestMind.philosophicalAlignment!,    // faith-mid-transcendent
                EternalAutumn.philosophicalAlignment!,    // logic-mid-relational
                ShadowOfTheFirst.philosophicalAlignment! // mid-mid-individual
            ];

            // Verify all have philosophical alignments
            alignments.forEach(alignment => {
                expect(alignment).toBeDefined();
                expect(typeof alignment.epistemology).toBe('number');
                expect(typeof alignment.outlook).toBe('number');
                expect(typeof alignment.scope).toBe('number');
            });

            // Check for diverse spread across axes
            const epistemologyBuckets = alignments.map(a => bucketAxis(a.epistemology));
            const outlookBuckets = alignments.map(a => bucketAxis(a.outlook));
            const scopeBuckets = alignments.map(a => bucketAxis(a.scope));

            expect(new Set(epistemologyBuckets).size).toBeGreaterThan(1);
            expect(new Set(outlookBuckets).size).toBeGreaterThan(1);
            expect(new Set(scopeBuckets).size).toBeGreaterThan(1);
        });
    });

    // The Spec 07 turn-based AI behavior tests (decideEnemyAction over
    // defensive/strategic/boss strategies) were removed with the legacy combat
    // driver. Each enemy still declares a `logic` tag (asserted as data above);
    // the Hazard-Pattern engine drives behavior via authored threat sequences.

    describe('Befriendability configurations', () => {
        it('applies enhanced configs for elite and boss tiers', () => {
            // Elite enemies should have befriendability configs
            expect(FrostboundHunter.befriendabilityConfig).toBeDefined();
            expect(FrostboundHunter.befriendabilityConfig!.hpGate!.belowPct).toBe(0.35);
            expect(FrostboundHunter.befriendabilityConfig!.requiredStances).toContain('heart');

            expect(MistwalkerShade.befriendabilityConfig).toBeDefined();
            expect(MistwalkerShade.befriendabilityConfig!.hpGate!.belowPct).toBe(0.3);
            expect(MistwalkerShade.befriendabilityConfig!.roundsThreshold).toBe(6);

            expect(VerdantProtector.befriendabilityConfig).toBeDefined();
            expect(VerdantProtector.befriendabilityConfig!.requiredStances).toContain('heart');

            // Boss enemies should have more stringent requirements
            expect(NightmareStag.befriendabilityConfig).toBeDefined();
            expect(NightmareStag.befriendabilityConfig!.hpGate!.belowPct).toBe(0.25);
            expect(NightmareStag.befriendabilityConfig!.roundsThreshold).toBe(7);

            expect(TheForestMind.befriendabilityConfig).toBeDefined();
            expect(TheForestMind.befriendabilityConfig!.hpGate!.belowPct).toBe(0.2);
            expect(TheForestMind.befriendabilityConfig!.roundsThreshold).toBe(8);
            expect(TheForestMind.befriendabilityConfig!.requiredStances).toEqual(['mind', 'heart']);
        });

        it('provides friendship rewards for enhanced enemies', () => {
            const eliteEnemies = [FrostboundHunter, MistwalkerShade, VerdantProtector];
            const bossEnemies = [NightmareStag, TheForestMind];

            eliteEnemies.forEach(enemy => {
                expect(enemy.friendshipReward).toBeDefined();
                expect(enemy.friendshipReward!.items!.length).toBeGreaterThan(0);
                expect(enemy.friendshipReward!.xpBonus).toBeGreaterThan(30);
                expect(enemy.friendshipReward!.narrative).toBeTruthy();
                expect(enemy.friendshipReward!.flagSet).toBeTruthy();
            });

            bossEnemies.forEach(enemy => {
                expect(enemy.friendshipReward).toBeDefined();
                expect(enemy.friendshipReward!.items!.length).toBeGreaterThanOrEqual(3);
                expect(enemy.friendshipReward!.xpBonus).toBeGreaterThan(80);
                expect(enemy.friendshipReward!.narrative).toBeTruthy();
                expect(enemy.friendshipReward!.flagSet).toBeTruthy();
            });
        });
    });

    describe('Journal entries and aftermath content', () => {
        it('provides journal entries for elite and boss enemies', () => {
            const journaledEnemies = [
                FrostboundHunter, MistwalkerShade, VerdantProtector,
                NightmareStag, TheForestMind
            ];

            journaledEnemies.forEach(enemy => {
                expect(enemy.journalEntry).toBeDefined();
                expect(enemy.journalEntry!.id).toBeTruthy();
                expect(enemy.journalEntry!.title).toBeTruthy();
                expect(enemy.journalEntry!.body).toBeTruthy();
                expect(enemy.journalEntry!.id).toMatch(/^codex-/);
            });
        });

        it('includes comprehensive aftermath lines for all enemies', () => {
            const allEnemies = [
                ThornedSentinel, PackleaderWolf, WhisperingOak,
                FrostboundHunter, MistwalkerShade, VerdantProtector,
                NightmareStag, TheForestMind, EternalAutumn, ShadowOfTheFirst
            ];

            allEnemies.forEach(enemy => {
                // All enemies should have final blow lines
                expect(enemy.finalBlowLines).toBeDefined();
                expect(enemy.finalBlowLines!.brutal).toBeTruthy();
                expect(enemy.finalBlowLines!.quiet).toBeTruthy();
                expect(enemy.finalBlowLines!.ironic).toBeTruthy();

                // All enemies should have cause lines (for player defeat)
                expect(enemy.causeLines).toBeDefined();
                expect(enemy.causeLines!.brutal).toBeTruthy();
                expect(enemy.causeLines!.broken).toBeTruthy();
                expect(enemy.causeLines!.quiet).toBeTruthy();

                // Befriendable enemies should have pact lines
                if (enemy.friendshipReward) {
                    expect(enemy.pactLines).toBeDefined();
                    expect(enemy.pactLines!.quiet).toBeTruthy();
                    expect(enemy.pactLines!.setDown).toBeTruthy();
                    expect(enemy.pactLines!.heavy).toBeTruthy();
                }
            });
        });
    });

    describe('Combat resources and skills', () => {
        it('provides varied skill resistance patterns via skills', () => {
            const skilledEnemies = [
                ThornedSentinel, PackleaderWolf, WhisperingOak,
                FrostboundHunter, MistwalkerShade, VerdantProtector,
                NightmareStag, TheForestMind, EternalAutumn, ShadowOfTheFirst
            ];

            // All enemies should have skills
            skilledEnemies.forEach(enemy => {
                expect(enemy.skills).toBeDefined();
                expect(enemy.skills!.length).toBeGreaterThan(0);
                
                enemy.skills!.forEach(skill => {
                    expect(skill.id).toBeTruthy();
                    expect(['heart', 'body', 'mind']).toContain(skill.philosophicalAspect);
                });
            });

            // Elite and boss enemies should have proc unlocks
            const advancedEnemies = [
                FrostboundHunter, MistwalkerShade, VerdantProtector,
                NightmareStag, TheForestMind
            ];

            advancedEnemies.forEach(enemy => {
                expect(enemy.procUnlocks).toBeDefined();
                const unlocks = Object.values(enemy.procUnlocks!);
                expect(unlocks.length).toBeGreaterThan(0);
            });
        });

        it('uses appropriate loot tables for difficulty tiers', () => {
            // Normal enemies should have moderate loot chances
            [ThornedSentinel, PackleaderWolf, WhisperingOak].forEach(enemy => {
                expect(enemy.loot).toBeDefined();
                expect(enemy.loot!.length).toBeGreaterThan(0);
                
                // Should include 'none' entries for balance
                const hasNone = enemy.loot!.some(entry => entry.item === null);
                expect(hasNone).toBe(true);
            });

            // Elite enemies should have better loot
            [FrostboundHunter, MistwalkerShade, VerdantProtector].forEach(enemy => {
                expect(enemy.loot).toBeDefined();
                const totalWeight = enemy.loot!.reduce((sum, entry) => sum + entry.weight, 0);
                expect(totalWeight).toBe(100); // Should sum to 100 for percentage weights
            });

            // Boss enemies should have guaranteed valuable drops
            [NightmareStag, TheForestMind].forEach(enemy => {
                expect(enemy.loot).toBeDefined();
                const hasRareItems = enemy.loot!.some(entry => 
                    entry.item && ['void-essence', 'revive-crystal', 'philosopher-tea'].includes(entry.item.id)
                );
                expect(hasRareItems).toBe(true);
            });
        });
    });

    describe('Northern-forest thematic coherence', () => {
        it('maintains thematic consistency in descriptions and names', () => {
            const allEnemies = [
                ThornedSentinel, PackleaderWolf, WhisperingOak,
                FrostboundHunter, MistwalkerShade, VerdantProtector,
                NightmareStag, TheForestMind, EternalAutumn, ShadowOfTheFirst
            ];

            allEnemies.forEach(enemy => {
                // Names should evoke northern-forest themes
                const forestTerms = [
                    'thorn', 'pack', 'whisper', 'oak', 'frost', 'bound', 'hunter',
                    'mist', 'walker', 'verdant', 'protector', 'nightmare', 'stag',
                    'forest', 'mind', 'eternal', 'autumn', 'shadow', 'first'
                ];
                
                const nameContainsForestTerm = forestTerms.some(term => 
                    enemy.name.toLowerCase().includes(term)
                );
                expect(nameContainsForestTerm).toBe(true);

                // Descriptions should feel woodland-themed
                expect(enemy.description).toBeTruthy();
                expect(enemy.description.length).toBeGreaterThan(20);
            });
        });

        it('shows philosophical depth in enemy concepts', () => {
            // Verify enemies embody philosophical concepts, not just combat stats
            const conceptualEnemies = [
                { enemy: WhisperingOak, concept: 'secrets' },
                { enemy: MistwalkerShade, concept: 'certainties' },
                { enemy: NightmareStag, concept: 'dreams' },
                { enemy: TheForestMind, concept: 'thousand years' },
                { enemy: EternalAutumn, concept: 'season' },
                { enemy: ShadowOfTheFirst, concept: 'memory' }
            ];

            conceptualEnemies.forEach(({ enemy, concept }) => {
                expect(enemy.description.toLowerCase()).toContain(concept);
            });
        });
    });
});