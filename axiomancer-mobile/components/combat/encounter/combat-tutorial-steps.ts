/**
 * Hazard-pattern combat — guided first-fight coach script (mobile UI layer).
 *
 * Pure data + predicates, exactly like the gathering tutorial: each step names
 * what the coach says and the condition (over the live encounter state, the
 * view-model, and a small UI context) that advances it. The coach derives the
 * current step every render as the FIRST step whose predicate is unmet —
 * stateless progression, so a player who runs ahead of the script simply skips
 * the steps they already proved.
 *
 * Every engine-backed predicate is written against a MONOTONIC signal — one
 * that latches true and never goes back to false (cumulative pressure, discard
 * count, turn/phase counters). This matters because per-turn state (rolled
 * faces, the staging area) resets on NEW TURN; if a predicate read that alone,
 * the script could snap backwards. The one UI-only signal (`ctx.stagedCount`,
 * the cards currently in the PLAY AREA) is a live value the board owns, so the
 * step that reads it ALSO latches on the monotonic backstops (`discard`,
 * `turn`, `currentPhaseIndex`) — a card that was staged and then applied has
 * left the hand and the step stays done.
 *
 * The copy teaches the spec-33 dice model (`specs/33-upgradeable-dice.md`):
 * four fixed-colour dice roll every turn, each face is SPECIAL / MANA / MISS,
 * and there is no draft — a die is spent by dragging it onto a staged card.
 *
 * These cover TURN ONE only (stage → power → read the bar → advance); the
 * script completes itself the moment the player takes a second turn or resolves
 * the phase.
 */

import type { CombatEncounterState } from '@mechanics';

import type { CombatViewModel } from '@/state/presenters/combat-encounter.engine';

/** Board-owned UI facts the engine state does not carry. */
export interface CombatTutorialContext {
    /** Cards currently in the PLAY AREA (staged, not yet applied). */
    stagedCount: number;
}

export interface CombatTutorialStep {
    id: string;
    /** Coach banner headline. */
    title: string;
    /** Coach banner body — what to do and why it matters. */
    body: string;
    /** The control to look for (rendered as a "find:" hint). */
    lookFor: string;
    /** True once the player has done it (latches true via the monotonic backstops). */
    done: (state: CombatEncounterState, vm: CombatViewModel, ctx: CombatTutorialContext) => boolean;
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
        id: 'stage',
        title: 'STAGE A CARD',
        body:
            'Drag a card from your hand up into the PLAY AREA. Nothing resolves yet — staging ' +
            'is how you tell the fight which card you mean to play. Tap a card first to read ' +
            'its keywords and full effect.',
        lookFor: 'your hand → the PLAY AREA',
        done: (s, _vm, ctx) => ctx.stagedCount >= 1 || playedACard(s) || advanced(s),
    },
    {
        id: 'power',
        title: 'POWER IT WITH A DIE',
        body:
            'You rolled four dice: Red (BODY), Blue (MIND), Purple (HEART) and Gold (WILD). ' +
            'Drag a die that matches the card’s colour — Gold matches anything — onto the ' +
            'staged card, then press APPLY. A SPECIAL face also grants 2◆ Conviction; a MISS face ' +
            'powers nothing. No usable die? APPLY with none for the card’s FREE line — real, ' +
            'but weaker.',
        lookFor: 'the dice tray → the staged card, then APPLY',
        done: (s) => playedACard(s) || advanced(s),
    },
    {
        id: 'tracks',
        title: 'ONE BAR, MANY BLADES',
        body:
            'Wear their VITAE down to nothing — it is the only bar. A strike takes it straight ' +
            'off the top; a DoT bleeds them every turn; STAGGER strips their telegraphed action ' +
            'rung by rung. Strikes, statuses, Conviction, MOMENTUM and your dice all compete on merit.',
        lookFor: 'the enemy VITAE bar',
        done: (s) => pressured(s) || advanced(s),
    },
    {
        id: 'advance',
        title: 'PRESS THE ADVANTAGE',
        body:
            'Every usable die can power a card, so stage and apply as many as your roll allows. ' +
            'Your STANCE is the colour of the last PAID card you played. When your cards are ' +
            'applied, hit ⧗ END PHASE to resolve your pressure against the threat — four fresh ' +
            'dice arrive with the new turn.',
        lookFor: '⧗ END PHASE',
        done: (s) => advanced(s),
    },
];

/** Context used when the caller has no board to read (e.g. the panel's
 *  completion check). `stagedCount: 0` is the conservative value: it can only
 *  delay the `stage` step, never mark it done, and it cannot change the `-1`
 *  completion result, which the final step gates on `advanced` alone. */
const NO_CONTEXT: CombatTutorialContext = { stagedCount: 0 };

/**
 * Index of the first unmet step, or -1 when the script is complete.
 * Stateless: recomputed from the live encounter each render.
 */
export function currentCombatTutorialStep(
    state: CombatEncounterState,
    vm: CombatViewModel,
    ctx: CombatTutorialContext = NO_CONTEXT,
): number {
    for (let i = 0; i < COMBAT_TUTORIAL_STEPS.length; i++) {
        if (!COMBAT_TUTORIAL_STEPS[i].done(state, vm, ctx)) return i;
    }
    return -1;
}
