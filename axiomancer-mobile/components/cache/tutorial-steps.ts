/**
 * The Reliquary — guided first-delve tutorial script (mobile UI layer).
 *
 * Pure data + predicates: each step names what the coach says and the
 * condition (over the live session) that advances it. The coach derives
 * the current step on every render as the FIRST step whose predicate is
 * unmet — stateless progression, so a player who runs ahead of the
 * script simply skips the steps they already proved.
 *
 * The tutorial session is pinned (seed 1 — see `CACHE_TUTORIAL_SEED`):
 * THE LID's first pick pool rolls `[6, 1, 2]` — one slip, eight progress,
 * cracking the layer clean on the very first push (difficulty 5) without
 * ever brushing the jam threshold (2 slips). Predicates are written
 * against `phase` / `pick` / `depth` only — never the exact roll or how
 * many layers get opened — so a player who keeps delving past THE LID,
 * or who jams a later layer, still completes the script.
 */

import type { LootCacheSession } from '@mechanics';
import type { CacheVM } from '@/state/presenters/cache.engine';

export interface CacheTutorialStep {
    id: string;
    /** Coach banner headline. */
    title: string;
    /** Coach banner body — what to do and why it matters. */
    body: string;
    /** The control to look for (rendered as a "find:" hint). */
    lookFor: string;
    /** True once the player has done it. */
    done: (session: LootCacheSession, vm: CacheVM) => boolean;
}

export const CACHE_TUTORIAL_STEPS: CacheTutorialStep[] = [
    {
        id: 'begin',
        title: 'A CACHE, LONG UNCLAIMED',
        body:
            'Three locks, each honest about its difficulty — no hidden traps, no surprises about what stands ' +
            'between you and the take. Kneel down and start picking.',
        lookFor: 'KNEEL AND BEGIN',
        done: (s) => s.phase !== 'intro',
    },
    {
        id: 'delve',
        title: 'PICK A LOCK',
        body:
            'THE LID is shallowest and least locked. Tap DELVE DEEPER to open a live pick attempt on it — the ' +
            'lock stays open until it cracks, jams, or outlasts the pick.',
        lookFor: 'the DELVE DEEPER button',
        done: (s) => s.pick !== null || s.depth > 0,
    },
    {
        id: 'push',
        title: 'PUSH YOUR LUCK',
        body:
            'Tap the dice, or PUSH, to roll the pick pool: every die but a bare 1 adds progress toward the ' +
            'difficulty. Roll too many 1s in one push and the pick jams — bites vitae and spoils this layer, ' +
            'nothing else.',
        lookFor: 'the dice tray, or the PUSH button',
        done: (s) => (s.pick !== null && s.pick.lastRoll !== null) || s.depth > 0,
    },
    {
        id: 'card',
        title: 'READ WHAT HAPPENED',
        body: 'A card shows what the lock gave up, or took. Tap through to keep going.',
        lookFor: 'GO ON (or NURSE THE HAND)',
        done: (s) => s.phase === 'delving' || s.phase === 'outcome' || s.phase === 'done',
    },
    {
        id: 'outcome',
        title: 'LEAVING IS A MOVE',
        body:
            "Every layer down is deeper and slower to crack. Whenever the take is worth banking rather than " +
            "risking, tap TAKE WHAT'S LIFTED AND GO — then POCKET IT ALL to close the ledger.",
        lookFor: "TAKE WHAT'S LIFTED AND GO, then POCKET IT ALL",
        done: (s) => s.phase === 'outcome' || s.phase === 'done',
    },
];

/**
 * Index of the first unmet step, or -1 when the script is complete.
 * Stateless: recomputed from the live session each render.
 */
export function currentTutorialStep(session: LootCacheSession, vm: CacheVM): number {
    for (let i = 0; i < CACHE_TUTORIAL_STEPS.length; i++) {
        if (!CACHE_TUTORIAL_STEPS[i].done(session, vm)) return i;
    }
    return -1;
}
