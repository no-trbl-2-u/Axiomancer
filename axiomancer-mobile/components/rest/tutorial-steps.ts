/**
 * The Night Watch — guided first-run tutorial script (mobile UI layer).
 *
 * Pure data + predicates: each step names what the coach says and the
 * condition (over the live session + view-model) that advances it. The
 * coach derives the current step on every render as the FIRST step
 * whose predicate is unmet — stateless progression, so a player who
 * runs ahead of the script simply skips the steps they already proved.
 *
 * The tutorial session is pinned (seed 41 — see `REST_TUTORIAL_SEED`):
 * the night deals `watchPlan = ['embers', 'dream', 'stir']` and
 * `dreamQueue[1] = 'dream-gates'` surfaces on watch 2. Predicates are
 * written against `watch` / `phase` only — never the watch *kind* —
 * so a player who ignores the recommended posture still completes the
 * script; the pinned plan guarantees that ordering regardless of which
 * posture they pick.
 */

import type { RestSession } from '@mechanics';
import type { RestVM } from '@/state/presenters/rest.engine';

export interface RestTutorialStep {
    id: string;
    /** Coach banner headline. */
    title: string;
    /** Coach banner body — what to do and why it matters. */
    body: string;
    /** The control to look for (rendered as a "find:" hint). */
    lookFor: string;
    /** True once the player has done it (session is non-null while shown). */
    done: (session: RestSession, vm: RestVM) => boolean;
}

export const REST_TUTORIAL_STEPS: RestTutorialStep[] = [
    {
        id: 'posture',
        title: 'HOW MUCH TO TRUST THE DARK',
        body:
            'Every night starts with the same decision: how deep to sleep. DEEP heals the most but leaves you ' +
            'unwatched. KEEP WATCH heals the least — but nothing reaches you, and watchful eyes find things. ' +
            'For your first night, keep watch.',
        lookFor: 'the KEEP WATCH panel',
        done: (s) => s.phase !== 'posture',
    },
    {
        id: 'embers',
        title: 'THE FIRE ASKS',
        body:
            'A dying fire is a choice every watch: feed it and spend firewood for warmth, or spare the wood ' +
            'and let the circle of light shrink. Neither is wrong — but a cold fire never cleanses what ails you.',
        lookFor: 'FEED THE FIRE or SPARE THE WOOD',
        done: (s) => s.watch > 1,
    },
    {
        id: 'dream',
        title: 'A DREAM OF GATES',
        body:
            'Some watches bring a dream instead. HOLD it and carry it into morning as a keepsake, or LET IT ' +
            'FADE and take its comfort — a small heal bonus — instead. Neither costs you the night\'s rest.',
        lookFor: 'HOLD THE DREAM or LET IT FADE',
        done: (s) => s.watch > 2,
    },
    {
        id: 'stir',
        title: 'SOMETHING MOVES PAST THE LIGHT',
        body:
            'A stir resolves on its own — the posture you chose at dusk already decided it. Keeping watch means ' +
            'nothing gets past you; sleeping deeper trades that safety for a richer heal.',
        lookFor: 'the watch card resolve itself',
        done: (s) => s.phase === 'outcome' || s.phase === 'done',
    },
    {
        id: 'dawn',
        title: 'DAWN',
        body:
            'The night is measured out: how much VITAE returns, whether the fire held enough to cleanse ' +
            'lingering ailments, and any keepsakes carried out of the dark. Confirm the ledger to break camp.',
        lookFor: 'the BREAK CAMP button',
        done: (s) => s.phase === 'done',
    },
];

/**
 * Index of the first unmet step, or -1 when the script is complete.
 * Stateless: recomputed from the live session each render.
 */
export function currentTutorialStep(
    session: RestSession,
    vm: RestVM,
): number {
    for (let i = 0; i < REST_TUTORIAL_STEPS.length; i++) {
        if (!REST_TUTORIAL_STEPS[i].done(session, vm)) return i;
    }
    return -1;
}
