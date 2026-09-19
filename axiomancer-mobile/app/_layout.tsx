import { NavigationContainer, Stack, linking, navigationRef, flushPendingNavigation } from '@/lib/platform/router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from '@/lib/platform/font';
import * as SplashScreen from '@/lib/platform/splash-screen';
import * as NavigationBar from '@/lib/platform/navigation-bar';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from '@/lib/platform/status-bar';
import { TooltipProvider } from '@/components/tooltip/TooltipProvider';
import { AestheticModeProvider } from '@/state/aesthetic-mode';
import { CombatModeProvider } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { FontProvider } from '@/hooks/useFontFallbacks';
// Map event pools are authored and self-registered by the engine
// (axiomancer-mechanics → World/MapEvents/content); the client no longer
// registers a parallel pool set.
// Side-effect: skin the web scrollbar to match the gothic chrome.
import '@/theme/web-scrollbar';
import { createAsyncStorageAdapter } from '@/state/persistence/asyncStorageAdapter';
import { SaveOnExit } from '@/components/SaveOnExit';
import { createFixtureBootAdapter } from '@/state/persistence/fixtureBootAdapter';
import { resolveBootFixture } from '@/state/fixtures';
import { FixtureBoot } from '@/components/FixtureBoot';
import { CorruptSaveModal } from '@/components/CorruptSaveModal';
import { DevAutoSeed } from '@/components/DevAutoSeed';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PrevSessionCrashPrompt } from '@/components/PrevSessionCrashPrompt';
import { HardwareBackHandler } from '@/components/HardwareBackHandler';
import { BlacksmithGate } from '@/components/BlacksmithGate';
import { CacheGate } from '@/components/CacheGate';
import { EventGate } from '@/components/EventGate';
import { HazardGate } from '@/components/HazardGate';
import { RestGate } from '@/components/RestGate';
import { NavLogger } from '@/components/NavLogger';
import { ToastHost } from '@/components/ToastHost';
import { applyCombatFlagsFromEnv } from '@/state/combat/flags';
import { getLogger } from '@mechanics';
import { initAppLogging } from '@/state/logging';
import { attachCrashBreadcrumbs, initCrashReporting, withCrashReporting } from '@/lib/monitoring';
import IndexScreen from './index';
import TabLayout from './(tabs)/_layout';
import EventScreen from './event/index';
import HazardScreen from './hazard/index';
import CombatEncounterScreen from './combat-encounter/index';
import HazardDeckScreen from './hazard-deck/index';
import RestScreen from './rest/index';
import CacheScreen from './cache/index';
import BlacksmithScreen from './blacksmith/index';
import VillageScreen from './village/index';
import DialogueScreen from './dialogue/index';
import CutsceneScreen from './cutscene/index';
import DevToolsScreen from './dev/index';
import LabyrinthScreen from './labyrinth/index';
import DevArtGallery from './devart/index';
import DevRoomGallery from './devart/rooms';
import DevAftermathPanel from './devaftermath/index';

// Vendored locally (phase 47c dropped the `@expo-google-fonts/*` npm
// packages — same OFL-licensed .ttf files, sourced under
// assets/fonts/LICENSES/). Keys stay the exact fontFamily strings
// `theme/axm.ts` references; `expo-font`'s loader keys a font by
// this object's property name, not the file name.
const PirataOne_400Regular = require('@/assets/fonts/PirataOne_400Regular.ttf');
const IMFellEnglish_400Regular = require('@/assets/fonts/IMFellEnglish_400Regular.ttf');
const IMFellEnglish_400Regular_Italic = require('@/assets/fonts/IMFellEnglish_400Regular_Italic.ttf');
const BebasNeue_400Regular = require('@/assets/fonts/BebasNeue_400Regular.ttf');
const JetBrainsMono_400Regular = require('@/assets/fonts/JetBrainsMono_400Regular.ttf');

SplashScreen.preventAutoHideAsync();

// Spec 33 — build-time combat flags (Upgradeable Dice preview opt-in).
// Applied at module load, before any store/provider touches the engine.
applyCombatFlagsFromEnv();

// Crash reporting (lib/monitoring.ts) — FIRST, so a crash during the boot
// below is still reported. Native-only and DSN-gated; a no-op on web.
initCrashReporting();

// AXM Log (docs/logging.md) — enable the structured logger before any
// store/provider touches the engine so boot-time events are captured.
initAppLogging();

// …then hang Sentry's breadcrumb sink off the logger `initAppLogging` just
// configured (it replaces the logger, so this cannot run any earlier). Every
// structured line from here on becomes a breadcrumb attached to a crash.
attachCrashBreadcrumbs();

// Single app-wide persistence adapter. Created once at module load; the
// `preload()` call below populates its in-memory cache from AsyncStorage
// before `<GameStoreProvider>` mounts. Tests bypass this entirely via
// the provider's `adapter` / `store` props.
const persistenceAdapter = createAsyncStorageAdapter();

// State-fixture boot (2026-09-07, `state/fixtures.ts`): when a dev build
// is asked for a fixture (`?fixture=<id>` or `__AXM_FIXTURE__`), the
// store boots from that compiled state through an in-memory adapter —
// the AsyncStorage slot is neither read into the store nor written to.
// `null` on every normal launch, so production is byte-for-byte the
// old path.
const bootFixture = resolveBootFixture();
const storeAdapter = bootFixture ? createFixtureBootAdapter(bootFixture.state) : persistenceAdapter;

function RootLayout() {
  // Load core fonts only - reduces initial font bundle by ~40%
  const [fontsLoaded] = useFonts({
    PirataOne_400Regular,
    IMFellEnglish_400Regular,
    IMFellEnglish_400Regular_Italic,
  });
  
  // Asynchronously load decorative fonts after app starts
  const [secondaryFontsLoaded, setSecondaryFontsLoaded] = useState(false);
  
  const [preloaded, setPreloaded] = useState(false);
  const [corruptSave, setCorruptSave] = useState(false);

  useEffect(() => {
    let cancelled = false;
    persistenceAdapter
      .preload()
      .catch((err: unknown) => {
        // Q7=A on Spec 09: surface "save corrupted — start new game?" to
        // the user. Phase 53 wires the user-facing CorruptSaveModal; the
        // console.warn stays as a dev breadcrumb so the failure shows up
        // in Metro logs alongside the modal mount.
        if (__DEV__) {
          console.warn('[persistence] preload failed; surfacing modal', err);
        }
        getLogger().warn('persistence', 'preload-failed', {
          message: err instanceof Error ? err.message : String(err),
        });
        if (!cancelled) setCorruptSave(true);
      })
      .finally(() => {
        if (!cancelled) setPreloaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onCorruptConfirm = useCallback(() => {
    // Clear the corrupt slot + drop the modal. The provider boots a fresh
    // `createNewGameState` because the persistence cache is now null.
    getLogger().info('persistence', 'corrupt-save-cleared');
    persistenceAdapter.clear().catch((err: unknown) => {
      if (__DEV__) {
        console.warn('[persistence] clear failed after corrupt-save confirm', err);
      }
      getLogger().error('persistence', 'corrupt-save-clear-failed', {
        message: err instanceof Error ? err.message : String(err),
      });
    });
    setCorruptSave(false);
  }, []);

  const onCorruptCancel = useCallback(() => {
    // Keep the modal mounted so the user can troubleshoot / reach support.
    // No-op intentionally — the modal stays visible until they choose
    // Confirm or close the app.
  }, []);

  // Load secondary fonts after the app starts (non-blocking)
  useEffect(() => {
    if (fontsLoaded && preloaded) {
      SplashScreen.hideAsync();
      
      // Load decorative fonts asynchronously after startup
      import('expo-font').then(({ loadAsync }) => {
        loadAsync({
          BebasNeue_400Regular,
          JetBrainsMono_400Regular,
        }).then(() => {
          setSecondaryFontsLoaded(true);
        }).catch((err) => {
          // Fallback gracefully - app works without decorative fonts
          if (__DEV__) {
            console.warn('[fonts] secondary fonts failed to load', err);
          }
        });
      }).catch((err) => {
        if (__DEV__) {
          console.warn('[fonts] expo-font import failed', err);
        }
      });
    }
  }, [fontsLoaded, preloaded]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // Best-effort: phones using gesture nav already hide the system bar,
    // but on devices with the legacy 3-button nav this drives it offscreen
    // until the user swipes from the bottom edge.
    NavigationBar.setVisibilityAsync('hidden').catch(() => undefined);
  }, []);

  // Deep linking is declared in `app.json` (`scheme: "axiomancer"`)
  // but **not yet wired to navigation**. A handler was scaffolded
  // here pre-Phase 8 and removed in critique-pass-1 close-out
  // because both branches were no-ops — keeping a subscription that
  // does nothing was actively misleading. When deep-linking is
  // wired, register the subscription here, look up the route from
  // `Linking.parse`, and call `router.replace(...)` (the router
  // must come from `useRouter()` rendered below the `<Stack>`
  // boundary, so the handler likely belongs in a child component,
  // not in this root layout).

  if (!fontsLoaded || !preloaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CorruptSaveModal
        visible={corruptSave}
        onConfirm={onCorruptConfirm}
        onCancel={onCorruptCancel}
      />
      <PrevSessionCrashPrompt />
      <GameStoreProvider adapter={storeAdapter}>
        {/* ErrorBoundary mounts INSIDE the GameStoreProvider so
            the fallback ErrorScreen can read engine state via
            useGameState for the debug snapshot (filed via
            user-jot 2026-05-22 oversight 29th). */}
        <ErrorBoundary>
          <FontProvider secondaryLoaded={secondaryFontsLoaded}>
          <AestheticModeProvider>
          <CombatModeProvider>
          <TooltipProvider>
            {/* PLAYTEST_BUGS_2026-09-18 BUG-02: a returning player's very
                first paint is `<Redirect href="/exploration">` (no title
                screen to click through), which could fire BEFORE this
                container attached. `dispatchTo` dropped it silently and
                `Redirect`'s effect — keyed only on `[href]` — could never
                re-run, so the app sat on a blank screen forever. The router
                now queues that request; `onReady` is where it gets replayed. */}
            <NavigationContainer
              ref={navigationRef}
              linking={linking}
              onReady={flushPendingNavigation}
            >
              <StatusBar barStyle="light-content" />
              <HardwareBackHandler />
              <NavLogger />
              <EventGate />
              <HazardGate />
              <RestGate />
              <CacheGate />
              <BlacksmithGate />
              <ToastHost />
              {/* PLAYTEST_BUGS_2026-09-18 BUG-03: the app had no save-on-exit
                  of any kind, and the adapter's 500ms write debounce could eat
                  even a legitimate checkpoint if the player closed inside it.
                  This takes a final save and flushes it on background/pagehide. */}
              <SaveOnExit adapter={storeAdapter} />
              <DevAutoSeed />
              <FixtureBoot />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" component={TabLayout} options={{ headerShown: false }} />
                <Stack.Screen name="index" component={IndexScreen} options={{ headerShown: false }} />
                <Stack.Screen
                  name="event/index"
                  component={EventScreen}
                  options={{ headerShown: false, presentation: 'fullScreenModal' }}
                />
                <Stack.Screen
                  name="hazard/index"
                  component={HazardScreen}
                  options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="combat-encounter/index"
                  component={CombatEncounterScreen}
                  options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="hazard-deck/index"
                  component={HazardDeckScreen}
                  options={{ headerShown: false, presentation: 'fullScreenModal' }}
                />
                <Stack.Screen
                  name="rest/index"
                  component={RestScreen}
                  options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="cache/index"
                  component={CacheScreen}
                  options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="blacksmith/index"
                  component={BlacksmithScreen}
                  options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="village/index"
                  component={VillageScreen}
                  options={{ headerShown: false, presentation: 'fullScreenModal' }}
                />
                <Stack.Screen
                  name="dialogue/index"
                  component={DialogueScreen}
                  options={{ headerShown: false, presentation: 'fullScreenModal' }}
                />
                <Stack.Screen
                  name="cutscene/index"
                  component={CutsceneScreen}
                  options={{ headerShown: false, presentation: 'fullScreenModal' }}
                />
                <Stack.Screen
                  name="dev/index"
                  component={DevToolsScreen}
                  options={{ headerShown: false, presentation: 'fullScreenModal' }}
                />
                <Stack.Screen
                  name="labyrinth/index"
                  component={LabyrinthScreen}
                  options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="devart/index"
                  component={DevArtGallery}
                  options={{ headerShown: false, presentation: 'fullScreenModal' }}
                />
                <Stack.Screen
                  name="devart/rooms"
                  component={DevRoomGallery}
                  options={{ headerShown: false, presentation: 'fullScreenModal' }}
                />
                <Stack.Screen
                  name="devaftermath/index"
                  component={DevAftermathPanel}
                  options={{ headerShown: false, presentation: 'fullScreenModal' }}
                />
              </Stack>
            </NavigationContainer>
          </TooltipProvider>
          </CombatModeProvider>
          </AestheticModeProvider>
          </FontProvider>
        </ErrorBoundary>
      </GameStoreProvider>
    </GestureHandlerRootView>
  );
}

// Wrapped so Sentry sees render errors and the native lifecycle. A plain
// passthrough when reporting never started (web, or no DSN configured).
export default withCrashReporting(RootLayout);
