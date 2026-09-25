# Current state — 2026-07-03 (nexus adoption baseline)

> The brownfield baseline the build plan is written against.
> Snapshot at the moment the unified nexus harness was
> re-onboarded onto the assembled monorepo.

## What's there

- **Tech stack:** npm-workspaces monorepo, three flat packages.
  Node ≥20, npm ≥10. React pinned to 19.1.0 via root overrides.
  - `axiomancer-mechanics` v0.37.0 — TypeScript engine + CLI
    (CommonJS, ts-node), Vitest, ESLint 9 flat config, `tsc &&
    tsc-alias` build.
  - `axiomancer-mobile` v1.9.0 — Expo ~54 / RN 0.81 /
    expo-router 6, TypeScript, Jest (jest-expo), `expo lint`.
  - `axiomancer-card-editor` v0.1.0 — Vite + React local dev tool.
- **Consumption model:** mobile and card-editor consume mechanics
  as **local source** via the `@mechanics` alias
  (→ `../axiomancer-mechanics/src`). Not published to npm.
- **Git history:** monorepo assembled via subtree merge of the
  formerly-separate `mechanics` and `mobile` repos (both full
  histories preserved; ~11 first-parent monorepo commits at the
  2026-07-03 re-onboard).
- **CI:** GitHub Actions — `verify-mechanics.yml`,
  `verify-mobile.yml`, `verify-card-editor.yml` (push + PR to
  `main`, path-filtered), plus `preview-build.yml`
  (workflow_dispatch EAS build).
- **Deploy:** none from `main`. Mobile ships via manual EAS
  builds (`npm run deploy:preview` / `deploy:production`).

## What works

- All six encounter engines (Hazard-Pattern Combat, Hazard v2,
  Gathering, Rest, Loot-cache, Quest Board) with seeded engines,
  content, tuning loops, and hermetic e2e tests.
- Mobile app renders every encounter through expo-router; theming,
  fonts, SVG placeholders, per-minigame browser e2e.
- Per-package verify gates green in CI. Lint green in both TS
  packages.
- Domain design + tuning harness carried forward into root
  `.claude/` (tuning commands, design skills, and the `scout`,
  `reader`, `mechanics-expert`, `playtester` agents).

## Known broken / decayed (carried into plan/AUDIT.md)

- Mobile `deploy:check` is a stub (EAS not wired); do not treat a
  green stub as a real build gate.
- Cross-package hazard divergence (DIV-MECH-002): mobile runs a
  *duplicate* hazard engine incompatible with mechanics'
  `World/Hazard`. Needs a T ownership decision.
- Village shop has no SELL surface (engine ships `sellItem`).
- Assorted debt: unbounded keepsake/death flag growth on long
  saves, `as any` clusters at the mobile state boundary, a few
  file-length outliers, a11y gaps.

See `plan/AUDIT.md` for the scored, categorized queue.

## What's missing for v1.x

- Combat-depth specs 26–30 (draft).
- Authored character/story/world content (only templates exist).
- Northern-forest region content.
- Tutorial / onboarding flow.
- Multi-screen integration test coverage (was the biggest verify-gate
  blind spot; Phase 10 pinned the one seam with a proven regression
  history — see below — broader cross-screen coverage still open).

## Conventions worth keeping

- Rules/state/RNG live in mechanics only; mobile presenters are
  pure `(state) → ViewModel`.
- Hermetic e2e at the highest public entry point; RNG stubbed via
  `src/test-utils/rng.ts` helpers (never `vi.spyOn(Math,'random')`).
- `<type>(<scope>): <desc>` commits; ship only on green gates.
- Combat copy canon: VITAE, STANCE (never HEALTH / GUARD).
- Mobile: no hex literals in components (AXM tokens), no
  hardcoded copy (strings in presenters / `*.copy.ts`).

## Conventions worth breaking / watching

- Doc-drift: new engine surfaces chronically lag `spec.md` /
  `docs/combat.md`. Keep a doc-sync check in the loop.
- Hermetic tests were blind to cross-screen integration
  regressions (the FIGHT-modal-unmount class) — Phase 10 pinned this
  one seam (`ExplorationScreen` + `(tabs)/_layout`,
  `state/e2e/cross-screen-integration.engine.test.tsx` +
  `scripts/exploration-combat-roundtrip-e2e.mjs`). Cross-screen
  coverage elsewhere in the app remains a real, open gap.
- Pre-monorepo npm-package model (engine pins, lockfile
  co-commit runbook, `bump-engine` semver) is **retired** — do
  not resurrect it from muscle memory.
