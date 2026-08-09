/**
 * Kill-objective progression (2026-08-08 first-map audit).
 *
 * The first map's whole quest chain hangs off one kill: `starting-quest` asks
 * the player to put down the King of Revenge at the breakwater, Old Marrow's
 * every reward branch is gated on `questCompleted: 'starting-quest'`, and the
 * `get-to-forest` quest is only granted from inside those branches.
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
import { KingOfRevenge } from '../../Enemy/enemy.library';
import type { Quest, QuestLog } from '../types';

const STARTING_QUEST = fishingVillage.quests!.find(q => q.name === 'starting-quest')!;

function logWithStartingQuest(): QuestLog {
    return startQuest(emptyQuestLog(), STARTING_QUEST);
}

describe('advanceKillObjectives', () => {
    it('matches the authored objective against the real enemy display name', () => {
        // The load-bearing coupling: the quest targets a DISPLAY name and the
        // combat write-back passes `Enemy.name`. If either side ever drifts to
        // the slug (`king-of-revenge`), the first map silently stops finishing.
        const boss = KingOfRevenge;
        const objective = STARTING_QUEST.objectives.find(o => o.type === 'kill')!;
        expect(objective.target).toBe(boss.name);
    });

    it('completes starting-quest when the King of Revenge falls', () => {
        const boss = KingOfRevenge;
        const before = logWithStartingQuest();
        expect(before.active.map(q => q.name)).toContain('starting-quest');

        const { log, completed } = advanceKillObjectives(before, boss.name);

        expect(completed).toEqual(['starting-quest']);
        expect(log.completed).toContain('starting-quest');
        expect(log.active.map(q => q.name)).not.toContain('starting-quest');
    });

    it('leaves the log untouched for an unrelated kill', () => {
        const before = logWithStartingQuest();
        const { log, completed } = advanceKillObjectives(before, 'Grave Larva');

        expect(completed).toEqual([]);
        expect(log).toBe(before);
    });

    it('is idempotent once the quest has completed', () => {
        const boss = KingOfRevenge;
        const once = advanceKillObjectives(logWithStartingQuest(), boss.name);
        const twice = advanceKillObjectives(once.log, boss.name);

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
                id: 'cull', type: 'kill', target: 'Grave Larva',
                description: 'Put down three grave larvae.',
                requiredCount: 3, currentCount: 0,
            }],
            reward: { kind: 'currency', amount: 1 },
        };
        let log = startQuest(emptyQuestLog(), hunt);
        for (let i = 0; i < 2; i++) log = advanceKillObjectives(log, 'Grave Larva').log;

        expect(log.active[0]!.objectives[0]!.currentCount).toBe(2);
        expect(log.completed).not.toContain('starting-quest');

        const third = advanceKillObjectives(log, 'Grave Larva');
        expect(third.completed).toEqual(['starting-quest']);
    });
});
