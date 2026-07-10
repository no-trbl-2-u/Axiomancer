/**
 * The Quest Board minigame — guided first-session tutorial script (mobile
 * UI layer).
 *
 * Pure data + predicates: each step names what the coach says and the
 * condition (over the live session) that advances it. The coach derives
 * the current step on every render as the FIRST step whose predicate is
 * unmet — stateless progression, so a player who runs ahead of the script
 * simply skips the steps they already proved.
 *
 * Unlike Rest/Gathering/Cache, this script covers only the OPENING LOOP —
 * one cast of the bone, resolving whatever it lands on, and the loop
 * coming back around — not the full multi-day quest (a naive auto-policy
 * probe on the pinned seed takes 21 rolls / 4 days to reach `outcome`; see
 * `plan/phases/phase_17_quest_board_tutorial.md` §0 for the full
 * reasoning). Two steps, not the usual four to six: the coach can only
 * ever render during `idle` (see `QuestTutorialCoach`'s phase guard —
 * `intro`/`space`/`dusk`/`outcome` are each a full-screen scrim), and
 * `phase` cycles `idle ⇄ space` every loop rather than passing through
 * once like Hazard's `playing` — so a predicate gated on "left the space
 * phase" is not monotonic here the way it is there (a later loop reopens
 * a new space and would un-flip it). Only `metrics.rolls`, which never
 * decreases, is safe to key steps on. The 'roll' step's body therefore
 * previews the whole loop (roll → read → WALK ON) up front, since there
 * is no safe render slot to narrate the middle of it.
 *
 * The tutorial session is pinned (seed 3, board `build-the-boat` — see
 * `QUEST_TUTORIAL_SEED`): the opening roll lands on DRIFTWOOD COVE (a
 * GATHER space) and a press-then-stop line banks a clean +2 HULL PLANKS,
 * landing back at `idle` after exactly one loop. Predicates are written
 * against `metrics.rolls` / `phase` only — never the specific roll or
 * landed space — so a player who overrides the seed, or rolls ahead of
 * the coach, still completes the script.
 */

import type { QuestBoardSession } from '@mechanics';
import type { QuestBoardVM } from '@/state/presenters/quest.engine';

export interface QuestTutorialStep {
    id: string;
    /** Coach banner headline. */
    title: string;
    /** Coach banner body — what to do and why it matters. */
    body: string;
    /** The control to look for (rendered as a "find:" hint). */
    lookFor: string;
    /** True once the player has done it. */
    done: (session: QuestBoardSession, vm: QuestBoardVM) => boolean;
}

export const QUEST_TUTORIAL_STEPS: QuestTutorialStep[] = [
    {
        id: 'roll',
        title: 'CAST THE BONE',
        body:
            'Tap the bone die at the board’s heart. It moves your piece and opens ' +
            'whatever it lands on — every space plays its own small game. Read the ' +
            'card, make your choice, then WALK ON to close it out.',
        lookFor: 'the CAST THE BONE button, center of the board',
        done: (s) => s.metrics.rolls >= 1,
    },
    {
        id: 'again',
        title: 'THE LOOP CONTINUES',
        body:
            'Watch your VOWS and the hull ledger fill as you go — the board keeps ' +
            'turning until the boat’s built. Cast the bone again whenever you’re ready.',
        lookFor: 'the VOWS strip, and CAST THE BONE once more',
        // OR-across-terminal-phases, same shape as every prior tutorial's
        // final step: a player who ends day 1 or completes the board
        // outright on their next roll still completes the script.
        done: (s) =>
            s.metrics.rolls >= 2 ||
            s.phase === 'dusk' ||
            s.phase === 'outcome' ||
            s.phase === 'done',
    },
];

/**
 * Index of the first unmet step, or -1 when the script is complete.
 * Stateless: recomputed from the live session each render.
 */
export function currentTutorialStep(
    session: QuestBoardSession,
    vm: QuestBoardVM,
): number {
    for (let i = 0; i < QUEST_TUTORIAL_STEPS.length; i++) {
        if (!QUEST_TUTORIAL_STEPS[i].done(session, vm)) return i;
    }
    return -1;
}
