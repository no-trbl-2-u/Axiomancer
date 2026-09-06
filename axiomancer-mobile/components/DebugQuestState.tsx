/**
 * Dev-only QUEST controls — over the REAL authored quests.
 *
 * Every quest the engine authors on a `MapDefinition.quests[]` (the
 * campaign's quest-log line: starting-quest → get-to-forest → … →
 * get-to-town-across-river) is a chip showing its live status. Tap a
 * chip to select it, then START / ADVANCE / COMPLETE it through the
 * engine's `startQuest` / `progressQuest` / `completeQuest` reducers
 * (state/dev/story-catalog.ts). The Ledger tab and dialogue gates
 * (`requires.quest`) react exactly as they would in play.
 *
 * Renders null outside dev builds.
 */

import React, { useState } from 'react';

import { DevButton, DevButtons, DevChip, DevChips, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameState, useGameStore } from '@/state/GameStoreProvider';
import {
    advanceQuest,
    completeQuestByName,
    listQuests,
    questStatus,
    startQuestByName,
} from '@/state/dev/story-catalog';

const QUESTS = listQuests();

export function DebugQuestState() {
    const store = useGameStore();
    const [selectedKey, setSelectedKey] = useState<string>(QUESTS[0]?.key ?? '');
    const [feedback, setFeedback] = useState<string | null>(null);
    // Subscribe to the quest log so chip statuses re-render on change.
    const log = useGameState((s) => s.quests);

    if (!isDevToolsEnabled()) return null;

    const selected = QUESTS.find((q) => q.key === selectedKey) ?? QUESTS[0];
    if (!selected) return null;

    const onStart = () => {
        startQuestByName(store, selected);
        setFeedback(`started · ${selected.key}`);
    };
    const onAdvance = () => {
        const ok = advanceQuest(store, selected);
        setFeedback(ok ? `advanced · ${selected.key}` : `not active · ${selected.key}`);
    };
    const onComplete = () => {
        completeQuestByName(store, selected);
        setFeedback(`completed · ${selected.key}`);
    };

    return (
        <DevRow label="DEBUG · QUESTS" sub={feedback ?? `${QUESTS.length} authored · pick one, then act`} stacked testID="debug-quests">
            <DevChips testID="debug-quest-chips">
                {QUESTS.map((q) => (
                    <DevChip
                        key={q.key}
                        label={`${q.key} · ${questStatus({ quests: log }, q.key)}`}
                        active={q.key === selected.key}
                        onPress={() => setSelectedKey(q.key)}
                        a11y={`Select quest ${q.key} from ${q.map}`}
                        testID={`debug-quest-${q.key}`}
                    />
                ))}
            </DevChips>
            <DevButtons>
                <DevButton label="START" onPress={onStart} a11y={`Start quest ${selected.key}`} testID="debug-quest-start" />
                <DevButton label="ADVANCE" onPress={onAdvance} a11y={`Advance quest ${selected.key}`} testID="debug-quest-advance" />
                <DevButton label="COMPLETE" onPress={onComplete} a11y={`Complete quest ${selected.key}`} testID="debug-quest-complete" />
            </DevButtons>
        </DevRow>
    );
}
