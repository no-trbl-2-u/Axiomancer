/**
 * Dev-only HUD override.
 *
 * One live toggle: HIDE EFFECTS forces the combat HUD's effects rail
 * empty (`devOverrides.hud.hideEffects`, read by
 * `state/presenters/combat-hud.engine.ts`) so the empty-state layout
 * can be checked without waiting for statuses to expire. The former
 * HIDE MANA / HIDE STANCE toggles were removed in the 2026-09 dev-tools
 * audit — the presenter never read them.
 *
 * Renders null outside dev builds.
 */

import React from 'react';

import { DevButton, DevButtons, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameState, useGameStore } from '@/state/GameStoreProvider';

export function DebugHudOverrides() {
    const store = useGameStore();
    const hideEffects = useGameState((s) => s.devOverrides?.hud.hideEffects ?? false);

    if (!isDevToolsEnabled()) return null;

    const setHideEffects = (value: boolean) => {
        const current = store.getState().devOverrides;
        store.setState({ devOverrides: { ...current, hud: { ...current.hud, hideEffects: value } } });
    };

    return (
        <DevRow label="DEBUG · HUD" sub={hideEffects ? 'effects rail forced empty' : 'combat HUD renders live state'} testID="debug-hud">
            <DevButtons>
                <DevButton
                    label={hideEffects ? '✓ EFFECTS HIDDEN' : 'HIDE EFFECTS'}
                    active={hideEffects}
                    onPress={() => setHideEffects(!hideEffects)}
                    a11y={hideEffects ? 'Show combat effects again' : 'Hide combat effects on the HUD'}
                    testID="debug-hud-hide-effects"
                />
                <DevButton label="RESET" onPress={() => setHideEffects(false)} a11y="Reset HUD overrides" testID="debug-hud-reset-all" />
            </DevButtons>
        </DevRow>
    );
}
