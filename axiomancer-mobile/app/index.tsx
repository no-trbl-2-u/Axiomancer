import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useGameState, useGameStore } from '@/state/GameStoreProvider';
import { selectActiveTab } from '@/state/presenters/navigation.engine';
import { selectOnboardingViewModel } from '@/state/presenters/onboarding.engine';
import { TitleScreen } from '@/components/TitleScreen';
import {
  BUNDLE_CHOSEN_FLAG,
  NEW_PLAYER_STARTER_BUNDLE_ID,
  seedStarterBundleAction,
} from '@/state/combat/store-actions';

export default function Index() {
  const activeTab = useGameState(selectActiveTab);
  const onboarding = useGameState(selectOnboardingViewModel);
  const store = useGameStore();
  const bundleChosen = useGameState(
    (s) => ((s as unknown as { flags?: string[] }).flags ?? []).includes(BUNDLE_CHOSEN_FLAG),
  );
  const [titleScreenDismissed, setTitleScreenDismissed] = useState(false);

  // Right after a NEW player dismisses the title (and only then): a starter
  // bundle (deck identity) is required. Returning players have
  // showTitleScreen false and skip this; anyone who already chose carries
  // the persisted flag. `ensureStarterCards` is the safety net if this is
  // ever bypassed.
  const needsBundleSelection = onboarding.showTitleScreen && titleScreenDismissed && !bundleChosen;

  // Phase 46b: a brand-new player is auto-seeded into the neutral Threadbare
  // Office rather than choosing among all three campaign snapshots — see
  // `plan/phases/phase_46a_early_game_rethink.md` D4. Seeding flips
  // `bundleChosen` in the store, which re-renders this route straight past
  // `needsBundleSelection` to the `<Redirect>` below.
  useEffect(() => {
    if (needsBundleSelection) {
      seedStarterBundleAction(store, NEW_PLAYER_STARTER_BUNDLE_ID);
    }
  }, [needsBundleSelection, store]);

  // Show title screen for new players who haven't dismissed it yet
  if (onboarding.showTitleScreen && !titleScreenDismissed) {
    return (
      <TitleScreen onContinue={() => setTitleScreenDismissed(true)} />
    );
  }

  if (needsBundleSelection) {
    return null;
  }

  return <Redirect href={`/${activeTab}`} />;
}
