/**
 * 2026-07-06 art-driven roster — hermetic coverage for the base enemy library.
 *
 * The roster-count pin, the 1:1 art law, the escalation law (deck laws,
 * §3 L14/L16), and the coveted-die stake law were repealed 2026-09-02
 * (big-numbers overhaul §3/§10). What survives are bug detectors:
 *   - every roster slug resolves in ENEMY_REGISTRY and EnemyLibrary,
 *   - every roster enemy has an AUTHORED threat sequence (no generator
 *     fallbacks in the shipped roster),
 *   - tier tags cover early/mid/late with >=12 enemies each,
 *   - derivedStats and maxHealth are positive across the roster.
 */

import { describe, it, expect } from 'vitest';
import { ENEMY_REGISTRY, EnemyLibrary, TheIncompleteness, Sandbag_01 } from '../enemy.library';
import { AUTHORED_THREAT_SEQUENCES } from '../../Combat/combat.threat-sequences';
import type { Enemy } from '../types';

/** The Aporia act bosses (W-01) — authored labyrinth content, not paintings. */
const APORIA_BOSS_SLUGS = ['the-doorwarden', 'the-index', 'the-sophist'] as const;

/**
 * The art-roster slugs (excludes the sandbag + incompleteness fixtures and
 * the W-01 labyrinth act bosses, which are not part of the painting roster):
 * the 52 paintings (2026-07-06), the 9-strong Phase W3 northern batch
 * (2026-08-28), and the 7-strong Phase W4 river-crossing batch
 * (2026-08-31, game-icons.net trove portraits).
 */
const ROSTER_SLUGS = (Object.keys(ENEMY_REGISTRY) as Array<keyof typeof ENEMY_REGISTRY>)
    .filter(slug =>
        slug !== 'sandbag' &&
        slug !== 'the-incompleteness' &&
        !(APORIA_BOSS_SLUGS as readonly string[]).includes(slug));

/** Provenance stamps the roster has accrued, batch by batch. */
const ROSTER_ADDED_STAMPS = ['2026-07-06', '2026-08-28', '2026-08-31', '2026-09-05'];

describe('2026-07-06: the art-driven base roster', () => {
    it('registers every roster enemy in EnemyLibrary', () => {
        for (const slug of ROSTER_SLUGS) {
            expect(EnemyLibrary).toContain(ENEMY_REGISTRY[slug]);
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

        it('stamps every roster enemy with a known batch addedIn provenance', () => {
            for (const slug of ROSTER_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                expect(ROSTER_ADDED_STAMPS, `slug ${slug} addedIn ${enemy.addedIn}`)
                    .toContain(enemy.addedIn);
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
        it('keeps the Sandbag and The Unfinished registered but excluded from the count', () => {
            expect(ENEMY_REGISTRY['sandbag']).toBe(Sandbag_01);
            expect(ENEMY_REGISTRY['the-incompleteness']).toBe(TheIncompleteness);
        });
    });

    describe('the Phase W3 northern batch (2026-08-28)', () => {
        const W3_SLUGS = [
            'seam-tick', 'prop-wight', 'unpaid-delver', 'sump-maren',
            'toll-sergeant', 'guild-knife', 'the-factor', 'wharf-shrike',
            'the-harbormaster',
        ] as const;

        it('registers all nine, stamped 2026-08-28, on the two northern maps', () => {
            for (const slug of W3_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                expect(enemy, `slug ${slug} missing from ENEMY_REGISTRY`).toBeDefined();
                expect(enemy.addedIn).toBe('2026-08-28');
                expect(['caverns', 'northern-city']).toContain(enemy.mapName);
                expect(EnemyLibrary).toContain(enemy);
            }
        });

        it('the Harbormaster is the batch\'s one boss', () => {
            for (const slug of W3_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                if (slug === 'the-harbormaster') {
                    expect(enemy.difficulty).toBe('boss');
                } else {
                    expect(['normal', 'elite']).toContain(enemy.difficulty);
                }
            }
        });

        it('every W3 enemy carries aftermath prose (finalBlowLines + causeLines)', () => {
            for (const slug of W3_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                expect(enemy.finalBlowLines, `${slug} finalBlowLines`).toBeDefined();
                expect(enemy.causeLines, `${slug} causeLines`).toBeDefined();
            }
        });
    });

    describe('the Phase W4 river-crossing batch (2026-08-31)', () => {
        const W4_SLUGS = [
            'reed-ambusher', 'toll-skiff', 'weir-widow', 'the-waterreeve',
            'dowry-collector', 'the-kept-suitor', 'the-portreeve',
        ] as const;

        it('registers all seven, stamped 2026-08-31, on the two river-crossing maps', () => {
            for (const slug of W4_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                expect(enemy, `slug ${slug} missing from ENEMY_REGISTRY`).toBeDefined();
                expect(enemy.addedIn).toBe('2026-08-31');
                expect(['connecting-river', 'town-across-river']).toContain(enemy.mapName);
                expect(EnemyLibrary).toContain(enemy);
            }
        });

        it('the Waterreeve and the Portreeve are the batch\'s two bosses', () => {
            for (const slug of W4_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                if (slug === 'the-waterreeve' || slug === 'the-portreeve') {
                    expect(enemy.difficulty).toBe('boss');
                } else {
                    expect(['normal', 'elite']).toContain(enemy.difficulty);
                }
            }
        });

        it('every W4 enemy carries aftermath prose (finalBlowLines + causeLines)', () => {
            for (const slug of W4_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                expect(enemy.finalBlowLines, `${slug} finalBlowLines`).toBeDefined();
                expect(enemy.causeLines, `${slug} causeLines`).toBeDefined();
            }
        });
    });

    describe('the adjust-enemies pass 1 caverns backfill (2026-09-05)', () => {
        const BACKFILL_SLUGS = ['ninth-rung-spider', 'spore-warden'] as const;

        it('registers both, stamped 2026-09-05, on the caverns map', () => {
            for (const slug of BACKFILL_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                expect(enemy, `slug ${slug} missing from ENEMY_REGISTRY`).toBeDefined();
                expect(enemy.addedIn).toBe('2026-09-05');
                expect(enemy.mapName).toBe('caverns');
                expect(EnemyLibrary).toContain(enemy);
            }
        });

        it('every backfill enemy carries aftermath prose (finalBlowLines + causeLines)', () => {
            for (const slug of BACKFILL_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                expect(enemy.finalBlowLines, `${slug} finalBlowLines`).toBeDefined();
                expect(enemy.causeLines, `${slug} causeLines`).toBeDefined();
            }
        });

        it('every backfill enemy has a unique portraitAsset', () => {
            for (const slug of BACKFILL_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                expect(enemy.portraitAsset).toBe(slug);
            }
        });
    });

    describe('the Aporia act bosses (W-01)', () => {
        it('registers all three labyrinth bosses at boss difficulty on their act maps', () => {
            const expected: Record<(typeof APORIA_BOSS_SLUGS)[number], string> = {
                'the-doorwarden': 'aporia-colonnade',
                'the-index':      'aporia-archive',
                'the-sophist':    'aporia-proof',
            };
            for (const slug of APORIA_BOSS_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                expect(enemy, `slug ${slug} missing from ENEMY_REGISTRY`).toBeDefined();
                expect(enemy.difficulty).toBe('boss');
                expect(enemy.mapName).toBe(expected[slug]);
                expect(EnemyLibrary).toContain(enemy);
            }
        });

        it('authors a threat sequence for every labyrinth boss', () => {
            for (const slug of APORIA_BOSS_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                const seq = AUTHORED_THREAT_SEQUENCES[enemy.id];
                expect(seq, `enemy ${enemy.id} has no authored threat sequence`).toBeDefined();
                expect(seq!.length).toBeGreaterThanOrEqual(2);
            }
        });

        it('derives positive resources for every labyrinth boss', () => {
            for (const slug of APORIA_BOSS_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                expect(enemy.maxHealth, `slug ${slug} maxHealth`).toBeGreaterThan(0);
                for (const [key, value] of Object.entries(enemy.derivedStats)) {
                    expect(value, `slug ${slug} derivedStats.${key}`).toBeGreaterThan(0);
                }
            }
        });

        it('has a unique portraitAsset each (adjust-enemies pass 1, 2026-09-05 backfill — shipped with none at W-01 launch)', () => {
            for (const slug of APORIA_BOSS_SLUGS) {
                const enemy = ENEMY_REGISTRY[slug] as Enemy;
                expect(enemy.portraitAsset, `slug ${slug} portraitAsset`).toBe(slug);
            }
        });
    });
});
