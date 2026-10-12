# GitHub Actions — CI + the Claude automation layer

Two layers live here:

1. **CI and deterministic builds:** `verify-mechanics`, `verify-mobile`,
   `verify-drift`, `verify-prose`, `preview-build`, `build-devlog`,
   `check-lexicon`, `check-devlog-served`, `perf-audit`. Each package has one owning verify
   workflow: mechanics owns root dependency changes and runs the affected
   mobile consumer gate; mobile runs only for its own paths. Mobile verification installs once, exports once, and reuses that
   inspected export for the affected Hazard / Encounter / Combat
   journeys. Shared or unknown runtime changes fail closed to all journeys;
   Sunday/manual mobile runs are the unconditional full-suite backstop.
   `npm run deploy:check` polls the verify workflows.
2. **Claude automation:** every zero-input skill/command in the repo,
   runnable from the Actions tab and (where it makes sense) on a schedule.
   All of them funnel through the reusable runner
   [`_claude-skill.yml`](./_claude-skill.yml), which owns checkout, `npm
   ci`, `.env` materialization, the nexus enforcement layer (guard hooks +
   deny walls), and the `anthropics/claude-code-action` invocation. The
   runner defaults to **Sonnet 5** (`claude-sonnet-5`); `march.yml`,
   `iterate.yml`, and `claude.yml` (which doesn't use the runner) are
   pinned to **Opus 5.5** (`claude-opus-5-5`); `pr-autofix.yml` and
   `pr-resolve.yml` run on **Haiku 5.5** (`claude-haiku-5-5`). The runner
   also takes `allowed_tools` (override the grant), `pre_run` and
   `post_run` (shell around the Claude step; `pr-resolve` uses them).

**The loop lands code by PR (Phase R11, D84-D87).** A loop tick that
changes anything outside `plan/`, `telemetry/`, `docs/reports/` or
`devlog/entries/` opens a
PR labelled `loop:pr` from a `loop/<verb>-<slug>` branch; T merges it by
hand (no auto-merge). `pr-autofix` keeps it green, `pr-resolve` keeps it
mergeable, and the `verify-*` workflows run on the PR and again on the
merge push.

**Cost of the PR flow.** The repo is public, so GitHub-hosted standard
runners cost no minutes: the doubled `verify-*` runs (PR + merge push),
`pr-resolve`'s scan on every push to `main`, and `pr-autofix`'s gate job
are free. The paid part is Claude usage: one Haiku run per red check on a
loop PR (at most two per PR), and one Haiku run per conflict outside the
append-only files. The march cadence is unchanged. `/oversight` prints
the month's `pr-autofix` and `pr-resolve` run counts so this assumption
gets checked.

## Secrets

| Secret | Status | Purpose |
|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | **required** (configured) | Auth for every Claude workflow. |
| `GH_PAT` | **recommended** | A PAT (classic: `repo` + `workflow` scopes; or fine-grained: contents/issues/PRs read-write + actions read). Without it workflows fall back to the default `GITHUB_TOKEN`, and **pushes/PRs made by the skills will not trigger the `verify-*` workflows** — the deploy gate then **fails closed** (`deploy-check.mjs` exits 1 when a code tick has zero verify runs), tuning PRs get no CI, and `ci-autofix` never fires for loop pushes. Diagnose with `pat-probe.yml`. |
| `NOTIFY_NTFY_TOPIC` / `NOTIFY_WEBHOOK_URL` | optional | Pager channels for `scripts/notify.mjs` (failure-mode stops, `[needs-user-call]`s). |

## The workflows

| Workflow | Skill | Trigger | Notes |
|---|---|---|---|
| `build-devlog.yml` | deterministic `npm run site:build` | manual | Rebuilds the catalog + DevLog, uploads `devlog/` as an artifact, and commits changed generated files to `main`; no Claude invocation. |
| `check-lexicon.yml` | deterministic retired-term lint | weekly + manual | Active package verify jobs run this lint in their existing runner; the tracked pre-commit hook protects docs-only commits, and this workflow is the remote backstop. |
| `perf-audit.yml` | deterministic `npm run perf:audit` | weekly (Sunday 07:07 UTC) + manual | The weekly performance audit (phase PF1): web bundle and load, runtime smoothness on a scripted combat round, engine ms per combat; three runs, median kept. Appends `docs/reports/perf/history.jsonl` and files a `[perf]` row in `plan/AUDIT.md` (plus its issue) for each budget breach or week-over-week drift. Report-only: only a measurer crash fails it. Manual runs accept `seed_budgets` (writes `budgets.json`; seed on CI only). Shares the `nexus-loop` group so its commit never races a tick. No Claude invocation. |
| `close-trailers.yml` | deterministic `loop-issue.mjs close-trailers` | every push to `main` (+ PRs touching the script) | **The auto-close authority** (Phase 48). Sweeps *every* commit in the pushed range, parses the closing keywords out of the commit prose, and closes each referenced issue via the API, idempotently. GitHub's native `Closes #N` parser is inert in this repo, and the agent-driven `close-comment` step is gated behind a green `deploy:check` — so it is skipped whenever a loop turn ends while CI is still amber (this is what leaked #174 for 11 hours). Runs `scripts/loop-issue.test.mjs` as a gating witness first, so a parser regression turns `main` red instead of silently leaking issues. No Claude invocation. |
| `deploy-comment.yml` | deterministic `loop-issue.mjs deploy-comment` | `workflow_run: completed` on `verify-mechanics`/`verify-mobile` | **The deploy-URL-comment authority** (Phase 91) — the same floor `close-trailers.yml` is for the close, applied to the comment. The agent-driven `close-comment`/`phase-close` step posts the deploy comment only if the SAME tick's own `deploy:check` goes green before the tick's container dies; a tick that ends while CI is still amber skips it forever, with nothing in a later tick to resume it. This workflow instead fires on the gated verify-* workflows' own completion, re-checks green via `scripts/deploy-check.mjs` (checked out at that exact commit, short timeout), and posts the comment only once truly green — idempotent (SHA-scoped marker) and self-healing (a sibling workflow still pending re-fires this on its own completion). Never closes anything; `close-trailers.yml` already owns that. No Claude invocation. |
| `march.yml` | `/march` | 2-hour cron + manual | The autonomous-beast tick: triage → critique → PR cap → ship-a-phase → expand → iterate. Builds only briefed, unattended, unclaimed rows; content per surface (D88). Manual runs accept `focus_phase`; when set, the run dispatches `/ship-a-phase phase <focus_phase>` instead of normal `/march`. Code lands as a `loop:pr` PR; plan-only commits push `main`. |
| `night.yml` | `/digest` | every other day 08:47 UTC + manual | Morning briefing to `devlog/entries/DIGEST_<date>.md` + nightly breadth checks. |
| `consolidate.yml` | `/consolidate` | monthly (2nd, 07:23 UTC) + manual | Memory curator: compacts `plan/` durable memory (bearings, CRITIQUE archive, lessons/reflexes hygiene). Curation only — meaning never changes. Pushes to `main`. |
| `triage.yml` | `/triage` | manual only (per-issue `issues:` trigger removed 2026-08) | Manual pass on a specific issue; march's triage gate is the standing sweep. |
| `ci-autofix.yml` | `/fix-ci` | `verify-*` failure on `main` + manual | Red-main first responder. Pushes the fix to `main`. Its own job-level `ci-autofix` concurrency group (R0): skipped runs never queue, so they cannot displace a real one. |
| `pr-autofix.yml` | `/fix-ci <run> --branch <head>` (Haiku) | `verify-*` failure on a PR branch + manual | Keeps `loop:pr` PRs green (D87). A plain gate job first checks the PR is open, same-repo, labelled `loop:pr` and not `loop:pr-stuck`, and counts its attempt comments; the third red run labels it `loop:pr-stuck` instead of running. The fix job has a job-level `pr-autofix-<PR>` group. Never touches `main`, never force-pushes. |
| `pr-resolve.yml` | `scripts/pr-resolve.mjs`, then `/fix-ci --resolve` (Haiku, Read + Edit only) | every push to `main` + manual | Keeps `loop:pr` PRs mergeable (D87). Merges `main` into each conflicting same-repo `loop:pr` PR; conflicts only in telemetry shards or the plan queues settle by a union of rows (three-way counted, so an edited row is not doubled); anything else goes to a Haiku run between a scripted prepare and a finish that refuses a leftover marker. Job-level `pr-resolve` group. Push, never force. |
| `iterate.yml`, `critique.yml`, `expand.yml`, `ship-a-phase.yml`, `plan-a-phase.yml` | same-named | manual only | Direct dispatch = force one run. March dispatches these on its own, except `plan-a-phase`: since R11 only T runs it (by hand or this button), and the loop never writes a brief. `iterate.yml` pins Opus 5.5. |
| `claude.yml` | — | `@claude` mention in issues/PRs | Interactive responder. |

Skills that need a human in the loop (`/oversight`, `/jot`, `/plot`,
`/messy`) deliberately have no workflow; `scripts/loop-pr.test.mjs` fails
if a workflow ever fires `/plot` or `/messy`.

## Operating notes

- **Concurrency:** the loop verbs share the `nexus-loop` concurrency
  group, so ticks queue instead of colliding (GitHub keeps at most one run
  pending per group — a queued tick can be superseded, which is fine for a
  loop). `ci-autofix`, `pr-autofix` and `pr-resolve` are the exceptions:
  they fire on events, so each uses its own job-level group (`pr-autofix`
  one per PR) and only a run that passed its `if` ever queues.
- **Stranded telemetry rows** are pushed to the branch the run ended on
  (`main` or the tick's `loop/*` PR branch), never across branches. Tuning/playtest loops run on
  their own branches and get per-workflow groups.
- **Cadence:** scheduled runs consume Claude subscription usage. To
  throttle, edit or delete the `cron:` block in the relevant workflow —
  everything stays manually dispatchable.
- **Activation:** schedules, `workflow_run`, and the dispatch button only
  work once these files are on the default branch (i.e. after this PR
  merges).
- **Enforcement:** `.claude/settings.json` is committed and always
  active (guard hooks, deny walls for force-push / `--no-verify` /
  destructive resets); each run self-tests the guard before Claude
  starts so a broken guard fails the job rather than running unguarded.
