import { describe, it, expect, beforeEach } from 'vitest';
import { createGameStore } from '../store';
import { nullAdapter } from '../persistence/null.adapter';
import { createEventEmitter } from '../events';
import type { GameEvent } from '../events';
import { Disatree_01, TidepoolCrab } from '../../Enemy/enemy.library';
import {
    isCombatStartedEvent,
    isCombatEndedEvent,
} from '../events.utils';

describe('Events engine', () => {
    let events: ReturnType<typeof createEventEmitter>;
    let capturedEvents: GameEvent[];

    beforeEach(() => {
        events = createEventEmitter();
        capturedEvents = [];
        
        // Capture all events for testing
        events.onAny((event) => {
            capturedEvents.push(event);
        });
    });

    it('emits combat events in correct sequence', () => {
        const store = createGameStore(nullAdapter, undefined, events);

        // Start combat
        store.getState().startCombat(Disatree_01);

        // Should emit combat:started event
        expect(capturedEvents).toHaveLength(1);
        expect(capturedEvents[0]!.type).toBe('combat:started');
        expect(isCombatStartedEvent(capturedEvents[0]!)).toBe(true);

        capturedEvents.length = 0; // Clear events

        // End combat
        store.getState().endCombat('victory');

        // Should emit combat:ended event
        expect(capturedEvents.length).toBeGreaterThan(0);
        const endEvent = capturedEvents.find(e => e.type === 'combat:ended');
        expect(endEvent).toBeDefined();
        expect(isCombatEndedEvent(endEvent!)).toBe(true);
    });

    it('provides typed event payloads with rich data', () => {
        const store = createGameStore(nullAdapter, undefined, events);

        store.getState().startCombat(Disatree_01);

        const startEvent = capturedEvents.find(e => e.type === 'combat:started');
        expect(startEvent).toBeDefined();
        
        if (isCombatStartedEvent(startEvent!)) {
            // Type narrowing should work
            expect(startEvent.payload).toBeDefined();
            expect(typeof startEvent.payload).toBe('object');
        }
    });

    it('allows multiple event subscribers', () => {
        const store = createGameStore(nullAdapter, undefined, events);
        
        const combatEvents: GameEvent[] = [];
        const allEvents: GameEvent[] = [];

        events.on('combat:started', (event) => combatEvents.push(event));
        events.onAny((event) => allEvents.push(event));

        store.getState().startCombat(Disatree_01);

        expect(combatEvents).toHaveLength(1);
        expect(allEvents.length).toBeGreaterThan(0);
        expect(combatEvents[0]!.type).toBe('combat:started');
    });

    it('supports unsubscribing from events', () => {
        const store = createGameStore(nullAdapter, undefined, events);
        
        const testEvents: GameEvent[] = [];
        const unsubscribe = events.on('combat:started', (event) => testEvents.push(event));

        store.getState().startCombat(Disatree_01);
        expect(testEvents).toHaveLength(1);

        unsubscribe();
        testEvents.length = 0;

        // Start another combat - should not receive event
        store.getState().startCombat(TidepoolCrab);
        expect(testEvents).toHaveLength(0);
    });

    it('works with game store without event emitter', () => {
        // Should not crash when no emitter provided
        const store = createGameStore(nullAdapter);

        expect(() => {
            store.getState().startCombat(Disatree_01);
            store.getState().endCombat('victory');
        }).not.toThrow();
    });
});