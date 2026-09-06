/**
 * Dev-only DIALOGUE jump — into the REAL authored NPC trees.
 *
 * Every staged NPC with a conversation (Captain Blackwater, the Hermit
 * Sage, the Forest Ranger, …) across every map is a chip. A tap seeds
 * the event slice with an `interaction` + a cursor at the tree root
 * (`openNpcDialogue`, state/dev/story-catalog.ts); `<EventGate>` pushes
 * `/dialogue`, and choices apply through the live path — quest starts,
 * taught cards, flags, alignment gates all behave as in play.
 *
 * The chip id is `debug-dialogue-<map>-<npc-slug>`. Renders null
 * outside dev builds.
 */

import React, { useState } from 'react';

import { DevChip, DevChips, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';
import { listNpcs, openNpcDialogue, slug } from '@/state/dev/story-catalog';

const NPCS = listNpcs();

export function DebugDialogueJump() {
    const store = useGameStore();
    const [feedback, setFeedback] = useState<string | null>(null);

    if (!isDevToolsEnabled()) return null;

    return (
        <DevRow label="DEBUG · DIALOGUE" sub={feedback ?? `${NPCS.length} staged NPCs · tap to talk`} stacked testID="debug-dialogue">
            <DevChips>
                {NPCS.map((npc) => (
                    <DevChip
                        key={npc.key}
                        label={`${npc.name} · ${npc.map}`}
                        onPress={() => {
                            openNpcDialogue(store, npc);
                            setFeedback(`talking · ${npc.name}`);
                        }}
                        a11y={`Open dialogue with ${npc.name} of ${npc.map}`}
                        testID={`debug-dialogue-${npc.map}-${slug(npc.name)}`}
                    />
                ))}
            </DevChips>
        </DevRow>
    );
}
