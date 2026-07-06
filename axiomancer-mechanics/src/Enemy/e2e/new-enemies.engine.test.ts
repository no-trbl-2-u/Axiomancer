/**
 * 2026-07-06 art-driven roster — hermetic coverage for the base enemy library.
 *
 * Asserts:
 *   - every roster slug resolves in ENEMY_REGISTRY and EnemyLibrary,
 *   - every roster enemy carries a UNIQUE portraitAsset (the 1:1 art law),
 *   - every roster enemy has an AUTHORED threat sequence (no generator
 *     fallbacks in the shipped roster) whose damage weights ESCALATE
 *     (max weight in the back half >= max weight of the opening phase),
 *   - tier tags cover early/mid/late with >=12 enemies each,
 *   - derivedStats and maxHealth are positive across the roster.
 */

import { describe, it, expect } from 'vitest';
import { ENEMY_REGISTRY, EnemyLibrary, TheIncompleteness, Sandbag_01 } from '../enemy.library';
import { AUTHORED_THREAT_SEQUENCES } from '../../Combat/combat.threat-sequences';
import type { Enemy } from '../types';

/** The 52 art-roster slugs (excludes the sandbag + incompleteness fixtures). */
const ROSTER_SLUGS = (Object.keys(ENEMY_REGISTRY) as Array<keyof typeof ENEMY_REGISTRY>)
    .filter(slug => slug !== 'sandbag' && slug !== 'the-incompleteness');

describe('2026-07-06: the art-driven base roster', () => {
    it('carries exactly 52 roster enemies (one per painting)', () => {
        expect(ROSTER_SLUGS.length).toBe(52);
    });

    it('registers every roster enemy in EnemyLibrary', () => {
        for (const slug of ROSTER_SLUGS) {
            expect(EnemyLibrary).toContain(ENEMY_REGISTRY[slug]);
        }
    });

    it('gives every roster enemy a unique portraitAsset (the 1:1 art law)', () => {
        const seen = new Set<string>();
        for (const slug of ROSTER_SLUGS) {
            const enemy = ENEMY_REGISTRY[slug] as Enemy;
            expect(enemy.portraitAsset, `slug ${slug} missing portraitAsset`).toBeTruthy();
            expect(seen.has(enemy.portraitAsset!), `duplicate portraitAsset ${enemy.portraitAsset}`).toBe(false);
            seen.add(enemy.portraitAsset!);
        }
    });

    it('authors a threat sequence for every roster enemy (no generator fallbacks)', () => {
        for (const slug of ROSTER_SLUGS) {
            const enemy = ENEMY_REGISTRY[slug] as Enemy;
            const seq = AUTHORED_THREAT_SEQUENCES[enemy.id];
            expect(seq, `enemy ${enemy.id} has no authored threat sequence`).toBeDefined();
            expect(seq!.length).toBeGreaterThanOrEqual(2);
        }
    });

    it('escalates every authored sequence (Aeon\'s-End pressure: the back half outweighs the opener)', () => {
        for (const slug of ROSTER_SLUGS) {
            const enemy = ENEMY_REGISTRY[slug] as Enemy;
            const seq = AUTHORED_THREAT_SEQUENCES[enemy.id]!;
            const opener = seq[0].damageWeight ?? 1;
            const peak = Math.max(...seq.map(p => p.damageWeight ?? 1));
            expect(peak, `enemy ${enemy.id} never escalates past its opener`).toBeGreaterThan(opener);
        }
    });

    describe('tier tag distribution', () => {
        const tagged = (tag: string) =>
            ROSTER_SLUGS
                .map(slug => ENEMY_REGISTRY[slug] as Enemy)
                .filter(e => e.tags?.includes(tag));

        it('has >=12 early-game enemies', () => {
            expect(tagged('early-game').length).toBeGreaterThanOrEqual(12);
        });

        it('has >=12 mid-game enemies', () => {
            expect(tagged('mid-game').length).toBeGreaterThanOrEqual(12);
        });

        it('has >=12 late-game enemies', () => {
            expect(tagged('late-game').length).toBeGreaterThanOrEqual(12);
        });

        it('stamps every roster enemy with addedIn provenance', () => {
            for (const slug of ROSTER_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                expect(enemy.addedIn).toBe('2026-07-06');
            }
        });
    });

    describe('derived resources are positive', () => {
        it('has positive maxHealth and derivedStats for every roster enemy', () => {
            for (const slug of ROSTER_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                expect(enemy.maxHealth, `slug ${slug} maxHealth`).toBeGreaterThan(0);
                expect(enemy.health, `slug ${slug} health`).toBeGreaterThan(0);
                for (const [key, value] of Object.entries(enemy.derivedStats)) {
                    expect(value, `slug ${slug} derivedStats.${key}`).toBeGreaterThan(0);
                }
            }
        });
    });

    describe('fixtures stay out of the roster', () => {
        it('keeps the Sandbag and The Incompleteness registered but excluded from the count', () => {
            expect(ENEMY_REGISTRY['sandbag']).toBe(Sandbag_01);
            expect(ENEMY_REGISTRY['the-incompleteness']).toBe(TheIncompleteness);
        });
    });
});
