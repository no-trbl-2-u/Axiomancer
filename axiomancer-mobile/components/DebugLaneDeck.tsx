/**
 * Dev-only TEST LANE DECK.
 *
 * A drop-down of every registered card lane (`CARD_LANES`) and a SET DECK
 * button beside it. SET DECK replaces the player's whole combat deck with
 * the picked lane's test deck (`setLaneDeck`, state/dev/cards.ts): the
 * deck base becomes the lane deck and earned reward cards are cleared.
 * The next fight deals it.
 *
 * Renders null outside dev builds.
 */

import React, { useState } from 'react';

import { DevButton, DevButtons, DevRow, DevSelect } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';
import { listLanes, setLaneDeck } from '@/state/dev/cards';

const LANES = listLanes();

export function DebugLaneDeck() {
    const store = useGameStore();
    const [laneId, setLaneId] = useState<string>(LANES[0]?.id ?? '');
    const [feedback, setFeedback] = useState<string | null>(null);

    if (!isDevToolsEnabled()) return null;

    const options = LANES.map((lane) => ({ value: lane.id, label: `${lane.name} · ${lane.deckSize} cards` }));
    const onSet = () => setFeedback(setLaneDeck(store, laneId));

    return (
        <DevRow label="DEBUG · TEST LANE DECK" sub={feedback ?? 'replace the whole deck with a lane deck'} stacked testID="debug-lane-deck">
            <DevButtons>
                <DevSelect
                    value={laneId}
                    options={options}
                    onChange={setLaneId}
                    a11y="Choose a lane deck"
                    testID="debug-lane-deck-select"
                />
                <DevButton
                    label="SET DECK"
                    onPress={onSet}
                    disabled={!laneId}
                    a11y="Replace the whole deck with the chosen lane deck"
                    testID="debug-lane-deck-set"
                />
            </DevButtons>
        </DevRow>
    );
}
