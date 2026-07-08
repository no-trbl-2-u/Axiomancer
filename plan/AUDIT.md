# Audit

> Findings queue for `/iterate`. Each row is scored
> `impact x ease / 10` (see `skills/iterate.md` §4). The Pending
> section is the loop's drain target; `/iterate` picks the
> highest score, ships one fix, moves the row to Done. Categories:
> see `plan/bearings.md` § "AUDIT category taxonomy".
>
> Seeded 2026-07-03 from the retired per-package harness
> (`/archive`) during nexus re-onboarding — stale/pre-monorepo
> findings were dropped; these were re-validated as still
> plausibly live. Verify each against current code before
> shipping; re-file or drain as reality dictates.

## Pending

### [3.2] Night workflow never installs Playwright's browser — breadth check silently would fail on every run
- category: gap
- impact: 4
- ease: 8
- detail: `.github/workflows/night.yml` calls `_claude-skill.yml`
  without `install_playwright: true` (unlike `critique.yml`,
  `deep-playtest.yml`, `hermes-playtest.yml`,
  `combat-ux-tuning.yml`, `critic-loop.yml`, which all set it).
  `/digest`'s breadth check (`npm run e2e:minigames` in
  `axiomancer-mobile`) needs Playwright's Chromium
  headless-shell binary; on a fresh Actions runner it isn't
  cached, so `hazard-e2e.mjs` aborts immediately with
  "Executable doesn't exist at
  .../chromium_headless_shell-1228/...". Worked around this run
  by installing it by hand (`npx playwright install
  chromium-headless-shell`) before the suite; without that step
  every future night run repeats the same failure and the
  nightly breadth signal is dead.
- next: /iterate

### [3.2] `CardSpecialMechanic` deprecated-name not exported
- category: contract
- impact: 4
- ease: 8
- detail: the `src/index.ts` barrel's `@deprecated` JSDoc names
  `CardSpecialMechanic` as the preferred import, but only the
  deprecated alias `SkillSpecialMechanic` is actually exported —
  a consumer following the migration note gets an undefined
  import. (Verify still live before fixing.)
- next: /iterate

### [1.2] Skipped enemy stat-budget test (content decision — RESOLVED via oversight 2026-07-08)
- category: content
- impact: 4
- ease: 3
- detail: `src/Enemy/e2e/new-enemies.engine.test.ts` skips its
  `enemyStatBudget` assertion — the 30 authored enemies match the
  budget at levels 1-4 but drift up to 2x at level 50 (authored
  under old constants with gear-tier scaling baked into raw
  stats). Decision (via `/oversight` 2026-07-08): the budget curve
  is canon; the 30 authored enemies need re-authoring to comply
  (reconstruct per-enemy gear-tier inputs so raw stats match the
  budget formula through level 50), then unskip the assertion.
  Promoted to `plan/PHASE_CANDIDATES.md` as a real content phase —
  see "Enemy stat rewrite to budget-curve compliance".
- next: /oversight (promote candidate to a build-plan phase when
  queue has room)

### [2.0] Mobile `as any` clusters at the state boundary
- category: debt
- impact: 4
- ease: 5
- detail: cast clusters at state/test boundaries, esp. the
  `state/actions.ts` engine-store bridge. Recurring drain target,
  not a single fix.
- next: /iterate

### [1.6] Mobile accessibility gaps
- category: a11y
- impact: 4
- ease: 4
- detail: focus management + a11y labels surfaced repeatedly in
  prior critique. Ongoing drain.
- next: /iterate

### [1.5] Unbounded keepsake/death flag growth on long saves
- category: debt
- impact: 3
- ease: 5
- detail: `night-keepsake:`, `hazard-scar:`, `hazard-death:`,
  `gleaning-token-banked:` accumulate with no consumer/cap. A
  long-save soak test could trip on this.
- next: /iterate

### [1.5] `HazardBoard.tsx` file-length outlier (~815 lines)
- category: debt
- impact: 3
- ease: 5
- detail: extraction candidate; several other mobile files are
  length outliers. Extract sub-components with their own tests.
- next: /iterate

## Done

### fishing-village CLI + spec08 e2e drive legacy combat
- drained 2026-07-03 (monorepo cleanup): stale — the legacy
  `resolveCombatRound` no longer exists anywhere in
  `axiomancer-mechanics/src`; no fv-15/spec08 script remains in
  package.json. The finding predated the resolver removal.

### Hazard v2 engine ownership (DIV-MECH-002)
- resolved via `/oversight` 2026-07-03: mechanics absorbs
  mobile's duplicate `state/hazard/` engine. Promoted to
  `plan/PHASE_CANDIDATES.md` -> build plan Phase 13.

### [2.0] `combatMana` slice deprecated but still load-bearing
- drained 2026-07-08 (build-plan Phase 7): stale — the slice was
  actually retired by mobile commit `6ef5f989` (2026-06-20,
  "remove the vestigial client mana model") and its container
  (`state.combat`) fully removed by `160ae907`/mechanics `4cb504a5`
  (2026-06-30/07-01). "Phase 156" was never the migration (that
  number is the unrelated status-effect interaction engine); the
  audit row was carried into the monorepo re-onboard without being
  re-validated against code that had already changed nine days
  earlier. No live `combatMana` reference remained; Phase 7 deleted
  the one dead type (`CombatManaState`) and fixed four stale
  comments still narrating the retired slice.
