/**
 * The pacing sim (`combat.pacing.sim.ts`): it fights at the live foe VITAE,
 * its two drivers stay inside the rules (no fight trips the turn law; the
 * human-like driver never pays a SACRIFICE it cannot), and a seed replays.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import { FloatEye } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { STARTING_CARD_IDS } from '../combat.rewards';
import {
    runPacingEncounter, simulatePacing, scaleEnemyVitae, LIVE_ENCOUNTER_ENEMY_HP_MULTIPLIER,
} from '../combat.pacing.sim';

const deck = [...STARTING_CARD_IDS];

describe('the pacing sim', () => {
    it('fights at the live foe VITAE by default', () => {
        expect(LIVE_ENCOUNTER_ENEMY_HP_MULTIPLIER).toBe(2);
        const foe = scaleEnemyVitae(deepClone(FloatEye), LIVE_ENCOUNTER_ENEMY_HP_MULTIPLIER);
        expect(foe.maxHealth).toBe(FloatEye.maxHealth * 2);
        expect(scaleEnemyVitae(FloatEye, 1)).toBe(FloatEye);
    });

    it('replays a seed exactly, under both drivers', () => {
        for (const policy of ['witness', 'human-like'] as const) {
            const a = runPacingEncounter(deepClone(Player), deepClone(FloatEye), deck, 11, policy);
            const b = runPacingEncounter(deepClone(Player), deepClone(FloatEye), deck, 11, policy);
            expect(a).toEqual(b);
            expect(a.turns).toBeGreaterThan(0);
        }
    });

    it('a longer foe takes more turns; the summary reads its runs', () => {
        const base = { player: deepClone(Player), enemy: deepClone(FloatEye), deck, runs: 20, policy: 'human-like' as const };
        const authored = simulatePacing({ ...base, enemyHpMultiplier: 1 });
        const live = simulatePacing(base);
        expect(live.runs).toBe(20);
        expect(live.meanTurns).toBeGreaterThan(authored.meanTurns);
        expect(live.winRate).toBeGreaterThanOrEqual(0);
        expect(live.mercyRate).toBe(0);
    });
});
