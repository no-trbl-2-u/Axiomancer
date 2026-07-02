# Phase 122 — Level-1 enemy outlier rebalance

> Fix the two per-enemy outliers that blow up the level-1 row without cutting the
> global enemy slope (which would trivialize the already-fine L1 roster).

## Outcome

`reef-barnacle-colony` and `tolltaker-of-the-ford` are rebalanced so that
early-game (level-1) matchups against them land inside the difficulty bands,
instead of the 90%+ defeat spikes the tuning matrix surfaced — while same-tier
enemies that are already in band are left untouched.

## Source

Promoted by owner direct order on 2026-06-07 from the `combat-tuning` tick
(merged PR #125). The data report
`automation/playtest/reports/tuning-2026-06-07T13-37-51-907Z.md` and its
suggestions writeup identified this as a **per-enemy**, not global, problem:

- `reef-barnacle-colony`: 17% resolution, 55% defeat across 4 cells.
- `tolltaker-of-the-ford`: L1 mixed-hard 91% defeat.
- Same-tier `petty-cutpurse` / `thicket-ambusher` / `rimeclaw-prowler` resolve
  ~95–100%, so the global `enemy.statPerLevel` slope is NOT the cause.
- Worst evidence cell: `l1-defensive-hard` — 94% defeat in 5.7 rounds with only
  1.5 skill uses/run; the player dies before any status play can develop, which
  is also the worst status-effect-engagement cell in the matrix.

## Implementation units

### Unit 1 — Confirm the outlier stat/effect blocks

**Files:**
- `src/Enemy/enemy.library.ts` (the two archetypes + their AI/effect kits)
- `src/Tuning/enemy.scaler.ts` (how the archetype's stat split + difficulty
  multipliers produce the level-1 instance)

**Work:**
- Read both archetypes' `baseStats`, `logic`, `skills`, `procUnlocks/Overrides`,
  and `befriendabilityConfig`.
- Identify WHY they over-perform at low level: stat split weighting, an
  early-landing hard-CC / burst proc, or a befriend config that makes the
  peaceful route unreachable in a 5-round fight. Record the specific cause.

### Unit 2 — Rebalance the two archetypes

**Files:**
- `src/Enemy/enemy.library.ts`
- targeted enemy e2e tests (e.g. `src/Enemy/e2e/*.engine.test.ts`)

**Work:**
- Adjust the offending archetype properties so the level-1 matchups move into
  band. Prefer the lever the evidence points at (stat split, proc timing/weight,
  or befriend reachability) over blunt across-the-board stat cuts.
- Do NOT touch `ENEMY_STAT_PER_LEVEL` or the difficulty multipliers in
  `enemy.scaler.ts` — those are global and out of scope here.
- Keep each enemy's role identity (the colony stays a defensive wall; the
  tolltaker stays a balanced gatekeeper) — re-band, don't neuter.

### Unit 3 — Evidence

**Files:**
- generated reports under `automation/playtest/reports/`
- `docs/enemy.md` if per-enemy balance notes are recorded there

**Work:**
- Re-run a focused matrix slice over the two enemies at level 1
  (`npm run tune -- --levels=1 --runs=50`, or the playtest harness) and record
  before/after resolution + defeat for the affected cells.
- Confirm the previously-in-band same-tier enemies are unchanged.

## Decisions made upfront — DO NOT ASK

- **D1 — Per-enemy only.** No changes to `ENEMY_STAT_PER_LEVEL`, difficulty
  multipliers, or any other enemy's stat block.
- **D2 — Re-band, don't trivialize.** Target the difficulty bands in
  `src/Tuning/difficulty.bands.ts`; do not drive these two to 100% resolution.
- **D3 — Preserve role identity.** Defensive/gatekeeper archetypes stay that way.

## Verify gate

- `npm run type-check`
- `npm test -- --run` (with the touched enemy e2e tests)
- focused balance slice over the two enemies (tune or playtest)
- `npm run verify` + `npm run deploy:check`
- `git diff --check`

## Definition of Done

- [ ] `reef-barnacle-colony` level-1 matchups land in band (resolution within the
  difficulty band; no >90% defeat cell).
- [ ] `tolltaker-of-the-ford` level-1 hard matchup lands in band.
- [ ] `petty-cutpurse` / `thicket-ambusher` / `rimeclaw-prowler` results unchanged.
- [ ] No change to global enemy scaling constants.
- [ ] Before/after evidence recorded.
- [ ] Verify + deploy gates pass.

## Follow-ups out of scope

- Global enemy scaling (Phase 123).
- Player-side skill/effect strength (Phase 124).
- Effects-to-resolution wiring (Phase 125).
