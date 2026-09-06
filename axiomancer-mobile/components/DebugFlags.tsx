/**
 * Dev-only FLAGS row.
 *
 * Chips for the well-known `GameState.flags` entries (tutorial coaches,
 * the starter-bundle pick, the hazard hex) — lit when set, tap to flip —
 * plus ALL TUTS ON / OFF shortcuts so a tester can replay every first-
 * visit coach or skip them all. The full flag list is visible in the
 * STATE inspector. Renders null outside dev builds.
 */

import React from 'react';

import { DevButton, DevButtons, DevChip, DevChips, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameState, useGameStore } from '@/state/GameStoreProvider';
import { KNOWN_FLAGS, TUTORIAL_FLAGS, flagsOf, setFlags, toggleFlag } from '@/state/dev/flags';

export function DebugFlags() {
    const store = useGameStore();
    const flags = useGameState(flagsOf);

    if (!isDevToolsEnabled()) return null;

    return (
        <DevRow label="DEBUG · FLAGS" sub={`${flags.length} set · lit = on · tap to flip`} stacked testID="debug-flags">
            <DevChips>
                {KNOWN_FLAGS.map((f) => (
                    <DevChip
                        key={f.flag}
                        label={f.label}
                        active={flags.includes(f.flag)}
                        onPress={() => toggleFlag(store, f.flag)}
                        a11y={`Toggle the ${f.flag} flag`}
                        testID={`debug-flag-${f.flag}`}
                    />
                ))}
            </DevChips>
            <DevButtons>
                <DevButton label="ALL TUTS ON" onPress={() => setFlags(store, TUTORIAL_FLAGS, true)} a11y="Mark every tutorial as done" testID="debug-flags-tuts-on" />
                <DevButton label="ALL TUTS OFF" onPress={() => setFlags(store, TUTORIAL_FLAGS, false)} a11y="Clear every tutorial flag" testID="debug-flags-tuts-off" />
            </DevButtons>
        </DevRow>
    );
}
