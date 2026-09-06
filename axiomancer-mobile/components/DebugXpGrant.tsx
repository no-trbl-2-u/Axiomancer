/**
 * Dev-only XP / LEVEL controls.
 *
 *   +100 XP / +1000 XP — add experience (`grantXp`); no level-up fires
 *                        until the engine threshold is crossed by play.
 *   LEVELUP            — cross the threshold and dispatch the engine's
 *                        LEVEL_UP (`forceLevelUp`), which stacks levels,
 *                        grants stat points, and re-arms the SELF badge.
 *
 * Helpers live in state/dev/rewards.ts. Renders null outside dev builds.
 */

import React, { useState } from 'react';

import { DevButton, DevButtons, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';
import { forceLevelUp, grantXp } from '@/state/dev/rewards';

const SMALL_XP = 100;
const LARGE_XP = 1000;

export function DebugXpGrant() {
    const store = useGameStore();
    const [feedback, setFeedback] = useState<string | null>(null);

    if (!isDevToolsEnabled()) return null;

    const onGrant = (amount: number) => setFeedback(`xp · ${grantXp(store, amount)}`);
    const onLevelUp = () => setFeedback(`level · ${forceLevelUp(store)}`);

    return (
        <DevRow label="DEBUG · XP" sub={feedback ?? 'grant experience or force a level'} testID="debug-xp">
            <DevButtons>
                <DevButton label={`+${SMALL_XP} XP`} onPress={() => onGrant(SMALL_XP)} a11y={`Grant ${SMALL_XP} experience points to the player`} testID="debug-xp-grant-button" />
                <DevButton label={`+${LARGE_XP} XP`} onPress={() => onGrant(LARGE_XP)} a11y={`Grant ${LARGE_XP} experience points to the player`} testID="debug-xp-grant-large-button" />
                <DevButton label="LEVELUP" onPress={onLevelUp} a11y="Force the player to level up" testID="debug-xp-levelup-button" />
            </DevButtons>
        </DevRow>
    );
}
