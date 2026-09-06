/**
 * Dev-only CURRENCY controls.
 *
 *   +50S / +500S — grant shillings (floored at zero).
 *   BROKE        — set the wallet to zero to test poverty branches
 *                  (shop refusals, the Reliquary's sacrifice offer, the
 *                  Anvil's price gate).
 *
 * Writes `player.currency` directly — the engine has no grant action.
 * Renders null outside dev builds.
 */

import React from 'react';

import { DevButton, DevButtons, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameState, useGameStore } from '@/state/GameStoreProvider';

const SMALL_GRANT_AMOUNT = 50;
const LARGE_GRANT_AMOUNT = 500;

export function DebugCurrencyControl() {
    const store = useGameStore();
    const currency = useGameState((s) => s.player?.currency ?? 0);

    if (!isDevToolsEnabled()) return null;

    /** Set the wallet to `max(0, current + delta)`; `delta = -Infinity` → zero. */
    const adjust = (delta: number) => {
        const player = store.getState().player;
        const next = Math.max(0, Number(player.currency ?? 0) + delta);
        store.setState({ player: { ...player, currency: Number.isFinite(next) ? next : 0 } });
    };

    return (
        <DevRow label="DEBUG · CURRENCY" sub={`${currency} shillings`} testID="debug-currency">
            <DevButtons>
                <DevButton label={`+${SMALL_GRANT_AMOUNT}S`} onPress={() => adjust(SMALL_GRANT_AMOUNT)} a11y={`Grant ${SMALL_GRANT_AMOUNT} shilling to the player`} testID="debug-currency-small-grant" />
                <DevButton label={`+${LARGE_GRANT_AMOUNT}S`} onPress={() => adjust(LARGE_GRANT_AMOUNT)} a11y={`Grant ${LARGE_GRANT_AMOUNT} shilling to the player`} testID="debug-currency-large-grant" />
                <DevButton label="BROKE" onPress={() => adjust(-Infinity)} a11y="Set player currency to zero" testID="debug-currency-broke" />
            </DevButtons>
        </DevRow>
    );
}
