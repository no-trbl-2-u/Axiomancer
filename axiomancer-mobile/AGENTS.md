# AGENTS.md — Project Orientation

> **Note:** This file provides project-specific context and technical
> details. For current autonomous loop instructions and workflow rules,
> see [`agents.md`](./agents.md) (the nexus rule book).

## Project overview

Axiomancer Mobile is the **React Native / Expo client** for the Axiomancer
TTRPG. It is a thin presentation layer on top of the
[`axiomancer-mechanics`](https://www.npmjs.com/package/axiomancer-mechanics)
engine: all game rules, state shape, and randomness live there. This repo
owns screens, navigation, theming, fonts, SVG/asset placeholders, and the
glue (selectors / presenters) that maps engine state to UI props.

See [`README.md`](./README.md) for architecture docs and [`plan/bearings.md`](./plan/bearings.md) for current project context.

## Load-bearing UI evidence doctrine

- Canon combat terms are `VITAE` and `STANCE` / `CHOOSE A STANCE`; do not approve `HEALTH` / `GUARD` regressions.
- `npm run verify:visual` exit 1 with clean export and zero console errors is a baseline-vs-regression judgment, not automatically a product failure. Missing baselines are baseline debt. Console/runtime errors are product failures and must be fixed or reproduced before baseline approval.
- A `/combat` smoke screenshot that shows only `THE FIELD STIRS.` instead of the seeded active encounter is route/state initialization evidence. Do not approve it as a new baseline unless T/Judge explicitly decides the blank combat smoke state is intended.
- If `verify:visual` is red only on `root` / `character` with clean export and zero console errors, inspect the screenshot diffs and decide approve-vs-regression; do not report it as a build/runtime failure.
- Minigame e2e harnesses must follow current dev-control routing. Current route truth is SELF → `self-dev-tools-link` → `/dev`; failures waiting for retired `dev-menu-header` are harness drift, not proof that Hazard/Gathering product routes are absent.
- If typecheck errors cite newly shipped engine fields, verify installed `axiomancer-mechanics` package truth with a fresh install before changing mobile tests.
- Hazard-style combat evidence must use current HP-only board selectors and player-flow truth. An e2e harness waiting for removed `combat-pressure-tracks` is stale harness debt, not proof the screen is broken. Browser evidence that reaches the in-place board proves entry only; do not claim full combat resolution until card/die controls complete an outcome.
- The HP-only combat model does not by itself repeal canon copy. Keep `VITAE` for player-facing combat copy unless T explicitly approves a narrower `Health`/`HP` exception for enemy or accessibility labels.

## Key development commands

| Task | Command |
|---|---|
| Start dev server (Metro) | `npm start` |
| Start on Android | `npm run android` |
| Start on iOS | `npm run ios` |
| Start on web | `npm run web` |
| Lint (Expo's ESLint config) | `npm run lint` |
| Type-check | `npx tsc --noEmit` |
| Test (Jest) | `npm test` |
| Full local verify | `npm run verify` |

## Technical constraints

- **Path alias `@/*` resolves to repo root** — see `tsconfig.json`.
- **SVGs are placeholders.** Every SVG in this codebase is a coded
  placeholder. The swap contract is documented in
  [`SVG_ASSET_SPEC.md`](./SVG_ASSET_SPEC.md).
- **Fonts must finish loading before splash screen hides.** See
  `app/_layout.tsx`. Tests should mock `expo-font`'s `useFonts` to return
  `[true]` so screens render synchronously.
- **Reanimated requires a Babel plugin.** Test harness includes
  `react-native-reanimated/mock` for test compatibility.

## Testing standard

See [`docs/testing.md`](./docs/testing.md) for the complete hermetic e2e
testing standard. Every implementation requires hermetic test coverage
at the presenter/engine level (`state/e2e/`) or component level
(`components/__tests__/`).
