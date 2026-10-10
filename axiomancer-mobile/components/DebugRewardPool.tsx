/**
 * Dev-only REWARD POOL.
 *
 * A grid of checkboxes, one per registered card lane (`CARD_LANES`), and a
 * SET REWARD POOL button. The button narrows the post-combat card draft to
 * the checked lanes (`setRewardPool`, state/dev/cards.ts); with nothing
 * checked it clears the override and the whole library is the pool again.
 * The override is saved with the run.
 *
 * The boxes start from the saved override, so the grid shows what is live.
 *
 * Renders null outside dev builds.
 */

import React, { useState } from 'react';

import { DevButton, DevButtons, DevCheck, DevChips, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';
import { getRewardLaneIds, listLanes, setRewardPool } from '@/state/dev/cards';

const LANES = listLanes();

export function DebugRewardPool() {
    const store = useGameStore();
    const [checked, setChecked] = useState<readonly string[]>(() => getRewardLaneIds(store));
    const [feedback, setFeedback] = useState<string | null>(null);

    if (!isDevToolsEnabled()) return null;

    /** Flip one lane, keeping registry order so the saved list is stable. */
    const toggle = (id: string) =>
        setChecked((prev) => LANES.map((l) => l.id).filter((l) => (l === id ? !prev.includes(l) : prev.includes(l))));
    const onSet = () => setFeedback(setRewardPool(store, checked));

    return (
        <DevRow
            label="DEBUG · REWARD POOL"
            sub={feedback ?? 'check lanes · none checked = whole library'}
            stacked
            testID="debug-reward-pool"
        >
            <DevChips testID="debug-reward-pool-grid">
                {LANES.map((lane) => (
                    <DevCheck
                        key={lane.id}
                        label={`${lane.name} · ${lane.cardCount}`}
                        checked={checked.includes(lane.id)}
                        onToggle={() => toggle(lane.id)}
                        a11y={`Include the ${lane.name} lane in the reward pool`}
                        testID={`debug-reward-pool-lane-${lane.id}`}
                    />
                ))}
            </DevChips>
            <DevButtons>
                <DevButton
                    label="SET REWARD POOL"
                    onPress={onSet}
                    a11y="Set the reward pool to the checked lanes"
                    testID="debug-reward-pool-set"
                />
            </DevButtons>
        </DevRow>
    );
}
