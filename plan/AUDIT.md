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

### [2.0] `combatMana` slice deprecated but still load-bearing
- category: debt
- impact: 5
- ease: 4
- detail: deprecated since Phase 105, still used by StatusCard,
  debug controls, HUD presenters, `state/actions.ts`. Migration
  to engine `combatResources` was promoted as Phase 156 — verify
  whether it shipped before re-filing / re-scoping. (Overlaps
  build-plan Phase 7.)
- next: /iterate

### [2.0] fishing-village CLI + spec08 e2e drive legacy combat
- category: tests
- impact: 4
- ease: 5
- detail: DIV-MECH-005 — the fv-15 walkthrough + `spec08` e2e
  still exercise legacy `resolveCombatRound` instead of the
  shipped Hazard-Pattern Combat path (Phase 165). Risk: a
  "combat" gate silently tests the wrong engine.
- next: /iterate

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

### Hazard v2 engine ownership (DIV-MECH-002)
- resolved via `/oversight` 2026-07-03: mechanics absorbs
  mobile's duplicate `state/hazard/` engine. Promoted to
  `plan/PHASE_CANDIDATES.md` -> build plan Phase 13.
