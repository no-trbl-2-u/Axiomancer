# Phase 47b — Navigation: `expo-router` → a bare-RN router

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document any judgment calls in the commit body.

## Outcome / Why

The build-plan row: *"Navigation: `expo-router` → a bare-RN router
(react-navigation the obvious candidate). The single biggest coupling
— file-based routes under `app/` become explicit route config, and
every route in the locked URL/route contract must still resolve. Do
this alone; it will touch every screen. (mobile) Deps: 47a."*

Phase 47a built the seam (`lib/platform/router.ts`, every call site
routed through it). This phase is the swap the seam existed for:
`lib/platform/router.ts` is now `@react-navigation/native` +
`native-stack` + `bottom-tabs` (the bare-RN libraries expo-router
itself is built on) instead of a re-export of `expo-router`. The
app's own bootstrap moves off `expo-router/entry` to a plain
`registerRootComponent` entry — genuine decoupling requires this too
(see "Decisions"): `expo-router/entry` provides its own
`NavigationContainer` + file-tree-driven linking that a
react-navigation-backed `<Stack>` rendered underneath it can't
correctly participate in.

## Design

**Compat-shim, not a rewrite of call sites.** `expo-router`'s own
`<Stack>`/`<Tabs>` are thin wrappers over exactly
`createNativeStackNavigator()` / `createBottomTabNavigator()`, with
`.Screen` attached to the Navigator component. `lib/platform/router.ts`
reproduces that shape, so `_layout.tsx` JSX needed no restructuring
beyond adding a `component` prop to every `Stack.Screen`/`Tabs.Screen`
— there's no more file-tree auto-discovery to resolve a screen from a
bare `name`.

**Route table.** Every `router.push('/segment')` /
`<Redirect href="/segment">` call site inherited its path strings from
the expo-router file-tree era. `lib/platform/router.ts`'s
`ROUTE_TABLE` is the one place that now owns segment → registered
screen `name` resolution (`'hazard' → 'hazard/index'`,
`'exploration' → { screen: 'exploration/index', tab: true }`, etc.) —
so none of the ~25 push/back/Redirect call sites needed edits.

**Root-scoped imperative handle.** `useRouter()` dispatches through a
module-level `navigationRef` (`createNavigationContainerRef`) rather
than `useNavigation()` — expo-router's `router.push()` is root-scoped
in practice (pushing from inside a tab screen pushes onto the outer
stack, not the tab's own navigator); a container ref reproduces that
without walking `navigation.getParent()` chains from arbitrary call
depths, and works from components that render outside any Screen
(the `*Gate.tsx` side-effect components, `NavLogger`).

**Linking config mirrors the route table exactly** (segment → URL
path), so a fresh page load at `/character`, `/hazard`, etc. still
resolves on web — this is the "locked URL/route contract" the build
plan row calls out, now enforced by `NavigationContainer`'s own path
matching instead of expo-router's `require.context` file discovery.

## Routes / endpoints / CLI surface (locked in `bearings.md`)

No route strings changed. Three routes that existed as real files
under `app/` but had **no explicit `<Stack.Screen>` in `_layout.tsx`**
(they worked before only because expo-router auto-registers every
file under `app/` regardless of whether `_layout.tsx` customizes it)
now have one, matching `state/e2e/route-tree.engine.test.ts`'s pinned
file set:

- `devart/index` (`/devart`) — dev-only enemy-art gallery
- `devart/rooms` (`/devart/rooms`) — dev-only Aporia room gallery
- `devaftermath/index` (`/devaftermath`) — dev-only aftermath-panel
  gallery

All three are gated by `isDevToolsEnabled()` internally (unchanged);
this phase only makes them reachable at all under the new explicit
registration model, closing a latent gap the old implicit
auto-discovery papered over.

## Content / data reads

None — no engine/content reads touched.

## Components / handlers

**Rewritten:** `lib/platform/router.ts` — see "Design" above. Exports:
`NavigationContainer`, `Stack`, `Tabs`, `linking`, `navigationRef`,
`useRouter`, `useLocalSearchParams`, `usePathname`, `Redirect`.

**New:** `index.ts` (repo root of `axiomancer-mobile/`) — the app
entry point. `registerRootComponent(RootLayout)` from `expo`; replaces
`expo-router/entry`.

**Modified:**
- `app/_layout.tsx` — imports every root-level screen component
  (`app/*/index.tsx`, `app/devart/rooms.tsx`) and passes it as each
  `Stack.Screen`'s `component` prop; wraps the tree in
  `<NavigationContainer ref={navigationRef} linking={linking}>`.
  `<GestureHandlerRootView>` stays the outermost wrapper (unchanged —
  `state/e2e/route-registration.engine.test.ts` pins this).
- `app/(tabs)/_layout.tsx` — same `component` prop addition for the
  four tab screens. The `href: null` / `href: undefined` tab-lock
  mechanism (encounter-modal defense-in-depth, phase 63c/63d) has no
  react-navigation equivalent property — replaced with
  `tabBarButton: () => null` (hides the tab's touch target) +
  `listeners={{ tabPress: (e) => lockOtherTabs && e.preventDefault() }}`
  (blocks a residual press), reproducing the same "can't navigate
  here while locked" contract. `tabBarStyle`'s `display: 'none'`
  during the modal (unchanged) already hides the whole bar visually;
  this is the same belt-and-suspenders layer `href: null` was.
- `package.json` — `"main"`: `"expo-router/entry"` →
  `"index.ts"`.
- `app.json` — `web.output`: `"static"` → `"single"`. Per-route
  static HTML export is an expo-router-only feature (it walks the
  route tree at build time); without expo-router driving it, `"single"`
  (SPA bundle, client-side-routed) is the standard bare-RN-web output
  mode. See "Decisions" for why this doesn't break the
  export-dependent e2e/smoke tooling.
- `lib/platform/__tests__/boundary.test.ts` — `router.ts` exempted
  from the "every lib/platform/* file re-exports exactly one
  expo-* package" assertion (it's react-navigation-backed now, not a
  re-export at all); the "nothing outside lib/platform/ imports
  expo-* directly" assertion is unchanged and still holds.
- `state/e2e/route-tree.engine.test.ts` — rewritten. The old test
  pinned expo-router's `require.context` file-discovery regex, which
  no longer runs anything. Replaced with a guard on the *new*
  mechanism: every `app/*.tsx` route file must have a matching
  `<Stack.Screen>`/`<Tabs.Screen>` registration (with a `component`
  prop) in the relevant `_layout.tsx`, and vice versa (catches stale
  registrations pointing at deleted files).
- 27 test files' `jest.mock('expo-router', ...)` → `jest.mock('@/lib/platform/router', ...)`
  (mechanical rename; every mock's shape already matched the shim's
  exported symbols — see "Decisions").
- `state/e2e/cross-screen-integration.engine.test.tsx` — its `href`
  assertions (`character/index`'s Tabs.Screen lock state) now assert
  `tabBarButton` instead, matching the `_layout.tsx` mechanism change
  above.
- `scripts/{hazard,gathering,encounter-routing,loot-rarity,audit-capture}
  -e2e.mjs` (`gathering-e2e.mjs` has two call sites) — one-line
  `page.addInitScript(() => { globalThis.__AXM_FORCE_DEV_TOOLS__ = true })`
  added before each `page.goto('/character')` that leads into
  dev-only UI. Necessary consequence of the `web.output: "single"`
  decision above, not a routing change — see "Decisions" for the full
  A/B-tested finding.

## Cross-links

**In:** none (internal routing-implementation change, not a new
user-facing surface).

**Out:** none.

**Retro-fit:** none.

## Output schema / contracts

No save-data or engine contract changes. `useLocalSearchParams<T>()`
keeps its generic-typed-return call shape
(`useLocalSearchParams<{ tutorial?: string }>()` in
`combat-encounter/index.tsx`) — implementation is `useRoute().params
as T`, same string-valued query-param behavior as before.

## Composition

N/A — no new UI, no visual change. Screen components are unchanged;
only how they're mounted (explicit `component` prop vs. file-tree
resolution) and how routing dispatches (react-navigation vs.
expo-router) changed.

## Empty / loading / error states

N/A — zero screen-level behavior change.

## Decisions made upfront — DO NOT ASK

- **`usePathname()` cannot use `useNavigationState()` — discovered via
  a real browser e2e run, not just unit tests.** `useNavigationState`
  needs `NavigationStateListenerContext`, which a Navigator provides
  to its own screen subtree, not `NavigationContainer` itself.
  `NavLogger` (this hook's only caller) renders as a *sibling* of
  `<Stack>`, not inside it — using `useNavigationState` there crashed
  every screen through the `ErrorBoundary` ("Couldn't get the
  navigation state. Is your component inside a navigator?") on every
  real page load, while the mocked-router unit-test suite stayed
  green throughout (the mock replaces the whole hook, so it can't
  catch a real react-navigation context requirement). Fixed by
  subscribing directly to `navigationRef.addListener('state', ...)` +
  `navigationRef.getRootState()` instead — the same root-scoped,
  context-free pattern `useRouter()` already uses. Caught by manually
  driving `expo export --platform web` output through Playwright at
  several routes (`/`, `/character`, `/inventory`, `/exploration`,
  `/memoir`, `/labyrinth`, `/hazard-deck`, `/combat-encounter`) before
  trusting the change — the full mocked-router unit suite (2816
  tests) stayed green through both the broken and fixed versions.
- **`web.output: "single"` breaks `isDevToolsEnabled()`'s
  `Constants.expoConfig.extra` read for every e2e harness that reaches
  dev-only UI (SELF → DEV TOOLS → `/dev` → Debug* buttons) — fixed at
  the harness level, not the app level.** Confirmed by A/B testing the
  exact same `self-dev-tools-link` wait against the pre-47b
  `expo-router` + `output: "static"` build (renders fine, no escape
  hatch needed) vs. this phase's bare-RN + `output: "single"` build
  (never renders — confirmed via `page.evaluate` that `__DEV__` is
  `false` and `Constants.expoConfig?.extra` doesn't carry
  `devToolsEnabled` in either build's *export*, yet the original
  still rendered the dev-tools link — something in expo-router's own
  static-export path made `extra` resolve that a bare `single`-output
  export doesn't reproduce). `lib/buildProfile.ts` already anticipated
  exactly this gap and ships the escape hatch
  (`globalThis.__AXM_FORCE_DEV_TOOLS__ = true` via `page.addInitScript`)
  — 3 of the 9 e2e scripts that reach dev-only UI
  (`combat-round-e2e.mjs`, `exploration-combat-roundtrip-e2e.mjs`,
  `upgradeable-dice-e2e.mjs`) already set it defensively; this phase
  adds the same one-line `addInitScript` call to the other 6
  (`hazard-e2e.mjs`, `gathering-e2e.mjs` — 2 call sites,
  `encounter-routing-e2e.mjs`, `loot-rarity-e2e.mjs`,
  `audit-capture.mjs`), verified by re-running every CI-gating
  `e2e:*` script end-to-end (`e2e:hazard`, `e2e:gathering`,
  `e2e:encounters`, `e2e:combat`, `e2e:combat-round`) against a fresh
  export until each passed clean. `e2e:combat` needed no fix (drives
  `/combat-encounter` directly, never touches dev-only UI). `e2e:loot`
  still fails on an unrelated pre-existing assertion (uncommon-rarity
  affix count) — confirmed via the same A/B test against pre-47b code,
  same failure, not a regression, not CI-gating; left alone.

- **The entry point (`"main"`) had to change too, not just the
  `Stack`/`Tabs` import source.** `expo-router/entry` renders
  `<ExpoRoot>`, which owns its own `NavigationContainer` + file-tree
  linking. Leaving `"main": "expo-router/entry"` while swapping only
  `lib/platform/router.ts`'s `Stack`/`Tabs` implementation would nest
  a react-navigation-backed navigator *inside* expo-router's outer
  container — URL/deep-link resolution on a fresh load would still be
  driven by expo-router's file-tree resolver, which knows nothing
  about the inner navigator's explicit screen names. Only a real
  entry-point swap (`registerRootComponent` + the shim's own
  `NavigationContainer`) is genuine decoupling, and it's squarely
  "Navigation: expo-router → a bare-RN router" scope, not 47e's build
  tooling scope (jest preset / linter / dev-server wrapper / EAS).
- **`app.json`'s `web.output: "static"` → `"single"` is a necessary
  consequence of the entry swap, not a 47e build-tooling re-platform.**
  Per-route static HTML export is an expo-router-only feature (it
  walks the route tree expo-router itself resolves); without
  expo-router driving the build, `"static"` mode has nothing to
  enumerate. Verified this doesn't break the CI-gating
  `smoke:bundler` (`scripts/smoke-bundler.mjs`, part of
  `verify-mobile.yml`) — it only asserts `index.html` exists and is
  non-trivially sized, which SPA output satisfies. Verified it doesn't
  break the `e2e:*` Playwright harnesses either — every one of their
  local static file servers (`scripts/*-e2e.mjs`,
  `scripts/smoke-screens.mjs`) already falls back to serving
  `index.html` for any unmatched path (candidate[3] in
  `startStaticServer`/`resolveStaticExportPath`), which is exactly
  what SPA client-side routing needs — **zero server-routing changes
  needed in any e2e script**, confirmed by reading each one's
  static-server implementation before committing to this call. A
  *separate* consequence of the same `single`-output switch did need
  fixing: `isDevToolsEnabled()`'s `Constants.expoConfig.extra` read
  stops resolving the way it incidentally did under the old
  `static`-output export, so 6 scripts needed the
  `__AXM_FORCE_DEV_TOOLS__` opt-in `lib/buildProfile.ts` already
  documents — see the dedicated "Decisions" entry below and
  "Components / handlers" for the file list. Caught only by actually
  running the `e2e:*` scripts against a real export, not by reading
  code.
- **`app.json`'s `plugins: ["expo-router", ...]` and
  `experiments.typedRoutes` are left untouched.** Both are
  prebuild/codegen-time config (native EAS prebuild plugin
  registration; Metro typed-route codegen), not runtime concerns —
  neither is exercised by `npm run verify` or `smoke:bundler`. Native
  EAS builds are explicitly 47e's "EAS build path" scope and this
  session has no EAS credentials to verify a prebuild change against;
  touching them now would be scope creep into work I can't verify.
  Flagged as 47e residue.
- **`expo-router` stays an installed `package.json` dependency this
  phase**, unused at runtime. Uninstalling it is 47e's job (mirrors
  47a's precedent: package removals happen in the phase that owns the
  build/tooling layer, not the phase that stops using the package at
  runtime).
- **Tab-lock mechanism: `tabBarButton: () => null` + `tabPress`
  `preventDefault`, not a direct `href` port.** react-navigation's
  `BottomTabNavigationOptions` has no `href` property (it's an
  expo-router-only concept for web anchor-tag generation) — TypeScript
  rejects a straight port. The replacement reproduces the same
  observable contract (can't navigate to a locked tab, whether by
  touch or a residual dispatched action) via the officially
  recommended react-navigation pattern for conditionally disabling a
  tab. `state/e2e/cross-screen-integration.engine.test.tsx`'s
  lock-state assertions were updated to match (`tabBarButton` instead
  of `href`), preserving the same four scenarios (baseline unlocked /
  armed-locked / regression-pin locked / round-trip unlocked).
- **`LinkingOptions`/`navigationRef` are typed against
  `ParamListBase` (react-navigation's loose base type), not a
  hand-authored `RootParamList`.** expo-router's `experiments.typedRoutes`
  generated a `Href` union from the file tree; this migration
  deliberately doesn't reproduce that type-safety layer (the ~6
  `as never` casts already present at call sites like
  `router.push('/labyrinth' as never)` were expo-router typed-route
  workarounds — they still compile fine against the shim's plain
  `string` parameter type, so those call sites needed zero edits).
  Building a hand-maintained `RootParamList` covering all 22 screens
  is real but separable follow-up work, not required for this phase's
  scope (route resolution, not route type-safety).
- **`(tabs)` nested linking config uses `as unknown as
  LinkingOptions<ParamListBase>`.** `PathConfigMap<ParamListBase>`
  can't express a nested `screens` block generically (each key's
  value type is `object | undefined`, not a recursible ParamListBase)
  — this is react-navigation's own documented escape hatch for
  hand-authored nested linking config; the structural shape is still
  correct (verified against react-navigation's `LinkingOptions` docs
  and by exercising `usePathname()`/`Redirect` through it in tests).

## Mobile reflow / responsive

N/A — no UI change.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/platform/router.ts` | Covered transitively — every screen/component test that mocks `@/lib/platform/router` exercises the shim's exported shape | `state/e2e/route-tree.engine.test.ts` (rewritten registration guard) |
| `app/_layout.tsx` | `state/e2e/route-registration.engine.test.ts` (unchanged — source-grep pins `GestureHandlerRootView` outermost + tab route-ID form) | Existing `e2e:*` npm scripts unmodified |
| `app/(tabs)/_layout.tsx` tab-lock | `state/e2e/cross-screen-integration.engine.test.tsx` (updated: `tabBarButton` assertions) | — |
| 27 repointed test files | Existing suites (colocated `__tests__/`, `state/e2e/*`) — mock target renamed, assertions unchanged except the one lock-state case above | Existing `e2e:*` npm scripts unmodified |

## Verify gate

```bash
npm run verify --workspace axiomancer-mobile
npm run smoke:bundler --workspace axiomancer-mobile   # CI-gating (verify-mobile.yml) — proves expo export still boots post-entry-swap
npm run e2e:hazard --workspace axiomancer-mobile      # CI-gating — real browser playthrough, dev-tools-gated UI
npm run e2e:gathering --workspace axiomancer-mobile   # CI-gating — same
npm run e2e:encounters --workspace axiomancer-mobile  # CI-gating — same; this is the one that first caught both bugs below
npm run e2e:combat --workspace axiomancer-mobile      # CI-gating — no dev-tools dependency, sanity check only
npm run e2e:combat-round --workspace axiomancer-mobile # CI-gating — real card plays across 5 seeds
```

## Commit body template

```
refactor(mobile): expo-router -> react-navigation router swap — phase 47b

- Rewrite lib/platform/router.ts: react-navigation (native +
  native-stack + bottom-tabs)-backed useRouter/useLocalSearchParams/
  usePathname/Redirect/Stack/Tabs, same call-site shapes as the
  expo-router re-export it replaces
- Add index.ts entry point (registerRootComponent), retire
  expo-router/entry; package.json main + app.json web.output updated
- Wire explicit component props on every Stack.Screen/Tabs.Screen in
  app/_layout.tsx + app/(tabs)/_layout.tsx; register 3 previously
  implicit routes (devart/index, devart/rooms, devaftermath/index)
- Replace the href-based tab lock with tabBarButton + tabPress
  preventDefault (no react-navigation href equivalent)
- Repoint 27 test files' jest.mock('expo-router') to
  '@/lib/platform/router'; rewrite route-tree.engine.test.ts and
  boundary.test.ts for the new registration model
- Fix usePathname(): useNavigationState() needs a Navigator-subtree
  context NavLogger doesn't sit in — real browser e2e (not the mocked
  unit suite) caught every screen crashing to the ErrorBoundary on
  load; switched to the same navigationRef-based pattern useRouter()
  already uses
- Add the __AXM_FORCE_DEV_TOOLS__ addInitScript escape hatch
  (lib/buildProfile.ts's existing, previously-partial pattern) to the
  6 e2e scripts that reach dev-only UI and didn't already set it —
  web.output: single can't surface extra.devToolsEnabled the way the
  old static export incidentally could; caught by running every
  CI-gating e2e:* script for real, not just npm run verify

Decisions:
- Entry point swap included in this phase, not 47e — genuine
  expo-router decoupling requires it (see brief "Decisions")
- web.output: static -> single — static per-route export is an
  expo-router-only feature; verified via smoke:bundler + every
  CI-gating e2e:* script rather than assuming from reading code
- expo-router stays installed (unused) + app.json plugins/typedRoutes
  untouched this phase — both are 47e's build/tooling scope

Closes #<phase-issue-number>
```

## DoD

Flip Phase 47b's `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- 47c (`expo-image`/`expo-font` → bare-RN) unaffected by this phase —
  separate shim files, untouched.
- 47d (`expo-haptics`/`expo-constants`/`expo-linking`/
  `expo-splash-screen`/`expo-status-bar`/`expo-navigation-bar` →
  bare-RN) unaffected — separate shim files, untouched.
- 47e (build + CI re-platform) inherits: uninstalling the now-unused
  `expo-router` package; `app.json`'s `plugins: ["expo-router", ...]`
  and `experiments.typedRoutes` residue; whether `jest-expo`'s preset
  still needs to be `jest-expo` at all now that routing doesn't
  depend on it (probably not — a bare RN Jest preset likely suffices,
  but that's 47e's call to verify).
- A hand-authored `RootParamList` for full navigation type-safety
  (replacing the `ParamListBase` loose typing this phase deliberately
  used) is real but separable work — nothing in this phase regresses
  without it, since none of the ~25 push/Redirect call sites were
  typed-route-checked before either (they used `as never` escape
  hatches).
