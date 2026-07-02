import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useGameState } from '@/state/GameStoreProvider';
import { selectHasActiveQuestBoard } from '@/state/presenters/quest.engine';

/**
 * Pushes the user into the full-screen `/quest` route whenever a
 * quest-board session starts (quest map event resolved, or the dev
 * entry fired). Mirrors `<HazardGate>` — a side-effect-only component
 * mounted once in the root layout.
 */
export function QuestGate() {
    const hasQuest = useGameState(selectHasActiveQuestBoard);
    const router = useRouter();

    useEffect(() => {
        if (hasQuest) router.push('/quest' as never);
    }, [hasQuest, router]);

    return null;
}
