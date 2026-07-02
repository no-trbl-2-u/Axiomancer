/**
 * Engine-events presenter (Phase 25).
 *
 * Reads the mobile-private `_recentEvents` ring buffer fed by the
 * `GameEventEmitter` wired in `createAppStore`. Returns a frozen tail
 * (newest-first, capped at `capacity`).
 *
 * Pure data — no React subscriptions inside the presenter; consumers
 * call this from a React hook (`useGameEvents` in
 * `state/GameStoreProvider.tsx`, Phase 25 Tick B) or from a test.
 *
 * The engine's typed event variants and matching `is*Event` guards
 * are re-exported from `axiomancer-mechanics` top-level. Consumers
 * narrow via:
 *
 * ```ts
 * import { isCombatEndedEvent } from 'axiomancer-mechanics';
 * const events = selectRecentEngineEvents(state);
 * for (const ev of events) {
 *     if (isCombatEndedEvent(ev)) {
 *         // ev.payload is EnginePayload; ev.payload.state is GameState
 *     }
 * }
 * ```
 */

import type { TypedGameEvent } from 'axiomancer-mechanics';

import type { AppStoreState } from '../store';

/**
 * Returns the most-recent typed engine events, newest-first, capped
 * at `capacity`. Empty array on a fresh store. The returned array is
 * a frozen slice — mutating it does not affect the underlying buffer.
 */
export function selectRecentEngineEvents(
    state: AppStoreState,
    capacity = 20,
): ReadonlyArray<TypedGameEvent> {
    const buffer = state._recentEvents ?? [];
    const sliced = buffer.slice(0, Math.max(0, capacity));
    return Object.freeze(sliced);
}
