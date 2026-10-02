/**
 * The enemy roster reset.
 *
 * Pins the post-reset roster: exactly three live foes (Float-Eye, the Brine
 * Hag, the Doorwarden) plus the `sandbag` fixture; no survivor carries a
 * keyword or a stage `gain` list; no enemy card carries an affliction; every
 * Act 1 map draws Float-Eye; each Act 1 region pins the Brine Hag mid-region
 * and the Doorwarden as its door boss. The keyword, rider, curse and
 * SUMMON code stays gone from the engine's surface. lexicon-ok: guard pins the deleted surface stays gone
 */

import { describe, expect, it } from 'vitest';

import {
    ENEMY_REGISTRY, EnemiesByMap, EnemyLibrary, FloatEye, LIVE_ENEMY_IDS,
} from '../enemy.library';
import type { Enemy } from '../types';
import { ENEMY_CARD_LIBRARY, type EnemyCardFace } from '../../Combat/combat.enemy-cards';
import { ENEMY_DECKS, deckCardIds } from '../../Combat/combat.enemy-decks';
import { getThreatSequence } from '../../Combat/combat.threat';
import { getNodeEventPool } from '../../World';
import * as engine from '../../Combat/combat.engine';
import * as mechanics from '../../index';

const SURVIVOR_IDS = ['enemy-float-eye', 'enemy-brine-hag', 'enemy-the-doorwarden'];

describe('the R2 roster', () => {
    it('ENEMY_REGISTRY is exactly sandbag + the three survivors', () => {
        expect(Object.keys(ENEMY_REGISTRY).sort())
            .toEqual(['brine-hag', 'float-eye', 'sandbag', 'the-doorwarden']);
        expect(EnemyLibrary.map(e => e.id)).toEqual(SURVIVOR_IDS);
        expect([...LIVE_ENEMY_IDS].sort())
            .toEqual([...SURVIVOR_IDS, ENEMY_REGISTRY.sandbag.id].sort());
    });

    it('no survivor carries a keyword, and no stage grants one', () => {
        for (const enemy of Object.values(ENEMY_REGISTRY) as Enemy[]) {
            expect(enemy.keywords ?? [], `${enemy.id} keywords`).toEqual([]);
            for (const stage of enemy.stages ?? []) {
                expect((stage as { gain?: unknown }).gain, `${enemy.id} stage ${stage.name} gain`)
                    .toBeUndefined();
            }
        }
    });

    it('every survivor resolves an authored threat sequence', () => {
        for (const enemy of EnemyLibrary) {
            expect(getThreatSequence(enemy).length, enemy.id).toBeGreaterThan(0);
        }
    });
});

describe('the R2 enemy cards', () => {
    const RIDERS = ['effectId', 'intensity'] as const;
    const bare = (where: string, face: Partial<EnemyCardFace>): void => {
        for (const field of RIDERS) {
            expect(face[field], `${where}.${field}`).toBeUndefined();
        }
    };

    it('no card (or branch face) carries an affliction', () => {
        for (const [id, card] of Object.entries(ENEMY_CARD_LIBRARY)) {
            bare(id, card);
            if (card.branch) {
                bare(`${id}.then`, card.branch.then);
                bare(`${id}.else`, card.branch.else);
            }
        }
    });

    it('ENEMY_DECKS holds exactly the three survivors, and every card id resolves', () => {
        expect(Object.keys(ENEMY_DECKS).sort()).toEqual([...SURVIVOR_IDS].sort());
        for (const [enemyId, spec] of Object.entries(ENEMY_DECKS)) {
            const ids = deckCardIds(spec);
            expect(ids.length, enemyId).toBeGreaterThan(0);
            for (const cardId of ids) {
                expect(ENEMY_CARD_LIBRARY[cardId], `${enemyId} → ${cardId}`).toBeDefined();
            }
        }
    });
});

describe('the R2 Act 1 pools and pins (D61)', () => {
    const ACT1 = [
        { continent: 'coastal-continent', map: 'breakwater', elite: 'bw-8', door: 'bw-17' },
        { continent: 'coastal-continent', map: 'charcoal-wood', elite: 'cw-12', door: 'cw-17' },
        { continent: 'northern-continent', map: 'beacon-crags', elite: 'bc-8', door: 'bc-15' },
        { continent: 'northern-continent', map: 'lantern-deep', elite: 'ld-8', door: 'ld-16' },
    ] as const;

    const encounterAt = (continent: string, map: string, nodeId: string) => {
        const payload = getNodeEventPool(continent, map, nodeId)?.entries[0]?.payload;
        expect(payload?.kind, `${map}/${nodeId}`).toBe('encounter');
        return payload as { kind: 'encounter'; enemySlug?: string; isBoss?: boolean };
    };

    it.each(ACT1)('$map draws Float-Eye and nothing else', ({ map }) => {
        expect(EnemiesByMap[map]).toEqual([FloatEye]);
    });

    it.each(ACT1)('$map pins the Doorwarden as its door boss ($door)', ({ continent, map, door }) => {
        const payload = encounterAt(continent, map, door);
        expect(payload.enemySlug).toBe('the-doorwarden');
        expect(payload.isBoss).toBe(true);
    });

    it.each(ACT1)('$map pins the Brine Hag mid-region ($elite)', ({ continent, map, elite }) => {
        const payload = encounterAt(continent, map, elite);
        expect(payload.enemySlug).toBe('brine-hag');
        expect(payload.isBoss ?? false).toBe(false);
    });
});

describe('R2b — the enemy keyword code is gone (D63)', () => {
    it('the engine exports none of the deleted keyword, SUMMON or curse surface', () => {
        const gone = [
            'strikeAdd', 'ADD_WAVE_CAP', 'STRIKE_ADD_COST', 'ADD_BITE_PER_LEVEL',
            'effectiveHide', 'scalePlayerHitDetailed', 'BRUTAL_DAMAGE_MULT',
            'WOUND_CARD_ID', 'projectEnemyHealPerRound',
        ];
        for (const name of gone) {
            expect(name in engine, `combat.engine exports ${name}`).toBe(false);
            expect(name in mechanics, `the package exports ${name}`).toBe(false);
        }
    });

    it('no survivor telegraph prints a PLEA, premise or curse rider', () => {
        for (const enemy of EnemyLibrary) {
            for (const phase of getThreatSequence(enemy)) {
                const faces = phase.branch ? [phase.branch.then, phase.branch.else] : [phase];
                for (const face of faces) {
                    expect(face.threatAction.description, enemy.id).not.toMatch(/PLEA|premise|curse/i);
                }
            }
        }
    });
});
