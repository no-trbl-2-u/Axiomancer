# Spec 01 — Test Harness Setup
<!-- [DONE on 2026-05-11] -->

## Goal

Stand up a working `npm test` in this repo so every subsequent spec can
satisfy the hermetic-e2e requirement in [`docs/testing.md`](../docs/testing.md).
Land the **first hermetic e2e test** as the canonical reference for
every spec after this one.

**Success state:** `npm test` runs Jest with `jest-expo` preset, mocks
the things React Native cannot run in Node (Reanimated, fonts, splash
screen, haptics), and ships at least one passing hermetic e2e test
under `app/<route>/e2e/`. Type-check (`npx tsc --noEmit`) stays clean.

## Why now / dependencies

- **Unblocks:** every other spec. The hermetic-e2e requirement in
  `docs/testing.md` and `.cursor/rules/hermetic-e2e-testing.mdc` cannot
  be satisfied without this. Until this lands, "tests pass" only means
  the type-checker is clean.
- **Depends on:** nothing in this repo. The engine package
  (`axiomancer-mechanics`) is already installed.

## Current state

- `package.json` has **no `test` script** and **no test dependencies**
  (`jest`, `jest-expo`, `@testing-library/react-native` are absent).
- No `jest.config.*` or `jest.setup.*` files exist.
- No `app/test-utils/` directory exists.
- All screens hold their own `useState` mock data — there is **no
  presenter layer** to test against yet (Spec 03 introduces it). The
  first hermetic e2e in this spec therefore targets a *new* presenter
  written specifically as the reference, not a refactor of an existing
  screen.
- The engine package's reference test
  (`axiomancer-mechanics/src/Combat/e2e/combat.engine.test.ts`) uses
  `vitest` — we are intentionally diverging because Expo's official
  testing story is `jest-expo`. The structural conventions (alternating
  RNG, terminal-condition split, store-lifecycle suite) carry over.

## Open questions

1. **Test runner.** Confirm or override:
   - (A) **(default)** `jest-expo` preset — official Expo path,
     pre-configures Babel + transformIgnorePatterns + RN mocks.
   - (B) `vitest` — matches the engine repo, but requires a hand-rolled
     RN mock layer.
   > Your answer:

2. **Render library.**
   - (A) **(default)** `@testing-library/react-native` — modern, query
     by accessibility role.
   - (B) `react-test-renderer` — minimal, snapshot-friendly, but no
     event simulation.
   - (C) Both.
   > Your answer:

3. **First reference test target.** The first hermetic e2e needs a
   real presenter to exercise. Options:
   - (A) **(default)** Write a tiny `selectCombatHudViewModel(state)`
     presenter (player HP / mana / effects → HUD props) as the
     reference; Spec 03 generalises the pattern, Spec 04 wires the
     full combat screen.
   - (B) Write the test against `axiomancer-mechanics`'s
     `createGameStore` lifecycle (no presenter — just engine plumbing).
   - (C) Both — a presenter test *and* an engine-store-lifecycle test,
     to lock both shapes in.
   > Your answer: C

4. **RNG strategy in tests.**
   - (A) **(default)** Local `app/test-utils/rng.ts` mirroring the
     engine's `mockAlternatingRng` / `mockFixedRng` / `mockSequentialRng`
     using `jest.spyOn(Math, 'random')`.
   - (B) Wait for the engine to ship a seedable RNG (engine Spec 11),
     then thread it through. Until then, use `Math.random` stubs
     inline.
   > Your answer: A, but include a comment near the code with a TODO for when the engine ships a seedable RNG

5. **`AsyncStorage` mock.** Even though Spec 09 hasn't landed yet, the
   engine store is parameterised on a persistence adapter. Should the
   test scaffolding ship:
   - (A) **(default)** A `memoryAdapter` test util now that mirrors
     the engine's `nullAdapter` shape (in-memory `Map`-backed save /
     load). Used everywhere a store lifecycle is exercised.
   - (B) Punt to Spec 09; tests use the engine's `nullAdapter`
     directly.
   > Your answer:

6. **Coverage thresholds.** Should `jest.config.js` enforce coverage
   thresholds (lines / branches / functions)?
   - (A) **(default)** No thresholds in this spec — establish them
     once we have a baseline.
   - (B) Yes — lines ≥ 80%, branches ≥ 70%.
   > Your answer:

7. **CI integration.** Out of scope for this spec, but worth flagging:
   should `npm test` be run in a GitHub Action / Cursor Cloud agent
   on PR open?
   > Your answer: Yes

## Proposed approach

If you have no strong overrides, the AI will implement in this order.
Each entry is a self-contained commit on the spec branch.

1. **Add dev dependencies.** `npm install --save-dev jest jest-expo
   @testing-library/react-native @testing-library/jest-native
   @types/jest`. Pin nothing by hand — let `npm` resolve the
   latest-compatible versions and commit `package-lock.json`.
2. **Write `jest.config.js`.** Preset `jest-expo`,
   `setupFilesAfterEach: ['./jest.setup.ts']`, `transformIgnorePatterns`
   tuned for `axiomancer-mechanics` and the `expo*` / `@expo*` packages,
   `moduleNameMapper` for the `@/*` alias to mirror `tsconfig.json`.
3. **Write `jest.setup.ts`.** Mock `expo-font` (`useFonts` returns
   `[true]`), mock `expo-splash-screen` (`preventAutoHideAsync` and
   `hideAsync` no-op), mock `expo-haptics`, register
   `react-native-reanimated/mock`, register
   `@testing-library/jest-native/extend-expect`.
4. **Add `app/test-utils/rng.ts`.** Port the engine's helpers verbatim
   (`mockAlternatingRng`, `mockFixedRng`, `mockSequentialRng`) but using
   `jest.spyOn` instead of `vi.spyOn`.
5. **Add `app/test-utils/memoryAdapter.ts`** — in-memory persistence
   adapter compatible with `axiomancer-mechanics`'s adapter interface.
   `save` / `load` / `clear`. Counts `save` invocations for assertion.
6. **Write the first presenter** under `app/(tabs)/combat/e2e/`:
   `combat-hud.engine.ts` exporting `selectCombatHudViewModel(state)`.
   Tiny — HP / mana / effects → `{ hpPercent, manaPercent, effects: [...] }`.
   This becomes the **reference** for every other spec.
7. **Write the first hermetic e2e** at
   `app/(tabs)/combat/e2e/combat-hud.engine.test.ts`. Cover:
   - Happy path: full HP / mana → percents are 1.0.
   - Empty / boundary: 0 HP → percent is 0; clamp invariant.
   - Effects: ordering, max-shown limits.
   - Lifecycle: `createGameStore(memoryAdapter, …)` → `startCombat(...)`
     → presenter on the post-combat state — assert
     `memoryAdapter.save` was *not* called (because `startCombat`
     doesn't write).
8. **Update `package.json`** with `"test": "jest"` and
   `"test:watch": "jest --watch"`.
9. **Update `docs/testing.md`** to point at the new reference test.
10. **Update this spec** with `[DONE]` line at top once the AI's PR
    merges.

## Acceptance checklist

- [ ] All 7 questions answered.
- [ ] `npm test` exits 0 and runs at least one hermetic e2e.
- [ ] `npx tsc --noEmit` clean.
- [ ] `app/test-utils/{rng,memoryAdapter}.ts` ship and are excluded
      from the production bundle (`metro.config.js` updated if
      needed).
- [ ] `docs/testing.md` references the new canonical test path.
- [ ] No real network, no real `AsyncStorage`, no real timers, no
      real fonts in the test path.

## Out of scope

- Wiring real screens to the engine store — Spec 02 / 03.
- A seedable RNG abstraction — engine Spec 11.
- An `AsyncStorage` adapter for runtime — Spec 09.
- CI integration (GitHub Action / Cursor Cloud workflow) — flagged in
  Q7 for a follow-up.
