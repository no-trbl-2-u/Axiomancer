/**
 * Dev-only auto-seed on first boot (via /jot 39695a5).
 *
 * User-jot: "the starting character to have a bunch of items
 * to test the equipment and consumable mechanics." A blank
 * inventory is the wrong default for DEV builds since manual
 * testing depends on having items + cards + a seeded map.
 *
 * Behavior:
 *   - Production (`__DEV__` false): renders null, no effect.
 *   - DEV with no non-relic items in player.inventory: fires
 *     `actions.debugSeed()` once on mount; persistence saves the
 *     seeded state, so subsequent launches see real items and skip
 *     the auto-seed. (A fresh game now seeds the 8 signet relics —
 *     Phase 19 — so "empty inventory" is no longer the fresh signal;
 *     "only relics, no test gear/consumables yet" is.)
 *   - DEV with any non-relic item: no-op; the player's prior session
 *     state stands.
 *
 * Renders null — it's a side-effect-only component.
 */

import { useEffect, useRef } from 'react';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';

declare const __DEV__: boolean | undefined;

export function DevAutoSeed() {
    const actions = useGameActions();
    // Count only NON-relic items: a fresh game seeds the 8 signet relics
    // (Phase 19), so a relic-only inventory is still a fresh, un-seeded dev
    // character. Any consumable / material / non-relic gear means a real (or
    // already-seeded) session.
    const nonRelicCount = useGameState(
        (s) => (s.player.inventory ?? []).filter((i) => !i.id.startsWith('relic-')).length,
    );
    const seeded = useRef(false);

    useEffect(() => {
        // Hard-stop: production bundles have __DEV__=false — never seed.
        // This guards against app.config.ts misconfiguration (e.g. a build
        // made without EAS_BUILD_PROFILE inadvertently receiving
        // devToolsEnabled=true from the config's buildProfile logic).
        if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
        if (!isDevToolsEnabled()) return;
        if (seeded.current) return;
        if (nonRelicCount > 0) {
            // Either the prior session already seeded, or the player has a real
            // (non-relic) inventory — either way, don't re-seed. Mark as done so
            // subsequent inventory changes don't retrigger.
            seeded.current = true;
            return;
        }
        seeded.current = true;
        actions.debugSeed();
    }, [actions, nonRelicCount]);

    return null;
}
