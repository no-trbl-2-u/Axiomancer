/**
 * Kill-objective progression (2026-08-08 first-map audit).
 *
 * The first map's whole quest chain hangs off one kill: `starting-quest` asks
 * the player to put down the King of Revenge at the breakwater, Old Marrow's
 * every reward branch is gated on `questCompleted: 'starting-quest'`, and the
 * `get-to-forest` quest is only granted from inside those branches. (The
 * King was retired in the enemy roster reset, R2; fishing-village is parked
 * until R3, so the contract is pinned on the objective's display name.)
 *
 * The audit found that chain dead in the app. The legacy engine `endCombat`
 * advanced kill objectives inline, but the live hazard-pattern combat never
 * routes through it, so the boss died and the counter stayed at 0/1 forever.
 * `advanceKillObjectives` is the reusable reducer both paths can call; these
 * tests pin its contract against the real authored quest and the real enemy.
 */

import { describe, expect, it } from 'vitest';

import { advanceKillObjectives, startQuest, emptyQuestLog } from '../quest.engine';
import { fishingVillage } from '../Continents/Coastal-Village/maps';
import type { Quest, QuestLog } from '../types';

const STARTING_QUEST = fishingVillage.quests!.find(q => q.name === 'starting-quest')!;
/** The display name the quest's kill objective targets. Its foe was retired
 *  in the enemy roster reset (R2); the reducer contract is pinned on the name. */
const BOSS_NAME = STARTING_QUEST.objectives.find(o => o.type === 'kill')!.target!;

function logWithStartingQuest(): QuestLog {
    return startQuest(emptyQuestLog(), STARTING_QUEST);
}

describe('advanceKillObjectives', () => {
    it('completes starting-quest when its target falls', () => {
        const before = logWithStartingQuest();
        expect(before.active.map(q => q.name)).toContain('starting-quest');

        const { log, completed } = advanceKillObjectives(before, BOSS_NAME);

        expect(completed).toEqual(['starting-quest']);
        expect(log.completed).toContain('starting-quest');
        expect(log.active.map(q => q.name)).not.toContain('starting-quest');
    });

    it('leaves the log untouched for an unrelated kill', () => {
        const before = logWithStartingQuest();
        const { log, completed } = advanceKillObjectives(before, 'Float-Eye');

        expect(completed).toEqual([]);
        expect(log).toBe(before);
    });

    it('is idempotent once the quest has completed', () => {
        const once = advanceKillObjectives(logWithStartingQuest(), BOSS_NAME);
        const twice = advanceKillObjectives(once.log, BOSS_NAME);

        expect(twice.completed).toEqual([]);
        expect(twice.log.completed.filter(n => n === 'starting-quest')).toHaveLength(1);
    });

    it('advances a multi-kill objective one kill at a time', () => {
        const hunt: Quest = {
            name: 'starting-quest',
            description: 'test fixture',
            mapName: 'fishing-village',
            status: 'available',
            objectives: [{
                id: 'cull', type: 'kill', target: 'Float-Eye',
                description: 'Put down three Float-Eyes.',
                requiredCount: 3, currentCount: 0,
            }],
            reward: { kind: 'currency', amount: 1 },
        };
        let log = startQuest(emptyQuestLog(), hunt);
        for (let i = 0; i < 2; i++) log = advanceKillObjectives(log, 'Float-Eye').log;

        expect(log.active[0]!.objectives[0]!.currentCount).toBe(2);
        expect(log.completed).not.toContain('starting-quest');

        const third = advanceKillObjectives(log, 'Float-Eye');
        expect(third.completed).toEqual(['starting-quest']);
    });
});
