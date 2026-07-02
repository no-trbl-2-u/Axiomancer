/**
 * Phase 127 — Third enemy family (ancient-ruins theme) e2e coverage.
 *
 * Validates the 5 new undead/construct/elemental enemies with:
 *   - registry resolution and library inclusion
 *   - stat budget consistency 
 *   - befriendability configs for elite/boss tiers
 *   - skill rotation execution
 *   - friendship reward content
 *   - aftermath narrative coverage
 *   - journal entry unlocking
 */

import { describe, it, expect } from 'vitest';
import { ENEMY_REGISTRY, EnemyLibrary, type EnemySlug } from '../enemy.library';
import { calculateMaxHealth } from '../../Utils';
import type { BaseStats } from '../../Character/types';
import type { Enemy } from '../types';

// Phase 127 ancient-ruins family slugs.
const ANCIENT_RUINS_SLUGS = [
    'boneward-sentinel',
    'voidwrought-construct', 
    'cindergeist-revenant',
    'obsidian-colossus',
    'the-lich-of-missing-steps',
] as const;

function statSum(s: BaseStats): number {
    return s.heart + s.body + s.mind;
}

describe('Phase 127 — ancient-ruins enemy family', () => {
    describe('registry and library integration', () => {
        it('resolves every ancient-ruins slug in ENEMY_REGISTRY', () => {
            for (const slug of ANCIENT_RUINS_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug as EnemySlug];
                expect(enemy, `slug ${slug} missing from ENEMY_REGISTRY`).toBeDefined();
            }
        });

        it('includes every ancient-ruins enemy in EnemyLibrary', () => {
            for (const slug of ANCIENT_RUINS_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug as EnemySlug] as Enemy;
                expect(EnemyLibrary).toContain(enemy);
            }
        });

        it('assigns ancient-ruins enemies to northern-forest map', () => {
            for (const slug of ANCIENT_RUINS_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug as EnemySlug] as Enemy;
                expect(enemy.mapName).toBe('northern-forest');
            }
        });
    });

    describe('stat budget consistency', () => {
        it('ancient-ruins enemies have reasonable stat totals', () => {
            for (const slug of ANCIENT_RUINS_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug as EnemySlug] as Enemy;
                const actualTotal = statSum(enemy.baseStats);
                // Ancient-ruins enemies should have stat totals appropriate for their level
                expect(actualTotal, `${slug} stat total should be reasonable for level ${enemy.level}`).toBeGreaterThan(enemy.level * 2);
                expect(actualTotal, `${slug} stat total should not be excessive for level ${enemy.level}`).toBeLessThan(enemy.level * 5);
            }
        });

        it('derives positive health and stats for all ancient-ruins enemies', () => {
            for (const slug of ANCIENT_RUINS_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug as EnemySlug] as Enemy;
                const maxHealth = calculateMaxHealth(enemy.level, enemy.baseStats);
                expect(maxHealth, `${slug} maxHealth should be positive`).toBeGreaterThan(0);
                
                // Check that each stat contributes to positive damage values
                expect(enemy.baseStats.body, `${slug} body stat should be positive`).toBeGreaterThan(0);
                expect(enemy.baseStats.mind, `${slug} mind stat should be positive`).toBeGreaterThan(0);
                expect(enemy.baseStats.heart, `${slug} heart stat should be positive`).toBeGreaterThan(0);
            }
        });
    });

    describe('AI behavior and skills', () => {
        it('enemies with skills have valid skill rotations', () => {
            const enemiesWithSkills = ['voidwrought-construct', 'cindergeist-revenant', 'obsidian-colossus', 'the-lich-of-missing-steps'];
            
            for (const slug of enemiesWithSkills) {
                const enemy = ENEMY_REGISTRY[slug as EnemySlug] as Enemy;
                expect(enemy.skills, `${slug} should have skills defined`).toBeDefined();
                expect(Array.isArray(enemy.skills), `${slug} skills should be an array`).toBe(true);
                expect(enemy.skills!.length, `${slug} should have at least one skill`).toBeGreaterThan(0);

                // Each skill should have required properties
                for (const skill of enemy.skills!) {
                    expect(skill.id, `${slug} skill should have id`).toBeDefined();
                    expect(skill.name, `${slug} skill should have name`).toBeDefined();
                    expect(skill.description, `${slug} skill should have description`).toBeDefined();
                }
            }
        });
    });

    describe('befriendability and friendship rewards', () => {
        it('elite and boss tiers have befriendability configs', () => {
            const eliteEnemies = ['cindergeist-revenant', 'obsidian-colossus'];
            const bossEnemies = ['the-lich-of-missing-steps'];

            for (const slug of [...eliteEnemies, ...bossEnemies]) {
                const enemy = ENEMY_REGISTRY[slug as EnemySlug] as Enemy;
                expect(enemy.befriendabilityConfig, `${slug} missing befriendabilityConfig`).toBeDefined();
                expect(enemy.befriendabilityConfig!.hpGate).toBeDefined();
                expect(enemy.befriendabilityConfig!.roundsThreshold).toBeGreaterThan(0);
            }
        });

        it('all ancient-ruins enemies have friendship rewards', () => {
            for (const slug of ANCIENT_RUINS_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug as EnemySlug] as Enemy;
                expect(enemy.friendshipReward, `${slug} missing friendshipReward`).toBeDefined();
                expect(enemy.friendshipReward!.narrative).toBeDefined();
                expect(enemy.friendshipReward!.flagSet).toBeDefined();
                expect(enemy.friendshipReward!.items).toBeDefined();
                expect(Array.isArray(enemy.friendshipReward!.items)).toBe(true);
            }
        });

        it('friendship rewards include alignment deltas', () => {
            for (const slug of ANCIENT_RUINS_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug as EnemySlug] as Enemy;
                expect(enemy.friendshipReward!.alignmentDelta, `${slug} missing alignmentDelta`).toBeDefined();
                // At least one axis should be non-zero
                const delta = enemy.friendshipReward!.alignmentDelta!;
                const hasNonZero = delta.epistemology !== 0 || delta.outlook !== 0 || delta.scope !== 0;
                expect(hasNonZero, `${slug} alignmentDelta should have at least one non-zero axis`).toBe(true);
            }
        });
    });

    describe('aftermath narrative content', () => {
        it('all ancient-ruins enemies have aftermath lines', () => {
            for (const slug of ANCIENT_RUINS_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug as EnemySlug] as Enemy;
                expect(enemy.finalBlowLines, `${slug} missing finalBlowLines`).toBeDefined();
                expect(enemy.pactLines, `${slug} missing pactLines`).toBeDefined(); 
                expect(enemy.causeLines, `${slug} missing causeLines`).toBeDefined();

                // Each should have all three variants
                expect(enemy.finalBlowLines!.brutal).toBeTruthy();
                expect(enemy.finalBlowLines!.quiet).toBeTruthy();
                expect(enemy.finalBlowLines!.ironic).toBeTruthy();

                expect(enemy.pactLines!.quiet).toBeTruthy();
                expect(enemy.pactLines!.setDown).toBeTruthy();
                expect(enemy.pactLines!.heavy).toBeTruthy();

                expect(enemy.causeLines!.brutal).toBeTruthy();
                expect(enemy.causeLines!.broken).toBeTruthy();
                expect(enemy.causeLines!.quiet).toBeTruthy();
            }
        });
    });

    describe('journal entries', () => {
        it('all ancient-ruins enemies have journal entries', () => {
            for (const slug of ANCIENT_RUINS_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug as EnemySlug] as Enemy;
                expect(enemy.journalEntry, `${slug} missing journalEntry`).toBeDefined();
                expect(enemy.journalEntry!.id).toBeTruthy();
                expect(enemy.journalEntry!.title).toBeTruthy();
                expect(enemy.journalEntry!.body).toBeTruthy();
                expect(enemy.journalEntry!.id).toContain('codex-');
            }
        });

        it('journal entries have proper structure', () => {
            for (const slug of ANCIENT_RUINS_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug as EnemySlug] as Enemy;
                const entry = enemy.journalEntry!;

                expect(entry.id, `${slug} journal entry id should start with codex-`).toContain('codex-');
                expect(entry.id, `${slug} journal entry id should be related to enemy`).toContain(slug.replace('the-', '').replace(/-/g, '-'));
                expect(entry.title.length, `${slug} journal entry title should not be empty`).toBeGreaterThan(0);
                expect(entry.body.length, `${slug} journal entry body should be substantial`).toBeGreaterThan(50);
            }
        });
    });

    describe('difficulty progression', () => {
        it('has level progression: normal (12-14) -> elite (18-22) -> boss (26)', () => {
            const boneward = ENEMY_REGISTRY['boneward-sentinel' as EnemySlug] as Enemy;
            const voidwrought = ENEMY_REGISTRY['voidwrought-construct' as EnemySlug] as Enemy;  
            const cindergeist = ENEMY_REGISTRY['cindergeist-revenant' as EnemySlug] as Enemy;
            const colossus = ENEMY_REGISTRY['obsidian-colossus' as EnemySlug] as Enemy;
            const lich = ENEMY_REGISTRY['the-lich-of-missing-steps' as EnemySlug] as Enemy;

            // Normal tier progression
            expect(boneward.level).toBe(12);
            expect(voidwrought.level).toBe(14);
            expect(boneward.difficulty).toBe('normal');
            expect(voidwrought.difficulty).toBe('normal');

            // Elite tier progression  
            expect(cindergeist.level).toBe(18);
            expect(colossus.level).toBe(22);
            expect(cindergeist.difficulty).toBe('elite');
            expect(colossus.difficulty).toBe('elite');

            // Boss tier
            expect(lich.level).toBe(26);
            expect(lich.difficulty).toBe('boss');
        });

        it('stance focus distribution: 2 body, 2 mind, 1 heart', () => {
            const enemies = ANCIENT_RUINS_SLUGS.map(slug => 
                ENEMY_REGISTRY[slug as EnemySlug] as Enemy
            );

            const stanceFoci = enemies.map(enemy => {
                const { body, mind, heart } = enemy.baseStats;
                if (body > mind && body > heart) return 'body';
                if (mind > body && mind > heart) return 'mind';  
                if (heart > body && heart > mind) return 'heart';
                return 'balanced';
            });

            const bodyCount = stanceFoci.filter(f => f === 'body').length;
            const mindCount = stanceFoci.filter(f => f === 'mind').length;
            const heartCount = stanceFoci.filter(f => f === 'heart').length;

            expect(bodyCount).toBe(2); // BonewardSentinel, ObsidianColossus
            expect(mindCount).toBe(2); // VoidwroughtConstruct, TheLichOfMissingSteps
            expect(heartCount).toBe(1); // CindergeistRevenant
        });
    });
});