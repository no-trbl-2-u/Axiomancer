# Phase 47c — Assets: `expo-image`, `expo-font` + `@expo-google-fonts/*` → bare-RN equivalents

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document any judgment calls in the commit body.

## Outcome / Why

The build-plan row: *"Assets: `expo-image`, `expo-font` +
`@expo-google-fonts/*` → bare-RN equivalents, preserving the existing
font-bundle splitting. (mobile) Deps: 47a."*

Shipped this phase: the `@expo-google-fonts/*` slice only. The
`expo-image` slice was attempted and reverted after `verify:visual`
caught a real regression (see "Decisions"); `expo-font` itself was
never in scope for the reason below. **Row stays `[-]` partial — see
"Follow-ups."**

## Design

**Fonts.** `@expo-google-fonts/pirata-one` / `im-fell-english` /
`bebas-neue` / `jetbrains-mono` are thin wrappers: each just
`require()`s a vendored `.ttf` under an exported key matching the
Google Fonts family name (`PirataOne_400Regular`, etc.). Those exact
five `.ttf` files (OFL-licensed) now live at
`axiomancer-mobile/assets/fonts/*.ttf`, vendored directly (license
text alongside, under `assets/fonts/LICENSES/`). `app/_layout.tsx`
`require()`s them locally instead of importing the npm packages; the
object keys handed to `useFonts({...})` are unchanged, since
`expo-font` keys a loaded font by the object's property name, not the
file name — every `theme/axm.ts` `fontFamily` string reference needed
zero edits. The core/decorative font-bundle split (3 fonts loaded
synchronously before first paint, 2 loaded async after via a
`loadAsync` dynamic import) is byte-for-byte unchanged; only the
asset *source* moved from an npm package to a local file.

**`expo-font` itself stays.** `lib/platform/font.ts` still re-exports
`useFonts` from `expo-font`. There is no native project (`ios/`,
`android/`) checked into this repo — the app is still Expo-managed,
prebuild-free, and 47e ("Build + CI re-platform") is the phase that
introduces one. `expo-font`'s runtime `useFonts`/`loadAsync` API is a
genuine Expo capability (load a bundled asset into the native text
renderer at runtime, no static native linking) with no bare-RN
equivalent that doesn't first require a native project to link fonts
into at build time. Swapping it now would mean either (a) inventing a
web-only + native-only dual code path this repo can't verify the
native half of (no device, no EAS credentials in this environment —
the only real end-to-end surface is the expo-web build), or (b)
blocking on 47e's prebuild landing first, which the build plan's own
dependency graph doesn't currently model (47c depends only on 47a).
Left as explicit carry-over rather than guessed at blind.

**`expo-image` was attempted, then reverted.** See "Decisions" — a
real, `verify:visual`-caught regression, not a hypothetical risk.

## Routes / endpoints / CLI surface (locked in `bearings.md`)

None — no route changes.

## Content / data reads

None.

## Components / handlers

**New:** `axiomancer-mobile/assets/fonts/{PirataOne_400Regular,
IMFellEnglish_400Regular, IMFellEnglish_400Regular_Italic,
BebasNeue_400Regular, JetBrainsMono_400Regular}.ttf` +
`assets/fonts/LICENSES/*_OFL.txt` (attribution, one per family).

**Modified:**
- `app/_layout.tsx` — `@expo-google-fonts/*` imports replaced with
  local `.ttf` `require()`s bound to the same variable names; the
  `useFonts({...})` and secondary `loadAsync({...})` call sites are
  otherwise untouched.
- `package.json` — the four `@expo-google-fonts/*` dependencies
  removed. `expo-image` / `expo-font` unchanged (see "Design").
- `state/e2e/app-routes.engine.test.tsx` — the four
  `jest.mock('@expo-google-fonts/...')` calls removed (nothing left
  to mock; jest-expo's asset-file transformer already resolves local
  `.ttf` `require()`s to a mock value, same as any other bundled
  asset). The `jest.mock('expo-font', ...)` mock is unchanged.

**Unchanged (reverted back to their pre-phase state):**
`lib/platform/image.ts` (still the `expo-image` re-export),
`lib/platform/__tests__/boundary.test.ts` (still guards
`expo-image` in `GUARDED_PACKAGES`).

## Cross-links

None — no new user-facing surface.

## Output schema / contracts

None.

## Composition / Empty / loading / error states

N/A — zero screen-level behavior change. The font-loading gate
(`fontsLoaded`/`preloaded` in `app/_layout.tsx`) is unchanged.

## Decisions made upfront — DO NOT ASK

- **`expo-image` swap attempted, then reverted — a real regression,
  not a hypothetical.** RN's core `Image` has no `contentPosition`
  (`object-position`) equivalent; 6 of the 10 `lib/platform/image.ts`
  call sites (title art, player portraits, labyrinth doors, the
  combat arena backdrop, the enemy figure) rely on it to anchor
  top/bottom instead of center-cropping. A custom wrapper was built —
  `Image.resolveAssetSource()` for the source's intrinsic size,
  `onLayout` for the rendered box, hand-computed scale + absolute
  positioning inside an `overflow: hidden` container, mirroring what
  CSS `object-fit`/`object-position` do. `npm run verify` (lint +
  typecheck + all 2816 Jest tests) passed clean against it — the bug
  was invisible to every hermetic check. Running the project's own
  `verify:visual` smoke gate (`npm run verify:visual` — boots the
  real expo-web export, screenshots key routes, diffs against
  committed baselines) caught it: the title screen rendered zoomed
  and cropped, wordmark cut off, **52.8% of pixels differing** from
  baseline (`screenshots/diff/root.png`, captured mid-session before
  the revert). Root cause not fully isolated (suspected `aspectRatio`
  + `position: absolute` + `onLayout` timing interaction on
  `react-native-web` specifically) — not worth guessing further
  blind. Reverted `lib/platform/image.ts` and
  `lib/platform/__tests__/boundary.test.ts` to their pre-phase state
  and restored the `expo-image` dependency rather than ship a change
  `npm run verify` alone couldn't have caught was broken. This is the
  argument *for* running `verify:visual` on any change touching
  rendered art, not just this phase's post-mortem.
- **Vendored `.ttf` bytes are byte-identical to the npm packages',
  copied directly from `node_modules/@expo-google-fonts/*` (not
  re-downloaded from Google Fonts).** Guarantees zero rendering
  difference from removing the wrapper packages — confirmed by
  `verify:visual` showing 0 diff attributable to fonts (the one
  remaining `root` diff after the `expo-image` revert is unrelated
  stale-baseline drift — see next bullet).
- **Found, not caused: `screenshots/baseline/root.png` predates the
  "modern steel" → "cold iron" title-tagline lexicon fix (issue #204,
  commit `0f408571`, 2026-08-14).** `verify:visual` still shows a
  0.712% `root` diff after the font swap alone (well below the
  52.8% the `expo-image` attempt produced, and confirmed unrelated to
  this phase by checking out this phase's changes and reading
  `components/TitleScreen.tsx` at `HEAD` directly: the subtitle
  already reads "cold iron," matching current source, not the
  baseline PNG's stale "modern steel"). `verify:visual` isn't part of
  the CI-gating `npm run verify` composition, so this doesn't block
  the phase, but it's real staleness worth a `baseline:approve` pass
  independent of this change — flagged, not fixed here (out of
  scope; a baseline regen should happen deliberately, reviewing every
  route's diff, not as a drive-by of an unrelated phase).
- **Phase marked `[-]` partial rather than `[x]`.** The build-plan
  row names three packages; one shipped clean (`@expo-google-fonts/*`
  vendoring), one is a documented, reasoned carry-over
  (`expo-font` itself — blocked on 47e's prebuild), and one was
  attempted and explicitly reverted with the failure mode on record
  (`expo-image`). Marking this `[x]` would overstate what shipped;
  `[-]` mirrors the vocabulary already used for V1-V3's carry-overs
  elsewhere in `01_build_plan.md`.

## Pages × tests matrix

| Surface | Unit tests | Visual |
|---|---|---|
| `app/_layout.tsx` font loading | `state/e2e/app-routes.engine.test.tsx` (mocks removed, still exercises the loading gate) | `verify:visual` `root` route (font rendering) |
| `lib/platform/*` boundary | `lib/platform/__tests__/boundary.test.ts` (unchanged — still guards `expo-image`) | — |

## Verify gate

```bash
npm run verify --workspace axiomancer-mobile     # lint + typecheck + 2816 Jest tests, all green
npm run verify:visual --workspace axiomancer-mobile  # non-gating; root diff is pre-existing baseline staleness (see Decisions)
```

## Commit body template

```
refactor(mobile): vendor @expo-google-fonts/* locally — phase 47c

- Vendor the 5 .ttf files (OFL-licensed) the 4 @expo-google-fonts/*
  packages wrapped into assets/fonts/, with license text alongside
- app/_layout.tsx requires them locally instead of importing the npm
  packages; useFonts()/loadAsync() call sites and the core/decorative
  font-bundle split are otherwise unchanged
- Remove the 4 @expo-google-fonts/* deps from package.json
- Drop the now-unused jest.mock('@expo-google-fonts/...') calls in
  state/e2e/app-routes.engine.test.tsx

Decisions:
- expo-image swap attempted (custom RN-core-Image wrapper reproducing
  contentPosition via resolveAssetSource + onLayout) and reverted —
  npm run verify passed clean but verify:visual caught a real 52.8%
  pixel-diff regression on the title screen (zoomed/cropped art,
  wordmark cut off). Root cause not fully isolated; reverted rather
  than ship guessed-at. lib/platform/image.ts and boundary.test.ts
  back to pre-phase state, expo-image dependency restored.
- expo-font itself carried over, not swapped — no native project
  (ios/android) exists yet to statically link fonts into (that's
  47e's prebuild); its runtime useFonts()/loadAsync() API has no
  bare-RN equivalent without one.
- Phase marked [-] partial, not [x] — one of three named packages
  shipped, one reverted-with-reason, one reasoned carry-over.
- Found (not caused): screenshots/baseline/root.png predates the
  "modern steel" -> "cold iron" tagline fix (issue #204); the 0.712%
  post-revert root diff is that staleness, not this change. Flagged,
  not fixed here — out of scope for this phase.

Closes #<phase-issue-number>
```

## DoD

Mark Phase 47c `[-]` (partial, not `[x]`) in `plan/steps/01_build_plan.md`,
append the commit hash, and carry the `expo-image` / `expo-font` residue
forward explicitly (see "Follow-ups").

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- **`expo-image` → bare-RN `Image`.** Real attempt on record
  (`lib/platform/image.ts`'s design + the `contentPosition` math) in
  this brief's "Decisions" — next attempt should either (a) root-cause
  the `aspectRatio`/`onLayout` timing bug on `react-native-web` before
  trusting the wrapper again, or (b) reach for a maintained,
  new-architecture-compatible community `Image` library with native
  `object-position` support instead of hand-rolling it, and either way
  gate the "done" call on `npm run verify:visual` passing clean, not
  just `npm run verify`.
- **`expo-font` → a true bare-RN (statically native-linked) font
  loader.** Blocked on 47e's prebuild introducing `ios/`/`android/`
  project folders to link fonts into; revisit once that lands, or
  resequence 47c-residue to depend on 47e explicitly if 47e ships
  first.
- **`screenshots/baseline/*.png` regen** — `root`'s baseline predates
  the "cold iron" tagline copy fix; a deliberate `baseline:approve`
  pass (reviewing every route's diff, not just `root`) should happen
  as its own small tick, not folded into an unrelated phase.
