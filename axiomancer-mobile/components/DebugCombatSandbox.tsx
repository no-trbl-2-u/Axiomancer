/**
 * Dev-only COMBAT SANDBOX launcher.
 *
 * Opens the self-contained `/combat-encounter` route — a mock foe and a
 * demo deck, outcome never persisted — for layout and rules work that
 * should not touch the run:
 *   ASSEMBLE — the sandbox fight (historic `debug-combat-encounter-button`).
 *   TEACH    — the same route with `?tutorial=1`, forcing the first-fight
 *              primer + turn-one coach even on a save that has seen them.
 *
 * For a REAL fight against a chosen foe (rewards paid), use the ENEMY
 * PICKER instead. Renders null outside dev builds.
 */

import React from 'react';
import { useRouter } from '@/lib/platform/router';

import { DevButton, DevButtons, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';

export function DebugCombatSandbox() {
    const router = useRouter();

    if (!isDevToolsEnabled()) return null;

    return (
        <DevRow label="DEBUG · COMBAT SANDBOX" sub="mock foe · demo deck · nothing persists" testID="debug-combat-sandbox">
            <DevButtons>
                <DevButton
                    label="ASSEMBLE"
                    onPress={() => router.push('/combat-encounter' as never)}
                    a11y="Open the hazard-pattern combat sandbox"
                    testID="debug-combat-encounter-button"
                />
                <DevButton
                    label="TEACH"
                    onPress={() => router.push('/combat-encounter?tutorial=1' as never)}
                    a11y="Replay the combat tutorial in the sandbox"
                    testID="debug-combat-tutorial-button"
                />
            </DevButtons>
        </DevRow>
    );
}
