import { describe, expect, it } from 'vitest';
import { experienceForLevel } from './experience';
import { EXPERIENCE_STEP, STAT_POINTS_PER_LEVEL } from '../Game/game-mechanics.constants';
import { createGameStore } from '../Game/store';
import { createNewGameState } from '../Game/game.reducer';
import { nullAdapter } from '../Game/persistence/null.adapter';

describe('experienceForLevel (R9)', () => {
    it('starts at zero and rises by L × step to the next level', () => {
        expect(experienceForLevel(1)).toBe(0);
        for (let l = 1; l <= 10; l++) {
            expect(experienceForLevel(l + 1) - experienceForLevel(l)).toBe(l * EXPERIENCE_STEP);
        }
    });

    it('reads 250 / 750 / 1,500 / 2,500 / 3,750 for levels 2–6', () => {
        expect([2, 3, 4, 5, 6].map(experienceForLevel)).toEqual([250, 750, 1500, 2500, 3750]);
    });

    it('floors a level below 1 to level 1', () => {
        expect(experienceForLevel(0)).toBe(0);
        expect(experienceForLevel(-3)).toBe(0);
    });

    it('a level-up cascade from 0 to a full clear\'s 3,640 XP lands on level 5 with 12 points', () => {
        const state = createNewGameState();
        state.player.experience = 3640;
        const store = createGameStore(nullAdapter, state);
        store.getState().levelUp();
        const { player } = store.getState();
        expect(player.level).toBe(5);
        expect(player.experienceToNextLevel).toBe(experienceForLevel(6));
        expect(player.availableStatPoints).toBe(4 * STAT_POINTS_PER_LEVEL);
    });
});
