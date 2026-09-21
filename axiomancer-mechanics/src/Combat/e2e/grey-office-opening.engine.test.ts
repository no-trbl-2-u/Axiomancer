/**
 * Hermetic sim pin — THE GREY OFFICE'S OPENING (2026-09-20 rebalance).
 *
 * The fishing village's spine now fights once before the breakwater boss
 * (fv-5, grave-larva) and the pinned level-3 King of Revenge carries no HIDE
 * (the early HIDE ramp). This pins the resulting opening at the sim's
 * policies, with a real level-1 fresh player:
 *   - the grey office beats the two pinned normal fights outright;
 *   - the grey office plus ONE random reward beats the pinned King most of
 *     the time under the greedy policy;
 *   - the grey office with NO reward almost never beats him — T's ruling:
 *     winnable only by a near-perfect game, never by the sim's policies.
 * Seeded and deterministic: the numbers are exact, not sampled.
 */

import { describe, it, expect } from 'vitest';
import { createNewGameState } from '../../Game/game.reducer';
import { grantFirstNodeRelic } from '../../Character/first-node-grant';
import { ENEMY_REGISTRY } from '../../Enemy/enemy.library';
import { scaleEnemyToLevel } from '../../World/encounter';
import { simulateHazardPatternCombatDetailed } from '../combat.encounter.sim';
import { STARTING_CARD_IDS, addRewardCard, rollCombatCardRewards } from '../combat.rewards';
import type { Character } from '../../Character/types';

const FV_BOSS_LEVEL = 3;
const lcg = (seed: number) => { let s = seed; return () => { s = (s * 48271) % 2147483647; return s / 2147483647; }; };
// A level-1 player standing at the village's first FIGHT — i.e. one who has
// already walked their first node. Since v24 the Suppliant's Ring is handed
// over there rather than seeded silently at t=0
// (`Character/first-node-grant.ts`), so settling the grant here is what makes
// this "a real level-1 fresh player": it restores the exact worn loadout,
// signature kit and derived stats these pins were measured against, and is
// also the only state a fight can actually be reached from (`START_COMBAT`
// settles the grant too).
const freshPlayer = (): Character => {
    const s = createNewGameState();
    return grantFirstNodeRelic(s.player, s.flags).character;
};
const fresh = (): Character => ({ ...freshPlayer(), knownCards: [...STARTING_CARD_IDS], combatRewardCards: [] });
const withRewards = (n: number, seed: number): Character => {
    const rng = lcg(seed); let p = fresh();
    for (let i = 0; i < n; i++) p = addRewardCard(p, rollCombatCardRewards(p, rng, 3)[0]);
    return p;
};
const deckOf = (p: Character) => [...p.knownCards, ...(p.combatRewardCards ?? [])];
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function winRate(mk: (seed: number) => Character, enemy: unknown, policy: 'greedy' | 'blind', rewardSeeds = 8, runs = 5): number {
    let wins = 0, total = 0;
    for (let s = 1; s <= rewardSeeds; s++) {
        const player = mk(s);
        const { stats } = simulateHazardPatternCombatDetailed({ player, enemy: clone(enemy) as never, runs, startSeed: s * 100, policy, deck: deckOf(player) });
        wins += stats.winRate * stats.runs; total += stats.runs;
    }
    return wins / total;
}

describe('the grey office\'s opening — fishing village, level-1 fresh player', () => {
    const king = scaleEnemyToLevel(ENEMY_REGISTRY['king-of-revenge'], FV_BOSS_LEVEL);

    it('the pinned King carries no HIDE (the early HIDE ramp)', () => {
        expect((king.keywords ?? []).some(k => k.kind === 'hide')).toBe(false);
    });

    it('the grey office alone clears the pinned normal fights', () => {
        const larva = scaleEnemyToLevel(ENEMY_REGISTRY['grave-larva'], 1);
        const belle = scaleEnemyToLevel(ENEMY_REGISTRY['little-belle'], 2);
        const stealer = scaleEnemyToLevel(ENEMY_REGISTRY['foot-stealer'], 3);
        for (const foe of [larva, belle, stealer]) {
            expect(winRate(() => fresh(), foe, 'greedy', 1, 20), foe.id).toBeGreaterThanOrEqual(0.95);
        }
    });

    it('one random reward makes the King a likely win; none makes him a near-certain loss', () => {
        expect(winRate(s => withRewards(1, s), king, 'greedy')).toBeGreaterThanOrEqual(0.8);
        expect(winRate(() => fresh(), king, 'greedy', 1, 20)).toBeLessThanOrEqual(0.1);
    });
});
