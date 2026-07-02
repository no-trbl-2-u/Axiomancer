/**
 * Type guards for narrowing `GameEvent` by topic. Sugar over
 * `event.type === '...'` that lets consumers use Array.filter /
 * Array.find with proper type narrowing.
 *
 * Pre-Phase-21 also shipped seven `create*Event` factories; they were
 * removed because the engine emits events directly via the store's
 * dispatch path (`eventForAction` in `src/Game/store.ts`) and
 * consumer-side fabrication has no use case.
 */

import type { GameEvent } from './events';
import type {
    TypedCombatStartedEvent, TypedCombatEndedEvent,
    TypedWorldMovedEvent, TypedWorldProcessedEvent,
    TypedLevelUpEvent, TypedInventoryChangedEvent,
    TypedDialogueAppliedEvent, TypedGameSavedEvent, TypedGameLoadedEvent,
} from './events.types';

export function isCombatStartedEvent(e: GameEvent): e is TypedCombatStartedEvent {
    return e.type === 'combat:started';
}
export function isCombatEndedEvent(e: GameEvent): e is TypedCombatEndedEvent {
    return e.type === 'combat:ended';
}
export function isWorldMovedEvent(e: GameEvent): e is TypedWorldMovedEvent {
    return e.type === 'world:moved';
}
export function isWorldProcessedEvent(e: GameEvent): e is TypedWorldProcessedEvent {
    return e.type === 'world:processed';
}
export function isLevelUpEvent(e: GameEvent): e is TypedLevelUpEvent {
    return e.type === 'character:levelup';
}
export function isInventoryChangedEvent(e: GameEvent): e is TypedInventoryChangedEvent {
    return e.type === 'inventory:changed';
}
export function isDialogueAppliedEvent(e: GameEvent): e is TypedDialogueAppliedEvent {
    return e.type === 'dialogue:applied';
}
export function isGameSavedEvent(e: GameEvent): e is TypedGameSavedEvent {
    return e.type === 'game:saved';
}
export function isGameLoadedEvent(e: GameEvent): e is TypedGameLoadedEvent {
    return e.type === 'game:loaded';
}
