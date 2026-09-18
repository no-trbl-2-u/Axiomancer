# Phase 91 — Amber-CI tick recovery

> Promoted 2026-09-17 via `/oversight` from `plan/PHASE_CANDIDATES.md`
> (unscored row filed 2026-08-08 by Phase 48). Brief generated 2026-09-18 by
> `/ship-a-phase` §9 (tooling / CI-infra phase — the page-family brief
> sections don't apply; adapted per Phase 86/48's precedent).

## Outcome

A loop tick that ends while CI is still amber for its own commit (the tick's
own `npm run deploy:check` times out, or the `march.yml` job hits its
75-minute ceiling first) currently loses every `deploy:check`-gated
post-green step for that commit, permanently — nothing in a later tick
resumes it, because the next tick re-audits from scratch and moves on to
different work. Phase 48 already fixed the worst symptom (issues leaking
open) by moving the close itself onto the push (`close-trailers.yml`,
independent of any tick's lifetime). What's left, per the candidate's own
framing, is "the same early exit skips the deploy-URL comment and every
other `deploy:check`-gated step." This phase closes that remaining gap by
giving the deploy-URL comment the same treatment Phase 48 gave the close:
move it onto CI's own completion signal (`workflow_run`), independent of
whether the agent tick that authored the commit is still alive.

Concretely: a new `deploy-comment` subcommand on `scripts/loop-issue.mjs`,
wired to a new `.github/workflows/deploy-comment.yml` that triggers on the
gated `verify-*` workflows' own `completed` event, re-checks (by re-running
`scripts/deploy-check.mjs` unmodified, checked out at the completed run's
own SHA) whether every gated workflow for that commit is now green, and —
only once it genuinely is — posts the deploy-URL comment on every issue the
commit's `Closes #N` trailers name. Idempotent (the comment embeds the
commit SHA; a re-fire from a sibling `verify-*` completion is a no-op) and
self-healing (a fire that finds a sibling workflow still pending does
nothing; that sibling's own completion re-fires this workflow).

## Why

`plan/PHASE_CANDIDATES.md`'s "Loop turns that end while CI is amber leave
post-green work undone, with no retry" row, sourced from Phase 48
(`0aac2d3`) investigating march run `31184116798`: it ended with `result:
"Waiting on CI — will resume once the verify-mobile run for commit
615ff26b finishes."` Nothing resumed — the container died, and the next
tick re-audited from scratch. `close-trailers.yml` (Phase 48, same
investigation) already fixed the close itself by moving it onto the push.
The candidate names what's still open: "the general defect is untouched —
the same early exit skips the deploy-URL comment and every other
`deploy:check`-gated step."

Auditing every `deploy:check`-gated step across the skills (`skills/*.md`)
during brief-writing found exactly one class still genuinely exposed: the
deploy-URL comment posted by `skills/iterate.md` Step 7
(`close-comment`) and `skills/ship-a-phase.md` Step 12.5 (`phase-close`),
both of which only run if the SAME tick's own `deploy:check` call returns
green before the tick ends. Everything else that reads
`deploy:check` either (a) gates a *precondition* re-evaluated fresh every
`/march` tick (the critique/content-lifecycle dispatch gates in
`skills/march.md` — a tick that finds CI amber this turn simply doesn't
dispatch, and the next turn re-checks; nothing is lost), or (b) has no
action conditioned on the result at all (`adjust-*.md`'s post-commit
`deploy:check`, `critique.md` Step 6 — informational only). The issue-close
itself is no longer at risk (Phase 48). So the deploy-URL comment is the
one remaining unconditional-and-idempotent gap, and this phase closes it.

## Decisions made upfront — DO NOT ASK

- **Move the comment onto CI's own completion, not onto a resumed agent
  session** — the candidate's first option ("resume on deploy-gate
  completion") would require a loop tick's session to survive and be woken
  by an external event, which nexus's tick model doesn't support (each
  `/march` invocation is a fresh, stateless container — see
  `skills/ship-a-phase.md` §7 rule 11, the same "no backgrounded research
  agent" constraint applies architecturally to "resume this session
  later"). The candidate's second option — "make the post-green steps
  unconditional and idempotent so a later tick can safely re-run them" — is
  the one Phase 48 already proved out for the close. This phase applies the
  identical shape to the comment: a deterministic GitHub Actions workflow,
  not an agent tick, owns it.
- **Reuse `scripts/deploy-check.mjs` unmodified as the green-check**,
  invoked as a subprocess after `actions/checkout` at the completed run's
  own `head_sha` (not main's tip — a later commit may already have landed).
  `deploy-check.mjs` already implements "every gated `verify-*` workflow for
  this exact SHA has concluded success," including the cancelled-run /
  superseded-by-newer-commit nuance and the docs-only-commit fast exit. Do
  not reimplement that logic a second time in the new workflow or script —
  a second implementation is a second place for the two to drift apart.
  Override `DEPLOY_TIMEOUT_MS` down to a short value (60000, i.e. ~7 poll
  cycles) for this job specifically: it exists BECAUSE one gated workflow
  just completed, so there is nothing to gain by polling the full 45-minute
  default here — a sibling `verify-*` workflow still in flight will re-fire
  this same workflow on its own completion, which is the real retry
  mechanism.
- **New subcommand, not an extension of `close-trailers`.** `close-trailers`
  scans a *push range* (every commit since the last push) because closing
  can happen immediately on push, before CI runs at all. The deploy comment
  needs the opposite: it MUST wait for CI to actually conclude, and it only
  ever concerns the *one* commit whose `verify-*` run just completed (the
  `workflow_run` event's `head_sha`), not a range. Folding it into
  `close-trailers` would force a single function to do both "run
  immediately, scan a range" and "run once green, scan one commit," which
  is two different triggering contracts wearing one name. `deploy-comment`
  takes `--sha` (singular) and `--deploy-url`.
- **Comment only; never close.** `close-trailers.yml` already owns closing,
  independently and reliably. `deploy-comment` posts
  `buildDeployCommentBody({ sha, deployUrl })` on every issue named by that
  one commit's closing trailers, regardless of whether the issue is already
  closed (it will be, almost always, by the time this fires, since
  `close-trailers` runs on push and this runs after CI concludes minutes
  later) or still open (a `close-trailers` failure, or a race) — commenting
  doesn't require a particular issue state either way.
- **Idempotency via a SHA-scoped marker in the comment body, checked by
  scanning existing comments before posting** (`gh issue view --json
  comments`), not via a separate tracking file or label. Multiple gated
  `verify-*` workflows completing for the same commit (mechanics + mobile
  + card-editor, the common case for a cross-package change) each
  independently trigger `deploy-comment.yml`; whichever fires last posts,
  the earlier ones see "not yet green" from `deploy-check.mjs` and no-op,
  and if two somehow both see green (a genuine race, not the common path)
  the marker scan makes the second a no-op rather than a duplicate
  comment. This mirrors `sweepCloseTrailers`'s existing idempotency
  contract (`already-closed` -> noop) rather than inventing a new pattern.
- **`workflow_run` trigger list matches `deploy-check.mjs`'s own default
  `DEPLOY_WORKFLOWS`** (`verify-mechanics`, `verify-mobile`,
  `verify-card-editor` — NOT `verify-prose` or `verify-drift`, which are
  lint-only and were never part of the deploy gate). Keeping the two lists
  in sync by construction (same three names) avoids a workflow that can
  fire for a run `deploy-check.mjs` doesn't consider gating, or vice
  versa.
- **`fetch-depth: 2`, not the default shallow depth-1, not
  `close-trailers`'s full history.** `deploy-check.mjs`'s zero-gated-runs
  fallback path reads `git diff HEAD~1..HEAD`; that path shouldn't
  realistically trigger here (we're invoked because a gated run just
  completed, so `runs.length` is never zero), but a depth-1 checkout would
  make `HEAD~1` unavailable and turn a should-never-happen edge case into a
  hard script error instead of a graceful "unknown, fail closed" — cheap
  insurance, not a full-history checkout `close-trailers` needs for its own
  range scan.
- **The agent-driven `close-comment` / `phase-close` steps in
  `skills/iterate.md` / `skills/ship-a-phase.md` are UNCHANGED** — they
  still run, and still race to post first whenever the tick survives long
  enough. `deploy-comment.yml` is the floor underneath them (same
  relationship `close-trailers.yml` has to the agent-driven close), not a
  replacement. Both doc files get a one-line pointer added to their
  existing "belt-and-suspenders" framing so a future reader knows the gap
  those sections flag is now covered elsewhere, matching how Step 12.5
  already narrates the close-trailer situation.

## Surface (no routes — scripts + one new workflow + doc pointers)

| File | Change |
|---|---|
| `scripts/loop-issue.mjs` | New pure functions `buildDeployCommentBody`, `sweepDeployComments`, `defaultDeploySweepIo`; new subcommand `deploy-comment` (`cmdDeployComment`); header doc comment gains a `deploy-comment` section mirroring the existing `close-trailers` one; `__test` exports updated; help text updated |
| `scripts/loop-issue.test.mjs` | New tests for `buildDeployCommentBody` and `sweepDeployComments` (commented / already-commented noop / dry-run / comment-post failure / no-trailer noop), mirroring the existing `sweepCloseTrailers` coverage shape |
| `.github/workflows/deploy-comment.yml` | New workflow: `workflow_run` trigger on `[verify-mechanics, verify-mobile, verify-card-editor]` `completed`, gated on `head_branch == 'main' && event == 'push'`; checkout at `head_sha` (depth 2); runs the `loop-issue.test.mjs` witness; re-checks green via `deploy-check.mjs` (short timeout); posts the comment via `loop-issue.mjs deploy-comment` only when green |
| `.github/workflows/README.md` | New table row for `deploy-comment.yml`, same shape as the existing `close-trailers.yml` row |
| `skills/iterate.md` | Step 7: one-line pointer to `deploy-comment.yml` as the floor underneath `close-comment`'s deploy-URL comment |
| `skills/ship-a-phase.md` | Step 12.5: one-line pointer to `deploy-comment.yml` as the floor underneath `phase-close`'s deploy-URL comment |
| `plan/PHASE_CANDIDATES.md` | No change needed — row already marked `PROMOTED to Phase 91` at promotion time; this phase is the fulfillment |
| `plan/steps/01_build_plan.md` | Phase 91 row ticked `[x]` with commit hash |

## Verify gate

`node --test scripts/loop-issue.test.mjs` (the witness both `close-trailers`
and the new `deploy-comment` sweep share) plus `npm test` at root (the
aggregate root-level script-test gate that already includes
`loop-issue.test.mjs`). No mechanics/mobile/card-editor workspace files are
touched, so their workspace `verify` legs are out of scope for this change
(consistent with `close-trailers.yml`'s own PR-trigger path filter, which
only watches `scripts/loop-issue.mjs`, `scripts/loop-issue.test.mjs`, and
its own workflow file).

## DoD

- [ ] `deploy-comment` subcommand added to `scripts/loop-issue.mjs`,
      symmetrical in shape to `close-trailers` (pure sweep function +
      injectable `io` + thin `cmd*` wrapper), documented in the file's
      header comment block.
- [ ] `scripts/loop-issue.test.mjs` covers: body format, first-post,
      already-commented idempotency, dry-run, comment-API-failure (lands in
      `errors`, not silent), and a commit with no closing trailer touching
      nothing.
- [ ] `.github/workflows/deploy-comment.yml` created, triggers on the same
      three `verify-*` workflow names `deploy-check.mjs` gates on,
      re-verifies green via `deploy-check.mjs` before ever commenting.
- [ ] `.github/workflows/README.md` documents the new workflow.
- [ ] `skills/iterate.md` Step 7 and `skills/ship-a-phase.md` Step 12.5 each
      carry a one-line pointer to the new floor.
- [ ] `node --test scripts/loop-issue.test.mjs` green.
- [ ] Build-plan row ticked.

## Follow-ups (out of scope)

- The `march.yml` 75-minute job-ceiling question (Phase 92,
  already a separate row) is a different failure shape — a tick killed by
  its OWN job timeout mid-work, not a tick that finished cleanly while
  CI was still running elsewhere. This phase does not touch `march.yml`'s
  timeout.
- `plan/PHASE_CANDIDATES.md`'s sibling row "Reconcile shipped `[x]`
  build-plan rows against open `loop:phase` issues" (a periodic
  reconciliation sweep) is a related but distinct hardening idea, not
  folded into this phase.
- No attempt is made to backfill deploy-URL comments for commits that
  already leaked one before this phase shipped — the new workflow only
  observes `verify-*` completions from this point forward.
