import { Redirect } from 'expo-router';
import { useState } from 'react';
import { useGameState, useGameStore } from '@/state/GameStoreProvider';
import { selectActiveTab } from '@/state/presenters/navigation.engine';
import { selectOnboardingViewModel } from '@/state/presenters/onboarding.engine';
import { TitleScreen } from '@/components/TitleScreen';
import { BundleSelectScreen } from '@/components/BundleSelectScreen';
import { BUNDLE_CHOSEN_FLAG, seedStarterBundleAction } from '@/state/combat/store-actions';

export default function Index() {
  const activeTab = useGameState(selectActiveTab);
  const onboarding = useGameState(selectOnboardingViewModel);
  const store = useGameStore();
  const bundleChosen = useGameState(
    (s) => ((s as unknown as { flags?: string[] }).flags ?? []).includes(BUNDLE_CHOSEN_FLAG),
  );
  const [titleScreenDismissed, setTitleScreenDismissed] = useState(false);
  const [bundlePicked, setBundlePicked] = useState(false);

  // Show title screen for new players who haven't dismissed it yet
  if (onboarding.showTitleScreen && !titleScreenDismissed) {
    return (
      <TitleScreen onContinue={() => setTitleScreenDismissed(true)} />
    );
  }

  // Right after a NEW player dismisses the title (and only then): choose a
  // starter bundle (deck identity). Returning players have showTitleScreen
  // false and skip this; anyone who already chose carries the persisted flag.
  // `ensureStarterSkills` is the safety net if this is ever bypassed.
  const needsBundleSelection =
    onboarding.showTitleScreen && titleScreenDismissed && !bundleChosen && !bundlePicked;
  if (needsBundleSelection) {
    return (
      <BundleSelectScreen
        onPick={(bundleId) => {
          seedStarterBundleAction(store, bundleId);
          setBundlePicked(true);
        }}
      />
    );
  }

  return <Redirect href={`/${activeTab}`} />;
}
