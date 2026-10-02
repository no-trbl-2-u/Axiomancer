/**
 * Hermetic engine test — the v35 → v36 hop: the XP curve.
 *
 * The flat 1,000 XP level becomes a rising `level × 250`. A
 * v35 save keeps its level and its progress through that level; a level-up
 * the player has not taken yet stays pending.
 */

import { describe, it, expect } from 'vitest';
import { migrate } from '../game.migrate';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';
import type { GameState } from '../types';

/** A v35 save at `level` holding `experience` on the old flat curve. */
function v35At(level: number, experience: number): Record<string, unknown> {
    const fresh = createNewGameState({ startMap: 'breakwater' });
    return {
        ...fresh,
        version: 35,
        player: { ...fresh.player, level, experience, experienceToNextLevel: level * 1000 },
    };
}

const hop = (raw: Record<string, unknown>): GameState => migrate(raw, 35, 36);

describe('migrate v35 → v36 (THE REVAMP R9 / D55: the rising XP curve)', () => {
    it('lands at the current version', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(36);
        expect(hop(v35At(1, 0)).version).toBe(36);
    });

    it('a fresh level-1 save stays at 0 XP with the new first threshold', () => {
        const { player } = hop(v35At(1, 0));
        expect(player.level).toBe(1);
        expect(player.experience).toBe(0);
        expect(player.experienceToNextLevel).toBe(250);
    });

    it('keeps the level and the progress through it', () => {
        // Level 3, halfway to 4 on the old curve (2,500 of 2,000–3,000).
        const { player } = hop(v35At(3, 2500));
        expect(player.level).toBe(3);
        expect(player.experience).toBe(750 + 375); // L3 at 750, half of the 750 step
        expect(player.experienceToNextLevel).toBe(1500);
    });

    it('a pending level-up stays pending', () => {
        // Level 2 with 2,000 XP: the old threshold is met, the level not taken.
        const { player } = hop(v35At(2, 2000));
        expect(player.level).toBe(2);
        expect(player.experience).toBeGreaterThanOrEqual(player.experienceToNextLevel);
    });

    it('a malformed save cannot lose a level', () => {
        const { player } = hop(v35At(4, 100));
        expect(player.level).toBe(4);
        expect(player.experience).toBe(1500);
        expect(player.experienceToNextLevel).toBe(2500);
    });
});
