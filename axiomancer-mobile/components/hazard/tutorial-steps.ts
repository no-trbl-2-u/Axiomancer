/**
 * The Hazard minigame — guided first-crossing tutorial script (mobile UI
 * layer).
 *
 * Pure data + predicates: each step names what the coach says and the
 * condition (over the live session + view-model) that advances it. The
 * coach derives the current step on every render as the FIRST step
 * whose predicate is unmet — stateless progression, so a player who
 * runs ahead of the script simply skips the steps they already proved.
 *
 * The tutorial session is pinned (seed 3, hazard `cracked-cliff` — see
 * `HAZARD_TUTORIAL_SEED` / `HAZARD_TUTORIAL_ID`): the opening hand is
 * `ironwill`, `footing` ×2, `refrain`, `spite`, and the dice roll is
 * `purple, red, purple, red` — zero blocked (`hex`) dice, and every hand
 * card's colour has a matching die. Predicates are written against
 * `route` / `play` / `dice` / `round` only — never the specific
 * route/card/die the player picks — so a player who ignores the
 * recommended route (or powers a different card first) still completes
 * the script.
 */

import type { HazardSessionState } from '@mechanics';
import type { HazardViewModel } from '@/state/presenters/hazard.engine';

export interface HazardTutorialStep {
    id: string;
    /** Coach banner headline. */
    title: string;
    /** Coach banner body — what to do and why it matters. */
    body: string;
    /** The control to look for (rendered as a "find:" hint). */
    lookFor: string;
    /** True once the player has done it. */
    done: (session: HazardSessionState, vm: HazardViewModel) => boolean;
}

export const HAZARD_TUTORIAL_STEPS: HazardTutorialStep[] = [
    {
        id: 'route',
        title: 'NO RETREAT',
        body:
            'A hazard offers two ways through. LEDGE CRAWL is one combined meter — forgiving, any progress ' +
            'counts. THE LEAP asks for two meters every round, but pays out more. For your first crossing, ' +
            'take the ledge.',
        lookFor: 'the LEDGE CRAWL panel',
        done: (s) => s.route !== null,
    },
    {
        id: 'stage',
        title: 'COMMIT A CARD',
        body:
            'Drag a card from your hand into the play area. It stages there — its FREE numbers (the top values) ' +
            'apply the instant it lands, before you spend anything on it.',
        lookFor: 'a card, dragged from hand into the play area',
        done: (s) => s.play.length >= 1 || s.round > 1,
    },
    {
        id: 'power',
        title: 'SPEND A DIE',
        body:
            'Drag a die onto a staged card whose colour matches (or spend the wild gold die on anything) to ' +
            'power it — its MANA numbers, always bigger than the free ones, replace them.',
        lookFor: 'a die, dragged onto a staged card',
        done: (s) => s.dice.some((d) => d.state === 'spent') || s.round > 1,
    },
    {
        id: 'apply',
        title: 'LOCK IT IN',
        body:
            'Tap APPLY on a staged card to commit it: its numbers count toward the meters and any utility fires. ' +
            'An applied card cannot be re-powered, unstaged, or discarded — choose your dice first.',
        lookFor: 'the APPLY button on a staged card',
        done: (s) => s.play.some((e) => e.applied === true) || s.round > 1,
    },
    {
        id: 'resolve',
        title: 'COMMIT THE ROUND',
        body:
            'Every staged card has to be applied before PLAY unlocks. Tap it to resolve the round against the ' +
            'threshold — win or lose, the round is over the moment you do.',
        lookFor: 'the PLAY button',
        done: (s) =>
            s.round > 1 ||
            s.phase === 'resolve-flash' ||
            s.phase === 'outcome' ||
            s.phase === 'rewards' ||
            s.phase === 'done',
    },
    {
        id: 'outcome',
        title: 'READ THE LEDGER',
        body:
            'The crossing settles into a tier: rewards, and sometimes a cost. Claim what it leaves you to walk ' +
            'away.',
        lookFor: 'CLAIM on the rewards screen',
        // 'rewards' (not just 'done'): claiming clears the session in the
        // same store update, so a predicate gated on 'done' alone would
        // never observe a truthy read — the coach (and its auto-complete)
        // only ever sees the session while it is still live.
        done: (s) => s.phase === 'rewards' || s.phase === 'done',
    },
];

/**
 * Index of the first unmet step, or -1 when the script is complete.
 * Stateless: recomputed from the live session each render.
 */
export function currentTutorialStep(
    session: HazardSessionState,
    vm: HazardViewModel,
): number {
    for (let i = 0; i < HAZARD_TUTORIAL_STEPS.length; i++) {
        if (!HAZARD_TUTORIAL_STEPS[i].done(session, vm)) return i;
    }
    return -1;
}
