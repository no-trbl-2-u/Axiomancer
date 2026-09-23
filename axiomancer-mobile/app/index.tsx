/**
 * The launch route — `/`.
 *
 * Two phases, then the run:
 *   1. TITLE  — the key art and EMBARK (`<TitleScreen>`), shown on every
 *               cold launch.
 *   2. MENU   — CONTINUE / NEW GAME / LOAD GAME / SETTINGS (`<MainMenu>`;
 *               owner call 2026-09-23). CONTINUE resumes the most recent
 *               slot in place; NEW GAME and LOAD GAME open the slot screen;
 *               SETTINGS opens the settings route.
 *
 * `?menu=1` skips the title (the settings screen's RETURN TO TITLE lands
 * here). A fixture boot (`state/fixtures.ts`) skips BOTH phases and enters
 * the compiled state directly — a harness that asked for a fixture did not
 * ask for a menu.
 *
 * Phase 104 note still holds: no starter-bundle picker lives here. The
 * combat deck is seeded lazily at first combat (`ensureStarterCards`).
 */

import React, { useState } from 'react';

import { MainMenu } from '@/components/menu/MainMenu';
import { TitleScreen } from '@/components/TitleScreen';
import { Redirect, useLocalSearchParams, useRouter } from '@/lib/platform/router';
import { useGameStore } from '@/state/GameStoreProvider';
import { useSaveSlots } from '@/state/SaveSlotsProvider';
import { getBootFixture } from '@/state/fixtures';
import { selectActiveTab } from '@/state/presenters/navigation.engine';

type Phase = 'title' | 'menu';

export default function Index() {
    const router = useRouter();
    const store = useGameStore();
    const { continueGame } = useSaveSlots();
    const params = useLocalSearchParams<{ menu?: string }>();
    const [phase, setPhase] = useState<Phase>(params.menu === '1' ? 'menu' : 'title');

    // A fixture boot IS the intended state — straight in, no menu.
    if (getBootFixture() !== null) {
        return <Redirect href={`/${selectActiveTab(store.getState())}`} />;
    }

    if (phase === 'title') {
        return <TitleScreen onContinue={() => setPhase('menu')} />;
    }

    return (
        <MainMenu
            onContinue={() => {
                if (continueGame()) router.replace(`/${selectActiveTab(store.getState())}`);
            }}
            onNewGame={() => router.push('/saves?mode=new')}
            onLoadGame={() => router.push('/saves?mode=load')}
            onSettings={() => router.push('/settings')}
        />
    );
}
