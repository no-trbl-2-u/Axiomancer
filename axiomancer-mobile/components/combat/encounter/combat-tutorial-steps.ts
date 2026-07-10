/**
 * Hazard-pattern combat — guided first-fight coach script (mobile UI layer).
 *
 * Pure data + predicates, exactly like the gathering tutorial: each step names
 * what the coach says and the condition (over the live encounter state +
 * view-model) that advances it. The coach derives the current step every render
 * as the FIRST step whose predicate is unmet — stateless progression, so a
 * player who runs ahead of the script simply skips the steps they already
 * proved.
 *
 * Every predicate is written against a MONOTONIC signal — one that latches true
 * and never goes back to false (cumulative pressure, discard count, turn/phase
 * counters). This matters because per-turn state like the drafted die resets on
 * NEW TURN; if a predicate read that directly, the script could snap backwards.
 * The monotonic backstops (`discard`, `turn`, `currentPhaseIndex`) also keep the
 * script honest for a player who blitzes ahead before the coach catches up.
 *
 * These cover TURN ONE only (draft → spend → read the tracks → advance); the
 * script completes itself the moment the player takes a second turn or resolves
 * the phase.
 */

import type { CombatEncounterState } from '@mechanics';

import type { CombatViewModel } from '@/state/presenters/combat-encounter.engine';

export interface CombatTutorialStep {
    id: string;
    /** Coach banner headline. */
    title: string;
    /** Coach banner body — what to do and why it matters. */
    body: string;
    /** The control to look for (rendered as a "find:" hint). */
    lookFor: string;
    /** True once the player has done it (monotonic — latches true). */
    done: (state: CombatEncounterState, vm: CombatViewModel) => boolean;
}

/** A card has left the hand this fight (played or scrapped) — monotonic. */
const playedACard = (s: CombatEncounterState): boolean => s.discard.length >= 1;
/** The player has taken a second turn or moved past the first threat phase.
 *  NB: `threatMarks` is seeded full of `'pending'` at combat start, so this must
 *  count only RESOLVED marks — a bare `.length` check would be true from turn one. */
const advanced = (s: CombatEncounterState): boolean =>
    s.turn >= 2 ||
    s.currentPhaseIndex >= 1 ||
    !!s.finalOutcome ||
    s.threatMarks.some((m) => m === 'clear' || m === 'overwhelmed');
/** The enemy has taken damage or a status has landed on it — monotonic-ish
 *  (HP only falls; a landed status latches the lesson). */
const pressured = (s: CombatEncounterState): boolean =>
    s.enemy.health < s.enemy.maxHealth || s.enemy.effects.length > 0;

export const COMBAT_TUTORIAL_STEPS: CombatTutorialStep[] = [
    {
        id: 'draft',
        title: 'DRAFT YOUR STANCE',
        body:
            'You rolled three dice. Keep ONE — tap it. Every die you leave behind banks as ' +
            '◆ tokens for your Signature Skills (gold banks 2; a dead ✕ banks none). The die ' +
            'you keep can only power cards of ITS color — gold powers anything.',
        lookFor: 'the three dice — TAP ONE',
        done: (s) => !!s.draftedDieId || s.conviction >= 1 || playedACard(s) || advanced(s),
    },
    {
        id: 'spend',
        title: 'SPEND IT ON A CARD',
        body:
            'Drag a card up into the PLAY AREA, then POWER it with your stance die for the full ' +
            'effect — or play it FREE for a weaker version that costs no die. Land a status and ' +
            'your die REFRESHES, so you can chain another card.',
        lookFor: 'your hand → PLAY AREA, then POWER',
        done: (s) => playedACard(s) || advanced(s),
    },
    {
        id: 'tracks',
        title: 'STATUS DOES THE WORK',
        body:
            'Wear their VITAE down to nothing — it is the only bar. Status does ALL the work: ' +
            'a DoT bleeds them every turn, and STAGGER strips their telegraphed action rung by ' +
            'rung. There is no strike — lead with status, always.',
        lookFor: 'the enemy VITAE bar',
        done: (s) => pressured(s) || advanced(s),
    },
    {
        id: 'advance',
        title: 'PRESS THE ADVANTAGE',
        body:
            'Your rolled dice are the turn — spend them well; there is no reroll. When your ' +
            'cards are applied, hit ⧗ END PHASE to resolve your pressure against the threat ' +
            '(fresh dice arrive with the new turn). The fight is yours to assemble.',
        lookFor: '⧗ END PHASE',
        done: (s) => advanced(s),
    },
];

/**
 * Index of the first unmet step, or -1 when the script is complete.
 * Stateless: recomputed from the live encounter each render.
 */
export function currentCombatTutorialStep(
    state: CombatEncounterState,
    vm: CombatViewModel,
): number {
    for (let i = 0; i < COMBAT_TUTORIAL_STEPS.length; i++) {
        if (!COMBAT_TUTORIAL_STEPS[i].done(state, vm)) return i;
    }
    return -1;
}
