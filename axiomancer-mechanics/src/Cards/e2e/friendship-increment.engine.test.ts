/**
 * Phase 91 — Friendship increment skill mechanics e2e test.
 *
 * Hermetic coverage of the `incrementsFriendship?: number` field on cards and
 * its integration with `executeSkill`. The pre-v3 library cards that carried
 * the field (soothing-words, peaceful-gesture, empathetic-understanding)
 * retired with the spec 32 v3 overhaul; the MACHINERY is kept (the Charm
 * theme and enemy signatures lean on it), so this suite drives it through
 * fixture cards + a local lookup.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createCharacter } from '../../Character';
import { createEnemy } from '../../Enemy';
import { initializeCombat } from '../../Combat/combat.reducer';
import { executeSkill } from '../skill.engine';
import type { Card } from '../types';
import { CombatState } from '../../Combat/types';

const soothe: Card = {
    id: 'fix-soothe',
    name: 'Fixture Soothe',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description: 'A kind word (fixture).',
    tier: 1,
    rank: 1,
    cardType: 'spell',
    targetType: 'enemy',
    incrementsFriendship: 1,
};

const empathize: Card = {
    id: 'fix-empathize',
    name: 'Fixture Empathize',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description: 'Deep understanding (fixture).',
    tier: 2,
    rank: 3,
    cardType: 'spell',
    targetType: 'enemy',
    incrementsFriendship: 2,
};

const plain: Card = {
    id: 'fix-plain',
    name: 'Fixture Plain',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description: 'No friendship rider (fixture).',
    tier: 1,
    rank: 1,
    cardType: 'spell',
    targetType: 'enemy',
};

const lookup = (id: string): Card | undefined =>
    [soothe, empathize, plain].find(s => s.id === id);

describe('Friendship increment skills', () => {
    const player = createCharacter({
        name: 'Test Player',
        level: 1,
        baseStats: { body: 6, mind: 4, heart: 4 },
        knownSkills: [soothe.id, empathize.id, plain.id],
    });
    const enemy = createEnemy({
        id: 'test-enemy',
        name: 'Test Enemy',
        description: 'Test enemy for friendship tests',
        level: 1,
        baseStats: { heart: 3, body: 3, mind: 3 },
        mapName: 'northern-city',
        logic: 'random',
    });
    let state: CombatState;

    beforeEach(() => {
        state = initializeCombat(player, enemy);
    });

    describe('incrementsFriendship: 1', () => {
        it('increments the friendship counter by 1 and emits the event', () => {
            const initialFriendship = state.friendshipCounter;
            const result = executeSkill(state, soothe.id, lookup);

            expect(result.state.friendshipCounter).toBe(initialFriendship + 1);
            expect(result.events).toContainEqual(
                expect.objectContaining({
                    kind: 'friendship-incremented',
                    skillId: soothe.id,
                    amount: 1,
                }),
            );
        });
    });

    describe('incrementsFriendship: 2', () => {
        it('increments the friendship counter by 2 and emits the event', () => {
            const initialFriendship = state.friendshipCounter;
            const result = executeSkill(state, empathize.id, lookup);

            expect(result.state.friendshipCounter).toBe(initialFriendship + 2);
            expect(result.events).toContainEqual(
                expect.objectContaining({
                    kind: 'friendship-incremented',
                    skillId: empathize.id,
                    amount: 2,
                }),
            );
        });
    });

    describe('cards without incrementsFriendship', () => {
        it('do not emit friendship-incremented events', () => {
            const result = executeSkill(state, plain.id, lookup);

            expect(result.events).not.toContainEqual(
                expect.objectContaining({
                    kind: 'friendship-incremented',
                }),
            );
            expect(result.state.friendshipCounter).toBe(state.friendshipCounter);
        });
    });

    describe('friendship processing order', () => {
        it('increments friendship after effects resolve, on top of existing tally', () => {
            const stateWithFriendship = { ...state, friendshipCounter: 5 };

            const result = executeSkill(stateWithFriendship, soothe.id, lookup);

            expect(result.state.friendshipCounter).toBe(6);
            const friendshipEvent = result.events.find(e => e.kind === 'friendship-incremented');
            expect(friendshipEvent).toBeDefined();
        });
    });
});
