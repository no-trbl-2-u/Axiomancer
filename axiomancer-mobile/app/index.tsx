import { Redirect } from '@/lib/platform/router';
import { useState } from 'react';
import { useGameState } from '@/state/GameStoreProvider';
import { selectActiveTab } from '@/state/presenters/navigation.engine';
import { selectOnboardingViewModel } from '@/state/presenters/onboarding.engine';
import { TitleScreen } from '@/components/TitleScreen';

// Phase 104 (the grey office) — a brand-new player no longer chooses a
// starter bundle here. `ensureStarterCards` (state/actions.ts) seeds the
// grey office directly at first combat, so this route only gates the title
// screen before redirecting into the app.
export default function Index() {
  const activeTab = useGameState(selectActiveTab);
  const onboarding = useGameState(selectOnboardingViewModel);
  const [titleScreenDismissed, setTitleScreenDismissed] = useState(false);

  // Show title screen for new players who haven't dismissed it yet
  if (onboarding.showTitleScreen && !titleScreenDismissed) {
    return (
      <TitleScreen onContinue={() => setTitleScreenDismissed(true)} />
    );
  }

  return <Redirect href={`/${activeTab}`} />;
}
