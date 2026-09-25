/**
 * Hermetic engine test — TRIM THE FAT Tier 0 item 4
 * (`plan/2026-09-25-trim-the-fat.spec.md`): the worn armor relic's +max VITAE
 * must survive stat allocation and level-up.
 *
 * Both paths used to rebuild `maxHealth` from `calculateMaxHealth(level,
 * baseStats)` alone, silently dropping the +5 a worn Coldglass Aegis or
 * Ashen Cuirass grants. Only the save migration re-added it, so the bonus
 * vanished the first time a player spent a point or levelled up.
 */

import { describe, it, expect } from 'vitest';
import { createCharacter, allocateStatPoint } from '../index';
import { getRelicById } from '../../Items/relic.library';
import { calculateMaxHealth } from '../../Utils';
import { createNewGameState, gameReducer } from '../../Game/game.reducer';
import type { Character } from '../types';

const ARMOR_BONUS = 5;

/** A level-3 pilgrim wearing the Coldglass Aegis (+5 max VITAE). */
function aegisWearer(): Character {
    const aegis = getRelicById('relic-read');
    if (!aegis) throw new Error('fixture: relic-read missing from the relic library');
    return createCharacter({
        name: 'Aegis', level: 3, baseStats: { heart: 4, body: 5, mind: 3 }, equipment: [aegis],
    });
}

describe('Tier 0 item 4 — the armor relic bonus survives stat changes', () => {
    it('the fixture wears the bonus to begin with', () => {
        const p = aegisWearer();
        expect(p.maxHealth).toBe(calculateMaxHealth(p.level, p.baseStats) + ARMOR_BONUS);
    });

    it('keeps the bonus through allocateStatPoint', () => {
        const p = { ...aegisWearer(), availableStatPoints: 1 };
        const next = allocateStatPoint(p, 'body');
        expect(next.baseStats.body).toBe(p.baseStats.body + 1);
        expect(next.maxHealth).toBe(calculateMaxHealth(next.level, next.baseStats) + ARMOR_BONUS);
    });

    it('keeps the bonus through a LEVEL_UP', () => {
        const p = aegisWearer();
        const state = { ...createNewGameState(), player: { ...p, experience: p.experienceToNextLevel } };
        const next = gameReducer(state, { type: 'LEVEL_UP' }).player;
        expect(next.level).toBe(p.level + 1);
        expect(next.maxHealth).toBe(calculateMaxHealth(next.level, next.baseStats) + ARMOR_BONUS);
        expect(next.health).toBe(next.maxHealth);
    });

    it('adds nothing for a character wearing no armor relic', () => {
        const bare = { ...createCharacter({ name: 'Bare', level: 3, baseStats: { heart: 4, body: 5, mind: 3 } }), availableStatPoints: 1 };
        const next = allocateStatPoint(bare, 'mind');
        expect(next.maxHealth).toBe(calculateMaxHealth(next.level, next.baseStats));
    });
});
