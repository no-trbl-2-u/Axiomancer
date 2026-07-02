/**
 * The Gleaning — guided first-run tutorial script (mobile UI layer).
 *
 * Pure data + predicates: each step names what the coach says and the
 * condition (over the live session + view-model) that advances it. The
 * coach derives the current step on every render as the FIRST step
 * whose predicate is unmet — stateless progression, so a player who
 * runs ahead of the script simply skips the steps they already proved.
 *
 * The tutorial session is pinned (seed 14, mire-mint — see
 * `GATHERING_TUTORIAL_SEED`): the verge opens with WAX SHELF (a free
 * taking), GREEN HUSH (a BREATH), and WIDOW'S MOSS; the offerings
 * include the always-payable BLOOD TITHE; the tools include the bell.
 * The copy below leans on those facts but every predicate is written
 * against behaviour, not specific plots, so it also survives a player
 * who wanders.
 */

import type { GatheringViewModel } from '@/state/presenters/gathering.engine';
import type { GatheringSessionState } from 'axiomancer-mechanics';

export interface GatheringTutorialStep {
    id: string;
    /** Coach banner headline. */
    title: string;
    /** Coach banner body — what to do and why it matters. */
    body: string;
    /** The control to look for (rendered as a "find:" hint). */
    lookFor: string;
    /** True once the player has done it (session is non-null while shown). */
    done: (session: GatheringSessionState, vm: GatheringViewModel) => boolean;
}

export const GATHERING_TUTORIAL_STEPS: GatheringTutorialStep[] = [
    {
        id: 'approach',
        title: 'THE PLACE IS WATCHING',
        body:
            'Every gleaning starts with a vow: how much will you take? ' +
            'THE TENDER HAND gleans lightly — capped yields, but the site starts in your favour. ' +
            'THE STRIPPING HAND tears deeper and pays for it. For your first time, choose the tender hand.',
        lookFor: 'THE TENDER HAND panel',
        done: (s) => s.phase !== 'approach-select',
    },
    {
        id: 'take',
        title: 'TAKE SOMETHING',
        body:
            'The spread shows what the place offers. Each plot lists its YIELD (the pips) and its PRICE — ' +
            'the wrath it adds to the eye-meter above. Tap TAKE under a plot. WAX SHELF is free; the moss costs 1.',
        lookFor: 'a TAKE button under a plot',
        done: (s) => s.satchel.length >= 1,
    },
    {
        id: 'tend',
        title: 'WRATH — AND HOW TO BREATHE IT OUT',
        body:
            'Everything you take angers the site. Cross a line on the meter and it answers; fill it and it erupts, ' +
            'clawing back your satchel. A BREATH plot (GREEN HUSH) takes nothing and EASES wrath instead. Tap TEND.',
        lookFor: 'the TEND button on GREEN HUSH',
        done: (s) => s.metrics.breathsTended >= 1,
    },
    {
        id: 'offer',
        title: 'PAY WHAT IT ASKS',
        body:
            'The site names its price for forgiveness. An offering eases wrath by 3 and earns GRACE — ' +
            'leave with grace 2 and low wrath and the place will BLESS the taking. The BLOOD TITHE costs 2 VITAE. Pay it.',
        lookFor: 'THE BLOOD TITHE under OFFERINGS',
        done: (s) => s.metrics.offeringsPaid >= 1,
    },
    {
        id: 'tool',
        title: 'SPEND A FIELD TOOL',
        body:
            'Tools are one-use favours you brought with you. The WARDEN’S BELL rings wrath down at once; ' +
            'the SEALED JAR holds your satchel safe through one rot. Tap one.',
        lookFor: 'a chip under FIELD TOOLS',
        done: (s) => s.tools.some((t) => t.used),
    },
    {
        id: 'descend',
        title: 'THE DEEP IS RICHER — AND ANGRIER',
        body:
            'Three strata, one-way down. Deeper plots yield more and cost more wrath, and what you left above ' +
            'is gone. When the verge thins, commit: tap DESCEND.',
        lookFor: 'the DESCEND button',
        done: (s) => s.depth >= 1,
    },
    {
        id: 'withdraw',
        title: 'LEAVING IS A MOVE',
        body:
            'The satchel is AT RISK until you walk out — restraint is the whole game. ' +
            'Linger past eight takings and dusk makes everything dearer. Take what you came for, then tap WITHDRAW.',
        lookFor: 'the WITHDRAW button',
        done: (s) => s.phase === 'outcome' || s.phase === 'rewards' || s.phase === 'done',
    },
];

/**
 * Index of the first unmet step, or -1 when the script is complete.
 * Stateless: recomputed from the live session each render.
 */
export function currentTutorialStep(
    session: GatheringSessionState,
    vm: GatheringViewModel,
): number {
    for (let i = 0; i < GATHERING_TUTORIAL_STEPS.length; i++) {
        if (!GATHERING_TUTORIAL_STEPS[i].done(session, vm)) return i;
    }
    return -1;
}
