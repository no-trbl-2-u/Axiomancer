/**
 * Shared copy for `EventConsequence` chips (Phase 46c).
 *
 * Ported out of `app/event/index.tsx` (the dead fallback shell) so
 * `/dialogue` can render the same preview without a component owning
 * player-facing copy (CLAUDE.md: no hardcoded copy in components) or
 * the two screens drifting on what a consequence kind means.
 *
 * FE-002 (2026-09-12 fresh-eyes sweep): the quest / progress / card branches
 * interpolated the engine's slug straight into the chip, so a player choosing
 * Old Marrow's reply was shown `quest: starting-quest`. Ids now resolve through
 * `engine-id-copy`, and a consequence with nothing a player can act on renders
 * no chip at all rather than an empty box.
 */

import type { EventConsequence } from './event.engine';
import { cardTitle, questTitle } from './engine-id-copy';

export function consequenceLabel(c: EventConsequence): string {
    // VITAE is the canon word for the player's health pool (CLAUDE.md); these
    // two branches said "HP" before FE-002.
    if (c.kind === 'damage') return `-${c.amount ?? 0} VITAE`;
    if (c.kind === 'heal') return `+${c.amount ?? 0} VITAE`;
    if (c.kind === 'currency') return `+${c.amount ?? 0} ${c.amount === 1 ? 'shilling' : 'shillings'}`;
    if (c.kind === 'moral') {
        const delta = c.amount ?? 0;
        return `${delta > 0 ? '+' : ''}${delta} grace`;
    }
    if (c.kind === 'item') return c.label ?? 'item';
    // A story flag is internal bookkeeping — it has no player-facing meaning
    // and its id (`shrine_keeper_recognizes_seeker`) is not copy. No chip.
    if (c.kind === 'flag') return '';
    // ERRANDS is the journal's word for quests; match it so the chip and the
    // screen the quest lands on agree.
    if (c.kind === 'quest-start') {
        const title = questTitle(c.label ?? '');
        return title ? `new errand · ${title}` : 'a new errand';
    }
    if (c.kind === 'quest-progress') {
        const title = questTitle(c.label ?? '');
        return title ? `errand · ${title}` : 'an errand advances';
    }
    if (c.kind === 'card-learn') {
        const title = cardTitle(c.label ?? '');
        return title ? `new card · ${title}` : 'a new card';
    }
    return '';
}

/**
 * The consequences worth drawing a chip for.
 *
 * @param consequences - a choice's full consequence list from `event.engine`.
 * @returns the subset whose `consequenceLabel` is non-empty.
 *
 * Both chip rows slice to three and print an `+N more` overflow count. Filtering
 * BEFORE that slice is what keeps a flag-only consequence from spending one of
 * the three visible slots on an empty box, and keeps the overflow count honest.
 *
 * Pure; the input array is never mutated.
 *
 * Resolves FE-002 (dialogue + event: empty and slug-bearing consequence chips).
 */
export function visibleConsequences(
    consequences: readonly EventConsequence[],
): readonly EventConsequence[] {
    return consequences.filter((c) => consequenceLabel(c) !== '');
}
