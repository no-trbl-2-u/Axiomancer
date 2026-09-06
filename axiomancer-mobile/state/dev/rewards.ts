/**
 * Dev-only REWARD helpers.
 *
 * The game pays the player through several channels — combat aftermath
 * (xp / shillings / loot / card draft / journal unlock), the Reliquary
 * loot-cache tiers, hazard payloads, the Anvil, and the night watch.
 * This module gathers the catalogues and one-shot grants the `/dev`
 * REWARDS row needs so every channel can be seen on demand.
 *
 * Functions:
 *   CACHE_TIERS                    the two Reliquary tiers
 *   listHazards()                  every authored hazard (id + title)
 *   listJournalEntries()           every codex entry a foe can unlock
 *   unlockAllJournal(store)        grant every entry; returns count added
 *   grantXp(store, amount)         add experience (no level-up dispatch)
 *   forceLevelUp(store)            cross the threshold + dispatch LEVEL_UP
 *   learnAllCards(store)           know every library card (deck-builder test)
 */

import { EnemyLibrary, HAZARD_LIBRARY, cardLibrary } from '@mechanics';
import type { CacheLootTier, CodexEntry, GameState } from '@mechanics';

import type { AppStore } from '@/state/store';

/** Reliquary tiers with their chip label. */
export const CACHE_TIERS: readonly { tier: CacheLootTier; label: string }[] = Object.freeze([
    { tier: 'modest', label: 'MODEST' },
    { tier: 'rich', label: 'RICH' },
]);

/** Every authored hazard, library order. */
export function listHazards(): readonly { id: string; title: string }[] {
    return HAZARD_LIBRARY.map((h) => ({ id: h.id, title: h.title }));
}

/** Every codex entry authored on a foe (`Enemy.journalEntry`), de-duped by id. */
export function listJournalEntries(): readonly CodexEntry[] {
    const seen = new Set<string>();
    return EnemyLibrary.flatMap((e) => {
        const entry = e.journalEntry;
        if (!entry || seen.has(entry.id)) return [];
        seen.add(entry.id);
        return [entry];
    });
}

/** Unlock every journal entry through the engine dispatch. Returns how many were new. */
export function unlockAllJournal(store: AppStore): number {
    const before = new Set((store.getState() as unknown as GameState).codex?.unlockedEntries ?? []);
    const fresh = listJournalEntries().filter((e) => !before.has(e.id));
    fresh.forEach((e) => store.getState().unlockCodexEntry(e.id));
    return fresh.length;
}

/** Add `amount` experience without triggering a level-up. */
export function grantXp(store: AppStore, amount: number): number {
    const player = store.getState().player;
    const experience = (player.experience ?? 0) + amount;
    store.setState({ player: { ...player, experience } });
    return experience;
}

/**
 * Force one level: seed experience to the threshold, then dispatch the
 * engine's LEVEL_UP (which loops stacked level-ups and emits the event
 * that re-arms the SELF-tab badge). Returns the new level.
 */
export function forceLevelUp(store: AppStore): number {
    const player = store.getState().player;
    store.setState({ player: { ...player, experience: player.experienceToNextLevel ?? 100 } });
    store.getState().levelUp();
    return store.getState().player.level;
}

/** Know every card in the library. Returns the number newly learned. */
export function learnAllCards(store: AppStore): number {
    const player = store.getState().player;
    const known = new Set(player.knownCards ?? []);
    const fresh = cardLibrary.map((c) => c.id).filter((id) => !known.has(id));
    if (fresh.length === 0) return 0;
    store.setState({ player: { ...player, knownCards: [...known, ...fresh] } });
    return fresh.length;
}
