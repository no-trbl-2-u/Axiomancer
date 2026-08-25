/**
 * The Expo-decouple seam for navigation. Phase 47a made this file the
 * single import site every application call site routes through;
 * phase 47b is the swap this seam existed for — the implementation
 * below is `@react-navigation/native` + `native-stack` + `bottom-tabs`
 * (the bare-RN libraries Expo Router itself is built on), not
 * `expo-router`. Every call site's shape (`useRouter().push('/x')`,
 * `<Stack.Screen name="x/index" />`, `useLocalSearchParams()`,
 * `usePathname()`, `<Redirect href="/x" />`) is preserved so app/*
 * and components/* needed no restructuring beyond `_layout.tsx`
 * gaining explicit `component` props (no more file-tree
 * auto-discovery to resolve them from).
 */
import { useEffect, useState } from 'react';
import {
  createNavigationContainerRef,
  StackActions,
  useRoute,
  type LinkingOptions,
  type NavigationState,
  type ParamListBase,
  type PartialState,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

export { NavigationContainer } from '@react-navigation/native';

// `<Stack>`/`<Tabs>` compat surface: expo-router's own versions are a
// thin wrapper over exactly these two factories, with `.Screen`
// attached to the Navigator component so `<Stack>...<Stack.Screen/>`
// JSX needs no restructuring. The file-tree auto-population expo-router
// added on top is gone — every screen the app has is now an explicit
// `<Stack.Screen name="..." component={...} />` in `app/_layout.tsx` /
// `app/(tabs)/_layout.tsx`.
const RootStack = createNativeStackNavigator();
export const Stack = Object.assign(RootStack.Navigator, { Screen: RootStack.Screen });

const RootTabs = createBottomTabNavigator();
export const Tabs = Object.assign(RootTabs.Navigator, { Screen: RootTabs.Screen });

// Every `router.push('/segment')` / `<Redirect href="/segment">` call
// site inherited its path strings from the expo-router file-tree era
// (e.g. `/hazard`, `/(tabs)/exploration`, `/combat-encounter?tutorial=1`).
// This table is the one place that now owns segment -> registered
// screen `name` resolution, so those call sites needed zero edits.
// `tab: true` entries live under the nested `(tabs)` navigator and
// resolve via a nested `navigate`, not a root Stack push (matching
// expo-router's own tab-link behavior — visiting a tab focuses it,
// it doesn't stack a second copy of the tab navigator).
type RouteEntry = { screen: string; tab: boolean };

const ROUTE_TABLE: Readonly<Record<string, RouteEntry>> = {
  '': { screen: 'index', tab: false },
  event: { screen: 'event/index', tab: false },
  hazard: { screen: 'hazard/index', tab: false },
  'combat-encounter': { screen: 'combat-encounter/index', tab: false },
  'hazard-deck': { screen: 'hazard-deck/index', tab: false },
  quest: { screen: 'quest/index', tab: false },
  rest: { screen: 'rest/index', tab: false },
  cache: { screen: 'cache/index', tab: false },
  blacksmith: { screen: 'blacksmith/index', tab: false },
  village: { screen: 'village/index', tab: false },
  dialogue: { screen: 'dialogue/index', tab: false },
  cutscene: { screen: 'cutscene/index', tab: false },
  dev: { screen: 'dev/index', tab: false },
  labyrinth: { screen: 'labyrinth/index', tab: false },
  devart: { screen: 'devart/index', tab: false },
  'devart/rooms': { screen: 'devart/rooms', tab: false },
  devaftermath: { screen: 'devaftermath/index', tab: false },
  exploration: { screen: 'exploration/index', tab: true },
  character: { screen: 'character/index', tab: true },
  memoir: { screen: 'memoir/index', tab: true },
  inventory: { screen: 'inventory/index', tab: true },
};

// `NavigationContainer`'s linking config — mirrors `ROUTE_TABLE`
// exactly (segment -> URL path). This is what makes a fresh page load
// at `/character`, `/hazard`, etc. resolve to the right screen on web
// (scripts/*-e2e.mjs and scripts/smoke-screens.mjs depend on exactly
// this — see phase 47b brief "Decisions" for why their static file
// servers needed zero changes). `prefixes: []` intentionally carries
// over today's behavior: native deep-linking via the `axiomancer://`
// scheme was never wired to navigation (see the removed handler note
// in `app/_layout.tsx`'s history) and stays that way here.
// `PathConfigMap<ParamListBase>` can't express a nested `screens` block
// generically (the generic param type per key is `object | undefined`,
// not a nested ParamListBase to recurse into) — the `as` below is the
// standard react-navigation escape hatch for hand-authored nested
// linking config; the shape itself is still checked structurally by
// `LinkingOptions`' outer fields (`prefixes`, `config.screens`).
export const linking = {
  prefixes: [],
  config: {
    screens: {
      index: '',
      'event/index': 'event',
      'hazard/index': 'hazard',
      'combat-encounter/index': 'combat-encounter',
      'hazard-deck/index': 'hazard-deck',
      'quest/index': 'quest',
      'rest/index': 'rest',
      'cache/index': 'cache',
      'blacksmith/index': 'blacksmith',
      'village/index': 'village',
      'dialogue/index': 'dialogue',
      'cutscene/index': 'cutscene',
      'dev/index': 'dev',
      'labyrinth/index': 'labyrinth',
      'devart/index': 'devart',
      'devart/rooms': 'devart/rooms',
      'devaftermath/index': 'devaftermath',
      '(tabs)': {
        screens: {
          'exploration/index': 'exploration',
          'character/index': 'character',
          'memoir/index': 'memoir',
          'inventory/index': 'inventory',
        },
      },
    },
  },
} as unknown as LinkingOptions<ParamListBase>;

// Root-scoped imperative handle. expo-router's `useRouter()` is also
// root-scoped in practice (`router.push('/village')` from a deeply
// nested tab screen pushes onto the outer stack, not the tab's own
// navigator) — a container ref reproduces that without needing to
// walk `navigation.getParent()` chains from arbitrary call depths.
export const navigationRef = createNavigationContainerRef<ParamListBase>();

function parseHref(href: string): { entry: RouteEntry | undefined; params?: Record<string, string> } {
  const [pathPart, queryPart] = href.split('?');
  let segment = pathPart.replace(/^\/+/, '').replace(/\/+$/, '');
  if (segment.startsWith('(tabs)/')) segment = segment.slice('(tabs)/'.length);
  const params = queryPart ? Object.fromEntries(new URLSearchParams(queryPart)) : undefined;
  return { entry: ROUTE_TABLE[segment], params };
}

function dispatchTo(href: string, mode: 'push' | 'replace'): void {
  if (!navigationRef.isReady()) return;
  const { entry, params } = parseHref(href);
  if (!entry) {
    if (__DEV__) console.warn(`[lib/platform/router] unknown route: ${href}`);
    return;
  }
  if (entry.tab) {
    navigationRef.navigate('(tabs)', { screen: entry.screen, params });
    return;
  }
  navigationRef.dispatch(
    mode === 'push' ? StackActions.push(entry.screen, params) : StackActions.replace(entry.screen, params),
  );
}

export function useRouter() {
  return {
    push: (href: string) => dispatchTo(href, 'push'),
    replace: (href: string) => dispatchTo(href, 'replace'),
    back: () => {
      if (navigationRef.isReady()) navigationRef.goBack();
    },
    canGoBack: () => navigationRef.isReady() && navigationRef.canGoBack(),
  };
}

export function useLocalSearchParams<T extends Record<string, unknown> = Record<string, string>>(): T {
  const route = useRoute();
  return (route.params ?? {}) as T;
}

type NavState = NavigationState | PartialState<NavigationState>;

function buildPath(state: NavState): string {
  const routes = state.routes;
  const index = state.index ?? routes.length - 1;
  const route = routes[index];
  return route.state ? `${route.name}/${buildPath(route.state)}` : route.name;
}

// `useNavigationState` needs `NavigationStateListenerContext`, which a
// Navigator provides to its own screen subtree — not `NavigationContainer`
// itself. `NavLogger` (this hook's only caller) renders as a sibling of
// `<Stack>`, not inside it, so it reaches for the same root-scoped
// `navigationRef` `useRouter()` already uses instead.
export function usePathname(): string {
  const [path, setPath] = useState(computeCurrentPath);
  useEffect(() => {
    setPath(computeCurrentPath());
    return navigationRef.addListener('state', () => setPath(computeCurrentPath()));
  }, []);
  return path;
}

function computeCurrentPath(): string {
  if (!navigationRef.isReady()) return '/';
  const state = navigationRef.getRootState();
  return state ? `/${buildPath(state)}` : '/';
}

export function Redirect({ href }: { href: string }): null {
  useEffect(() => {
    dispatchTo(href, 'replace');
  }, [href]);
  return null;
}
