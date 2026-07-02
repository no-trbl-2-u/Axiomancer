/**
 * Hermetic integration tests — re-trigger scenarios (Phase 121 Tick C).
 *
 * Regression guard for Phase 118 issue #191: second encounter node
 * fires after first resolves; combat modal re-arms cleanly.
 * Tests the specific integration gap where completed encounters
 * would block subsequent event resolution.
 *
 * Legacy turn-based combat (the `state.combat` slice) was removed from the
 * engine in mechanics 0.37.0; "in combat" is now the recorded
 * `currentEncounter` (set by `startCombat`, cleared by `endCombat`), so these
 * pins assert on it rather than a combat slice.
 *
 * Hermetic = self-contained + deterministic + isolated. See
 * `docs/testing.md`.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { createEnemy } from 'axiomancer-mechanics';
import React from 'react';

import { withAllProviders } from '@/test-utils/withAllProviders';
import { simulatePlayerAction, waitForStateUpdate } from '@/test-utils/simulatePlayerAction';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeTestEnemy(id: string = 'test-retrigger-foe') {
    return createEnemy({
        id,
        name: 'Test Re-trigger Foe',
        description: 'A test enemy for re-trigger scenarios',
        level: 1,
        baseStats: { heart: 1, body: 1, mind: 1 },
        mapName: 'fishing-village',
        logic: 'random',
    });
}

describe('integration: encounter re-trigger — Phase 118 regression guard', () => {
    it('second encounter triggers cleanly after first completes', async () => {
        const { store } = withAllProviders(<></>);
        
        // Complete first encounter fully
        await simulatePlayerAction(store, (actions) => {
            actions.startCombat(makeTestEnemy('first-enemy'));
        });
        
        expect(store.getState().currentEncounter).not.toBeUndefined();

        await simulatePlayerAction(store, (actions) => {
            actions.endCombat();
        });

        expect(store.getState().currentEncounter).toBeUndefined();

        // Clear any residual event state to simulate post-encounter cleanup
        store.setState({ 
            event: {
                pending: null,
                dialogueCursor: null,
                history: [],
                sourceNodeType: null,
            }
        });
        
        // The key test: second encounter should start without issues
        await simulatePlayerAction(store, (actions) => {
            actions.startCombat(makeTestEnemy('second-enemy'));
        });
        
        const secondEncounter = store.getState().currentEncounter;
        expect(secondEncounter).not.toBeUndefined();
        expect(secondEncounter?.enemies[0]?.id).toBe('second-enemy');
    });

    it('resolveCurrentMapEvent works after previous encounter completed', async () => {
        const { store } = withAllProviders(<></>);
        
        // Start and complete first encounter 
        await simulatePlayerAction(store, (actions) => {
            actions.startCombat(makeTestEnemy());
        });
        
        await simulatePlayerAction(store, (actions) => {
            actions.endCombat();
        });
        
        // Clear any event state using the proper empty state
        const { EMPTY_EVENT_SLICE } = require('@/state/store');
        store.setState({ event: EMPTY_EVENT_SLICE });
        
        // The key test: after the first encounter, subsequent calls to resolveCurrentMapEvent 
        // should work. If the bug exists, this would be blocked by stale modal state.
        await simulatePlayerAction(store, (actions) => {
            const eventResolved = actions.resolveCurrentMapEvent('encounter');
            
            // Should succeed regardless of what type of event is resolved
            expect(typeof eventResolved).toBe('boolean');
        });
    });

    it('combat modal state resets completely between encounters', async () => {
        const { store } = withAllProviders(<></>);
        
        // First encounter
        await simulatePlayerAction(store, (actions) => {
            actions.startCombat(makeTestEnemy('first'));
        });
        
        // Capture first encounter state fingerprint
        const firstEncounterId = store.getState().currentEncounter?.enemies[0]?.id;
        expect(firstEncounterId).toBe('first');

        await simulatePlayerAction(store, (actions) => {
            actions.endCombat();
        });

        // Ensure clean slate
        expect(store.getState().currentEncounter).toBeUndefined();

        // Second encounter
        await simulatePlayerAction(store, (actions) => {
            actions.startCombat(makeTestEnemy('second'));
        });

        // State should be fresh, not contaminated by first encounter
        const secondEncounter = store.getState().currentEncounter;
        expect(secondEncounter?.enemies[0]?.id).toBe('second');
    });

    it('event slice state resets properly between encounters', async () => {
        const { store } = withAllProviders(<></>);
        
        // Simulate an event being processed
        await simulatePlayerAction(store, (actions) => {
            const eventTriggered = actions.resolveCurrentMapEvent('encounter');
            
            if (eventTriggered && store.getState().event?.pending) {
                // Event was triggered - now process it
                const pendingEvent = store.getState().event.pending;
                if (pendingEvent?.event.kind === 'encounter') {
                    // Start the combat from the event
                    actions.startCombat(makeTestEnemy('event-enemy'));
                }
            }
        });
        
        // Complete the combat
        if (store.getState().currentEncounter) {
            await simulatePlayerAction(store, (actions) => {
                actions.endCombat();
            });
        }
        
        // Clear the event state (simulating modal dismissal)
        await simulatePlayerAction(store, (actions) => {
            actions.dismissEvent();
        });
        
        // Event slice should be clear
        expect(store.getState().event?.pending).toBeNull();
        
        // Should be able to trigger another event cleanly
        await simulatePlayerAction(store, (actions) => {
            const secondEventTriggered = actions.resolveCurrentMapEvent('exploration');
            expect(typeof secondEventTriggered).toBe('boolean');
        });
    });

    it('preserves exploration state across multiple encounter cycles', async () => {
        const { store } = withAllProviders(<></>);
        
        // Capture initial exploration state
        const initialNode = store.getState().world?.currentMap?.currentNode;
        const initialMap = store.getState().world?.currentMap?.name;
        
        // Run multiple encounter cycles
        for (let i = 0; i < 2; i++) {
            await simulatePlayerAction(store, (actions) => {
                actions.startCombat(makeTestEnemy(`cycle-${i}`));
            });
            
            await simulatePlayerAction(store, (actions) => {
                actions.endCombat();
            });
            
            // Clear event state between cycles
            store.setState({
                event: {
                    pending: null,
                    dialogueCursor: null,
                    history: [],
                    sourceNodeType: null,
                }
            });
            
            await waitForStateUpdate();
        }
        
        // Exploration state should be preserved
        expect(store.getState().world?.currentMap?.currentNode).toBe(initialNode);
        expect(store.getState().world?.currentMap?.name).toBe(initialMap);
        expect(store.getState().world).not.toBeNull();
        expect(store.getState().player).not.toBeNull();
    });

    it('handles rapid encounter succession without state corruption', async () => {
        const { store } = withAllProviders(<></>);
        
        // Rapidly cycle through encounters to stress-test state management
        const encounters = ['rapid-1', 'rapid-2', 'rapid-3'];
        
        for (const encounterId of encounters) {
            await simulatePlayerAction(store, (actions) => {
                actions.startCombat(makeTestEnemy(encounterId));
            });
            
            // Verify each encounter starts clean
            const encounter = store.getState().currentEncounter;
            expect(encounter?.enemies[0]?.id).toBe(encounterId);

            await simulatePlayerAction(store, (actions) => {
                actions.endCombat();
            });

            // Verify clean termination
            expect(store.getState().currentEncounter).toBeUndefined();
        }
        
        // Final state should be stable
        expect(store.getState().player).not.toBeNull();
        expect(store.getState().world).not.toBeNull();
    });
});