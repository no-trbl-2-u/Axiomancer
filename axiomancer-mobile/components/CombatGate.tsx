import { useEffect, useRef } from 'react';
import { useRouter } from '@/lib/platform/router';

import { useCombatMode } from '@/state/combat-mode';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import { selectEventViewModel, selectHasActiveEvent } from '@/state/presenters/event.engine';
import type { AppStoreState } from '@/state/store';
import { selectIsInCombat } from '@mechanics';

/** True while the pending event is a fight waiting to be engaged. */
function selectPreludeReady(state: AppStoreState): boolean {
    return selectHasActiveEvent(state) && selectEventViewModel(state).kind === 'combat-prelude';
}

/**
 * Starts every live fight and puts it on its own screen.
 *
 * Two jobs, both side effects, mounted once in the root layout beside
 * `<HazardGate>`:
 *
 * 1. **Engage.** A `combat-prelude` event (a map or labyrinth encounter) is
 *    engaged at once: `beginHazardEncounter` stages the foe as the store's
 *    `currentEncounter` and clears the event, and `enterCombat` raises the
 *    combat flag (Android back lock, run stats). There is no prelude screen;
 *    the combat panel's reveal is the one commit gate.
 * 2. **Route.** While a fight is staged (`selectIsInCombat`), push
 *    `/combat-encounter` once. The latch re-arms when the fight is settled,
 *    so the next fight routes too. A fight still staged from earlier in the
 *    session (a chronicle continued in memory) routes the same way.
 *
 * `router` and `actions` are read through refs: `useRouter()` returns a
 * fresh object every render, and an effect keyed on it would clear its own
 * pending push on the next render and never fire again.
 */
export function CombatGate() {
    const preludeReady = useGameState(selectPreludeReady);
    const staged = useGameState(selectIsInCombat);
    const { enterCombat } = useCombatMode();
    const actions = useGameActions();
    const router = useRouter();
    const routerRef = useRef(router);
    routerRef.current = router;
    const actionsRef = useRef(actions);
    actionsRef.current = actions;

    useEffect(() => {
        if (!preludeReady || staged) return;
        const enemy = actionsRef.current.beginHazardEncounter();
        if (enemy) enterCombat();
    }, [preludeReady, staged, enterCombat]);

    const pushed = useRef(false);
    useEffect(() => {
        if (!staged) {
            pushed.current = false;
            return;
        }
        if (pushed.current) return;
        pushed.current = true;
        // After the current commit, so a host that navigates and stages the
        // fight in one handler (the dev trigger) lands before the push.
        const timeoutId = setTimeout(() => {
            try {
                routerRef.current.push('/combat-encounter' as never);
            } catch (error) {
                console.warn('CombatGate navigation failed:', error);
                pushed.current = false;
            }
        }, 0);
        return () => {
            clearTimeout(timeoutId);
            pushed.current = false;
        };
    }, [staged]);

    return null;
}
