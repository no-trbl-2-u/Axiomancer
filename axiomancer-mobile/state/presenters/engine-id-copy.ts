/**
 * Turning engine IDENTIFIERS into player-facing text (FE-002).
 *
 * The engine addresses quests, cards and story flags by slug — `starting-quest`,
 * `shrine_keeper_recognizes_seeker`. Several presenters interpolated those
 * slugs straight into player copy, so the walked build printed
 * `quest: starting-quest` as a dialogue consequence chip and headlined the
 * ERRANDS journal entry `starting-quest` in the same gothic face it uses for
 * authored titles.
 *
 * An id is bookkeeping. This module is the single place that decides what a
 * player is shown instead, so no screen has to invent its own answer and none
 * can leak a slug again.
 *
 * Everything here is pure: no state, no mutation, no engine reads beyond the
 * committed card library.
 */

import { getCardById } from '@mechanics';

/**
 * Player-facing titles for the quest-log ids in
 * `axiomancer-mechanics/src/World/quest.library.ts`.
 *
 * These live in the presenter, not in the engine's `Quest` object: a quest is
 * PERSISTED in the save's quest log, so adding a field to it would be a
 * persisted-state change, which this sweep is walled out of. Titles are
 * presentation, and presentation is this package's job.
 *
 * Keyed loosely (`string`) rather than by `QuestName` so an id the engine adds
 * later degrades to `humanizeEngineId` instead of failing the type-check in a
 * package that cannot fix it.
 */
const QUEST_TITLES: Readonly<Record<string, string>> = Object.freeze({
    'starting-quest': 'The King of Revenge',
    'get-to-forest': 'The Coast Road North',
    'gather-wood': 'Deadfall',
    'get-to-cave': 'The Mouth in the Hill',
    'gather-iron': 'Iron Out of the Dark',
    'get-to-northern-city': 'The City Beyond',
    'find-blacksmith': 'A Smith Who Answers',
    'build-boat': 'Keel and Plank',
    'kill-some-time': 'An Hour to Spend',
    'get-to-connecting-river': 'The Water Between',
    'find-islanders': 'Those Who Stayed',
    'join-islanders-for-ritual': 'Kneel With Them',
    'get-to-town-across-river': 'The Far Bank',
    'get-to-the-capital': 'The Capital',
});

/**
 * Last-resort rendering for an id with no authored title.
 *
 * @param id - an engine slug in kebab or snake case (`get-to-forest`,
 *   `shrine_keeper_met`).
 * @returns the slug with separators turned to spaces and each word
 *   capitalised (`Get To Forest`). Never returns the raw slug, and returns an
 *   empty string for empty input so callers can drop the row.
 *
 * This is a fallback, not a feature: an id that reaches it still reads like
 * machinery, so a new id deserves a `QUEST_TITLES` entry.
 */
export function humanizeEngineId(id: string): string {
    if (!id) return '';
    return id
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Is this string an engine slug rather than authored text?
 *
 * @param value - a candidate id or title.
 * @returns true only for all-lowercase words joined by `-` or `_`
 *   (`starting-quest`, `shrine_keeper_met`).
 *
 * The distinction matters because the same field can hold either: shipped
 * content addresses quests by slug, while fixtures and tests use readable
 * names. Humanizing an authored name would mangle it (`Tend the Hearth` ->
 * `Tend The Hearth`), so anything that is not slug-shaped is left alone.
 */
export function isEngineSlug(value: string): boolean {
    return /^[a-z0-9]+([-_][a-z0-9]+)+$/.test(value);
}

/**
 * The title to show a player for a quest-log id.
 *
 * @param id - the engine's `QuestName` slug.
 * @returns the authored title when one exists, otherwise the humanized slug,
 *   otherwise an empty string.
 *
 * Resolves FE-002 for the ERRANDS journal (`memoir.engine.ts`) and the
 * dialogue/event consequence chips (`consequence-copy.ts`).
 */
export function questTitle(id: string): string {
    if (!id) return '';
    const authored = QUEST_TITLES[id];
    if (authored) return authored;
    // Not in the map: humanize only if it is actually a slug. A fixture or a
    // future content pass may put a readable name in this field, and
    // title-casing it would damage it.
    return isEngineSlug(id) ? humanizeEngineId(id) : id;
}

/**
 * The name to show a player for a card id.
 *
 * @param id - a card library id (`thin-hymn`).
 * @returns the card's authored name from the committed library, falling back
 *   to the humanized id when the library has no such card (a content drift the
 *   player should not be shown as a slug either).
 *
 * Resolves FE-002 for the `card-learn` consequence chip.
 */
export function cardTitle(id: string): string {
    if (!id) return '';
    const card = getCardById(id);
    const name = typeof card?.name === 'string' ? card.name.trim() : '';
    if (name) return name;
    // Same rule as `questTitle`: humanize a slug, pass authored text through.
    return isEngineSlug(id) ? humanizeEngineId(id) : id;
}
