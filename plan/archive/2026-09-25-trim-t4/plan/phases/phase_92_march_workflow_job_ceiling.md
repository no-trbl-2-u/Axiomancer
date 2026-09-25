# Phase 92 — `march` workflow job ceiling

> Promoted 2026-09-17 via `/oversight` from `plan/PHASE_CANDIDATES.md`
> (unscored row filed 2026-08-09 by digest, pulse evidence in
> `plan/AUDIT.md`). Brief generated 2026-09-18 by `/ship-a-phase` §9
> (tooling / CI-infra phase — the page-family brief sections don't apply,
> same adaptation as Phase 91).

## Outcome

Run `31301228665` (2026-08-09) chained phases 44a and 44b into a single
`march` job and hit `.github/workflows/march.yml`'s then-`timeout_minutes:
90` exactly (`1:30:18`), getting force-cancelled by the runner mid-tick.
The candidate framed the fix as a choice: raise the ceiling, or split
multi-phase ticks so a tick's own scope stays well under any ceiling. That
choice was already decided in bearings, independently of this phase:
`b53dac5d` (2026-08-14, Actions-usage cut) *lowered* the ceiling 90→75 for
budget reasons and `plan/bearings.md` § Operational notes now states
plainly, "Timeouts are budget caps: march 75, night 45. A tick that
genuinely needs more should be split, not have its cap raised silently."
Raising is off the table by standing policy; this phase's job is to make
the "split" side of that policy actually hold, because the mechanism that
was supposed to enforce it — `skills/ship-a-phase.md` Step 13 ("Return
cleanly. The loop's next tick picks up the next phase.") — already existed
on 2026-08-09 (it shipped with the nexus methodology adoption on
2026-07-03, five weeks before the incident) and did not stop the chain.
Prose telling an agent to stop is not the same as a rule the agent treats
as binding; the fix is to make the no-chaining constraint an enumerated
Hard Rule (§7), the section agents demonstrably follow more reliably (Hard
Rule 11, added after a comparable drift incident with backgrounded
research agents, is the precedent for this pattern).

Re-measured against the current architecture before deciding whether any
of this is still live: the last 100 `march` runs (`gh run list --workflow
march.yml --limit 100`, checked 2026-09-18) show **zero cancellations**
and a slowest run of 53.3 minutes against the 75-minute ceiling — 30%
headroom, and no run has approached the ceiling since the last confirmed
timeout-kill recurrence (`32374048835`, 2026-08-21, `1:14:56` against the
75-min ceiling then in force). The one-phase-per-tick discipline has
evidently been holding in practice for weeks; this phase closes the
documented gap that let it fail once, rather than reacting to a live
problem.

## Why

`plan/AUDIT.md`'s "`march` ticks are creeping toward the 90-minute job
timeout; one was killed mid-cycle" row (filed 2026-08-09, recurrence noted
2026-08-21) is the evidence trail. `plan/PHASE_CANDIDATES.md`'s own
self-assessment pass (the "already Pending, not re-filed" note under its
audit-cluster section) flagged that the shipped budget cut made the
underlying kill-mid-flight risk *more* live, not less, since it addressed
cost without addressing the chaining behavior — worth closing properly
rather than leaving as a live loose end.

## Decisions made upfront — DO NOT ASK

- **Do not raise `timeout_minutes`.** Already decided by
  `plan/bearings.md` § Operational notes (2026-08-14, PR #205): "a tick
  that genuinely needs more should be split, not have its cap raised
  silently." Re-opening that call is out of scope for this phase; the
  brief instead makes the split side of the policy hold.
- **Codify "one phase per invocation" as a Hard Rule, not a step
  footnote.** Step 13's "Return cleanly" already said the right thing and
  was insufficient on its own — the chain happened anyway. `skills/
  ship-a-phase.md` § 7 (Hard rules) gets a new numbered rule spelling out:
  stop after one phase's commits land, even when the next `[ ]` row is a
  lettered sibling of the one just shipped (the literal 44a/44b shape),
  and even when the job's time budget looks like it has room left. Modeled
  directly on Hard Rule 11 (backgrounded research agents), which is the
  only prior rule written specifically to correct an observed instance of
  an agent not stopping when the prose said to.
- **No change to `skills/march.md`.** Its Step 3a already reads "Execute
  its procedure end-to-end. Return." and § 4 already commits to fully
  adopting the dispatched skill's contract — the gap was inside
  `ship-a-phase`'s own contract, not in how `march` hands off to it.
- **`march.yml`'s timeout comment gets refreshed**, not rewritten: keep
  the historical 90→75 note, append the Phase 92 evidence (100-run sample,
  zero cancellations, 53.3 min slowest) and a pointer to the new Hard
  Rule so a future reader doesn't have to re-derive why 75 is still
  correct.
- **Close the AUDIT.md gap row as RESOLVED via Phase 92**, following the
  established citation shape (`### [x] ... — RESOLVED via Phase 92
  (2026-09-18, commit <sha>)` plus a body note), same pattern as Phase
  85/86/91's closes. The paired apt-mirror-hang AUDIT row (a distinct
  failure shape — an idle network hang eating the budget, not real work
  outgrowing it) is explicitly out of scope and untouched.
- **`plan/PHASE_CANDIDATES.md`'s row needs no further edit** — it already
  reads "PROMOTED to Phase 92 via /oversight 2026-09-17"; this phase is
  the fulfillment, same precedent as Phase 91's candidate row.

## Surface (no routes — two skill/workflow docs + two plan-memory closes)

| File | Change |
|---|---|
| `skills/ship-a-phase.md` | New § 7 Hard Rule 12: one phase per invocation, never chain, citing the 44a/44b incident and the bearings "split, not raised" policy. Step 13 gets a one-line pointer to it. |
| `.github/workflows/march.yml` | Timeout comment refreshed with the Phase 92 evidence and headroom figure; `timeout_minutes: 75` unchanged. |
| `plan/AUDIT.md` | The "march ticks are creeping toward the 90-minute job timeout" row marked `[x]` RESOLVED via Phase 92, with a body note summarizing the decision and the re-measurement. |
| `plan/steps/01_build_plan.md` | Phase 92 row ticked `[x]` with commit hash. |

## Verify gate

No mechanics/mobile/card-editor workspace files are touched (prose +
workflow YAML + plan-memory only), so `npm run verify` at those workspaces
is out of scope for this change, consistent with Phase 91's precedent for
loop-infra-only phases. Sanity-check `march.yml` is still valid YAML
(`node -e` parse or `gh workflow view` after push) since it's a live
scheduled workflow.

## DoD

- [ ] `skills/ship-a-phase.md` § 7 gains the one-phase-per-invocation Hard
      Rule; Step 13 points to it.
- [ ] `.github/workflows/march.yml`'s timeout comment carries the Phase 92
      evidence; `timeout_minutes` value unchanged at 75.
- [ ] `plan/AUDIT.md`'s matching gap row closed `[x]` RESOLVED via Phase
      92 with commit hash.
- [ ] `march.yml` parses as valid YAML post-edit.
- [ ] Build-plan row ticked.

## Follow-ups (out of scope)

- The apt-mirror-hang AUDIT row (`npx playwright install chromium
  --with-deps` retrying an unreachable mirror for the whole job ceiling)
  is a distinct failure shape and stays open, unfixed by this phase.
- No change to the march cadence (4×/6h) or to the night/digest timeout
  (45 min) — both out of this phase's named scope.
- If a future re-measurement shows ticks trending back up toward the
  ceiling, the Hard Rule added here is the first thing to audit for
  compliance before reconsidering the raise option bearings currently
  forecloses.
