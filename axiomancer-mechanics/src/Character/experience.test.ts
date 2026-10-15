import { describe, expect, it } from 'vitest';
import { experienceForLevel, experienceToNext } from './experience';
import { EXPERIENCE_BASE, STAT_POINTS_PER_LEVEL } from '../Game/game-mechanics.constants';
import { createGameStore } from '../Game/store';
import { createNewGameState } from '../Game/game.reducer';
import { nullAdapter } from '../Game/persistence/null.adapter';

describe('the level curve (LV1)', () => {
    it('starts at zero, and level 1 to 2 costs the base 70', () => {
        expect(experienceForLevel(1)).toBe(0);
        expect(EXPERIENCE_BASE).toBe(70);
        expect(experienceToNext(1)).toBe(70);
        expect(experienceForLevel(2)).toBe(70);
    });

    it.each([
        [2, 70, 70],
        [5, 93, 325],
        [10, 150, 950],
        [20, 389, 3582],
        [21, 428, 4010],
        [40, 6093, 47440],
        [50, 36153, 229326],
    ])('reaching level %i costs %i, for a running total of %i', (level, step, total) => {
        expect(experienceToNext(level - 1)).toBe(step);
        expect(experienceForLevel(level)).toBe(total);
    });

    it('every step costs more than the one before it', () => {
        for (let l = 2; l <= 60; l++) {
            expect(experienceToNext(l), `level ${l}`).toBeGreaterThan(experienceToNext(l - 1));
        }
    });

    it('the running total is the sum of the steps below', () => {
        let sum = 0;
        for (let l = 1; l <= 60; l++) {
            expect(experienceForLevel(l)).toBe(sum);
            sum += experienceToNext(l);
        }
    });

    it('floors a level below 1 to level 1', () => {
        expect(experienceForLevel(0)).toBe(0);
        expect(experienceForLevel(-3)).toBe(0);
        expect(experienceToNext(0)).toBe(70);
    });

    it('a level-up cascade from 0 to 3,582 XP lands on level 20 with 19 points', () => {
        const state = createNewGameState();
        state.player.experience = 3582;
        const store = createGameStore(nullAdapter, state);
        store.getState().levelUp();
        const { player } = store.getState();
        expect(player.level).toBe(20);
        expect(player.experienceToNextLevel).toBe(experienceForLevel(21));
        expect(STAT_POINTS_PER_LEVEL).toBe(1);
        expect(player.availableStatPoints).toBe(19);
    });
});
