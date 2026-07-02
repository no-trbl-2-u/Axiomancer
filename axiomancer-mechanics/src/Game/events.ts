/**
 * GameEvent surface (Spec 09 Q6).
 *
 * `createEventEmitter()` returns a tiny topic-based pub/sub the store uses
 * after every reducer pass. Consumers (CLI, RN UI, transcript recorders)
 * subscribe to one or more event types and react. The emitter is passed
 * into `createGameStore` as an optional argument — it lives outside
 * `GameState` because handlers and subscription state must not be saved.
 */

export type GameEventType =
    | 'combat:started'
    | 'combat:ended'
    | 'world:moved'
    | 'world:processed'
    | 'character:levelup'
    | 'inventory:changed'
    | 'dialogue:applied'
    | 'game:saved'
    | 'game:loaded';

/**
 * A single emitted event. `payload` is intentionally untyped at this layer —
 * each emitter call site knows what to ship, and consumers can narrow with
 * the discriminating `type` field.
 */
export interface GameEvent {
    type: GameEventType;
    payload: unknown;
}

/** Subscription handle. Returns an unsubscribe function. */
export type GameEventHandler = (event: GameEvent) => void;

export interface GameEventEmitter {
    /** Subscribe to a single event type. Returns an unsubscribe function. */
    on(type: GameEventType, handler: GameEventHandler): () => void;
    /** Subscribe to every event. Returns an unsubscribe function. */
    onAny(handler: GameEventHandler): () => void;
    /** Emit an event to all matching subscribers. */
    emit(event: GameEvent): void;
}

/** Construct a fresh in-memory event emitter. */
export function createEventEmitter(): GameEventEmitter {
    const byType = new Map<GameEventType, Set<GameEventHandler>>();
    const anyHandlers = new Set<GameEventHandler>();

    return {
        on(type, handler) {
            let set = byType.get(type);
            if (!set) {
                set = new Set();
                byType.set(type, set);
            }
            set.add(handler);
            return () => { set!.delete(handler); };
        },

        onAny(handler) {
            anyHandlers.add(handler);
            return () => { anyHandlers.delete(handler); };
        },

        emit(event) {
            const handlers = byType.get(event.type);
            if (handlers) for (const h of handlers) h(event);
            for (const h of anyHandlers) h(event);
        },
    };
}
