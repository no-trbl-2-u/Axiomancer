/**
 * Dev-only auto-seed on first boot (via /jot 39695a5).
 *
 * User-jot: "the starting character to have a bunch of items
 * to test the equipment and consumable mechanics." A blank
 * inventory is the wrong default for DEV builds since manual
 * testing depends on having items + skills + a seeded map.
 *
 * Behavior:
 *   - Production (`__DEV__` false): renders null, no effect.
 *   - DEV with empty player.inventory: fires `actions.debugSeed()`
 *     once on mount; persistence saves the seeded state, so
 *     subsequent launches see a non-empty inventory and skip
 *     the auto-seed.
 *   - DEV with non-empty player.inventory: no-op; the player's
 *     prior session state stands.
 *
 * Renders null — it's a side-effect-only component.
 */

import { useEffect, useRef } from 'react';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';

declare const __DEV__: boolean | undefined;

export function DevAutoSeed() {
    const actions = useGameActions();
    const inventoryLength = useGameState((s) => s.player.inventory?.length ?? 0);
    const seeded = useRef(false);

    useEffect(() => {
        // Hard-stop: production bundles have __DEV__=false — never seed.
        // This guards against app.config.ts misconfiguration (e.g. a build
        // made without EAS_BUILD_PROFILE inadvertently receiving
        // devToolsEnabled=true from the config's buildProfile logic).
        if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
        if (!isDevToolsEnabled()) return;
        if (seeded.current) return;
        if (inventoryLength > 0) {
            // Either the prior session already seeded, or the
            // player has a real (non-empty) inventory — either way,
            // don't re-seed. Mark as done so subsequent inventory
            // changes don't retrigger.
            seeded.current = true;
            return;
        }
        seeded.current = true;
        actions.debugSeed();
    }, [actions, inventoryLength]);

    return null;
}
