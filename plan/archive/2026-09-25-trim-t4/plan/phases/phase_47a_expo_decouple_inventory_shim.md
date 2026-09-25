# Phase 47a — Expo decouple: inventory + shim layer

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document any judgment calls in the commit body.

## Outcome / Why

The build-plan row: *"Decouple inventory + shim layer. Freeze an exact
inventory of every `expo-*` import site, then route each through a
thin local module (`lib/platform/*`-style) so the app depends on OUR
interface rather than Expo's directly. Zero behavior change, zero
dependency change — this is the seam that makes 47b-47e mechanical."*

`bearings.md`'s 2026-08-08 exception confirms scope: `expo-router`,
`expo-image`, `expo-font`, `expo-haptics`, `expo-constants`,
`expo-linking`, `expo-splash-screen`, `expo-status-bar`,
`expo-navigation-bar` are the rows scheduled to change across
47b-47e. Reanimated 4 / gesture-handler / rn-svg / screens /
safe-area-context are bare-RN already and carry over unchanged — not
touched here.

This phase ships **only the seam**, not any migration:
`lib/platform/*` re-export modules, one per package, and every
application-source import site repointed at them. No package is
added, removed, or upgraded; no runtime behavior changes.

**Inventory (frozen this phase, via `grep -rn "from ['\"]expo" --include="*.ts" --include="*.tsx" .`):**

| Package | App-source import sites | Symbols used |
|---|---|---|
| `expo-router` | 25 files (`app/**/index.tsx`, `app/_layout.tsx`, `app/(tabs)/**`, 8 `components/*Gate.tsx` + `Debug*.tsx`, `components/NavLogger.tsx`, `components/dev/DevToolsLink.tsx`) | `useRouter`, `useLocalSearchParams`, `usePathname`, `Redirect`, `Stack`, `Tabs` |
| `expo-image` | 8 files (`app/cache/index.tsx`, `components/exploration/MapCanvas.tsx`, `components/event/aftermath/CombatVictoryPanel.tsx`, `components/art/PlayerPortraitImage.tsx`, `components/labyrinth/RoomScene.tsx`, `components/TitleScreen.tsx`, `components/hazard/RewardsOverlay.tsx`, `components/combat/encounter/{CombatEncounterPanel,CombatCombatantPane,CombatBoard}.tsx`) | `Image` |
| `expo-haptics` | 10 files (`app/quest/index.tsx`, `app/cache/index.tsx`, `app/blacksmith/index.tsx`, `components/gathering/GatheringOverlays.tsx`, `components/hazard/{HazardIntroOverlay,HazardBoard,HazardOverlays}.tsx`, `components/combat/encounter/{RollingDie,CombatTutorialPrimer,CombatCombatantPane,CombatBoard}.tsx`, `lib/juice/haptics.ts`) | `* as Haptics` (namespace) |
| `expo-font` | 1 file (`app/_layout.tsx`) | `useFonts` |
| `expo-splash-screen` | 1 file (`app/_layout.tsx`) | `* as SplashScreen` |
| `expo-navigation-bar` | 1 file (`app/_layout.tsx`) | `* as NavigationBar` |
| `expo-status-bar` | 1 file (`app/_layout.tsx`) | `StatusBar` |
| `expo-constants` | 1 file (`lib/buildProfile.ts`) | default import `Constants` |
| `expo-linking` | **0 direct import sites** — a declared `package.json` dependency with no app-source call site (expo-router pulls it in transitively). Nothing to shim; the dependency itself carries over unchanged until 47b/47d touch it. |

Total: 49 non-test application-source files repointed. Zero engine
files touched (`axiomancer-mechanics` has no Expo dependency).

## Routes / endpoints / CLI surface (locked in `bearings.md`)

None new. Every existing route continues to resolve exactly as
today — `app/`'s file-based routing structure is untouched (that's
47b's job). This phase only changes *which module* each screen/
component imports router hooks/components from.

## Content / data reads

None — no engine/content reads touched.

## Components / handlers

New: `lib/platform/` — one thin re-export file per Expo package this
phase covers:

- `lib/platform/router.ts` — `export { useRouter, useLocalSearchParams, usePathname, Redirect, Stack, Tabs } from 'expo-router';`
- `lib/platform/image.ts` — `export { Image } from 'expo-image';`
- `lib/platform/haptics.ts` — `import * as Haptics from 'expo-haptics'; export { Haptics };` (see "Decisions" — this is the one file that isn't a bare re-export one-liner, for a Jest-interop reason)
- `lib/platform/font.ts` — `export { useFonts } from 'expo-font';`
- `lib/platform/splash-screen.ts` — `export * from 'expo-splash-screen';`
- `lib/platform/navigation-bar.ts` — `export * from 'expo-navigation-bar';`
- `lib/platform/status-bar.ts` — `export { StatusBar } from 'expo-status-bar';`
- `lib/platform/constants.ts` — `export { default } from 'expo-constants';`

Each file is a pure re-export — no logic, no wrapping. (The existing
`lib/juice/haptics.ts` wrapper, which already sits between combat
call sites and `expo-haptics` per the Phase 38 brief, now sources its
`Haptics` namespace from `@/lib/platform/haptics` instead of
`expo-haptics` directly — one link in the chain moves, its own public
API to `juiceHaptics` consumers is unchanged. Its own import changed
shape too: `import { Haptics } from '@/lib/platform/haptics'`, not
`import * as Haptics`; see "Decisions" for why.)

Modified: the 49 files in the inventory table — each gets its
`from 'expo-<pkg>'` specifier swapped to `from '@/lib/platform/<name>'`,
same imported symbols, same call sites, zero other changes.

## Cross-links

**In:** none (new internal modules, not user-facing).

**Out:** none.

**Retro-fit:** none — this is a pure import-graph change, not a
feature that existing screens link to.

## Output schema / contracts

No type/contract change. Every re-export preserves the upstream
package's exact type signature (`export { X } from 'pkg'` and
`export * from 'pkg'` both re-export the original types unmodified).

## Composition

N/A — no new UI, no visual change.

## Empty / loading / error states

N/A — zero behavior change. Every existing empty/loading/error path
is byte-identical at runtime; only the import graph moves.

## Decisions made upfront — DO NOT ASK

- **Test files keep importing the raw `expo-*` specifiers; only
  application source routes through `lib/platform/*`.** ~30 test
  files call `jest.mock('expo-router', ...)` / `jest.mock('expo-haptics', ...)`
  etc. and then `import { X } from 'expo-router'` to grab the mocked
  namespace for assertions. Jest's module registry mocks by resolved
  specifier, not by caller — mocking `'expo-router'` still intercepts
  the `require('expo-router')` inside `lib/platform/router.ts`
  because that's where the real import ultimately resolves, so
  application code routed through the shim keeps working against
  existing mocks with **zero test-file edits**. Changing the test
  files' own imports to point at the shim too would be needless
  churn for no behavioral gain (`jest.setup.ts`'s three global
  `expo-font`/`expo-splash-screen`/`expo-haptics` mocks are
  similarly unaffected). Verified by running the full suite after
  the swap — see Verify gate.
- **`app.config.ts`'s `import type { ExpoConfig } from 'expo/config'`
  is explicitly out of scope**, not an oversight. It's a build-time
  Node config file that Expo CLI / EAS read directly (never bundled
  into the app runtime) — its own re-platform is Phase 47e's "Build +
  CI re-platform" row, not this phase's runtime-import seam.
- **`expo-linking` gets no shim file.** Zero direct app-source import
  sites exist today (confirmed via inventory grep) — it's a
  transitive dependency of `expo-router` only. Adding a shim for a
  package nothing calls would be dead code; if a future phase adds a
  direct `Linking` call site, that phase adds `lib/platform/linking.ts`
  then.
- **`expo-haptics`'s shim is the one file that isn't a bare
  `export … from` re-export — it's `import * as Haptics from
  'expo-haptics'; export { Haptics };`, and every call site imports
  `{ Haptics }` (named) instead of `* as Haptics` (namespace).**
  Discovered mid-implementation via `lib/juice/__tests__/haptics.test.ts`
  going red: `jest.setup.ts` mocks `expo-haptics` with a plain object
  literal (no `__esModule`), so Babel's `import * as X` interop wraps
  it in a copied namespace object, cached by identity — and that's the
  object `jest.spyOn(Haptics, 'impactAsync')` mutates in the test file.
  `export … from` (both the `{ X }` and `*` forms) resolves the source
  module via a plain `require()` instead, which reads the *original*
  un-wrapped, un-spied module — so a spy set in the test never became
  visible to `juiceHaptics.impact()`, and the mock's
  `Promise.reject(...)` sat with no `.catch()` ever attached to it,
  crashing the whole Jest process as an unhandled rejection (not a
  normal assertion failure). Re-doing the shim as a namespace import
  + named re-export reuses the exact same Babel interop path (and its
  shared cache) that every pre-shim call site went through, so the
  spy stays visible end-to-end. Confirmed by reverting to a direct
  `expo-haptics` import as a baseline (passed), reproducing the
  failure with `export * from` and `export { X } from` alike, then
  fixing with this pattern (all three confirmed via `npx jest
  lib/juice/__tests__/haptics.test.ts`).
- **`lib/juice/haptics.ts` gets repointed too, not left untouched.**
  It already frames itself as "the Expo-decouple swap point" in its
  own docblock (Phase 38) but it still imported straight from
  `expo-haptics` — this phase is exactly the seam that comment was
  waiting for, so it moves like every other call site rather than
  being grandfathered as an exception.
- **No new dependency, no removed dependency, no version bump.**
  `package.json` is untouched this phase — 47b-47e are where actual
  package swaps happen.
- **`lib/platform/__tests__/boundary.test.ts` gets added to
  `state/e2e/hermeticity.audit.engine.test.ts`'s `FS_ALLOWLIST`,
  not left to fail that guard.** It reads committed source the same
  sanctioned way the existing route-tree/hermeticity guards do —
  the guard's own docstring calls growing the allowlist "a
  deliberate, reviewed act," and this is that act, done in the same
  commit as the file it's allowlisting.

## Mobile reflow / responsive

N/A — no UI change.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/platform/*` (8 new files) | New: `lib/platform/__tests__/boundary.test.ts` — file-scan guard (see below) | — |
| 49 repointed call sites | Existing suites (colocated `__tests__/`, `state/e2e/*`) must stay green unmodified — they assert behavior, not import paths | Existing `e2e:*` npm scripts unmodified |

**New guard test:** `lib/platform/__tests__/boundary.test.ts`, mirroring
`state/e2e/hermeticity.audit.engine.test.ts`'s committed-source file-scan
pattern. Walks `app/`, `components/`, `lib/`, `hooks/`, `state/`
(skipping `__tests__/`, `.test.ts(x)`, and `state/e2e/`), asserts zero
files outside `lib/platform/` and `app.config.ts` import
`expo-router` / `expo-image` / `expo-haptics` / `expo-font` /
`expo-splash-screen` / `expo-navigation-bar` / `expo-status-bar` /
`expo-constants` directly. This is the mechanical enforcement that
makes the seam durable — without it, a future PR could reintroduce a
direct `expo-*` import and nothing would catch it before 47b-47e
assume the seam is complete.

## Verify gate

```bash
npm run verify --workspace axiomancer-mobile
```

Full suite must stay green unmodified in assertions (only import
specifiers move); the new boundary test is the only new assertion
surface.

## Commit body template

```
refactor(mobile): expo-* import seam — lib/platform/* shim layer — phase 47a

- Add lib/platform/{router,image,haptics,font,splash-screen,
  navigation-bar,status-bar,constants}.ts — thin re-export modules,
  zero logic, preserving each package's existing call-site shape
- Repoint 49 application-source files (app/, components/,
  lib/buildProfile.ts, lib/juice/haptics.ts) from direct expo-*
  imports to the new lib/platform/* modules — zero behavior change
- Add lib/platform/__tests__/boundary.test.ts — file-scan guard
  enforcing no application source outside lib/platform/ (and
  app.config.ts) imports expo-* directly, so 47b-47e's swaps have a
  single seam to change instead of 49 scattered call sites

Decisions:
- Left test files' jest.mock('expo-*', ...) and their own expo-*
  imports untouched — Jest mocks by resolved specifier, so mocking
  survives the extra re-export hop with zero test-file edits
- app.config.ts's `expo/config` import stays untouched — build-time
  Node config read by Expo CLI/EAS directly, not bundled into the
  app; its re-platform is phase 47e's job, not this seam
- expo-linking gets no shim — zero direct app-source call sites exist
  today (transitive expo-router dependency only)
- lib/juice/haptics.ts repointed too — its own docblock already named
  itself "the Expo-decouple swap point," this phase is that swap

Closes #<phase-issue-number>
```

## DoD

Flip Phase 47a's `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- 47b (`expo-router` → bare-RN router) can now touch exactly one file
  per concern (`lib/platform/router.ts`) instead of 25 call sites.
- 47c (`expo-image`/`expo-font` → bare-RN) same seam benefit for 8 +
  1 files.
- 47d (`expo-haptics`/`expo-constants`/`expo-linking`/
  `expo-splash-screen`/`expo-status-bar`/`expo-navigation-bar` →
  bare-RN) same seam benefit for the remaining rows.
- 47e (build + CI re-platform: `jest-expo`, `expo lint`, EAS deploy
  path, `app.config.ts`) is untouched by this phase; it's a separate
  tooling layer, not an app-runtime import site.
```
