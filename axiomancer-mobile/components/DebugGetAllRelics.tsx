/**
 * Dev-only GET ALL RELICS.
 *
 * One press adds every relic in the engine's `relicLibrary` the player does
 * not already own to the inventory (`actions.grantAllRelics`). Nothing worn
 * is displaced; a relic that lands in a free trinket position is worn, the
 * dock's convention. Renders null outside dev builds.
 */

import React, { useState } from 'react';

import { DevButton, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';

export function DebugGetAllRelics() {
    const actions = useGameActions();
    const [feedback, setFeedback] = useState<string | null>(null);

    if (!isDevToolsEnabled()) return null;

    const onPress = () => {
        const { added, worn } = actions.grantAllRelics();
        setFeedback(added.length === 0
            ? 'every relic is already owned'
            : `added ${added.length} · worn ${worn.length}`);
    };

    return (
        <DevRow label="DEBUG · RELICS" sub={feedback ?? 'every relic in the library, once each'} testID="debug-relics">
            <DevButton
                label="GET ALL RELICS"
                onPress={onPress}
                a11y="Add every relic in the library to the inventory"
                testID="debug-get-all-relics"
            />
        </DevRow>
    );
}
