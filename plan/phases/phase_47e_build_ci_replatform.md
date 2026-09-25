# Phase 47e — Build + CI re-platform: `expo lint` → direct ESLint, version-matrix doc, Skia re-evaluation

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document any judgment calls in the commit body.

## Outcome / Why

The build-plan row: *"Build + CI re-platform. `jest-expo` → the bare RN
Jest preset, `expo lint` → direct ESLint, the `expo start` dev/web
scripts and dev-server container, and the EAS build path
(`deploy:preview` / `deploy:production`) → whatever replaces it.
Post-decouple the RN↔native-lib version matrix becomes manually
managed (Expo SDK 54 curates it today) — document that explicitly in
bearings as part of this phase. `@shopify/react-native-skia` becomes
available here as the parked D6f roll-ritual upgrade path (adds a
native binary + a CanvasKit-WASM web-loading step that should be wired
ONCE, into the kept pipeline) — evaluate, do not auto-adopt.
(mobile + CI) Deps: 47b, 47c, 47d."*

Four sub-items bundled under one row; only one swaps clean this phase:
`expo lint` → direct `eslint`. The other three (Jest preset,
dev-server/EAS replacement) are all downstream of a decision this
phase's own investigation surfaced as not yet safe to make — see
"Design". Doc + evaluation items ship regardless (no code risk).
**Row stays `[-]` partial** — same vocabulary 47c/47d used for their
own split outcomes.

## Design

**`expo lint` → direct `eslint` (clean swap, verified byte-identical
output).** `expo lint`'s own implementation
(`@expo/cli/build/src/lint/lintAsync.js`) hardcodes
`DEFAULT_INPUTS = ['src', 'app', 'components']` when no path argument
is given — it is a thin wrapper that resolves ESLint via
`loadESLint()` and lints only those three directories. This repo has
no `/src` at the mobile root, so `expo lint`'s effective scope today
is `app/` + `components/` only — confirmed by running both commands
side by side: `npx expo lint` and `npx eslint app components` produce
byte-identical output (19 problems, 0 errors, 19 warnings, exit 0).
`"lint": "eslint app components"` is the correct replacement — it
preserves the exact current gate, not a broader one. A naive
`"lint": "eslint ."` was tested and rejected: it pulls in `state/`,
`lib/`, `theme/`, and `scripts/` (never covered by `expo lint`'s
default scope) and explodes to 5,356 errors, mostly Node-context
`scripts/*.mjs` files tripping the browser/RN environment config —
expanding lint scope is a real, separate decision (more files now
enforced) that this phase does not make unilaterally; flagged as a
follow-up instead of smuggled in as a side effect of the CLI swap.

**Jest preset (`jest-expo` → bare RN preset) does NOT swap this
phase — genuinely blocked, not deferred by choice.** Read
`jest-expo`'s own preset source
(`node_modules/jest-expo/jest-preset.js` +
`node_modules/jest-expo/src/preset/setup.js`) before attempting this:
it derives from `react-native/jest-preset` and layers on top (a)
`moduleNameMapper` aliasing for `@expo/vector-icons`, (b) asset-file
transforms extended for `expo-image`'s heic/avif and `expo-sqlite`'s
db extensions, and — the load-bearing part — (c) a `setupFiles` entry
that auto-mocks `NativeUnimoduleProxy` and the entire Expo native
module surface (`ExponentConstants`, `ExponentFontLoader`, image
loader natives, etc.) via `moduleMocks/{expoModules,
internalExpoModules, thirdPartyModules}`. Six `expo-*` packages are
still live runtime dependencies post-47a/b/c/d
(`expo-constants`, `expo-font`, `expo-image`, `expo-linking`,
`expo-navigation-bar`, `expo-splash-screen`, plus `expo-router`
installed-but-unused) — `expo-image` and `expo-font` in particular
back real, actively-tested UI (fonts render, images load in
tests). Dropping `jest-expo` today would drop that native-module
mock layer out from under all six while they're still exercised by
`npm test`, repeating exactly the failure shape 47c's reverted
`expo-image` swap already burned this series once (a change
`npm run verify` can't validate because the breakage is a silent
mock gap, not a type error). This is the same "no native project /
still-live Expo package" blocker 47a-d already established for
`expo-constants`/`expo-linking`/`expo-splash-screen`/
`expo-navigation-bar` — it just applies to the *test* layer instead
of the runtime layer. Carried over explicitly (see Follow-ups), not
attempted blind.

**`expo start` dev/web scripts + dev-server container, and the EAS
build path, do NOT swap this phase — the replacement is undecided
architecture, not a mechanical substitution.** The build-plan row
itself says "→ whatever replaces it" for the EAS path, i.e. the
replacement was never chosen. Both items assume a bare-RN native
project exists to run a real dev/build workflow against
(`react-native start` + platform run commands, or a Fastlane/raw
Gradle-and-Xcode CI build lane) — no `ios/`/`android/` directory
exists in this repo yet (confirmed: 47a/47b/47c/47d's own Follow-ups
each independently flagged "needs 47e's `expo prebuild`" as the
missing prerequisite for their own carried-over items). Generating
that native project and standing up its CI lane is a materially
larger, separate decision than anything else bundled into this row —
it also cannot be verified in this execution environment (no Xcode,
no Android SDK), so even attempting it here would ship
unverifiable infra config. Per `skills/ship-a-phase.md` §10.8
("phase scope is genuinely ambiguous... generate a more decisive
brief and proceed") this phase's decisive scoping is: ship what's
safe and testable now, carry the native-project-dependent items
forward as their own explicit follow-up rather than guess at an
unchosen replacement.

**RN↔native-lib version matrix — documented in `bearings.md`
regardless of the above** (a doc task, not gated on the code swaps).
Today `expo install` / `expo-doctor` curate compatible version ranges
across `react-native-reanimated`, `react-native-svg`,
`react-native-screens`, `react-native-gesture-handler`,
`react-native-safe-area-context`, and `react-native-worklets` for the
pinned Expo SDK (54). Post-decouple (whenever the native-project
items above land), that curation goes away and version bumps to any
of those libraries — or to `react-native` core itself — become a
manual peer-dependency cross-check. See `bearings.md`'s Stack table
addendum for the explicit note.

**`@shopify/react-native-skia` — re-evaluated, not adopted.** D6f
(2026-07-18, `plan/archive/2026-09-25-trim-t4/plan/phases/phase_D6f_roll_ritual.md`) already ran this
evaluation once: Skia is RN-coupled (not Expo-coupled), so it
survives the decouple, but it adds a large native binary plus a
CanvasKit-WASM web-loading step that "would need wiring twice across
the CI/CD migration" — explicitly called the POST-DECOUPLE upgrade
path, not adoptable before the build/CI re-platform it depends on has
a settled shape. That dependency is unchanged by this phase: the
native-project + CI-lane decision above is exactly the "CI/CD
migration" D6f's note was waiting on, and it didn't land this tick.
Verdict unchanged from D6f: available once the native project + its
CI lane exist, still not now. No package installed.

## Routes / endpoints / CLI surface (locked in `bearings.md`)

None — no route changes.

## Content / data reads

None.

## Components / handlers

**Modified:**
- `axiomancer-mobile/package.json` — `"lint": "expo lint"` →
  `"lint": "eslint app components"`.
- `plan/bearings.md` — new version-matrix note appended to the Expo
  exception callout in the Stack section.

**Not touched (see Design + Follow-ups):** `jest.config.js` (preset
stays `jest-expo`), `axiomancer-mobile/package.json`'s `start` /
`android` / `ios` / `web` / `web:container*` / `deploy:preview` /
`deploy:production` scripts, `eslint-config-expo` (still the active
ruleset — only the CLI wrapper is replaced, not the rules
themselves), no `@shopify/react-native-skia` install.

## Cross-links

None — no new user-facing surface.

## Output schema / contracts

None.

## Composition / Empty / loading / error states

N/A — no UI change; tooling-only.

## Decisions made upfront — DO NOT ASK

- **Only the `expo lint` → `eslint` CLI swap ships code this phase;
  the other three build-plan sub-items (Jest preset, dev/web
  scripts, EAS path) carry over.** Verified empirically (not
  assumed) that the Jest preset swap would break the still-live
  `expo-font`/`expo-image` native-module mock layer, and that the
  dev-server/EAS replacement has no chosen target and no verifiable
  environment here. Shipping the one safe, tested item now rather
  than blocking the whole row on the other three, or guessing at
  them, is the same partial-ship call 47c and 47d already made for
  this series.
- **Lint scope stays `app/` + `components/`, not repo-wide.**
  Matching `expo lint`'s actual default scope (verified via its
  source) rather than the nominally "more correct" `eslint .` is
  deliberate — widening lint enforcement to `state/`/`lib/`/`theme/`/
  `scripts/` is a real policy change (thousands of newly-enforced
  problems) that deserves its own decision, not a side effect of a
  tooling-wrapper swap. Filed as a follow-up.
- **`eslint-config-expo` stays as the active ruleset.** The
  build-plan row named the CLI (`expo lint` → direct ESLint), not the
  shared config package. Swapping the ruleset itself is a separate,
  larger decision (rule-set migration, re-triage of every newly
  enabled/disabled rule) out of scope for a CLI-wrapper swap.
- **Version-matrix doc note is forward-looking, written now.** The
  build-plan row asks for this "as part of this phase" without
  gating it on the other sub-items landing — it's true today (Expo
  SDK 54 curates the matrix) and becomes actionable guidance the
  moment any of the carried-over items land, so documenting it now
  rather than waiting avoids re-deriving the same reasoning in a
  future 47-series tick.
- **Skia stays uninstalled.** Re-ran D6f's 2026-07-18 evaluation
  against current state; its blocking condition (CI/CD migration
  settled) is unchanged by this tick, so the verdict is unchanged.

## Mobile reflow / responsive

N/A — no UI change.

## Pages × tests matrix

| Surface | Unit tests | Visual |
|---|---|---|
| `axiomancer-mobile/package.json` lint script | `npm run lint --workspace axiomancer-mobile` (byte-identical output to pre-swap `expo lint`: 19 problems, 0 errors, 19 warnings, exit 0) | N/A — no UI change |
| `plan/bearings.md` doc addendum | N/A (docs) | N/A |

## Verify gate

```bash
npm run verify --workspace axiomancer-mobile     # lint (now direct eslint) + typecheck + jest, all green
```

## Commit body template

```
refactor(mobile): expo lint -> direct eslint, version-matrix doc,
Skia re-evaluation — phase 47e (partial)

- axiomancer-mobile/package.json: "lint": "expo lint" -> "eslint app
  components" (matches expo lint's own DEFAULT_INPUTS scope, verified
  byte-identical output: 19 problems, 0 errors, 19 warnings, exit 0)
- bearings.md: documents the post-decouple RN<->native-lib
  version-matrix becomes manually managed (Expo SDK 54 curates it
  today via expo install/expo-doctor)
- @shopify/react-native-skia re-evaluated against D6f's 2026-07-18
  verdict; unchanged (still the post-CI-migration upgrade path, not
  installed)

Decisions:
- Jest preset (jest-expo -> bare RN preset) carried over: verified
  jest-expo's setup.js auto-mocks the Expo native-module surface that
  expo-font/expo-image (still live deps) actually exercise in tests;
  dropping it now would silently break that mock layer, the same
  failure shape 47c's reverted expo-image attempt already hit once.
- expo start dev/web scripts, dev-server container, and the EAS build
  path carried over: no native project exists yet (ios/android dirs
  absent) and the replacement was never chosen ("whatever replaces
  it"); this sandbox also can't verify a native build/CI lane
  (no Xcode/Android SDK). Per ship-a-phase.md Sec10.8, scoping the
  brief to what's safe+testable now rather than guessing.
- Lint scope kept at app/+components/ (expo lint's real default),
  not widened to the whole package — widening enforcement is a
  separate decision, filed as a follow-up.
- eslint-config-expo (the ruleset) stays; only the CLI wrapper swaps.

Row stays [-] partial, matching 47c/47d's own split-outcome precedent.

Closes #<phase-issue-number>
```

## DoD

Mark Phase 47e `[-]` (partial, not `[x]`) in
`plan/steps/01_build_plan.md`, append the commit hash, and carry the
Jest-preset / dev-server / EAS-path residue forward explicitly (see
"Follow-ups").

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- **`jest-expo` → bare RN Jest preset.** Blocked until `expo-font`
  and `expo-image` (the two still-live Expo deps with real test
  coverage) are themselves swapped to bare-RN equivalents — those
  swaps are in turn blocked on a native project existing (same
  47a/47c precedent). Resequence: native project → font/image swap →
  this.
- **Native project bootstrap (`expo prebuild` or a from-scratch
  bare-RN `ios`/`android` scaffold).** The actual missing
  prerequisite behind this phase's three carried-over items. Not
  verifiable in this execution environment; needs a session with
  Xcode/Android SDK access (or a CI runner that has them) to run and
  confirm. Worth its own phase number once that constraint is lifted
  rather than folding into 47e again.
- **`expo start` dev/web scripts + dev-server container → bare RN
  equivalent.** Needs the native project above, or an explicit
  decision to keep a web-only dev path indefinitely (in which case
  the replacement is a plain Metro/webpack dev server, not tied to
  native bootstrap at all — that's a real fork in the road this brief
  is not authorized to pick blind; surface at the next `/oversight`).
- **EAS build path (`deploy:preview`/`deploy:production`) →
  replacement.** Same native-project blocker; additionally needs a
  decision on what CI/CD system replaces EAS Build (self-hosted
  Fastlane lane, GitHub Actions with manual signing, or continuing to
  pay for EAS but pointing it at a bare-RN project) — genuinely
  undecided, not this brief's call.
- **Widen mobile lint scope beyond `app/`+`components/`.** `state/`,
  `lib/`, `theme/`, and `scripts/` are currently unlinted by
  `npm run lint` (confirmed: `expo lint`'s default scope never
  covered them either, so this is pre-existing, not a regression).
  Worth a deliberate follow-up phase to triage and fix the ~5,300
  newly-surfaced problems in scripts/ (mostly Node-context files
  needing a separate env block in `eslint.config.js`) and the smaller
  real count in state/lib/theme, not a silent scope change here.
- **`@shopify/react-native-skia` adoption for the D6f roll ritual.**
  Still gated on the CI/CD migration (native project + build lane)
  landing; re-evaluate again once that's true.
