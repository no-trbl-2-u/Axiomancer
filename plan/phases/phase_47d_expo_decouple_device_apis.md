# Phase 47d — Device APIs: `expo-haptics`, `expo-constants`, `expo-linking`, `expo-splash-screen`, `expo-status-bar`, `expo-navigation-bar` → bare-RN equivalents

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document any judgment calls in the commit body.

## Outcome / Why

The build-plan row: *"Device APIs: `expo-haptics` (→
react-native-haptic-feedback or similar), `expo-constants`,
`expo-linking`, `expo-splash-screen`, `expo-status-bar`,
`expo-navigation-bar`. Note Phase 38's juice layer already co-fires
haptics through a single wrapper — that wrapper was built as the
Expo-decouple swap point, so use it. (mobile) Deps: 47a."*

Two of six packages swap clean this phase: `expo-status-bar` →
React Native core's own `StatusBar`, and `expo-haptics` →
`react-native-haptic-feedback`. The other four carry over, each for a
documented reason (see "Design"). **Row stays `[-]` partial** — same
vocabulary 47c used for its own two-of-three split.

## Design

**`expo-status-bar` → React Native core `StatusBar` (clean swap).**
React Native ships `StatusBar` in core — no separate package, no
native autolinking, always present regardless of whether a native
project exists. Confirmed both `expo-status-bar`'s own web
implementation (`StatusBar.web.ts`) and `react-native-web`'s
`StatusBar` stub are byte-identical no-ops (`function StatusBar() {
return null; }`, every imperative setter a no-op) — so this swap is
zero-behavior-change on web, the only end-to-end-testable platform
here today. The one call site (`app/_layout.tsx`) moved
`style="light"` to the core component's `barStyle="light-content"`.

**`expo-haptics` → `react-native-haptic-feedback` (clean swap, web
verified, native unverified).** The build-plan row named this library
directly. Crucially, it ships its own `.web.js` implementation
(`hapticFeedback.web.js`) using the Web Vibration API
(`navigator.vibrate()`) — the *same* API `expo-haptics`' own
`ExpoHaptics.web.ts` already used (confirmed by reading both
sources), which is why every prior critique pass's "benign
`navigator.vibrate` autoplay warning" note stays true and unchanged
post-swap. Web behavior is a real, verified vibration call, not a
regression to silence — pulse durations are re-tuned (the two
libraries picked different millisecond values per feedback type) but
that's cosmetic, not a functional break; no test asserts exact
durations. The native path (an iOS/Android TurboModule,
`codegenSpec/NativeHapticFeedback.js`, calling
`TurboModuleRegistry.getEnforcing('RNHapticFeedback')`) is
**unverified** — no native project exists yet to run it against
(47e's prebuild). It also throws synchronously at import time under
Jest (no native module registered), which is why `jest.setup.ts` now
globally mocks `react-native-haptic-feedback` instead of
`expo-haptics`. Nothing regresses on the native path either: nothing
ran natively before this phase (no native project = no native
Haptics access already), so an unverified-but-real implementation is
strictly more than the pre-phase state, not less.

`lib/platform/haptics.ts` keeps the exact `Haptics.impactAsync(...)`
/ `Haptics.ImpactFeedbackStyle.Light` call-site shape every existing
caller already used (`import { Haptics } from
'@/lib/platform/haptics'`, unchanged since phase 47a) via a plain
object wrapping `trigger()` calls, with local enums matching
`expo-haptics`' exact string values (`ImpactFeedbackStyle.Light =
'light'`, etc.) mapped to `HapticFeedbackTypes` (`impactLight`, etc).
`Haptics` is now a plain object, not a namespace import, so this
resolved 47a's own documented Babel-interop workaround (the
`import * as Haptics from 'expo-haptics'; export { Haptics };` dance)
— that workaround existed only because `expo-haptics` was mocked as a
plain object literal with no `__esModule` flag; a hand-written plain
object needs no interop wrapper at all, and `jest.spyOn(Haptics,
'impactAsync')` (our own module's real export) works directly.

**Two call sites used `Haptics.ImpactFeedbackStyle` as a *type*
annotation** (`app/cache/index.tsx`, `app/blacksmith/index.tsx`,
`lib/juice/haptics.ts`) — valid when `Haptics` was a namespace import,
not valid for a plain `const` object (TS requires a namespace binding
for dotted type lookups). Those three files now import
`ImpactFeedbackStyle` / `NotificationFeedbackType` directly as named
types from `@/lib/platform/haptics` instead of writing
`Haptics.ImpactFeedbackStyle`. Every *value* call site
(`Haptics.impactAsync(...)`, `Haptics.ImpactFeedbackStyle.Light` as a
value) needed zero edits — plain property access works identically on
an object as it did on a namespace.

**`expo-constants` carries over.** `lib/buildProfile.ts` reads
`Constants.expoConfig?.extra` — extras that `app.config.ts` populates
from `EAS_BUILD_PROFILE`/`BUILD_PROFILE` at Expo's own build time and
`expo-constants` exposes at runtime via Expo's manifest system. There
is no bare-RN equivalent that doesn't first mean touching how
`app.config.ts` is built and read — explicitly 47e's "Build + CI
re-platform" scope per both 47a's and 47b's Decisions ("`app.config.ts`
is prebuild/codegen-time config... 47e's scope, not this seam").
Swapping the consumption side alone, without a replacement production
mechanism for `extra`, isn't a real swap — it's a guess. Mirrors
`expo-font`'s exact 47c carry-over reasoning.

**`expo-linking` carries over trivially — still zero call sites.**
47a's inventory found zero direct app-source imports (transitive
`expo-router` dependency only); re-confirmed here after 47b's full
`expo-router` → `@react-navigation/*` rewrite (its `linking` export in
`lib/platform/router.ts` is a hand-authored plain object, not
`expo-linking`-backed). Nothing to swap. The `package.json` dependency
itself stays installed, mirroring 47b's own precedent for
`expo-router` (kept installed, unused at runtime, because `expo-router`
package removal is bundled with 47e's build/tooling layer, not the
phase that stopped using it) — `expo-linking` is `expo-router`'s own
dependency, and `expo-router` is still installed this phase.

**`expo-splash-screen` and `expo-navigation-bar` carry over — both
are `app.json` prebuild config plugins with no native project to
bind to.** Both are registered under `app.json`'s `"plugins"` array
with native-build-time config (splash image/backgroundColor/resize
mode; nav-bar position/visibility/behavior) that only takes effect
via `expo prebuild` generating `ios/`/`android/` projects — which
don't exist yet (47e's job, same fact 47c's `expo-font` carry-over and
47b's `app.json` plugins Decision both already established). Their
*runtime* JS calls (`SplashScreen.preventAutoHideAsync()`/
`hideAsync()`, `NavigationBar.setVisibilityAsync('hidden')`) are
native-only concepts with no observable behavior on web (there is no
"splash screen" or "Android navigation bar" in a browser) — the one
platform this repo can end-to-end verify. A bare-RN library swap here
(e.g. `react-native-bootsplash`) would need the same native-project
binding `expo-splash-screen` needs today, so swapping the *package*
without a native project to test against would be a guess this repo
has already burned itself on once this session (47c's reverted
`expo-image` attempt — real regression, only `verify:visual` caught
it, and neither splash-screen nor nav-bar even have a web surface for
`verify:visual` to check). Left as explicit carry-over rather than
guessed at blind.

## Routes / endpoints / CLI surface (locked in `bearings.md`)

None — no route changes.

## Content / data reads

None.

## Components / handlers

**New dependency:** `react-native-haptic-feedback@3.0.0` (bare-RN,
`react-native >=0.71` peer dep, satisfied by this repo's `0.81.5`).

**Removed dependencies:** `expo-haptics`, `expo-status-bar` — no
build-tooling role (not an `app.json` plugin, unlike
`expo-splash-screen`/`expo-navigation-bar`/`expo-router`), so clean
removal now rather than deferred to 47e, mirroring 47c's
`@expo-google-fonts/*` removal.

**Modified:**
- `lib/platform/haptics.ts` — rewritten: `react-native-haptic-feedback`-backed,
  exports `Haptics` (plain object: `impactAsync`, `notificationAsync`,
  `selectionAsync`) plus top-level `ImpactFeedbackStyle` /
  `NotificationFeedbackType` enums (same string values as
  `expo-haptics`').
- `lib/platform/status-bar.ts` — re-exports `StatusBar` from
  `'react-native'` instead of `'expo-status-bar'`.
- `app/_layout.tsx` — `<StatusBar style="light" />` →
  `<StatusBar barStyle="light-content" />`.
- `app/cache/index.tsx`, `app/blacksmith/index.tsx`,
  `lib/juice/haptics.ts` — import `ImpactFeedbackStyle` /
  `NotificationFeedbackType` as named types instead of
  `Haptics.ImpactFeedbackStyle` / `Haptics.NotificationFeedbackType`.
- `package.json` — `expo-haptics`, `expo-status-bar` removed;
  `react-native-haptic-feedback` added.
- `jest.setup.ts` — `jest.mock('expo-haptics', ...)` →
  `jest.mock('react-native-haptic-feedback', ...)` (mocks `trigger` +
  `HapticFeedbackTypes`).
- `lib/juice/__tests__/haptics.test.ts` — spies on `Haptics` from
  `@/lib/platform/haptics` instead of importing `* as Haptics from
  'expo-haptics'` (the interop-wrapper workaround 47a documented no
  longer applies to a plain-object shim).
- `state/e2e/quest.screen.test.tsx` — same spy-source change; drops
  its file-local `jest.mock('expo-haptics', ...)` override (the global
  mock + `jest.spyOn` covers it).
- `components/hazard/__tests__/{HazardBoard,HazardOverlays}.test.tsx`
  — drop now-dead `jest.mock('expo-haptics', ...)` blocks (defensive,
  never asserted against).
- `components/hazard/__tests__/HazardIntroOverlay.test.tsx` — its one
  real assertion (`fires haptic feedback on mount`) now imports
  `Haptics` from `@/lib/platform/haptics` and spies on it instead of
  `require('expo-haptics')`.
- `lib/platform/__tests__/boundary.test.ts` — `haptics.ts` and
  `status-bar.ts` join `router.ts` in the "not a pure `expo-*`
  re-export" exemption list (same shape 47b established for
  `router.ts`).

**Unchanged:** `lib/platform/{constants,splash-screen,navigation-bar}.ts`
(still pure `expo-*` re-exports), `lib/juice/haptics.ts`'s public
`juiceHaptics.impact()`/`.notify()` API, every other of the 10
haptics call sites (all used `Haptics` as a *value*, needing zero
edits).

## Cross-links

None — no new user-facing surface.

## Output schema / contracts

None.

## Composition / Empty / loading / error states

N/A — zero screen-level behavior change on the one verifiable
platform (web). `<StatusBar />`'s pre- and post-swap web render both
resolve to a null-rendering no-op; haptics' web vibration calls fire
with the same triggers, re-tuned durations only.

## Decisions made upfront — DO NOT ASK

- **`react-native-haptic-feedback` added as a real dependency despite
  its native path being unverifiable in this environment.** The
  build-plan row named this library explicitly. Its web
  implementation is real, tested (`npm run verify` + `verify:visual`,
  both green, zero new diff beyond the pre-existing documented `root`
  staleness), and preserves `expo-haptics`' own web behavior in kind.
  Its native TurboModule path cannot regress anything — no native
  project exists to have been exercising haptics natively before this
  phase either. This is a decide-and-ship call per the autonomy
  contract, not a case for carrying the package over the way
  splash-screen/nav-bar do: haptics *does* have a testable surface
  here (unlike the other two, which are pure native-only concepts
  with zero web presence), so testing what's testable and shipping is
  the right call, not blocking on the untestable native half.
- **`expo-constants`, `expo-linking`, `expo-splash-screen`,
  `expo-navigation-bar` carry over, unattempted.** Each is blocked on
  a fact already established in 47a/47b/47c (no native project;
  `app.config.ts`/build-tooling explicitly owned by 47e), not a new
  discovery — re-attempting any of them without that groundwork would
  repeat 47c's `expo-image` mistake (a guess `npm run verify` alone
  can't validate). Phase marked `[-]` partial, matching 47c's own
  precedent for a split outcome.
- **`expo-haptics` and `expo-status-bar` dependencies removed this
  phase, not deferred to 47e.** Neither is an `app.json` plugin
  (unlike `expo-splash-screen`/`expo-navigation-bar`/`expo-router`,
  which register prebuild-time native config and so stay installed
  until the phase that owns prebuild), so there's no build-tooling
  role to preserve — clean removal now mirrors 47c's
  `@expo-google-fonts/*` removal, not 47b's `expo-router` carry-over.
- **`Haptics` changed from a namespace import to a plain object** —
  necessary consequence of no longer wrapping `expo-haptics`, and it
  actually *simplifies* the shim (47a's Babel-interop workaround, a
  ~15-line comment explaining a spy-visibility bug, is gone entirely;
  a plain object needs no such trick). The two call sites that used
  `Haptics.X` as a *type* (not a value) needed a one-line import
  change each — the smallest edit that keeps TypeScript happy, not a
  redesign.

## Mobile reflow / responsive

N/A — no UI change.

## Pages × tests matrix

| Surface | Unit tests | Visual |
|---|---|---|
| `lib/platform/haptics.ts` | `lib/juice/__tests__/haptics.test.ts` (rewritten spy source), 10 call-site component suites (unchanged assertions, e.g. `HazardIntroOverlay.test.tsx` rewritten spy source) | `verify:visual` `combat-encounter` route (haptic-adjacent UI unchanged) |
| `lib/platform/status-bar.ts` | `state/e2e/*` suites exercising `app/_layout.tsx` (unchanged assertions) | `verify:visual` `root` route (pre-existing 0.712% diff, unrelated — see Decisions) |
| `lib/platform/__tests__/boundary.test.ts` | Updated exemption list (3 files, was 1) | — |

## Verify gate

```bash
npm run verify --workspace axiomancer-mobile     # lint + typecheck + 2816 Jest tests, all green
npm run verify:visual --workspace axiomancer-mobile  # non-gating; 6/7 screens clean, root diff is pre-existing baseline staleness (see Decisions)
```

## Commit body template

```
refactor(mobile): expo-status-bar + expo-haptics -> bare-RN swap — phase 47d

- lib/platform/status-bar.ts: expo-status-bar -> React Native core
  StatusBar (no package, no autolinking, byte-identical web no-op)
- lib/platform/haptics.ts: expo-haptics -> react-native-haptic-feedback,
  the library the build-plan row named. Its .web.js ships the same
  navigator.vibrate() API expo-haptics' own web path used
- Haptics keeps its existing call-site shape (Haptics.impactAsync(...),
  Haptics.ImpactFeedbackStyle.Light) for every value call site; the 3
  sites using it as a TYPE now import ImpactFeedbackStyle /
  NotificationFeedbackType directly
- jest.setup.ts + 5 test files: haptics mocks/spies retargeted from
  expo-haptics to react-native-haptic-feedback / the lib/platform shim
- package.json: expo-haptics, expo-status-bar removed (no app.json
  plugin role); react-native-haptic-feedback added
- lib/platform/__tests__/boundary.test.ts: haptics.ts + status-bar.ts
  join router.ts's "not a pure expo-* re-export" exemption

Decisions:
- expo-constants/expo-linking/expo-splash-screen/expo-navigation-bar
  carry over unattempted — each blocked on facts 47a/47b/47c already
  established (no native project yet; app.config.ts/build-tooling is
  47e's scope). Phase marked [-] partial, not [x], mirroring 47c.
- react-native-haptic-feedback's native TurboModule path is
  unverified (no native project to run it against) but cannot
  regress anything that worked before (nothing ran natively pre-phase
  either); its web path is real and verified via npm run verify +
  verify:visual, both green.
- expo-haptics/expo-status-bar dependencies removed now (no app.json
  plugin role, unlike expo-router/expo-splash-screen/expo-navigation-bar
  which stay installed for 47e to remove).

Closes #<phase-issue-number>
```

## DoD

Mark Phase 47d `[-]` (partial, not `[x]`) in
`plan/steps/01_build_plan.md`, append the commit hash, and carry the
`expo-constants` / `expo-linking` / `expo-splash-screen` /
`expo-navigation-bar` residue forward explicitly (see "Follow-ups").

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- **`expo-constants` → a bare-RN config mechanism.** Needs 47e's
  `app.config.ts` re-platform to land first (or resequence this
  residue to depend on it explicitly) — there's no consumption-side
  swap without first deciding how `extra` gets produced without
  Expo's manifest system.
- **`expo-splash-screen` → a bare-RN splash library** (e.g.
  `react-native-bootsplash`). Needs 47e's `expo prebuild` to generate
  `ios/`/`android/` projects to bind native splash resources into
  first.
- **`expo-navigation-bar` → a bare-RN Android nav-bar library.** Same
  47e prebuild blocker as splash-screen.
- **`expo-linking` / `expo-router` package removal.** Bundled with
  47e's build/tooling layer per 47b's own precedent — `expo-linking`
  is `expo-router`'s dependency, removed together.
- **`react-native-haptic-feedback`'s native path** — first real
  verification opportunity is 47e's prebuild (or an EAS dev-client
  build once credentials exist). Until then this is the repo's first
  bare-RN native-module dependency added without a device/simulator
  to confirm against; flag it in 47e's own brief as a "verify this
  now that a native project exists" item.
