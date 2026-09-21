/**
 * Navigation presenter for app shell routing and tab badges.
 *
 * Implements cold-start routing logic, tab badge state, and active
 * tab resolution based on game state. Used by `app/index.tsx` and
 * `app/(tabs)/_layout.tsx`.
 */

import { selectIsInCombat, type GameStore } from '@mechanics';

import type { AppStoreState } from '../store';
import { selectHasActiveEvent } from './event.engine';
import { selectHasActiveBlacksmith } from './blacksmith.engine';
import { selectHasActiveCache } from './cache.engine';
import { selectHasActiveHazard } from './hazard.engine';
import { selectHasActiveRest } from './rest.engine';
import { freezeViewModel } from './freeze';

export type TabRoute = 'exploration' | 'character' | 'memoir' | 'inventory' | 'deck';
export type ActiveRoute = TabRoute | 'combat-encounter';

export interface TabBadge {
    /** Badge text (e.g., '!', '↑'). */
    text: string;
    /** Badge type for styling. */
    kind: 'event' | 'levelup';
}

export interface NavigationViewModel {
    /** Active route for cold-start. */
    activeTab: ActiveRoute;
    /** Tab badges by route key. */
    badges: Record<TabRoute, TabBadge | null>;
}

/**
 * Determines which tab should be active on cold start based on game
 * state.
 *
 * Priority:
 * 1. Combat if in combat
 * 2. Exploration otherwise
 *
 * Events fire as a full-screen modal (see `app/event/index.tsx` +
 * `selectHasActiveEvent`), not a tab, so they do not participate in
 * tab selection.
 */
export function selectActiveTab(state: GameStore): ActiveRoute {
    // Legacy turn-based combat was removed from the engine (mechanics
    // 0.37.0). The engine now signals an active encounter via
    // `currentEncounter` (`selectIsInCombat`); live hazard combat runs
    // in the panel's local state, so this routes cold-start combat to the
    // standalone hazard-pattern combat encounter screen, not the retired
    // `/combat` route.
    if (selectIsInCombat(state)) {
        return 'combat-encounter';
    }
    return 'exploration';
}

/**
 * Stable reference for the all-null badge state. Returning a fresh
 * object literal from a zustand selector triggers an infinite render
 * loop because `useStore` compares results by identity. The
 * steady-state path always returns this same frozen instance.
 */
const EMPTY_BADGES: Record<TabRoute, TabBadge | null> = Object.freeze({
    exploration: null,
    character: null,
    memoir: null,
    inventory: null,
    // DECK (2026-09-21) carries no badge. A badge is a call to ACT, and the
    // deck screen is a reference surface — nothing on it is pending. The
    // obvious candidate ("you drafted a new card") already announces itself
    // in the rewards overlay the player just dismissed; repeating it here
    // would be the third telling of one event.
    deck: null,
}) as Record<TabRoute, TabBadge | null>;

const EVENT_BADGE: TabBadge = Object.freeze({ text: '!', kind: 'event' });
const LEVELUP_BADGE: TabBadge = Object.freeze({ text: '↑', kind: 'levelup' });

/**
 * Tab badges for actionable states. Both badges park on the
 * `character` tab — the level-up badge logically belongs there (stat
 * upgrades live on the character screen), and the event badge sits
 * alongside until a navigation-pass phase splits them.
 *
 * When both predicates fire simultaneously, level-up wins — it's the
 * higher-agency action (stat-allocation prompt) versus a narrative
 * hint.
 *
 * Phase 29 Tick A: the levelup badge also requires
 * `notifications.levelUpAcknowledged === false` — i.e. a fresh
 * `character:levelup` engine event must have fired since the player
 * last visited the character screen. Avoids nagging after the player
 * has already seen the badge once.
 *
 * Phase 46c: the `memoir` tab gets its own badge, independent of the
 * character-tab pair above — a quest can be pending with no active
 * event and no level-up ready. Gates on
 * `notifications.questAcknowledged === false`, set by the engine
 * `dialogue:applied` handler in `state/store.ts` when the applied
 * choice granted a quest; Memoir-screen mount clears it. Reuses
 * `EVENT_BADGE`'s shape rather than adding a third `TabBadge` kind.
 */
export function selectTabBadges(state: AppStoreState): Record<TabRoute, TabBadge | null> {
    const hasEvent = selectHasActiveEvent(state);
    const player = state.player;
    const experience = Number(player?.experience ?? 0);
    const toNext = Number(player?.experienceToNextLevel ?? 0);
    const xpReady = toNext > 0 && experience >= toNext;
    const levelUpAcknowledged = state.notifications?.levelUpAcknowledged ?? true;
    const levelupReady = xpReady && !levelUpAcknowledged;
    const questAcknowledged = state.notifications?.questAcknowledged ?? true;
    const questPending = !questAcknowledged;

    if (!hasEvent && !levelupReady && !questPending) {
        return EMPTY_BADGES;
    }

    return {
        exploration: null,
        character: levelupReady ? LEVELUP_BADGE : hasEvent ? EVENT_BADGE : null,
        memoir: questPending ? EVENT_BADGE : null,
        inventory: null,
        deck: null,
    };
}

/**
 * Combined navigation view model for app shell.
 */
export function selectNavigationViewModel(state: AppStoreState): NavigationViewModel {
    const vm: NavigationViewModel = {
        activeTab: selectActiveTab(state),
        badges: selectTabBadges(state),
    };

    return freezeViewModel(vm);
}


/**
 * True when ANY full-screen session already owns the app — a paced event or
 * any of the minigames.
 *
 * Each gate (`<EventGate>`, `<HazardGate>`, `<CacheGate>`, …) watches its own
 * slice and pushes its own route, and those slices are genuinely separate:
 * `beginLootCacheChoice` fills the CACHE slice and never touches `state.event`. So
 * "is something already happening?" cannot be answered by looking at the
 * event slice alone, and anything that assumes otherwise will fire into
 * another gate's flow.
 *
 * Added 2026-08-08 after exactly that: the exploration screen's arrival-
 * cutscene beat checked only `selectHasActiveEvent`, so the dev treasure
 * trigger — which navigates to the map and then opens the CACHE slice —
 * arrived to find an "empty" event slice, and the cutscene stole its route to
 * /cache. Composed from the gates' own selectors rather than re-reading the
 * slices, so a new gate is one import here and cannot be forgotten twice.
 */
export function selectHasAnyActiveSession(state: AppStoreState): boolean {
    return (
        selectHasActiveEvent(state)
        || selectHasActiveHazard(state)
        || selectHasActiveCache(state)
        || selectHasActiveRest(state)
        || selectHasActiveBlacksmith(state)
    );
}
